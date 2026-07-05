<?php
session_start();
header('Content-Type: application/json');
require_once 'db_config.php';

// Only allow logged-in users
if (!isset($_SESSION['user_id'])) {
    http_response_code(403);
    echo json_encode(['success' => false, 'message' => 'You must be logged in to book a service.']);
    exit;
}

// Disable error display to prevent breaking JSON output
ini_set('display_errors', 0);
error_reporting(E_ALL);

try {
    // 1. Map package info
    $package_id = $_POST['packageId'] ?? '1';
    $occasion_title = $_POST['occasionName'] ?? 'Event';
    $package_price = floatval($_POST['packagePrice'] ?? 0);

    // Extract integer from guestCount (e.g., "10-20 People" -> 10)
    $guest_count_str = $_POST['guestCount'] ?? '0';
    preg_match('/\d+/', $guest_count_str, $matches);
    $guest_count = isset($matches[0]) ? intval($matches[0]) : 0;

    // 2. Map Staff Info to JSON (simple wrapper for the string)
    $staff_info_str = $_POST['staffInfo'] ?? '';
    $staff_info_json = json_encode(['details' => $staff_info_str]);

    // 3. Map Food Preference ('veg' -> 'Vegetarian', etc.)
    $food_pref_raw = $_POST['foodPreference'] ?? 'veg';
    $food_pref_map = [
        'veg' => 'Vegetarian',
        'non-veg' => 'Non-Vegetarian',
        'both' => 'Both'
    ];
    $food_preference = $food_pref_map[$food_pref_raw] ?? 'Vegetarian';

    // 4. Map Additional Services to JSON object with prices
    $selected_services = $_POST['additionalServices'] ?? [];

    // Safety: Handle case where it's a string instead of an array (if JS doesn't use [])
    if (!is_array($selected_services)) {
        $selected_services = !empty($selected_services) ? [$selected_services] : [];
    }

    $service_prices = [
        'decorator' => 3000,
        'photographer' => 8000,
        'entertainment' => 4000,
        'cleanup' => 2000,
        'catering' => 6000,
        'helper' => 2500
    ];
    $additional_services_obj = [];
    foreach ($selected_services as $service) {
        if (isset($service_prices[$service])) {
            $additional_services_obj[$service] = $service_prices[$service];
        }
    }
    $additional_services_json = json_encode($additional_services_obj);

    // 5. Event schedule & location
    $event_date = $_POST['eventDate'] ?? date('Y-m-d');
    $event_time = $_POST['eventTime'] ?? date('H:i:s');
    $location_area = $_POST['locationArea'] ?? 'Kathmandu';
    $specific_location = $_POST['specificLocation'] ?? 'Address not specified';

    // 6. Customer contact
    $customer_name = $_POST['customerName'] ?? 'Guest';
    $phone_number = $_POST['phoneNumber'] ?? '';

    // 7. Pricing breakdown
    $base_price = floatval($_POST['basePrice'] ?? 0);
    $additional_cost = floatval($_POST['additionalCost'] ?? 0);
    $total_price = floatval($_POST['totalPrice'] ?? 0);

    // 8. Insert into database
    $stmt = $pdo->prepare("
        INSERT INTO occasion_bookings (
            user_id, 
            customer_name,
            phone_number,
            package_id, 
            occasion_title,
            package_price, 
            guest_count,
            staff_info,
            food_preference,
            additional_services,
            event_date, 
            event_time, 
            location_area, 
            specific_location, 
            base_price,
            additional_cost,
            total_price,
            status
        ) VALUES (
            ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'pending'
        )
    ");

    $stmt->execute([
        $_SESSION['user_id'],
        $customer_name,
        $phone_number,
        $package_id,
        $occasion_title,
        $package_price,
        $guest_count,
        $staff_info_json,
        $food_preference,
        $additional_services_json,
        $event_date,
        $event_time,
        $location_area,
        $specific_location,
        $base_price,
        $additional_cost,
        $total_price
    ]);

    $booking_id = $pdo->lastInsertId();

    echo json_encode([
        'success' => true,
        'message' => 'Booking successfully created!',
        'booking_id' => $booking_id,
        'total_price' => $total_price
    ]);

} catch (Exception $e) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
} catch (Throwable $t) {
    http_response_code(500);
    echo json_encode([
        'success' => false,
        'message' => 'Critical Error: ' . $t->getMessage()
    ]);
}
?>