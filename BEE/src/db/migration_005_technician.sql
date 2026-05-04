-- ==========================================================
-- Migration 005 — Tinh nang Ky Thuat (technician)
-- CHAY 1 LAN sau migration_004_orders.sql
-- ----------------------------------------------------------
-- Phu thuoc:
--   - staff (schema.sql)
--   - stock_items (migration_003_inventory.sql)
--   - orders, order_items (migration_004_orders.sql)
--   - customers (schema.sql)
-- LUU Y: cac lenh ALTER khong dung IF NOT EXISTS de tuong thich MySQL 5.7.
-- Neu chay lai bi loi "Duplicate column" thi nghia la da chay roi -> bo qua.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- Mo rong bang staff: them khu vuc + online status + rating
-- ----------------------------------------------------------
ALTER TABLE staff
  ADD COLUMN area          VARCHAR(100) NULL AFTER role,
  ADD COLUMN cccd          VARCHAR(20)  NULL AFTER phone,
  ADD COLUMN online_status ENUM('online','offline') NOT NULL DEFAULT 'offline',
  ADD COLUMN rating        DECIMAL(3,2) NOT NULL DEFAULT 0,
  ADD INDEX idx_staff_area (area);

-- ----------------------------------------------------------
-- Bang: tasks — cong viec KTV (sinh tu order)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS tasks (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  code              VARCHAR(30)  NOT NULL UNIQUE,         -- TASK-2604-001
  order_id          INT          NOT NULL,
  kind              ENUM('install','maintenance','renew','uninstall')
                    NOT NULL DEFAULT 'install',
  assigned_staff_id INT          NULL,
  status            ENUM('new','in_progress','done','cancelled')
                    NOT NULL DEFAULT 'new',
  due_at            DATETIME     NULL,
  started_at        DATETIME     NULL,
  completed_at      DATETIME     NULL,
  collect_amount    BIGINT       NOT NULL DEFAULT 0,      -- so tien KTV can thu cua khach
  collect_method    ENUM('cash','transfer','none') NOT NULL DEFAULT 'none',
  wage_amount       BIGINT       NOT NULL DEFAULT 0,      -- cong lap KTV duoc huong khi xong
  note              TEXT         NULL,
  is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_task_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_task_staff
    FOREIGN KEY (assigned_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_task_status   (status),
  INDEX idx_task_assigned (assigned_staff_id),
  INDEX idx_task_order    (order_id),
  INDEX idx_task_kind     (kind),
  INDEX idx_task_deleted  (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: task_checklist — cac buoc trong 1 task
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_checklist (
  id         INT AUTO_INCREMENT PRIMARY KEY,
  task_id    INT          NOT NULL,
  step       VARCHAR(255) NOT NULL,                       -- "Kiem tra TB", "Cap tai khoan"...
  is_done    TINYINT(1)   NOT NULL DEFAULT 0,
  done_at    DATETIME     NULL,
  sort_order INT          NOT NULL DEFAULT 0,

  CONSTRAINT fk_checklist_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_checklist_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: task_attachments — anh proof khi hoan thanh
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_attachments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  task_id     INT          NOT NULL,
  url         VARCHAR(500) NOT NULL,
  caption     VARCHAR(255) NULL,
  uploaded_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_attach_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_attach_task (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Mo rong stock_items: KTV "muon" thiet bi tu kho chung
-- - status='reserved' khi held_by_staff_id IS NOT NULL
-- - Khi lap xong: status='sold' + log warehouse_logs(out)
-- - Khi tra kho: status='available' + xoa held_by_staff_id
-- ----------------------------------------------------------
ALTER TABLE stock_items
  ADD COLUMN held_by_staff_id INT      NULL AFTER status,
  ADD COLUMN held_since       DATETIME NULL,
  ADD COLUMN held_for_task_id INT      NULL,
  ADD INDEX idx_stock_held (held_by_staff_id),
  ADD CONSTRAINT fk_stock_held_staff
    FOREIGN KEY (held_by_staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  ADD CONSTRAINT fk_stock_held_task
    FOREIGN KEY (held_for_task_id) REFERENCES tasks(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------
-- Bang: collections — KTV thu tien tu khach (1 task -> 0..1 collection)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS collections (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  task_id       INT          NOT NULL,
  staff_id      INT          NOT NULL,                   -- KTV thu
  amount        BIGINT       NOT NULL,
  method        ENUM('cash','transfer') NOT NULL,
  receipt_url   VARCHAR(500) NULL,                        -- anh bien lai khach ki
  collected_at  DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  remitted      TINYINT(1)   NOT NULL DEFAULT 0,          -- da nop cong ty?
  remittance_id INT          NULL,                        -- thuoc lo nop nao
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_coll_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_coll_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,

  INDEX idx_coll_staff   (staff_id),
  INDEX idx_coll_task    (task_id),
  INDEX idx_coll_remit   (remitted),
  INDEX idx_coll_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: remittances — KTV nop tien ve cong ty (gom nhieu collection)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS remittances (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  staff_id      INT          NOT NULL,
  amount        BIGINT       NOT NULL,
  method        ENUM('cash','transfer') NOT NULL,
  receipt_url   VARCHAR(500) NULL,
  note          TEXT         NULL,
  remitted_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_by   INT          NULL,                          -- admin verify
  approved_at   DATETIME     NULL,
  reject_reason VARCHAR(500) NULL,
  status        ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_remit_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_remit_approver
    FOREIGN KEY (approved_by) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_remit_staff   (staff_id),
  INDEX idx_remit_status  (status),
  INDEX idx_remit_deleted (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- FK collections.remittance_id -> remittances (tao sau khi remittances ton tai)
ALTER TABLE collections
  ADD CONSTRAINT fk_coll_remit
    FOREIGN KEY (remittance_id) REFERENCES remittances(id)
    ON DELETE SET NULL ON UPDATE CASCADE;

-- ----------------------------------------------------------
-- Bang: staff_reviews — danh gia khach hang cho KTV
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS staff_reviews (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  staff_id    INT          NOT NULL,
  task_id     INT          NOT NULL,
  rating      TINYINT      NOT NULL,                       -- 1..5
  comment     TEXT         NULL,
  reviewed_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_review_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_review_task
    FOREIGN KEY (task_id) REFERENCES tasks(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_review_staff (staff_id),
  INDEX idx_review_task  (task_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: conversations — cuoc tro chuyen (1 order = 1 conversation)
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS conversations (
  id              INT       AUTO_INCREMENT PRIMARY KEY,
  order_id        INT       NOT NULL UNIQUE,
  customer_id     INT       NOT NULL,
  staff_id        INT       NULL,                          -- KTV duoc gan
  last_message_at DATETIME  NULL,
  is_deleted      TINYINT(1) NOT NULL DEFAULT 0,

  CONSTRAINT fk_conv_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_conv_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_conv_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_conv_staff    (staff_id),
  INDEX idx_conv_customer (customer_id),
  INDEX idx_conv_deleted  (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: messages — tin nhan trong conversation
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS messages (
  id              INT      AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT      NOT NULL,
  sender_type     ENUM('customer','staff') NOT NULL,
  sender_id       INT      NOT NULL,
  content         TEXT     NOT NULL,
  sent_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at         DATETIME NULL,

  CONSTRAINT fk_msg_conv
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_msg_conv (conversation_id, sent_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'task%';
--   SHOW TABLES LIKE 'collection%';
--   SHOW TABLES LIKE 'remittance%';
--   SHOW TABLES LIKE 'conversation%';
--   SHOW TABLES LIKE 'message%';
--   SELECT area, online_status FROM staff LIMIT 1;
-- ==========================================================
