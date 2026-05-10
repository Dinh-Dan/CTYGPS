-- ==========================================================
-- Migration 052 — Don hang nhieu dong cong viec
-- ----------------------------------------------------------
-- Cho phep 1 don chua N "dong cong viec" (line). Vi du:
--   Don ORD-1005-001:
--     - Line 1: Lap moi 2 san pham
--     - Line 2: Bao tri 1 san pham
--   Khach tra 1 lan, 1 KTV nhan, in 1 hoa don gop.
--
-- Quyet dinh thiet ke:
--   * Status + KTV + thanh toan o cap DON (chung).
--   * Custom fields (bien so, IMEI, hien tuong) o cap LINE.
--   * Items + charges o cap LINE. Charges line_id NULL = phi cap don.
--   * Workflow steps khong gan template nua — dung 1 quy trinh
--     co dinh chung cho moi don (bang order_workflow_steps).
--   * Template gio chi dinh nghia "loai cong viec" + custom fields.
--
-- Thay doi:
--   1. XOA SACH du lieu don cu (orders + items + charges + field_values
--      + step_photos + tasks lien quan).
--   2. DROP order_template_steps (steps gio global).
--   3. ALTER orders: drop template_id, approved_at, approved_by.
--   4. CREATE order_lines.
--   5. ALTER order_items: them line_id NOT NULL.
--   6. ALTER order_charges: them line_id (NULL = charge cap don).
--   7. ALTER order_field_values: them line_id NOT NULL.
--   8. CREATE order_workflow_steps + seed.
-- ==========================================================

USE gpsviet;

SET FOREIGN_KEY_CHECKS = 0;

-- ==========================================================
-- HELPER procedure: drop FK / index / column "neu ton tai"
-- ==========================================================
DROP PROCEDURE IF EXISTS m052_drop_fk;
DROP PROCEDURE IF EXISTS m052_drop_idx;
DROP PROCEDURE IF EXISTS m052_drop_col;
DROP PROCEDURE IF EXISTS m052_add_col;
DROP PROCEDURE IF EXISTS m052_safe_truncate;
DROP PROCEDURE IF EXISTS m052_safe_exec;

DELIMITER $$
CREATE PROCEDURE m052_drop_fk(IN tbl VARCHAR(64), IN fk VARCHAR(64))
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.TABLE_CONSTRAINTS
              WHERE CONSTRAINT_SCHEMA = DATABASE()
                AND TABLE_NAME = tbl AND CONSTRAINT_NAME = fk
                AND CONSTRAINT_TYPE = 'FOREIGN KEY') THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` DROP FOREIGN KEY `', fk, '`');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
CREATE PROCEDURE m052_drop_idx(IN tbl VARCHAR(64), IN idx VARCHAR(64))
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.STATISTICS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = tbl AND INDEX_NAME = idx) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` DROP INDEX `', idx, '`');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
CREATE PROCEDURE m052_drop_col(IN tbl VARCHAR(64), IN col VARCHAR(64))
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.COLUMNS
              WHERE TABLE_SCHEMA = DATABASE()
                AND TABLE_NAME = tbl AND COLUMN_NAME = col) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` DROP COLUMN `', col, '`');
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
CREATE PROCEDURE m052_add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl TEXT)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = tbl AND COLUMN_NAME = col) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN ', ddl);
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
-- chay 1 cau SQL chi khi bang ton tai
CREATE PROCEDURE m052_safe_exec(IN tbl VARCHAR(64), IN sql_text TEXT)
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.TABLES
              WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = tbl) THEN
    SET @s = sql_text;
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
DELIMITER ;

-- ==========================================================
-- 1. Xoa sach du lieu don cu
-- ==========================================================
CALL m052_safe_exec('order_step_photos',  'DELETE FROM order_step_photos');
CALL m052_safe_exec('order_field_values', 'DELETE FROM order_field_values');
CALL m052_safe_exec('order_charges',      'DELETE FROM order_charges');
CALL m052_safe_exec('order_payments',     'DELETE FROM order_payments');
CALL m052_safe_exec('order_items',        'DELETE FROM order_items');
-- tasks tham chieu orders, can xoa truoc (neu bang con)
CALL m052_safe_exec('tasks',              'DELETE FROM tasks');
-- stock_receipts dinh kem don cu khong con y nghia
CALL m052_safe_exec('stock_receipts',     'DELETE FROM stock_receipts WHERE ref_order_id IS NOT NULL');
-- KTV reset pool sau khi xoa don
CALL m052_safe_exec('staff_holdings',     'DELETE FROM staff_holdings');
-- messages gan order va notifications gan ref_order
CALL m052_safe_exec('messages',           'UPDATE messages SET order_id = NULL WHERE order_id IS NOT NULL');
CALL m052_safe_exec('notifications',      'UPDATE notifications SET ref_order_id = NULL WHERE ref_order_id IS NOT NULL');
CALL m052_safe_exec('orders',             'DELETE FROM orders');

-- ==========================================================
-- 2. Drop order_template_steps (steps gio global)
-- ==========================================================
DROP TABLE IF EXISTS order_template_steps;

-- ==========================================================
-- 3. Reshape orders
-- ==========================================================
CALL m052_drop_fk ('orders', 'fk_orders_template');
CALL m052_drop_idx('orders', 'idx_orders_template');
CALL m052_drop_col('orders', 'template_id');
CALL m052_drop_col('orders', 'approved_at');
CALL m052_drop_col('orders', 'approved_by');

-- ==========================================================
-- 4. CREATE order_lines
-- ==========================================================
CREATE TABLE IF NOT EXISTS order_lines (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT          NOT NULL,
  template_id INT          NOT NULL,                    -- loai cong viec
  seq         INT          NOT NULL DEFAULT 0,
  subtotal    BIGINT       NOT NULL DEFAULT 0,           -- tinh tu items + charges line
  note        VARCHAR(500) NULL,
  is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_oline_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_oline_template
    FOREIGN KEY (template_id) REFERENCES order_templates(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  INDEX idx_oline_order    (order_id, is_deleted),
  INDEX idx_oline_template (template_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- 5. ALTER order_items: them line_id NOT NULL
-- ==========================================================
CALL m052_add_col('order_items', 'line_id', 'line_id INT NOT NULL AFTER order_id');
CALL m052_drop_fk ('order_items', 'fk_oi_line');
CALL m052_drop_idx('order_items', 'idx_oi_line');
ALTER TABLE order_items
  ADD CONSTRAINT fk_oi_line FOREIGN KEY (line_id) REFERENCES order_lines(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD INDEX idx_oi_line (line_id);

-- ==========================================================
-- 6. ALTER order_charges: them line_id NULL (NULL = charge cap don)
-- ==========================================================
CALL m052_add_col('order_charges', 'line_id', 'line_id INT NULL AFTER order_id');
CALL m052_drop_fk ('order_charges', 'fk_charge_line');
CALL m052_drop_idx('order_charges', 'idx_charge_line');
ALTER TABLE order_charges
  ADD CONSTRAINT fk_charge_line FOREIGN KEY (line_id) REFERENCES order_lines(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD INDEX idx_charge_line (line_id);

-- ==========================================================
-- 7. ALTER order_field_values: them line_id NOT NULL
-- ==========================================================
CALL m052_add_col('order_field_values', 'line_id', 'line_id INT NOT NULL AFTER order_id');
CALL m052_drop_fk ('order_field_values', 'fk_ofv_line');
CALL m052_drop_idx('order_field_values', 'idx_ofv_line');
ALTER TABLE order_field_values
  ADD CONSTRAINT fk_ofv_line FOREIGN KEY (line_id) REFERENCES order_lines(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD INDEX idx_ofv_line (line_id);

-- Don dep helper procedure
DROP PROCEDURE IF EXISTS m052_drop_fk;
DROP PROCEDURE IF EXISTS m052_drop_idx;
DROP PROCEDURE IF EXISTS m052_drop_col;
DROP PROCEDURE IF EXISTS m052_add_col;
DROP PROCEDURE IF EXISTS m052_safe_exec;

-- ==========================================================
-- 8. CREATE order_workflow_steps (global, thay order_template_steps)
-- ==========================================================
CREATE TABLE IF NOT EXISTS order_workflow_steps (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  seq             INT          NOT NULL DEFAULT 0,
  code            VARCHAR(50)  NOT NULL UNIQUE,        -- value cua orders.status
  label           VARCHAR(150) NOT NULL,
  requires_photo  TINYINT(1)   NOT NULL DEFAULT 0,
  photo_min_count INT          NOT NULL DEFAULT 0,
  update_roles    JSON         NULL,                   -- ["admin","ktv","customer"]
  is_terminal     TINYINT(1)   NOT NULL DEFAULT 0,
  is_system       TINYINT(1)   NOT NULL DEFAULT 0,     -- 1 = pending/cancelled (khong xoa duoc)
  is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,
  INDEX idx_wfstep_seq (seq, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Seed quy trinh chuan
INSERT INTO order_workflow_steps
  (seq, code, label, requires_photo, photo_min_count, update_roles, is_terminal, is_system)
VALUES
  ( 0, 'pending',     'Cho duyet',       0, 0, JSON_ARRAY('admin','customer'), 0, 1),
  (10, 'confirmed',   'Da chot',         0, 0, JSON_ARRAY('admin'),             0, 0),
  (20, 'assigned',    'Da gan KTV',      0, 0, JSON_ARRAY('admin'),             0, 0),
  (30, 'received',    'KTV nhan hang',   1, 1, JSON_ARRAY('ktv'),               0, 0),
  (40, 'released',    'Da xuat kho',     0, 0, JSON_ARRAY('admin'),             0, 0),
  (50, 'in_progress', 'KTV dang lam',    0, 0, JSON_ARRAY('ktv'),               0, 0),
  (90, 'done',        'Hoan thanh',      1, 1, JSON_ARRAY('ktv','admin'),       1, 0),
  (99, 'cancelled',   'Da huy',          0, 0, JSON_ARRAY('admin'),             1, 1);

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'order_lines';
--   SHOW TABLES LIKE 'order_workflow_steps';
--   SHOW TABLES LIKE 'order_template_steps';   -- empty
--   SHOW COLUMNS FROM orders LIKE 'template_id';      -- empty
--   SHOW COLUMNS FROM order_items LIKE 'line_id';
--   SHOW COLUMNS FROM order_charges LIKE 'line_id';
--   SHOW COLUMNS FROM order_field_values LIKE 'line_id';
--   SELECT * FROM order_workflow_steps;
-- ==========================================================
