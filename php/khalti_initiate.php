<?php
require_once 'config.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Invalid request method.']);
    exit;
}

// Check if user is logged in
if (!isset($_SESSION['user_id'])) {
    echo json_encode(['success' => false, 'message' => 'Please login to complete your booking.']);
    exit;
}

// ─── Khalti Configuration ─────────────────────────────────────────────────────
// Replace with your actual Khalti secret key from https://khalti.com/dashboard
define('KHALTI_SECRET_KEY', 'c39000926f374c94a5bf652ce713ce30');
define('KHALTI_API_URL', 'https://a.khalti.com/api/v2/epayment/initiate/');
// For sandbox/testing use: 'https://a.khalti.com/api/v2/epayment/initiate/'
// ─────────────────────────────────────────────────────────────────────────────

// Get and decode posted JSON body
$input = json_decode(file_get_contents('php://input'), true);

if (!$input) {
    // Try form data fallback
    $input = $_POST;
}

// Required booking fields
$required = [
    'packageId', 'packageName', 'packagePrice', 'guestCount', 'staffInfo',
    'foodPreference', 'eventDate', 'eventTime', 'locationArea',
    'specificLocation', 'customerName', 'phoneNumber',
    'basePrice', 'additionalCost', 'totalPrice'
];

foreach ($required as $field) {
    if (!isset($input[$field]) || $input[$field] === '') {
        echo json_encode(['success' => false, 'message' => "Missing required field: $field"]);
        exit;
    }
}

$totalPrice  = (float) $input['totalPrice'];
$amountPaisa = (int) round($totalPrice * 100); // Khalti uses paisa (1 NPR = 100 paisa)

if ($amountPaisa < 100) { // Minimum 1 NPR
    echo json_encode(['success' => false, 'message' => 'Total amount is too low for payment.']);
    exit;
}

// Build a unique purchase order ID
$purchaseOrderId = 'OCC-' . time() . '-' . $_SESSION['user_id'];

// Store booking data in session so we can save it after payment verification
$_SESSION['pending_booking'] = [
    'user_id'              => $_SESSION['user_id'],
    'package_id'           => $input['packageId'],
    'package_name'         => $input['packageName'],
    'package_price'        => $input['packagePrice'],
    'guest_count'          => $input['guestCount'],
    'staff_info'           => $input['staffInfo'],
    'food_preference'      => $input['foodPreference'],
    'additional_services'  => isset($input['additionalServices'])
                                ? (array) $input['additionalServices']
                                : [],
    'event_date'           => $input['eventDate'],
    'event_time'           => $input['eventTime'],
    'location_area'        => $input['locationArea'],
    'specific_location'    => $input['specificLocation'],
    'customer_name'        => $input['customerName'],
    'phone_number'         => $input['phoneNumber'],
    'base_price'           => $input['basePrice'],
    'additional_cost'      => $input['additionalCost'],
    'total_price'          => $totalPrice,
    'purchase_order_id'    => $purchaseOrderId,
];

// Determine return URL (where Khalti redirects after payment)
$protocol   = (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off') ? 'https' : 'http';
$host       = $_SERVER['HTTP_HOST'];
$dir        = rtrim(dirname($_SERVER['SCRIPT_NAME']), '/');
$returnUrl  = "$protocol://$host$dir/khalti_verify.php";

// Khalti payload
$payload = [
    'return_url'         => $returnUrl,
    'website_url'        => "$protocol://$host$dir/",
    'amount'             => $amountPaisa,
    'purchase_order_id'  => $purchaseOrderId,
    'purchase_order_name'=> 'Occasioner Booking - ' . $input['packageName'],
    'customer_info'      => [
        'name'  => $input['customerName'],
        'phone' => $input['phoneNumber'],
    ],
    'amount_breakdown'   => [
        ['label' => 'Base Package',          'amount' => (int) round((float)$input['basePrice'] * 100)],
        ['label' => 'Additional Services',   'amount' => (int) round((float)$input['additionalCost'] * 100)],
    ],
    'product_details'    => [
        [
            'identity' => $input['packageId'],
            'name'     => $input['packageName'],
            'total_price' => $amountPaisa,
            'quantity' => 1,
            'unit_price'  => $amountPaisa,
        ],
    ],
];

// Call Khalti API
$ch = curl_init(KHALTI_API_URL);
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($payload),
    CURLOPT_HTTPHEADER     => [
        'Authorization: Key ' . KHALTI_SECRET_KEY,
        'Content-Type: application/json',
    ],
    CURLOPT_TIMEOUT        => 30,
    CURLOPT_SSL_VERIFYPEER => true,
]);

$response    = curl_exec($ch);
$httpCode    = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$curlError   = curl_error($ch);
curl_close($ch);

if ($curlError) {
    error_log("Khalti cURL error: $curlError");
    echo json_encode(['success' => false, 'message' => 'Failed to connect to payment gateway. Please try again.']);
    exit;
}

$responseData = json_decode($response, true);

if ($httpCode === 200 && isset($responseData['pidx'], $responseData['payment_url'])) {
    // Store pidx to verify later
    $_SESSION['pending_booking']['khalti_pidx'] = $responseData['pidx'];

    echo json_encode([
        'success'      => true,
        'payment_url'  => $responseData['payment_url'],
        'pidx'         => $responseData['pidx'],
    ]);
} else {
    error_log("Khalti initiation failed. HTTP $httpCode. Response: $response");
    $errorMsg = isset($responseData['detail']) ? $responseData['detail'] : 'Payment initiation failed. Please try again.';
    echo json_encode(['success' => false, 'message' => $errorMsg]);
}
?>
