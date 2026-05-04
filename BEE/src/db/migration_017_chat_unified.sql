-- ==========================================================
-- Migration 017 — Gop chat thanh 1 conversation/khach
-- CHAY 1 LAN (DEV: drop bang cu, tao lai. CO MAT DATA CHAT CU.)
-- ----------------------------------------------------------
-- Thay doi:
--   - 1 customer = 1 conversation duy nhat (bo order_id, kind, staff_id).
--   - Bang moi conversation_members(conversation_id, staff_id, joined_at,
--     removed_at) cho phep nhieu KTV/admin tham gia 1 cuoc chat. Admin
--     bam them/bot KTV thay cho viec gan cung 1 staff_id.
--   - messages.order_id (NULL): tag tin nhan ve don cu the de FE
--     hien badge "📦 Don DH-XXXX" co the click sang chi tiet don.
-- ==========================================================

USE gpsviet;

-- Drop theo thu tu de tranh FK violation
DROP TABLE IF EXISTS conversation_members;
DROP TABLE IF EXISTS messages;
DROP TABLE IF EXISTS conversations;

-- ----------------------------------------------------------
-- Bang: conversations — 1 row / khach
-- ----------------------------------------------------------
CREATE TABLE conversations (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  customer_id     INT NOT NULL UNIQUE,
  last_message_at DATETIME  NULL,
  is_deleted      TINYINT(1) NOT NULL DEFAULT 0,

  CONSTRAINT fk_conv_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_conv_deleted (is_deleted),
  INDEX idx_conv_last_msg (last_message_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: conversation_members — staff (admin/ktv) tham gia 1 conv
-- removed_at IS NULL: dang trong chat, gui/nhan tin duoc.
-- removed_at IS NOT NULL: da bi kick — van xem duoc tin truoc thoi diem do
-- (FE filter), khong gui them.
-- Re-add KTV cu: UPDATE removed_at = NULL thay vi insert moi.
-- ----------------------------------------------------------
CREATE TABLE conversation_members (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  staff_id        INT NOT NULL,
  joined_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  removed_at      DATETIME NULL,
  added_by        INT NULL,                    -- ai add (admin/system)

  UNIQUE KEY uq_conv_staff (conversation_id, staff_id),

  CONSTRAINT fk_cm_conv
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cm_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cm_added_by
    FOREIGN KEY (added_by) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_cm_staff_active (staff_id, removed_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Bang: messages — them order_id de tag tin ve don cu the
-- ----------------------------------------------------------
CREATE TABLE messages (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  conversation_id INT NOT NULL,
  order_id        INT NULL,                    -- optional tag don
  sender_type     ENUM('customer','staff') NOT NULL,
  sender_id       INT NOT NULL,
  content         TEXT NOT NULL,
  visibility      ENUM('all','staff_only') NOT NULL DEFAULT 'all',
  sent_at         DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  read_at         DATETIME NULL,

  CONSTRAINT fk_msg_conv
    FOREIGN KEY (conversation_id) REFERENCES conversations(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_msg_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_msg_conv (conversation_id, sent_at),
  INDEX idx_msg_order (order_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'conversation%';
--   SHOW TABLES LIKE 'messages';
--   SHOW COLUMNS FROM messages LIKE 'order_id';
-- ==========================================================
