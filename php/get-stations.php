<?php
header('Content-Type: application/json');
require_once 'config.php';

// Check if provider ID is provided
if (!isset($_GET['prov_id']) || empty($_GET['prov_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Provider ID is required'
    ]);
    exit;
}

$prov_id = intval($_GET['prov_id']);

// Prepare and execute query
$sql = "SELECT stat_id, location, place_type, charge_type, rate, availability_status, details, stat_name 
        FROM charging_station 
        WHERE prov_id = ? 
        ORDER BY stat_id DESC";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]);
    exit;
}

$stmt->bind_param("i", $prov_id);
$stmt->execute();
$result = $stmt->get_result();

$stations = [];
while ($row = $result->fetch_assoc()) {
    $stations[] = [
        'stat_id' => $row['stat_id'],
        'location' => $row['location'],
        'place_type' => $row['place_type'],
        'charge_type' => $row['charge_type'],
        'rate' => $row['rate'],
        'availability_status' => $row['availability_status'],
        'details' => $row['details'],
        'stat_name' => $row['stat_name'],
    ];
}

$stmt->close();
$conn->close();

echo json_encode([
    'success' => true,
    'stations' => $stations,
    'count' => count($stations)
]);
?>