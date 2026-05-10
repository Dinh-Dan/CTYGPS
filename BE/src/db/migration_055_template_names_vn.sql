-- ==========================================================
-- Migration 055 — Doi ten loai cong viec + field sang
-- tieng Viet co dau.
-- ----------------------------------------------------------
-- Mig 053 seed khong dau ("Lap moi", "Thay cam"...). Gio doi
-- sang tieng Viet co dau de hien thi dep.
-- ==========================================================

USE gpsviet;

-- 1. Ten + mo ta 5 loai
UPDATE order_templates SET name = 'Lắp mới',     description = 'Lắp đặt thiết bị GPS mới'  WHERE id = 1;
UPDATE order_templates SET name = 'Gia hạn',     description = 'Gia hạn gói cước dịch vụ'  WHERE id = 2;
UPDATE order_templates SET name = 'Thay SIM',    description = 'Thay SIM cho thiết bị'      WHERE id = 3;
UPDATE order_templates SET name = 'Thay camera', description = 'Thay camera giám sát'       WHERE id = 4;
UPDATE order_templates SET name = 'Phù hiệu',    description = 'Làm phù hiệu xe'            WHERE id = 5;

-- 2. Label + placeholder cac field
-- Lap moi
UPDATE order_template_fields SET label = 'Biển số xe',   placeholder = 'VD: 29A-12345'             WHERE template_id = 1 AND seq = 1;
UPDATE order_template_fields SET label = 'IMEI'                                                    WHERE template_id = 1 AND seq = 2;
UPDATE order_template_fields SET label = 'Địa chỉ lắp',  placeholder = 'Địa chỉ lắp đặt thực tế'  WHERE template_id = 1 AND seq = 3;

-- Gia han
UPDATE order_template_fields SET label = 'Biển số xe'                                              WHERE template_id = 2 AND seq = 1;
UPDATE order_template_fields SET label = 'IMEI'                                                    WHERE template_id = 2 AND seq = 2;
UPDATE order_template_fields SET label = 'Số năm',       placeholder = 'VD: 1, 2, 3'              WHERE template_id = 2 AND seq = 3;

-- Thay SIM
UPDATE order_template_fields SET label = 'Biển số xe'                                              WHERE template_id = 3 AND seq = 1;
UPDATE order_template_fields SET label = 'IMEI'                                                    WHERE template_id = 3 AND seq = 2;
UPDATE order_template_fields SET label = 'Số SIM mới'                                              WHERE template_id = 3 AND seq = 3;

-- Thay camera
UPDATE order_template_fields SET label = 'Biển số xe'                                              WHERE template_id = 4 AND seq = 1;
UPDATE order_template_fields SET label = 'IMEI'                                                    WHERE template_id = 4 AND seq = 2;

-- Phu hieu
UPDATE order_template_fields SET label = 'Biển số xe'                                              WHERE template_id = 5 AND seq = 1;
UPDATE order_template_fields SET label = 'Loại phù hiệu', placeholder = 'VD: kinh doanh vận tải...' WHERE template_id = 5 AND seq = 2;

-- ==========================================================
-- DONE. Kiem tra:
--   SELECT id, name, description FROM order_templates ORDER BY id;
--   SELECT template_id, seq, label, placeholder FROM order_template_fields ORDER BY template_id, seq;
-- ==========================================================
