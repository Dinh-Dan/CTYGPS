# Hướng dẫn backup database `gpsviet` lên Google Drive

Áp dụng cho **Windows Server 2012 R2 + XAMPP (MariaDB/MySQL)**.

Quy trình: `mysqldump` → nén `.zip` → đẩy lên Google Drive bằng `rclone` → tự xóa bản cũ → Task Scheduler chạy hằng ngày.

---

## Bước 1 — Cài rclone (không cần cài đặt, chỉ là 1 file .exe)

1. Tải bản Windows tại: https://rclone.org/downloads/ (chọn **Windows - AMD64**).
2. Giải nén, copy `rclone.exe` vào thư mục `C:\rclone\`.

> Lưu ý: Google Drive for Desktop **không hỗ trợ** Windows Server 2012 R2 nữa, nên dùng rclone là cách ổn định nhất.

---

## Bước 2 — Kết nối rclone với Google Drive

Mở **PowerShell** (hoặc CMD) và chạy:

```
C:\rclone\rclone.exe config
```

Làm theo thứ tự:

1. `n` → tạo remote mới
2. Đặt tên remote: gõ **`gdrive`** (phải trùng với `RCLONE_REMOTE` trong script)
3. Storage: tìm số tương ứng **`drive`** (Google Drive)
4. `client_id` / `client_secret`: để trống (Enter) cũng được
5. Scope: chọn **`1`** (full access)
6. `root_folder_id`, `service_account_file`: để trống (Enter)
7. `Edit advanced config?` → **`n`**
8. `Use auto config?`:
   - Nếu máy có trình duyệt: chọn **`y`**, đăng nhập Google, cho phép quyền.
   - Nếu là server không có trình duyệt: chọn **`n`**, rclone sẽ in 1 lệnh — copy chạy trên máy tính cá nhân của bạn (có cài rclone) để lấy token rồi dán lại.
9. `Configure this as a Shared Drive?` → **`n`**
10. Xác nhận `y` → `q` để thoát.

Kiểm tra kết nối:

```
C:\rclone\rclone.exe lsd gdrive:
```

Nếu liệt kê được thư mục trên Drive là thành công.

---

## Bước 3 — Kiểm tra đường dẫn mysqldump

Script mặc định dùng `C:\xampp\mysql\bin\mysqldump.exe`. Nếu XAMPP cài chỗ khác, sửa biến `$MYSQLDUMP` trong `backup-db.ps1`.

Nếu database `root` của bạn **có mật khẩu**, điền vào biến `$DB_PASS` trong script.

---

## Bước 4 — Chạy thử

```
powershell -ExecutionPolicy Bypass -File C:\Users\WINDOWS\Desktop\CTYGPS\backup\backup-db.ps1
```

- Backup local lưu ở `C:\db-backups\`
- Log ở `C:\db-backups\backup.log`
- File `.zip` được đẩy lên Google Drive trong thư mục `backup-gpsviet`

---

## Bước 5 — Hẹn giờ chạy tự động hằng ngày (Task Scheduler)

Cách nhanh — chạy 1 lệnh trong **PowerShell với quyền Administrator**:

```
schtasks /Create /SC DAILY /ST 02:00 /TN "Backup GPSViet DB" /RL HIGHEST /RU SYSTEM ^
  /TR "powershell -ExecutionPolicy Bypass -File C:\Users\WINDOWS\Desktop\CTYGPS\backup\backup-db.ps1"
```

Lệnh này tạo task chạy **mỗi ngày lúc 02:00 sáng**.

Kiểm tra / chạy thử task:

```
schtasks /Run /TN "Backup GPSViet DB"
```

Xóa task nếu cần:

```
schtasks /Delete /TN "Backup GPSViet DB" /F
```

---

## Tùy chỉnh

Mở `backup-db.ps1`, sửa phần `CAU HINH` ở đầu file:

| Biến | Ý nghĩa |
|------|---------|
| `$DB_PASS` | Mật khẩu DB (nếu có) |
| `$RCLONE_REMOTE` | Tên remote rclone (mặc định `gdrive`) |
| `$REMOTE_FOLDER` | Thư mục trên Google Drive |
| `$LOCAL_DIR` | Nơi lưu backup tạm trên VPS |
| `$KEEP_DAYS` | Số ngày giữ lại bản backup (mặc định 14) |

---

## Lưu ý quan trọng

- **Kiểm tra phục hồi định kỳ**: backup chỉ có giá trị khi restore được. Thử restore vào 1 DB test:
  ```
  C:\xampp\mysql\bin\mysql.exe -u root gpsviet_test < ban_giai_nen.sql
  ```
- Google Drive miễn phí có **15GB**. Mỗi bản `.zip` của DB thường vài MB nên thoải mái với 14–30 ngày.
- Nên cân nhắc giữ thêm **1 bản ở dịch vụ/ổ khác** (quy tắc 3-2-1) cho dữ liệu quan trọng.
- File `.env` chứa mật khẩu/secret — **không** đưa lên Google Drive chung với backup public.
