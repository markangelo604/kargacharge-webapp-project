<?php
header('Content-Type: application/json');
require_once 'config.php';

$action = $_POST['action'] ?? '';

switch($action) {
    case 'get_booking_details':
        getBookingDetails($conn);
        break;
    
    case 'finish_charging':
        finishCharging($conn);
        break;
    
    case 'complete_transaction':
        completeTransaction($conn);
        break;
    
    case 'submit_report':
        submitReport($conn);
        break;
    
    case 'submit_review':
        submitReview($conn);
        break;
    
    default:
        echo json_encode(['success' => false, 'message' => 'Invalid action']);
        break;
}

function getBookingDetails($conn) {
    $booking_id = $_POST['booking_id'] ?? '';

    if (empty($booking_id)) {
        echo json_encode(['success' => false, 'message' => 'Booking ID is required']);
        return;
    }

    // Get booking details
    $booking_query = $conn->prepare("
        SELECT b.*, cs.stat_name, cs.charge_type, cs.location, cs.images, cp.name as provider_name
        FROM booking b
        JOIN charging_station cs ON b.stat_id = cs.stat_id
        JOIN charging_provider cp ON cs.prov_id = cp.id
        WHERE b.book_id = ?
    ");
    
    $booking_query->bind_param("i", $booking_id);
    $booking_query->execute();
    $result = $booking_query->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Booking not found']);
        return;
    }

    $data = $result->fetch_assoc();
    
    // Process images
    $images_array = [];
    if ($data['images']) {
        $unserialized = @unserialize($data['images']);
        if ($unserialized !== false && is_array($unserialized)) {
            foreach ($unserialized as $img_data) {
                $images_array[] = base64_encode($img_data);
            }
        }
    }

    $booking_query->close();

    echo json_encode([
        'success' => true,
        'booking' => [
            'book_id' => $data['book_id'],
            'stat_id' => $data['stat_id'],
            'time_in' => $data['time_in'],
            'time_out' => $data['time_out'],
            'date' => $data['date'],
            'rate' => $data['rate'],
            'status' => $data['status']
        ],
        'station' => [
            'stat_id' => $data['stat_id'],
            'stat_name' => $data['stat_name'],
            'charge_type' => $data['charge_type'],
            'location' => $data['location'],
            'provider_name' => $data['provider_name'],
            'images' => $images_array
        ]
    ]);
}

function finishCharging($conn) {
    $booking_id = $_POST['booking_id'] ?? '';

    if (empty($booking_id)) {
        echo json_encode(['success' => false, 'message' => 'Booking ID is required']);
        return;
    }

    // Update booking status to 'Completed'
    $stmt = $conn->prepare("UPDATE booking SET status = 'Completed' WHERE book_id = ?");
    $stmt->bind_param("i", $booking_id);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Charging session finished successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to finish charging session'
        ]);
    }

    $stmt->close();
}

function completeTransaction($conn) {
    $booking_id = $_POST['booking_id'] ?? '';

    if (empty($booking_id)) {
        echo json_encode(['success' => false, 'message' => 'Booking ID is required']);
        return;
    }

    // Get station ID from booking
    $get_station = $conn->prepare("SELECT stat_id FROM booking WHERE book_id = ?");
    $get_station->bind_param("i", $booking_id);
    $get_station->execute();
    $result = $get_station->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['success' => false, 'message' => 'Booking not found']);
        return;
    }

    $station_id = $result->fetch_assoc()['stat_id'];
    $get_station->close();

    // Start transaction
    $conn->begin_transaction();

    try {
        // Update booking to mark transaction as completed
        $update_booking = $conn->prepare("UPDATE booking SET status = 'Transaction Completed' WHERE book_id = ?");
        $update_booking->bind_param("i", $booking_id);
        
        if (!$update_booking->execute()) {
            throw new Exception('Failed to update booking status');
        }
        $update_booking->close();

        // Check if there are any more active bookings for this station
        $check_bookings = $conn->prepare("
            SELECT COUNT(*) as count 
            FROM booking 
            WHERE stat_id = ? AND status IN ('Pending', 'Confirmed')
        ");
        $check_bookings->bind_param("i", $station_id);
        $check_bookings->execute();
        $count_result = $check_bookings->get_result();
        $active_bookings = $count_result->fetch_assoc()['count'];
        $check_bookings->close();

        // If no more active bookings, set station to Available
        if ($active_bookings == 0) {
            $update_station = $conn->prepare("UPDATE charging_station SET availability_status = 'Available' WHERE stat_id = ?");
            $update_station->bind_param("i", $station_id);
            
            if (!$update_station->execute()) {
                throw new Exception('Failed to update station status');
            }
            $update_station->close();
        }

        // Commit transaction
        $conn->commit();

        echo json_encode([
            'success' => true,
            'message' => 'Transaction completed successfully'
        ]);

    } catch (Exception $e) {
        $conn->rollback();
        echo json_encode([
            'success' => false,
            'message' => $e->getMessage()
        ]);
    }
}

function submitReport($conn) {
    $booking_id = $_POST['booking_id'] ?? '';
    $station_id = $_POST['station_id'] ?? '';
    $user_id = $_POST['user_id'] ?? '';
    $reason = $_POST['reason'] ?? '';
    $description = $_POST['description'] ?? '';

    if (empty($booking_id) || empty($station_id) || empty($user_id) || empty($reason) || empty($description)) {
        echo json_encode(['success' => false, 'message' => 'All fields are required']);
        return;
    }

    // Insert report
    $stmt = $conn->prepare("
        INSERT INTO reports (user_id, station_id, booking_id, reason, description, created_at) 
        VALUES (?, ?, ?, ?, ?, NOW())
    ");
    $stmt->bind_param("iiiss", $user_id, $station_id, $booking_id, $reason, $description);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Report submitted successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to submit report: ' . $stmt->error
        ]);
    }

    $stmt->close();
}

function submitReview($conn) {
    $booking_id = $_POST['booking_id'] ?? '';
    $station_id = $_POST['station_id'] ?? '';
    $user_id = $_POST['user_id'] ?? '';
    $rating = $_POST['rating'] ?? '';
    $comment = $_POST['comment'] ?? '';
    $anonymous = $_POST['anonymous'] ?? '0';

    if (empty($booking_id) || empty($station_id) || empty($user_id) || empty($rating)) {
        echo json_encode(['success' => false, 'message' => 'Required fields missing']);
        return;
    }

    // Validate rating (1-5)
    $rating = intval($rating);
    if ($rating < 1 || $rating > 5) {
        echo json_encode(['success' => false, 'message' => 'Invalid rating']);
        return;
    }

    // Get payment ID from booking
    $get_payment = $conn->prepare("SELECT pay_id FROM payment WHERE book_id = ?");
    $get_payment->bind_param("i", $booking_id);
    $get_payment->execute();
    $result = $get_payment->get_result();
    
    if ($result->num_rows === 0) {
        // If no payment found, we can't submit review due to foreign key constraint
        echo json_encode([
            'success' => false,
            'message' => 'No payment found for this booking. Cannot submit review.'
        ]);
        return;
    }
    
    $payment_data = $result->fetch_assoc();
    $payment_id = $payment_data['pay_id'];
    $get_payment->close();

    // Insert review with payment ID
    $stmt = $conn->prepare("
        INSERT INTO reviews (rating, comment, pay_id) 
        VALUES (?, ?, ?)
    ");
    $stmt->bind_param("isi", $rating, $comment, $payment_id);

    if ($stmt->execute()) {
        echo json_encode([
            'success' => true,
            'message' => 'Review submitted successfully'
        ]);
    } else {
        echo json_encode([
            'success' => false,
            'message' => 'Failed to submit review: ' . $stmt->error
        ]);
    }

    $stmt->close();
}

$conn->close();
?>
