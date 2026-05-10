-- Migration 051: drop orders.area (xoa truong "Khu vuc" khoi don hang)
-- Truoc khi chay: BACKUP truoc.

ALTER TABLE orders DROP INDEX idx_orders_area;
ALTER TABLE orders DROP COLUMN area;
