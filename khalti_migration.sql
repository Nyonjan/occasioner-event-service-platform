-- ============================================================
-- Khalti Payment Integration — DB Migration
-- Run this once on your occasioner_db database
-- ============================================================

-- Add Khalti payment columns to the bookings table
ALTER TABLE bookings
  ADD COLUMN IF NOT EXISTS payment_method        VARCHAR(20)  NOT NULL DEFAULT 'khalti'  COMMENT 'Payment gateway used',
  ADD COLUMN IF NOT EXISTS payment_status        VARCHAR(20)  NOT NULL DEFAULT 'pending' COMMENT 'pending | paid | failed | refunded',
  ADD COLUMN IF NOT EXISTS khalti_pidx           VARCHAR(100) NULL     COMMENT 'Khalti payment identifier (pidx)',
  ADD COLUMN IF NOT EXISTS khalti_transaction_id VARCHAR(100) NULL     COMMENT 'Khalti transaction ID after successful payment';

-- Optional: index for quick lookup by pidx (e.g., for reconciliation)
CREATE INDEX IF NOT EXISTS idx_bookings_khalti_pidx ON bookings (khalti_pidx);

-- ============================================================
-- If your MySQL version does not support ADD COLUMN IF NOT EXISTS,
-- use the version below instead (MySQL < 8.0):
-- ============================================================
/*
ALTER TABLE bookings
  ADD COLUMN payment_method        VARCHAR(20)  NOT NULL DEFAULT 'khalti',
  ADD COLUMN payment_status        VARCHAR(20)  NOT NULL DEFAULT 'pending',
  ADD COLUMN khalti_pidx           VARCHAR(100) NULL,
  ADD COLUMN khalti_transaction_id VARCHAR(100) NULL;
*/
