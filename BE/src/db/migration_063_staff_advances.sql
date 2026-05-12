-- Migration 063: Phieu ung truoc luong nhan vien + audit unfinalize payroll

USE gpsviet;

-- Them audit trail vao staff_payroll_periods khi bo tat toan
ALTER TABLE staff_payroll_periods
  ADD COLUMN unfinalized_at DATETIME NULL AFTER finalized_by,
  ADD COLUMN unfinalized_by INT NULL   AFTER unfinalized_at;

-- Bang phieu ung truoc luong nhan vien
-- Moi phieu ung gan vao 1 ky luong (period). Khi finalize ky, set carried_at.
-- Khi unfinalize ky, go carried_at de phieu ung quay lai hien thi.
CREATE TABLE IF NOT EXISTS staff_advances (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  staff_id    INT     NOT NULL,
  period      CHAR(7) NOT NULL,             -- 'YYYY-MM' ky luong gan voi
  amount      BIGINT  NOT NULL,
  note        VARCHAR(300) NOT NULL DEFAULT '',
  created_by  INT NULL,
  created_at  DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  carried_at  DATETIME NULL,               -- set khi finalize ky luong
  is_deleted  TINYINT(1) NOT NULL DEFAULT 0,
  CONSTRAINT fk_sa_staff      FOREIGN KEY (staff_id)   REFERENCES staff(id),
  CONSTRAINT fk_sa_created_by FOREIGN KEY (created_by) REFERENCES staff(id),
  INDEX idx_sa_staff_period (staff_id, period),
  INDEX idx_sa_carried      (carried_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
