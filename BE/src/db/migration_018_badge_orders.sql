-- ==========================================================
-- Migration 018 — Gop phu hieu xe vao orders
-- Chay 1 lan sau migration_017_chat_unified.sql
-- ----------------------------------------------------------
-- 1. orders.service_kind: them gia tri 'badge'
-- 2. badges: them order_id (FK orders.id) — moi badge gan voi 1 order shell
--    Don shell co service_kind='badge', items rong, fee day vao order_charges
-- 3. Backfill: tao order shell cho cac badge da co (neu co du lieu cu)
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- 1. Mo rong enum service_kind
-- ----------------------------------------------------------
ALTER TABLE orders
  MODIFY COLUMN service_kind
    ENUM('install','maintenance','warranty','renewal','badge')
    NOT NULL DEFAULT 'install';

-- ----------------------------------------------------------
-- 2. Them badges.order_id
-- ----------------------------------------------------------
ALTER TABLE badges
  ADD COLUMN order_id INT NULL AFTER dealer_id,
  ADD CONSTRAINT fk_badge_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD INDEX idx_badge_order (order_id);

-- ----------------------------------------------------------
-- 3. Backfill: tao order shell cho cac badge chua co order_id
--    (chay duoc neu DB da co badge cu — bo qua neu khong co)
-- ----------------------------------------------------------
-- Tao order shell tu badge: code OPH-NN, total = fee_amount, paid = paid_amount
INSERT INTO orders
  (code, customer_id, dealer_id, total_amount, subtotal, paid_amount,
   payment_method, status, service_kind, vehicle_plate, note,
   creator_type, creator_id, is_deleted)
SELECT
  CONCAT('O', b.code),                       -- OPH-DDMM-NNN
  b.customer_id, b.dealer_id,
  b.fee_amount, b.fee_amount, b.paid_amount,
  'cash',
  CASE
    WHEN b.status = 'cancelled' THEN 'cancelled'
    WHEN b.status = 'delivered' THEN 'done'
    WHEN b.status = 'pending_review' THEN 'pending_review'
    ELSE 'new'
  END,
  'badge',
  b.vehicle_plate,
  CONCAT('[Auto] Don phu hieu ', b.code),
  b.creator_type, b.creator_id,
  b.is_deleted
FROM badges b
WHERE b.order_id IS NULL;

-- Gan order_id nguoc lai cho badges
UPDATE badges b
JOIN orders o ON o.code = CONCAT('O', b.code)
SET b.order_id = o.id
WHERE b.order_id IS NULL;

-- Tao order_charge cho cac badge co fee_amount > 0
INSERT INTO order_charges (order_id, kind, label, amount)
SELECT b.order_id, 'fee',
       CONCAT('Phi phu hieu xe ', b.vehicle_plate),
       b.fee_amount
FROM badges b
WHERE b.order_id IS NOT NULL
  AND b.fee_amount > 0
  AND NOT EXISTS (
    SELECT 1 FROM order_charges c
    WHERE c.order_id = b.order_id AND c.is_deleted = 0
  );

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM orders LIKE 'service_kind';
--   SHOW COLUMNS FROM badges LIKE 'order_id';
--   SELECT b.code, b.order_id, o.code FROM badges b LEFT JOIN orders o ON o.id = b.order_id;
-- ==========================================================
