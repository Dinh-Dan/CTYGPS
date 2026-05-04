-- ==========================================================
-- Migration 034 — Gop bang tasks vao orders (xoa hoan toan tasks)
-- Chay 1 lan sau migration_033_repair_seed.sql
-- ----------------------------------------------------------
-- Ly do:
--   - 2 luong status song song (orders + tasks) gay lech du lieu.
--   - 1 don chi 1 KTV, gan ai thi ghi de truc tiep, khong can lich su.
-- Thay doi:
--   1. orders: them assigned_staff_id, kind, due_at, started_at,
--      completed_at, wage_amount, ktv_note
--   2. Tao bang order_checklist (thay task_checklist)
--   3. Tao bang order_attachments (thay task_attachments)
--   4. Doi FK cac bang con: collections, release_pool, staff_reviews
--      task_id -> order_id
--   5. Drop cot task_id/ref_task_id/held_for_task_id o:
--      stock_receipts, order_payments, stock_items
--   6. DROP bang tasks, task_checklist, task_attachments
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao
--        "Duplicate column" nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

-- ==========================================================
-- BUOC 1: Them cot vao orders
-- ==========================================================

ALTER TABLE orders
  ADD COLUMN assigned_staff_id INT          NULL                          AFTER service_kind,
  ADD COLUMN kind              ENUM('install','maintenance','renew','uninstall')
                               NOT NULL DEFAULT 'install'                 AFTER assigned_staff_id,
  ADD COLUMN due_at            DATETIME     NULL                          AFTER kind,
  ADD COLUMN started_at        DATETIME     NULL                          AFTER due_at,
  ADD COLUMN completed_at      DATETIME     NULL                          AFTER started_at,
  ADD COLUMN wage_amount       BIGINT       NOT NULL DEFAULT 0            AFTER completed_at,
  ADD COLUMN ktv_note          TEXT         NULL                          AFTER wage_amount,
  ADD INDEX idx_orders_assigned_staff (assigned_staff_id),
  ADD INDEX idx_orders_kind           (kind),
  ADD INDEX idx_orders_completed_at   (completed_at),
  ADD CONSTRAINT fk_orders_assigned_staff
    FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ==========================================================
-- BUOC 2: Tao bang order_checklist (thay task_checklist)
-- ==========================================================

CREATE TABLE IF NOT EXISTS order_checklist (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  order_id   INT          NOT NULL,
  step       VARCHAR(255) NOT NULL,
  is_done    TINYINT(1)   NOT NULL DEFAULT 0,
  done_at    DATETIME     NULL,
  sort_order INT          NOT NULL DEFAULT 0,
  CONSTRAINT fk_order_checklist_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_order_checklist_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- BUOC 3: Tao bang order_attachments (thay task_attachments)
-- ==========================================================

CREATE TABLE IF NOT EXISTS order_attachments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  order_id    INT          NOT NULL,
  url         VARCHAR(500) NOT NULL,
  caption     VARCHAR(255) NULL,
  stage       ENUM('receive','deliver','other') NOT NULL DEFAULT 'other',
  uploaded_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT fk_order_att_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_order_att_order (order_id),
  INDEX idx_order_att_stage (order_id, stage)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- BUOC 4: Migrate du lieu tu tasks -> orders
-- (1 order = 1 task moi nhat chua xoa)
-- ==========================================================

UPDATE orders o
LEFT JOIN (
  SELECT t.order_id, t.assigned_staff_id, t.kind, t.due_at,
         t.started_at, t.completed_at, t.wage_amount, t.note
    FROM tasks t
    JOIN (
      SELECT order_id, MAX(id) AS max_id
        FROM tasks
       WHERE is_deleted = 0
       GROUP BY order_id
    ) m ON m.max_id = t.id
) tt ON tt.order_id = o.id
   SET o.assigned_staff_id = tt.assigned_staff_id,
       o.kind              = COALESCE(tt.kind, 'install'),
       o.due_at            = tt.due_at,
       o.started_at        = tt.started_at,
       o.completed_at      = tt.completed_at,
       o.wage_amount       = COALESCE(tt.wage_amount, 0),
       o.ktv_note          = tt.note
 WHERE o.is_deleted = 0;

-- Backfill completed_at cho don da o final-status nhung task chua done
-- (tranh recalcOrderFinalStatus skip nham)
UPDATE orders
   SET completed_at = NOW()
 WHERE completed_at IS NULL
   AND status IN ('done','customer_owes','pending_admin_confirm','staff_owes');

-- Migrate task_checklist -> order_checklist
INSERT INTO order_checklist (order_id, step, is_done, done_at, sort_order)
SELECT t.order_id, c.step, c.is_done, c.done_at, c.sort_order
  FROM task_checklist c
  JOIN tasks t ON t.id = c.task_id
 WHERE t.is_deleted = 0;

-- Migrate task_attachments -> order_attachments
INSERT INTO order_attachments (order_id, url, caption, stage, uploaded_at)
SELECT t.order_id, a.url, a.caption,
       COALESCE(a.stage, 'other'), a.uploaded_at
  FROM task_attachments a
  JOIN tasks t ON t.id = a.task_id
 WHERE t.is_deleted = 0;

-- ==========================================================
-- BUOC 5: Doi FK cac bang con (task_id -> order_id)
-- ==========================================================

-- 5.1 collections.task_id -> collections.order_id
ALTER TABLE collections ADD COLUMN order_id INT NULL AFTER task_id;
UPDATE collections c JOIN tasks t ON t.id = c.task_id SET c.order_id = t.order_id;
ALTER TABLE collections DROP FOREIGN KEY fk_coll_task;
ALTER TABLE collections DROP INDEX idx_coll_task;
ALTER TABLE collections DROP COLUMN task_id;
ALTER TABLE collections MODIFY COLUMN order_id INT NOT NULL;
ALTER TABLE collections
  ADD CONSTRAINT fk_coll_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD INDEX idx_coll_order (order_id);

-- 5.2 release_pool.task_id -> release_pool.order_id
ALTER TABLE release_pool ADD COLUMN order_id INT NULL AFTER task_id;
UPDATE release_pool rp JOIN tasks t ON t.id = rp.task_id SET rp.order_id = t.order_id;
ALTER TABLE release_pool DROP FOREIGN KEY fk_release_pool_task;
ALTER TABLE release_pool DROP INDEX uk_release_pool_task_product;
ALTER TABLE release_pool DROP INDEX idx_release_pool_task;
ALTER TABLE release_pool DROP COLUMN task_id;
ALTER TABLE release_pool MODIFY COLUMN order_id INT NOT NULL;
ALTER TABLE release_pool
  ADD CONSTRAINT fk_release_pool_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD UNIQUE KEY uk_release_pool_order_product (order_id, product_id),
  ADD INDEX idx_release_pool_order (order_id);

-- 5.3 staff_reviews.task_id -> staff_reviews.order_id
ALTER TABLE staff_reviews ADD COLUMN order_id INT NULL AFTER staff_id;
UPDATE staff_reviews r JOIN tasks t ON t.id = r.task_id SET r.order_id = t.order_id;
ALTER TABLE staff_reviews DROP FOREIGN KEY fk_review_task;
ALTER TABLE staff_reviews DROP INDEX idx_review_task;
ALTER TABLE staff_reviews DROP COLUMN task_id;
ALTER TABLE staff_reviews MODIFY COLUMN order_id INT NOT NULL;
ALTER TABLE staff_reviews
  ADD CONSTRAINT fk_review_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  ADD INDEX idx_review_order (order_id);

-- 5.4 stock_receipts.ref_task_id (chi index, khong FK) - DROP
ALTER TABLE stock_receipts DROP INDEX idx_receipts_task;
ALTER TABLE stock_receipts DROP COLUMN ref_task_id;

-- 5.5 order_payments.task_id (chi index, khong FK) - DROP
ALTER TABLE order_payments DROP INDEX idx_payment_task;
ALTER TABLE order_payments DROP COLUMN task_id;

-- 5.6 stock_items.held_for_task_id (legacy) - DROP
ALTER TABLE stock_items DROP FOREIGN KEY fk_stock_held_task;
ALTER TABLE stock_items DROP COLUMN held_for_task_id;

-- ==========================================================
-- BUOC 6: DROP bang tasks (va 2 bang con)
-- Phai drop task_checklist + task_attachments truoc vi co FK -> tasks
-- ==========================================================

DROP TABLE IF EXISTS task_checklist;
DROP TABLE IF EXISTS task_attachments;
DROP TABLE IF EXISTS tasks;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'task%';                               -- empty
--   SHOW COLUMNS FROM orders LIKE 'assigned_staff_id';      -- co
--   SHOW COLUMNS FROM orders LIKE 'wage_amount';            -- co
--   SHOW COLUMNS FROM collections LIKE 'order_id';          -- co
--   SHOW COLUMNS FROM collections LIKE 'task_id';           -- empty
--   SHOW COLUMNS FROM release_pool LIKE 'order_id';         -- co
--   SHOW COLUMNS FROM staff_reviews LIKE 'order_id';        -- co
--   SHOW COLUMNS FROM order_payments LIKE 'task_id';        -- empty
--   SHOW COLUMNS FROM stock_receipts LIKE 'ref_task_id';    -- empty
--   SHOW COLUMNS FROM stock_items LIKE 'held_for_task_id';  -- empty
--   DESCRIBE order_checklist;
--   DESCRIBE order_attachments;
-- ==========================================================
