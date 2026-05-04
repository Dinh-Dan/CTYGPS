-- ==========================================================
-- Migration 030 — Them cot created_at cho orders
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc dich:
--   - Trang admin/orders can hien va loc theo ngay tao don.
--   - Truoc do orders chi co confirmed_at (chi set khi admin chot don),
--     khong co gi de track ngay khach lap don.
--   - Them created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP — moi don moi
--     tu dong duoc fill, KHONG can sua INSERT statement nao.
-- Backfill:
--   - Don da co confirmed_at -> backfill created_at = confirmed_at (sat thuc te).
--   - Don con lai -> giu CURRENT_TIMESTAMP cua thoi diem chay migration
--     (chap nhan vi don pending_review thuong moi tao gan day).
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

ALTER TABLE orders
  ADD COLUMN created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP AFTER is_deleted,
  ADD INDEX idx_orders_created (created_at);

-- Backfill don cu: lay theo confirmed_at neu co, de lich su don gan dung thuc te.
UPDATE orders
   SET created_at = confirmed_at
 WHERE confirmed_at IS NOT NULL;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM orders LIKE 'created_at';
--   SELECT id, code, created_at, confirmed_at FROM orders ORDER BY id DESC LIMIT 5;
-- ==========================================================
