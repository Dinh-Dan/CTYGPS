-- ==========================================================
-- Setup Phase 3 — Bo sung san pham mau cho trang customer
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ==========================================================
USE gpsviet;

-- categories da co (Dinh vi=1, Camera nghi dinh 10=2, Sim=3, Phu kien=4)
-- Neu chua co thi tao
INSERT IGNORE INTO categories (id, name) VALUES
  (1, 'Dinh vi'),
  (2, 'Camera nghi dinh 10'),
  (3, 'Sim'),
  (4, 'Phu kien');

-- 5 san pham mau (id 2..6 — id=1 da seed VT-01 tu lan dau)
INSERT IGNORE INTO products
  (id, code, name, category_id, warranty_months, cost_price, description)
VALUES
  (2, 'VT-02', 'Dinh vi xe o to VT-02 Pro', 1, 24, 1500000,
   'Dinh vi 4G, chong nuoc IP67, hanh trinh 90 ngay, canh bao toc do.'),
  (3, 'HD-10', 'Camera hanh trinh HD-10', 2, 12, 2200000,
   'Camera 1 mat 1080P, ghi hinh lien tuc 24/7.'),
  (4, 'HD-20', 'Camera 4 mat HD-20 (NĐ10)', 2, 12, 5500000,
   'Bo camera 4 mat + dau ghi MDVR chuan Nghi dinh 10.'),
  (5, 'SIM-VT', 'Sim 4G Vinaphone du lieu', 3, 12, 90000,
   'Sim chuyen dung cho thiet bi dinh vi, da kich hoat.'),
  (6, 'AC-CABLE', 'Day nguon 3 loi 5m', 4, 6, 50000,
   'Day nguon DC 9-36V cho thiet bi dinh vi xe may.');

-- Gia retail (sort_order=1) cho moi san pham
INSERT IGNORE INTO product_prices (product_id, label, price, sort_order) VALUES
  (2, 'Ban le', 2200000, 1), (2, 'Ban si', 1900000, 2), (2, 'Dai ly', 1800000, 3),
  (3, 'Ban le', 2890000, 1), (3, 'Ban si', 2500000, 2),
  (4, 'Ban le', 7500000, 1), (4, 'Ban si', 6800000, 2), (4, 'Dai ly', 6500000, 3),
  (5, 'Ban le', 150000, 1),
  (6, 'Ban le', 80000, 1);

-- Vai thuoc tinh mau cho VT-02
INSERT IGNORE INTO product_attributes (product_id, label, value, sort_order) VALUES
  (2, 'Nguon', 'DC 9-36V', 1),
  (2, 'Pin du phong', '500mAh', 2),
  (2, 'Chong nuoc', 'IP67', 3),
  (2, 'Mang', '4G LTE', 4);

-- ==========================================================
-- DONE. Kiem tra:
--   SELECT p.code, p.name, c.name AS cat, pp.price FROM products p
--   LEFT JOIN categories c ON p.category_id=c.id
--   LEFT JOIN product_prices pp ON p.id=pp.product_id AND pp.sort_order=1
--   WHERE p.is_deleted=0;
-- ==========================================================
