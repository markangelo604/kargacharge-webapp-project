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

// Get all reviews for this provider's stations
$sql = "SELECT 
            r.review_id,
            r.rating,
            r.comment,
            r.pay_id,
            cs.stat_name,
            cs.location,
            eo.name as customer_name,
            eo.email as customer_email,
            b.date as booking_date,
            b.book_id
        FROM reviews r
        INNER JOIN payment p ON r.pay_id = p.pay_id
        INNER JOIN booking b ON p.book_id = b.book_id
        INNER JOIN charging_station cs ON b.stat_id = cs.stat_id
        INNER JOIN ev_owner eo ON b.evown_id = eo.id
        WHERE cs.prov_id = ?
        ORDER BY r.review_id DESC";

$stmt = $conn->prepare($sql);

if (!$stmt) {
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $conn->error
    ]);
    exit;
}

$stmt->bind_param("i", $prov_id);
$stmt->execute();
$result = $stmt->get_result();

$reviews = [];
$total_ratings = 0;
$rating_counts = [5 => 0, 4 => 0, 3 => 0, 2 => 0, 1 => 0];

while ($row = $result->fetch_assoc()) {
    $reviews[] = [
        'review_id' => $row['review_id'],
        'rating' => intval($row['rating']),
        'comment' => $row['comment'],
        'station_name' => $row['stat_name'],
        'station_location' => $row['location'],
        'customer_name' => $row['customer_name'],
        'customer_email' => $row['customer_email'],
        'booking_date' => $row['booking_date'],
        'book_id' => $row['book_id']
    ];
    
    $rating = intval($row['rating']);
    $total_ratings += $rating;
    if (isset($rating_counts[$rating])) {
        $rating_counts[$rating]++;
    }
}

$total_reviews = count($reviews);
$average_rating = $total_reviews > 0 ? round($total_ratings / $total_reviews, 1) : 0;

$stmt->close();
$conn->close();

echo json_encode([
    'success' => true,
    'reviews' => $reviews,
    'total_reviews' => $total_reviews,
    'average_rating' => $average_rating,
    'rating_distribution' => $rating_counts
]);
?>