<?php
session_start();
header('Content-Type: application/json');

if (isset($_SESSION['user_id'])) {
    echo json_encode([
        'logged_in' => true,
        'user' => [
            'id' => $_SESSION['user_id'],
            'username' => $_SESSION['username'],
            'name' => $_SESSION['full_name'],
            'phone_number' => $_SESSION['phone_number'] ?? '',
            'address' => $_SESSION['address'] ?? ''
        ]
    ]);
} else {
    echo json_encode(['logged_in' => false]);
}
?>
