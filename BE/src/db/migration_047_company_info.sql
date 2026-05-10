-- ==========================================================
-- Migration 047 — Cap nhat thong tin cong ty (bank.*) vao app_settings
-- ----------------------------------------------------------
-- Cap nhat thong tin ngan hang cong ty hien thi tren bill phieu
-- tat toan + QR thanh toan:
--   - Ten ngan hang : Vietcombank CN Tan Binh
--   - So tai khoan  : 0441000758342
--   - Chu tai khoan : CONG TY TNHH VIEN THONG VINAGPS
-- Neu key chua ton tai (cai dat moi) thi insert; neu da co thi update.
-- ==========================================================

INSERT INTO app_settings (`key`, `value`)
VALUES
  ('bank.bank_name',    'Vietcombank CN Tân Bình'),
  ('bank.account_no',   '0441000758342'),
  ('bank.account_name', 'CÔNG TY TNHH VIỄN THÔNG VINAGPS')
ON DUPLICATE KEY UPDATE
  `value` = VALUES(`value`);
