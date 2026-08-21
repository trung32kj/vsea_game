<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// ── KIỂM TRA ĐĂNG NHẬP ───────────────────────────────────────────
function requireAdmin(): void {
    if (empty($_SESSION['is_admin'])) {
        jsonOut(['success' => false, 'message' => 'Unauthorized'], 401);
    }
}

// ── CHECK SESSION ─────────────────────────────────────────────────
if ($method === 'GET' && $action === 'check') {
    jsonOut(['isAdmin' => !empty($_SESSION['is_admin'])]);
}

// ── LOGIN ──────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'login') {
    $body     = getBody();
    $username = trim($body['username'] ?? '');
    $password = $body['password'] ?? '';

    $db   = getDB();
    $stmt = $db->prepare("SELECT id, password_hash FROM admins WHERE username=? LIMIT 1");
    $stmt->bind_param('s', $username);
    $stmt->execute();
    $row = $stmt->get_result()->fetch_assoc();

    if (!$row || !password_verify($password, $row['password_hash'])) {
        jsonOut(['success' => false, 'message' => 'Sai tên đăng nhập hoặc mật khẩu'], 401);
    }
    $_SESSION['is_admin'] = true;
    $_SESSION['admin_id'] = $row['id'];
    jsonOut(['success' => true]);
}

// ── LOGOUT ────────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'logout') {
    session_destroy();
    jsonOut(['success' => true]);
}

// ── START GAME ────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'start_game') {
    requireAdmin();
    $db = getDB();
    // Reset số lượng quà
    $db->query("UPDATE gifts SET quantity = original_quantity");
    // Mở game
    $db->query("UPDATE game_settings SET value='1' WHERE `key`='game_active'");
    jsonOut(['success' => true, 'message' => 'Game đã được mở. Quà đã reset.']);
}

// ── STOP GAME ─────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'stop_game') {
    requireAdmin();
    $db = getDB();
    $db->query("UPDATE game_settings SET value='0' WHERE `key`='game_active'");
    jsonOut(['success' => true, 'message' => 'Game đã đóng.']);
}

// ── STATS ─────────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'stats') {
    requireAdmin();
    $db = getDB();

    $totalPlayers = $db->query("SELECT COUNT(*) AS c FROM players")->fetch_assoc()['c'];
    $totalResults = $db->query("SELECT COUNT(*) AS c FROM results")->fetch_assoc()['c'];
    $giftsGiven   = $db->query("SELECT COUNT(*) AS c FROM results WHERE gift_id IS NOT NULL")->fetch_assoc()['c'];
    $gameActive   = $db->query("SELECT value FROM game_settings WHERE `key`='game_active'")->fetch_assoc()['value'] === '1';

    $res   = $db->query("SELECT name, original_quantity, quantity FROM gifts ORDER BY id");
    $gifts = [];
    while ($row = $res->fetch_assoc()) {
        $gifts[] = [
            'name'              => $row['name'],
            'original_quantity' => (int)$row['original_quantity'],
            'quantity'          => (int)$row['quantity'],
        ];
    }

    jsonOut([
        'success'      => true,
        'totalPlayers' => (int)$totalPlayers,
        'totalResults' => (int)$totalResults,
        'giftsGiven'   => (int)$giftsGiven,
        'gameActive'   => $gameActive,
        'gifts'        => $gifts,
    ]);
}

// ── GET PLAYERS ───────────────────────────────────────────────────
if ($method === 'GET' && $action === 'players') {
    requireAdmin();
    $db  = getDB();
    $res = $db->query(
        "SELECT p.*, r.score, r.time_used, r.rounds_completed, r.gift_id, r.gift_name, r.played_at
         FROM players p
         LEFT JOIN results r ON r.player_id = p.id
         ORDER BY p.id DESC"
    );
    $players = [];
    while ($row = $res->fetch_assoc()) {
        $players[] = [
            'id'               => (int)$row['id'],
            'full_name'        => $row['full_name'],
            'email'            => $row['email'],
            'phone'            => $row['phone'],
            'class_name'       => $row['class_name'],
            'created_at'       => $row['created_at'],
            'score'            => $row['score'] !== null ? (int)$row['score'] : null,
            'time_used'        => $row['time_used'] !== null ? (int)$row['time_used'] : null,
            'rounds_completed' => $row['rounds_completed'] !== null ? (int)$row['rounds_completed'] : null,
            'gift_id'          => $row['gift_id'] ? (int)$row['gift_id'] : null,
            'gift_name'        => $row['gift_name'],
        ];
    }
    jsonOut(['success' => true, 'players' => $players]);
}

// ── DELETE PLAYER ─────────────────────────────────────────────────
if (($method === 'DELETE' || $method === 'POST') && $action === 'delete_player') {
    requireAdmin();
    $body = getBody();
    $id   = (int)($_GET['id'] ?? $body['id'] ?? 0);
    if (!$id) jsonOut(['success' => false, 'message' => 'Missing id'], 400);
    $db   = getDB();
    $stmt = $db->prepare("DELETE FROM players WHERE id=?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    jsonOut(['success' => true, 'affected' => $db->affected_rows]);
}

// ── GET GIFTS ─────────────────────────────────────────────────────
if ($method === 'GET' && $action === 'gifts') {
    requireAdmin();
    $db  = getDB();
    $res = $db->query("SELECT * FROM gifts ORDER BY id");
    $gifts = [];
    while ($row = $res->fetch_assoc()) {
        $gifts[] = [
            'id'                => (int)$row['id'],
            'name'              => $row['name'],
            'quantity'          => (int)$row['quantity'],
            'original_quantity' => (int)$row['original_quantity'],
            'probability'       => (float)$row['probability'],
        ];
    }
    jsonOut(['success' => true, 'gifts' => $gifts]);
}

// ── ADD GIFT ──────────────────────────────────────────────────────
if ($method === 'POST' && $action === 'add_gift') {
    requireAdmin();
    $body  = getBody();
    $name  = trim($body['name']        ?? '');
    $qty   = (int)($body['quantity']   ?? 0);
    $prob  = (float)($body['probability'] ?? 0);
    $now   = nowVN();

    if (!$name) jsonOut(['success' => false, 'message' => 'Thiếu tên quà'], 400);

    $db   = getDB();
    $stmt = $db->prepare(
        "INSERT INTO gifts (name, quantity, original_quantity, probability, created_at) VALUES (?,?,?,?,?)"
    );
    $stmt->bind_param('siiis', $name, $qty, $qty, $prob, $now);
    $stmt->execute();
    jsonOut(['success' => true, 'id' => $db->insert_id]);
}

// ── UPDATE GIFT ───────────────────────────────────────────────────
if (($method === 'PUT' || $method === 'POST') && $action === 'update_gift') {
    requireAdmin();
    $id   = (int)($_GET['id'] ?? 0);
    $body = getBody();
    $name = trim($body['name']           ?? '');
    $qty  = (int)($body['quantity']      ?? 0);
    $prob = (float)($body['probability'] ?? 0);

    $db   = getDB();
    $stmt = $db->prepare("UPDATE gifts SET name=?, quantity=?, probability=? WHERE id=?");
    $stmt->bind_param('sddi', $name, $qty, $prob, $id);   // note: qty is int
    // Fix: use correct types
    $stmt = $db->prepare("UPDATE gifts SET name=?, quantity=?, probability=? WHERE id=?");
    $stmt->bind_param('sidi', $name, $qty, $prob, $id);
    $stmt->execute();
    jsonOut(['success' => true]);
}

// ── DELETE GIFT ───────────────────────────────────────────────────
if (($method === 'DELETE' || $method === 'POST') && $action === 'delete_gift') {
    requireAdmin();
    // Nhận id từ query string hoặc body
    $body = getBody();
    $id   = (int)($_GET['id'] ?? $body['id'] ?? 0);
    if (!$id) jsonOut(['success' => false, 'message' => 'Missing id'], 400);
    $db   = getDB();
    $stmt = $db->prepare("DELETE FROM gifts WHERE id=?");
    $stmt->bind_param('i', $id);
    $stmt->execute();
    jsonOut(['success' => true, 'affected' => $db->affected_rows]);
}

// ── RESET GIFT QUANTITIES ─────────────────────────────────────────
if ($method === 'POST' && $action === 'reset_gifts') {
    requireAdmin();
    $db = getDB();
    $db->query("UPDATE gifts SET quantity = original_quantity");
    jsonOut(['success' => true]);
}

jsonOut(['success' => false, 'message' => 'Unknown action'], 404);
