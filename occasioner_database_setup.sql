-- ============================================================
--  OCCASIONER — Complete Database Setup
--  Run this entire file once to set up your database from scratch
--  Database: occasioner_db
-- ============================================================


-- ── Step 1: Create & select the database ─────────────────────
CREATE DATABASE IF NOT EXISTS occasioner_db
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE occasioner_db;


-- ── Step 2: users ─────────────────────────────────────────────
-- Stores registered customers (not admins)
CREATE TABLE IF NOT EXISTS users (
  id         INT          NOT NULL AUTO_INCREMENT,
  name       VARCHAR(100) NOT NULL,
  email      VARCHAR(150) NOT NULL,
  password   VARCHAR(255) NOT NULL,          -- bcrypt hash via password_hash()
  created_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  UNIQUE KEY uq_users_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Step 3: bookings ──────────────────────────────────────────
-- Event/party bookings created via booking.html
CREATE TABLE IF NOT EXISTS bookings (
  id                     INT           NOT NULL AUTO_INCREMENT,

  -- Who booked
  user_id                INT           NOT NULL,

  -- Package details
  package_id             VARCHAR(20)   NOT NULL,
  package_name           VARCHAR(100)  NOT NULL,
  package_price          DECIMAL(10,2) NOT NULL DEFAULT 0,
  guest_count            VARCHAR(50)   NOT NULL,
  staff_info             VARCHAR(100)  NOT NULL,

  -- Event preferences
  food_preference        VARCHAR(50)   NOT NULL,
  additional_services    JSON          NULL,      -- array of extra service keys

  -- Event schedule & location
  event_date             DATE          NOT NULL,
  event_time             TIME          NOT NULL,
  location_area          VARCHAR(100)  NOT NULL,
  specific_location      VARCHAR(255)  NOT NULL,

  -- Customer contact
  customer_name          VARCHAR(100)  NOT NULL,
  phone_number           VARCHAR(20)   NOT NULL,

  -- Pricing breakdown
  base_price             DECIMAL(10,2) NOT NULL DEFAULT 0,
  additional_cost        DECIMAL(10,2) NOT NULL DEFAULT 0,
  total_price            DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Admin workflow
  status                 ENUM('pending','confirmed','in_progress','completed','cancelled')
                                       NOT NULL DEFAULT 'pending',
  admin_notes            TEXT          NULL,

  -- Khalti payment (added by migration)
  payment_method         VARCHAR(20)   NOT NULL DEFAULT 'khalti',
  payment_status         VARCHAR(20)   NOT NULL DEFAULT 'pending',  -- pending | paid | failed
  khalti_pidx            VARCHAR(100)  NULL,
  khalti_transaction_id  VARCHAR(100)  NULL,

  created_at             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at             TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                                ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_bookings_user_id    (user_id),
  KEY idx_bookings_event_date (event_date),
  KEY idx_bookings_status     (status),
  KEY idx_bookings_khalti_pidx (khalti_pidx),

  CONSTRAINT fk_bookings_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ── Step 4: chef_bookings ─────────────────────────────────────
-- Chef hire bookings created via chef-booking.html
CREATE TABLE IF NOT EXISTS chef_bookings (
  id                INT           NOT NULL AUTO_INCREMENT,

  -- Who booked
  user_id           INT           NOT NULL,

  -- Chef details
  chef_count        VARCHAR(20)   NOT NULL,
  cuisine_type      VARCHAR(100)  NOT NULL,
  food_preference   VARCHAR(50)   NOT NULL,

  -- Event schedule & location
  event_date        DATE          NOT NULL,
  event_time        TIME          NOT NULL,
  location_area     VARCHAR(100)  NOT NULL,
  specific_location VARCHAR(255)  NOT NULL,

  -- Customer contact
  customer_name     VARCHAR(100)  NOT NULL,
  phone_number      VARCHAR(20)   NOT NULL,

  -- Pricing
  total_price       DECIMAL(10,2) NOT NULL DEFAULT 0,

  -- Admin workflow
  status            ENUM('pending','confirmed','in_progress','completed','cancelled')
                                  NOT NULL DEFAULT 'pending',
  admin_notes       TEXT          NULL,

  created_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP     NOT NULL DEFAULT CURRENT_TIMESTAMP
                                           ON UPDATE CURRENT_TIMESTAMP,

  PRIMARY KEY (id),
  KEY idx_chef_bookings_user_id    (user_id),
  KEY idx_chef_bookings_event_date (event_date),
  KEY idx_chef_bookings_status     (status),

  CONSTRAINT fk_chef_bookings_user
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ============================================================
--  DONE — all tables created.
--  See below for optional seed data (test user + admin note).
-- ============================================================


-- ── Optional: seed a test user (password = "test1234") ───────
-- Remove or comment out before going live.
INSERT IGNORE INTO users (name, email, password) VALUES (
  'Test User',
  'test@occasioner.com',
  '$2y$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uXC/y7Tfq'
  -- password is: test1234  (generated with password_hash)
);
