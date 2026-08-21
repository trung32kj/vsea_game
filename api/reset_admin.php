<?php
/**
 * RESET ADMIN PASSWORD
 * Truy cập 1 lần: https://mik.azdigi.shop/api/reset_admin.php
 * XÓA FILE NÀY sau khi chạy!
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'nkkoadrf_vsea_game');
define('DB_PASS', 'vsea_game');
define('DB_NAME', 'nkkoadrf_vsea_game');

header("Content-Type: text/html; charset=UTF-8");

$db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
if ($db->connect_error) {
    die("❌ Kết nối thất bại: " . $db->connect_error);
}

$username = 'admin';
$password = 'admin123';
$hash     = password_hash($password, PASSWORD_BCRYPT);
$now      = (new DateTime('now', new DateTimeZone('Asia/Ho_Chi_Minh')))->format('H:i:s d/m/Y');

// Xóa admin cũ và tạo lại
$db->query("DELETE FROM admins WHERE username='admin'");
$stmt = $db->prepare("INSERT INTO admins (username, password_hash, created_at) VALUES (?, ?, ?)");
$stmt->bind_param('sss', $username, $hash, $now);

if ($stmt->execute()) {
    echo "<h2 style='color:green'>✅ Reset thành công!</h2>";
    echo "<p>Tài khoản: <strong>admin</strong></p>";
    echo "<p>Mật khẩu: <strong>admin123</strong></p>";
    echo "<p style='color:red;font-weight:bold'>⚠️ Hãy XÓA file reset_admin.php ngay!</p>";
    echo "<p><a href='/admin.html'>→ Vào Admin Panel</a></p>";
} else {
    echo "<h2 style='color:red'>❌ Lỗi: " . $stmt->error . "</h2>";
}
$db->close();
