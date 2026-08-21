<?php
/**
 * INSTALL.PHP — Chạy 1 lần để tạo database và bảng
 * Truy cập: http://localhost/vsea_game/api/install.php
 * XÓA FILE NÀY sau khi chạy xong!
 */

define('DB_HOST', 'localhost');
define('DB_USER', 'root');
define('DB_PASS', '');
define('DB_PORT', 3306);

header("Content-Type: text/html; charset=UTF-8");

$db = new mysqli(DB_HOST, DB_USER, DB_PASS, '', DB_PORT);
if ($db->connect_error) {
    die("❌ Kết nối thất bại: " . $db->connect_error);
}

$sqls = [
    "CREATE DATABASE IF NOT EXISTS vsea_game CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci",
    "USE vsea_game",

    "CREATE TABLE IF NOT EXISTS admins (
        id INT AUTO_INCREMENT PRIMARY KEY,
        username VARCHAR(50) NOT NULL UNIQUE,
        password_hash VARCHAR(255) NOT NULL,
        created_at VARCHAR(30)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

    "CREATE TABLE IF NOT EXISTS game_settings (
        id INT AUTO_INCREMENT PRIMARY KEY,
        `key` VARCHAR(50) NOT NULL UNIQUE,
        value TEXT NOT NULL
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

    "CREATE TABLE IF NOT EXISTS players (
        id INT AUTO_INCREMENT PRIMARY KEY,
        full_name VARCHAR(100) NOT NULL,
        email VARCHAR(100) NOT NULL,
        phone VARCHAR(20) NOT NULL,
        class_name VARCHAR(50) NOT NULL,
        created_at VARCHAR(30)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

    "CREATE TABLE IF NOT EXISTS gifts (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        quantity INT NOT NULL DEFAULT 0,
        original_quantity INT NOT NULL DEFAULT 0,
        probability DECIMAL(5,2) NOT NULL DEFAULT 0,
        created_at VARCHAR(30)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",

    "CREATE TABLE IF NOT EXISTS results (
        id INT AUTO_INCREMENT PRIMARY KEY,
        player_id INT NOT NULL,
        score INT DEFAULT 0,
        time_used INT DEFAULT 0,
        rounds_completed INT DEFAULT 0,
        gift_id INT DEFAULT NULL,
        gift_name VARCHAR(100) DEFAULT NULL,
        played_at VARCHAR(30),
        FOREIGN KEY (player_id) REFERENCES players(id) ON DELETE CASCADE
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
];

echo "<h2>🚀 Cài đặt VSEATeam Game DB</h2><ul>";
foreach ($sqls as $sql) {
    if ($db->query($sql)) {
        echo "<li>✅ OK: " . htmlspecialchars(substr($sql, 0, 60)) . "...</li>";
    } else {
        echo "<li>❌ Lỗi: " . $db->error . " | SQL: " . htmlspecialchars(substr($sql, 0, 80)) . "</li>";
    }
}

// Seed admin (password: admin123)
$hash = password_hash('admin123', PASSWORD_BCRYPT);
$now  = (new DateTime('now', new DateTimeZone('Asia/Ho_Chi_Minh')))->format('H:i:s d/m/Y');
$db->query("INSERT IGNORE INTO admins (username, password_hash, created_at)
            VALUES ('admin', '$hash', '$now')");
echo "<li>✅ Tài khoản admin: <b>admin / admin123</b></li>";

// Seed game_settings
$db->query("INSERT IGNORE INTO game_settings (`key`, value) VALUES ('game_active', '0')");
echo "<li>✅ game_settings khởi tạo</li>";

// Seed gifts
$gifts = [
    ['Phần quà đặc biệt', 5,   5,  5.00],
    ['Voucher 50k',       10,  10, 10.00],
    ['Sticker VSEATeam',  50,  50, 20.00],
    ['Bookmark xinh',     30,  30, 15.00],
    ['Kẹo ngọt',          100, 100, 20.00],
];
foreach ($gifts as [$name, $qty, $oqty, $prob]) {
    $db->query("INSERT IGNORE INTO gifts (name, quantity, original_quantity, probability, created_at)
                SELECT '$name', $qty, $oqty, $prob, '$now'
                WHERE NOT EXISTS (SELECT 1 FROM gifts WHERE name='$name')");
}
echo "<li>✅ Quà tặng mặc định đã seed</li>";

echo "</ul><h3 style='color:green'>✅ Hoàn tất! Hãy XÓA file install.php này ngay.</h3>";
$db->close();
