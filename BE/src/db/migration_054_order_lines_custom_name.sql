-- ==========================================================
-- Migration 054 — Cho phep dong cong viec dat ten tu do
-- ----------------------------------------------------------
-- Truoc day moi line bat buoc co template_id (1 trong 5 loai
-- co dinh: Lap moi, Gia han, Thay sim, Thay cam, Phu hieu).
-- Gio cho phep:
--   * template_id NULLABLE — line "tu do" khong gan template.
--   * Them custom_name VARCHAR(120) NULL — ten do user nhap.
-- Ten hien thi = COALESCE(custom_name, template.name).
-- Quy uoc moi line PHAI co it nhat 1 trong 2 (template_id hoac
-- custom_name) — kiem o BE.
-- ==========================================================

USE gpsviet;

-- 1. Cho phep template_id NULL
ALTER TABLE order_lines
  MODIFY COLUMN template_id INT NULL;

-- 2. Them custom_name (idempotent)
DROP PROCEDURE IF EXISTS m054_add_col;
DELIMITER $$
CREATE PROCEDURE m054_add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl TEXT)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = tbl AND COLUMN_NAME = col) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN ', ddl);
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
DELIMITER ;

CALL m054_add_col('order_lines', 'custom_name',
  'custom_name VARCHAR(120) NULL AFTER template_id');

DROP PROCEDURE IF EXISTS m054_add_col;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM order_lines LIKE 'template_id';   -- YES (Null)
--   SHOW COLUMNS FROM order_lines LIKE 'custom_name';
-- ==========================================================
