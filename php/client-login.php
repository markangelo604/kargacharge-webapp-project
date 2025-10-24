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
        'message' => 'Email and password are required.'
    ]);
    exit;
}

// Query specifically for client/EV owner users
$stmt = $conn->prepare("SELECT id, password_hash, name FROM ev_owner WHERE email = ?");
$stmt->bind_param("s", $email);   
$stmt->execute();
$result = $stmt->get_result();

if($result->num_rows > 0){
    $user = $result->fetch_assoc();
    if(password_verify($password, $user['password_hash'])){
        $_SESSION['user_id'] = $user['id'];
        $_SESSION['user_name'] = $user['name'];

        echo json_encode([
            'success' => true,
            'message' => 'Login successful',
            'user' => [
                'name' => $user['name'],
                'user_id' => $user['id']
            ]
        ]);
    } else {
        echo json_encode([
            'success' => false, 
            'message' => 'Incorrect password'
        ]);
    }
} else {
    echo json_encode([
        'success' => false, 
        'message' => 'EV Owner account not found. Please check your credentials or sign up.'
    ]);
}

$stmt->close();
$conn->close();
?>