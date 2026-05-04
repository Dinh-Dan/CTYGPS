-- ==========================================================
-- Migration 021 — Co flag has_return cho orders
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Khai niem:
--   - has_return = 1 khi don da DONE nhung khach quay dau tra
--     hang (sinh phieu reason='order_return_done').
--   - Cancel don (chua done) van giu status='cancelled' —
--     khong dung cot nay; cot nay chi cho case "tra sau done".
--   - Filter nhanh "don co hang tra ve" qua idx_orders_has_return.
-- ==========================================================

USE gpsviet;

ALTER TABLE orders
  ADD COLUMN has_return TINYINT(1) NOT NULL DEFAULT 0 AFTER status,
  ADD INDEX idx_orders_has_return (has_return);

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM orders LIKE 'has_return';
--   SHOW INDEX  FROM orders WHERE Key_name = 'idx_orders_has_return';
-- ==========================================================
