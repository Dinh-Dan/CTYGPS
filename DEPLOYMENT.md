# Triển khai VPS — hiện trạng (cập nhật 2026-08-29)

Ghi lại để AI/người sau đọc là hiểu ngay hạ tầng đang chạy thế nào, không cần dò lại từ đầu.

## VPS

- IP: `103.69.96.101`
- OS: **Windows Server** (không phải Linux!) — hostname `WIN19950`
- Truy cập:
  - RDP: port 3389 (user `Administrator`)
  - WinRM (PowerShell Remoting): port 5985 mở, dùng được `Invoke-Command -ComputerName ... -Authentication Negotiate`. Máy điều khiển cần thêm IP VPS vào `WSMan:\localhost\Client\TrustedHosts` trước.
  - SSH: **đóng** (port 22 timeout) — đừng cố ssh vào máy này.
- Domain: `banhang.gpsvina.com` → trỏ vào VPS này qua nginx.

## Stack đang chạy trên VPS

| Thành phần | Công nghệ | Đường dẫn | Port | Ghi chú |
|---|---|---|---|---|
| Web/reverse proxy | nginx 1.28.3 | `C:\nginx-1.28.3\` | 80, 443 | conf: `C:\nginx-1.28.3\conf\nginx.conf`. `server_name banhang.gpsvina.com`, `proxy_pass http://127.0.0.1:5179` |
| SSL cert | win-acme (Let's Encrypt) | `C:\win-acme.v2.2.9.1701.x64.pluggable\` | — | cert tại `C:\nginx-1.28.3\ssl\banhang.gpsvina.com-chain.pem` |
| Backend | Node.js (Express) qua **PM2** | `C:\Users\Administrator\Desktop\ctyGPS\BE\` | 5179 | PM2 process name: `ctygps`. Quản lý bằng `pm2 list` / `pm2 restart ctygps --update-env` / `pm2 logs ctygps` |
| Database | MySQL/MariaDB (từ **XAMPP**, không phải server riêng) | `C:\xampp\mysql\bin\` | 3306 | Process `mysqld.exe`. DB name: `ctygps` |
| Apache (XAMPP) | httpd.exe | `C:\xampp\apache\bin\` | 8001 | Chạy nhưng không rõ dùng để làm gì (không phải route chính, FE/BE đi qua nginx+Node). Không động vào trừ khi biết chắc tác dụng. |
| Static FE | phục vụ qua Node/Express (thư mục `FE/`) | — | qua 5179 | không phải nginx serve trực tiếp file tĩnh |
| Backup DB | tích hợp trong Node (`BE/src/backup.js`) | — | — | xem mục Backup bên dưới |

**Lưu ý quan trọng:** dù là VPS "production", máy này thực chất là **Windows + XAMPP** giống hệt môi trường dev local — KHÔNG phải Linux server chuẩn. Bất kỳ path/script nào viết theo kiểu Linux (`/usr/bin/...`, `/var/...`) đều SAI trên máy này và sẽ gây lỗi âm thầm (xem bug đã sửa bên dưới).

Project source trên VPS nằm ở: `C:\Users\Administrator\Desktop\ctyGPS\` (cấu trúc `BE/`, `FE/`, và `BACKUP127/` — thư mục chứa 1 bản backup cũ `gpsviet.sql` + `uploads/`, có vẻ là snapshot thủ công, không phải cơ chế backup tự động).

## Cách deploy / thao tác thường dùng

```powershell
# Từ máy điều khiển, sau khi đã trust host:
Set-Item WSMan:\localhost\Client\TrustedHosts -Value "103.69.96.101" -Force -Concatenate

$cred = Get-Credential   # Administrator / (xin mật khẩu, không hardcode vào script)
Invoke-Command -ComputerName 103.69.96.101 -Credential $cred -Authentication Negotiate -ScriptBlock {
    Set-Location "C:\Users\Administrator\Desktop\ctyGPS\BE"
    # git pull, npm install, sửa .env, v.v.
    pm2 restart ctygps --update-env
}
```

- Sau khi sửa code hoặc `.env`, luôn `pm2 restart ctygps --update-env` (không chỉ `pm2 restart ctygps`, vì flag đó mới nạp lại biến môi trường).
- Log: `C:\Users\Administrator\.pm2\logs\ctygps-out.log` và `ctygps-error.log`.

## Backup database — cơ chế và bug đã sửa (2026-08-29)

Cơ chế: `BE/src/backup.js`, tích hợp thẳng trong app Node (không phải cron/task riêng). Bật qua `.env`:
```
BACKUP_ENABLED=true
BACKUP_INTERVAL_MINUTES=30   # ưu tiên hơn BACKUP_INTERVAL_HOURS nếu > 0
```
Chạy lần đầu 30s sau khi app start, rồi lặp theo chu kỳ. Flow: `mysqldump` → gzip → lưu local (`BACKUP_DIR`) → gửi file `.sql.gz` lên Telegram (bot) → dọn bản cũ theo `BACKUP_KEEP_DAYS`/`BACKUP_KEEP_COUNT`. Nếu lỗi ở bất kỳ bước nào, gửi tin nhắn `[Backup LOI] ...` vào cùng chat Telegram.

**Bug #1 — đã sửa:** `.env` trên VPS bị cấu hình theo mẫu "VPS Linux" trong `.env.example` thay vì mẫu Windows, dù máy thực chất là Windows+XAMPP:
```
# SAI (kiểu Linux, đã từng nằm trong .env thật trên VPS Windows này):
BACKUP_DIR=/var/db-backups
BACKUP_MYSQLDUMP=/usr/bin/mysqldump

# ĐÚNG (đã sửa thành):
BACKUP_DIR=C:\var\db-backups
BACKUP_MYSQLDUMP=C:\xampp\mysql\bin\mysqldump.exe
```
Hậu quả: mọi lần backup tự động đều fail ngay từ bước `mysqldump`, báo lỗi `Khong tim thay mysqldump: /usr/bin/mysqldump` — lỗi này lặp lại liên tục (mỗi 30 phút) trong log, từng gửi cảnh báo Telegram thành công.

**Bug #2 — đã sửa:** Bot Telegram cũ (`TELEGRAM_BOT_TOKEN` trỏ tới bot ID `8419144425`) đã ngừng hoạt động (token trả `401 Unauthorized` khi gọi bất kỳ API nào, kể cả `getMe`) tại một thời điểm nào đó sau **2026-08-21** — không rõ do bị revoke qua BotFather hay bot bị xoá. Vì vậy sau ngày đó, kể cả cảnh báo lỗi `[Backup LOI]` cũng không gửi được nữa (im lặng hoàn toàn, không ai biết backup đang fail).

Đã tạo bot Telegram mới thay thế: **@ctygps_backup_bot**, thêm vào group Telegram cũ "databaseGPS" (`chat_id = -5250565443`, giữ nguyên, không đổi). Token mới đã cập nhật vào `.env` trên VPS.

Sau khi sửa cả 2 bug, đã test thủ công `runBackup()` trực tiếp trên VPS — chạy thành công đầy đủ: dump → gzip → gửi Telegram.

**Bài học / điều cần để ý về sau:**
- File `.bak_<timestamp>` được để lại cạnh `.env` mỗi lần sửa (không tự xoá) — nên dọn định kỳ, đừng để lộ ra ngoài git.
- `telegram-msgs.json` (trong `BACKUP_DIR`) lưu danh sách `message_id` đã gửi để tự xoá bản cũ trên Telegram khi vượt `keepCount`. Nếu đổi bot/chat mới, list này nên coi là rỗng lại (bot mới không xoá được tin của bot cũ).
- Nên cân nhắc thêm giám sát chủ động (không chỉ dựa vào cảnh báo qua chính kênh có thể bị hỏng) — ví dụ log lỗi ra thêm 1 kênh khác, hoặc kiểm tra định kỳ `BACKUP_DIR` có file mới trong N ngày gần nhất không.
