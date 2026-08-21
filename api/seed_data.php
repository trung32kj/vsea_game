<?php
/**
 * SEED DATA MẪU
 * Truy cập: https://mik.azdigi.shop/api/seed_data.php
 * XÓA FILE NÀY sau khi chạy!
 */
require_once __DIR__ . '/config.php';
header("Content-Type: text/html; charset=UTF-8");

$db  = getDB();
$now = nowVN();

echo "<h2>🌱 Seed dữ liệu mẫu</h2><ul>";

// ── 1. Thêm player mẫu ───────────────────────────────────────────
$players = [
    ['Nguyễn Văn An',   'an.nguyen@gmail.com',    '0901234567', 'KT47A'],
    ['Trần Thị Bình',   'binh.tran@gmail.com',    '0912345678', 'KT47B'],
    ['Lê Hoàng Nam',    'nam.le@gmail.com',        '0923456789', 'KT48A'],
    ['Phạm Thu Hà',     'ha.pham@gmail.com',       '0934567890', 'KT48B'],
    ['Võ Minh Tuấn',    'tuan.vo@gmail.com',       '0945678901', 'KT49A'],
];

$stmtP = $db->prepare("INSERT INTO players (full_name, email, phone, class_name, created_at) VALUES (?,?,?,?,?)");
$playerIds = [];
foreach ($players as [$name, $email, $phone, $class]) {
    $stmtP->bind_param('sssss', $name, $email, $phone, $class, $now);
    $stmtP->execute();
    $playerIds[] = $db->insert_id;
    echo "<li>✅ Player: <strong>$name</strong></li>";
}

// ── 2. Thêm kết quả mẫu ─────────────────────────────────────────
$resultsData = [
    [$playerIds[0], 570, 180, 5, 3, 'Sticker VSEATeam'],   // trúng quà id=3
    [$playerIds[1], 445, 250, 4, null, 'Chúc mừng bạn đã tham gia!'],
    [$playerIds[2], 620, 150, 5, 2, 'Voucher 50k'],
    [$playerIds[3], 310, 300, 3, null, 'Chúc mừng bạn đã tham gia!'],
    [$playerIds[4], 550, 200, 5, 4, 'Bookmark xinh'],
];

$stmtR = $db->prepare(
    "INSERT INTO results (player_id, score, time_used, rounds_completed, gift_id, gift_name, played_at) VALUES (?,?,?,?,?,?,?)"
);

foreach ($resultsData as [$pid, $score, $time, $rounds, $giftId, $giftName]) {
    $stmtR->bind_param('iiiiiss', $pid, $score, $time, $rounds, $giftId, $giftName, $now);
    $stmtR->execute();
    // Giảm số lượng quà nếu trúng
    if ($giftId) {
        $db->query("UPDATE gifts SET quantity = GREATEST(0, quantity-1) WHERE id=$giftId");
    }
    echo "<li>✅ Result: player_id=$pid, score=$score, quà=$giftName</li>";
}

echo "</ul>";
echo "<hr>";
echo "<h3 style='color:green'>✅ Seed xong! Vào <a href='/admin.html'>Admin Panel</a> để kiểm tra.</h3>";
echo "<p style='color:red;font-weight:bold'>⚠️ XÓA file seed_data.php ngay!</p>";

$db->close();
