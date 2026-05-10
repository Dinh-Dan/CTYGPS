-- Migration 039: Phieu cap san pham cho KTV (staff_stock_issues)
-- Tach kho ca nhan KTV ra khoi flow don.
-- Admin tao phieu cap (draft) -> duyet (approved, sinh stock_receipt out + cong staff_holdings)
-- -> KTV xac nhan nhan (received, kem anh).
-- Don/BH/SC se tieu thu tu staff_holdings khi complete (PR rieng).

USE gpsviet;

-- ----------------------------------------------------------
-- Bang: staff_stock_issues — header phieu cap (CAP-DDMM-NNN)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_stock_issues (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  code                 VARCHAR(20)  NOT NULL UNIQUE,
  staff_id             INT NOT NULL,
  status               ENUM('draft','approved','received','rejected','cancelled')
                         NOT NULL DEFAULT 'draft',
  note                 VARCHAR(500) NULL,
  created_by_staff_id  INT NULL,
  created_at           TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_by_staff_id INT NULL,
  approved_at          DATETIME NULL,
  received_at          DATETIME NULL,
  received_photo_url   VARCHAR(500) NULL,
  rejected_reason      VARCHAR(500) NULL,
  ref_receipt_id       INT NULL,
  is_deleted           TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_ssi_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ssi_creator
    FOREIGN KEY (created_by_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ssi_approver
    FOREIGN KEY (approved_by_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  CONSTRAINT fk_ssi_receipt
    FOREIGN KEY (ref_receipt_id) REFERENCES stock_receipts(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_ssi_staff   (staff_id),
  INDEX idx_ssi_status  (status),
  INDEX idx_ssi_created (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: staff_stock_issue_items — chi tiet phieu cap
-- qty_requested  : admin yeu cau ban dau
-- qty_approved   : sau khi duyet (co the < qty_requested neu kho thieu)
-- imei_list      : optional, text tu do (1/dong hoac phay)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_stock_issue_items (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  issue_id      INT NOT NULL,
  product_id    INT NOT NULL,
  qty_requested INT NOT NULL,
  qty_approved  INT NULL,
  imei_list     TEXT NULL,
  note          VARCHAR(500) NULL,
  CONSTRAINT chk_ssi_item_req_pos CHECK (qty_requested > 0),
  CONSTRAINT chk_ssi_item_app_nonneg CHECK (qty_approved IS NULL OR qty_approved >= 0),
  CONSTRAINT uk_ssi_item_issue_product UNIQUE (issue_id, product_id),
  CONSTRAINT fk_ssi_item_issue
    FOREIGN KEY (issue_id) REFERENCES staff_stock_issues(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ssi_item_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_ssi_item_issue   (issue_id),
  INDEX idx_ssi_item_product (product_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: staff_stock_consumptions — log tieu thu tu kho ca nhan KTV
-- Ghi khi don/BH/SC complete: tru staff_holdings + ghi audit.
-- (Bang nay PR3/PR4 moi dung, them san de migration tron.)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_stock_consumptions (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  staff_id    INT NOT NULL,
  product_id  INT NOT NULL,
  qty         INT NOT NULL,
  ref_kind    ENUM('order','warranty_order','repair_order') NOT NULL,
  ref_id      INT NOT NULL,
  imei        VARCHAR(120) NULL,
  consumed_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT chk_ssc_qty_pos CHECK (qty > 0),
  CONSTRAINT fk_ssc_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_ssc_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_ssc_staff   (staff_id),
  INDEX idx_ssc_product (product_id),
  INDEX idx_ssc_ref     (ref_kind, ref_id),
  INDEX idx_ssc_time    (consumed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
