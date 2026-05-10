-- ==========================================================
-- Migration 046 — Tach orders.payment_status khoi orders.status
-- ----------------------------------------------------------
-- Truoc: orders.status la 1 chuoi gop trang thai quy trinh + thanh toan.
--   workflow:  pending_review / new / assigned / warehouse_released / in_progress / done
--   payment:   customer_owes / pending_admin_confirm / staff_owes / payment_reported
--              / quoted / awaiting_payment
-- Sau: tach 2 chieu de template-driven:
--   orders.status         (VARCHAR, do template dinh nghia)
--   orders.payment_status (ENUM, doc lap)
--
-- Backfill:
--   status IN (customer_owes, pending_admin_confirm, staff_owes)
--     -> status='done', payment_status = (status cu)
--   status='payment_reported'
--     -> status='done', payment_status='pending_admin_confirm'
--   status IN (quoted, awaiting_payment)
--     -> status='pending', payment_status='unpaid'  (don repair/renewal cu, gio template-less)
--   status='pending_review'
--     -> status='pending', payment_status='unpaid'
--   con lai (new, assigned, warehouse_released, in_progress, done, cancelled)
--     -> giu nguyen status, payment_status = 'unpaid' / 'paid' / 'partial' theo paid_amount
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- 1. Them cot payment_status (idempotent)
-- ----------------------------------------------------------
DROP PROCEDURE IF EXISTS m046_drop_col;
DELIMITER $$
CREATE PROCEDURE m046_drop_col(IN tbl VARCHAR(64), IN col VARCHAR(64))
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = tbl AND COLUMN_NAME = col) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` DROP COLUMN `', col, '`');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
DELIMITER ;

CALL m046_drop_col('orders', 'payment_status');

ALTER TABLE orders
  ADD COLUMN payment_status ENUM(
    'unpaid','partial','paid',
    'customer_owes','pending_admin_confirm','staff_owes',
    'refunded'
  ) NOT NULL DEFAULT 'unpaid' AFTER status,
  ADD INDEX idx_orders_payment_status (payment_status);

DROP PROCEDURE IF EXISTS m046_drop_col;

-- ----------------------------------------------------------
-- 2. Backfill payment_status + chuan hoa status legacy
-- ----------------------------------------------------------

-- 2.1 Don dang owe -> status='done', payment_status = (gia tri cu)
UPDATE orders
   SET payment_status = 'customer_owes', status = 'done'
 WHERE status = 'customer_owes';

UPDATE orders
   SET payment_status = 'pending_admin_confirm', status = 'done'
 WHERE status = 'pending_admin_confirm';

UPDATE orders
   SET payment_status = 'staff_owes', status = 'done'
 WHERE status = 'staff_owes';

UPDATE orders
   SET payment_status = 'pending_admin_confirm', status = 'done'
 WHERE status = 'payment_reported';

-- 2.2 Don repair/renewal cu (quoted/awaiting_payment) -> dua ve pending
UPDATE orders
   SET status = 'pending', payment_status = 'unpaid'
 WHERE status IN ('quoted', 'awaiting_payment');

-- 2.3 pending_review -> pending (system status moi)
UPDATE orders
   SET status = 'pending', payment_status = 'unpaid'
 WHERE status = 'pending_review';

-- 2.4 Cac don con lai: tinh payment_status theo paid_amount vs total_amount
UPDATE orders
   SET payment_status = CASE
       WHEN paid_amount <= 0                                 THEN 'unpaid'
       WHEN paid_amount > 0 AND paid_amount < total_amount   THEN 'partial'
       ELSE 'paid'
   END
 WHERE status NOT IN ('cancelled')
   AND payment_status = 'unpaid';     -- chi update don chua bi backfill o tren

-- Don cancelled giu payment_status='unpaid' (mac dinh)

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM orders LIKE 'payment_status';
--   SELECT status, payment_status, COUNT(*)
--     FROM orders WHERE is_deleted = 0
--     GROUP BY status, payment_status;
-- ==========================================================
