-- Migration 011: tach label gia thanh bang `price_tiers` dung chung.
--
-- Truoc: product_prices.label la VARCHAR tu do, moi san pham nhap kieu khac nhau.
-- Sau:   price_tiers (id, code, name, sort_order, is_deleted)
--        product_prices.tier_id FK -> price_tiers.id
--        customers.default_tier_id FK -> price_tiers.id (gia mac dinh hien thi cho khach do)
--
-- Idempotent: chay lai khong fail (kiem tra tung buoc).

-- ----------------------------------------------------------
-- 1) Bang price_tiers
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS price_tiers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(40)  NOT NULL,
  name        VARCHAR(100) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_deleted  TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_tier_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3 tier mac dinh: ban le, ban si, dai ly. INSERT IGNORE de chay lai khong nhan.
INSERT IGNORE INTO price_tiers (code, name, sort_order) VALUES
  ('retail',    'Bán lẻ',  1),
  ('wholesale', 'Bán sỉ',  2),
  ('dealer',    'Đại lý',  3);

-- ----------------------------------------------------------
-- 2) Them cot tier_id vao product_prices (nullable luc dau de migrate data)
-- ----------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_prices' AND COLUMN_NAME = 'tier_id');
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE product_prices ADD COLUMN tier_id INT NULL AFTER product_id',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Map label hien co (khong dau / co dau) -> tier code
UPDATE product_prices pp
JOIN price_tiers t ON t.code = 'retail'
SET pp.tier_id = t.id
WHERE pp.tier_id IS NULL AND LOWER(pp.label) IN ('ban le', 'bán lẻ', 'banle');

UPDATE product_prices pp
JOIN price_tiers t ON t.code = 'wholesale'
SET pp.tier_id = t.id
WHERE pp.tier_id IS NULL AND LOWER(pp.label) IN ('ban si', 'bán sỉ', 'bansi', 'ban buon', 'bán buôn');

UPDATE product_prices pp
JOIN price_tiers t ON t.code = 'dealer'
SET pp.tier_id = t.id
WHERE pp.tier_id IS NULL AND LOWER(pp.label) IN ('dai ly', 'đại lý', 'daily');

-- Voi label la (khong khop tier nao): tao tier moi cho moi label distinct con lai.
-- Code = slug (a-z0-9, thay khoang trang bang -)
INSERT IGNORE INTO price_tiers (code, name, sort_order)
SELECT
  CONCAT('custom-', LOWER(REPLACE(REPLACE(REPLACE(label, ' ', '-'), '/', '-'), '_', '-'))),
  label,
  100
FROM (
  SELECT DISTINCT label FROM product_prices
   WHERE tier_id IS NULL AND label IS NOT NULL AND label <> ''
) t;

-- Gan tier_id cho cac row con lai (match theo name = label)
UPDATE product_prices pp
JOIN price_tiers t ON t.name = pp.label
SET pp.tier_id = t.id
WHERE pp.tier_id IS NULL;

-- Xoa cac row khong the migrate (label NULL hoac rong)
DELETE FROM product_prices WHERE tier_id IS NULL;

-- ----------------------------------------------------------
-- 3) Khoa tier_id NOT NULL + FK + unique (product_id, tier_id)
-- ----------------------------------------------------------
SET @null_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_prices'
    AND COLUMN_NAME = 'tier_id' AND IS_NULLABLE = 'YES');
SET @sql := IF(@null_exists > 0,
  'ALTER TABLE product_prices MODIFY COLUMN tier_id INT NOT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_prices'
    AND CONSTRAINT_NAME = 'fk_prices_tier');
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE product_prices ADD CONSTRAINT fk_prices_tier FOREIGN KEY (tier_id) REFERENCES price_tiers(id)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @uk_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_prices'
    AND CONSTRAINT_NAME = 'uniq_product_tier');
SET @sql := IF(@uk_exists = 0,
  'ALTER TABLE product_prices ADD CONSTRAINT uniq_product_tier UNIQUE (product_id, tier_id)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------
-- 4) Drop cot label cu (data da migrate xong)
-- ----------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_prices' AND COLUMN_NAME = 'label');
SET @sql := IF(@col_exists > 0,
  'ALTER TABLE product_prices DROP COLUMN label',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------
-- 5) Customers.default_tier_id (gia hien thi mac dinh cho khach hang/dai ly do)
-- ----------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'default_tier_id');
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE customers ADD COLUMN default_tier_id INT NULL AFTER discount_rate, ADD CONSTRAINT fk_cust_tier FOREIGN KEY (default_tier_id) REFERENCES price_tiers(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Mac dinh: type=retail -> tier 'retail', type=dealer -> tier 'dealer'
UPDATE customers c
JOIN price_tiers t ON t.code = 'retail'
SET c.default_tier_id = t.id
WHERE c.default_tier_id IS NULL AND c.type = 'retail';

UPDATE customers c
JOIN price_tiers t ON t.code = 'dealer'
SET c.default_tier_id = t.id
WHERE c.default_tier_id IS NULL AND c.type = 'dealer';
