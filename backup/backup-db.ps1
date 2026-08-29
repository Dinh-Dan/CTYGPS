<#
  Backup database gpsviet -> nen .zip -> day len Google Drive (rclone) -> xoa ban cu
  Dung cho Windows Server 2012 R2 + XAMPP MariaDB/MySQL.

  Cach chay thu (trong PowerShell):
    powershell -ExecutionPolicy Bypass -File C:\Users\WINDOWS\Desktop\CTYGPS\backup\backup-db.ps1

  Xem file README.md cung thu muc de biet cach cau hinh rclone va Task Scheduler.
#>

# ===================== CAU HINH (chinh o day) =====================
$DB_HOST   = "localhost"
$DB_PORT   = "3306"
$DB_USER   = "root"
$DB_PASS   = ""                 # XAMPP mac dinh khong co mat khau. Neu co thi dien vao.
$DB_NAME   = "gpsviet"

# Duong dan mysqldump cua XAMPP (chinh lai neu cai cho khac)
$MYSQLDUMP = "C:\xampp\mysql\bin\mysqldump.exe"

# Duong dan rclone.exe va ten remote da cau hinh (xem README)
$RCLONE        = "C:\rclone\rclone.exe"
$RCLONE_REMOTE = "gdrive"                 # ten remote khi chay: rclone config
$REMOTE_FOLDER = "backup-gpsviet"         # thu muc tren Google Drive

# Thu muc luu backup tam tren VPS
$LOCAL_DIR = "C:\db-backups"

# Giu lai bao nhieu ban gan nhat (ca local va tren Drive)
$KEEP_DAYS = 14
# ==================================================================

$ErrorActionPreference = "Stop"
$ts        = Get-Date -Format "yyyy-MM-dd_HHmmss"
$sqlFile   = Join-Path $LOCAL_DIR "$DB_NAME`_$ts.sql"
$zipFile   = Join-Path $LOCAL_DIR "$DB_NAME`_$ts.zip"
$logFile   = Join-Path $LOCAL_DIR "backup.log"

function Log($msg) {
  $line = "[{0}] {1}" -f (Get-Date -Format "yyyy-MM-dd HH:mm:ss"), $msg
  Write-Host $line
  Add-Content -Path $logFile -Value $line -ErrorAction SilentlyContinue
}

try {
  if (-not (Test-Path $LOCAL_DIR)) { New-Item -ItemType Directory -Path $LOCAL_DIR -Force | Out-Null }

  Log "=== Bat dau backup $DB_NAME ==="

  # 1) Dump database
  if (-not (Test-Path $MYSQLDUMP)) { throw "Khong tim thay mysqldump tai: $MYSQLDUMP" }

  $pwArg = if ([string]::IsNullOrEmpty($DB_PASS)) { "" } else { "--password=$DB_PASS" }
  $dumpArgs = @(
    "--host=$DB_HOST", "--port=$DB_PORT", "--user=$DB_USER",
    "--single-transaction", "--routines", "--triggers", "--events",
    "--default-character-set=utf8mb4",
    "--result-file=$sqlFile", $DB_NAME
  )
  if ($pwArg -ne "") { $dumpArgs = @($pwArg) + $dumpArgs }

  Log "Dang dump ra: $sqlFile"
  & $MYSQLDUMP @dumpArgs
  if ($LASTEXITCODE -ne 0) { throw "mysqldump that bai (exit $LASTEXITCODE)" }
  if (-not (Test-Path $sqlFile)) { throw "Khong tao duoc file SQL" }

  # 2) Nen .zip
  Log "Dang nen: $zipFile"
  Compress-Archive -Path $sqlFile -DestinationPath $zipFile -Force
  Remove-Item $sqlFile -Force   # xoa file .sql tho, chi giu .zip

  $sizeMB = [math]::Round((Get-Item $zipFile).Length / 1MB, 2)
  Log "Da tao backup ($sizeMB MB)"

  # 3) Day len Google Drive
  if (Test-Path $RCLONE) {
    Log "Dang upload len Google Drive ($RCLONE_REMOTE`:$REMOTE_FOLDER)"
    & $RCLONE copy $zipFile "$RCLONE_REMOTE`:$REMOTE_FOLDER" --log-file=$logFile --log-level=INFO
    if ($LASTEXITCODE -ne 0) { throw "rclone upload that bai (exit $LASTEXITCODE)" }
    Log "Upload xong"

    # 4) Xoa ban cu tren Drive (cu hon KEEP_DAYS ngay)
    & $RCLONE delete "$RCLONE_REMOTE`:$REMOTE_FOLDER" --min-age "$KEEP_DAYS`d" --log-file=$logFile --log-level=INFO
    Log "Da don ban cu tren Drive (giu $KEEP_DAYS ngay)"
  } else {
    Log "CANH BAO: Khong tim thay rclone tai $RCLONE -> bo qua buoc upload. Chi luu local."
  }

  # 5) Xoa ban cu o local
  Get-ChildItem $LOCAL_DIR -Filter "*.zip" |
    Where-Object { $_.LastWriteTime -lt (Get-Date).AddDays(-$KEEP_DAYS) } |
    ForEach-Object { Remove-Item $_.FullName -Force; Log "Xoa local cu: $($_.Name)" }

  Log "=== Backup HOAN TAT ==="
  exit 0
}
catch {
  Log "LOI: $($_.Exception.Message)"
  exit 1
}
