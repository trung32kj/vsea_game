<?php
require_once __DIR__ . '/config.php';

$method = $_SERVER['REQUEST_METHOD'];
$action = $_GET['action'] ?? '';

// GET /api/game.php?action=status
if ($method === 'GET' && $action === 'status') {
    $db  = getDB();
    $res = $db->query("SELECT value FROM game_settings WHERE `key`='game_active'");
    $row = $res->fetch_assoc();
    jsonOut(['active' => ($row['value'] ?? '0') === '1']);
}

// GET /api/game.php?action=gifts_public
if ($method === 'GET' && $action === 'gifts_public') {
    $db  = getDB();
    $res = $db->query("SELECT id, name, probability FROM gifts WHERE quantity > 0 ORDER BY id");
    $gifts = [];
    while ($row = $res->fetch_assoc()) {
        $gifts[] = [
            'id'          => (int)$row['id'],
            'name'        => $row['name'],
            'probability' => (float)$row['probability'],
        ];
    }
    jsonOut(['success' => true, 'gifts' => $gifts]);
}

// POST /api/game.php?action=register
if ($method === 'POST' && $action === 'register') {
    $body      = getBody();
    $fullName  = trim($body['fullName']  ?? '');
    $email     = trim($body['email']     ?? '');
    $phone     = trim($body['phone']     ?? '');
    $className = trim($body['className'] ?? '');

    if (!$fullName || !$email || !$phone || !$className) {
        jsonOut(['success' => false, 'message' => 'Vui lòng điền đầy đủ thông tin'], 400);
    }

    $db  = getDB();
    $now = nowVN();
    $stmt = $db->prepare(
        "INSERT INTO players (full_name, email, phone, class_name, created_at) VALUES (?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('sssss', $fullName, $email, $phone, $className, $now);

    if (!$stmt->execute()) {
        jsonOut(['success' => false, 'message' => 'Lỗi lưu dữ liệu'], 500);
    }
    $playerId = $db->insert_id;

    // Lấy trạng thái game
    $res = $db->query("SELECT value FROM game_settings WHERE `key`='game_active'");
    $row = $res->fetch_assoc();
    $gameActive = ($row['value'] ?? '0') === '1';

    jsonOut(['success' => true, 'playerId' => $playerId, 'gameActive' => $gameActive]);
}

// POST /api/game.php?action=result
if ($method === 'POST' && $action === 'result') {
    $body           = getBody();
    $playerId       = (int)($body['playerId']       ?? 0);
    $score          = (int)($body['score']          ?? 0);
    $timeUsed       = (int)($body['timeUsed']       ?? 0);
    $roundsCompleted = (int)($body['roundsCompleted'] ?? 0);

    if (!$playerId) {
        jsonOut(['success' => false, 'message' => 'Missing playerId'], 400);
    }

    $db = getDB();

    // Lấy danh sách quà còn hàng
    $res = $db->query("SELECT id, name, probability FROM gifts WHERE quantity > 0");
    $available = [];
    while ($row = $res->fetch_assoc()) {
        $available[] = $row;
    }

    $wonGift  = false;
    $giftId   = null;
    $giftName = 'Chúc mừng bạn đã tham gia!';

    if (!empty($available)) {
        $roll = mt_rand(0, 9999) / 100; // 0.00 – 99.99
        $cum  = 0;
        foreach ($available as $g) {
            $cum += (float)$g['probability'];
            if ($roll < $cum) {
                // Trúng quà này
                $giftId   = (int)$g['id'];
                $giftName = $g['name'];
                $wonGift  = true;
                // Giảm số lượng 1
                $upd = $db->prepare("UPDATE gifts SET quantity = GREATEST(0, quantity-1) WHERE id=?");
                $upd->bind_param('i', $giftId);
                $upd->execute();
                break;
            }
        }
    }

    $now  = nowVN();
    $stmt = $db->prepare(
        "INSERT INTO results (player_id, score, time_used, rounds_completed, gift_id, gift_name, played_at)
         VALUES (?, ?, ?, ?, ?, ?, ?)"
    );
    $stmt->bind_param('iiiiiss', $playerId, $score, $timeUsed, $roundsCompleted, $giftId, $giftName, $now);

    if (!$stmt->execute()) {
        jsonOut(['success' => false, 'message' => 'Lỗi lưu kết quả'], 500);
    }
    $resultId = $db->insert_id;

    jsonOut(['success' => true, 'resultId' => $resultId, 'wonGift' => $wonGift, 'giftName' => $giftName]);
}

jsonOut(['success' => false, 'message' => 'Unknown action'], 404);
