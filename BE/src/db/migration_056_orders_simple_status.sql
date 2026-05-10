-- ==========================================================
-- Migration 056 — Don gian hoa trang thai don
-- ----------------------------------------------------------
-- Tu mig 052 co 7 buoc workflow (pending, confirmed, assigned,
-- received, released, in_progress, done) + cancelled. Thuc te
-- cong ty khong dung released/received: KTV tu om hang san,
-- nhan don thi check staff_holdings du la lam.
--
-- Sau migration nay:
--   * orders.status chi nhan 5 gia tri:
--       pending     — khach moi tao, cho admin duyet
--       confirmed   — admin da duyet (gan KTV ngay luc duyet)
--       in_progress — KTV bat dau lam
--       done        — hoan thanh
--       cancelled   — huy
--   * Don cu o assigned/received/released/in_progress map het
--     -> in_progress. done giu nguyen.
--   * Them orders.progress_note TEXT — ghi chu thuc te
--     (ai co quyen cung update duoc).
--   * order_workflow_steps: xoa cac buoc khong con dung; giu
--     bang (de orderState.js van load duoc) nhung shape moi.
-- ==========================================================

USE gpsviet;

-- 1. Map du lieu cu sang trang thai moi (truoc khi sua workflow)
UPDATE orders SET status = 'in_progress'
  WHERE status IN ('assigned', 'received', 'released');
-- 'in_progress' giu nguyen, 'pending'/'confirmed'/'done'/'cancelled' giu nguyen

-- 2. Them progress_note (idempotent)
DROP PROCEDURE IF EXISTS m056_add_col;
DELIMITER $$
CREATE PROCEDURE m056_add_col(IN tbl VARCHAR(64), IN col VARCHAR(64), IN ddl TEXT)
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.COLUMNS
                  WHERE TABLE_SCHEMA = DATABASE()
                    AND TABLE_NAME = tbl AND COLUMN_NAME = col) THEN
    SET @s = CONCAT('ALTER TABLE `', tbl, '` ADD COLUMN ', ddl);
    PREPARE st FROM @s; EXECUTE st; DEALLOCATE PREPARE st;
  END IF;
END$$
DELIMITER ;

CALL m056_add_col('orders', 'progress_note',
  'progress_note TEXT NULL AFTER status');

DROP PROCEDURE IF EXISTS m056_add_col;

-- 3. Reset bang workflow steps theo bo trang thai moi
DELETE FROM order_workflow_steps;

INSERT INTO order_workflow_steps
  (seq, code, label, requires_photo, photo_min_count, update_roles, is_terminal, is_system)
VALUES
  ( 0, 'pending',     'Cho duyet',  0, 0, JSON_ARRAY('admin','customer'), 0, 1),
  (10, 'confirmed',   'Len don',    0, 0, JSON_ARRAY('admin'),             0, 0),
  (20, 'in_progress', 'Dang xu ly', 0, 0, JSON_ARRAY('admin','ktv'),       0, 0),
  (30, 'done',        'Da xong',    0, 0, JSON_ARRAY('admin','ktv'),       1, 0),
  (99, 'cancelled',   'Da huy',     0, 0, JSON_ARRAY('admin'),             1, 1);

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SELECT DISTINCT status FROM orders;            -- chi co 5 gia tri
--   SHOW COLUMNS FROM orders LIKE 'progress_note';
--   SELECT * FROM order_workflow_steps;
-- ==========================================================
