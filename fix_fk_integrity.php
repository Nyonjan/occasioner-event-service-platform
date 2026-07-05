<?php
require_once 'db_config.php';

try {
    // 1. Alter 'bookings' to allow NULL for package_id
    echo "Starting migration: Allowing NULL for package_id in 'bookings' table...<br>";
    $pdo->exec("ALTER TABLE bookings MODIFY package_id INT UNSIGNED NULL;");
    echo "SUCCESS: 'package_id' is now nullable.<br>";

    // 2. Also ensure service_id is allowed to be NULL if it's optional, 
    // but in your case it seems required for all bookings.
    
    // 3. Optional: Add 'booking_details' column if missing (from previous task)
    $stmt = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'booking_details'");
    if (!$stmt->fetch()) {
        $pdo->exec("ALTER TABLE bookings ADD COLUMN booking_details TEXT AFTER specific_location");
        echo "SUCCESS: 'booking_details' column added.<br>";
    }

    echo "<b>Migration Complete.</b> All constraints fixed.";

} catch (PDOException $e) {
    echo "<b>Migration Error:</b> " . $e->getMessage() . "<br>";
    echo "<i>Tip: Check if foreign keys are preventing this modification. Usually, MODIFY works fine.</i>";
}
?>
