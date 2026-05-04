-- Migration 024: gia rieng cho tung dai ly + san pham (override).
--
-- Priority resolve gia khi GET san pham:
--   1) customer_product_prices (override rieng cho customer + product)
--   2) product_prices via customers.default_tier_id (gia theo cap dai ly)
--   3) product_prices via price_tiers.is_default = 1 (fallback ban le)
--
-- Khach thuong (type='retail') khong co cap -> chi roi xuong buoc 3.
-- Hard delete khi admin xoa override (chi la config, khong can audit).
--
-- Idempotent.

CREATE TABLE IF NOT EXISTS customer_product_prices (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  customer_id INT NOT NULL,
  product_id  INT NOT NULL,
  price       DECIMAL(15,2) NOT NULL DEFAULT 0,
  UNIQUE KEY uniq_cust_prod (customer_id, product_id),
  CONSTRAINT fk_cpp_customer FOREIGN KEY (customer_id) REFERENCES customers(id) ON DELETE CASCADE,
  CONSTRAINT fk_cpp_product  FOREIGN KEY (product_id)  REFERENCES products(id)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
