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

// Validate required field
if (!isset($_POST['stat_id']) || empty($_POST['stat_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Station ID is required'
    ]);
    exit;
}

$stat_id = intval($_POST['stat_id']);

// Optional: Verify station belongs to the logged-in provider
// You may want to pass prov_id as well for security
if (isset($_POST['prov_id'])) {
    $prov_id = intval($_POST['prov_id']);
    
    // Verify ownership
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
}

// Prepare and execute delete query
$sql = "DELETE FROM charging_station WHERE stat_id = ?";
$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]);
    exit;
}

$stmt->bind_param("i", $stat_id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode([
            'success' => true,
            'message' => 'Station deleted successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Station not found'
        ]);
    }
} else {
    echo json_encode([
        'success' => false,
        'message' => 'Failed to delete station: ' . $stmt->error
    ]);
}

$stmt->close();
$conn->close();
?>