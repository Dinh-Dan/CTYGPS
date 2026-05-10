-- ==========================================================
-- Migration 045 — Don hang v2 (template-driven)
-- ----------------------------------------------------------
-- Gop 4 module don (orders/warranty/repair/badge) ve 1 model duy nhat.
-- Admin tu cau hinh template trang thai + custom fields cho moi loai don.
--
-- Thay doi chinh:
--   1. Drop hoan toan: warranty_orders + warranty_items + warranty_charges
--      + warranty_attachments + repair_orders + repair_items + repair_charges
--      + repair_attachments + badge_orders + badge_charges + badge_attachments.
--   2. Don dep FK + cot tham chieu o stock_receipts, collections, messages.
--   3. orders.status: ENUM -> VARCHAR(50) (luu code buoc cua template).
--      Trang thai cung he thong: 'pending', 'cancelled'. Con lai user-defined.
--   4. Drop cot legacy: service_kind, kind, sim_numbers, vehicle_plate, imei,
--      subscription_account, years, phone, public_token. (Cac thong tin nay
--      gio luu trong order_field_values.)
--   5. Them: template_id, approved_at, approved_by.
--   6. Tao bang: order_templates, order_template_steps, order_template_fields,
--      order_field_values, order_step_photos.
--   7. order_attachments mo rong: them template_step_id (nullable) de gan anh
--      vao mot buoc cu the.
-- ==========================================================

USE gpsviet;

SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================================
-- HELPER: stored procedure de drop FK / index / column "neu ton tai"
-- (MySQL 5.7 khong ho tro DROP ... IF EXISTS cho FK / index / column)
-- ==========================================================
DROP PROCEDURE IF EXISTS m045_drop_fk;
DROP PROCEDURE IF EXISTS m045_drop_idx;
DROP PROCEDURE IF EXISTS m045_drop_col;

DELIMITER $$
CREATE PROCEDURE m045_drop_fk(IN tbl VARCHAR(64), IN fk VARCHAR(64))
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
              WHERE CONSTRAINT_SCHEMA = DATABASE()
                AND TABLE_NAME = tbl AND CONSTRAINT_NAME = fk
                AND CONSTRAINT_TYPE = 'FOREIGN KEY') THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` DROP FOREIGN KEY `', fk, '`');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
CREATE PROCEDURE m045_drop_idx(IN tbl VARCHAR(64), IN idx VARCHAR(64))
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.STATISTICS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = tbl AND INDEX_NAME = idx) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` DROP INDEX `', idx, '`');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
CREATE PROCEDURE m045_drop_col(IN tbl VARCHAR(64), IN col VARCHAR(64))
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = tbl AND COLUMN_NAME = col) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` DROP COLUMN `', col, '`');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
DELIMITER ;

-- ==========================================================
-- 1. Drop bang module cu (warranty / repair / badge)
-- ==========================================================
DROP TABLE IF EXISTS warranty_attachments;
DROP TABLE IF EXISTS warranty_charges;
DROP TABLE IF EXISTS warranty_items;
DROP TABLE IF EXISTS warranty_orders;

DROP TABLE IF EXISTS repair_attachments;
DROP TABLE IF EXISTS repair_charges;
DROP TABLE IF EXISTS repair_items;
DROP TABLE IF EXISTS repair_orders;

DROP TABLE IF EXISTS badge_attachments;
DROP TABLE IF EXISTS badge_charges;
DROP TABLE IF EXISTS badge_orders;

-- Bang badges cu (mig 007) cung khong dung nua
DROP TABLE IF EXISTS badges;

-- ==========================================================
-- 2. Don dep FK + cot tham chieu o cac bang phu
-- ==========================================================

-- 2.1 stock_receipts
CALL m045_drop_fk ('stock_receipts', 'fk_receipt_warranty');
CALL m045_drop_idx('stock_receipts', 'idx_receipts_warranty');
CALL m045_drop_col('stock_receipts', 'ref_warranty_order_id');
CALL m045_drop_fk ('stock_receipts', 'fk_receipt_repair');
CALL m045_drop_idx('stock_receipts', 'idx_receipts_repair');
CALL m045_drop_col('stock_receipts', 'ref_repair_order_id');

-- 2.2 collections
CALL m045_drop_fk ('collections', 'fk_coll_warranty');
CALL m045_drop_idx('collections', 'idx_coll_warranty');
CALL m045_drop_col('collections', 'ref_warranty_order_id');

-- 2.3 messages
CALL m045_drop_fk ('messages', 'fk_msg_repair');
CALL m045_drop_idx('messages', 'idx_msg_repair');
CALL m045_drop_col('messages', 'repair_order_id');
CALL m045_drop_fk ('messages', 'fk_msg_badge');
CALL m045_drop_idx('messages', 'idx_msg_badge');
CALL m045_drop_col('messages', 'badge_order_id');

-- ==========================================================
-- 3. Reshape orders
-- ==========================================================

-- 3.1 Drop cot legacy (service_kind, kind, sim_numbers, vehicle_plate, imei,
--     subscription_account, years, phone, public_token)
--     Cac cot nay gio thay bang order_field_values.
CALL m045_drop_idx('orders', 'idx_orders_service_kind');
CALL m045_drop_col('orders', 'service_kind');
CALL m045_drop_idx('orders', 'idx_orders_kind');
CALL m045_drop_col('orders', 'kind');
CALL m045_drop_col('orders', 'sim_numbers');
CALL m045_drop_col('orders', 'vehicle_plate');
CALL m045_drop_col('orders', 'imei');
CALL m045_drop_col('orders', 'subscription_account');
CALL m045_drop_col('orders', 'years');
CALL m045_drop_col('orders', 'phone');
CALL m045_drop_col('orders', 'public_token');

-- 3.2 status: ENUM -> VARCHAR(50). Con lai do template dinh nghia.
--     Cung lai he thong: 'pending' (khach tao cho duyet), 'cancelled' (huy).
ALTER TABLE orders MODIFY COLUMN status VARCHAR(50) NOT NULL DEFAULT 'pending';
CALL m045_drop_idx('orders', 'idx_orders_status');
ALTER TABLE orders ADD INDEX idx_orders_status (status);

-- 3.3 Them template_id + approved_at + approved_by
CALL m045_drop_idx('orders', 'idx_orders_template');
CALL m045_drop_col('orders', 'template_id');
CALL m045_drop_col('orders', 'approved_at');
CALL m045_drop_col('orders', 'approved_by');
ALTER TABLE orders
  ADD COLUMN template_id  INT      NULL AFTER customer_id,
  ADD COLUMN approved_at  DATETIME NULL AFTER confirmed_by,
  ADD COLUMN approved_by  INT      NULL AFTER approved_at,
  ADD INDEX idx_orders_template (template_id);

-- Don dep helper procedure
DROP PROCEDURE IF EXISTS m045_drop_fk;
DROP PROCEDURE IF EXISTS m045_drop_idx;
DROP PROCEDURE IF EXISTS m045_drop_col;

-- ==========================================================
-- 4. Bang template
-- ==========================================================

-- 4.1 order_templates — loai don
CREATE TABLE IF NOT EXISTS order_templates (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(150) NOT NULL,
  description TEXT         NULL,
  is_public   TINYINT(1)   NOT NULL DEFAULT 1,   -- khach co thay duoc khong
  sort_order  INT          NOT NULL DEFAULT 0,
  is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
  INDEX idx_template_public  (is_public, is_deleted),
  INDEX idx_template_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.2 order_template_steps — buoc trang thai
--     update_roles luu json: ["admin","ktv","customer"]
CREATE TABLE IF NOT EXISTS order_template_steps (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  template_id     INT          NOT NULL,
  seq             INT          NOT NULL DEFAULT 0,
  code            VARCHAR(50)  NOT NULL,           -- slug, dung lam orders.status
  label           VARCHAR(150) NOT NULL,
  requires_photo  TINYINT(1)   NOT NULL DEFAULT 0,
  photo_min_count INT          NOT NULL DEFAULT 0,
  update_roles    JSON         NULL,               -- ["admin","ktv"]
  is_terminal     TINYINT(1)   NOT NULL DEFAULT 0, -- buoc ket thuc (don da xong)
  is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_otstep_template FOREIGN KEY (template_id)
    REFERENCES order_templates(id) ON DELETE CASCADE ON UPDATE CASCADE,
  UNIQUE KEY uk_otstep_template_code (template_id, code, is_deleted),
  INDEX idx_otstep_template (template_id, seq)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.3 order_template_fields — custom field cua loai don
CREATE TABLE IF NOT EXISTS order_template_fields (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  template_id INT          NOT NULL,
  seq         INT          NOT NULL DEFAULT 0,
  label       VARCHAR(150) NOT NULL,
  field_type  ENUM('text','number','date','textarea') NOT NULL DEFAULT 'text',
  is_required TINYINT(1)   NOT NULL DEFAULT 0,
  placeholder VARCHAR(255) NULL,
  is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_otfield_template FOREIGN KEY (template_id)
    REFERENCES order_templates(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_otfield_template (template_id, seq)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.4 order_field_values — value tren tung don
--     template_field_id NULL = field ad-hoc (admin tu them khi tao don)
CREATE TABLE IF NOT EXISTS order_field_values (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  order_id          INT          NOT NULL,
  template_field_id INT          NULL,
  label             VARCHAR(150) NOT NULL,        -- snapshot label tai thoi diem nhap
  value             TEXT         NULL,
  seq               INT          NOT NULL DEFAULT 0,
  is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_ofv_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_ofv_field FOREIGN KEY (template_field_id)
    REFERENCES order_template_fields(id) ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_ofv_order (order_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- 4.5 order_step_photos — anh up khi chuyen sang mot buoc
CREATE TABLE IF NOT EXISTS order_step_photos (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT          NOT NULL,
  step_code   VARCHAR(50)  NOT NULL,             -- code buoc trong template
  url         VARCHAR(500) NOT NULL,
  caption     VARCHAR(255) NULL,
  uploaded_by INT          NULL,                  -- user id (admin/staff/customer)
  uploaded_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_ostepphoto_order FOREIGN KEY (order_id)
    REFERENCES orders(id) ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_ostepphoto_order (order_id, step_code, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- 5. Seed 3 template mac dinh: Lap dat, Bao hanh, Sua chua
-- ==========================================================

INSERT IGNORE INTO order_templates (id, name, description, is_public, sort_order)
VALUES
  (1, 'Lap dat',  'Don lap dat thiet bi GPS moi',                1, 1),
  (2, 'Bao hanh', 'Don bao hanh thiet bi trong thoi gian BH',    1, 2),
  (3, 'Sua chua', 'Don sua chua thiet bi het BH hoac loi nguoi', 1, 3);

-- Khi chay lai migration, bo qua phan seed steps/fields neu da co du lieu
-- (uk_otstep_template_code se chan trung; fields se don sach roi seed lai)
DELETE FROM order_template_steps  WHERE template_id IN (1,2,3) AND is_deleted = 0
  AND code IN ('confirmed','assigned','received','released','in_progress','done',
               'fixing','inspecting','quoted','approved');
DELETE FROM order_template_fields WHERE template_id IN (1,2,3) AND is_deleted = 0
  AND label IN ('Bien so xe','IMEI','Dia chi lap','Hien tuong');

-- 5.1 Buoc cho "Lap dat"
INSERT INTO order_template_steps
  (template_id, seq, code, label, requires_photo, photo_min_count, update_roles, is_terminal)
VALUES
  (1, 1, 'confirmed',  'Da chot',           0, 0, JSON_ARRAY('admin'),       0),
  (1, 2, 'assigned',   'Da gan KTV',        0, 0, JSON_ARRAY('admin'),       0),
  (1, 3, 'received',   'KTV nhan hang',     1, 1, JSON_ARRAY('ktv'),         0),
  (1, 4, 'released',   'Da xuat kho',       0, 0, JSON_ARRAY('admin'),       0),
  (1, 5, 'in_progress','KTV dang lam',      0, 0, JSON_ARRAY('ktv'),         0),
  (1, 6, 'done',       'Hoan thanh',        1, 1, JSON_ARRAY('ktv','admin'), 1);

-- 5.2 Buoc cho "Bao hanh"
INSERT INTO order_template_steps
  (template_id, seq, code, label, requires_photo, photo_min_count, update_roles, is_terminal)
VALUES
  (2, 1, 'confirmed', 'Da tiep nhan',     0, 0, JSON_ARRAY('admin'),       0),
  (2, 2, 'assigned',  'Da gan KTV',       0, 0, JSON_ARRAY('admin'),       0),
  (2, 3, 'received',  'KTV nhan hang',    1, 1, JSON_ARRAY('ktv'),         0),
  (2, 4, 'released',  'Da xuat kho',      0, 0, JSON_ARRAY('admin'),       0),
  (2, 5, 'fixing',    'Dang xu ly BH',    0, 0, JSON_ARRAY('ktv'),         0),
  (2, 6, 'done',      'Hoan thanh BH',    1, 1, JSON_ARRAY('ktv','admin'), 1);

-- 5.3 Buoc cho "Sua chua"
INSERT INTO order_template_steps
  (template_id, seq, code, label, requires_photo, photo_min_count, update_roles, is_terminal)
VALUES
  (3, 1, 'confirmed',  'Da tiep nhan',          0, 0, JSON_ARRAY('admin'),       0),
  (3, 2, 'assigned',   'Da gan KTV',            0, 0, JSON_ARRAY('admin'),       0),
  (3, 3, 'inspecting', 'KTV dang khao sat',     1, 1, JSON_ARRAY('ktv'),         0),
  (3, 4, 'quoted',     'Da bao gia',            0, 0, JSON_ARRAY('admin'),       0),
  (3, 5, 'approved',   'Khach duyet bao gia',   0, 0, JSON_ARRAY('admin','customer'), 0),
  (3, 6, 'fixing',     'Dang sua',              0, 0, JSON_ARRAY('ktv'),         0),
  (3, 7, 'done',       'Hoan thanh',            1, 1, JSON_ARRAY('ktv','admin'), 1);

-- 5.4 Custom field mac dinh
INSERT INTO order_template_fields
  (template_id, seq, label, field_type, is_required, placeholder)
VALUES
  (1, 1, 'Bien so xe',  'text', 1, 'VD: 29A-12345'),
  (1, 2, 'IMEI',        'text', 0, NULL),
  (1, 3, 'Dia chi lap', 'textarea', 0, NULL),

  (2, 1, 'Bien so xe',  'text', 1, NULL),
  (2, 2, 'IMEI',        'text', 1, NULL),
  (2, 3, 'Hien tuong',  'textarea', 1, 'Mo ta loi'),

  (3, 1, 'Bien so xe',  'text', 1, NULL),
  (3, 2, 'IMEI',        'text', 0, NULL),
  (3, 3, 'Hien tuong',  'textarea', 1, 'Mo ta loi');

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'order_template%';
--   SHOW TABLES LIKE 'order_field_values';
--   SHOW TABLES LIKE 'order_step_photos';
--   SHOW TABLES LIKE 'warranty_orders';   -- empty
--   SHOW TABLES LIKE 'repair_orders';     -- empty
--   SHOW TABLES LIKE 'badge_orders';      -- empty
--   SHOW COLUMNS FROM orders LIKE 'template_id';
--   SHOW COLUMNS FROM orders LIKE 'service_kind';   -- empty
--   SELECT * FROM order_templates;
-- ==========================================================
