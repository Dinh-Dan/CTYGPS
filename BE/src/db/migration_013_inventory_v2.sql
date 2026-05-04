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
