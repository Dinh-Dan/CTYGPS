-- ==========================================================
-- Migration 079: bang staff_receipts
-- Muc dich:
--   - Nhan vien (staff) nhan tien tu khach hang truc tiep
--     -> tien duoc cong ngay vao paid_amount (order_payments source='staff_received')
--     -> luu them vao staff_receipts de admin doi soat cuoi ngay
--   - Admin vao trang doi soat, tick "Da kiem tra" tung dong
--     -> khong anh huong so lieu, chi danh dau reviewed=1
-- ==========================================================

-- 1. Mo rong ENUM order_payments.source them 'staff_received'
ALTER TABLE order_payments
  MODIFY COLUMN source ENUM(
    'staff_collection',
    'admin_mark_paid',
    'customer_self_pay',
    'admin_pending',
    'refund',
    'staff_received'
  ) NOT NULL;

-- 2. Tao bang staff_receipts
CREATE TABLE IF NOT EXISTS staff_receipts (
  id           INT          AUTO_INCREMENT PRIMARY KEY,
  code         VARCHAR(30)  NOT NULL UNIQUE,                -- NNT-DDMM-NNN
  order_id     INT          NULL,                           -- neu nhan tien tren don cu the
  request_id   INT          NULL,                           -- neu nhan tien qua phieu YC-
  customer_id  INT          NOT NULL,
  amount       BIGINT       NOT NULL,
  pay_method   ENUM('cash','transfer','mixed') NOT NULL DEFAULT 'cash',
  proof_urls   JSON         NULL,                           -- anh chung tu (imgbb)
  note         TEXT         NULL,
  staff_id     INT          NOT NULL,                       -- NV nhan tien
  reviewed     TINYINT(1)   NOT NULL DEFAULT 0,             -- admin da doi soat chua
  reviewed_by  INT          NULL,
  reviewed_at  DATETIME     NULL,
  created_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  is_deleted   TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_sr_order    FOREIGN KEY (order_id)    REFERENCES orders(id),
  CONSTRAINT fk_sr_request  FOREIGN KEY (request_id)  REFERENCES payment_requests(id),
  CONSTRAINT fk_sr_customer FOREIGN KEY (customer_id) REFERENCES customers(id),

  INDEX idx_sr_staff     (staff_id),
  INDEX idx_sr_order     (order_id),
  INDEX idx_sr_request   (request_id),
  INDEX idx_sr_reviewed  (reviewed, created_at),
  INDEX idx_sr_created   (created_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- Kiem tra:
--   SHOW COLUMNS FROM staff_receipts;
--   SHOW COLUMNS FROM order_payments LIKE 'source';
-- ==========================================================
