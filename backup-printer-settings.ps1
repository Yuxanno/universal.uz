# Printer sozlamalarini backup qilish

Write-Host "=== Printer Sozlamalarini Backup Qilish ===" -ForegroundColor Green
Write-Host ""

# Backup papkasini yaratish
$backupPath = ".\PrinterBackup"
if (!(Test-Path $backupPath)) {
    New-Item -ItemType Directory -Path $backupPath -Force | Out-Null
}

$timestamp = Get-Date -Format "yyyy-MM-dd_HH-mm-ss"
$backupFile = "$backupPath\printer_settings_$timestamp.json"

# Printer ma'lumotlarini olish
$printer = Get-Printer | Where-Object {$_.Name -like '*XP*'}

if (!$printer) {
    Write-Host "XATO: Xprinter topilmadi!" -ForegroundColor Red
    exit
}

Write-Host "Printer topildi: $($printer.Name)" -ForegroundColor Green
Write-Host ""

# Printer sozlamalarini olish
$printerConfig = @{
    Name = $printer.Name
    DriverName = $printer.DriverName
    PortName = $printer.PortName
    ShareName = $printer.ShareName
    Location = $printer.Location
    Comment = $printer.Comment
    Shared = $printer.Shared
    Published = $printer.Published
    Timestamp = $timestamp
}

# Driver ma'lumotlarini olish
$driver = Get-PrinterDriver | Where-Object {$_.Name -eq $printer.DriverName}
if ($driver) {
    $printerConfig.Driver = @{
        Name = $driver.Name
        Manufacturer = $driver.Manufacturer
        DriverVersion = $driver.DriverVersion
        InfPath = $driver.InfPath
    }
}

# Port ma'lumotlarini olish
$port = Get-PrinterPort | Where-Object {$_.Name -eq $printer.PortName}
if ($port) {
    $printerConfig.Port = @{
        Name = $port.Name
        Description = $port.Description
        PortMonitor = $port.PortMonitor
    }
}

# JSON formatda saqlash
$printerConfig | ConvertTo-Json -Depth 10 | Out-File -FilePath $backupFile -Encoding UTF8

Write-Host "✓ Sozlamalar saqlandi:" -ForegroundColor Green
Write-Host "  $backupFile" -ForegroundColor Cyan
Write-Host ""

# Ma'lumotlarni ko'rsatish
Write-Host "=== Saqlangan Ma'lumotlar ===" -ForegroundColor Yellow
Write-Host "Printer nomi: $($printerConfig.Name)" -ForegroundColor White
Write-Host "Driver: $($printerConfig.DriverName)" -ForegroundColor White
Write-Host "Port: $($printerConfig.PortName)" -ForegroundColor White
Write-Host ""

# Printer preferences ni eksport qilish (Windows Registry orqali)
Write-Host "Registry sozlamalarini eksport qilish..." -ForegroundColor Yellow

$regPath = "HKCU:\Software\Microsoft\Windows NT\CurrentVersion\PrinterPorts"
$regBackupFile = "$backupPath\printer_registry_$timestamp.reg"

try {
    # Registry eksport
    reg export "HKCU\Software\Microsoft\Windows NT\CurrentVersion\PrinterPorts" $regBackupFile /y 2>$null
    if (Test-Path $regBackupFile) {
        Write-Host "✓ Registry sozlamalari saqlandi" -ForegroundColor Green
    }
} catch {
    Write-Host "⚠ Registry eksport qilishda xatolik" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=== Backup Tugallandi ===" -ForegroundColor Green
Write-Host ""
Write-Host "Backup fayllari:" -ForegroundColor Yellow
Get-ChildItem $backupPath | ForEach-Object {
    Write-Host "  - $($_.Name)" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "KEYINGI QADAMLAR:" -ForegroundColor Yellow
Write-Host "1. Endi driverni yangilashingiz mumkin" -ForegroundColor White
Write-Host "2. Driver o'rnatilgandan keyin 'restore-printer-settings.ps1' ni ishga tushiring" -ForegroundColor White
Write-Host "3. Yoki qo'lda sozlang - barcha ma'lumotlar backup faylda" -ForegroundColor White
Write-Host ""

# Backup faylini ochish
$openBackup = Read-Host "Backup faylini ochishni xohlaysizmi? (y/n)"
if ($openBackup -eq 'y') {
    Start-Process "notepad.exe" -ArgumentList $backupFile
}
