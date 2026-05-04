-- ==========================================================
-- Migration 025 — Module Cong no (Rolling Balance) + Settings (QR + bank)
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc tieu:
--   - Thay module "Nop tien (remittances)" trong admin UI bang "Cong no".
--   - Cho admin nhin tong quan: ai dang no bao nhieu (khach le + dai ly + KTV).
--   - Co the bam "Tat toan" → in bill A4 co QR + thong tin TK.
--
-- Mo hinh tat toan = Rolling Balance (so du goi dau):
--   - Khach no nhieu don, tra 1 phan tien.
--   - He thong "ket" tat ca don no hien tai vao 1 phieu tat toan (snapshot).
--   - So tien con thieu cong vao customers.opening_balance (so du dau ky).
--   - Don moi sau do cong don vao no, hien thi "No ky truoc: X" tren bill.
--
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi → bo qua loi do.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- 1. customers.opening_balance — so du goi dau (BIGINT co dau)
--    > 0: khach dang no
--    < 0: khach tra thua (hiem, van support)
-- ----------------------------------------------------------
ALTER TABLE customers
  ADD COLUMN opening_balance BIGINT NOT NULL DEFAULT 0 AFTER credit_term_days;

-- ----------------------------------------------------------
-- 2. orders: 2 cot moi danh dau don da duoc "ket" vao phieu tat toan
-- ----------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN debt_carried_at    DATETIME NULL AFTER paid_amount,
  ADD COLUMN debt_settlement_id INT      NULL AFTER debt_carried_at,
  ADD INDEX idx_orders_debt_carried (customer_id, debt_carried_at);

-- ----------------------------------------------------------
-- 3. debt_settlements — moi phieu tat toan cong no
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS debt_settlements (
  id            INT          AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(30)  NOT NULL UNIQUE,                   -- TT-DDMM-NNN
  customer_id   INT          NOT NULL,
  total_debt    BIGINT       NOT NULL,                          -- snapshot tong no luc tat toan
  amount_paid   BIGINT       NOT NULL,                          -- khach tra dot nay
  remaining     BIGINT       NOT NULL,                          -- = total_debt - amount_paid
  qr_slot       TINYINT      NULL,                              -- 1..5 (QR da dung in tren bill)
  pay_method    ENUM('cash','transfer','mixed') NOT NULL DEFAULT 'cash',
  receipt_url   VARCHAR(500) NULL,                              -- anh bien lai (imgbb, optional)
  note          TEXT         NULL,
  created_by    INT          NOT NULL,                          -- staff id (nguoi lap phieu)
  paid_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP, -- thoi diem thu tien
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_settlement_customer FOREIGN KEY (customer_id) REFERENCES customers(id),
  INDEX idx_settlement_customer (customer_id, is_deleted),
  INDEX idx_settlement_paid_at  (paid_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 4. app_settings — bang key-value cau hinh chung
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS app_settings (
  `key`        VARCHAR(60) PRIMARY KEY,
  `value`      TEXT NULL,
  changed_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  changed_by   INT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed 5 QR slot rong + thong tin tai khoan ngan hang
INSERT IGNORE INTO app_settings (`key`, `value`) VALUES
  ('qr.slot1.image_url', ''),
  ('qr.slot1.label',     'QR chinh'),
  ('qr.slot2.image_url', ''),
  ('qr.slot2.label',     'QR du phong 1'),
  ('qr.slot3.image_url', ''),
  ('qr.slot3.label',     'QR du phong 2'),
  ('qr.slot4.image_url', ''),
  ('qr.slot4.label',     'QR du phong 3'),
  ('qr.slot5.image_url', ''),
  ('qr.slot5.label',     'QR du phong 4'),
  ('bank.account_no',    ''),
  ('bank.account_name',  ''),
  ('bank.bank_name',     ''),
  ('bank.default_qr_slot','1');

-- ==========================================================
-- DONE.
-- Kiem tra:
--   DESC customers;            -- thay opening_balance
--   DESC orders;               -- thay debt_carried_at, debt_settlement_id
--   DESC debt_settlements;
--   SELECT * FROM app_settings;
-- ==========================================================
