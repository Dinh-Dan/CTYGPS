-- Mig 058: Hoa hong KTV theo don.
-- Tach biet voi wage_amount (cong lap). Hoa hong phai admin duyet moi tinh.
-- Khi tong ket luong KTV, hoa hong da duyet duoc cong them vao wage cua ky.

ALTER TABLE orders
  ADD COLUMN tech_commission_amount       BIGINT   NOT NULL DEFAULT 0     AFTER wage_amount,
  ADD COLUMN tech_commission_approved_at  DATETIME NULL                   AFTER tech_commission_amount,
  ADD COLUMN tech_commission_approved_by  INT      NULL                   AFTER tech_commission_approved_at,
  ADD COLUMN tech_commission_note         VARCHAR(300) NULL               AFTER tech_commission_approved_by;
