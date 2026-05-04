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
