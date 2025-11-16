<?php
header('Content-Type: application/json');
session_start();

// Include database config
include 'config.php';

// Get POST data
$user_id = $_POST['user_id'] ?? '';
$current_password = $_POST['current_password'] ?? '';
$new_password = $_POST['new_password'] ?? '';

// Validation
if (empty($user_id) || empty($current_password) || empty($new_password)) {
    echo json_encode([
        'success' => false,
        'message' => 'All fields are required.'
    ]);
    exit;
}

// Validate new password length
if (strlen($new_password) < 8) {
    echo json_encode([
        'success' => false,
        'message' => 'New password must be at least 8 characters long.'
    ]);
    exit;
}

// Verify user exists and get current password hash
$stmt = $conn->prepare("SELECT password_hash FROM charging_provider WHERE id = ?");
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'User not found.'
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$user = $result->fetch_assoc();
$stmt->close();

// Verify current password
if (!password_verify($current_password, $user['password_hash'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Current password is incorrect.'
    ]);
    $conn->close();
    exit;
}

// Check if new password is same as current password
if (password_verify($new_password, $user['password_hash'])) {
    echo json_encode([
        'success' => false,
        'message' => 'New password must be different from current password.'
    ]);
    $conn->close();
    exit;
}

// Hash new password
$new_password_hash = password_hash($new_password, PASSWORD_DEFAULT);

// Update password in database
$update_stmt = $conn->prepare("UPDATE charging_provider SET password_hash = ? WHERE id = ?");
$update_stmt->bind_param("si", $new_password_hash, $user_id);

if ($update_stmt->execute()) {
    echo json_encode([
        'success' => true,
        'message' => 'Password changed successfully!'
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update password. Please try again.'
    ]);
}

$update_stmt->close();
$conn->close();
?>