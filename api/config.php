<?php
// ── CẤU HÌNH DATABASE MYSQL (AZDIGI) ─────────────────────────────
define('DB_HOST', 'localhost');
define('DB_USER', 'nkkoadrf_vsea_game');
define('DB_PASS', 'vsea_game');
define('DB_NAME', 'nkkoadrf_vsea_game');
define('DB_PORT', 3306);

// ── CORS: cho phép GitHub Pages gọi API ──────────────────────────
$allowed_origins = [
    'https://trung32kj.github.io',
    'https://alprotrle.xyz',
    'https://www.alprotrle.xyz',
    'http://localhost',
    'http://127.0.0.1',
    'null'
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
