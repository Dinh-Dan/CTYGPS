-- ==========================================================
-- Migration 027 — ROLLBACK migration 026 (bo phuong an qty_refused / pending_confirm)
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Ly do: chuyen sang phuong an don gian hon (nut chinh gia + co che returns
-- san co), khong can them schema rieng cho "khach KHONG nhan".
-- ==========================================================

USE gpsviet;

-- 1) order_items: bo qty_refused
ALTER TABLE order_items
  DROP CONSTRAINT chk_oi_refused_le_qty,
  DROP COLUMN qty_refused;

-- 2) stock_receipts: bo pending_confirm
ALTER TABLE stock_receipts
  DROP INDEX idx_receipts_pending,
  DROP COLUMN pending_confirm;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM order_items LIKE 'qty_refused';      -- empty
--   SHOW COLUMNS FROM stock_receipts LIKE 'pending_confirm'; -- empty
-- ==========================================================
