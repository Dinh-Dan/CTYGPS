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
