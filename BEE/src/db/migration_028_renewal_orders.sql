-- ==========================================================
-- Migration 028 — Don gia han (renewal) — flow bao gia + link public
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Muc tieu:
--   - Khach tao don gia han (service_kind='renewal') -> admin tra GoTrack
--     -> bao gia tung dong xe -> sinh public_token -> gui link cho khach.
--   - Khach mo link public, bam Chap nhan + CK hoac Ghi no.
--   - Admin thuc hien gia han thu cong tren 5g roi danh dau hoan tat.
--
-- Thay doi:
--   1. orders.status: them 'quoted', 'awaiting_payment', 'payment_reported'
--   2. orders: them public_token (token public de khach mo link khong can login)
--   3. order_items: them 4 cot mo ta tung xe gia han
--      (NULL voi don install/maintenance/warranty hien tai — khong anh huong)
--
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- 1. Mo rong enum status: them 3 trang thai cho flow renewal
--    Giu nguyen toan bo enum cu de khong vo data hien co.
-- ----------------------------------------------------------
ALTER TABLE orders
  MODIFY COLUMN status ENUM(
    'pending_review','new','assigned','warehouse_released',
    'in_progress','done','cancelled',
    'customer_owes','pending_admin_confirm','staff_owes',
    'quoted','awaiting_payment','payment_reported'
  ) NOT NULL DEFAULT 'new';

-- ----------------------------------------------------------
-- 2. orders.public_token — token sinh khi admin bam "Bao gia"
--    URL: /customer/order-public.html?t=<public_token>
--    NULL voi don thuong (khong gia han) hoac chua bao gia.
-- ----------------------------------------------------------
ALTER TABLE orders
  ADD COLUMN public_token VARCHAR(64) NULL UNIQUE AFTER subscription_account;

-- ----------------------------------------------------------
-- 3. order_items: them 4 cot cho dong xe gia han
--    1 dong = 1 xe. qty luon = 1 voi renewal.
--    NULL voi item thuong.
-- ----------------------------------------------------------
ALTER TABLE order_items
  ADD COLUMN vehicle_plate        VARCHAR(30)  NULL AFTER unit_price,
  ADD COLUMN imei                 VARCHAR(100) NULL AFTER vehicle_plate,
  ADD COLUMN subscription_account VARCHAR(64)  NULL AFTER imei,
  ADD COLUMN years                TINYINT      NULL AFTER subscription_account;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SHOW COLUMNS FROM orders LIKE 'public_token';
--   SHOW COLUMNS FROM order_items LIKE 'vehicle_plate';
--   SHOW COLUMNS FROM order_items LIKE 'years';
-- ==========================================================
