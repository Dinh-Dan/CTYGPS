-- migration_066: them workflow duyet phieu ung luong
-- Nhan vien / KTV tu gui yeu cau (status=pending), admin duyet/tu choi
-- Admin tao thang → tu dong approved

ALTER TABLE staff_advances
  ADD COLUMN status       ENUM('pending','approved','rejected') NOT NULL DEFAULT 'approved' AFTER note,
  ADD COLUMN approved_by  INT NULL AFTER status,
  ADD COLUMN approved_at  DATETIME NULL AFTER approved_by,
  ADD COLUMN reject_reason VARCHAR(300) NULL AFTER approved_at,
  ADD INDEX idx_sa_status (status),
  ADD CONSTRAINT fk_sa_approved_by FOREIGN KEY (approved_by) REFERENCES staff(id);

-- Record cu (admin tao truc tiep) giu nguyen DEFAULT 'approved', khong can update
