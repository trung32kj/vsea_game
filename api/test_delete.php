<?php
require_once __DIR__ . '/config.php';

// Test xóa gift id=8 (quà "dew")
$db = getDB();
$id = isset($_GET['id']) ? (int)$_GET['id'] : 8;

$stmt = $db->prepare("DELETE FROM gifts WHERE id=?");
$stmt->bind_param('i', $id);
$result = $stmt->execute();

echo json_encode([
    'success'       => $result,
    'affected_rows' => $db->affected_rows,
    'error'         => $stmt->error,
    'id_tested'     => $id,
    'method'        => $_SERVER['REQUEST_METHOD'],
]);
