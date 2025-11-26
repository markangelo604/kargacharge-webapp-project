<?php
header('Content-Type: application/json');
require_once 'config.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid request method'
    ]);
    exit;
}

$user_id = $_POST['user_id'] ?? '';
$status  = $_POST['status'] ?? '';

if (empty($user_id)) {
    echo json_encode([
        'success' => false,
        'message' => 'User ID is required.'
    ]);
    exit;
}

// Build SELECT query
$query = "SELECT 
            booking.book_id,
            booking.time_in,
            booking.time_out,
            booking.status AS booking_status,
            booking.rate AS booking_rate,
            charging_station.stat_name,
            charging_station.location
          FROM booking
          INNER JOIN charging_station 
                ON booking.stat_id = charging_station.stat_id
          WHERE booking.evown_id = ?";

$types = "i";
$params = [$user_id];

// Add status filter
if (!empty($status)) {
    $query .= " AND booking.status = ?";
    $types .= "s";
    $params[] = $status;
}

$query .= " ORDER BY booking.time_in DESC";

$stmt = $conn->prepare($query);
$stmt->bind_param($types, ...$params);
$stmt->execute();
$result = $stmt->get_result();

$bookings = [];

while ($row = $result->fetch_assoc()) {
    $bookings[] = [
        'booking_id' => $row['book_id'],
        'stat_name'  => $row['stat_name'],
        'start_time' => $row['time_in'],
        'end_time'   => $row['time_out'],
        'status'     => $row['booking_status'],
        'rate'       => $row['booking_rate'],
        'location'   => $row['location']
    ];
}

$stmt->close();
$conn->close();

if (!empty($bookings)) {
    echo json_encode([
        'success' => true,
        'message' => 'Bookings retrieved successfully',
        'count' => count($bookings),
        'data' => $bookings
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'No bookings found for this user.',
        'data' => []
    ]);
}
?>
