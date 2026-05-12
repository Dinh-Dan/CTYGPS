-- Mig 061: Fix payment_status cho don da ket vao phieu rolling balance.
-- Logic cu: debt_carried_at IS NOT NULL -> luon gan 'paid', du con thieu tien.
-- Logic moi: neu paid_amount < total_amount thi giu 'customer_owes' de UI hien dung.
-- Don da ket van bi loai khoi cong no boi dieu kien debt_carried_at IS NULL (khong double-count).

UPDATE orders
SET payment_status = 'customer_owes'
WHERE is_deleted = 0
  AND debt_carried_at IS NOT NULL
  AND payment_status = 'paid'
  AND total_amount > 0
  AND paid_amount < total_amount;
