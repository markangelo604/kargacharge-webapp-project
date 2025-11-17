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
$required_fields = ['location', 'place_type', 'charge_type', 'rate', 'availability_status', 'prov_id', 'stat_name'];
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
$stat_name = trim($_POST['stat_name']);

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
$sql = "INSERT INTO charging_station (location, place_type, charge_type, rate, availability_status, details, prov_id, stat_name) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]);
    exit;
}

$stmt->bind_param("sssdssis", $location, $place_type, $charge_type, $rate, $availability_status, $details, $prov_id, $stat_name);

if ($stmt->execute()) {
    $new_station_id = $stmt->insert_id;
    
    // Handle multiple image uploads
    if (isset($_FILES['images']) && !empty($_FILES['images']['name'][0])) {
        $images_data = [];
        
        foreach ($_FILES['images']['tmp_name'] as $key => $tmp_name) {
            if ($_FILES['images']['error'][$key] === UPLOAD_ERR_OK) {
                $image_data = file_get_contents($tmp_name);
                $images_data[] = $image_data;
            }
        }
        
        if (!empty($images_data)) {
            // Serialize images array
            $serialized_images = serialize($images_data);
            
            $update_sql = "UPDATE charging_station SET images = ? WHERE stat_id = ?";
            $update_stmt = $conn->prepare($update_sql);
            $update_stmt->bind_param("si", $serialized_images, $new_station_id);
            $update_stmt->execute();
            $update_stmt->close();
        }
    }
    
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