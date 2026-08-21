<?php
/**
 * FIX GIFTS - Xóa quà lỗi encoding + reset data sạch
 * Truy cập: https://mik.azdigi.shop/api/fix_gifts.php
 * XÓA FILE NÀY sau khi chạy!
 */
require_once __DIR__ . '/config.php';
header("Content-Type: text/html; charset=UTF-8");

$db = getDB();

// Xóa tất cả quà cũ (kể cả lỗi encoding)
$db->query("DELETE FROM gifts");
$db->query("ALTER TABLE gifts AUTO_INCREMENT = 1");

// Seed lại quà sạch
$now = nowVN();
$gifts = [
    ['Phần quà đặc biệt', 5,   5,   5.00],
    ['Voucher 50k',        10,  10,  10.00],
    ['Sticker VSEATeam',   50,  50,  20.00],
    ['Bookmark xinh',      30,  30,  15.00],
    ['Kẹo ngọt',           100, 100, 20.00],
];

$stmt = $db->prepare(
    "INSERT INTO gifts (name, quantity, original_quantity, probability, created_at) VALUES (?,?,?,?,?)"
);

echo "<h2>🔧 Fix Gifts</h2><ul>";
foreach ($gifts as [$name, $qty, $oqty, $prob]) {
    $stmt->bind_param('siiis', $name, $qty, $oqty, $prob, $now);
    if ($stmt->execute()) {
        echo "<li>✅ Đã thêm: <strong>$name</strong></li>";
    } else {
        echo "<li>❌ Lỗi: " . $stmt->error . "</li>";
    }
}

echo "</ul>";
echo "<h3 style='color:green'>✅ Xong! Tổng tỷ lệ: 70% (còn 30% = không trúng)</h3>";
echo "<p style='color:red;font-weight:bold'>⚠️ XÓA file fix_gifts.php ngay!</p>";
echo "<p><a href='/admin.html'>→ Vào Admin Panel kiểm tra</a></p>";

$db->close();
