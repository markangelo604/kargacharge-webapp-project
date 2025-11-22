<?php 
    require_once 'config.php';
    
    // Set JSON response header
    header('Content-Type: application/json');

    $action = $_POST['action'] ?? '';
    
    switch($action) {    
        case 'payment_processing':
            paymentProcessing($conn);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }

    function paymentProcessing($conn) {
        try {
            $booking_id = $_POST['booking_id'] ?? '';
            $amount = $_POST['amount'] ?? '';
            $payment_method = $_POST['payment_method'] ?? '';
            
            // Validate required fields
            if (empty($booking_id) || empty($amount) || empty($payment_method)) {
                echo json_encode(['success' => false, 'message' => 'All fields are required']);
                return;
            }

            // Validate booking exists and is pending
            $checkStmt = $conn->prepare("SELECT id, status FROM bookings WHERE id = ?");
            $checkStmt->bind_param("i", $booking_id);
            $checkStmt->execute();
            $result = $checkStmt->get_result();
            
            if ($result->num_rows === 0) {
                echo json_encode(['success' => false, 'message' => 'Booking not found']);
                $checkStmt->close();
                return;
            }
            
            $booking = $result->fetch_assoc();
            $checkStmt->close();

            // Start transaction
            $conn->begin_transaction();

            try {
                // Insert payment record
                $paymentStmt = $conn->prepare("INSERT INTO payments (booking_id, amount, payment_method, payment_status, transaction_date) VALUES (?, ?, ?, 'completed', NOW())");
                $paymentStmt->bind_param("ids", $booking_id, $amount, $payment_method);
                
                if (!$paymentStmt->execute()) {
                    throw new Exception('Failed to record payment');
                }
                
                $payment_id = $conn->insert_id;
                $paymentStmt->close();

                // Update booking status to 'paid' or 'confirmed'
                $updateStmt = $conn->prepare("UPDATE bookings SET status = 'confirmed', amount_paid = ?, payment_method = ?, updated_at = NOW() WHERE id = ?");
                $updateStmt->bind_param("dsi", $amount, $payment_method, $booking_id);
                
                if (!$updateStmt->execute()) {
                    throw new Exception('Failed to update booking status');
                }
                $updateStmt->close();

                // Commit transaction
                $conn->commit();

                echo json_encode([
                    'success' => true, 
                    'message' => 'Payment processed successfully',
                    'payment_id' => $payment_id,
                    'booking_id' => $booking_id
                ]);

            } catch (Exception $e) {
                // Rollback on error
                $conn->rollback();
                throw $e;
            }

        } catch (Exception $e) {
            echo json_encode([
                'success' => false, 
                'message' => 'Payment processing failed: ' . $e->getMessage()
            ]);
        }
    }

    // ============================================
    // PAYMENT GATEWAY INTEGRATIONS (Optional)
    // ============================================
    
    /**
     * GCash Payment Integration (placeholder)
     * Replace with actual GCash API integration
     */
    function processGCashPayment($booking_id, $amount) {
        // Example: GCash API integration
        // $gcash_api_url = 'https://api.gcash.com/payments';
        // $gcash_api_key = 'your_api_key';
        
        // For now, simulate successful payment
        return [
            'success' => true,
            'transaction_id' => 'GCASH_' . time() . '_' . $booking_id,
            'payment_status' => 'completed'
        ];
    }

    /**
     * Credit/Debit Card Payment Integration (placeholder)
     * Replace with actual payment gateway (e.g., Stripe, PayMongo)
     */
    function processCardPayment($booking_id, $amount, $card_details = []) {
        // Example: Stripe/PayMongo API integration
        // $payment_gateway_url = 'https://api.paymongo.com/v1/payments';
        // $api_key = 'your_api_key';
        
        // For now, simulate successful payment
        return [
            'success' => true,
            'transaction_id' => 'CARD_' . time() . '_' . $booking_id,
            'payment_status' => 'completed'
        ];
    }

    /**
     * Get payment history for a booking
     */
    function getPaymentHistory($conn, $booking_id) {
        $stmt = $conn->prepare("SELECT * FROM payments WHERE booking_id = ? ORDER BY transaction_date DESC");
        $stmt->bind_param("i", $booking_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $payments = [];
        while ($row = $result->fetch_assoc()) {
            $payments[] = $row;
        }
        
        $stmt->close();
        return $payments;
    }
?>