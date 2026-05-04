-- ==========================================================
-- GPS Viet — Du lieu mau (chay sau khi tao bang)
-- Co the chay nhieu lan, nhung se tao trung — chi nen chay 1 lan
-- ==========================================================

USE gpsviet;

-- Danh muc mau
INSERT INTO categories (name) VALUES
  ('Dinh vi'),
  ('Camera nghi dinh 10'),
  ('Sim'),
  ('Phu kien');

-- 1 san pham mau de test
INSERT INTO products (code, name, category_id, warranty_months, cost_price, description)
VALUES ('VT-01', 'Thiet bi dinh vi VT-01', 1, 12, 1200000, 'Thiet bi dinh vi xe may, nguon DC 9-36V');

SET @pid = LAST_INSERT_ID();

INSERT INTO product_prices (product_id, label, price, sort_order) VALUES
  (@pid, 'Ban le', 1490000, 1),
  (@pid, 'Ban si', 1300000, 2),
  (@pid, 'Dai ly', 1250000, 3);

INSERT INTO product_attributes (product_id, label, value, sort_order) VALUES
  (@pid, 'Nguon', 'DC 9-36V', 1),
  (@pid, 'Pin', 'Lithium 500mAh', 2),
  (@pid, 'Cong dau ra', 'ACC, GND', 3);

-- ----------------------------------------------------------
-- Khach hang mau (2 khach le + 2 dai ly)
-- ----------------------------------------------------------
INSERT INTO customers (code, type, full_name, phone, email, address, note)
VALUES
  ('KH001', 'retail', 'Nguyen Van An',  '0901111111', 'an.nv@example.com', 'Ha Noi', 'Khach le mau'),
  ('KH002', 'retail', 'Tran Thi Binh',  '0902222222', NULL,                'Hai Phong', NULL);

INSERT INTO customers
  (code, type, full_name, phone, email, address, company_name, tax_code, contact_person, debt_limit, credit_term_days, discount_rate, note)
VALUES
  ('DL001', 'dealer', 'Le Van Cuong', '0903333333', 'cuong@gpshanoi.vn', 'Ha Noi',
   'Cong ty TNHH GPS Ha Noi', '0101234567', 'Le Van Cuong', 50000000, 30, 5.00, 'Dai ly cap 1'),
  ('DL002', 'dealer', 'Pham Thi Dung', '0904444444', 'dung@gpsdanang.vn', 'Da Nang',
   'GPS Mien Trung',          '0107654321', 'Pham Thi Dung', 30000000, 15, 3.00, 'Dai ly cap 2');
