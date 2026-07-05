<?php
// PDO connection
require_once 'db_config.php';

try {
    // 1. Users
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS users (
            id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            username VARCHAR(255) NOT NULL UNIQUE,
            email VARCHAR(255) NOT NULL UNIQUE,
            password VARCHAR(255) NOT NULL,
            full_name VARCHAR(255) NOT NULL,
            phone_number VARCHAR(20),
            address TEXT,
            user_role ENUM('consumer','admin') NOT NULL DEFAULT 'consumer',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
    ");

    // 2. Employees
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS employees (
            employee_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            full_name VARCHAR(255) NOT NULL,
            phone_number VARCHAR(20),
            employee_role ENUM('chef','decorator','photographer','cleaner') NOT NULL DEFAULT 'chef',
            description TEXT,
            joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        ) ENGINE=InnoDB;
    ");

    // 3. Packages
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS packages (
            package_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            package_name VARCHAR(255) NOT NULL,
            package_price DECIMAL(10,2) NOT NULL
        ) ENGINE=InnoDB;
    ");

    // 4. Services (additional services)
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS services (
            service_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            service_name VARCHAR(255) NOT NULL,
            service_price DECIMAL(10,2) NOT NULL
        ) ENGINE=InnoDB;
    ");

    // 5. Bookings
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS bookings (
            booking_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            user_id INT UNSIGNED NOT NULL,
            package_id INT UNSIGNED NULL,
            service_id INT UNSIGNED NOT NULL,
            employee_id INT UNSIGNED,
            guest_count INT,
            food_preference ENUM('veg','non-veg','both') NOT NULL,
            event_date DATE NOT NULL,
            event_time TIME NOT NULL,
            location_area VARCHAR(100) NOT NULL,
            specific_location TEXT NOT NULL,
            booking_details TEXT,
            total_price DECIMAL(10,2) NOT NULL,
            order_status ENUM('pending','sent','completed','cancelled') DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
            FOREIGN KEY (package_id) REFERENCES packages(package_id) ON DELETE CASCADE,
            FOREIGN KEY (service_id) REFERENCES services(service_id) ON DELETE CASCADE,
            FOREIGN KEY (employee_id) REFERENCES employees(employee_id) ON DELETE SET NULL
        ) ENGINE=InnoDB;
    ");

    // 6. Payments
    $pdo->exec("
        CREATE TABLE IF NOT EXISTS payments (
            payment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
            booking_id INT UNSIGNED NOT NULL,
            payment_method ENUM('cash_on_delivery','khalti') NOT NULL,
            amount DECIMAL(10,2) NOT NULL,
            payment_status ENUM('pending','completed','failed') DEFAULT 'pending',
            transaction_id VARCHAR(255),
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (booking_id) REFERENCES bookings(booking_id) ON DELETE CASCADE
        ) ENGINE=InnoDB;
    ");

    echo "All tables created successfully.";

} catch (PDOException $e) {
    echo "Error: " . $e->getMessage();
}
?>