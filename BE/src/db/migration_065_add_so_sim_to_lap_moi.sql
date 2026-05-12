USE gpsviet;

-- Them field 'So SIM' vao template Lap moi (id=1)
-- 4 truong mac dinh: Bien so xe, IMEI, Ten tai khoan, So SIM

INSERT INTO order_template_fields (template_id, seq, label, field_type, is_required, placeholder)
VALUES (1, 4, 'So SIM', 'text', 0, NULL);
