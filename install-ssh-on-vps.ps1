# Cai OpenSSH tren Windows Server 2012 R2
$url = "https://github.com/PowerShell/Win32-OpenSSH/releases/download/v9.5.0.0p1-Beta/OpenSSH-Win64.zip"
$zipPath = "C:\openssh.zip"
$installPath = "C:\Program Files\OpenSSH"

Write-Host "Dang tai OpenSSH..."
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
Invoke-WebRequest -Uri $url -OutFile $zipPath -UseBasicParsing

Write-Host "Dang giai nen..."
Expand-Archive -Path $zipPath -DestinationPath "C:\Program Files\" -Force
Rename-Item "C:\Program Files\OpenSSH-Win64" $installPath -ErrorAction SilentlyContinue

Write-Host "Dang cai dich vu..."
& "$installPath\install-sshd.ps1"

Write-Host "Dang khoi dong SSH..."
Start-Service sshd
Set-Service -Name sshd -StartupType Automatic

Write-Host "Mo cong 22 firewall..."
netsh advfirewall firewall add rule name="OpenSSH" protocol=TCP dir=in localport=22 action=allow

Write-Host ""
Write-Host "SSH da cai xong! Thu ket noi bang: ssh Administrator@103.69.96.101"
