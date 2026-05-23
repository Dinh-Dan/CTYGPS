$sshPath = "ssh"
$remoteHost = "Administrator@103.69.96.101"
$localPort = 3307
$remotePort = 3306

Write-Host "Dang mo SSH tunnel $localPort -> VPS:$remotePort ..."

while ($true) {
    $proc = Start-Process -FilePath $sshPath `
        -ArgumentList "-o StrictHostKeyChecking=no -o ServerAliveInterval=30 -o ServerAliveCountMax=3 -L ${localPort}:127.0.0.1:${remotePort} $remoteHost -N" `
        -NoNewWindow -PassThru

    Write-Host "Tunnel dang chay (PID $($proc.Id)). Cho den khi mat ket noi..."
    $proc.WaitForExit()
    Write-Host "Tunnel dut! Thu lai sau 5 giay..."
    Start-Sleep -Seconds 5
}
