-- ==========================================================
-- Migration 038 — Mo rong service_kind + them sim_numbers
-- ----------------------------------------------------------
-- 1. Them 2 loai cong viec moi: thay camera, thay sim.
-- 2. Them cot luu danh sach so SIM cho mot don
--    (luu chuoi cach nhau dau phay, tuong tu vehicle_plate).
-- ==========================================================

USE gpsviet;

ALTER TABLE orders
  MODIFY COLUMN service_kind
    ENUM('install','maintenance','warranty','renewal','badge','camera_swap','sim_swap')
    NOT NULL DEFAULT 'install';

ALTER TABLE orders
  ADD COLUMN sim_numbers VARCHAR(500) NULL AFTER vehicle_plate;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM orders LIKE 'service_kind';
--   SHOW COLUMNS FROM orders LIKE 'sim_numbers';
-- ==========================================================
