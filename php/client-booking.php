<?php 
    require_once 'config.php';

    $action = $_POST['action'] ?? '';
    switch($action){
        case 'book_session':
            bookChargingSession($conn);
            break;
        
        case 'booking_payment':
            bookingPayment($conn);
            break;

        case 'update_booking_time':
            updateBookingTime($conn);
            break;

        case 'cancel_booking':
            cancelBooking($conn);
            break;

        case 'check_pending_bookings':
            checkPendingBookings($conn);
            break;

        case 'check_station_bookings':
            checkStationBookings($conn);
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }

    function bookChargingSession($conn) {
        $client_id = $_POST['client_id'] ?? '';
        $station_id = $_POST['station_id'] ?? '';
        $start_time = $_POST['start_time'] ?? '';
        $end_time = $_POST['end_time'] ?? '';

        if (empty($client_id) || empty($station_id) || empty($start_time) || empty($end_time)) {
            echo json_encode(['success' => false, 'message' => 'All fields are required']);
            return;
        }

        // Convert datetime strings to timestamps and subtract 8 hours (28800 seconds) for Philippine timezone
        $start_timestamp = strtotime($start_time) - 28800;
        $end_timestamp = strtotime($end_time) - 28800;
        
        // Extract date from start_time
        $booking_date = date('Y-m-d', $start_timestamp);

        // Validate that start_time < end_time
        if ($start_timestamp >= $end_timestamp) {
            echo json_encode(['success' => false, 'message' => 'Start time must be earlier than end time']);
            return;
        }

        // Get station rate and current status
        $rate_query = $conn->prepare("SELECT rate, availability_status FROM charging_station WHERE stat_id = ?");
        $rate_query->bind_param("i", $station_id);
        $rate_query->execute();
        $rate_result = $rate_query->get_result();
        
        if ($rate_result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Station not found']);
            return;
        }
        
        $station_data = $rate_result->fetch_assoc();
        $rate = $station_data['rate'];
        $availability = $station_data['availability_status'];
        
        $rate_query->close();

        // Check if station is available
        if ($availability !== 'Available') {
            echo json_encode(['success' => false, 'message' => 'This station is not currently available']);
            return;
        }

        // Check for overlapping bookings
        $check = $conn->prepare("
            SELECT book_id FROM booking
            WHERE stat_id = ?
            AND date = ?
            AND status != 'Cancelled'
            AND NOT (time_out <= ? OR time_in >= ?)
            LIMIT 1
        ");
        $check->bind_param("isii", 
            $station_id,      
            $booking_date,    
            $start_timestamp, 
            $end_timestamp    
        );
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'This charging station is already booked for the selected time range']);
            return;
        }
        $check->close();

        // Start transaction
        $conn->begin_transaction();

        try {
            // Insert booking with status 'Pending'
            $stmt = $conn->prepare("INSERT INTO booking (evown_id, stat_id, time_in, time_out, date, rate, status) VALUES (?, ?, ?, ?, ?, ?, 'Pending')");
            $stmt->bind_param("iiiiss", $client_id, $station_id, $start_timestamp, $end_timestamp, $booking_date, $rate);

            if (!$stmt->execute()) {
                throw new Exception('Failed to book charging session: ' . $stmt->error);
            }
            
            $booking_id = $stmt->insert_id;
            $stmt->close();

            // Update station status to 'Occupied'
            $update_station = $conn->prepare("UPDATE charging_station SET availability_status = 'Occupied' WHERE stat_id = ?");
            $update_station->bind_param("i", $station_id);
            
            if (!$update_station->execute()) {
                throw new Exception('Failed to update station status');
            }
            $update_station->close();

            // Commit transaction
            $conn->commit();

            echo json_encode([
                'success' => true, 
                'message' => 'Charging session booked successfully',
                'booking_id' => $booking_id
            ]);
        } catch (Exception $e) {
            // Rollback transaction on error
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    function bookingPayment($conn) {
        $booking_id = $_POST['booking_id'] ?? '';
        $amount = $_POST['amount'] ?? '';
        $payment_method = $_POST['payment_method'] ?? 'Cash';

        if (empty($booking_id) || empty($amount)) {
            echo json_encode(['success' => false, 'message' => 'Booking ID and amount are required']);
            return;
        }

        // Check if booking exists
        $check = $conn->prepare("SELECT book_id, status, stat_id FROM booking WHERE book_id = ?");
        $check->bind_param("i", $booking_id);
        $check->execute();
        $result = $check->get_result();
        
        if ($result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Booking not found']);
            return;
        }
        
        $booking = $result->fetch_assoc();
        $check->close();

        // Start transaction
        $conn->begin_transaction();

        try {
            // Insert payment record
            $stmt = $conn->prepare("INSERT INTO payment (book_id, total_amount, payment_method, payment_status) VALUES (?, ?, ?, 'Completed')");
            $stmt->bind_param("ids", $booking_id, $amount, $payment_method);

            if (!$stmt->execute()) {
                throw new Exception('Failed to process payment');
            }
            $stmt->close();

            // Update booking status to 'Confirmed'
            $update = $conn->prepare("UPDATE booking SET status = 'Confirmed' WHERE book_id = ?");
            $update->bind_param("i", $booking_id);
            
            if (!$update->execute()) {
                throw new Exception('Failed to update booking status');
            }
            $update->close();

            // Commit transaction
            $conn->commit();

            echo json_encode(['success' => true, 'message' => 'Payment successful for the booking']);
        } catch (Exception $e) {
            // Rollback transaction on error
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    function updateBookingTime($conn) {
        $booking_id = $_POST['booking_id'] ?? '';
        $new_start_time = $_POST['new_start_time'] ?? '';
        $new_end_time = $_POST['new_end_time'] ?? '';

        if (empty($booking_id) || empty($new_start_time) || empty($new_end_time)) {
            echo json_encode(['success' => false, 'message' => 'All fields are required']);
            return;
        }

        // Convert to timestamps
        $new_start_timestamp = strtotime($new_start_time);
        $new_end_timestamp = strtotime($new_end_time);
        $new_date = date('Y-m-d', $new_start_timestamp);

        // Validate that new_start_time < new_end_time
        if ($new_start_timestamp >= $new_end_timestamp) {
            echo json_encode(['success' => false, 'message' => 'Start time must be earlier than end time']);
            return;
        }

        // Get booking station and current details
        $get_booking = $conn->prepare("SELECT stat_id FROM booking WHERE book_id = ?");
        $get_booking->bind_param("i", $booking_id);
        $get_booking->execute();
        $booking_result = $get_booking->get_result();
        
        if ($booking_result->num_rows === 0) {
            echo json_encode(['success' => false, 'message' => 'Booking not found']);
            return;
        }
        
        $booking_data = $booking_result->fetch_assoc();
        $station_id = $booking_data['stat_id'];
        $get_booking->close();

        // Check for overlapping bookings (excluding current booking)
        $check = $conn->prepare("
            SELECT book_id FROM booking
            WHERE book_id != ?
            AND stat_id = ?
            AND date = ?
            AND status != 'Cancelled'
            AND (
                (? < time_out AND ? > time_in) OR
                (? < time_out AND ? > time_in) OR
                (? <= time_in AND ? >= time_out)
            )
            LIMIT 1
        ");
        $check->bind_param("iisiiiiiii", 
            $booking_id,
            $station_id,
            $new_date,
            $new_start_timestamp, $new_start_timestamp,
            $new_end_timestamp, $new_end_timestamp,
            $new_start_timestamp, $new_end_timestamp
        );
        $check->execute();
        $result = $check->get_result();

        if ($result->num_rows > 0) {
            echo json_encode(['success' => false, 'message' => 'This charging station is already booked for the selected time range']);
            return;
        }
        $check->close();

        // Update booking times
        $stmt = $conn->prepare("UPDATE booking SET time_in = ?, time_out = ?, date = ? WHERE book_id = ?");
        $stmt->bind_param("iisi", $new_start_timestamp, $new_end_timestamp, $new_date, $booking_id);

        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Booking time updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update booking time']);
        }

        $stmt->close();
    }

    function cancelBooking($conn) {
        $booking_id = $_POST['booking_id'] ?? '';

        if (empty($booking_id)) {
            echo json_encode(['success' => false, 'message' => 'Booking ID is required']);
            return;
        }

        // Start transaction
        $conn->begin_transaction();

        try {
            // Get station ID before updating
            $get_station = $conn->prepare("SELECT stat_id FROM booking WHERE book_id = ?");
            $get_station->bind_param("i", $booking_id);
            $get_station->execute();
            $station_result = $get_station->get_result();
            
            if ($station_result->num_rows === 0) {
                throw new Exception('Booking not found');
            }
            
            $station_data = $station_result->fetch_assoc();
            $station_id = $station_data['stat_id'];
            $get_station->close();

            // Update booking status instead of deleting
            $stmt = $conn->prepare("UPDATE booking SET status = 'Cancelled' WHERE book_id = ?");
            $stmt->bind_param("i", $booking_id);

            if (!$stmt->execute()) {
                throw new Exception('Failed to cancel booking');
            }

            if ($stmt->affected_rows > 0) {
                $stmt->close();
                
                // Update station status if no more active bookings
                updateStationStatusAfterBookingChange($conn, $station_id);
                
                // Commit transaction
                $conn->commit();
                
                echo json_encode(['success' => true, 'message' => 'Booking cancelled successfully']);
            } else {
                throw new Exception('Booking not found');
            }
        } catch (Exception $e) {
            // Rollback transaction on error
            $conn->rollback();
            echo json_encode(['success' => false, 'message' => $e->getMessage()]);
        }
    }

    function checkPendingBookings($conn) {
        $client_id = $_POST['client_id'] ?? '';

        if (empty($client_id)) {
            echo json_encode(['success' => false, 'message' => 'Client ID is required']);
            return;
        }

        // Check for pending or confirmed bookings
        $stmt = $conn->prepare("SELECT book_id FROM booking WHERE evown_id = ? AND status IN ('Pending', 'Confirmed')");
        $stmt->bind_param("i", $client_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        $hasPending = $result->num_rows > 0;
        
        echo json_encode([
            'success' => true, 
            'has_pending' => $hasPending,
            'message' => $hasPending ? 'User has pending bookings' : 'No pending bookings'
        ]);
        
        $stmt->close();
    }

    function updateStationStatusAfterBookingChange($conn, $station_id) {
        // Check if there are any active bookings for this station
        $check = $conn->prepare("SELECT COUNT(*) as count FROM booking WHERE stat_id = ? AND status IN ('Pending', 'Confirmed')");
        $check->bind_param("i", $station_id);
        $check->execute();
        $result = $check->get_result();
        $row = $result->fetch_assoc();
        $active_bookings = $row['count'];
        $check->close();

        // If no active bookings, set station to Available
        if ($active_bookings == 0) {
            $update = $conn->prepare("UPDATE charging_station SET availability_status = 'Available' WHERE stat_id = ?");
            $update->bind_param("i", $station_id);
            $update->execute();
            $update->close();
        }
    }

    function checkStationBookings($conn) {
        $station_id = $_POST['station_id'] ?? '';

        if (empty($station_id)) {
            echo json_encode(['success' => false, 'message' => 'Station ID is required']);
            return;
        }

        // Check for active bookings (Pending or Confirmed)
        $stmt = $conn->prepare("SELECT COUNT(*) as count FROM booking WHERE stat_id = ? AND status IN ('Pending', 'Confirmed')");
        $stmt->bind_param("i", $station_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $row = $result->fetch_assoc();
        $has_bookings = $row['count'] > 0;
        
        echo json_encode([
            'success' => true, 
            'has_bookings' => $has_bookings,
            'message' => $has_bookings ? 'Station has active bookings' : 'No active bookings'
        ]);
        
        $stmt->close();
    }
?>