<?php
header('Content-Type: application/json');
require_once 'config.php';

// Fetch all charging stations with provider information
$sql = "SELECT 
            cs.stat_id,
            cs.stat_name,
            cs.location,
            cs.place_type,
            cs.charge_type,
            cs.rate,
            cs.availability_status,
            cs.details,
            cp.name as provider_name,
            cp.phoneno as provider_phone
        FROM charging_station cs
        LEFT JOIN charging_provider cp ON cs.prov_id = cp.id
        WHERE cs.availability_status != 'Out of Service'
        ORDER BY cs.stat_id DESC";

$result = $conn->query($sql);

if (!$result) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]);
    exit;
}

$stations = [];
while ($row = $result->fetch_assoc()) {
    // Parse location coordinates
    $coords = explode(',', $row['location']);
    if (count($coords) == 2) {
        $stations[] = [
            'stat_id' => $row['stat_id'],
            'stat_name' => $row['stat_name'],
            'location' => $row['location'],
            'latitude' => floatval(trim($coords[0])),
            'longitude' => floatval(trim($coords[1])),
            'place_type' => $row['place_type'],
            'charge_type' => $row['charge_type'],
            'rate' => floatval($row['rate']),
            'availability_status' => $row['availability_status'],
            'details' => $row['details'],
            'provider_name' => $row['provider_name'],
            'provider_phone' => $row['provider_phone']
        ];
    }
}

$conn->close();

echo json_encode([
    'success' => true,
    'stations' => $stations,
    'count' => count($stations)
]);
?>