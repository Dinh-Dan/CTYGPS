-- ==========================================================
-- Migration 049 — Them VAT cho tung san pham trong don
-- ----------------------------------------------------------
-- Moi item co VAT % rieng (thuong la 0/8/10).
-- Tong tien don = sum(qty * unit_price * (1 + vat/100)) + sum(charges).
-- ==========================================================

USE gpsviet;

-- vat_percent: % thue VAT (0 / 8 / 10 / ...). DECIMAL(5,2) du cho 0.00 - 999.99
ALTER TABLE order_items
  ADD COLUMN vat_percent DECIMAL(5,2) NOT NULL DEFAULT 0 AFTER unit_price;

-- ==========================================================
-- DONE.
-- Kiem tra: SHOW COLUMNS FROM order_items LIKE 'vat_percent';
-- ==========================================================
