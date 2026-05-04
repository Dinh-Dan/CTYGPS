-- ==========================================================
-- Migration 007 — San pham: timeline blocks + thong so 2 nhom
-- Chay 1 lan trong phpMyAdmin (database gpsviet)
-- ----------------------------------------------------------
-- Neu chay lai bi loi "Duplicate column" cho product_attributes.position
-- thi nghia la da chay roi -> bo qua.
-- ==========================================================

USE gpsviet;

-- ----------------------------------------------------------
-- Bang: product_blocks — timeline noi dung (text/image/video)
-- Hien thi tren trang khach lan luot theo sort_order:
--   [thumb chinh + gia + thong so TOP]
--   -> blocks (text/image/video xen ke)
--   -> [thong so BOTTOM]
-- ----------------------------------------------------------
CREATE TABLE IF NOT EXISTS product_blocks (
  id          INT AUTO_INCREMENT PRIMARY KEY,
  product_id  INT NOT NULL,
  block_type  ENUM('text','image','video') NOT NULL,
  content     TEXT NULL,                              -- text body HOAC url image/video
  caption     VARCHAR(500) NULL,                       -- chu thich anh/video (tuy chon)
  sort_order  INT NOT NULL DEFAULT 0,

  CONSTRAINT fk_block_product
    FOREIGN KEY (product_id) REFERENCES products(id)
    ON DELETE CASCADE ON UPDATE CASCADE,

  INDEX idx_block_product (product_id),
  INDEX idx_block_sort    (product_id, sort_order)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ----------------------------------------------------------
-- product_attributes: them cot position ('top'|'bottom')
--   top    = thong so co ban (hien tren cung trang)
--   bottom = thong so chi tiet (hien duoi cung)
-- ----------------------------------------------------------
ALTER TABLE product_attributes
  ADD COLUMN position ENUM('top','bottom') NOT NULL DEFAULT 'top';

-- ----------------------------------------------------------
-- Du lieu mau cho VT-01 (id=1) — neu da xoa thi bo qua
-- ----------------------------------------------------------
INSERT IGNORE INTO product_blocks (product_id, block_type, content, caption, sort_order) VALUES
  (1, 'text',  'VT-01 la thiet bi dinh vi xe may nho gon, lap dat trong 15 phut, phu hop voi xe so/xe ga.', NULL, 1),
  (1, 'image', '/uploads/products/sample-vt01-1.jpg', 'Mat truoc thiet bi VT-01', 2),
  (1, 'text',  'Pin du phong 800mAh, hoat dong toi 24h khi mat nguon. Chong nuoc IP67 — di mua khong sao.', NULL, 3);

-- Phan loai thong so co san: dat 2 thuoc tinh dau la "top", thuoc tinh sau la "bottom"
-- (chi anh huong VT-01 da seed truoc do)
UPDATE product_attributes SET position = 'top'    WHERE product_id = 1 AND label IN ('Nguon', 'Pin');
UPDATE product_attributes SET position = 'bottom' WHERE product_id = 1 AND label = 'Cong dau ra';

-- ==========================================================
-- DONE.
-- ==========================================================
