-- ==========================================================
-- Migration 008 — Them service_kind cho orders
-- Phan biet don: lap moi / bao tri / bao hanh / gia han
-- Chay 1 lan sau migration_007.
-- ==========================================================

USE gpsviet;

ALTER TABLE orders
  ADD COLUMN service_kind ENUM('install','maintenance','warranty','renewal')
              NOT NULL DEFAULT 'install' AFTER vehicle_plate,
  ADD INDEX idx_orders_service_kind (service_kind);

-- ==========================================================
-- DONE.
-- Kiem tra: SHOW COLUMNS FROM orders LIKE 'service_kind';
-- ==========================================================
