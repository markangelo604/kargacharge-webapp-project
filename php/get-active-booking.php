<?php
header('Content-Type: application/json');
require_once 'config.php';

$user_id = $_GET['user_id'] ?? '';

if (empty($user_id)) {
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit;
}

// Get the active booking for this user (Confirmed or Completed status)
$sql = "SELECT book_id FROM booking 
        WHERE evown_id = ? 
        AND status IN ('Confirmed', 'Completed', 'Transaction Completed')
        ORDER BY time_in DESC 
        LIMIT 1";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $user_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $booking = $result->fetch_assoc();
    echo json_encode([
        'success' => true,
        'booking_id' => $booking['book_id']
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'No active booking found'
    ]);
}

$stmt->close();
$conn->close();
?>
