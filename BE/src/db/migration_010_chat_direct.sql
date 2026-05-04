-- ==========================================================
-- Migration 010 — Free chat: KH/dai ly chat truc tiep voi admin
-- CHAY 1 LAN sau migration_009.
-- ----------------------------------------------------------
-- Thay doi:
--   1. conversations.order_id  -> NULL duoc (cho direct chat)
--   2. Bo UNIQUE order_id, them index thuong (vi nhieu NULL)
--   3. Them cot kind ENUM('order','direct')
--      'order'  = chat trong 1 don (giua KH va KTV duoc gan)
--      'direct' = chat truc tiep voi team admin/CSKH
--
-- Moi customer chi co toi da 1 conversation kind='direct'
-- (BE find-or-create theo customer_id).
-- ==========================================================

USE gpsviet;

ALTER TABLE conversations
  DROP INDEX order_id,
  MODIFY COLUMN order_id INT NULL,
  ADD COLUMN kind ENUM('order','direct') NOT NULL DEFAULT 'order' AFTER order_id,
  ADD INDEX idx_conv_kind_customer (kind, customer_id),
  ADD INDEX idx_conv_order (order_id);

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM conversations LIKE 'kind';
--   SHOW INDEX FROM conversations;
-- ==========================================================
