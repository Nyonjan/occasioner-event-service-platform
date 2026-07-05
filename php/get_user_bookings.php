<?php
session_start();
header('Content-Type: application/json');
require_once 'db_config.php';

// Only allow logged-in users
if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'Unauthorized access.']);
    exit;
}

$user_id = $_SESSION['user_id'];
$bookings = [];

try {
    // 1. Fetch from occasion_bookings (Detailed package-based bookings)
    $stmt1 = $pdo->prepare("
        SELECT 
            id, 
            'package' as booking_type_display,
            occasion_title as title, 
            package_id as subtitle,
            total_price, 
            event_date, 
            event_time,
            location_area as location,
            status, 
            created_at,
            guest_count,
            food_preference,
            staff_info,
            additional_services
        FROM occasion_bookings 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    ");
    $stmt1->execute([$user_id]);
    $service_bookings = $stmt1->fetchAll(PDO::FETCH_ASSOC);

    // 2. Fetch from bookings (General service/occasion bookings)
    $stmt2 = $pdo->prepare("
        SELECT 
            id, 
            booking_type as booking_type_display,
            category as title, 
            '' as subtitle,
            CASE 
                WHEN (category = 'Chef' OR category = 'chef') AND total_price = 0.12 THEN 1200.00 
                ELSE total_price 
            END as total_price, 
            event_date,
            event_time, 
            location,
            booking_details,
            order_status as status, 
            created_at 
        FROM bookings 
        WHERE user_id = ? 
        ORDER BY created_at DESC
    ");
    $stmt2->execute([$user_id]);
    $general_bookings = $stmt2->fetchAll(PDO::FETCH_ASSOC);

    // Transform stmt1 (occasion_bookings) to have a consistent booking_details field
    foreach ($service_bookings as &$sb) {
        $details = [
            'guestCount' => $sb['guest_count'],
            'foodPreference' => $sb['food_preference'],
            'staffInfo' => @json_decode($sb['staff_info'], true) ?: $sb['staff_info'],
            'additionalServices' => json_decode($sb['additional_services'], true)
        ];
        $sb['booking_details'] = json_encode($details);
        
        // Remove raw columns to save bandwidth/complexity
        unset($sb['guest_count'], $sb['food_preference'], $sb['staff_info'], $sb['additional_services']);
    }

    // Combine and sort by created_at DESC
    $bookings = array_merge($service_bookings, $general_bookings);
    usort($bookings, function ($a, $b) {
        return strtotime($b['created_at']) - strtotime($a['created_at']);
    });

    echo json_encode([
        'success' => true,
        'bookings' => $bookings
    ]);

} catch (PDOException $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Database error: ' . $e->getMessage()
    ]);
}
?>