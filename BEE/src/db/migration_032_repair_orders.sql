-- ==========================================================
-- Migration 032 — Sua chua (repair_orders)
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc dich:
--   - Tach module sua chua (repair) ra khoi warranty (BH).
--   - BH mien phi, SC co thu phi va co vong bao gia (KTV chan doan ->
--     admin chot gia voi khach -> khach duyet -> moi sua).
--   - Vat tu thay di qua kho (stock_receipts.ref_repair_order_id).
--   - Bill khoa khi status='done' (KTV bao xong) — admin khong sua duoc nua.
--
-- Quy uoc:
--   - Soft delete is_deleted, KHONG dung created_at/updated_at (trung quy uoc DB).
--   - Code: SC-DDMM-NNN (sinh trong utils/repairState.js).
--   - request_date DATE giong warranty_orders.
--   - Cong no Rolling Balance qua debt_carried_at + debt_settlement_id.
--
-- Status flow:
--   pending           (khach/admin tao)
--   -> assigned       (admin gan KTV)
--   -> diagnosing     (KTV nhan may, upload anh, dang chan doan)
--   -> quoted         (KTV nop bao gia: items + cong)
--   -> awaiting_customer  (admin chot gia + gui cho khach xem)
--   -> approved       (khach bam Duyet bao gia tren portal)
--                     hoac -> rejected (khach tu choi)
--   -> repairing      (admin xuat kho vat tu, KTV sua)
--   -> done           (KTV bao xong — BILL KHOA)
--   -> delivering     (KTV upload anh giao)
--   -> completed      (xong)
--   + cancelled (huy truoc repairing)
--   + rejected (khach tu choi bao gia — admin co the sua bao gia gui lai
--               hoac chuyen sang cancelled)
--
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

-- 1) Bang chinh
CREATE TABLE repair_orders (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  code                 VARCHAR(30)  NOT NULL UNIQUE,           -- SC-DDMM-NNN

  customer_id          INT          NOT NULL,                  -- FK customers (retail HOAC dealer)

  -- Khach mo ta thiet bi / van de
  license_plate        VARCHAR(30)  NULL,                      -- bien so xe
  device_name          VARCHAR(100) NULL,                      -- ten thiet bi (free text)
  imei_search          VARCHAR(100) NULL,                      -- IMEI khach noi (chi luu de tim, KHONG FK)
  reason_text          TEXT         NOT NULL,                  -- ly do khach mo ta loi
  note_text            TEXT         NULL,                      -- ghi chu them
  address              VARCHAR(500) NULL,                      -- dia chi thu hoi may

  -- KTV xu ly
  assigned_staff_id    INT          NULL,                      -- KTV duoc gan
  recovered_image_url  VARCHAR(500) NULL,                      -- anh KTV chup luc nhan may (BAT BUOC khi sang diagnosing)
  delivered_image_url  VARCHAR(500) NULL,                      -- anh KTV chup luc giao tra (optional)
  diagnose_text        TEXT         NULL,                      -- KTV nhap chan doan (sau khi nhan may)

  -- Bao gia
  service_fee          BIGINT       NOT NULL DEFAULT 0,        -- cong sua (sync 1 chieu voi tasks.wage_amount neu co task)
  parts_total          BIGINT       NOT NULL DEFAULT 0,        -- tong vat tu (auto tu repair_items)
  total_amount         BIGINT       NOT NULL DEFAULT 0,        -- service_fee + parts_total + sum(repair_charges)
  paid_amount          BIGINT       NOT NULL DEFAULT 0,        -- da thu

  -- Cot moc thoi gian quan trong (giup audit + sort tab)
  quoted_at            DATETIME     NULL,                      -- KTV nop bao gia
  customer_sent_at     DATETIME     NULL,                      -- admin chot va gui khach
  customer_decided_at  DATETIME     NULL,                      -- khach bam duyet/tu choi
  repairing_at         DATETIME     NULL,                      -- bat dau sua
  done_at              DATETIME     NULL,                      -- KTV bao xong (= moc khoa bill)
  delivered_at         DATETIME     NULL,                      -- giao xong cho khach

  -- Cong no Rolling Balance (giong warranty_orders + orders)
  debt_carried_at      DATETIME     NULL,
  debt_settlement_id   INT          NULL,

  -- Trang thai
  status ENUM(
    'pending',            -- khach/admin lap don
    'assigned',           -- admin da gan KTV
    'diagnosing',         -- KTV nhan may + dang chan doan (co anh nhan)
    'quoted',             -- KTV nop bao gia
    'awaiting_customer',  -- admin da gui cho khach xem
    'approved',           -- khach duyet bao gia
    'rejected',           -- khach tu choi bao gia
    'repairing',          -- da xuat kho, KTV dang sua
    'done',               -- KTV bao xong, BILL KHOA
    'delivering',         -- dang giao tra
    'completed',          -- hoan tat
    'cancelled'
  ) NOT NULL DEFAULT 'pending',

  request_date         DATE         NOT NULL,                  -- ngay tao yeu cau

  creator_type         ENUM('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin',
  creator_id           INT          NULL,
  is_deleted           TINYINT(1)   NOT NULL DEFAULT 0,

  INDEX idx_ro_status        (status),
  INDEX idx_ro_customer      (customer_id),
  INDEX idx_ro_staff         (assigned_staff_id),
  INDEX idx_ro_request       (request_date),
  INDEX idx_ro_deleted       (is_deleted),
  INDEX idx_ro_debt_carried  (debt_carried_at),
  INDEX idx_ro_settlement    (debt_settlement_id),
  INDEX idx_ro_plate         (license_plate),
  INDEX idx_ro_imei          (imei_search)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE repair_orders
  ADD CONSTRAINT fk_ro_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE repair_orders
  ADD CONSTRAINT fk_ro_staff FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE repair_orders
  ADD CONSTRAINT fk_ro_settlement FOREIGN KEY (debt_settlement_id) REFERENCES debt_settlements(id)
    ON DELETE SET NULL ON UPDATE CASCADE;


-- 2) Bang vat tu thay (tuong tu order_items, tach rieng vi quan ly khac)
CREATE TABLE repair_items (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  repair_order_id INT          NOT NULL,
  product_id      INT          NOT NULL,
  qty             INT          NOT NULL DEFAULT 1,
  unit_price      BIGINT       NOT NULL DEFAULT 0,
  imei            VARCHAR(50)  NULL,                  -- IMEI cu the cua ca the duoc thay (neu co)
  note            VARCHAR(255) NULL,
  is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_ritem_order   FOREIGN KEY (repair_order_id) REFERENCES repair_orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ritem_product FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  INDEX idx_ritem_order (repair_order_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 3) Bang phi linh hoat (giong order_charges; "Cong sua" sync 1 chieu voi tasks.wage_amount)
--    kind='discount' luu amount AM (vd: -100000)
CREATE TABLE repair_charges (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  repair_order_id INT          NOT NULL,
  kind            ENUM('service','fee','discount') NOT NULL DEFAULT 'service',
  label           VARCHAR(150) NOT NULL,             -- vd: "Cong sua", "Phi kham", "Giam gia"
  amount          BIGINT       NOT NULL DEFAULT 0,
  is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_rcharge_order FOREIGN KEY (repair_order_id) REFERENCES repair_orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_rcharge_order (repair_order_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- 4) Mo rong tasks.kind de chua loai 'repair' (co the gan task cho KTV nhu cac loai khac)
ALTER TABLE tasks
  MODIFY COLUMN kind ENUM('install','maintenance','renew','uninstall','repair')
                NOT NULL DEFAULT 'install';


-- 5) Mo rong stock_receipts: them ref_repair_order_id de track phieu xuat cho SC
ALTER TABLE stock_receipts
  ADD COLUMN ref_repair_order_id INT NULL AFTER ref_warranty_order_id,
  ADD INDEX idx_receipts_repair (ref_repair_order_id);

ALTER TABLE stock_receipts
  ADD CONSTRAINT fk_receipt_repair FOREIGN KEY (ref_repair_order_id)
    REFERENCES repair_orders(id) ON DELETE SET NULL ON UPDATE CASCADE;


-- 6) Mo rong messages: them repair_order_id de chat tag tin nhan ve don SC
--    (giong order_id da co tu migration_017_chat_unified)
ALTER TABLE messages
  ADD COLUMN repair_order_id INT NULL AFTER order_id,
  ADD INDEX idx_msg_repair (repair_order_id);

ALTER TABLE messages
  ADD CONSTRAINT fk_msg_repair FOREIGN KEY (repair_order_id)
    REFERENCES repair_orders(id) ON DELETE SET NULL ON UPDATE CASCADE;


-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'repair%';
--   DESCRIBE repair_orders;
--   SHOW COLUMNS FROM stock_receipts LIKE 'ref_repair_order_id';
--   SHOW COLUMNS FROM tasks LIKE 'kind';
--   SHOW COLUMNS FROM messages LIKE 'repair_order_id';
-- ==========================================================
