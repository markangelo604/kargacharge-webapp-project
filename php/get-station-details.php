<?php
header('Content-Type: application/json');
require_once 'config.php';

// Check if station ID is provided
if (!isset($_GET['stat_id']) || empty($_GET['stat_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Station ID is required'
    ]);
    exit;
}

$stat_id = intval($_GET['stat_id']);

// Prepare and execute query
$sql = "SELECT stat_id, stat_name, location, place_type, charge_type, rate, availability_status, details, prov_id  
        FROM charging_station 
        WHERE stat_id = ?";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]);
    exit;
}

$stmt->bind_param("i", $stat_id);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Station not found'
    ]);
    $stmt->close();
    $conn->close();
    exit;
}

$station = $result->fetch_assoc();

$stmt->close();
$conn->close();

echo json_encode([
    'success' => true,
    'station' => [
        'stat_id' => $station['stat_id'],
        'stat_name' => $station['stat_name'],
        'location' => $station['location'],
        'place_type' => $station['place_type'],
        'charge_type' => $station['charge_type'],
        'rate' => $station['rate'],
        'availability_status' => $station['availability_status'],
        'details' => $station['details'],
        'prov_id' => $station['prov_id']
    ]
]);
?>