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
$required_fields = ['stat_id', 'stat_name', 'location', 'place_type', 'charge_type', 'rate', 'availability_status', 'prov_id'];
$missing_fields = [];

foreach ($required_fields as $field) {
    if (!isset($_POST[$field]) || ($field !== 'details' && empty(trim($_POST[$field])))) {
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
$stat_id = intval($_POST['stat_id']);
$stat_name = trim($_POST['stat_name']);
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

// Validate location format
if (!preg_match('/^-?\d+\.?\d*,\s*-?\d+\.?\d*$/', $location)) {
    echo json_encode([
        'success' => false,
        'message' => 'Invalid location format. Use: latitude, longitude'
    ]);
    exit;
}

// Verify station belongs to provider
$verify_sql = "SELECT stat_id FROM charging_station WHERE stat_id = ? AND prov_id = ?";
$verify_stmt = $conn->prepare($verify_sql);

if (!$verify_stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]);
    exit;
}

$verify_stmt->bind_param("ii", $stat_id, $prov_id);
$verify_stmt->execute();
$verify_result = $verify_stmt->get_result();

if ($verify_result->num_rows === 0) {
    echo json_encode([
        'success' => false,
        'message' => 'Station not found or access denied'
    ]);
    $verify_stmt->close();
    $conn->close();
    exit;
}

$verify_stmt->close();

// Prepare and execute update query
$sql = "UPDATE charging_station 
        SET stat_name = ?, location = ?, place_type = ?, charge_type = ?, rate = ?, availability_status = ?, details = ? 
        WHERE stat_id = ? AND prov_id = ?";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]);
    exit;
}

$stmt->bind_param("ssssdssii", $stat_name, $location, $place_type, $charge_type, $rate, $availability_status, $details, $stat_id, $prov_id);

if ($stmt->execute()) {
    // Handle image updates
    if (isset($_FILES['images']) && !empty($_FILES['images']['name'][0])) {
        $images_data = [];
        
        foreach ($_FILES['images']['tmp_name'] as $key => $tmp_name) {
            if ($_FILES['images']['error'][$key] === UPLOAD_ERR_OK) {
                $image_data = file_get_contents($tmp_name);
                $images_data[] = $image_data;
            }
        }
        
        if (!empty($images_data)) {
            $serialized_images = serialize($images_data);
            
            $img_sql = "UPDATE charging_station SET images = ? WHERE stat_id = ? AND prov_id = ?";
            $img_stmt = $conn->prepare($img_sql);
            $img_stmt->bind_param("sii", $serialized_images, $stat_id, $prov_id);
            $img_stmt->execute();
            $img_stmt->close();
        }
    }
    
    // Handle image removal
    if (isset($_POST['remove_images']) && $_POST['remove_images'] === 'true') {
        $img_sql = "UPDATE charging_station SET images = NULL WHERE stat_id = ? AND prov_id = ?";
        $img_stmt = $conn->prepare($img_sql);
        $img_stmt->bind_param("ii", $stat_id, $prov_id);
        $img_stmt->execute();
        $img_stmt->close();
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to update station: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>