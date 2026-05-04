-- ==========================================================
-- Migration 029 — Bao hanh: rebuild lai bang theo flow moi
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc dich:
--   - Thay the warranty_requests cu (claim_type warranty/paid_repair, status
--     diagnosing/repairing/replaced) bang warranty_orders flow gon hon.
--   - Tich hop voi cong no Rolling Balance (debt_carried_at + debt_settlement_id)
--     giong don orders. Tinh chi phi qua cot cost_amount nhap tay.
--   - Cho phep gan 1 phieu xuat kho (stock_receipts) lay thiet bi tu kho khi can
--     thay the qua cot moi ref_warranty_order_id tren stock_receipts.
-- Quy uoc:
--   - Soft delete is_deleted (giong toan he thong)
--   - Code: BH-DDMM-NNN (sinh trong BE — utils/warrantyState.js)
--   - request_date DATE (ngay tao yeu cau), KHONG dung created_at/updated_at
--   - status flow: pending -> received -> recovered -> awaiting_warranty
--                  -> warranty_done -> delivering -> completed
--                  Cho phep skip awaiting_warranty/warranty_done neu xu ly noi bo
--                  (recovered -> delivering thang).
-- ==========================================================

USE gpsviet;

-- 1) Drop schema cu (chua co data san xuat)
DROP TABLE IF EXISTS warranty_requests;

-- 2) Bang chinh
CREATE TABLE warranty_orders (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  code                 VARCHAR(30)  NOT NULL UNIQUE,           -- BH-DDMM-NNN

  customer_id          INT          NOT NULL,                  -- FK customers (retail HOAC dealer)

  -- Khach mo ta thiet bi
  license_plate        VARCHAR(30)  NULL,                      -- bien so xe
  device_name          VARCHAR(100) NULL,                      -- ten thiet bi (free text)
  imei_search          VARCHAR(100) NULL,                      -- IMEI khach noi (chi luu de tim, KHONG FK)
  reason_text          TEXT         NOT NULL,                  -- ly do bao hanh
  note_text            TEXT         NULL,                      -- ghi chu them
  address              VARCHAR(500) NULL,                      -- dia chi thu hoi

  -- KTV xu ly
  assigned_staff_id    INT          NULL,                      -- KTV duoc gan
  recovered_image_url  VARCHAR(500) NULL,                      -- anh KTV chup luc thu hoi (BAT BUOC khi sang recovered)
  delivered_image_url  VARCHAR(500) NULL,                      -- anh KTV chup luc giao lai (optional)

  -- Gui di NCC bao hanh
  warranty_partner     VARCHAR(200) NULL,                      -- ten/dia chi noi gui (chi text)
  sent_at              DATE         NULL,                      -- ngay gui di
  returned_at          DATE         NULL,                      -- ngay nhan ve

  -- Tien
  cost_amount          BIGINT       NOT NULL DEFAULT 0,        -- chi phi BH (admin nhap tay)
  paid_amount          BIGINT       NOT NULL DEFAULT 0,        -- da thu

  -- Cong no Rolling Balance (giong orders)
  debt_carried_at      DATETIME     NULL,                      -- da ket vao phieu tat toan
  debt_settlement_id   INT          NULL,                      -- FK debt_settlements (phieu da ket)

  -- Trang thai
  status ENUM(
    'pending',            -- khach lap don, cho admin tiep nhan
    'received',           -- admin tiep nhan
    'recovered',          -- KTV thu hoi xong (co anh)
    'awaiting_warranty',  -- da gui di NCC
    'warranty_done',      -- NCC tra ve
    'delivering',         -- dang giao tra khach
    'completed',          -- hoan tat
    'cancelled'
  ) NOT NULL DEFAULT 'pending',

  request_date         DATE         NOT NULL,                  -- ngay tao yeu cau

  creator_type         ENUM('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin',
  creator_id           INT          NULL,
  is_deleted           TINYINT(1)   NOT NULL DEFAULT 0,

  INDEX idx_wo_status        (status),
  INDEX idx_wo_customer      (customer_id),
  INDEX idx_wo_staff         (assigned_staff_id),
  INDEX idx_wo_request       (request_date),
  INDEX idx_wo_deleted       (is_deleted),
  INDEX idx_wo_debt_carried  (debt_carried_at),
  INDEX idx_wo_settlement    (debt_settlement_id),
  INDEX idx_wo_plate         (license_plate),
  INDEX idx_wo_imei          (imei_search)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 3) Them FK rieng tung cai (de neu mot FK loi thi de debug; bang van tao xong)
ALTER TABLE warranty_orders
  ADD CONSTRAINT fk_wo_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE warranty_orders
  ADD CONSTRAINT fk_wo_staff FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- FK toi debt_settlements: chi them neu bang da ton tai (migration 025 da chay).
-- Neu chua co, bo qua — code van chay binh thuong, chi mat referential check.
ALTER TABLE warranty_orders
  ADD CONSTRAINT fk_wo_settlement FOREIGN KEY (debt_settlement_id) REFERENCES debt_settlements(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- 4) Them ref_warranty_order_id vao stock_receipts (de track phieu xuat cho BH)
ALTER TABLE stock_receipts
  ADD COLUMN ref_warranty_order_id INT NULL AFTER ref_staff_id,
  ADD INDEX idx_receipts_warranty (ref_warranty_order_id);

ALTER TABLE stock_receipts
  ADD CONSTRAINT fk_receipt_warranty FOREIGN KEY (ref_warranty_order_id)
    REFERENCES warranty_orders(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'warranty%';
--   DESCRIBE warranty_orders;
--   SHOW COLUMNS FROM stock_receipts LIKE 'ref_warranty_order_id';
-- ==========================================================
