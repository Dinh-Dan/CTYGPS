-- ==========================================================
-- Migration 041 — Thu ho dai ly (agency_collections)
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Boi canh: cong ty thu tien tu khach le ho dai ly. Khoan nay
-- khi tat toan voi dai ly se TRU vao tong no dai ly phai tra.
-- Trong so excel cu, day la dong "Thu ho" am trong cot thanh tien.
--
-- Mo hinh:
--   - Moi phieu thu ho: dealer_id (bat buoc) + retail_customer_id
--     (khach nguon, optional) + amount + source ('admin'|'staff').
--   - source='admin': admin truc tiep nhan tien -> handed_over=1 ngay.
--   - source='staff': KTV cam ve -> handed_over=0, admin xac nhan
--     khi KTV nop tien -> handed_over=1.
--   - Khi dai ly tat toan cong no: gan debt_settlement_id cho cac
--     phieu chua ket -> chung khong con tinh vao no nua.
-- ==========================================================

USE gpsviet;

CREATE TABLE IF NOT EXISTS agency_collections (
  id                  INT          AUTO_INCREMENT PRIMARY KEY,
  code                VARCHAR(30)  NOT NULL UNIQUE,           -- TH-DDMM-NNN
  dealer_id           INT          NOT NULL,                  -- customers.id (type='dealer')
  retail_customer_id  INT          NULL,                      -- customers.id khach nguon (optional)
  amount              BIGINT       NOT NULL,                  -- > 0
  source              ENUM('admin','staff') NOT NULL,
  staff_id            INT          NULL,                      -- KTV cam (chi khi source='staff')
  handed_over         TINYINT(1)   NOT NULL DEFAULT 0,        -- KTV da nop ve admin
  handed_over_at      DATETIME     NULL,
  method              ENUM('cash','transfer') NOT NULL DEFAULT 'cash',
  note                VARCHAR(500) NULL,
  receipt_url         VARCHAR(500) NULL,                      -- anh imgbb
  collected_at        DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  debt_settlement_id  INT          NULL,                      -- gan khi dai ly tat toan
  created_by          INT          NULL,                      -- staff.id admin tao
  is_deleted          TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_agcol_dealer   FOREIGN KEY (dealer_id)          REFERENCES customers(id),
  CONSTRAINT fk_agcol_retail   FOREIGN KEY (retail_customer_id) REFERENCES customers(id),
  CONSTRAINT fk_agcol_staff    FOREIGN KEY (staff_id)           REFERENCES staff(id),
  CONSTRAINT fk_agcol_settle   FOREIGN KEY (debt_settlement_id) REFERENCES debt_settlements(id),
  INDEX idx_agcol_dealer (dealer_id, debt_settlement_id, is_deleted),
  INDEX idx_agcol_staff  (staff_id, handed_over, is_deleted),
  INDEX idx_agcol_collected_at (collected_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   DESC agency_collections;
-- ==========================================================
