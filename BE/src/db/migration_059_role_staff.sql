-- Mig 059: Them role 'staff' (nhan vien) vao ENUM cua staff.role.
-- 'staff' co quyen co ban (tao don, sua khach, xem du lieu) nhung KHONG
-- duoc duyet thanh toan, tat toan no, finalize luong, CRUD nhan vien,
-- sua opening_balance khach, sua gia tier rieng, ghi app_settings.
-- Gate o BE/src/middleware/auth.js (requireRole) — admin.js cha cho phep
-- ca 'admin' va 'staff', tung route nhay cam them requireRole('admin').

ALTER TABLE staff
  MODIFY COLUMN role ENUM('admin','kithuat','staff') NOT NULL DEFAULT 'kithuat';
