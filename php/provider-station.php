<?php 
    require_once 'config.php';

    $action = $_POST['action'] ?? '';
    switch($action){
        case 'add_station':
            addChargingStation();
            break;
        
        case 'delete_station':
            deleteChargingStation();
            break;

        case 'edit_station':
            editChargingStation();
            break;

        default:
            echo json_encode(['success' => false, 'message' => 'Invalid action']);
            break;
    }

    function addChargingStation(){
        $detail1 = $_POST['detail1'] ?? '';
        $detail2 = $_POST['detail2'] ?? '';
        $provider_id = $_POST['provider_id'] ?? '';

        if (empty($detail1) || empty($detail2) || empty($provider_id)) {
            echo json_encode(['success' => false, 'message' => 'All fields are required']);
            return;
        }


        $stmt = $conn->prepare("INSERT INTO charging_stations (detail1, detail2, provider_id) VALUES (?, ?, ?)");
        $stmt->bind_param("ssi", $detail1, $detail2, $provider_id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Charging station added successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to add charging station']);
        }

        $stmt->close();

    }

    function deleteChargingStation(){
        $station_id = $_POST['station_id'] ?? '';

        if (empty($station_id)) {
            echo json_encode(['success' => false, 'message' => 'Station ID is required']);
            return;
        }

        $stmt = $conn->prepare("DELETE FROM charging_stations WHERE id = ?");
        $stmt->bind_param("i", $station_id);
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Charging station deleted successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to delete charging station']);
        }

        $stmt->close();
    }

    function editChargingStation(){
        $station_id = $_POST['station_id'] ?? '';
        $new_detail1 = $_POST['new_detail1'] ?? '';
        $new_detail2 = $_POST['new_detail2'] ?? '';

        if (empty($station_id) || empty($new_detail1) || empty($new_detail2)) {
            echo json_encode(['success' => false, 'message' => 'All fields are required']);
            return;
        }

        $query = "UPDATE charging_stations SET";

        if (!empty($new_detail1)) {
            $query .= " detail1 = '$new_detail1',";
        }
        if (!empty($new_detail2)) {
            $query .= " detail2 = '$new_detail2',";
        }

        $query .= " WHERE id = $station_id";
        $query = str_replace(", WHERE", " WHERE", $query); // Remove trailing comma
        $query = $conn->prepare($query);
        if ($query->execute()) {
            echo json_encode(['success' => true, 'message' => 'Charging station updated successfully']);
        } else {
            echo json_encode(['success' => false, 'message' => 'Failed to update charging station']);
        }
        $query->close();

        // Implementation for editing a charging station
    }
?>