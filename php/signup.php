<?php
header('Content-Type: application/json');
require_once 'db_config.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $full_name = $_POST['name'] ?? ''; // From form
    $email = $_POST['email'] ?? '';
    $password = $_POST['password'] ?? '';
    $username = $_POST['username'] ?? ''; // Required by user's schema
    $phone_number = $_POST['phone_number'] ?? '';
    $address = $_POST['address'] ?? '';

    // Validation
    if (empty($full_name) || empty($email) || empty($password) || empty($username) || empty($phone_number) || empty($address)) {
        echo json_encode(['success' => false, 'message' => 'Please fill all fields including Phone and Address.']);
        exit;
    }

    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(['success' => false, 'message' => 'Invalid email format.']);
        exit;
    }

    try {
        // Check for existing user
        $stmt = $pdo->prepare("SELECT id FROM users WHERE username = ? OR email = ?");
        $stmt->execute([$username, $email]);
        if ($stmt->fetch()) {
            echo json_encode(['success' => false, 'message' => 'Username or Email already exists.']);
            exit;
        }

        // Securely hash password
        $hashed_password = password_hash($password, PASSWORD_DEFAULT);

        // Insert user - using full_name instead of name to match user's new schema
        $stmt = $pdo->prepare("INSERT INTO users (username, email, password, full_name, phone_number, address) VALUES (?, ?, ?, ?, ?, ?)");
        if ($stmt->execute([$username, $email, $hashed_password, $full_name, $phone_number, $address])) {
            echo json_encode(['success' => true, 'message' => 'Registration successful! Please login.']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Registration failed.']);
        }
    } catch (PDOException $e) {
        echo json_encode(['success' => false, 'message' => 'Database error: ' . $e->getMessage()]);
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
}
?>
