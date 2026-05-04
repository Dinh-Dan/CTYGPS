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
