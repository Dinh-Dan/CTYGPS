-- ==========================================================
-- Migration 031 — Bo sung cho don gia han
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Thay doi:
--   1. order_items: them cot phone (SDT lien lac per dong xe, optional)
--   2. Seed san pham RENEW (Phi gia han dich vu GPS) — admin khong can
--      chon thiet bi nua, BE tu fill product_id = ID cua RENEW khi
--      bao gia don gia han.
--
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

-- 1) Them cot phone vao order_items (renewal: SDT lien lac per xe; install: NULL)
ALTER TABLE order_items
  ADD COLUMN phone VARCHAR(20) NULL AFTER years;

-- 1.b) Mo rong vehicle_plate de chua nhieu bien so cach nhau dau phay
--      (vd: "51A-123, 51B-456"). Tu 30 -> 200 ky tu.
ALTER TABLE order_items
  MODIFY COLUMN vehicle_plate VARCHAR(200) NULL;

-- 2) Seed san pham mac dinh cho gia han.
-- Dung INSERT IGNORE de chay lai khong loi (UNIQUE code).
-- category_id = NULL (cho phep) — admin co the gan category sau o trang Products.
INSERT IGNORE INTO products (code, name, warranty_months, cost_price, is_deleted)
VALUES ('RENEW', 'Phí gia hạn dịch vụ GPS', 0, 0, 0);

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM order_items LIKE 'phone';
--   SELECT id, code, name FROM products WHERE code = 'RENEW';
-- ==========================================================
