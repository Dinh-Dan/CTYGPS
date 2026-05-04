-- ==========================================================
-- Migration 023 — Them subscription_account cho orders
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc tieu:
--   - Khi khach dat dich vu Gia han / Sua chua / Bao hanh,
--     khach dien "Tai khoan app theo doi" (vd: demoxetai) de
--     KTV / admin tra cuu xe nao tren he GoTrack.
--   - Truoc day field nay khong co cho luu -> phai gop vao note
--     -> kho filter / report.
--
-- Sau migration nay:
--   - orders.subscription_account chua username app GoTrack ma khach
--     dung de theo doi xe. NULL voi don khach moi (Lap moi) chua co tai khoan.
--   - Co the filter/report theo tai khoan sau nay.
--
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

ALTER TABLE orders
  ADD COLUMN subscription_account VARCHAR(64) NULL AFTER vehicle_plate;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM orders LIKE 'subscription_account';
-- ==========================================================
