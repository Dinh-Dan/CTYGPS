-- Fix VPS: them cac cot con thieu vao staff_receipts
-- Chay tren VPS: copy noi dung nay paste vao MySQL console

ALTER TABLE `staff_receipts`
  ADD COLUMN IF NOT EXISTS `status` ENUM('active','cancelled') NOT NULL DEFAULT 'active',
  ADD COLUMN IF NOT EXISTS `cancel_reason` TEXT NULL,
  ADD COLUMN IF NOT EXISTS `cancelled_by` INT NULL,
  ADD COLUMN IF NOT EXISTS `cancelled_at` DATETIME NULL;
