<?php 
    require_once 'config.php';

    $action = $_POST['action'] ?? '';
    switch($action){    
        case 'payment_processing':
            paymentProcessing($conn);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }

    function paymentProcessing($conn) {
        $booking_id = $_POST['booking_id'] ?? '';
        $amount = $_POST['amount'] ?? '';
        $payment_method = $_POST['payment_method'] ?? '';
        
        if (empty($booking_id) || empty($amount) || empty($payment_method)) {
            echo json_encode(['success' => false, 'message' => 'All fields are required']);
            return;
        }

        // Here you would integrate with a payment gateway API
        // For demonstration, we'll assume the payment is always successful

        // Update booking status to 'paid'
        $stmt = $conn->prepare("UPDATE bookings SET status = 'paid', amount_paid = ? WHERE id = ?");
        $stmt->bind_param("di", $amount, $booking_id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Payment processed successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to process payment']);
        }

        $stmt->close();
    }
?>