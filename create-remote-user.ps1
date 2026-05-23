# Chay script nay TREN VPS
# Tim duong dan mysql.exe
$mysqlPaths = @(
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\MySQL\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 5.7\bin\mysql.exe",
    "C:\Program Files\MySQL\MySQL Server 8.0\bin\mysql.exe"
)

$mysql = $mysqlPaths | Where-Object { Test-Path $_ } | Select-Object -First 1

if (-not $mysql) {
    Write-Host "Khong tim thay mysql.exe, thu lenh mysql truc tiep..."
    $mysql = "mysql"
}

Write-Host "Dung MySQL tai: $mysql"

$sql = @"
CREATE USER IF NOT EXISTS 'gpsviet'@'%' IDENTIFIED BY 'Gpsviet@2024!';
GRANT ALL PRIVILEGES ON gpsviet.* TO 'gpsviet'@'%';
GRANT ALL PRIVILEGES ON gpsviet.* TO 'root'@'%' IDENTIFIED BY '';
FLUSH PRIVILEGES;
SELECT user, host FROM mysql.user;
"@

$sql | & $mysql -u root --password= 2>&1

Write-Host ""
Write-Host "Xong! User 'gpsviet' da duoc tao voi quyen ket noi tu xa."
