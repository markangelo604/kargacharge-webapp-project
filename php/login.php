<?php
header('Content-Type: application/json');
session_start();

// Include database config
include 'config.php';

$email = $_POST['email'] ?? '';
$password = $_POST['password'] ?? '';

if (empty($email) || empty($password)) {
    echo json_encode([
        'success' => false,
        'message' => 'Username and password are required.'
    ]);
    exit;
}

$stmt = $conn->prepare("SELECT id, password_hash FROM users WHERE username = ?");
$stmt->bind_param("s", $email);   
$stmt->execute();
$result = $stmt->get_result();

if($result->num_rows > 0){
    $user = $result -> fetch_assoc();
    if(password_verify($password, $user('password'))){
        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'name' => $user['name'],
                'role' => $user['userType']
            ]
        ]);
    } else {
        echo json_encode(['success' => false, 'message' => 'Incorrect Password']);
    }
} else {
    echo json_encode('success' => false, 'message' => 'User not found');
}

$stmt->close();
$conn->close();
?>