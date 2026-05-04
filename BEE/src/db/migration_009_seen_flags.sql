-- ==========================================================
-- Migration 009 — Co che "da xem" / "chua xem" cho admin notifications
-- CHAY 1 LAN sau migration_008.
-- ----------------------------------------------------------
-- Them cot seen_at cho 3 bang: inquiries, orders, customers.
--   seen_at IS NULL  -> CHUA xem (hien chom do + dem trong sidebar)
--   seen_at NOT NULL -> DA xem  (an khoi badge)
--
-- Khi admin GET /:id (mo chi tiet) -> BE auto SET seen_at = NOW().
-- ----------------------------------------------------------
-- Backfill: tat ca record cu coi nhu da xem (de bat dau "fresh"
-- thay vi hien hang chuc thong bao tu DB cu).
-- ==========================================================

USE gpsviet;

ALTER TABLE inquiries
  ADD COLUMN seen_at DATETIME NULL AFTER status,
  ADD INDEX idx_inquiries_seen (seen_at);

ALTER TABLE orders
  ADD COLUMN seen_at DATETIME NULL AFTER status,
  ADD INDEX idx_orders_seen (seen_at);

ALTER TABLE customers
  ADD COLUMN seen_at DATETIME NULL AFTER is_deleted,
  ADD INDEX idx_customers_seen (seen_at);

-- Backfill: record cu = da xem
UPDATE inquiries SET seen_at = NOW() WHERE seen_at IS NULL;
UPDATE orders    SET seen_at = NOW() WHERE seen_at IS NULL;
UPDATE customers SET seen_at = NOW() WHERE seen_at IS NULL;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM inquiries LIKE 'seen_at';
--   SELECT COUNT(*) FROM inquiries WHERE seen_at IS NULL;
-- ==========================================================
