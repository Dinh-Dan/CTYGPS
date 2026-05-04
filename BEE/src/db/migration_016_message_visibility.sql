-- ==========================================================
-- Migration 016 — Message visibility (staff-only screenshots)
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc dich:
--   - Cho phep tin nhan chi hien voi staff (admin/KTV), khach khong thay.
--   - Dung cho anh chup man hinh ma admin/KTV yeu cau khach gui ngam:
--     khach gui ve qua FE, BE luu visibility='staff_only', GET messages
--     ben /customer/* loc bo.
-- ==========================================================

USE gpsviet;

ALTER TABLE messages
  ADD COLUMN visibility ENUM('all','staff_only')
    NOT NULL DEFAULT 'all' AFTER content;

-- ==========================================================
-- DONE.
-- Kiem tra: DESCRIBE messages;  -- thay co cot 'visibility'
-- ==========================================================
