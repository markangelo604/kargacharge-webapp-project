<?php
header('Content-Type: application/json');
require_once 'config.php';

// Check if provider ID is provided
if (!isset($_GET['prov_id']) || empty($_GET['prov_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Provider ID is required'
    ]);
    exit;
}

$prov_id = intval($_GET['prov_id']);

// Helper function to calculate energy consumption
function calculateEnergy($duration_seconds, $charge_type) {
    $duration_hours = $duration_seconds / 3600;
    
    switch($charge_type) {
        case 'AC Level 1':
            $charging_rate = 1.8; // kW
            break;
        case 'AC Level 2':
            $charging_rate = 7.2; // kW
            break;
        case 'DC Fast Charging':
            $charging_rate = 50; // kW
            break;
        case 'Tesla Supercharger':
            $charging_rate = 80; // kW
            break;
        default:
            $charging_rate = 3.6; // Default fallback
    }
    
    return $charging_rate * $duration_hours; // kWh
}

// Initialize response array
$stats = [
    'success' => true,
    'total_stations' => 0,
    'total_bookings' => 0,
    'total_revenue' => 0,
    'average_rating' => 0,
    'total_reviews' => 0,
    'available_stations' => 0,
    'occupied_stations' => 0,
    'maintenance_stations' => 0,
    'out_of_service_stations' => 0,
    'recent_bookings' => [],
    'revenue_by_month' => [],
    'station_performance' => [],
    'bookings_by_status' => [
        'completed' => 0,
        'ongoing' => 0,
        'cancelled' => 0,
        'pending' => 0
    ]
];

// 1. Get total stations and count by status
$sql = "SELECT 
            COUNT(*) as total,
            SUM(CASE WHEN availability_status = 'Available' THEN 1 ELSE 0 END) as available,
            SUM(CASE WHEN availability_status = 'Occupied' THEN 1 ELSE 0 END) as occupied,
            SUM(CASE WHEN availability_status = 'Maintenance' THEN 1 ELSE 0 END) as maintenance,
            SUM(CASE WHEN availability_status = 'Out of Service' THEN 1 ELSE 0 END) as out_of_service
        FROM charging_station 
        WHERE prov_id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $prov_id);
$stmt->execute();
$result = $stmt->get_result();
$station_data = $result->fetch_assoc();

$stats['total_stations'] = intval($station_data['total']);
$stats['available_stations'] = intval($station_data['available']);
$stats['occupied_stations'] = intval($station_data['occupied']);
$stats['maintenance_stations'] = intval($station_data['maintenance']);
$stats['out_of_service_stations'] = intval($station_data['out_of_service']);
$stmt->close();

// 2. Get total bookings and revenue using payment table
$sql = "SELECT 
            b.book_id,
            b.time_in,
            b.time_out,
            b.rate,
            b.status,
            cs.charge_type,
            p.total_amount
        FROM booking b
        INNER JOIN charging_station cs ON b.stat_id = cs.stat_id
        LEFT JOIN payment p ON b.book_id = p.book_id
        WHERE cs.prov_id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $prov_id);
$stmt->execute();
$result = $stmt->get_result();

$total_bookings = 0;
$total_revenue = 0;
$completed = 0;
$ongoing = 0;
$cancelled = 0;
$pending = 0;

while ($row = $result->fetch_assoc()) {
    $total_bookings++;
    
    // Normalize status for comparison
    $status = $row['status'] ? strtolower(trim($row['status'])) : 'unknown';
    
    // Count by status
    if ($status === 'completed') {
        $completed++;
    } elseif ($status === 'ongoing') {
        $ongoing++;
    } elseif ($status === 'cancelled') {
        $cancelled++;
    } elseif ($status === 'pending') {
        $pending++;
    } else {
        // If status doesn't match any known value, count as pending
        $pending++;
    }
    
    // Calculate revenue for ANY booking with valid time data (not cancelled)
    if ($status !== 'cancelled' && $row['time_in'] > 0 && $row['time_out'] > 0 && $row['time_out'] > $row['time_in']) {
        // Use payment amount if available, otherwise calculate
        if (!empty($row['total_amount'])) {
            $total_revenue += floatval($row['total_amount']);
        } else {
            $duration_seconds = $row['time_out'] - $row['time_in'];
            $energy_kwh = calculateEnergy($duration_seconds, $row['charge_type']);
            $revenue = $energy_kwh * floatval($row['rate']);
            $total_revenue += $revenue;
        }
    }
}

$stats['total_bookings'] = $total_bookings;
$stats['total_revenue'] = round($total_revenue, 2);
$stats['bookings_by_status']['completed'] = $completed;
$stats['bookings_by_status']['ongoing'] = $ongoing;
$stats['bookings_by_status']['cancelled'] = $cancelled;
$stats['bookings_by_status']['pending'] = $pending;
$stmt->close();

// 3. Get average rating and total reviews
$sql = "SELECT 
            COUNT(*) as total_reviews,
            AVG(r.rating) as avg_rating
        FROM reviews r
        INNER JOIN payment p ON r.pay_id = p.pay_id
        INNER JOIN booking b ON p.book_id = b.book_id
        INNER JOIN charging_station cs ON b.stat_id = cs.stat_id
        WHERE cs.prov_id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $prov_id);
$stmt->execute();
$result = $stmt->get_result();
$review_data = $result->fetch_assoc();

$stats['total_reviews'] = intval($review_data['total_reviews']);
$stats['average_rating'] = $review_data['avg_rating'] ? round(floatval($review_data['avg_rating']), 1) : 0;
$stmt->close();

// 4. Get recent bookings (last 10)
$sql = "SELECT 
            b.book_id,
            b.date,
            b.time_in,
            b.time_out,
            b.status,
            b.rate,
            cs.stat_name,
            cs.location,
            cs.charge_type,
            eo.name as customer_name,
            p.total_amount
        FROM booking b
        INNER JOIN charging_station cs ON b.stat_id = cs.stat_id
        LEFT JOIN ev_owner eo ON b.evown_id = eo.id
        LEFT JOIN payment p ON b.book_id = p.book_id
        WHERE cs.prov_id = ?
        ORDER BY b.date DESC, b.book_id DESC
        LIMIT 10";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $prov_id);
$stmt->execute();
$result = $stmt->get_result();

while ($row = $result->fetch_assoc()) {
    $duration_seconds = 0;
    $duration_hours = 0;
    $energy_kwh = 0;
    $revenue = 0;
    
    if ($row['time_in'] > 0 && $row['time_out'] > 0 && $row['time_out'] > $row['time_in']) {
        $duration_seconds = $row['time_out'] - $row['time_in'];
        $duration_hours = $duration_seconds / 3600;
        $energy_kwh = calculateEnergy($duration_seconds, $row['charge_type']);
        
        // Use payment amount if available, otherwise calculate
        if (!empty($row['total_amount'])) {
            $revenue = floatval($row['total_amount']);
        } else {
            $revenue = $energy_kwh * floatval($row['rate']);
        }
    }
    
    $stats['recent_bookings'][] = [
        'book_id' => $row['book_id'],
        'date' => $row['date'],
        'time_in' => $row['time_in'],
        'time_out' => $row['time_out'],
        'duration' => round($duration_hours, 2),
        'duration_seconds' => $duration_seconds,
        'energy_kwh' => round($energy_kwh, 2),
        'status' => $row['status'],
        'rate' => floatval($row['rate']),
        'revenue' => round($revenue, 2),
        'station_name' => $row['stat_name'],
        'customer_name' => $row['customer_name'] ?? 'Guest'
    ];
}
$stmt->close();

// 5. Get revenue by month (last 6 months)
$sql = "SELECT 
            DATE_FORMAT(b.date, '%Y-%m') as month,
            DATE_FORMAT(b.date, '%b %Y') as month_label,
            b.book_id,
            b.time_in,
            b.time_out,
            b.rate,
            b.status,
            cs.charge_type,
            p.total_amount
        FROM booking b
        INNER JOIN charging_station cs ON b.stat_id = cs.stat_id
        LEFT JOIN payment p ON b.book_id = p.book_id
        WHERE cs.prov_id = ? 
            AND b.date >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        ORDER BY month ASC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $prov_id);
$stmt->execute();
$result = $stmt->get_result();

$monthly_data = [];
while ($row = $result->fetch_assoc()) {
    $revenue = 0;
    $status = strtolower(trim($row['status']));
    
    // Only count completed bookings for revenue
    if ($status === 'completed') {
        // Use payment amount if available, otherwise calculate
        if (!empty($row['total_amount'])) {
            $revenue = floatval($row['total_amount']);
        } elseif ($row['time_in'] > 0 && $row['time_out'] > 0 && $row['time_out'] > $row['time_in']) {
            $duration_seconds = $row['time_out'] - $row['time_in'];
            $energy_kwh = calculateEnergy($duration_seconds, $row['charge_type']);
            $revenue = $energy_kwh * floatval($row['rate']);
        }
    }
    
    $month = $row['month'];
    if (!isset($monthly_data[$month])) {
        $monthly_data[$month] = [
            'month_label' => $row['month_label'],
            'revenue' => 0,
            'bookings' => 0
        ];
    }
    
    if ($status === 'completed') {
        $monthly_data[$month]['revenue'] += $revenue;
        $monthly_data[$month]['bookings']++;
    }
}

foreach ($monthly_data as $data) {
    $stats['revenue_by_month'][] = [
        'month' => $data['month_label'],
        'revenue' => round($data['revenue'], 2),
        'bookings' => $data['bookings']
    ];
}
$stmt->close();

// 6. Get station performance
$sql = "SELECT 
            cs.stat_id,
            cs.stat_name,
            cs.location,
            cs.availability_status,
            cs.charge_type,
            b.book_id,
            b.time_in,
            b.time_out,
            b.rate,
            b.status,
            r.rating,
            p.total_amount
        FROM charging_station cs
        LEFT JOIN booking b ON cs.stat_id = b.stat_id
        LEFT JOIN payment p ON b.book_id = p.book_id
        LEFT JOIN reviews r ON p.pay_id = r.pay_id
        WHERE cs.prov_id = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $prov_id);
$stmt->execute();
$result = $stmt->get_result();

$station_performance = [];
while ($row = $result->fetch_assoc()) {
    $stat_id = $row['stat_id'];
    
    if (!isset($station_performance[$stat_id])) {
        $station_performance[$stat_id] = [
            'stat_id' => $stat_id,
            'stat_name' => $row['stat_name'],
            'location' => $row['location'],
            'status' => $row['availability_status'],
            'charge_type' => $row['charge_type'],
            'total_bookings' => 0,
            'revenue' => 0,
            'ratings' => []
        ];
    }
    
    if ($row['book_id']) {
        $station_performance[$stat_id]['total_bookings']++;
        
        $status = strtolower(trim($row['status']));
        
        // Only calculate revenue for completed bookings
        if ($status === 'completed' && $row['time_in'] > 0 && $row['time_out'] > 0 && $row['time_out'] > $row['time_in']) {
            // Use payment amount if available, otherwise calculate
            if (!empty($row['total_amount'])) {
                $revenue = floatval($row['total_amount']);
                error_log("Station {$stat_id}: Using payment amount: {$revenue}");
            } else {
                $duration_seconds = $row['time_out'] - $row['time_in'];
                $energy_kwh = calculateEnergy($duration_seconds, $row['charge_type']);
                $revenue = $energy_kwh * floatval($row['rate']);
                error_log("Station {$stat_id}: Calculated revenue: {$revenue} (Energy: {$energy_kwh} kWh, Rate: {$row['rate']})");
            }
            $station_performance[$stat_id]['revenue'] += $revenue;
        }
        
        if ($row['rating']) {
            $station_performance[$stat_id]['ratings'][] = floatval($row['rating']);
        }
    }
}

// Calculate average ratings and format output
foreach ($station_performance as $data) {
    $avg_rating = null;
    if (count($data['ratings']) > 0) {
        $avg_rating = round(array_sum($data['ratings']) / count($data['ratings']), 1);
    }
    
    $revenue = round($data['revenue'], 2);
    error_log("Station {$data['stat_id']} ({$data['stat_name']}): Total Revenue = {$revenue}");
    
    $stats['station_performance'][] = [
        'stat_id' => $data['stat_id'],
        'stat_name' => $data['stat_name'],
        'location' => $data['location'],
        'status' => $data['status'],
        'total_bookings' => $data['total_bookings'],
        'revenue' => $revenue,
        'avg_rating' => $avg_rating
    ];
}

// Sort by revenue descending
usort($stats['station_performance'], function($a, $b) {
    return $b['revenue'] <=> $a['revenue'];
});

$stmt->close();
$conn->close();

// Debug: Log the final stats
error_log("Final Stats - Total Revenue: " . $stats['total_revenue']);
error_log("Station Performance Count: " . count($stats['station_performance']));

// Ensure proper JSON encoding with numeric check
echo json_encode($stats, JSON_NUMERIC_CHECK);
?>