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
