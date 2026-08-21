<?php
// ── CẤU HÌNH DATABASE MYSQL ───────────────────────────────────────
// Hostinger: vào hPanel → Databases → MySQL → lấy thông tin bên dưới
define('DB_HOST', 'localhost');          // Hostinger thường là 'localhost'
define('DB_USER', 'u123456_vsea');      // ← ĐỔI thành DB username của bạn
define('DB_PASS', 'YOUR_DB_PASSWORD');  // ← ĐỔI thành DB password của bạn
define('DB_NAME', 'u123456_vsea_game'); // ← ĐỔI thành DB name của bạn
define('DB_PORT', 3306);

// ── CORS: cho phép domain của bạn gọi API ────────────────────────
$allowed_origins = [
    'https://alprotrle.xyz',
    'https://www.alprotrle.xyz',
    'https://trung32kj.github.io',
    'http://localhost',
    'http://127.0.0.1',
];

$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
if (in_array($origin, $allowed_origins)) {
    header("Access-Control-Allow-Origin: $origin");
} else {
    header("Access-Control-Allow-Origin: *");
}
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true");
header("Content-Type: application/json; charset=UTF-8");

// Xử lý preflight OPTIONS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

// ── KẾT NỐI DATABASE ─────────────────────────────────────────────
function getDB(): mysqli {
    static $db = null;
    if ($db === null) {
        $db = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME, DB_PORT);
        if ($db->connect_error) {
            http_response_code(500);
            echo json_encode(['success' => false, 'message' => 'Lỗi kết nối database: ' . $db->connect_error]);
            exit;
        }
        $db->set_charset('utf8mb4');
    }
    return $db;
}

// ── HELPER ────────────────────────────────────────────────────────
function jsonOut(array $data, int $code = 200): void {
    http_response_code($code);
    echo json_encode($data, JSON_UNESCAPED_UNICODE);
    exit;
}

function getBody(): array {
    $raw = file_get_contents('php://input');
    return json_decode($raw, true) ?? [];
}

function nowVN(): string {
    $tz = new DateTimeZone('Asia/Ho_Chi_Minh');
    return (new DateTime('now', $tz))->format('H:i:s d/m/Y');
}

// Session cho admin
session_start();
