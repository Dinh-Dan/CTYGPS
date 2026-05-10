-- ==========================================================
-- Migration 053 — Co dinh 5 loai cong viec
-- ----------------------------------------------------------
-- Bo tinh nang admin tu tao loai don. Reset toan bo
-- order_templates + order_template_fields, seed cung 5 loai:
--   1. Lap moi   (id 1)
--   2. Gia han   (id 2)
--   3. Thay sim  (id 3)
--   4. Thay cam  (id 4)
--   5. Phu hieu  (id 5)
--
-- Truoc khi chay: don da tham chieu order_lines.template_id
-- (mig 052 da xoa sach orders cu) — cho nen reset OK.
-- ==========================================================

USE gpsviet;

SET FOREIGN_KEY_CHECKS = 0;

-- 1. Reset du lieu lien quan
DELETE FROM order_field_values;
DELETE FROM order_template_fields;
DELETE FROM order_lines;          -- de tranh FK toi templates
DELETE FROM order_templates;

-- 2. Seed 5 loai cong viec co dinh
INSERT INTO order_templates (id, name, description, is_public, sort_order, is_deleted) VALUES
  (1, 'Lap moi',  'Lap dat thiet bi GPS moi',     1, 1, 0),
  (2, 'Gia han',  'Gia han goi cuoc dich vu',     1, 2, 0),
  (3, 'Thay sim', 'Thay sim cho thiet bi',         1, 3, 0),
  (4, 'Thay cam', 'Thay camera giam sat',          1, 4, 0),
  (5, 'Phu hieu', 'Lam phu hieu xe',               1, 5, 0);

ALTER TABLE order_templates AUTO_INCREMENT = 6;

-- 3. Seed fields cho moi loai
INSERT INTO order_template_fields (template_id, seq, label, field_type, is_required, placeholder) VALUES
  -- Lap moi
  (1, 1, 'Bien so xe', 'text',     1, 'VD: 29A-12345'),
  (1, 2, 'IMEI',       'text',     0, NULL),
  (1, 3, 'Dia chi lap','textarea', 0, 'Dia chi lap dat thuc te'),

  -- Gia han
  (2, 1, 'Bien so xe', 'text',     1, NULL),
  (2, 2, 'IMEI',       'text',     1, NULL),
  (2, 3, 'So nam',     'number',   1, 'VD: 1, 2, 3'),

  -- Thay sim
  (3, 1, 'Bien so xe', 'text',     1, NULL),
  (3, 2, 'IMEI',       'text',     1, NULL),
  (3, 3, 'So sim moi', 'text',     1, NULL),

  -- Thay cam
  (4, 1, 'Bien so xe', 'text',     1, NULL),
  (4, 2, 'IMEI',       'text',     1, NULL),

  -- Phu hieu
  (5, 1, 'Bien so xe',     'text', 1, NULL),
  (5, 2, 'Loai phu hieu',  'text', 0, 'VD: kinh doanh van tai...');

SET FOREIGN_KEY_CHECKS = 1;

-- ==========================================================
-- DONE.
-- Kiem tra:
--   SELECT * FROM order_templates;
--   SELECT template_id, label, field_type, is_required FROM order_template_fields ORDER BY template_id, seq;
-- ==========================================================
