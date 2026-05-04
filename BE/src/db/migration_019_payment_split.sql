-- ==========================================================
-- Migration 019 — Tach bach 3 nguon thu + 3 status no
-- Chay 1 lan sau migration_018_badge_orders.sql
-- ----------------------------------------------------------
-- Muc tieu: ke toan KHONG lech dong nao.
--
-- 1. Khi KTV bam hoan thanh, tien tu khach co the chia thanh 3 phan:
--      a) Tra KTV (cash/transfer)        -> tao collections (KTV no cong ty)
--      b) Tra admin truc tiep            -> tao order_payments source='admin_pending', confirmed=0
--                                          (paid_amount KHONG cong, doi admin xac nhan)
--      c) Khach con no                   -> khong tao gi, suy ra tu (total - paid - unremitted - admin_pending)
--    Tong 3 phan PHAI = phan task dam nhiem (mac dinh = remaining cua don luc complete).
--
-- 2. Status don sau khi tat ca task done (uu tien tu cao xuong):
--      - customer_owes        : khach con no  (effective < total)
--      - pending_admin_confirm: admin con tien chua bam mark-paid (admin_pending > 0, khong con khach no)
--      - staff_owes           : KTV con giu tien chua nop  (unremitted > 0, khong con admin pending va khach no)
--      - done                 : paid >= total VA khong con unremitted/admin_pending
--
-- 3. Bao cao no:
--      /reports/customer-debts        : khach no
--      /reports/staff-debts           : KTV giu tien
--      /reports/admin-pending-debts   : (MOI) admin con phai xac nhan
--    Tat ca deu them filter ?from=&to=.
--
-- LUU Y: ALTER khong dung IF NOT EXISTS — neu chay lai bao "Duplicate column"
--        nghia la da chay roi -> bo qua loi do.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- 1. Mo rong orders.status: them 3 status no
-- ----------------------------------------------------------
ALTER TABLE orders
  MODIFY COLUMN status ENUM(
    'pending_review','new','assigned','warehouse_released',
    'in_progress','done','cancelled',
    'customer_owes','pending_admin_confirm','staff_owes'
  ) NOT NULL DEFAULT 'new';

-- ----------------------------------------------------------
-- 2. Mo rong order_payments
--    - source them 'admin_pending' (khach bao da tra admin, doi xac nhan)
--    - confirmed: 0 = chua xac nhan (khong cong vao paid_amount), 1 = da xac nhan
--    - confirmed_by/confirmed_at: ai admin xac nhan, khi nao
-- ----------------------------------------------------------
ALTER TABLE order_payments
  MODIFY COLUMN source ENUM(
    'staff_collection','admin_mark_paid','customer_self_pay','admin_pending'
  ) NOT NULL,
  ADD COLUMN confirmed    TINYINT(1) NOT NULL DEFAULT 1 AFTER source,
  ADD COLUMN confirmed_at DATETIME   NULL                AFTER confirmed,
  ADD COLUMN confirmed_by INT        NULL                AFTER confirmed_at,
  ADD COLUMN task_id      INT        NULL                AFTER collection_id,
  ADD INDEX idx_payment_pending (order_id, source, confirmed),
  ADD INDEX idx_payment_task    (task_id);

-- Backfill: cac payment cu deu coi nhu da confirmed
UPDATE order_payments SET confirmed = 1 WHERE confirmed IS NULL;
