<?php
header('Content-Type: application/json');
require_once 'config.php';

$user_id = $_GET['user_id'] ?? '';

if (empty($user_id)) {
    echo json_encode(['success' => false, 'message' => 'User ID is required']);
    exit;
}

// Get the active booking for this user (only Confirmed status)
// Completed bookings that have been reviewed should not be accessible
$sql = "SELECT b.book_id 
        FROM booking b
        LEFT JOIN reviews r ON r.pay_id = (SELECT pay_id FROM payment WHERE book_id = b.book_id)
        WHERE b.evown_id = ? 
        AND b.status = 'Confirmed'
        ORDER BY b.time_in DESC 
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
    // Check if there's a Completed booking without review (edge case)
    $sql2 = "SELECT b.book_id 
             FROM booking b
             LEFT JOIN payment p ON p.book_id = b.book_id
             LEFT JOIN reviews r ON r.pay_id = p.pay_id
             WHERE b.evown_id = ? 
             AND b.status = 'Completed'
             AND r.review_id IS NULL
             ORDER BY b.time_in DESC 
             LIMIT 1";
    
    $stmt2 = $conn->prepare($sql2);
    $stmt2->bind_param("i", $user_id);
    $stmt2->execute();
    $result2 = $stmt2->get_result();
    
    if ($result2->num_rows > 0) {
        $booking = $result2->fetch_assoc();
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
    
    $stmt2->close();
}

$stmt->close();
$conn->close();
?>