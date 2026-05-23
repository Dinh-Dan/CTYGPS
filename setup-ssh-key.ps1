# Chay script nay 1 lan duy nhat de cai SSH key len VPS
# Sau do tunnel se tu dong mo khong can nhap mat khau

$keyPath = "$env:USERPROFILE\.ssh\id_rsa"

# Tao thu muc .ssh neu chua co
if (-not (Test-Path "$env:USERPROFILE\.ssh")) {
    New-Item -ItemType Directory -Path "$env:USERPROFILE\.ssh" | Out-Null
    Write-Host "Da tao thu muc .ssh"
}

# Tao key neu chua co
if (-not (Test-Path $keyPath)) {
    Write-Host "Tao SSH key moi..."
    ssh-keygen -t rsa -b 4096 -f $keyPath -N ""
} else {
    Write-Host "Da co SSH key tai $keyPath"
}

# Copy public key len VPS
$pubKey = Get-Content "$keyPath.pub"
Write-Host "Dang copy key len VPS..."
Write-Host "Ban se can nhap mat khau 1 lan cuoi cung..."

$cmd = "mkdir -Force C:\Users\Administrator\.ssh; Add-Content -Path C:\Users\Administrator\.ssh\authorized_keys -Value '$pubKey'"
ssh Administrator@103.69.96.101 "powershell -Command `"$cmd`""

Write-Host ""
Write-Host "Xong! Tu bay gio tunnel se tu dong mo khong can mat khau."
Write-Host "Chay: powershell -File ssh-tunnel.ps1"
