<?php 
    require_once 'config.php';

    $action = $_POST['action'] ?? '';
    switch($action){
        case 'book_session':
            bookChargingSession();
            break;
        
        case 'booking_payment':
            bookingPayment();
            break;

        case 'update_booking_time':
            updateBookingTime();
            break;

        case 'cancel_booking':
            cancelBooking();
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }

    function bookChargingSession() {
        $client_id = $_POST['client_id'] ?? '';
        $station_id = $_POST['station_id'] ?? '';
        $start_time = $_POST['start_time'] ?? '';
        $end_time = $_POST['end_time'] ?? '';

        if (empty($client_id) || empty($station_id) || empty($start_time) || empty($end_time)) {
            echo json_encode(['success' => false, 'message' => 'All fields are required']);
            return;
        }

        // Validate that start_time < end_time
        if (strtotime($start_time) >= strtotime($end_time)) {
            echo json_encode(['success' => false, 'message' => 'Start time must be earlier than end time']);
            return;
        }

        // Check for overlapping bookings
        $check = $conn->prepare("
            SELECT id FROM bookings
            WHERE station_id = ?
            AND (
                (? < end_time) AND (? > start_time)
            )
            LIMIT 1
        ");
        $check->bind_param("iss", $station_id, $end_time, $start_time);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'This charging station is already booked for the selected time range']);
            return;
        }
        $check->close();

        // Insert booking
        $stmt = $conn->prepare("INSERT INTO bookings (client_id, station_id, start_time, end_time) VALUES (?, ?, ?, ?)");
        $stmt->bind_param("iiss", $client_id, $station_id, $start_time, $end_time);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Charging session booked successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to book charging session']);
        }

        $stmt->close();
    }

    function bookingPayment() {
        $booking_id = $_POST['booking_id'] ?? '';
        $amount = $_POST['amount'] ?? '';

        if (empty($booking_id) || empty($amount)) {
            echo json_encode(['success' => false, 'message' => 'Booking ID and amount are required']);
            return;
        }

        // Here you would integrate with a payment gateway
        // For simplicity, we will just mark the booking as paid

        $stmt = $conn->prepare("UPDATE bookings SET is_paid = 1, amount_paid = ? WHERE id = ?");
        $stmt->bind_param("di", $amount, $booking_id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Payment successful for the booking']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to process payment']);
        }

        $stmt->close();
    }

    function updateBookingTime() {
        $booking_id = $_POST['booking_id'] ?? '';
        $new_start_time = $_POST['new_start_time'] ?? '';
        $new_end_time = $_POST['new_end_time'] ?? '';

        if (empty($booking_id) || empty($new_start_time) || empty($new_end_time)) {
            echo json_encode(['success' => false, 'message' => 'All fields are required']);
            return;
        }

        // Validate that new_start_time < new_end_time
        if (strtotime($new_start_time) >= strtotime($new_end_time)) {
            echo json_encode(['success' => false, 'message' => 'Start time must be earlier than end time']);
            return;
        }

        // Check for overlapping bookings
        $check = $conn->prepare("
            SELECT id FROM bookings
            WHERE id != ? AND station_id = (
                SELECT station_id FROM bookings WHERE id = ?
            )
            AND (
                (? < end_time) AND (? > start_time)
            )
            LIMIT 1
        ");
        $check->bind_param("iiss", $booking_id, $booking_id, $new_end_time, $new_start_time);
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'This charging station is already booked for the selected time range']);
            return;
        }
        $check->close();

        // Update booking times
        $stmt = $conn->prepare("UPDATE bookings SET start_time = ?, end_time = ? WHERE id = ?");
        $stmt->bind_param("ssi", $new_start_time, $new_end_time, $booking_id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Booking time updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update booking time']);
        }

        $stmt->close();
    }

    function cancelBooking() {
        $booking_id = $_POST['booking_id'] ?? '';

        if (empty($booking_id)) {
            echo json_encode(['success' => false, 'message' => 'Booking ID is required']);
            return;
        }

        $stmt = $conn->prepare("DELETE FROM bookings WHERE id = ?");
        $stmt->bind_param("i", $booking_id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Booking cancelled successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to cancel booking']);
        }

        $stmt->close();
    }

?>