-- ==========================================================
-- Migration 044 — Phu hieu xe (badge_orders) — REBUILD module
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc dich:
--   - Tach hoan toan phu hieu khoi orders.service_kind='badge' va bang
--     badges/badge_attachments cu. Lam lai theo pattern warranty_orders /
--     repair_orders: bang chinh + charges + attachments + messages tag.
--   - Cho phep ca KHACH va ADMIN upload file (phan biet uploader_type).
--   - Cong ty dong ho phi So GTVT (dot_fee_amount) — cong vao tong de thu lai.
--   - Giao phu hieu qua KTV (assigned_staff_id + status delivering/delivered).
--   - Dai ly dat ho (dealer_id).
--
-- Quy uoc:
--   - Soft delete is_deleted, KHONG dung created_at/updated_at.
--   - Ma don: PH-DDMM-NNN (sinh trong BE — utils/badgeState.js).
--   - request_date DATE giong warranty/repair.
--   - Cong no Rolling Balance qua debt_carried_at + debt_settlement_id.
--   - Anh upload qua imgbb (i.ibb.co), BE chi nhan URL.
--
-- Status flow (12 trang thai, 4 giai doan):
--   [Ho so khach]
--   draft              — khach/admin dang nhap, dang upload
--   submitted          — khach bam Gui -> admin thay don
--   need_more_info     — admin yeu cau bo sung (loop ve upload, khach resubmit)
--
--   [Xu ly noi bo + nop So GTVT]
--   reviewing          — admin dang xu ly noi bo
--   submitted_to_dot   — da nop So GTVT (cong ty dong phi ho)
--   approved           — So duyet
--   rejected           — So tu choi (end)
--
--   [Hau duyet + giao]
--   printing           — dang in phu hieu
--   ready_to_deliver   — san sang giao (gan KTV)
--   delivering         — KTV dang giao
--   delivered          — da giao + da thu tien (end)
--
--   cancelled          — huy bat ky giai doan nao truoc delivered
--
-- LUU Y: Chua co data san xuat -> drop bang cu va xoa order shell badge thang.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- 1) Don dep schema cu (chua co data that)
-- ----------------------------------------------------------

-- Xoa order shell cu (code OPH-*) sinh tu migration_018
DELETE FROM order_charges
  WHERE order_id IN (SELECT id FROM orders WHERE service_kind = 'badge');
DELETE FROM order_payments
  WHERE order_id IN (SELECT id FROM orders WHERE service_kind = 'badge');
DELETE FROM orders WHERE service_kind = 'badge';

-- Drop bang cu
DROP TABLE IF EXISTS badge_attachments;
DROP TABLE IF EXISTS badges;

-- Bo gia tri 'badge' khoi enum orders.service_kind
ALTER TABLE orders
  MODIFY COLUMN service_kind
    ENUM('install','maintenance','warranty','renewal')
    NOT NULL DEFAULT 'install';

-- ----------------------------------------------------------
-- 2) Bang chinh badge_orders
-- ----------------------------------------------------------
CREATE TABLE badge_orders (
  id                   INT AUTO_INCREMENT PRIMARY KEY,
  code                 VARCHAR(30)  NOT NULL UNIQUE,           -- PH-DDMM-NNN

  customer_id          INT          NOT NULL,                  -- chu xe (retail hoac dealer)
  dealer_id            INT          NULL,                      -- dai ly dat ho (neu co)

  -- Loai yeu cau
  request_kind         ENUM('new','reissue','renew','change') NOT NULL DEFAULT 'new',
                                                              -- new: cap moi
                                                              -- reissue: cap lai (mat/hong)
                                                              -- renew: het han doi moi
                                                              -- change: doi loai hinh
  reissue_reason       VARCHAR(500) NULL,                      -- chi co khi reissue/change

  -- Thong tin xe
  vehicle_plate        VARCHAR(30)  NOT NULL,                  -- bien so
  vehicle_type         ENUM(
    'truck_under_3_5t','truck_over_3_5t','contract','tourist',
    'taxi','fixed_route','bus','container','tractor','other'
  ) NOT NULL DEFAULT 'truck_under_3_5t',
  chassis_no           VARCHAR(50)  NULL,                      -- so khung
  engine_no            VARCHAR(50)  NULL,                      -- so may
  year_of_make         INT          NULL,                      -- nam SX
  transport_org_name   VARCHAR(255) NULL,                      -- ten DV van tai in tren phu hieu

  -- KTV giao hang
  assigned_staff_id    INT          NULL,
  delivery_address     VARCHAR(500) NULL,                      -- dia chi giao

  -- Lien lac voi So GTVT
  dot_receipt_no       VARCHAR(100) NULL,                      -- so bien nhan So
  reject_reason        VARCHAR(500) NULL,                      -- ly do So tu choi

  -- Tien (cong ty dong ho phi So -> cong vao tong de thu lai khach)
  service_fee          BIGINT       NOT NULL DEFAULT 0,        -- phi dich vu cty (sync charge "Phi dich vu phu hieu")
  dot_fee_amount       BIGINT       NOT NULL DEFAULT 0,        -- phi So GTVT cty ung ho (sync charge "Phi So GTVT")
  total_amount         BIGINT       NOT NULL DEFAULT 0,        -- service_fee + dot_fee_amount + sum(charges)
  paid_amount          BIGINT       NOT NULL DEFAULT 0,        -- da thu

  note_text            TEXT         NULL,

  -- Cot moc thoi gian
  submitted_at         DATETIME     NULL,                      -- khach bam Gui
  reviewing_at         DATETIME     NULL,                      -- admin bat dau xu ly
  submitted_to_dot_at  DATETIME     NULL,                      -- nop So
  approved_at          DATETIME     NULL,                      -- So duyet
  rejected_at          DATETIME     NULL,                      -- So tu choi
  printing_at          DATETIME     NULL,
  ready_at             DATETIME     NULL,                      -- san sang giao
  delivering_at        DATETIME     NULL,
  delivered_at         DATETIME     NULL,
  cancelled_at         DATETIME     NULL,

  -- Cong no Rolling Balance
  debt_carried_at      DATETIME     NULL,
  debt_settlement_id   INT          NULL,

  -- Trang thai
  status ENUM(
    'draft','submitted','need_more_info',
    'reviewing','submitted_to_dot','approved','rejected',
    'printing','ready_to_deliver','delivering','delivered',
    'cancelled'
  ) NOT NULL DEFAULT 'draft',

  request_date         DATE         NOT NULL,

  creator_type         ENUM('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin',
  creator_id           INT          NULL,
  is_deleted           TINYINT(1)   NOT NULL DEFAULT 0,

  INDEX idx_bo_status        (status),
  INDEX idx_bo_customer      (customer_id),
  INDEX idx_bo_dealer        (dealer_id),
  INDEX idx_bo_staff         (assigned_staff_id),
  INDEX idx_bo_request       (request_date),
  INDEX idx_bo_deleted       (is_deleted),
  INDEX idx_bo_debt_carried  (debt_carried_at),
  INDEX idx_bo_settlement    (debt_settlement_id),
  INDEX idx_bo_plate         (vehicle_plate)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE badge_orders
  ADD CONSTRAINT fk_bo_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE badge_orders
  ADD CONSTRAINT fk_bo_dealer FOREIGN KEY (dealer_id) REFERENCES customers(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE badge_orders
  ADD CONSTRAINT fk_bo_staff FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE badge_orders
  ADD CONSTRAINT fk_bo_settlement FOREIGN KEY (debt_settlement_id) REFERENCES debt_settlements(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------
-- 3) Bang phi linh hoat (giong order_charges / repair_charges)
--    "Phi dich vu phu hieu" sync 1 chieu voi badge_orders.service_fee
--    "Phi So GTVT" sync 1 chieu voi badge_orders.dot_fee_amount
--    kind='discount' luu amount AM
-- ----------------------------------------------------------
CREATE TABLE badge_order_charges (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  badge_order_id  INT          NOT NULL,
  kind            ENUM('service','dot_fee','delivery','fee','discount') NOT NULL DEFAULT 'fee',
  label           VARCHAR(150) NOT NULL,
  amount          BIGINT       NOT NULL DEFAULT 0,
  is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_bcharge_order FOREIGN KEY (badge_order_id) REFERENCES badge_orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_bcharge_order (badge_order_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 4) Bang file dinh kem — phan biet ai upload (khach vs admin/KTV)
--    URL chi nhan i.ibb.co (theo quy uoc imgbb cua du an)
-- ----------------------------------------------------------
CREATE TABLE badge_order_attachments (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  badge_order_id  INT          NOT NULL,

  uploader_type   ENUM('customer','dealer','admin','staff') NOT NULL,
  uploader_id     INT          NULL,

  -- Phan loai file:
  --  Khach upload (dau vao):
  --   vehicle_reg   - dang ky xe
  --   inspection    - dang kiem
  --   insurance     - bao hiem TNDS
  --   cccd          - CCCD chu xe
  --   license       - GPLX
  --   biz_license   - GP kinh doanh van tai
  --   biz_register  - dang ky kinh doanh
  --   rent_contract - HD thue xe
  --   old_badge     - phu hieu cu (cap lai)
  --   other_in
  --  Admin/KTV upload (dau ra):
  --   dot_receipt    - bien nhan So GTVT
  --   dot_result     - ket qua So
  --   badge_photo    - anh phu hieu da in
  --   delivery_proof - anh giao hang / chu ky
  --   other_out
  kind ENUM(
    'vehicle_reg','inspection','insurance','cccd','license',
    'biz_license','biz_register','rent_contract','old_badge','other_in',
    'dot_receipt','dot_result','badge_photo','delivery_proof','other_out'
  ) NOT NULL,

  url             VARCHAR(500) NOT NULL,
  caption         VARCHAR(255) NULL,
  is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,
  uploaded_at     TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_battach_border FOREIGN KEY (badge_order_id) REFERENCES badge_orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_battach_border (badge_order_id, is_deleted),
  INDEX idx_battach_kind   (kind)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- 5) Mo rong messages: them badge_order_id (chat tag tin nhan ve don PH)
-- ----------------------------------------------------------
ALTER TABLE messages
  ADD COLUMN badge_order_id INT NULL AFTER repair_order_id,
  ADD INDEX idx_msg_badge (badge_order_id);

ALTER TABLE messages
  ADD CONSTRAINT fk_msg_badge FOREIGN KEY (badge_order_id)
    REFERENCES badge_orders(id) ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'badge%';
--   DESCRIBE badge_orders;
--   SHOW COLUMNS FROM orders LIKE 'service_kind';
--   SHOW COLUMNS FROM messages LIKE 'badge_order_id';
-- ==========================================================
