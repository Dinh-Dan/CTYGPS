-- ==========================================================
-- Migration 007 — Phu hieu xe (badges)
-- Chay 1 lan sau migration_006_orders_extension.sql
-- ----------------------------------------------------------
-- Phu hieu xe = giay phep cho xe kinh doanh van tai (Nghi dinh 10).
-- Quy trinh:
--   pending_review (KH/dealer/admin tao) -> submitted (admin nop So GTVT)
--     -> approved | rejected -> delivered (giao tan noi) | cancelled
-- ==========================================================

USE gpsviet;

CREATE TABLE IF NOT EXISTS badges (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  code          VARCHAR(30)  NOT NULL UNIQUE,           -- PH-DDMM-NNN
  customer_id   INT          NOT NULL,
  dealer_id     INT          NULL,                       -- neu dealer dat ho

  vehicle_plate VARCHAR(30)  NOT NULL,
  vehicle_type  ENUM('truck_under_3.5t','truck_over_3.5t','passenger','contract','taxi','other')
                NOT NULL DEFAULT 'truck_under_3.5t',

  status        ENUM('pending_review','submitted','approved','rejected','delivered','cancelled')
                NOT NULL DEFAULT 'pending_review',
  fee_amount    BIGINT       NOT NULL DEFAULT 0,
  paid_amount   BIGINT       NOT NULL DEFAULT 0,

  submitted_at  DATETIME     NULL,
  result_at     DATETIME     NULL,
  delivered_at  DATETIME     NULL,
  reject_reason VARCHAR(500) NULL,

  note          TEXT         NULL,
  creator_type  ENUM('customer','dealer','admin','staff') NOT NULL DEFAULT 'admin',
  creator_id    INT          NULL,

  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_badge_customer
    FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_badge_dealer
    FOREIGN KEY (dealer_id) REFERENCES customers(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_badge_status   (status),
  INDEX idx_badge_customer (customer_id),
  INDEX idx_badge_dealer   (dealer_id),
  INDEX idx_badge_plate    (vehicle_plate),
  INDEX idx_badge_deleted  (is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Anh ho so (dang ki xe, cccd, ho so)
CREATE TABLE IF NOT EXISTS badge_attachments (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  badge_id    INT          NOT NULL,
  url         VARCHAR(500) NOT NULL,
  caption     VARCHAR(255) NULL,
  kind        ENUM('vehicle_reg','cccd','license','other') NOT NULL DEFAULT 'other',
  uploaded_at TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT fk_battach_badge FOREIGN KEY (badge_id) REFERENCES badges(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_battach_badge (badge_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW TABLES LIKE 'badge%';
-- ==========================================================
