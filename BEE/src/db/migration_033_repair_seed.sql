-- ==========================================================
-- Migration 033 — Seed san pham mac dinh cho sua chua
-- Chay 1 lan sau migration_032_repair_orders.sql
-- ----------------------------------------------------------
-- Tao product 'REPAIR_SERVICE' (Cong sua chua GPS) — admin co the chon
-- nhanh khi nhap charge "Cong sua" tren don SC. Tuong tu pattern 'RENEW'
-- da seed o migration_031.
-- INSERT IGNORE de chay lai khong loi (UNIQUE code).
-- category_id = NULL — admin co the gan category sau o trang Products.
-- ==========================================================

USE gpsviet;

INSERT IGNORE INTO products (code, name, warranty_months, cost_price, is_deleted)
VALUES ('REPAIR_SERVICE', 'Công sửa chữa GPS', 0, 0, 0);

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SELECT id, code, name FROM products WHERE code = 'REPAIR_SERVICE';
-- ==========================================================
