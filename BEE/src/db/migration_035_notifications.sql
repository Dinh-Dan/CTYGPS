-- ==========================================================
-- Migration 035 — Bang notifications cho admin
-- Chay 1 lan sau migration_034
-- ----------------------------------------------------------
-- Muc dich:
--   Luu lich su thong bao realtime cho admin (KTV thao tac don,
--   khach tao don/phu hieu, KTV nop tien...). Khac voi seen_at
--   tren orders/customers (chi dem so) — bang nay co text + link
--   click vao se mo dung don.
-- type values:
--   'order_new'                 - khach tao don (pending_review)
--   'badge_new'                 - khach dang ky phu hieu
--   'order_receive_uploaded'    - KTV chup anh nhan hang lan dau
--   'order_completed'           - KTV /complete
--   'staff_remit'               - KTV nop tien
-- link_url: VD '/admin/orders.html#order-123' — FE phai tu xu ly hash
-- ==========================================================

USE gpsviet;

CREATE TABLE IF NOT EXISTS notifications (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  type        VARCHAR(50)  NOT NULL,
  title       VARCHAR(255) NOT NULL,
  message     VARCHAR(500) NOT NULL,
  link_url    VARCHAR(500) NULL,

  ref_order_id        INT NULL,
  ref_customer_id     INT NULL,
  ref_staff_id        INT NULL,

  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  read_at     DATETIME     NULL,
  is_deleted  TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_notif_unread (is_deleted, is_read, id),
  INDEX idx_notif_created (created_at),
  INDEX idx_notif_ref_order (ref_order_id),

  CONSTRAINT fk_notif_order
    FOREIGN KEY (ref_order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notif_customer
    FOREIGN KEY (ref_customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_notif_staff
    FOREIGN KEY (ref_staff_id) REFERENCES staff(id)
    ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   DESCRIBE notifications;
--   SHOW INDEX FROM notifications;
-- ==========================================================
