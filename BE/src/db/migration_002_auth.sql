-- ==========================================================
-- Migration 002 — Auth & accounts
-- Chay file nay sau khi schema.sql da apply tu lan dau (tranh
-- mat data customers da nhap vao db).
-- ==========================================================

USE gpsviet;

-- Them cot password_hash cho customers (chi dealer su dung)
ALTER TABLE customers
  ADD COLUMN IF NOT EXISTS password_hash VARCHAR(255) NULL AFTER discount_rate;

-- Bang staff (admin, ky thuat)
CREATE TABLE IF NOT EXISTS staff (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  username      VARCHAR(50)  NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  full_name     VARCHAR(255) NOT NULL,
  role          ENUM('admin','kithuat') NOT NULL DEFAULT 'kithuat',
  phone         VARCHAR(20)  NULL,
  email         VARCHAR(150) NULL,
  avatar_url    VARCHAR(500) NULL,
  is_deleted    TINYINT(1)   NOT NULL DEFAULT 0,
  created_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    TIMESTAMP    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_staff_role (role)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
