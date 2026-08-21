<?php
require_once __DIR__ . '/config.php';

// Debug: kiểm tra session + thử xóa gift
$giftId = (int)($_GET['id'] ?? 0);

$out = [
    'session'    => $_SESSION ?? [],
    'is_admin'   => !empty($_SESSION['is_admin']),
    'method'     => $_SERVER['REQUEST_METHOD'],
    'action'     => $_GET['action'] ?? '',
    'gift_id'    => $giftId,
];

if ($giftId && !empty($_SESSION['is_admin'])) {
    $db   = getDB();
    $stmt = $db->prepare("DELETE FROM gifts WHERE id=?");
    $stmt->bind_param('i', $giftId);
    $stmt->execute();
    $out['delete_result']   = $stmt->error ?: 'OK';
    $out['affected_rows']   = $db->affected_rows;
}

jsonOut($out);
