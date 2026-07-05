<?php
require_once 'config.php';

// ─── Khalti Configuration ─────────────────────────────────────────────────────
define('KHALTI_SECRET_KEY', 'c39000926f374c94a5bf652ce713ce30');
define('KHALTI_LOOKUP_URL', 'https://a.khalti.com/api/v2/epayment/lookup/');
// For sandbox/testing use: 'https://a.khalti.com/api/v2/epayment/lookup/'
// ─────────────────────────────────────────────────────────────────────────────

/**
 * This file handles two scenarios:
 *
 * 1. GET request — Khalti redirects the user back here after payment.
 *    We verify the payment and then redirect to a result page.
 *
 * 2. POST (JSON) request — called by AJAX from the frontend to check
 *    verification status after the popup/redirect has finished.
 */

// ── Helper: create the booking in DB ─────────────────────────────────────────
function saveBooking(PDO $pdo, array $booking, string $pidx, string $transactionId): int {
    $stmt = $pdo->prepare("
        INSERT INTO bookings (
            user_id, package_id, package_name, package_price, guest_count, staff_info,
            food_preference, additional_services, event_date, event_time, location_area,
            specific_location, customer_name, phone_number, base_price, additional_cost,
            total_price, payment_method, payment_status, khalti_pidx, khalti_transaction_id
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'khalti', 'paid', ?, ?)
    ");

    $stmt->execute([
        $booking['user_id'],
        $booking['package_id'],
        $booking['package_name'],
        $booking['package_price'],
        $booking['guest_count'],
        $booking['staff_info'],
        $booking['food_preference'],
        json_encode($booking['additional_services']),
        $booking['event_date'],
        $booking['event_time'],
        $booking['location_area'],
        $booking['specific_location'],
        $booking['customer_name'],
        $booking['phone_number'],
        $booking['base_price'],
        $booking['additional_cost'],
        $booking['total_price'],
        $pidx,
        $transactionId,
    ]);

    return (int) $pdo->lastInsertId();
}

// ── Helper: call Khalti lookup API ───────────────────────────────────────────
function lookupKhaltiPayment(string $pidx): array {
    $ch = curl_init(KHALTI_LOOKUP_URL);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode(['pidx' => $pidx]),
        CURLOPT_HTTPHEADER     => [
            'Authorization: Key ' . KHALTI_SECRET_KEY,
            'Content-Type: application/json',
        ],
        CURLOPT_TIMEOUT        => 30,
        CURLOPT_SSL_VERIFYPEER => true,
    ]);

    $response  = curl_exec($ch);
    $httpCode  = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    $curlError = curl_error($ch);
    curl_close($ch);

    if ($curlError) {
        error_log("Khalti lookup cURL error: $curlError");
        return ['error' => 'Connection error'];
    }

    $data = json_decode($response, true) ?? [];
    $data['_http_code'] = $httpCode;
    return $data;
}

// ─────────────────────────────────────────────────────────────────────────────
// GET — Khalti redirect callback
// ─────────────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'GET') {

    $pidx   = $_GET['pidx']   ?? '';
    $status = $_GET['status'] ?? '';

    // If user cancelled or payment failed at Khalti end
    if ($status !== 'Completed' || empty($pidx)) {
        header('Location: booking.html?payment=cancelled');
        exit;
    }

    // Make sure we have a pending booking in session
    if (!isset($_SESSION['pending_booking']) || $_SESSION['pending_booking']['khalti_pidx'] !== $pidx) {
        header('Location: booking.html?payment=error&reason=session_mismatch');
        exit;
    }

    // Verify with Khalti
    $lookup = lookupKhaltiPayment($pidx);

    if (($lookup['status'] ?? '') !== 'Completed') {
        error_log("Khalti lookup status not Completed for pidx $pidx: " . json_encode($lookup));
        header('Location: booking.html?payment=failed');
        exit;
    }

    $transactionId = $lookup['transaction_id'] ?? $pidx;
    $booking       = $_SESSION['pending_booking'];

    try {
        $bookingId = saveBooking($pdo, $booking, $pidx, $transactionId);
        unset($_SESSION['pending_booking']); // Clean up

        // Store success info in session for the thank-you display
        $_SESSION['payment_success'] = [
            'booking_id'     => $bookingId,
            'package_name'   => $booking['package_name'],
            'event_date'     => $booking['event_date'],
            'event_time'     => $booking['event_time'],
            'total_price'    => $booking['total_price'],
            'transaction_id' => $transactionId,
        ];

        header('Location: booking.html?payment=success&booking_id=' . $bookingId);
        exit;

    } catch (PDOException $e) {
        error_log("Booking save failed after payment. pidx=$pidx Error: " . $e->getMessage());
        // Payment was taken but DB failed — log for manual reconciliation
        header('Location: booking.html?payment=db_error&pidx=' . urlencode($pidx));
        exit;
    }
}

// ─────────────────────────────────────────────────────────────────────────────
// POST — AJAX verification call (optional extra safety check)
// ─────────────────────────────────────────────────────────────────────────────
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    header('Content-Type: application/json');

    if (!isset($_SESSION['user_id'])) {
        echo json_encode(['success' => false, 'message' => 'Not authenticated.']);
        exit;
    }

    $input = json_decode(file_get_contents('php://input'), true) ?? $_POST;
    $pidx  = trim($input['pidx'] ?? '');

    if (empty($pidx)) {
        echo json_encode(['success' => false, 'message' => 'Missing pidx.']);
        exit;
    }

    if (!isset($_SESSION['pending_booking']) || $_SESSION['pending_booking']['khalti_pidx'] !== $pidx) {
        echo json_encode(['success' => false, 'message' => 'Session mismatch or expired.']);
        exit;
    }

    $lookup = lookupKhaltiPayment($pidx);

    if (($lookup['status'] ?? '') !== 'Completed') {
        echo json_encode(['success' => false, 'message' => 'Payment not completed yet.', 'status' => $lookup['status'] ?? 'unknown']);
        exit;
    }

    $transactionId = $lookup['transaction_id'] ?? $pidx;
    $booking       = $_SESSION['pending_booking'];

    try {
        $bookingId = saveBooking($pdo, $booking, $pidx, $transactionId);
        unset($_SESSION['pending_booking']);

        echo json_encode([
            'success'        => true,
            'booking_id'     => $bookingId,
            'transaction_id' => $transactionId,
            'message'        => 'Booking confirmed and payment verified!',
        ]);
    } catch (PDOException $e) {
        error_log("Booking save failed (POST verify). pidx=$pidx Error: " . $e->getMessage());
        echo json_encode(['success' => false, 'message' => 'Payment received but booking save failed. Contact support with ref: ' . $pidx]);
    }
    exit;
}

// Any other method
header('Content-Type: application/json');
echo json_encode(['success' => false, 'message' => 'Invalid request.']);
?>
