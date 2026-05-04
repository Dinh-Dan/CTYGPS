-- Migration 012: them flag is_default cho price_tiers.
--
-- Thay the cho hardcode `code='retail'` o public.js / customer.js / daily.js.
-- Admin co the chon BAT KY tier nao lam mac dinh hien thi (cho khach public + fallback).
--
-- Rang buoc: chi 1 tier co is_default=1 tai 1 thoi diem.
-- Cach lam: generated column `default_marker = IF(is_default=1, 1, NULL) STORED`
--           + UNIQUE(default_marker). NULL khong tinh trong unique -> hop le.
--
-- Idempotent.

-- ----------------------------------------------------------
-- 1) Them cot is_default
-- ----------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'price_tiers' AND COLUMN_NAME = 'is_default');
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE price_tiers ADD COLUMN is_default TINYINT(1) NOT NULL DEFAULT 0 AFTER sort_order',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------
-- 2) Them generated column de enforce unique chi 1 default
-- ----------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'price_tiers' AND COLUMN_NAME = 'default_marker');
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE price_tiers ADD COLUMN default_marker TINYINT(1) GENERATED ALWAYS AS (IF(is_default=1, 1, NULL)) STORED',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @uk_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'price_tiers' AND INDEX_NAME = 'uniq_default_tier');
SET @sql := IF(@uk_exists = 0,
  'ALTER TABLE price_tiers ADD UNIQUE KEY uniq_default_tier (default_marker)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------
-- 3) Set tier 'retail' lam default neu chua co tier nao default
-- ----------------------------------------------------------
SET @has_default := (SELECT COUNT(*) FROM price_tiers WHERE is_default = 1);
UPDATE price_tiers SET is_default = 1
  WHERE @has_default = 0 AND code = 'retail' AND is_deleted = 0;
