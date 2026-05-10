-- Rolling balance cho KTV (giong customers.opening_balance)
-- Cho phep admin duyet nop tien KTV theo N tien, phan thieu/du gối sang ky sau.

ALTER TABLE `staff`
  ADD COLUMN `opening_balance` bigint(20) NOT NULL DEFAULT 0 AFTER `rating`;

-- Snapshot tong KTV phai nop tai thoi diem duyet (= opening_balance + sum collections)
-- va so tien KTV thuc nop. amount giu nguyen nghia "so KTV nop", them remaining = total - amount.
ALTER TABLE `remittances`
  ADD COLUMN `total_holding` bigint(20) NOT NULL DEFAULT 0 AFTER `amount`,
  ADD COLUMN `remaining` bigint(20) NOT NULL DEFAULT 0 AFTER `total_holding`;
