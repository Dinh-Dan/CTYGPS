-- ==========================================================
-- Migration 050 — Bo sung anh chung tu thanh toan + co thu ho dai li
-- ----------------------------------------------------------
-- 1. orders.collected_for_dealer
--    TINYINT(1) — danh dau don dang "thu ho dai li" de loc bao cao.
--    Tick khi admin xac nhan thanh toan (trong markPaid modal).
--
-- 2. order_payments.proof_urls
--    JSON — mang URL anh chung tu (imgbb) cho moi phieu thu admin.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- Helper: them cot neu chua co (idempotent)
-- ----------------------------------------------------------
DROP PROCEDURE IF EXISTS m050_add_col;
DELIMITER $$
CREATE PROCEDURE m050_add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl TEXT)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = tbl AND COLUMN_NAME = col) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN ', ddl);
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
DELIMITER ;

CALL m050_add_col('orders', 'collected_for_dealer',
  '`collected_for_dealer` TINYINT(1) NOT NULL DEFAULT 0 AFTER `payment_status`');

CALL m050_add_col('order_payments', 'proof_urls',
  '`proof_urls` JSON NULL DEFAULT NULL AFTER `note`');

-- Index de loc nhanh
DROP PROCEDURE IF EXISTS m050_add_idx;
DELIMITER $$
CREATE PROCEDURE m050_add_idx()
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.STATISTICS
                  WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = 'orders'
                    AND INDEX_NAME = 'idx_orders_collected_for_dealer') THEN
    ALTER TABLE orders ADD INDEX idx_orders_collected_for_dealer (collected_for_dealer);
  END IF;
END$$
DELIMITER ;
CALL m050_add_idx();

DROP PROCEDURE IF EXISTS m050_add_col;
DROP PROCEDURE IF EXISTS m050_add_idx;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM orders LIKE 'collected_for_dealer';
--   SHOW COLUMNS FROM order_payments LIKE 'proof_urls';
-- ==========================================================
