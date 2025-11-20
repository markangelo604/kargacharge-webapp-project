<?php
header('Content-Type: application/json');
require_once 'config.php';

// Check if request method is POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
    exit;
}

$user_id = $_POST['user_id'] ?? '';
$status = $_POST['status'] ?? '';


if (empty($user_id)) {
    echo json_encode([
        'success' => false,
        'message' => 'User ID is required.'
    ]);
    $conn->close();
    exit;
}

$query = "SELECT stat_name, start_time, end_time, status, rate FROM booking INNER JOIN charging_station ON booking.stat_id = charging_station.id WHERE evown_id = ?";
$types = "i";
$params = [$user_id];

if (!empty($status)) {
    $query .= " AND status = ?";
    $types .= "s";
    $params[] = $status;
}

$stmt = $conn->prepare($query);
$stmt ->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $bookings = $result->fetch_assoc();

    $stmt->close();
    $conn->close();

    // Return booking details
    echo json_encode([
        'success' => true,
        'data' => $bookings,
        'booking' => [
            'stat_name' => $bookings['stat_name'],
            'start_time' => $bookings['start_time'],
            'end_time' => $bookings['end_time'],
            'status' => $bookings['status'],
            'rate' => $bookings['rate']
        ]
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'No bookings found for this user.'
    ]);
}
?>