# Chay script nay 1 lan de dang ky tunnel vao Task Scheduler Windows
# Phai chay voi quyen Administrator

$scriptPath = "c:\Users\WINDOWS\Desktop\CTYGPS\ssh-tunnel.ps1"
$taskName = "GPSViet-SSH-Tunnel"

$action = New-ScheduledTaskAction `
    -Execute "powershell.exe" `
    -Argument "-WindowStyle Hidden -File `"$scriptPath`""

$trigger = New-ScheduledTaskTrigger -AtLogOn

$settings = New-ScheduledTaskSettingsSet `
    -RestartCount 99 `
    -RestartInterval (New-TimeSpan -Minutes 1) `
    -ExecutionTimeLimit ([TimeSpan]::Zero)

Register-ScheduledTask `
    -TaskName $taskName `
    -Action $action `
    -Trigger $trigger `
    -Settings $settings `
    -RunLevel Highest `
    -Force

Write-Host "Da dang ky task '$taskName' vao Task Scheduler."
Write-Host "Tunnel se tu dong chay moi khi ban dang nhap Windows."
Write-Host ""
Write-Host "De chay ngay bay gio:"
Start-ScheduledTask -TaskName $taskName
Write-Host "Tunnel dang chay!"
