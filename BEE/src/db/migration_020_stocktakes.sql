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
