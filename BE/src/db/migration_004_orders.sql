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
