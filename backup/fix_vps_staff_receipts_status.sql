-- ============================================================
-- Fix VPS: them cot status cho staff_receipts neu chua co
-- Chay tren VPS: mysql -u root -p gpsviet < fix_vps_staff_receipts_status.sql
-- An toan: dung IGNORE de bo qua neu cot da ton tai (MySQL 5.7+)
-- Hoac chay tung lenh, bo qua lenh nao bao "Duplicate column name"
-- ============================================================

-- Kiem tra truoc khi chay:
-- SHOW COLUMNS FROM staff_receipts LIKE 'status';

-- Them cot status
ALTER TABLE staff_receipts
  ADD COLUMN IF NOT EXISTS status ENUM('active','cancelled') NOT NULL DEFAULT 'active' AFTER reviewed;

-- Them cot cancel_reason
ALTER TABLE staff_receipts
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT NULL;

-- Them cot cancelled_by
ALTER TABLE staff_receipts
  ADD COLUMN IF NOT EXISTS cancelled_by INT NULL;

-- Them cot cancelled_at
ALTER TABLE staff_receipts
  ADD COLUMN IF NOT EXISTS cancelled_at DATETIME NULL;

-- Them index (bo qua neu da co)
ALTER IGNORE TABLE staff_receipts
  ADD INDEX idx_sr_status (status, created_at);

-- Kiem tra lai sau khi chay:
-- SHOW COLUMNS FROM staff_receipts;
