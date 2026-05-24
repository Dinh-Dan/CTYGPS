-- Migration 078: Bảng yêu cầu KTV trả kho — cần admin duyệt trước khi nhập kho
-- Chạy 1 lần trên DB hiện tại (đã bao gồm trong _full_install.sql cho DB mới)

USE gpsviet;

CREATE TABLE IF NOT EXISTS stock_return_requests (
  id                   INT          AUTO_INCREMENT PRIMARY KEY,
  staff_id             INT          NOT NULL,
  product_id           INT          NOT NULL,
  qty                  INT          NOT NULL,
  note                 VARCHAR(300) NULL,
  status               ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  created_at           DATETIME     NOT NULL DEFAULT NOW(),
  reviewed_by_staff_id INT          NULL,
  reviewed_at          DATETIME     NULL,
  reject_reason        VARCHAR(300) NULL,
  receipt_id           INT          NULL,
  INDEX idx_srr_staff  (staff_id),
  INDEX idx_srr_status (status)
);
