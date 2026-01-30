# USB ga nusxalash uchun skript

Write-Host "=== USB ga Driver Nusxalash ===" -ForegroundColor Green
Write-Host ""

# USB diskni topish
$usbDrives = Get-Volume | Where-Object {$_.DriveType -eq 'Removable' -and $_.DriveLetter}

if ($usbDrives.Count -eq 0) {
    Write-Host "XATO: USB disk topilmadi!" -ForegroundColor Red
    Write-Host "Iltimos, USB diskni ulang va qayta urinib ko'ring." -ForegroundColor Yellow
    exit
}

Write-Host "Topilgan USB disklar:" -ForegroundColor Yellow
$usbDrives | ForEach-Object {
    Write-Host "  $($_.DriveLetter):\ - $($_.FileSystemLabel) ($([math]::Round($_.SizeRemaining/1GB, 2)) GB bo'sh)" -ForegroundColor Cyan
}

Write-Host ""
$driveLetter = Read-Host "USB disk harfini kiriting (masalan: E)"
$usbPath = "${driveLetter}:\XprinterDriver"

if (!(Test-Path "${driveLetter}:\")) {
    Write-Host "XATO: $driveLetter disk topilmadi!" -ForegroundColor Red
    exit
}

Write-Host ""
Write-Host "USB ga nusxalanmoqda..." -ForegroundColor Yellow

# Papka yaratish
New-Item -ItemType Directory -Path $usbPath -Force | Out-Null

# Driver fayllarini nusxalash
if (Test-Path "C:\XprinterDriverExport") {
    Copy-Item -Path "C:\XprinterDriverExport\*" -Destination $usbPath -Recurse -Force
    Write-Host "✓ Driver fayllari nusxalandi" -ForegroundColor Green
}

# Yo'riqnomani nusxalash
if (Test-Path "SHERIGI_UCHUN_YORIQNOMA.md") {
    Copy-Item -Path "SHERIGI_UCHUN_YORIQNOMA.md" -Destination $usbPath -Force
    Write-Host "✓ Yo'riqnoma nusxalandi" -ForegroundColor Green
}

# INF faylni to'g'ridan-to'g'ri nusxalash
$driver = Get-PrinterDriver | Where-Object {$_.Name -eq 'Xprinter XP-365B'}
if ($driver -and (Test-Path $driver.InfPath)) {
    $infFolder = Split-Path $driver.InfPath
    Copy-Item -Path $infFolder -Destination "$usbPath\INF" -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "✓ INF fayllari nusxalandi" -ForegroundColor Green
}

Write-Host ""
Write-Host "=== MUVAFFAQIYATLI ===" -ForegroundColor Green
Write-Host ""
Write-Host "Fayllar quyidagi joyga nusxalandi:" -ForegroundColor Yellow
Write-Host "  $usbPath" -ForegroundColor Cyan
Write-Host ""
Write-Host "Sherigingizga USB ni bering va quyidagi faylni oching:" -ForegroundColor Yellow
Write-Host "  $usbPath\SHERIGI_UCHUN_YORIQNOMA.md" -ForegroundColor Cyan
Write-Host ""
Write-Host "Yoki to'g'ridan-to'g'ri INF fayldan o'rnating:" -ForegroundColor Yellow
Write-Host "  $usbPath\INF\xprinter.inf" -ForegroundColor Cyan
Write-Host ""

# USB ni ochish
Start-Process "explorer.exe" -ArgumentList $usbPath
