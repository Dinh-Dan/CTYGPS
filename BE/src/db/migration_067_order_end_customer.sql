-- ==========================================================
-- Migration 067 — end_customer_id tren don hang
-- ----------------------------------------------------------
-- Khi don hang thuoc dai ly (customer_id = dealer),
-- co the co them 1 khach le (end_customer) gan kem.
-- KTV sau khi xong don co the cap nhat thong tin cho
-- chinh dai ly HOAC khach le nay.
-- ==========================================================

USE gpsviet;

ALTER TABLE orders
  ADD COLUMN end_customer_id INT NULL DEFAULT NULL
    COMMENT 'Khach hang dau cuoi cua dai ly (retail). NULL = chinh dai ly hoac khach le thong thuong';

ALTER TABLE orders
  ADD CONSTRAINT fk_orders_end_customer
    FOREIGN KEY (end_customer_id)
    REFERENCES customers(id)
    ON DELETE SET NULL
    ON UPDATE CASCADE;

CREATE INDEX idx_orders_end_customer ON orders(end_customer_id);

-- ==========================================================
-- DONE.
-- ==========================================================
