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
