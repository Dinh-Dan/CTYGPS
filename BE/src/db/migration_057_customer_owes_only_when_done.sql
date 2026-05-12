-- Mig 057: Fix payment_status — chi don status='done' moi duoc tag 'customer_owes'.
-- Truoc day don confirmed/in_progress thieu tien cung bi danh 'customer_owes',
-- gay nham lan: badge "KH no" do ruc o trang don, nhung module cong no chi tinh don 'done'.
-- Backfill: cac don non-done dang 'customer_owes' -> tinh lai (unpaid/partial/paid).

UPDATE orders
SET payment_status = CASE
    WHEN paid_amount <= 0                    THEN 'unpaid'
    WHEN paid_amount >= total_amount         THEN 'paid'
    ELSE 'partial'
  END
WHERE is_deleted = 0
  AND status != 'done'
  AND payment_status = 'customer_owes';
