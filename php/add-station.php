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

// Validate required fields
$required_fields = ['location', 'place_type', 'charge_type', 'rate', 'availability_status', 'prov_id'];
$missing_fields = [];

foreach ($required_fields as $field) {
    if (!isset($_POST[$field]) || empty(trim($_POST[$field]))) {
        $missing_fields[] = $field;
    }
}

if (!empty($missing_fields)) {
    echo json_encode([
        'success' => false,
        'message' => 'Missing required fields: ' . implode(', ', $missing_fields)
    ]);
    exit;
}

// Sanitize and validate inputs
$location = trim($_POST['location']);
$place_type = trim($_POST['place_type']);
$charge_type = trim($_POST['charge_type']);
$rate = floatval($_POST['rate']);
$availability_status = trim($_POST['availability_status']);
$details = isset($_POST['details']) ? trim($_POST['details']) : '';
$prov_id = intval($_POST['prov_id']);

// Validate rate
if ($rate <= 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Rate must be greater than 0'
    ]);
    exit;
}

// Validate location format (basic check for coordinates)
if (!preg_match('/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/', $location)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid location format. Use: latitude, longitude'
    ]);
    exit;
}

// Prepare and execute insert query
$sql = "INSERT INTO charging_station (location, place_type, charge_type, rate, availability_status, details, prov_id) 
        VALUES (?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]);
    exit;
}

$stmt->bind_param("sssdssi", $location, $place_type, $charge_type, $rate, $availability_status, $details, $prov_id);

if ($stmt->execute()) {
    $new_station_id = $stmt->insert_id;
    
    echo json_encode([
        'success' => true,
        'message' => 'Station added successfully',
        'stat_id' => $new_station_id
    ]);
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to add station: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>