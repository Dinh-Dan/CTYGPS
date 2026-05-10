-- Migration 040: Bang luong KTV theo ky (thang)
-- Snapshot phieu luong khi tat toan thang. Cac so Co ban / BHXH / Ung / Phu cap
-- nhap tay tren UI, KHONG luu cau hinh truoc. Khi finalize:
--   - Sinh 1 ban ghi staff_payroll_periods + snapshot rows_json
--   - Danh debt_carried_at = now() cho tat ca orders cua KTV trong ky chua ket
-- Unfinalize: xoa mem ban ghi + go debt_carried_at cua dung cac don thuoc snapshot.
--
-- rows_json:    [{order_id, code, completed_at, vehicle_plate, service_kind, revenue, wage, payment_note}]
-- extras_json:  [{note, amount}]   <- phu cap tay (phi di chuyen, thuong, phat...)

USE gpsviet;

CREATE TABLE IF NOT EXISTS staff_payroll_periods (
  id                 INT AUTO_INCREMENT PRIMARY KEY,
  staff_id           INT NOT NULL,
  period             CHAR(7) NOT NULL,                    -- 'YYYY-MM'
  base_salary        BIGINT NOT NULL DEFAULT 0,
  insurance_amount   BIGINT NOT NULL DEFAULT 0,
  advance_amount     BIGINT NOT NULL DEFAULT 0,
  extras_json        JSON NULL,
  rows_json          JSON NULL,
  total_revenue      BIGINT NOT NULL DEFAULT 0,
  total_wage         BIGINT NOT NULL DEFAULT 0,
  total_extras       BIGINT NOT NULL DEFAULT 0,
  final_amount       BIGINT NOT NULL DEFAULT 0,
  note               VARCHAR(500) NULL,
  finalized_at       DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  finalized_by       INT NULL,
  is_deleted         TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_spp_staff
    FOREIGN KEY (staff_id) REFERENCES staff(id)
    ON DELETE RESTRICT ON UPDATE CASCADE,
  CONSTRAINT fk_spp_finalizer
    FOREIGN KEY (finalized_by) REFERENCES staff(id)
    ON DELETE SET NULL ON UPDATE CASCADE,
  INDEX idx_spp_staff_period (staff_id, period),
  INDEX idx_spp_period       (period)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Khong dat UNIQUE cung tren (staff_id, period) vi muon cho phep nhieu ban ghi
-- da xoa mem (unfinalize -> finalize lai). Logic kiem tra "da chot chua" se loc
-- where is_deleted = 0 trong code.
