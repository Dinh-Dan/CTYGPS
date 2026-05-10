-- ==========================================================
-- Migration 048 — Tai san phu cua khach hang (account / bien so / sim)
-- ----------------------------------------------------------
-- Moi khach (customers.id) co:
--   - nhieu tai khoan (chi 1 truong: ten tai khoan, do tai khoan o he khac)
--   - nhieu bien so xe
--   - nhieu so sim
-- Co bang customer_update_requests cho luong:
--   KTV de xuat -> admin duyet -> apply.
-- Admin va khach (chu so huu) thi update truc tiep, khong qua duyet.
-- ==========================================================

USE gpsviet;

CREATE TABLE IF NOT EXISTS customer_accounts (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  customer_id     INT          NOT NULL,
  account_name    VARCHAR(255) NOT NULL,
  note            VARCHAR(500) NULL,
  is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_ca_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_ca_customer (customer_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_vehicles (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  customer_id     INT          NOT NULL,
  plate           VARCHAR(30)  NOT NULL,
  note            VARCHAR(500) NULL,
  is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_cv_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_cv_customer (customer_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS customer_sims (
  id              INT AUTO_INCREMENT PRIMARY KEY,
  customer_id     INT          NOT NULL,
  sim_number      VARCHAR(30)  NOT NULL,
  note            VARCHAR(500) NULL,
  is_deleted      TINYINT(1)   NOT NULL DEFAULT 0,
  CONSTRAINT fk_cs_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  INDEX idx_cs_customer (customer_id, is_deleted)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- customer_update_requests — de xuat tu KTV cho admin duyet
-- ----------------------------------------------------------
-- action='add'    : target_id=NULL, value=du lieu de them
-- action='update' : target_id=id row, value=du lieu moi
-- action='delete' : target_id=id row, value=NULL
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS customer_update_requests (
  id                INT AUTO_INCREMENT PRIMARY KEY,
  customer_id       INT          NOT NULL,
  asset_kind        ENUM('account','vehicle','sim') NOT NULL,
  action            ENUM('add','update','delete')   NOT NULL,
  target_id         INT          NULL,
  value             VARCHAR(255) NULL,
  note              VARCHAR(500) NULL,

  requested_by_role ENUM('admin','kithuat','customer','daily') NOT NULL,
  requested_by_id   INT          NULL,
  ref_order_id      INT          NULL,

  status            ENUM('pending','approved','rejected') NOT NULL DEFAULT 'pending',
  reviewed_by       INT          NULL,
  reviewed_at       TIMESTAMP    NULL,
  review_note       VARCHAR(500) NULL,

  is_deleted        TINYINT(1)   NOT NULL DEFAULT 0,

  CONSTRAINT fk_cur_customer FOREIGN KEY (customer_id) REFERENCES customers(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_cur_order    FOREIGN KEY (ref_order_id) REFERENCES orders(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_cur_customer (customer_id),
  INDEX idx_cur_status   (status, is_deleted),
  INDEX idx_cur_kind     (asset_kind, status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ==========================================================
-- DONE.
-- ==========================================================
