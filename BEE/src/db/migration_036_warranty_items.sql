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
ALTER TABLE collections
  MODIFY COLUMN task_id INT NULL;

ALTER TABLE collections
  ADD COLUMN ref_warranty_order_id INT NULL AFTER task_id,
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
