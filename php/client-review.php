<?php 
    require_once 'config.php';

    $action = $_POST['action'] ?? '';
    switch($action){
        case 'submit_review':
            reviewSubmission($conn);
            break;
        
        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }

    function reviewSubmission($conn) {
        $client_id = $_POST['client_id'] ?? '';
        $pay_id = $_POST['pay_id'] ?? '';
        $rating = $_POST['rating'] ?? '';
        $comments = $_POST['comments'] ?? '';

        if (empty($client_id) || empty($provider_id) || empty($rating)) {
            echo json_encode(['success' => false, 'message' => 'Client ID, Provider ID, and Rating are required']);
            return;
        }

        $stmt = $conn->prepare("INSERT INTO reviews (client_id, provider_id, rating, comments) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("iiis", $client_id, $provider_id, $rating, $comments);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Review submitted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to submit review']);
        }

        $stmt->close();
    }
?>