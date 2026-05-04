-- ==========================================================
-- Migration 022 — Hoan tien (refund) + chuan hoa luong tra hang
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc tieu:
--   1. Cho phep ghi nhan hoan tien cho khach khi:
--        a) Khach quay dau tra hang sau khi don da done (order_return_done)
--        b) Don bi cancel sau khi khach da tra (collections da nop /
--           admin mark-paid). Truoc day chi ghi note '[REFUND_REQUIRED]'
--           → khong tracking duoc da hoan thuc su chua.
--   2. Bao cao doanh thu /revenue tu dong tru phan refund.
--
-- Sau migration nay:
--   - INSERT order_payments(source='refund', amount=so_tien_hoan, confirmed=1)
--     -> reports tu hieu, paid_amount cua don GIAM tuong ung.
--   - reason_code='order_return_done' van dung cho phieu nhap kho khi nhan
--     hang ve, KHONG dung cho ban thanh toan (ban thanh toan dung 'refund').
--
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- Mo rong source enum: them 'refund'
-- amount van >= 0 (so duong, GIAM paid_amount khi insert)
-- ----------------------------------------------------------
ALTER TABLE order_payments
  MODIFY COLUMN source ENUM(
    'staff_collection','admin_mark_paid','customer_self_pay','admin_pending','refund'
  ) NOT NULL;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM order_payments LIKE 'source';
-- ==========================================================
