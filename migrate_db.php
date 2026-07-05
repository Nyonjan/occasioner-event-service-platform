<?php
require_once 'db_config.php';

try {
    // 1. Check if the 'booking_details' column already exists in 'bookings'
    $stmt = $pdo->query("SHOW COLUMNS FROM bookings LIKE 'booking_details'");
    $columnExists = $stmt->fetch();

    if (!$columnExists) {
        // 2. Add the column if it's missing
        $pdo->exec("ALTER TABLE bookings ADD COLUMN booking_details TEXT AFTER specific_location");
        echo "Successfully added 'booking_details' column to 'bookings' table.<br>";
    } else {
        echo "'booking_details' column already exists.<br>";
    }

    echo "Migration completed.";

} catch (PDOException $e) {
    echo "Migration error: " . $e->getMessage();
}
?>
