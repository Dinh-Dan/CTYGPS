-- Them co "da chot luong" cho hoa hong nhan vien (role=staff).
-- Khi finalize bang luong: danh carried_at = NOW() cho cac dong commission da tinh.
-- Khi unfinalize: go carried_at = NULL.
-- Query luong: loc them AND sc.carried_at IS NULL de khong tinh lai.

ALTER TABLE order_staff_commissions
  ADD COLUMN carried_at DATETIME NULL AFTER approved_by;

CREATE INDEX idx_osc_carried ON order_staff_commissions (carried_at);
