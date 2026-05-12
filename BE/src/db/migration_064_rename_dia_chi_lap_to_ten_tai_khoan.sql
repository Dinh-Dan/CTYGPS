USE gpsviet;

-- Doi ten field 'Dia chi lap' -> 'Ten tai khoan' trong template Lap moi (id=1)
-- va cap nhat snapshot label trong cac order_field_values da luu.

UPDATE order_template_fields
   SET label       = 'Ten tai khoan',
       placeholder = 'Ten tai khoan GoTrack'
 WHERE template_id = 1
   AND label = 'Dia chi lap'
   AND is_deleted = 0;

UPDATE order_field_values
   SET label = 'Ten tai khoan'
 WHERE label = 'Dia chi lap'
   AND is_deleted = 0;
