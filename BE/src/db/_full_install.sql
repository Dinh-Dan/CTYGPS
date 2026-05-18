-- ==========================================================
-- GPS Viet - Full install (gop tat ca migrations)
-- BO QUA migration_027 (rollback cua mig 026 - mig 026 khong ton tai)
-- Cach dung:
--   1. CREATE DATABASE gpsviet CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
--   2. Import file nay (chon DB gpsviet)
-- ==========================================================
SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS=0;


-- ==========================================================
-- FILE: schema.sql
-- ==========================================================

-- ==========================================================
-- GPS Viet — Schema database
-- Chay file nay 1 lan dau de tao bang
-- ==========================================================

CREATE DATABASE IF NOT EXISTS gpsviet
  CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

USE gpsviet;

-- ----------------------------------------------------------
-- Bang: categories — danh muc san pham
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS categories (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(100) NOT NULL,
  is_deleted  TINYINT(1) NOT NULL DEFAULT 0
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: products — san pham
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS products (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(50)  NOT NULL UNIQUE,    -- ma thiet bi: VT-01, HD-20...
  name            VARCHAR(255) NOT NULL,
  category_id     INT NULL,
  image_url       VARCHAR(500) NULL,               -- anh chinh
  thumbnail_url   VARCHAR(500) NULL,               -- anh mini auto-resize tu anh chinh
  warranty_months INT          NOT NULL DEFAULT 12,
  cost_price      BIGINT       NOT NULL DEFAULT 0, -- gia goc (VND)
  description     TEXT NULL,
  is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_products_category
    FOREIGN KEY (category_id) REFERENCES categories(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_products_category (category_id),
  INDEX idx_products_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: product_prices — cac muc gia ban (label - value dong)
-- VD: "Ban le" - 1490000, "Ban si" - 1300000
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_prices (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  label       VARCHAR(100) NOT NULL,
  price       BIGINT       NOT NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  CONSTRAINT fk_prices_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_prices_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: product_attributes — thong tin them (label - value dong)
-- VD: "Nguon" - "DC 9-36V", "Pin" - "Lithium 500mAh"
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_attributes (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  label       VARCHAR(100) NOT NULL,
  value       VARCHAR(500) NULL,
  sort_order  INT          NOT NULL DEFAULT 0,
  CONSTRAINT fk_attrs_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_attrs_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: customers — khach hang (gom khach le + dai ly)
-- Phan biet bang cot `type`:
--   'retail' = khach le (it tinh nang)
--   'dealer' = dai ly (mua nhieu, co cong no, han muc)
-- Cac cot dai-ly chi co gia tri khi type = 'dealer', con lai NULL/0
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  code              VARCHAR(50)  NOT NULL UNIQUE,         -- KH001, DL001...
  type              ENUM('retail','dealer') NOT NULL DEFAULT 'retail',

  -- Thong tin chung
  full_name         VARCHAR(255) NOT NULL,                -- ten KH / nguoi lien he
  phone             VARCHAR(20)  NULL,
  email             VARCHAR(150) NULL,
  address           VARCHAR(500) NULL,
  avatar_url        VARCHAR(500) NULL,
  note              TEXT NULL,

  -- Rieng cho dealer (NULL voi retail)
  company_name      VARCHAR(255) NULL,                    -- ten cong ty / cua hang
  tax_code          VARCHAR(50)  NULL,                    -- ma so thue
  contact_person    VARCHAR(255) NULL,                    -- nguoi lien he khac (neu khac full_name)
  debt_limit        BIGINT       NOT NULL DEFAULT 0,      -- han muc no toi da (VND)
  credit_term_days  INT          NOT NULL DEFAULT 0,      -- so ngay duoc no
  discount_rate     DECIMAL(5,2) NOT NULL DEFAULT 0,      -- % chiet khau mac dinh

  -- Mat khau (chi dung cho dealer; retail dang nhap chi bang phone)
  password_hash     VARCHAR(255) NULL,

  is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_customers_type    (type),
  INDEX idx_customers_deleted (is_deleted),
  INDEX idx_customers_phone   (phone),
  INDEX idx_customers_name    (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: staff — nhan vien noi bo (admin, ky thuat)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          ENUM('admin','kithuat') NOT NULL DEFAULT 'kithuat',
  phone         VARCHAR(20)  NULL,
  email         VARCHAR(150) NULL,
  avatar_url    VARCHAR(500) NULL,
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_staff_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================
-- FILE: setup_phase2.sql
-- ==========================================================

-- ==========================================================
-- Setup Phase 2 — Customers + Staff + Auth
-- ----------------------------------------------------------
-- Chay file nay 1 lan trong phpMyAdmin (tab SQL cua database gpsviet)
-- Hoac qua command line:
--   mysql -u root gpsviet < setup_phase2.sql
--
-- Sau do tu thu muc BE/ chay:
--   npm run init-admin
-- de tao admin mac dinh + dat password cho dealer mau.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- Bang: customers (khach le + dai ly, phan biet bang `type`)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS customers (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  code              VARCHAR(50)  NOT NULL UNIQUE,
  type              ENUM('retail','dealer') NOT NULL DEFAULT 'retail',

  full_name         VARCHAR(255) NOT NULL,
  phone             VARCHAR(20)  NULL,
  email             VARCHAR(150) NULL,
  address           VARCHAR(500) NULL,
  avatar_url        VARCHAR(500) NULL,
  note              TEXT NULL,

  company_name      VARCHAR(255) NULL,
  tax_code          VARCHAR(50)  NULL,
  contact_person    VARCHAR(255) NULL,
  debt_limit        BIGINT       NOT NULL DEFAULT 0,
  credit_term_days  INT          NOT NULL DEFAULT 0,
  discount_rate     DECIMAL(5,2) NOT NULL DEFAULT 0,

  password_hash     VARCHAR(255) NULL,

  is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,
  created_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at        TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  INDEX idx_customers_type    (type),
  INDEX idx_customers_deleted (is_deleted),
  INDEX idx_customers_phone   (phone),
  INDEX idx_customers_name    (full_name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: staff (admin / kithuat)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          ENUM('admin','kithuat') NOT NULL DEFAULT 'kithuat',
  phone         VARCHAR(20)  NULL,
  email         VARCHAR(150) NULL,
  avatar_url    VARCHAR(500) NULL,
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_staff_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Du lieu mau: 2 khach le + 2 dai ly
-- INSERT IGNORE de chay nhieu lan khong loi (code la UNIQUE)
-- ----------------------------------------------------------
INSERT IGNORE INTO customers (code, type, full_name, phone, email, address, note)
VALUES
  ('KH001', 'retail', 'Nguyen Van An',  '0901111111', 'an.nv@example.com', 'Ha Noi',    'Khach le mau'),
  ('KH002', 'retail', 'Tran Thi Binh',  '0902222222', NULL,                'Hai Phong', NULL);

INSERT IGNORE INTO customers
  (code, type, full_name, phone, email, address,
   company_name, tax_code, contact_person,
   debt_limit, credit_term_days, discount_rate, note)
VALUES
  ('DL001', 'dealer', 'Le Van Cuong',  '0903333333', 'cuong@gpshanoi.vn', 'Ha Noi',
   'Cong ty TNHH GPS Ha Noi', '0101234567', 'Le Van Cuong',
   50000000, 30, 5.00, 'Dai ly cap 1'),
  ('DL002', 'dealer', 'Pham Thi Dung', '0904444444', 'dung@gpsdanang.vn', 'Da Nang',
   'GPS Mien Trung',          '0107654321', 'Pham Thi Dung',
   30000000, 15, 3.00, 'Dai ly cap 2');

-- ==========================================================
-- DONE.
-- Buoc cuoi (chay tu BE/): npm run init-admin
-- ==========================================================


-- ==========================================================
-- FILE: migration_002_auth.sql
-- ==========================================================

-- ==========================================================
-- Migration 002 — Auth & accounts
-- Chay file nay sau khi schema.sql da apply tu lan dau (tranh
-- mat data customers da nhap vao db).
-- ==========================================================

USE gpsviet;

-- Them cot password_hash cho customers (chi dealer su dung)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER discount_rate;

-- Bang staff (admin, ky thuat)
CREATE TABLE IF NOT EXISTS staff (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          ENUM('admin','kithuat') NOT NULL DEFAULT 'kithuat',
  phone         VARCHAR(20)  NULL,
  email         VARCHAR(150) NULL,
  avatar_url    VARCHAR(500) NULL,
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_staff_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================
-- FILE: migration_003_inventory.sql
-- ==========================================================

-- ==========================================================
-- Migration 003 — Kho & Nha Cung Cap
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Nguyen tac:
--   - 1 kho duy nhat (khong tach bang warehouses)
--   - Moi thiet bi vat ly = 1 record trong stock_items
--   - identifier (IMEI/serial/so SIM) optional — luc co luc khong
--   - Ton kho theo product = COUNT(*) WHERE status='available'
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- Bang: suppliers — Nha Cung Cap (NCC)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS suppliers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(255) NOT NULL,
  phone       VARCHAR(20)  NULL,
  address     VARCHAR(500) NULL,
  note        TEXT         NULL,
  is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
  INDEX idx_suppliers_deleted (is_deleted),
  INDEX idx_suppliers_name    (name)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: stock_items — moi record = 1 thiet bi vat ly
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  product_id    INT NOT NULL,
  supplier_id   INT NULL,
  identifier    VARCHAR(100) NULL,                       -- IMEI / serial / so SIM
  status        ENUM('available','reserved','sold','damaged','returned')
                NOT NULL DEFAULT 'available',
  import_price  BIGINT       NULL,                       -- gia nhap thuc te
  import_date   DATE         NULL,
  note          TEXT         NULL,                       -- VD: "Lock IP - Add TK Skycool"
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_stock_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_stock_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  -- identifier UNIQUE khi co gia tri (MySQL cho phep nhieu NULL trong UNIQUE INDEX)
  UNIQUE INDEX uq_stock_identifier (identifier),
  INDEX idx_stock_product   (product_id),
  INDEX idx_stock_supplier  (supplier_id),
  INDEX idx_stock_status    (status),
  INDEX idx_stock_deleted   (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: warehouse_logs — log moi giao dich nhap/xuat
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS warehouse_logs (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  stock_item_id   INT NOT NULL,
  kind            ENUM('in','out','damaged','returned') NOT NULL,
  reason          VARCHAR(500) NULL,
  order_id        INT NULL,                              -- gan voi orders sau nay
  staff_id        INT NULL,                              -- ai thuc hien
  created_at      TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_log_stock
    FOREIGN KEY (stock_item_id) REFERENCES stock_items(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_log_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_log_stock   (stock_item_id),
  INDEX idx_log_kind    (kind),
  INDEX idx_log_order   (order_id),
  INDEX idx_log_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Du lieu mau (chay duoc nhieu lan, dung INSERT IGNORE)
-- ----------------------------------------------------------

-- 2 NCC mau
INSERT IGNORE INTO suppliers (id, name, phone, address, note) VALUES
  (1, 'Cong ty TNHH An Khang',  '0281234567', '123 Le Loi, Q.1, TP.HCM', 'NCC chinh thiet bi dinh vi'),
  (2, 'Skycool Vietnam',         '0287654321', '45 Tran Hung Dao, Ha Noi', 'NCC camera + dau ghi MDVR');

-- Vai stock_item mau gan vao san pham VT-01 (id=1) tu seed.sql ban dau
-- Neu chua co product VT-01 thi cau insert nay se loi FK — bo qua bang INSERT IGNORE
INSERT IGNORE INTO stock_items
  (product_id, supplier_id, identifier, status, import_price, import_date, note)
VALUES
  (1, 1, '868290000000001', 'available', 1200000, '2026-04-10', NULL),
  (1, 1, '868290000000002', 'available', 1200000, '2026-04-10', NULL),
  (1, 1, '868290000000003', 'available', 1200000, '2026-04-10', 'Hang demo'),
  (1, 1, NULL,              'available', 1200000, '2026-04-10', 'Phu kien khong co IMEI');

-- ==========================================================
-- DONE.
-- Kiem tra: SELECT COUNT(*) FROM stock_items WHERE status='available';
-- ==========================================================


-- ==========================================================
-- FILE: setup_phase3_products.sql
-- ==========================================================

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


-- ==========================================================
-- FILE: migration_004_orders.sql
-- ==========================================================

-- ==========================================================
-- Migration 004 — Don hang (orders)
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- Phai chay TRUOC migration_005_technician.sql
-- ----------------------------------------------------------
-- Nguyen tac:
--   - 1 don = 1 record orders + nhieu order_items
--   - code orders auto sinh format ORD-DDMM-NNN (BE sinh)
--   - dealer_id NULL voi don ban le; FK ve customers (vi dealer cung la 1 row trong customers type='dealer')
--   - Don tao xong se sinh task (migration 005) de phan cong KTV
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- Bang: orders — don hang
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS orders (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  code            VARCHAR(30)  NOT NULL UNIQUE,            -- ORD-2604-001
  customer_id     INT          NOT NULL,
  dealer_id       INT          NULL,                       -- order qua dai ly thi gan o day
  total_amount    BIGINT       NOT NULL DEFAULT 0,
  paid_amount     BIGINT       NOT NULL DEFAULT 0,
  payment_method  ENUM('cash','transfer','debt') NOT NULL DEFAULT 'cash',
  status          ENUM('new','assigned','in_progress','done','cancelled')
                  NOT NULL DEFAULT 'new',
  address         VARCHAR(500) NULL,
  vehicle_plate   VARCHAR(30)  NULL,                       -- bien so xe (don lap GPS)
  note            TEXT         NULL,
  is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_orders_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_orders_dealer
    FOREIGN KEY (dealer_id) REFERENCES customers(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_orders_status   (status),
  INDEX idx_orders_customer (customer_id),
  INDEX idx_orders_dealer   (dealer_id),
  INDEX idx_orders_deleted  (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: order_items — chi tiet san pham trong don
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_items (
  id           INT AUTO_INCREMENT PRIMARY KEY,
  order_id     INT    NOT NULL,
  product_id   INT    NOT NULL,
  qty          INT    NOT NULL DEFAULT 1,
  unit_price   BIGINT NOT NULL DEFAULT 0,

  CONSTRAINT fk_oi_order
    FOREIGN KEY (order_id)   REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_oi_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  INDEX idx_oi_order   (order_id),
  INDEX idx_oi_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- DONE.
-- Kiem tra: SHOW TABLES LIKE 'order%';
-- ==========================================================


-- ==========================================================
-- FILE: migration_005_technician.sql
-- ==========================================================

-- ==========================================================
-- Migration 005 — Tinh nang Ky Thuat (technician)
-- CHAY 1 LAN sau migration_004_orders.sql
-- ----------------------------------------------------------
-- Phu thuoc:
--   - staff (schema.sql)
--   - stock_items (migration_003_inventory.sql)
--   - orders, order_items (migration_004_orders.sql)
--   - customers (schema.sql)
-- LUU Y: cac lenh ALTER khong dung IF NOT EXISTS de tuong thich MySQL 5.7.
-- Neu chay lai bi loi "Duplicate column" thi nghia la da chay roi -> bo qua.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- Mo rong bang staff: them khu vuc + online status + rating
-- ----------------------------------------------------------
ALTER TABLE staff
  ADD COLUMN area          VARCHAR(100) NULL AFTER role,
  ADD COLUMN cccd          VARCHAR(20)  NULL AFTER phone,
  ADD COLUMN online_status ENUM('online','offline') NOT NULL DEFAULT 'offline',
  ADD COLUMN rating        DECIMAL(3,2) NOT NULL DEFAULT 0,
  ADD INDEX idx_staff_area (area);

-- ----------------------------------------------------------
-- Bang: tasks — cong viec KTV (sinh tu order)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  code              VARCHAR(30)  NOT NULL UNIQUE,         -- TASK-2604-001
  order_id          INT          NOT NULL,
  kind              ENUM('install','maintenance','renew','uninstall')
                    NOT NULL DEFAULT 'install',
  assigned_staff_id INT          NULL,
  status            ENUM('new','in_progress','done','cancelled')
                    NOT NULL DEFAULT 'new',
  due_at            DATETIME     NULL,
  started_at        DATETIME     NULL,
  completed_at      DATETIME     NULL,
  collect_amount    BIGINT       NOT NULL DEFAULT 0,      -- so tien KTV can thu cua khach
  collect_method    ENUM('cash','transfer','none') NOT NULL DEFAULT 'none',
  wage_amount       BIGINT       NOT NULL DEFAULT 0,      -- cong lap KTV duoc huong khi xong
  note              TEXT         NULL,
  is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_task_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_task_staff
    FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_task_status   (status),
  INDEX idx_task_assigned (assigned_staff_id),
  INDEX idx_task_order    (order_id),
  INDEX idx_task_kind     (kind),
  INDEX idx_task_deleted  (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: task_checklist — cac buoc trong 1 task
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_checklist (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  task_id    INT          NOT NULL,
  step       VARCHAR(255) NOT NULL,                       -- "Kiem tra TB", "Cap tai khoan"...
  is_done    TINYINT(1)   NOT NULL DEFAULT 0,
  done_at    DATETIME     NULL,
  sort_order INT          NOT NULL DEFAULT 0,

  CONSTRAINT fk_checklist_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_checklist_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: task_attachments — anh proof khi hoan thanh
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_attachments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  task_id     INT          NOT NULL,
  url         VARCHAR(500) NOT NULL,
  caption     VARCHAR(255) NULL,
  uploaded_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_attach_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_attach_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Mo rong stock_items: KTV "muon" thiet bi tu kho chung
-- - status='reserved' khi held_by_staff_id IS NOT NULL
-- - Khi lap xong: status='sold' + log warehouse_logs(out)
-- - Khi tra kho: status='available' + xoa held_by_staff_id
-- ----------------------------------------------------------
ALTER TABLE stock_items
  ADD COLUMN held_by_staff_id INT      NULL AFTER status,
  ADD COLUMN held_since       DATETIME NULL,
  ADD COLUMN held_for_task_id INT      NULL,
  ADD INDEX idx_stock_held (held_by_staff_id),
  ADD CONSTRAINT fk_stock_held_staff
    FOREIGN KEY (held_by_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_stock_held_task
    FOREIGN KEY (held_for_task_id) REFERENCES tasks(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------
-- Bang: collections — KTV thu tien tu khach (1 task -> 0..1 collection)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS collections (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  task_id       INT          NOT NULL,
  staff_id      INT          NOT NULL,                   -- KTV thu
  amount        BIGINT       NOT NULL,
  method        ENUM('cash','transfer') NOT NULL,
  receipt_url   VARCHAR(500) NULL,                        -- anh bien lai khach ki
  collected_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remitted      TINYINT(1)   NOT NULL DEFAULT 0,          -- da nop cong ty?
  remittance_id INT          NULL,                        -- thuoc lo nop nao
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_coll_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_coll_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  INDEX idx_coll_staff   (staff_id),
  INDEX idx_coll_task    (task_id),
  INDEX idx_coll_remit   (remitted),
  INDEX idx_coll_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: remittances — KTV nop tien ve cong ty (gom nhieu collection)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS remittances (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  staff_id      INT          NOT NULL,
  amount        BIGINT       NOT NULL,
  method        ENUM('cash','transfer') NOT NULL,
  receipt_url   VARCHAR(500) NULL,
  note          TEXT         NULL,
  remitted_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_by   INT          NULL,                          -- admin verify
  approved_at   DATETIME     NULL,
  reject_reason VARCHAR(500) NULL,
  status        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_remit_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_remit_approver
    FOREIGN KEY (approved_by) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_remit_staff   (staff_id),
  INDEX idx_remit_status  (status),
  INDEX idx_remit_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FK collections.remittance_id -> remittances (tao sau khi remittances ton tai)
ALTER TABLE collections
  ADD CONSTRAINT fk_coll_remit
    FOREIGN KEY (remittance_id) REFERENCES remittances(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------
-- Bang: staff_reviews — danh gia khach hang cho KTV
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  staff_id    INT          NOT NULL,
  task_id     INT          NOT NULL,
  rating      TINYINT      NOT NULL,                       -- 1..5
  comment     TEXT         NULL,
  reviewed_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_review_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_review_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_review_staff (staff_id),
  INDEX idx_review_task  (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: conversations — cuoc tro chuyen (1 order = 1 conversation)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id              INT       AUTO_INCREMENT PRIMARY KEY,
  order_id        INT       NOT NULL UNIQUE,
  customer_id     INT       NOT NULL,
  staff_id        INT       NULL,                          -- KTV duoc gan
  last_message_at DATETIME  NULL,
  is_deleted      TINYINT(1) NOT NULL DEFAULT 0,

  CONSTRAINT fk_conv_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_conv_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_conv_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_conv_staff    (staff_id),
  INDEX idx_conv_customer (customer_id),
  INDEX idx_conv_deleted  (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: messages — tin nhan trong conversation
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id              INT      AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT      NOT NULL,
  sender_type     ENUM('customer','staff') NOT NULL,
  sender_id       INT      NOT NULL,
  content         TEXT     NOT NULL,
  sent_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at         DATETIME NULL,

  CONSTRAINT fk_msg_conv
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_msg_conv (conversation_id, sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'task%';
--   SHOW TABLES LIKE 'collection%';
--   SHOW TABLES LIKE 'remittance%';
--   SHOW TABLES LIKE 'conversation%';
--   SHOW TABLES LIKE 'message%';
--   SELECT area, online_status FROM staff LIMIT 1;
-- ==========================================================


-- ==========================================================
-- FILE: migration_006_orders_extension.sql
-- ==========================================================

-- ==========================================================
-- Migration 006 — Mo rong Orders cho flow yeu cau/duyet/xuat kho
-- Chay 1 lan sau migration_005_technician.sql
-- ----------------------------------------------------------
-- Thay doi:
--   1. orders.status: them 'pending_review' va 'warehouse_released'
--   2. orders: them subtotal, creator_type, creator_id, confirmed_at, confirmed_by
--   3. task_attachments: them stage (receive/deliver/other)
--   4. Tao bang order_charges (phi linh hoat: ship/discount/fee)
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- 1. Mo rong orders
-- ----------------------------------------------------------
ALTER TABLE orders
  MODIFY COLUMN status ENUM(
    'pending_review','new','assigned','warehouse_released',
    'in_progress','done','cancelled'
  ) NOT NULL DEFAULT 'new',
  ADD COLUMN subtotal      BIGINT       NOT NULL DEFAULT 0 AFTER total_amount,
  ADD COLUMN creator_type  ENUM('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin' AFTER note,
  ADD COLUMN creator_id    INT          NULL AFTER creator_type,
  ADD COLUMN confirmed_at  DATETIME     NULL AFTER creator_id,
  ADD COLUMN confirmed_by  INT          NULL AFTER confirmed_at,
  ADD INDEX idx_orders_creator (creator_type, creator_id);

-- ----------------------------------------------------------
-- 2. Mo rong task_attachments: phan biet anh nhan/giao
-- ----------------------------------------------------------
ALTER TABLE task_attachments
  ADD COLUMN stage ENUM('receive','deliver','other') NOT NULL DEFAULT 'other' AFTER caption,
  ADD INDEX idx_attach_stage (task_id, stage);

-- ----------------------------------------------------------
-- 3. Bang order_charges — phi linh hoat tren don
--    kind='discount' luu amount AM (vi du -100000)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS order_charges (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT          NOT NULL,
  kind       ENUM('shipping','discount','fee') NOT NULL DEFAULT 'fee',
  label      VARCHAR(150) NOT NULL,
  amount     BIGINT       NOT NULL DEFAULT 0,
  is_deleted TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_charge_order FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_charge_order (order_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Backfill subtotal cho cac don da co (subtotal = total_amount neu chua co charges)
-- ----------------------------------------------------------
UPDATE orders SET subtotal = total_amount WHERE subtotal = 0 AND total_amount > 0;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM orders LIKE 'subtotal';
--   SHOW COLUMNS FROM orders LIKE 'creator_type';
--   DESCRIBE order_charges;
--   SHOW COLUMNS FROM task_attachments LIKE 'stage';
-- ==========================================================


-- ==========================================================
-- FILE: migration_006_inquiries.sql
-- ==========================================================

-- ==========================================================
-- Migration 006 — Don tu van (Inquiries / Leads)
-- CHAY 1 LAN sau migration_005_technician.sql
-- ----------------------------------------------------------
-- Phu thuoc:
--   - staff           (schema.sql)
--   - customers       (schema.sql)
--   - orders          (migration_004_orders.sql)
--   - products        (schema.sql)
--
-- Y nghia:
--   Khach le chua co tai khoan -> gui form tu van qua /api/public/inquiries.
--   Admin lien lac, sau do co the:
--     - Convert thanh customer + order chinh thuc
--     - Hoac reject
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- Bang: inquiries — don tu van tu khach (anonymous)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiries (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  code                  VARCHAR(30)  NOT NULL UNIQUE,           -- TV-2604-001

  -- Thong tin khach (khong bat buoc co tai khoan)
  full_name             VARCHAR(255) NOT NULL,
  phone                 VARCHAR(20)  NOT NULL,
  email                 VARCHAR(150) NULL,
  address               VARCHAR(500) NULL,
  area                  VARCHAR(100) NULL,
  vehicle_plate         VARCHAR(20)  NULL,
  note                  TEXT         NULL,

  service_kind          ENUM('install','renewal','maintenance','warranty','consult')
                        NOT NULL DEFAULT 'install',
  source                VARCHAR(50)  NOT NULL DEFAULT 'web',    -- web, hotline, fb...

  status                ENUM('new','contacted','converted','rejected')
                        NOT NULL DEFAULT 'new',

  contacted_at          DATETIME     NULL,
  contacted_by_staff_id INT          NULL,
  converted_customer_id INT          NULL,
  converted_order_id    INT          NULL,
  reject_reason         VARCHAR(500) NULL,

  is_deleted            TINYINT(1)   NOT NULL DEFAULT 0,
  created_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at            TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP
                                              ON UPDATE CURRENT_TIMESTAMP,

  CONSTRAINT fk_inquiry_contacted_by
    FOREIGN KEY (contacted_by_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_inquiry_customer
    FOREIGN KEY (converted_customer_id) REFERENCES customers(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_inquiry_order
    FOREIGN KEY (converted_order_id) REFERENCES orders(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_inquiry_status  (status),
  INDEX idx_inquiry_phone   (phone),
  INDEX idx_inquiry_created (created_at),
  INDEX idx_inquiry_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: inquiry_items — san pham khach quan tam
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS inquiry_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  inquiry_id  INT NOT NULL,
  product_id  INT NULL,                                          -- NULL khi SP da bi xoa
  qty         INT NOT NULL DEFAULT 1,
  note        VARCHAR(255) NULL,

  CONSTRAINT fk_iitem_inquiry
    FOREIGN KEY (inquiry_id) REFERENCES inquiries(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_iitem_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_iitem_inquiry (inquiry_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'inquir%';
--   DESCRIBE inquiries;
-- ==========================================================


-- ==========================================================
-- FILE: migration_007_badges.sql
-- ==========================================================

-- ==========================================================
-- Migration 007 — Phu hieu xe (badges)
-- Chay 1 lan sau migration_006_orders_extension.sql
-- ----------------------------------------------------------
-- Phu hieu xe = giay phep cho xe kinh doanh van tai (Nghi dinh 10).
-- Quy trinh:
--   pending_review (KH/dealer/admin tao) -> submitted (admin nop So GTVT)
--     -> approved | rejected -> delivered (giao tan noi) | cancelled
-- ==========================================================

USE gpsviet;

CREATE TABLE IF NOT EXISTS badges (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(30)  NOT NULL UNIQUE,           -- PH-DDMM-NNN
  customer_id   INT          NOT NULL,
  dealer_id     INT          NULL,                       -- neu dealer dat ho

  vehicle_plate VARCHAR(30)  NOT NULL,
  vehicle_type  ENUM('truck_under_3.5t','truck_over_3.5t','passenger','contract','taxi','other')
                NOT NULL DEFAULT 'truck_under_3.5t',

  status        ENUM('pending_review','submitted','approved','rejected','delivered','cancelled')
                NOT NULL DEFAULT 'pending_review',
  fee_amount    BIGINT       NOT NULL DEFAULT 0,
  paid_amount   BIGINT       NOT NULL DEFAULT 0,

  submitted_at  DATETIME     NULL,
  result_at     DATETIME     NULL,
  delivered_at  DATETIME     NULL,
  reject_reason VARCHAR(500) NULL,

  note          TEXT         NULL,
  creator_type  ENUM('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin',
  creator_id    INT          NULL,

  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_badge_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_badge_dealer
    FOREIGN KEY (dealer_id) REFERENCES customers(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_badge_status   (status),
  INDEX idx_badge_customer (customer_id),
  INDEX idx_badge_dealer   (dealer_id),
  INDEX idx_badge_plate    (vehicle_plate),
  INDEX idx_badge_deleted  (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Anh ho so (dang ki xe, cccd, ho so)
CREATE TABLE IF NOT EXISTS badge_attachments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  badge_id    INT          NOT NULL,
  url         VARCHAR(500) NOT NULL,
  caption     VARCHAR(255) NULL,
  kind        ENUM('vehicle_reg','cccd','license','other') NOT NULL DEFAULT 'other',
  uploaded_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_battach_badge FOREIGN KEY (badge_id) REFERENCES badges(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_battach_badge (badge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'badge%';
-- ==========================================================


-- ==========================================================
-- FILE: migration_007_product_timeline.sql
-- ==========================================================

-- ==========================================================
-- Migration 007 — San pham: timeline blocks + thong so 2 nhom
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Neu chay lai bi loi "Duplicate column" cho product_attributes.position
-- thi nghia la da chay roi -> bo qua.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- Bang: product_blocks — timeline noi dung (text/image/video)
-- Hien thi tren trang khach lan luot theo sort_order:
--   [thumb chinh + gia + thong so TOP]
--   -> blocks (text/image/video xen ke)
--   -> [thong so BOTTOM]
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_blocks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  block_type  ENUM('text','image','video') NOT NULL,
  content     TEXT NULL,                              -- text body HOAC url image/video
  caption     VARCHAR(500) NULL,                       -- chu thich anh/video (tuy chon)
  sort_order  INT NOT NULL DEFAULT 0,

  CONSTRAINT fk_block_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_block_product (product_id),
  INDEX idx_block_sort    (product_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- product_attributes: them cot position ('top'|'bottom')
--   top    = thong so co ban (hien tren cung trang)
--   bottom = thong so chi tiet (hien duoi cung)
-- ----------------------------------------------------------
ALTER TABLE product_attributes
  ADD COLUMN position ENUM('top','bottom') NOT NULL DEFAULT 'top';

-- ----------------------------------------------------------
-- Du lieu mau cho VT-01 (id=1) — neu da xoa thi bo qua
-- ----------------------------------------------------------
INSERT IGNORE INTO product_blocks (product_id, block_type, content, caption, sort_order) VALUES
  (1, 'text',  'VT-01 la thiet bi dinh vi xe may nho gon, lap dat trong 15 phut, phu hop voi xe so/xe ga.', NULL, 1),
  (1, 'image', '/uploads/products/sample-vt01-1.jpg', 'Mat truoc thiet bi VT-01', 2),
  (1, 'text',  'Pin du phong 800mAh, hoat dong toi 24h khi mat nguon. Chong nuoc IP67 — di mua khong sao.', NULL, 3);

-- Phan loai thong so co san: dat 2 thuoc tinh dau la "top", thuoc tinh sau la "bottom"
-- (chi anh huong VT-01 da seed truoc do)
UPDATE product_attributes SET position = 'top'    WHERE product_id = 1 AND label IN ('Nguon', 'Pin');
UPDATE product_attributes SET position = 'bottom' WHERE product_id = 1 AND label = 'Cong dau ra';

-- ==========================================================
-- DONE.
-- ==========================================================


-- ==========================================================
-- FILE: migration_008_service_kind.sql
-- ==========================================================

-- ==========================================================
-- Migration 008 — Them service_kind cho orders
-- Phan biet don: lap moi / bao tri / bao hanh / gia han
-- Chay 1 lan sau migration_007.
-- ==========================================================

USE gpsviet;

ALTER TABLE orders
  ADD COLUMN service_kind ENUM('install','maintenance','warranty','renewal')
              NOT NULL DEFAULT 'install' AFTER vehicle_plate,
  ADD INDEX idx_orders_service_kind (service_kind);

-- ==========================================================
-- DONE.
-- Kiem tra: SHOW COLUMNS FROM orders LIKE 'service_kind';
-- ==========================================================


-- ==========================================================
-- FILE: migration_009_seen_flags.sql
-- ==========================================================

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


-- ==========================================================
-- FILE: migration_010_chat_direct.sql
-- ==========================================================

-- ==========================================================
-- Migration 010 — Free chat: KH/dai ly chat truc tiep voi admin
-- CHAY 1 LAN sau migration_009.
-- ----------------------------------------------------------
-- Thay doi:
--   1. conversations.order_id  -> NULL duoc (cho direct chat)
--   2. Bo UNIQUE order_id, them index thuong (vi nhieu NULL)
--   3. Them cot kind ENUM('order','direct')
--      'order'  = chat trong 1 don (giua KH va KTV duoc gan)
--      'direct' = chat truc tiep voi team admin/CSKH
--
-- Moi customer chi co toi da 1 conversation kind='direct'
-- (BE find-or-create theo customer_id).
-- ==========================================================

USE gpsviet;

ALTER TABLE conversations
  DROP INDEX order_id,
  MODIFY COLUMN order_id INT NULL,
  ADD COLUMN kind ENUM('order','direct') NOT NULL DEFAULT 'order' AFTER order_id,
  ADD INDEX idx_conv_kind_customer (kind, customer_id),
  ADD INDEX idx_conv_order (order_id);

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM conversations LIKE 'kind';
--   SHOW INDEX FROM conversations;
-- ==========================================================


-- ==========================================================
-- FILE: migration_011_price_tiers.sql
-- ==========================================================

-- Migration 011: tach label gia thanh bang `price_tiers` dung chung.
--
-- Truoc: product_prices.label la VARCHAR tu do, moi san pham nhap kieu khac nhau.
-- Sau:   price_tiers (id, code, name, sort_order, is_deleted)
--        product_prices.tier_id FK -> price_tiers.id
--        customers.default_tier_id FK -> price_tiers.id (gia mac dinh hien thi cho khach do)
--
-- Idempotent: chay lai khong fail (kiem tra tung buoc).

-- ----------------------------------------------------------
-- 1) Bang price_tiers
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS price_tiers (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(40)  NOT NULL,
  name        VARCHAR(100) NOT NULL,
  sort_order  INT NOT NULL DEFAULT 0,
  is_deleted  TINYINT(1) NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_tier_code (code)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3 tier mac dinh: ban le, ban si, dai ly. INSERT IGNORE de chay lai khong nhan.
INSERT IGNORE INTO price_tiers (code, name, sort_order) VALUES
  ('retail',    'Bán lẻ',  1),
  ('wholesale', 'Bán sỉ',  2),
  ('dealer',    'Đại lý',  3);

-- ----------------------------------------------------------
-- 2) Them cot tier_id vao product_prices (nullable luc dau de migrate data)
-- ----------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_prices' AND COLUMN_NAME = 'tier_id');
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE product_prices ADD COLUMN tier_id INT NULL AFTER product_id',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Map label hien co (khong dau / co dau) -> tier code
UPDATE product_prices pp
JOIN price_tiers t ON t.code = 'retail'
SET pp.tier_id = t.id
WHERE pp.tier_id IS NULL AND LOWER(pp.label) IN ('ban le', 'bán lẻ', 'banle');

UPDATE product_prices pp
JOIN price_tiers t ON t.code = 'wholesale'
SET pp.tier_id = t.id
WHERE pp.tier_id IS NULL AND LOWER(pp.label) IN ('ban si', 'bán sỉ', 'bansi', 'ban buon', 'bán buôn');

UPDATE product_prices pp
JOIN price_tiers t ON t.code = 'dealer'
SET pp.tier_id = t.id
WHERE pp.tier_id IS NULL AND LOWER(pp.label) IN ('dai ly', 'đại lý', 'daily');

-- Voi label la (khong khop tier nao): tao tier moi cho moi label distinct con lai.
-- Code = slug (a-z0-9, thay khoang trang bang -)
INSERT IGNORE INTO price_tiers (code, name, sort_order)
SELECT
  CONCAT('custom-', LOWER(REPLACE(REPLACE(REPLACE(label, ' ', '-'), '/', '-'), '_', '-'))),
  label,
  100
FROM (
  SELECT DISTINCT label FROM product_prices
   WHERE tier_id IS NULL AND label IS NOT NULL AND label <> ''
) t;

-- Gan tier_id cho cac row con lai (match theo name = label)
UPDATE product_prices pp
JOIN price_tiers t ON t.name = pp.label
SET pp.tier_id = t.id
WHERE pp.tier_id IS NULL;

-- Xoa cac row khong the migrate (label NULL hoac rong)
DELETE FROM product_prices WHERE tier_id IS NULL;

-- ----------------------------------------------------------
-- 3) Khoa tier_id NOT NULL + FK + unique (product_id, tier_id)
-- ----------------------------------------------------------
SET @null_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_prices'
    AND COLUMN_NAME = 'tier_id' AND IS_NULLABLE = 'YES');
SET @sql := IF(@null_exists > 0,
  'ALTER TABLE product_prices MODIFY COLUMN tier_id INT NOT NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @fk_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_prices'
    AND CONSTRAINT_NAME = 'fk_prices_tier');
SET @sql := IF(@fk_exists = 0,
  'ALTER TABLE product_prices ADD CONSTRAINT fk_prices_tier FOREIGN KEY (tier_id) REFERENCES price_tiers(id)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @uk_exists := (SELECT COUNT(*) FROM information_schema.TABLE_CONSTRAINTS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_prices'
    AND CONSTRAINT_NAME = 'uniq_product_tier');
SET @sql := IF(@uk_exists = 0,
  'ALTER TABLE product_prices ADD CONSTRAINT uniq_product_tier UNIQUE (product_id, tier_id)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------
-- 4) Drop cot label cu (data da migrate xong)
-- ----------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'product_prices' AND COLUMN_NAME = 'label');
SET @sql := IF(@col_exists > 0,
  'ALTER TABLE product_prices DROP COLUMN label',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------
-- 5) Customers.default_tier_id (gia hien thi mac dinh cho khach hang/dai ly do)
-- ----------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'customers' AND COLUMN_NAME = 'default_tier_id');
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE customers ADD COLUMN default_tier_id INT NULL AFTER discount_rate, ADD CONSTRAINT fk_cust_tier FOREIGN KEY (default_tier_id) REFERENCES price_tiers(id) ON DELETE SET NULL',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- Mac dinh: type=retail -> tier 'retail', type=dealer -> tier 'dealer'
UPDATE customers c
JOIN price_tiers t ON t.code = 'retail'
SET c.default_tier_id = t.id
WHERE c.default_tier_id IS NULL AND c.type = 'retail';

UPDATE customers c
JOIN price_tiers t ON t.code = 'dealer'
SET c.default_tier_id = t.id
WHERE c.default_tier_id IS NULL AND c.type = 'dealer';


-- ==========================================================
-- FILE: migration_012_default_tier.sql
-- ==========================================================

-- Migration 012: them flag is_default cho price_tiers.
--
-- Thay the cho hardcode `code='retail'` o public.js / customer.js / daily.js.
-- Admin co the chon BAT KY tier nao lam mac dinh hien thi (cho khach public + fallback).
--
-- Rang buoc: chi 1 tier co is_default=1 tai 1 thoi diem.
-- Cach lam: generated column `default_marker = IF(is_default=1, 1, NULL) STORED`
--           + UNIQUE(default_marker). NULL khong tinh trong unique -> hop le.
--
-- Idempotent.

-- ----------------------------------------------------------
-- 1) Them cot is_default
-- ----------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'price_tiers' AND COLUMN_NAME = 'is_default');
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE price_tiers ADD COLUMN is_default TINYINT(1) NOT NULL DEFAULT 0 AFTER sort_order',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------
-- 2) Them generated column de enforce unique chi 1 default
-- ----------------------------------------------------------
SET @col_exists := (SELECT COUNT(*) FROM information_schema.COLUMNS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'price_tiers' AND COLUMN_NAME = 'default_marker');
SET @sql := IF(@col_exists = 0,
  'ALTER TABLE price_tiers ADD COLUMN default_marker TINYINT(1) GENERATED ALWAYS AS (IF(is_default=1, 1, NULL)) STORED',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

SET @uk_exists := (SELECT COUNT(*) FROM information_schema.STATISTICS
  WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = 'price_tiers' AND INDEX_NAME = 'uniq_default_tier');
SET @sql := IF(@uk_exists = 0,
  'ALTER TABLE price_tiers ADD UNIQUE KEY uniq_default_tier (default_marker)',
  'SELECT 1');
PREPARE stmt FROM @sql; EXECUTE stmt; DEALLOCATE PREPARE stmt;

-- ----------------------------------------------------------
-- 3) Set tier 'retail' lam default neu chua co tier nao default
-- ----------------------------------------------------------
SET @has_default := (SELECT COUNT(*) FROM price_tiers WHERE is_default = 1);
UPDATE price_tiers SET is_default = 1
  WHERE @has_default = 0 AND code = 'retail' AND is_deleted = 0;


-- ==========================================================
-- FILE: migration_013_inventory_v2.sql
-- ==========================================================

-- ==========================================================
-- Migration 013 — Kho v2: gop product+qty + phieu nhap/xuat
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Nguyen tac moi:
--   - product_stock(product_id, quantity) la nguon su that ton kho
--   - staff_holdings(staff_id, product_id, qty) = KTV dang giu
--   - release_pool(task_id, product_id, qty) = da xuat tu kho chinh,
--     dang cho KTV nhan
--   - stock_receipts (header) + stock_receipt_items (lines) = phieu N/X
--     voi reason_code ro rang
--   - IMEI khong con la entity rieng — chi luu text trong
--     stock_receipt_items.imei_list khi can ghi chu
--
-- Bang cu (stock_items, warehouse_logs) GIU LAI lam read-only archive,
-- code moi khong touch chung.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- Bang: product_stock — ton kho gop theo product
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_stock (
  product_id INT PRIMARY KEY,
  quantity   INT NOT NULL DEFAULT 0,
  CONSTRAINT chk_product_stock_nonneg CHECK (quantity >= 0),
  CONSTRAINT fk_product_stock_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: staff_holdings — KTV dang giu bao nhieu / san pham
-- Khi qty = 0 -> DELETE row (khong soft-delete)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_holdings (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  staff_id      INT NOT NULL,
  product_id    INT NOT NULL,
  qty           INT NOT NULL,
  first_held_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_staff_holdings_pos CHECK (qty > 0),
  CONSTRAINT uk_staff_holdings_staff_product UNIQUE (staff_id, product_id),
  CONSTRAINT fk_staff_holdings_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_staff_holdings_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_staff_holdings_staff   (staff_id),
  INDEX idx_staff_holdings_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: stock_receipts — header phieu nhap/xuat
-- code: PN-YYMMDD-NNN (nhap) / PX-YYMMDD-NNN (xuat)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_receipts (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  code                VARCHAR(20)  NOT NULL UNIQUE,
  kind                ENUM('in','out') NOT NULL,
  reason_code         VARCHAR(40)  NOT NULL,
  reason_text         VARCHAR(500) NULL,
  ref_order_id        INT NULL,
  ref_task_id         INT NULL,
  ref_staff_id        INT NULL,
  supplier_id         INT NULL,
  created_by_staff_id INT NULL,
  created_at          TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_voided           TINYINT(1)   NOT NULL DEFAULT 0,
  voided_at           DATETIME     NULL,
  voided_reason       VARCHAR(500) NULL,
  voided_by_receipt_id INT NULL,                          -- tro toi phieu doi ung
  CONSTRAINT fk_receipt_supplier
    FOREIGN KEY (supplier_id) REFERENCES suppliers(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_receipt_creator
    FOREIGN KEY (created_by_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_receipt_ref_staff
    FOREIGN KEY (ref_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_receipts_kind     (kind),
  INDEX idx_receipts_reason   (reason_code),
  INDEX idx_receipts_created  (created_at),
  INDEX idx_receipts_order    (ref_order_id),
  INDEX idx_receipts_task     (ref_task_id),
  INDEX idx_receipts_supplier (supplier_id),
  INDEX idx_receipts_voided   (is_voided)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: stock_receipt_items — line items
-- qty luon duong; kind cua header quyet dinh +/- vao product_stock
-- imei_list optional, dang text (1 IMEI / dong hoac dau phay)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_receipt_items (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  receipt_id  INT NOT NULL,
  product_id  INT NOT NULL,
  qty         INT NOT NULL,
  unit_price  BIGINT NULL,
  imei_list   TEXT   NULL,
  note        VARCHAR(500) NULL,
  CONSTRAINT chk_receipt_item_qty_pos CHECK (qty > 0),
  CONSTRAINT fk_receipt_item_receipt
    FOREIGN KEY (receipt_id) REFERENCES stock_receipts(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_receipt_item_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_receipt_items_receipt (receipt_id),
  INDEX idx_receipt_items_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: release_pool — da xuat tu kho chinh, KTV chua "Nhan"
-- 1 row / (task_id, product_id) — tang/giam qty dan dan
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS release_pool (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  task_id     INT NOT NULL,
  staff_id    INT NOT NULL,
  product_id  INT NOT NULL,
  qty         INT NOT NULL,
  receipt_id  INT NOT NULL,
  created_at  TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_release_pool_pos CHECK (qty > 0),
  CONSTRAINT uk_release_pool_task_product UNIQUE (task_id, product_id),
  CONSTRAINT fk_release_pool_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_release_pool_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_release_pool_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_release_pool_receipt
    FOREIGN KEY (receipt_id) REFERENCES stock_receipts(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_release_pool_staff   (staff_id),
  INDEX idx_release_pool_task    (task_id),
  INDEX idx_release_pool_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- MIGRATE DU LIEU CU
-- ==========================================================

-- 1) Build product_stock tu stock_items.status='available'
INSERT IGNORE INTO product_stock (product_id, quantity)
  SELECT product_id, COUNT(*)
    FROM stock_items
   WHERE status='available' AND is_deleted=0
   GROUP BY product_id;

-- Dam bao moi product (chua bi xoa) co row product_stock
INSERT IGNORE INTO product_stock (product_id, quantity)
  SELECT p.id, 0 FROM products p
   WHERE p.is_deleted=0;

-- 2) Build staff_holdings tu stock_items.status='reserved'
INSERT IGNORE INTO staff_holdings (staff_id, product_id, qty, first_held_at)
  SELECT held_by_staff_id, product_id, COUNT(*),
         COALESCE(MIN(held_since), NOW())
    FROM stock_items
   WHERE status='reserved'
     AND held_by_staff_id IS NOT NULL
     AND is_deleted=0
   GROUP BY held_by_staff_id, product_id;

-- 3) status='sold'/'damaged'/'returned' bo qua (da out kho).

-- 4) release_pool khong backfill — don cu o warehouse_released
--    se dung fallback (query stock_items) trong route cancel.

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SELECT * FROM product_stock;
--   SELECT * FROM staff_holdings;
--   SELECT * FROM stock_receipts;
-- ==========================================================


-- ==========================================================
-- FILE: migration_014_order_payments.sql
-- ==========================================================

-- ----------------------------------------------------------
-- Migration 014: bang order_payments
-- Lo log moi giao dich thanh toan (KTV thu / admin mark-paid / customer self pay)
-- de bao cao doanh thu chinh xac theo ngay THU TIEN, khong phai ngay confirm don.
--
-- Truoc day:
--   - orders.paid_amount tang khi:
--       a) KTV complete voi customer_paid_to='staff' -> INSERT collections
--       b) Admin mark-paid -> chi tang paid_amount, KHONG co log
--   - reports.js /revenue group theo orders.confirmed_at -> sai ngay
--   - Khong tach duoc thu cua KTV vs thu cua admin
--
-- Sau migration nay:
--   - Moi nguon thu deu INSERT 1 row vao order_payments(paid_at)
--   - reports doc tu day GROUP BY DATE(paid_at)
-- ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS order_payments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT          NOT NULL,
  amount        BIGINT       NOT NULL,
  source        ENUM('staff_collection','admin_mark_paid','customer_self_pay') NOT NULL,
  collection_id INT          NULL,                  -- ref khi source='staff_collection'
  staff_id      INT          NULL,                  -- KTV thu hoac admin xac nhan
  paid_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note          TEXT         NULL,
  is_deleted    TINYINT      NOT NULL DEFAULT 0,

  CONSTRAINT chk_payment_amount CHECK (amount >= 0),
  CONSTRAINT fk_payment_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payment_collection
    FOREIGN KEY (collection_id) REFERENCES collections(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_payment_order   (order_id),
  INDEX idx_payment_paid_at (paid_at),
  INDEX idx_payment_source  (source),
  INDEX idx_payment_active  (is_deleted, paid_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Backfill 1: tu collections (KTV staff path)
-- ----------------------------------------------------------
INSERT INTO order_payments (order_id, amount, source, collection_id, staff_id, paid_at)
SELECT t.order_id, c.amount, 'staff_collection', c.id, c.staff_id, c.collected_at
  FROM collections c
  JOIN tasks t ON t.id = c.task_id
 WHERE c.is_deleted = 0;

-- ----------------------------------------------------------
-- Backfill 2: phan paid_amount con lai (sau khi tru collections)
-- gia dinh la admin mark-paid. Khong co log nen lay paid_at = confirmed_at.
-- Day la xap xi cho data cu; data moi se co log chinh xac.
-- ----------------------------------------------------------
INSERT INTO order_payments (order_id, amount, source, paid_at, note)
SELECT
  o.id,
  GREATEST(0, o.paid_amount - COALESCE(SUM(c.amount), 0)),
  'admin_mark_paid',
  COALESCE(o.confirmed_at, o.id), -- fallback dat tam
  'Backfill: paid_amount cao hon tong collections, gia dinh la mark-paid'
FROM orders o
LEFT JOIN tasks t      ON t.order_id = o.id AND t.is_deleted = 0
LEFT JOIN collections c ON c.task_id = t.id AND c.is_deleted = 0
WHERE o.is_deleted = 0
GROUP BY o.id, o.paid_amount, o.confirmed_at
HAVING GREATEST(0, o.paid_amount - COALESCE(SUM(c.amount), 0)) > 0;

-- Kiem tra:
--   SELECT source, COUNT(*), SUM(amount) FROM order_payments WHERE is_deleted=0 GROUP BY source;


-- ==========================================================
-- FILE: migration_015_warranty.sql
-- ==========================================================

-- ==========================================================
-- Migration 015 — Bao hanh / Sua chua
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc dich:
--   - Quan ly yeu cau bao hanh va sua chua co phi cho thiet bi GPS
--   - Thay the file Excel tay (cot: dai ly/khach, model, IMEI, loi, status)
--   - Tu khoa stock_items.status='damaged' khi nhan may, ='returned' khi tra
-- Quy uoc:
--   - Soft delete bang is_deleted (giong toan he thong)
--   - KHONG dung created_at/updated_at o bang cot loi (dung request_date DATE)
--   - Code: BH-DDMM-NNN, sinh trong BE
--   - claim_type: 'warranty' (mien phi) hoac 'paid_repair' (co phi)
-- ==========================================================

USE gpsviet;

CREATE TABLE IF NOT EXISTS warranty_requests (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  code                VARCHAR(30)  NOT NULL UNIQUE,        -- BH-DDMM-NNN

  claim_type          ENUM('warranty','paid_repair')
                      NOT NULL DEFAULT 'warranty',
  repair_fee          BIGINT       NULL,                   -- chi set khi paid_repair

  customer_id         INT          NOT NULL,               -- FK customers (retail HOAC dealer)
  stock_item_id       INT          NULL,                   -- FK stock_items khi IMEI khop
  prev_stock_status   VARCHAR(20)  NULL,                   -- luu stock_items.status truoc khi nhan BH (de restore khi xong)
  product_id          INT          NULL,                   -- FK products khi model match

  imei_text           VARCHAR(100) NULL,                   -- IMEI tho khach gui
  model_text          VARCHAR(100) NULL,                   -- "TC500", "S400E"...
  issue_text          TEXT         NOT NULL,               -- "ko len nguon", "nap pm"...
  note_text           TEXT         NULL,                   -- ghi chu admin/KTV
  replacement_imei    VARCHAR(100) NULL,                   -- excel: "gotrack doi 0032001702"

  status              ENUM('requested','received','diagnosing','repairing',
                           'replaced','returned','rejected','cancelled')
                      NOT NULL DEFAULT 'requested',

  request_date        DATE         NOT NULL,               -- ngay tao yeu cau
  received_date       DATE         NULL,                   -- ngay nhan may ve cty
  returned_date       DATE         NULL,                   -- ngay tra khach

  assigned_staff_id   INT          NULL,                   -- KTV xu ly
  creator_type        ENUM('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin',
  creator_id          INT          NULL,
  is_deleted          TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_wr_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_wr_stock    FOREIGN KEY (stock_item_id) REFERENCES stock_items(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_wr_product  FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_wr_staff    FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_wr_status   (status),
  INDEX idx_wr_customer (customer_id),
  INDEX idx_wr_imei     (imei_text),
  INDEX idx_wr_request  (request_date),
  INDEX idx_wr_deleted  (is_deleted),
  INDEX idx_wr_claim    (claim_type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- DONE.
-- Kiem tra: SHOW TABLES LIKE 'warranty%';
--          DESCRIBE warranty_requests;
-- ==========================================================


-- ==========================================================
-- FILE: migration_016_message_visibility.sql
-- ==========================================================

-- ==========================================================
-- Migration 016 — Message visibility (staff-only screenshots)
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc dich:
--   - Cho phep tin nhan chi hien voi staff (admin/KTV), khach khong thay.
--   - Dung cho anh chup man hinh ma admin/KTV yeu cau khach gui ngam:
--     khach gui ve qua FE, BE luu visibility='staff_only', GET messages
--     ben /customer/* loc bo.
-- ==========================================================

USE gpsviet;

ALTER TABLE messages
  ADD COLUMN visibility ENUM('all','staff_only')
    NOT NULL DEFAULT 'all' AFTER content;

-- ==========================================================
-- DONE.
-- Kiem tra: DESCRIBE messages;  -- thay co cot 'visibility'
-- ==========================================================


-- ==========================================================
-- FILE: migration_017_chat_unified.sql
-- ==========================================================

-- ==========================================================
-- Migration 017 — Gop chat thanh 1 conversation/khach
-- CHAY 1 LAN (DEV: drop bang cu, tao lai. CO MAT DATA CHAT CU.)
-- ----------------------------------------------------------
-- Thay doi:
--   - 1 customer = 1 conversation duy nhat (bo order_id, kind, staff_id).
--   - Bang moi conversation_members(conversation_id, staff_id, joined_at,
--     removed_at) cho phep nhieu KTV/admin tham gia 1 cuoc chat. Admin
--     bam them/bot KTV thay cho viec gan cung 1 staff_id.
--   - messages.order_id (NULL): tag tin nhan ve don cu the de FE
--     hien badge "📦 Don DH-XXXX" co the click sang chi tiet don.
-- ==========================================================

USE gpsviet;

-- Drop theo thu tu de tranh FK violation
DROP TABLE IF EXISTS conversation_members;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;

-- ----------------------------------------------------------
-- Bang: conversations — 1 row / khach
-- ----------------------------------------------------------
CREATE TABLE conversations (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  customer_id     INT NOT NULL UNIQUE,
  last_message_at DATETIME  NULL,
  is_deleted      TINYINT(1) NOT NULL DEFAULT 0,

  CONSTRAINT fk_conv_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_conv_deleted (is_deleted),
  INDEX idx_conv_last_msg (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: conversation_members — staff (admin/ktv) tham gia 1 conv
-- removed_at IS NULL: dang trong chat, gui/nhan tin duoc.
-- removed_at IS NOT NULL: da bi kick — van xem duoc tin truoc thoi diem do
-- (FE filter), khong gui them.
-- Re-add KTV cu: UPDATE removed_at = NULL thay vi insert moi.
-- ----------------------------------------------------------
CREATE TABLE conversation_members (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  staff_id        INT NOT NULL,
  joined_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  removed_at      DATETIME NULL,
  added_by        INT NULL,                    -- ai add (admin/system)

  UNIQUE KEY uq_conv_staff (conversation_id, staff_id),

  CONSTRAINT fk_cm_conv
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cm_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cm_added_by
    FOREIGN KEY (added_by) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_cm_staff_active (staff_id, removed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: messages — them order_id de tag tin ve don cu the
-- ----------------------------------------------------------
CREATE TABLE messages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  order_id        INT NULL,                    -- optional tag don
  sender_type     ENUM('customer','staff') NOT NULL,
  sender_id       INT NOT NULL,
  content         TEXT NOT NULL,
  visibility      ENUM('all','staff_only') NOT NULL DEFAULT 'all',
  sent_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at         DATETIME NULL,

  CONSTRAINT fk_msg_conv
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_msg_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_msg_conv (conversation_id, sent_at),
  INDEX idx_msg_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'conversation%';
--   SHOW TABLES LIKE 'messages';
--   SHOW COLUMNS FROM messages LIKE 'order_id';
-- ==========================================================


-- ==========================================================
-- FILE: migration_018_badge_orders.sql
-- ==========================================================

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


-- ==========================================================
-- FILE: migration_019_payment_split.sql
-- ==========================================================

-- ==========================================================
-- Migration 019 — Tach bach 3 nguon thu + 3 status no
-- Chay 1 lan sau migration_018_badge_orders.sql
-- ----------------------------------------------------------
-- Muc tieu: ke toan KHONG lech dong nao.
--
-- 1. Khi KTV bam hoan thanh, tien tu khach co the chia thanh 3 phan:
--      a) Tra KTV (cash/transfer)        -> tao collections (KTV no cong ty)
--      b) Tra admin truc tiep            -> tao order_payments source='admin_pending', confirmed=0
--                                          (paid_amount KHONG cong, doi admin xac nhan)
--      c) Khach con no                   -> khong tao gi, suy ra tu (total - paid - unremitted - admin_pending)
--    Tong 3 phan PHAI = phan task dam nhiem (mac dinh = remaining cua don luc complete).
--
-- 2. Status don sau khi tat ca task done (uu tien tu cao xuong):
--      - customer_owes        : khach con no  (effective < total)
--      - pending_admin_confirm: admin con tien chua bam mark-paid (admin_pending > 0, khong con khach no)
--      - staff_owes           : KTV con giu tien chua nop  (unremitted > 0, khong con admin pending va khach no)
--      - done                 : paid >= total VA khong con unremitted/admin_pending
--
-- 3. Bao cao no:
--      /reports/customer-debts        : khach no
--      /reports/staff-debts           : KTV giu tien
--      /reports/admin-pending-debts   : (MOI) admin con phai xac nhan
--    Tat ca deu them filter ?from=&to=.
--
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- 1. Mo rong orders.status: them 3 status no
-- ----------------------------------------------------------
ALTER TABLE orders
  MODIFY COLUMN status ENUM(
    'pending_review','new','assigned','warehouse_released',
    'in_progress','done','cancelled',
    'customer_owes','pending_admin_confirm','staff_owes'
  ) NOT NULL DEFAULT 'new';

-- ----------------------------------------------------------
-- 2. Mo rong order_payments
--    - source them 'admin_pending' (khach bao da tra admin, doi xac nhan)
--    - confirmed: 0 = chua xac nhan (khong cong vao paid_amount), 1 = da xac nhan
--    - confirmed_by/confirmed_at: ai admin xac nhan, khi nao
-- ----------------------------------------------------------
ALTER TABLE order_payments
  MODIFY COLUMN source ENUM(
    'staff_collection','admin_mark_paid','customer_self_pay','admin_pending'
  ) NOT NULL,
  ADD COLUMN confirmed    TINYINT(1) NOT NULL DEFAULT 1 AFTER source,
  ADD COLUMN confirmed_at DATETIME   NULL                AFTER confirmed,
  ADD COLUMN confirmed_by INT        NULL                AFTER confirmed_at,
  ADD COLUMN task_id      INT        NULL                AFTER collection_id,
  ADD INDEX idx_payment_pending (order_id, source, confirmed),
  ADD INDEX idx_payment_task    (task_id);

-- Backfill: cac payment cu deu coi nhu da confirmed
UPDATE order_payments SET confirmed = 1 WHERE confirmed IS NULL;


-- ==========================================================
-- FILE: migration_020_stocktakes.sql
-- ==========================================================

-- ==========================================================
-- Migration 020 — Phien kiem ke kho hang loat
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Khai niem:
--   - 1 phien kiem ke (stock_takes) = 1 dot QTV dem thuc te kho.
--   - Moi phien co N stock_take_lines (1 line / san pham).
--   - Khi finish phien: voi moi line co variance != 0,
--     he thong tu sinh stock_receipts (adjust_plus / adjust_minus)
--     ref nguoc ve phien qua ref_stock_take_id.
--   - Phieu sinh tu phien kiem ke KHONG duoc void truc tiep
--     (route /receipts/:id/void chan).
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- Bang: stock_takes — header phien kiem ke
-- code: KK-YYMMDD-NNN
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_takes (
  id                    INT AUTO_INCREMENT PRIMARY KEY,
  code                  VARCHAR(20) NOT NULL UNIQUE,
  status                ENUM('draft','finished','cancelled') NOT NULL DEFAULT 'draft',
  started_at            DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finished_at           DATETIME NULL,
  by_staff_id           INT NOT NULL,
  finished_by_staff_id  INT NULL,
  note                  TEXT NULL,
  total_lines           INT NOT NULL DEFAULT 0,
  total_variance_abs    INT NOT NULL DEFAULT 0,
  is_deleted            TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_stock_takes_by_staff
    FOREIGN KEY (by_staff_id) REFERENCES staff(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_stock_takes_finished_by
    FOREIGN KEY (finished_by_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_stock_takes_status_started (status, started_at),
  INDEX idx_stock_takes_by_staff       (by_staff_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: stock_take_lines — chi tiet dem cho tung san pham
-- system_qty = snapshot luc QTV NHAP dem (de UI canh bao neu thay doi sau).
-- Khi finish: tinh variance = counted_qty - product_stock.quantity HIEN TAI
-- (lock FOR UPDATE), khong phai system_qty da snap.
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS stock_take_lines (
  id             INT AUTO_INCREMENT PRIMARY KEY,
  stock_take_id  INT NOT NULL,
  product_id     INT NOT NULL,
  system_qty     INT NOT NULL,
  counted_qty    INT NOT NULL,
  receipt_id     INT NULL,
  note           VARCHAR(500) NULL,
  CONSTRAINT chk_stock_take_lines_counted_nonneg CHECK (counted_qty >= 0),
  CONSTRAINT uk_stock_take_lines_take_product
    UNIQUE (stock_take_id, product_id),
  CONSTRAINT fk_stock_take_lines_take
    FOREIGN KEY (stock_take_id) REFERENCES stock_takes(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_stock_take_lines_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_stock_take_lines_receipt
    FOREIGN KEY (receipt_id) REFERENCES stock_receipts(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_stock_take_lines_take    (stock_take_id),
  INDEX idx_stock_take_lines_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Mo rong stock_receipts: tro nguoc ve phien kiem ke (neu co)
-- ----------------------------------------------------------
ALTER TABLE stock_receipts
  ADD COLUMN ref_stock_take_id INT NULL AFTER ref_staff_id,
  ADD INDEX idx_receipts_stock_take (ref_stock_take_id),
  ADD CONSTRAINT fk_receipts_stock_take
    FOREIGN KEY (ref_stock_take_id) REFERENCES stock_takes(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SELECT * FROM stock_takes;
--   SELECT * FROM stock_take_lines;
--   SHOW COLUMNS FROM stock_receipts LIKE 'ref_stock_take_id';
-- ==========================================================


-- ==========================================================
-- FILE: migration_021_order_returns.sql
-- ==========================================================

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


-- ==========================================================
-- FILE: migration_022_refund.sql
-- ==========================================================

-- ==========================================================
-- Migration 022 — Hoan tien (refund) + chuan hoa luong tra hang
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc tieu:
--   1. Cho phep ghi nhan hoan tien cho khach khi:
--        a) Khach quay dau tra hang sau khi don da done (order_return_done)
--        b) Don bi cancel sau khi khach da tra (collections da nop /
--           admin mark-paid). Truoc day chi ghi note '[REFUND_REQUIRED]'
--           → khong tracking duoc da hoan thuc su chua.
--   2. Bao cao doanh thu /revenue tu dong tru phan refund.
--
-- Sau migration nay:
--   - INSERT order_payments(source='refund', amount=so_tien_hoan, confirmed=1)
--     -> reports tu hieu, paid_amount cua don GIAM tuong ung.
--   - reason_code='order_return_done' van dung cho phieu nhap kho khi nhan
--     hang ve, KHONG dung cho ban thanh toan (ban thanh toan dung 'refund').
--
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- Mo rong source enum: them 'refund'
-- amount van >= 0 (so duong, GIAM paid_amount khi insert)
-- ----------------------------------------------------------
ALTER TABLE order_payments
  MODIFY COLUMN source ENUM(
    'staff_collection','admin_mark_paid','customer_self_pay','admin_pending','refund'
  ) NOT NULL;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM order_payments LIKE 'source';
-- ==========================================================


-- ==========================================================
-- FILE: migration_023_subscription_account.sql
-- ==========================================================

-- ==========================================================
-- Migration 023 — Them subscription_account cho orders
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc tieu:
--   - Khi khach dat dich vu Gia han / Sua chua / Bao hanh,
--     khach dien "Tai khoan app theo doi" (vd: demoxetai) de
--     KTV / admin tra cuu xe nao tren he GoTrack.
--   - Truoc day field nay khong co cho luu -> phai gop vao note
--     -> kho filter / report.
--
-- Sau migration nay:
--   - orders.subscription_account chua username app GoTrack ma khach
--     dung de theo doi xe. NULL voi don khach moi (Lap moi) chua co tai khoan.
--   - Co the filter/report theo tai khoan sau nay.
--
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

ALTER TABLE orders
  ADD COLUMN subscription_account VARCHAR(64) NULL AFTER vehicle_plate;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM orders LIKE 'subscription_account';
-- ==========================================================


-- ==========================================================
-- FILE: migration_024_customer_product_prices.sql
-- ==========================================================

-- Migration 024: gia rieng cho tung dai ly + san pham (override).
--
-- Priority resolve gia khi GET san pham:
--   1) customer_product_prices (override rieng cho customer + product)
--   2) product_prices via customers.default_tier_id (gia theo cap dai ly)
--   3) product_prices via price_tiers.is_default = 1 (fallback ban le)
--
-- Khach thuong (type='retail') khong co cap -> chi roi xuong buoc 3.
-- Hard delete khi admin xoa override (chi la config, khong can audit).
--
-- Idempotent.

CREATE TABLE IF NOT EXISTS customer_product_prices (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  product_id  INT NOT NULL,
  price       DECIMAL(15,2) NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_cust_prod (customer_id, product_id),
  CONSTRAINT fk_cpp_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_cpp_product  FOREIGN KEY (product_id)  REFERENCES products(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- ==========================================================
-- FILE: migration_025_debts.sql
-- ==========================================================

-- ==========================================================
-- Migration 025 — Module Cong no (Rolling Balance) + Settings (QR + bank)
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc tieu:
--   - Thay module "Nop tien (remittances)" trong admin UI bang "Cong no".
--   - Cho admin nhin tong quan: ai dang no bao nhieu (khach le + dai ly + KTV).
--   - Co the bam "Tat toan" → in bill A4 co QR + thong tin TK.
--
-- Mo hinh tat toan = Rolling Balance (so du goi dau):
--   - Khach no nhieu don, tra 1 phan tien.
--   - He thong "ket" tat ca don no hien tai vao 1 phieu tat toan (snapshot).
--   - So tien con thieu cong vao customers.opening_balance (so du dau ky).
--   - Don moi sau do cong don vao no, hien thi "No ky truoc: X" tren bill.
--
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi → bo qua loi do.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- 1. customers.opening_balance — so du goi dau (BIGINT co dau)
--    > 0: khach dang no
--    < 0: khach tra thua (hiem, van support)
-- ----------------------------------------------------------
ALTER TABLE customers
  ADD COLUMN opening_balance BIGINT NOT NULL DEFAULT 0 AFTER credit_term_days;

-- ----------------------------------------------------------
-- 2. orders: cot danh dau don da duoc "ket" vao phieu yeu cau thanh toan
-- ----------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN debt_carried_at DATETIME NULL AFTER paid_amount,
  ADD INDEX idx_orders_debt_carried (customer_id, debt_carried_at);

-- ----------------------------------------------------------
-- 3. app_settings — bang key-value cau hinh chung
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
  `key`        VARCHAR(60) PRIMARY KEY,
  `value`      TEXT NULL,
  changed_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  changed_by   INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed 5 QR slot rong + thong tin tai khoan ngan hang
INSERT IGNORE INTO app_settings (`key`, `value`) VALUES
  ('qr.slot1.image_url', ''),
  ('qr.slot1.label',     'QR chinh'),
  ('qr.slot2.image_url', ''),
  ('qr.slot2.label',     'QR du phong 1'),
  ('qr.slot3.image_url', ''),
  ('qr.slot3.label',     'QR du phong 2'),
  ('qr.slot4.image_url', ''),
  ('qr.slot4.label',     'QR du phong 3'),
  ('qr.slot5.image_url', ''),
  ('qr.slot5.label',     'QR du phong 4'),
  ('bank.account_no',    ''),
  ('bank.account_name',  ''),
  ('bank.bank_name',     ''),
  ('bank.default_qr_slot','1');

-- ==========================================================
-- DONE.
-- Kiem tra:
--   DESC customers;            -- thay opening_balance
--   DESC orders;               -- thay debt_carried_at
--   SELECT * FROM app_settings;
-- ==========================================================


-- ==========================================================
-- FILE: migration_028_renewal_orders.sql
-- ==========================================================

-- ==========================================================
-- Migration 028 — Don gia han (renewal) — flow bao gia + link public
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc tieu:
--   - Khach tao don gia han (service_kind='renewal') -> admin tra GoTrack
--     -> bao gia tung dong xe -> sinh public_token -> gui link cho khach.
--   - Khach mo link public, bam Chap nhan + CK hoac Ghi no.
--   - Admin thuc hien gia han thu cong tren 5g roi danh dau hoan tat.
--
-- Thay doi:
--   1. orders.status: them 'quoted', 'awaiting_payment', 'payment_reported'
--   2. orders: them public_token (token public de khach mo link khong can login)
--   3. order_items: them 4 cot mo ta tung xe gia han
--      (NULL voi don install/maintenance/warranty hien tai — khong anh huong)
--
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- 1. Mo rong enum status: them 3 trang thai cho flow renewal
--    Giu nguyen toan bo enum cu de khong vo data hien co.
-- ----------------------------------------------------------
ALTER TABLE orders
  MODIFY COLUMN status ENUM(
    'pending_review','new','assigned','warehouse_released',
    'in_progress','done','cancelled',
    'customer_owes','pending_admin_confirm','staff_owes',
    'quoted','awaiting_payment','payment_reported'
  ) NOT NULL DEFAULT 'new';

-- ----------------------------------------------------------
-- 2. orders.public_token — token sinh khi admin bam "Bao gia"
--    URL: /customer/order-public.html?t=<public_token>
--    NULL voi don thuong (khong gia han) hoac chua bao gia.
-- ----------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN public_token VARCHAR(64) NULL UNIQUE AFTER subscription_account;

-- ----------------------------------------------------------
-- 3. order_items: them 4 cot cho dong xe gia han
--    1 dong = 1 xe. qty luon = 1 voi renewal.
--    NULL voi item thuong.
-- ----------------------------------------------------------
ALTER TABLE order_items
  ADD COLUMN vehicle_plate        VARCHAR(30)  NULL AFTER unit_price,
  ADD COLUMN imei                 VARCHAR(100) NULL AFTER vehicle_plate,
  ADD COLUMN subscription_account VARCHAR(64)  NULL AFTER imei,
  ADD COLUMN years                TINYINT      NULL AFTER subscription_account;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM orders LIKE 'public_token';
--   SHOW COLUMNS FROM order_items LIKE 'vehicle_plate';
--   SHOW COLUMNS FROM order_items LIKE 'years';
-- ==========================================================


-- ==========================================================
-- FILE: migration_029_warranty_orders.sql
-- ==========================================================

-- ==========================================================
-- Migration 029 — Bao hanh: rebuild lai bang theo flow moi
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc dich:
--   - Thay the warranty_requests cu (claim_type warranty/paid_repair, status
--     diagnosing/repairing/replaced) bang warranty_orders flow gon hon.
--   - Tich hop voi cong no Rolling Balance (debt_carried_at)
--     giong don orders. Tinh chi phi qua cot cost_amount nhap tay.
--   - Cho phep gan 1 phieu xuat kho (stock_receipts) lay thiet bi tu kho khi can
--     thay the qua cot moi ref_warranty_order_id tren stock_receipts.
-- Quy uoc:
--   - Soft delete is_deleted (giong toan he thong)
--   - Code: BH-DDMM-NNN (sinh trong BE — utils/warrantyState.js)
--   - request_date DATE (ngay tao yeu cau), KHONG dung created_at/updated_at
--   - status flow: pending -> received -> recovered -> awaiting_warranty
--                  -> warranty_done -> delivering -> completed
--                  Cho phep skip awaiting_warranty/warranty_done neu xu ly noi bo
--                  (recovered -> delivering thang).
-- ==========================================================

USE gpsviet;

-- 1) Drop schema cu (chua co data san xuat)
DROP TABLE IF EXISTS warranty_requests;

-- 2) Bang chinh
CREATE TABLE warranty_orders (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  code                 VARCHAR(30)  NOT NULL UNIQUE,           -- BH-DDMM-NNN

  customer_id          INT          NOT NULL,                  -- FK customers (retail HOAC dealer)

  -- Khach mo ta thiet bi
  license_plate        VARCHAR(30)  NULL,                      -- bien so xe
  device_name          VARCHAR(100) NULL,                      -- ten thiet bi (free text)
  imei_search          VARCHAR(100) NULL,                      -- IMEI khach noi (chi luu de tim, KHONG FK)
  reason_text          TEXT         NOT NULL,                  -- ly do bao hanh
  note_text            TEXT         NULL,                      -- ghi chu them
  address              VARCHAR(500) NULL,                      -- dia chi thu hoi

  -- KTV xu ly
  assigned_staff_id    INT          NULL,                      -- KTV duoc gan
  recovered_image_url  VARCHAR(500) NULL,                      -- anh KTV chup luc thu hoi (BAT BUOC khi sang recovered)
  delivered_image_url  VARCHAR(500) NULL,                      -- anh KTV chup luc giao lai (optional)

  -- Gui di NCC bao hanh
  warranty_partner     VARCHAR(200) NULL,                      -- ten/dia chi noi gui (chi text)
  sent_at              DATE         NULL,                      -- ngay gui di
  returned_at          DATE         NULL,                      -- ngay nhan ve

  -- Tien
  cost_amount          BIGINT       NOT NULL DEFAULT 0,        -- chi phi BH (admin nhap tay)
  paid_amount          BIGINT       NOT NULL DEFAULT 0,        -- da thu

  -- Cong no Rolling Balance (giong orders)
  debt_carried_at      DATETIME     NULL,                      -- da ket vao phieu yeu cau thanh toan

  -- Trang thai
  status ENUM(
    'pending',            -- khach lap don, cho admin tiep nhan
    'received',           -- admin tiep nhan
    'recovered',          -- KTV thu hoi xong (co anh)
    'awaiting_warranty',  -- da gui di NCC
    'warranty_done',      -- NCC tra ve
    'delivering',         -- dang giao tra khach
    'completed',          -- hoan tat
    'cancelled'
  ) NOT NULL DEFAULT 'pending',

  request_date         DATE         NOT NULL,                  -- ngay tao yeu cau

  creator_type         ENUM('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin',
  creator_id           INT          NULL,
  is_deleted           TINYINT(1)   NOT NULL DEFAULT 0,

  INDEX idx_wo_status        (status),
  INDEX idx_wo_customer      (customer_id),
  INDEX idx_wo_staff         (assigned_staff_id),
  INDEX idx_wo_request       (request_date),
  INDEX idx_wo_deleted       (is_deleted),
  INDEX idx_wo_debt_carried  (debt_carried_at),
  INDEX idx_wo_plate         (license_plate),
  INDEX idx_wo_imei          (imei_search)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Them FK rieng tung cai (de neu mot FK loi thi de debug; bang van tao xong)
ALTER TABLE warranty_orders
  ADD CONSTRAINT fk_wo_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE warranty_orders
  ADD CONSTRAINT fk_wo_staff FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 4) Them ref_warranty_order_id vao stock_receipts (de track phieu xuat cho BH)
ALTER TABLE stock_receipts
  ADD COLUMN ref_warranty_order_id INT NULL AFTER ref_staff_id,
  ADD INDEX idx_receipts_warranty (ref_warranty_order_id);

ALTER TABLE stock_receipts
  ADD CONSTRAINT fk_receipt_warranty FOREIGN KEY (ref_warranty_order_id)
    REFERENCES warranty_orders(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'warranty%';
--   DESCRIBE warranty_orders;
--   SHOW COLUMNS FROM stock_receipts LIKE 'ref_warranty_order_id';
-- ==========================================================


-- ==========================================================
-- FILE: migration_030_orders_created_at.sql
-- ==========================================================

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


-- ==========================================================
-- FILE: migration_031_renewal_phone.sql
-- ==========================================================

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


-- ==========================================================
-- FILE: migration_032_repair_orders.sql
-- ==========================================================

-- ==========================================================
-- Migration 032 — Sua chua (repair_orders)
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc dich:
--   - Tach module sua chua (repair) ra khoi warranty (BH).
--   - BH mien phi, SC co thu phi va co vong bao gia (KTV chan doan ->
--     admin chot gia voi khach -> khach duyet -> moi sua).
--   - Vat tu thay di qua kho (stock_receipts.ref_repair_order_id).
--   - Bill khoa khi status='done' (KTV bao xong) — admin khong sua duoc nua.
--
-- Quy uoc:
--   - Soft delete is_deleted, KHONG dung created_at/updated_at (trung quy uoc DB).
--   - Code: SC-DDMM-NNN (sinh trong utils/repairState.js).
--   - request_date DATE giong warranty_orders.
--   - Cong no Rolling Balance qua debt_carried_at.
--
-- Status flow:
--   pending           (khach/admin tao)
--   -> assigned       (admin gan KTV)
--   -> diagnosing     (KTV nhan may, upload anh, dang chan doan)
--   -> quoted         (KTV nop bao gia: items + cong)
--   -> awaiting_customer  (admin chot gia + gui cho khach xem)
--   -> approved       (khach bam Duyet bao gia tren portal)
--                     hoac -> rejected (khach tu choi)
--   -> repairing      (admin xuat kho vat tu, KTV sua)
--   -> done           (KTV bao xong — BILL KHOA)
--   -> delivering     (KTV upload anh giao)
--   -> completed      (xong)
--   + cancelled (huy truoc repairing)
--   + rejected (khach tu choi bao gia — admin co the sua bao gia gui lai
--               hoac chuyen sang cancelled)
--
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

-- 1) Bang chinh
CREATE TABLE repair_orders (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  code                 VARCHAR(30)  NOT NULL UNIQUE,           -- SC-DDMM-NNN

  customer_id          INT          NOT NULL,                  -- FK customers (retail HOAC dealer)

  -- Khach mo ta thiet bi / van de
  license_plate        VARCHAR(30)  NULL,                      -- bien so xe
  device_name          VARCHAR(100) NULL,                      -- ten thiet bi (free text)
  imei_search          VARCHAR(100) NULL,                      -- IMEI khach noi (chi luu de tim, KHONG FK)
  reason_text          TEXT         NOT NULL,                  -- ly do khach mo ta loi
  note_text            TEXT         NULL,                      -- ghi chu them
  address              VARCHAR(500) NULL,                      -- dia chi thu hoi may

  -- KTV xu ly
  assigned_staff_id    INT          NULL,                      -- KTV duoc gan
  recovered_image_url  VARCHAR(500) NULL,                      -- anh KTV chup luc nhan may (BAT BUOC khi sang diagnosing)
  delivered_image_url  VARCHAR(500) NULL,                      -- anh KTV chup luc giao tra (optional)
  diagnose_text        TEXT         NULL,                      -- KTV nhap chan doan (sau khi nhan may)

  -- Bao gia
  service_fee          BIGINT       NOT NULL DEFAULT 0,        -- cong sua (sync 1 chieu voi tasks.wage_amount neu co task)
  parts_total          BIGINT       NOT NULL DEFAULT 0,        -- tong vat tu (auto tu repair_items)
  total_amount         BIGINT       NOT NULL DEFAULT 0,        -- service_fee + parts_total + sum(repair_charges)
  paid_amount          BIGINT       NOT NULL DEFAULT 0,        -- da thu

  -- Cot moc thoi gian quan trong (giup audit + sort tab)
  quoted_at            DATETIME     NULL,                      -- KTV nop bao gia
  customer_sent_at     DATETIME     NULL,                      -- admin chot va gui khach
  customer_decided_at  DATETIME     NULL,                      -- khach bam duyet/tu choi
  repairing_at         DATETIME     NULL,                      -- bat dau sua
  done_at              DATETIME     NULL,                      -- KTV bao xong (= moc khoa bill)
  delivered_at         DATETIME     NULL,                      -- giao xong cho khach

  -- Cong no Rolling Balance (giong warranty_orders + orders)
  debt_carried_at      DATETIME     NULL,

  -- Trang thai
  status ENUM(
    'pending',            -- khach/admin lap don
    'assigned',           -- admin da gan KTV
    'diagnosing',         -- KTV nhan may + dang chan doan (co anh nhan)
    'quoted',             -- KTV nop bao gia
    'awaiting_customer',  -- admin da gui cho khach xem
    'approved',           -- khach duyet bao gia
    'rejected',           -- khach tu choi bao gia
    'repairing',          -- da xuat kho, KTV dang sua
    'done',               -- KTV bao xong, BILL KHOA
    'delivering',         -- dang giao tra
    'completed',          -- hoan tat
    'cancelled'
  ) NOT NULL DEFAULT 'pending',

  request_date         DATE         NOT NULL,                  -- ngay tao yeu cau

  creator_type         ENUM('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin',
  creator_id           INT          NULL,
  is_deleted           TINYINT(1)   NOT NULL DEFAULT 0,

  INDEX idx_ro_status        (status),
  INDEX idx_ro_customer      (customer_id),
  INDEX idx_ro_staff         (assigned_staff_id),
  INDEX idx_ro_request       (request_date),
  INDEX idx_ro_deleted       (is_deleted),
  INDEX idx_ro_debt_carried  (debt_carried_at),
  INDEX idx_ro_plate         (license_plate),
  INDEX idx_ro_imei          (imei_search)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE repair_orders
  ADD CONSTRAINT fk_ro_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE repair_orders
  ADD CONSTRAINT fk_ro_staff FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 2) Bang vat tu thay (tuong tu order_items, tach rieng vi quan ly khac)
CREATE TABLE repair_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  repair_order_id INT          NOT NULL,
  product_id      INT          NOT NULL,
  qty             INT          NOT NULL DEFAULT 1,
  unit_price      BIGINT       NOT NULL DEFAULT 0,
  imei            VARCHAR(50)  NULL,                  -- IMEI cu the cua ca the duoc thay (neu co)
  note            VARCHAR(255) NULL,
  is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_ritem_order   FOREIGN KEY (repair_order_id) REFERENCES repair_orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ritem_product FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  INDEX idx_ritem_order (repair_order_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3) Bang phi linh hoat (giong order_charges; "Cong sua" sync 1 chieu voi tasks.wage_amount)
--    kind='discount' luu amount AM (vd: -100000)
CREATE TABLE repair_charges (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  repair_order_id INT          NOT NULL,
  kind            ENUM('service','fee','discount') NOT NULL DEFAULT 'service',
  label           VARCHAR(150) NOT NULL,             -- vd: "Cong sua", "Phi kham", "Giam gia"
  amount          BIGINT       NOT NULL DEFAULT 0,
  is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_rcharge_order FOREIGN KEY (repair_order_id) REFERENCES repair_orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_rcharge_order (repair_order_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4) Mo rong tasks.kind de chua loai 'repair' (co the gan task cho KTV nhu cac loai khac)
ALTER TABLE tasks
  MODIFY COLUMN kind ENUM('install','maintenance','renew','uninstall','repair')
                NOT NULL DEFAULT 'install';


-- 5) Mo rong stock_receipts: them ref_repair_order_id de track phieu xuat cho SC
ALTER TABLE stock_receipts
  ADD COLUMN ref_repair_order_id INT NULL AFTER ref_warranty_order_id,
  ADD INDEX idx_receipts_repair (ref_repair_order_id);

ALTER TABLE stock_receipts
  ADD CONSTRAINT fk_receipt_repair FOREIGN KEY (ref_repair_order_id)
    REFERENCES repair_orders(id) ON DELETE SET NULL ON UPDATE CASCADE;


-- 6) Mo rong messages: them repair_order_id de chat tag tin nhan ve don SC
--    (giong order_id da co tu migration_017_chat_unified)
ALTER TABLE messages
  ADD COLUMN repair_order_id INT NULL AFTER order_id,
  ADD INDEX idx_msg_repair (repair_order_id);

ALTER TABLE messages
  ADD CONSTRAINT fk_msg_repair FOREIGN KEY (repair_order_id)
    REFERENCES repair_orders(id) ON DELETE SET NULL ON UPDATE CASCADE;


-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'repair%';
--   DESCRIBE repair_orders;
--   SHOW COLUMNS FROM stock_receipts LIKE 'ref_repair_order_id';
--   SHOW COLUMNS FROM tasks LIKE 'kind';
--   SHOW COLUMNS FROM messages LIKE 'repair_order_id';
-- ==========================================================


-- ==========================================================
-- FILE: migration_033_repair_seed.sql
-- ==========================================================

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


-- ==========================================================
-- FILE: migration_034_merge_tasks_into_orders.sql
-- ==========================================================

-- ==========================================================
-- Migration 034 — Gop bang tasks vao orders (xoa hoan toan tasks)
-- Chay 1 lan sau migration_033_repair_seed.sql
-- ----------------------------------------------------------
-- Ly do:
--   - 2 luong status song song (orders + tasks) gay lech du lieu.
--   - 1 don chi 1 KTV, gan ai thi ghi de truc tiep, khong can lich su.
-- Thay doi:
--   1. orders: them assigned_staff_id, kind, due_at, started_at,
--      completed_at, wage_amount, ktv_note
--   2. Tao bang order_checklist (thay task_checklist)
--   3. Tao bang order_attachments (thay task_attachments)
--   4. Doi FK cac bang con: collections, release_pool, staff_reviews
--      task_id -> order_id
--   5. Drop cot task_id/ref_task_id/held_for_task_id o:
--      stock_receipts, order_payments, stock_items
--   6. DROP bang tasks, task_checklist, task_attachments
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao
--        "Duplicate column" nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

-- ==========================================================
-- BUOC 1: Them cot vao orders
-- ==========================================================

ALTER TABLE orders
  ADD COLUMN assigned_staff_id INT          NULL                          AFTER service_kind,
  ADD COLUMN kind              ENUM('install','maintenance','renew','uninstall')
                               NOT NULL DEFAULT 'install'                 AFTER assigned_staff_id,
  ADD COLUMN due_at            DATETIME     NULL                          AFTER kind,
  ADD COLUMN started_at        DATETIME     NULL                          AFTER due_at,
  ADD COLUMN completed_at      DATETIME     NULL                          AFTER started_at,
  ADD COLUMN wage_amount       BIGINT       NOT NULL DEFAULT 0            AFTER completed_at,
  ADD COLUMN ktv_note          TEXT         NULL                          AFTER wage_amount,
  ADD INDEX idx_orders_assigned_staff (assigned_staff_id),
  ADD INDEX idx_orders_kind           (kind),
  ADD INDEX idx_orders_completed_at   (completed_at),
  ADD CONSTRAINT fk_orders_assigned_staff
    FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================================================
-- BUOC 2: Tao bang order_checklist (thay task_checklist)
-- ==========================================================

CREATE TABLE IF NOT EXISTS order_checklist (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT          NOT NULL,
  step       VARCHAR(255) NOT NULL,
  is_done    TINYINT(1)   NOT NULL DEFAULT 0,
  done_at    DATETIME     NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  CONSTRAINT fk_order_checklist_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_order_checklist_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- BUOC 3: Tao bang order_attachments (thay task_attachments)
-- ==========================================================

CREATE TABLE IF NOT EXISTS order_attachments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT          NOT NULL,
  url         VARCHAR(500) NOT NULL,
  caption     VARCHAR(255) NULL,
  stage       ENUM('receive','deliver','other') NOT NULL DEFAULT 'other',
  uploaded_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_att_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_order_att_order (order_id),
  INDEX idx_order_att_stage (order_id, stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- BUOC 4: Migrate du lieu tu tasks -> orders
-- (1 order = 1 task moi nhat chua xoa)
-- ==========================================================

UPDATE orders o
LEFT JOIN (
  SELECT t.order_id, t.assigned_staff_id, t.kind, t.due_at,
         t.started_at, t.completed_at, t.wage_amount, t.note
    FROM tasks t
    JOIN (
      SELECT order_id, MAX(id) AS max_id
        FROM tasks
       WHERE is_deleted = 0
       GROUP BY order_id
    ) m ON m.max_id = t.id
) tt ON tt.order_id = o.id
   SET o.assigned_staff_id = tt.assigned_staff_id,
       o.kind              = COALESCE(tt.kind, 'install'),
       o.due_at            = tt.due_at,
       o.started_at        = tt.started_at,
       o.completed_at      = tt.completed_at,
       o.wage_amount       = COALESCE(tt.wage_amount, 0),
       o.ktv_note          = tt.note
 WHERE o.is_deleted = 0;

-- Backfill completed_at cho don da o final-status nhung task chua done
-- (tranh recalcOrderFinalStatus skip nham)
UPDATE orders
   SET completed_at = NOW()
 WHERE completed_at IS NULL
   AND status IN ('done','customer_owes','pending_admin_confirm','staff_owes');

-- Migrate task_checklist -> order_checklist
INSERT INTO order_checklist (order_id, step, is_done, done_at, sort_order)
SELECT t.order_id, c.step, c.is_done, c.done_at, c.sort_order
  FROM task_checklist c
  JOIN tasks t ON t.id = c.task_id
 WHERE t.is_deleted = 0;

-- Migrate task_attachments -> order_attachments
INSERT INTO order_attachments (order_id, url, caption, stage, uploaded_at)
SELECT t.order_id, a.url, a.caption,
       COALESCE(a.stage, 'other'), a.uploaded_at
  FROM task_attachments a
  JOIN tasks t ON t.id = a.task_id
 WHERE t.is_deleted = 0;

-- ==========================================================
-- BUOC 5: Doi FK cac bang con (task_id -> order_id)
-- ==========================================================

-- 5.1 collections.task_id -> collections.order_id
ALTER TABLE collections ADD COLUMN order_id INT NULL AFTER task_id;
UPDATE collections c JOIN tasks t ON t.id = c.task_id SET c.order_id = t.order_id;
ALTER TABLE collections DROP FOREIGN KEY fk_coll_task;
ALTER TABLE collections DROP INDEX idx_coll_task;
ALTER TABLE collections DROP COLUMN task_id;
ALTER TABLE collections MODIFY COLUMN order_id INT NOT NULL;
ALTER TABLE collections
  ADD CONSTRAINT fk_coll_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD INDEX idx_coll_order (order_id);

-- 5.2 release_pool.task_id -> release_pool.order_id
ALTER TABLE release_pool ADD COLUMN order_id INT NULL AFTER task_id;
UPDATE release_pool rp JOIN tasks t ON t.id = rp.task_id SET rp.order_id = t.order_id;
ALTER TABLE release_pool DROP FOREIGN KEY fk_release_pool_task;
ALTER TABLE release_pool DROP INDEX uk_release_pool_task_product;
ALTER TABLE release_pool DROP INDEX idx_release_pool_task;
ALTER TABLE release_pool DROP COLUMN task_id;
ALTER TABLE release_pool MODIFY COLUMN order_id INT NOT NULL;
ALTER TABLE release_pool
  ADD CONSTRAINT fk_release_pool_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD UNIQUE KEY uk_release_pool_order_product (order_id, product_id),
  ADD INDEX idx_release_pool_order (order_id);

-- 5.3 staff_reviews.task_id -> staff_reviews.order_id
ALTER TABLE staff_reviews ADD COLUMN order_id INT NULL AFTER staff_id;
UPDATE staff_reviews r JOIN tasks t ON t.id = r.task_id SET r.order_id = t.order_id;
ALTER TABLE staff_reviews DROP FOREIGN KEY fk_review_task;
ALTER TABLE staff_reviews DROP INDEX idx_review_task;
ALTER TABLE staff_reviews DROP COLUMN task_id;
ALTER TABLE staff_reviews MODIFY COLUMN order_id INT NOT NULL;
ALTER TABLE staff_reviews
  ADD CONSTRAINT fk_review_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD INDEX idx_review_order (order_id);

-- 5.4 stock_receipts.ref_task_id (chi index, khong FK) - DROP
ALTER TABLE stock_receipts DROP INDEX idx_receipts_task;
ALTER TABLE stock_receipts DROP COLUMN ref_task_id;

-- 5.5 order_payments.task_id (chi index, khong FK) - DROP
ALTER TABLE order_payments DROP INDEX idx_payment_task;
ALTER TABLE order_payments DROP COLUMN task_id;

-- 5.6 stock_items.held_for_task_id (legacy) - DROP
ALTER TABLE stock_items DROP FOREIGN KEY fk_stock_held_task;
ALTER TABLE stock_items DROP COLUMN held_for_task_id;

-- ==========================================================
-- BUOC 6: DROP bang tasks (va 2 bang con)
-- Phai drop task_checklist + task_attachments truoc vi co FK -> tasks
-- ==========================================================

DROP TABLE IF EXISTS task_checklist;
DROP TABLE IF EXISTS task_attachments;
DROP TABLE IF EXISTS tasks;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'task%';                               -- empty
--   SHOW COLUMNS FROM orders LIKE 'assigned_staff_id';      -- co
--   SHOW COLUMNS FROM orders LIKE 'wage_amount';            -- co
--   SHOW COLUMNS FROM collections LIKE 'order_id';          -- co
--   SHOW COLUMNS FROM collections LIKE 'task_id';           -- empty
--   SHOW COLUMNS FROM release_pool LIKE 'order_id';         -- co
--   SHOW COLUMNS FROM staff_reviews LIKE 'order_id';        -- co
--   SHOW COLUMNS FROM order_payments LIKE 'task_id';        -- empty
--   SHOW COLUMNS FROM stock_receipts LIKE 'ref_task_id';    -- empty
--   SHOW COLUMNS FROM stock_items LIKE 'held_for_task_id';  -- empty
--   DESCRIBE order_checklist;
--   DESCRIBE order_attachments;
-- ==========================================================


-- ==========================================================
-- FILE: migration_035_notifications.sql
-- ==========================================================

-- ==========================================================
-- Migration 035 — Bang notifications cho admin
-- Chay 1 lan sau migration_034
-- ----------------------------------------------------------
-- Muc dich:
--   Luu lich su thong bao realtime cho admin (KTV thao tac don,
--   khach tao don/phu hieu, KTV nop tien...). Khac voi seen_at
--   tren orders/customers (chi dem so) — bang nay co text + link
--   click vao se mo dung don.
-- type values:
--   'order_new'                 - khach tao don (pending_review)
--   'badge_new'                 - khach dang ky phu hieu
--   'order_receive_uploaded'    - KTV chup anh nhan hang lan dau
--   'order_completed'           - KTV /complete
--   'staff_remit'               - KTV nop tien
-- link_url: VD '/admin/orders.html#order-123' — FE phai tu xu ly hash
-- ==========================================================

USE gpsviet;

CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  type        VARCHAR(50)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     VARCHAR(500) NOT NULL,
  link_url    VARCHAR(500) NULL,

  ref_order_id        INT NULL,
  ref_customer_id     INT NULL,
  ref_staff_id        INT NULL,

  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  read_at     DATETIME     NULL,
  is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_notif_unread (is_deleted, is_read, id),
  INDEX idx_notif_created (created_at),
  INDEX idx_notif_ref_order (ref_order_id),

  CONSTRAINT fk_notif_order
    FOREIGN KEY (ref_order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notif_customer
    FOREIGN KEY (ref_customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notif_staff
    FOREIGN KEY (ref_staff_id) REFERENCES staff(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   DESCRIBE notifications;
--   SHOW INDEX FROM notifications;
-- ==========================================================


-- ==========================================================
-- FILE: migration_036_warranty_items.sql
-- ==========================================================

-- ==========================================================
-- Migration 036 — Bao hanh: them bang warranty_order_items
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc dich:
--   - Phu day du luong: nhan tu khach -> gui NCC -> nhan ve -> giao khach
--     + thay the lay tu kho. Truoc day chi co cot text device_name.
--   - Cho admin/KTV nhap don gia tung mon (chi de ghi nhan; cost_amount
--     van do admin nhap tay theo lua chon nguoi dung).
--   - Cho phep KTV thu tien thay khach o buoc complete (3 nhanh:
--     KTV thu / Admin thu / Khach no) — moi them tu module orders.
--
-- Quy uoc:
--   - Soft delete is_deleted (giong toan he thong)
--   - KHONG dung created_at / updated_at
--
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

-- 1) Bang warranty_order_items
CREATE TABLE warranty_order_items (
  id                  INT AUTO_INCREMENT PRIMARY KEY,
  warranty_order_id   INT          NOT NULL,
  kind ENUM(
    'received_from_customer',  -- KTV nhan tu khach luc thu hoi
    'sent_to_partner',         -- gui di NCC bao hanh
    'received_back',           -- NCC tra ve
    'delivered_to_customer',   -- giao tra khach
    'replacement'              -- thay the lay tu kho
  ) NOT NULL,
  product_id          INT          NULL,                  -- NULL = nhap tay (khong co trong kho)
  name                VARCHAR(150) NOT NULL,               -- snapshot ten (ke ca khi co product_id)
  imei                VARCHAR(50)  NULL,
  qty                 INT          NOT NULL DEFAULT 1,
  unit_price          BIGINT       NOT NULL DEFAULT 0,
  note                VARCHAR(255) NULL,

  -- Cho replacement: track xuat kho
  released_at         DATETIME     NULL,                   -- thoi diem xuat kho
  release_receipt_id  INT          NULL,                   -- FK stock_receipts (phieu xuat)

  is_deleted          TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_woi_order FOREIGN KEY (warranty_order_id)
    REFERENCES warranty_orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_woi_product FOREIGN KEY (product_id)
    REFERENCES products(id) ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_woi_receipt FOREIGN KEY (release_receipt_id)
    REFERENCES stock_receipts(id) ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_woi_order (warranty_order_id, is_deleted),
  INDEX idx_woi_kind  (warranty_order_id, kind, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 2) ALTER collections: cho task_id NULLable + them ref_warranty_order_id
--    (truoc day collections bat task_id NOT NULL — dung cho orders/tasks).
--    Bay gio mo rong de KTV thu tien cho don bao hanh.
-- (mig 034 da xoa cot task_id roi -> bo MODIFY, doi AFTER task_id -> AFTER order_id)
ALTER TABLE collections
  ADD COLUMN ref_warranty_order_id INT NULL AFTER order_id,
  ADD INDEX idx_coll_warranty (ref_warranty_order_id);

ALTER TABLE collections
  ADD CONSTRAINT fk_coll_warranty FOREIGN KEY (ref_warranty_order_id)
    REFERENCES warranty_orders(id) ON DELETE SET NULL ON UPDATE CASCADE;


-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'warranty_order_items';
--   DESCRIBE warranty_order_items;
--   SHOW COLUMNS FROM collections LIKE 'ref_warranty_order_id';
--   SHOW COLUMNS FROM collections LIKE 'task_id';   -- IS_NULLABLE = YES
-- ==========================================================


-- ==========================================================
-- FILE: migration_069_payment_requests.sql
-- ==========================================================

USE gpsviet;

CREATE TABLE IF NOT EXISTS payment_requests (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(30)  NOT NULL UNIQUE,
  customer_id   INT          NOT NULL,
  total_amount  BIGINT       NOT NULL DEFAULT 0,
  paid_amount   BIGINT       NOT NULL DEFAULT 0,
  remaining     BIGINT       NOT NULL DEFAULT 0,
  status        ENUM('pending','partially_paid','paid','expired','cancelled') NOT NULL DEFAULT 'pending',
  qr_slot       TINYINT      NULL,
  pay_method    ENUM('cash','transfer','mixed') NULL,
  note          TEXT         NULL,
  receipt_url   VARCHAR(500) NULL,
  created_by    INT          NOT NULL,
  created_at    DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  expires_at    DATETIME     NULL DEFAULT NULL,
  paid_at       DATETIME     NULL,
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_pr_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_pr_customer (customer_id, is_deleted),
  INDEX idx_pr_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS payment_request_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  request_id    INT NOT NULL,
  target_type   ENUM('order','opening_balance','payment_request') NOT NULL,
  target_id     INT NULL,
  amount        BIGINT NOT NULL,
  CONSTRAINT fk_pri_request FOREIGN KEY (request_id) REFERENCES payment_requests(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- FILE: migration_070_payment_receipts.sql
-- ==========================================================

CREATE TABLE IF NOT EXISTS payment_receipts (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  code        VARCHAR(30)  NOT NULL UNIQUE,
  request_id  INT          NOT NULL,
  amount      BIGINT       NOT NULL,
  pay_method  ENUM('cash','transfer','mixed') NOT NULL DEFAULT 'cash',
  receipt_url VARCHAR(500) NULL,
  note        TEXT         NULL,
  created_by  INT          NOT NULL,
  created_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_receipt_request FOREIGN KEY (request_id) REFERENCES payment_requests(id),
  INDEX idx_receipt_request (request_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- FILE: seed.sql
-- ==========================================================

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

-- (Sau mig 011 product_prices da bo cot label, dung tier_id thay the)
INSERT INTO product_prices (product_id, tier_id, price, sort_order)
SELECT @pid, t.id, v.price, v.sort_order
  FROM (SELECT 'Ban le' AS label, 1490000 AS price, 1 AS sort_order
        UNION ALL SELECT 'Ban si', 1300000, 2
        UNION ALL SELECT 'Dai ly', 1250000, 3) v
  JOIN price_tiers t ON t.label = v.label;

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


-- ==========================================================
-- Migration 077: Phieu ung luong + payslip_id tren don hang
-- ==========================================================

CREATE TABLE IF NOT EXISTS staff_salary_advances (
  id          INT          AUTO_INCREMENT PRIMARY KEY,
  staff_id    INT          NOT NULL,
  amount      BIGINT       NOT NULL DEFAULT 0,
  note        VARCHAR(300),
  payslip_id  INT          NULL DEFAULT NULL,
  carried_at  DATETIME     NULL DEFAULT NULL,
  created_by  INT          NULL,
  created_at  DATETIME     NOT NULL DEFAULT NOW(),
  is_deleted  TINYINT      NOT NULL DEFAULT 0,
  INDEX idx_adv_staff  (staff_id),
  INDEX idx_adv_slip   (payslip_id)
);

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS payslip_id INT NULL DEFAULT NULL;

ALTER TABLE order_staff_commissions
  ADD COLUMN IF NOT EXISTS payslip_id INT NULL DEFAULT NULL;

ALTER TABLE staff_payslips
  ADD COLUMN IF NOT EXISTS total_advances BIGINT   NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS advances_json  LONGTEXT          DEFAULT NULL;

SET FOREIGN_KEY_CHECKS=1;
-- DONE
