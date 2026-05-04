-- ==========================================================
-- Migration 006 — Mo rong Orders cho flow yeu cau/duyet/xuat kho
-- Chay 1 lan sau migration_005_technician.sql
-- ----------------------------------------------------------
-- Thay doi:
--   1. orders.status: them 'pending_review' va 'warehouse_released'
--   2. orders: them subtotal, creator_type, creator_id, confirmed_at, confirmed_by
--   3. task_attachments: them stage (receive/deliver/other)
--   4. Tao bang order_charges (phi linh hoat: ship/discount/fee)
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- 1. Mo rong orders
-- ----------------------------------------------------------
ALTER TABLE orders
  MODIFY COLUMN status ENUM(
    'pending_review','new','assigned','warehouse_released',
    'in_progress','done','cancelled'
  ) NOT NULL DEFAULT 'new',
  ADD COLUMN subtotal      BIGINT       NOT NULL DEFAULT 0 AFTER total_amount,
  ADD COLUMN creator_type  ENUM('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin' AFTER note,
  ADD COLUMN creator_id    INT          NULL AFTER creator_type,
  ADD COLUMN confirmed_at  DATETIME     NULL AFTER creator_id,
  ADD COLUMN confirmed_by  INT          NULL AFTER confirmed_at,
  ADD INDEX idx_orders_creator (creator_type, creator_id);

-- ----------------------------------------------------------
-- 2. Mo rong task_attachments: phan biet anh nhan/giao
-- ----------------------------------------------------------
ALTER TABLE task_attachments
  ADD COLUMN stage ENUM('receive','deliver','other') NOT NULL DEFAULT 'other' AFTER caption,
  ADD INDEX idx_attach_stage (task_id, stage);

-- ----------------------------------------------------------
-- 3. Bang order_charges — phi linh hoat tren don
--    kind='discount' luu amount AM (vi du -100000)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_charges (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT          NOT NULL,
  kind       ENUM('shipping','discount','fee') NOT NULL DEFAULT 'fee',
  label      VARCHAR(150) NOT NULL,
  amount     BIGINT       NOT NULL DEFAULT 0,
  is_deleted TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_charge_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_charge_order (order_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Backfill subtotal cho cac don da co (subtotal = total_amount neu chua co charges)
-- ----------------------------------------------------------
UPDATE orders SET subtotal = total_amount WHERE subtotal = 0 AND total_amount > 0;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM orders LIKE 'subtotal';
--   SHOW COLUMNS FROM orders LIKE 'creator_type';
--   DESCRIBE order_charges;
--   SHOW COLUMNS FROM task_attachments LIKE 'stage';
-- ==========================================================
