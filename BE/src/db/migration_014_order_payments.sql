-- ----------------------------------------------------------
-- Migration 014: bang order_payments
-- Lo log moi giao dich thanh toan (KTV thu / admin mark-paid / customer self pay)
-- de bao cao doanh thu chinh xac theo ngay THU TIEN, khong phai ngay confirm don.
--
-- Truoc day:
--   - orders.paid_amount tang khi:
--       a) KTV complete voi customer_paid_to='staff' -> INSERT collections
--       b) Admin mark-paid -> chi tang paid_amount, KHONG co log
--   - reports.js /revenue group theo orders.confirmed_at -> sai ngay
--   - Khong tach duoc thu cua KTV vs thu cua admin
--
-- Sau migration nay:
--   - Moi nguon thu deu INSERT 1 row vao order_payments(paid_at)
--   - reports doc tu day GROUP BY DATE(paid_at)
-- ----------------------------------------------------------

CREATE TABLE IF NOT EXISTS order_payments (
  id            INT AUTO_INCREMENT PRIMARY KEY,
  order_id      INT          NOT NULL,
  amount        BIGINT       NOT NULL,
  source        ENUM('staff_collection','admin_mark_paid','customer_self_pay') NOT NULL,
  collection_id INT          NULL,                  -- ref khi source='staff_collection'
  staff_id      INT          NULL,                  -- KTV thu hoac admin xac nhan
  paid_at       DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  note          TEXT         NULL,
  is_deleted    TINYINT      NOT NULL DEFAULT 0,

  CONSTRAINT chk_payment_amount CHECK (amount >= 0),
  CONSTRAINT fk_payment_order
    FOREIGN KEY (order_id) REFERENCES orders(id)
    ON DELETE CASCADE ON UPDATE CASCADE,
  CONSTRAINT fk_payment_collection
    FOREIGN KEY (collection_id) REFERENCES collections(id)
    ON DELETE SET NULL ON UPDATE CASCADE,

  INDEX idx_payment_order   (order_id),
  INDEX idx_payment_paid_at (paid_at),
  INDEX idx_payment_source  (source),
  INDEX idx_payment_active  (is_deleted, paid_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- Backfill 1: tu collections (KTV staff path)
-- ----------------------------------------------------------
INSERT INTO order_payments (order_id, amount, source, collection_id, staff_id, paid_at)
SELECT t.order_id, c.amount, 'staff_collection', c.id, c.staff_id, c.collected_at
  FROM collections c
  JOIN tasks t ON t.id = c.task_id
 WHERE c.is_deleted = 0;

-- ----------------------------------------------------------
-- Backfill 2: phan paid_amount con lai (sau khi tru collections)
-- gia dinh la admin mark-paid. Khong co log nen lay paid_at = confirmed_at.
-- Day la xap xi cho data cu; data moi se co log chinh xac.
-- ----------------------------------------------------------
INSERT INTO order_payments (order_id, amount, source, paid_at, note)
SELECT
  o.id,
  GREATEST(0, o.paid_amount - COALESCE(SUM(c.amount), 0)),
  'admin_mark_paid',
  COALESCE(o.confirmed_at, o.id), -- fallback dat tam
  'Backfill: paid_amount cao hon tong collections, gia dinh la mark-paid'
FROM orders o
LEFT JOIN tasks t      ON t.order_id = o.id AND t.is_deleted = 0
LEFT JOIN collections c ON c.task_id = t.id AND c.is_deleted = 0
WHERE o.is_deleted = 0
GROUP BY o.id, o.paid_amount, o.confirmed_at
HAVING GREATEST(0, o.paid_amount - COALESCE(SUM(c.amount), 0)) > 0;

-- Kiem tra:
--   SELECT source, COUNT(*), SUM(amount) FROM order_payments WHERE is_deleted=0 GROUP BY source;
