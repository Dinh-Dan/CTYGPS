-- Mig 060: Hoa hong nhan vien (role=staff) theo don hang.
-- Khac voi KTV (wage_amount tren orders), nhan vien co the nhieu nguoi/don,
-- moi nguoi mot khoan rieng do admin duyet.
-- Cuoi thang cong vao luong nhan vien.

CREATE TABLE IF NOT EXISTS order_staff_commissions (
  id            INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  order_id      INT          NOT NULL,
  staff_id      INT          NOT NULL,
  amount        BIGINT       NOT NULL DEFAULT 0,
  note          VARCHAR(300) NULL,
  approved_at   DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  approved_by   INT          NULL,
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  FOREIGN KEY (order_id) REFERENCES orders(id),
  FOREIGN KEY (staff_id) REFERENCES staff(id),
  INDEX idx_osc_order (order_id),
  INDEX idx_osc_staff (staff_id)
);
