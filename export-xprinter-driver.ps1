# Xprinter driver eksport qilish (sizning noutbukingizda ishlatish)

Write-Host "=== Xprinter Driver Eksport ===" -ForegroundColor Green
Write-Host ""

# Driver ma'lumotlarini olish
$driver = Get-PrinterDriver | Where-Object {$_.Name -eq 'Xprinter XP-365B'}

if ($driver) {
    Write-Host "Driver topildi: $($driver.Name)" -ForegroundColor Green
    Write-Host "Manufacturer: $($driver.Manufacturer)" -ForegroundColor Cyan
    Write-Host "Version: $($driver.DriverVersion)" -ForegroundColor Cyan
    Write-Host ""
    
    # Driver fayllarini ko'rsatish
    Write-Host "=== Driver fayllari ===" -ForegroundColor Yellow
    Write-Host "INF fayl: $($driver.InfPath)" -ForegroundColor White
    Write-Host "Data fayl: $($driver.DataFile)" -ForegroundColor White
    Write-Host "Config fayl: $($driver.ConfigFile)" -ForegroundColor White
    Write-Host ""
    
    # Eksport papkasini yaratish
    $exportPath = "C:\XprinterDriverExport"
    if (!(Test-Path $exportPath)) {
        New-Item -ItemType Directory -Path $exportPath -Force | Out-Null
        Write-Host "Eksport papkasi yaratildi: $exportPath" -ForegroundColor Green
    }
    
    # INF faylni nusxalash
    if (Test-Path $driver.InfPath) {
        $infFolder = Split-Path $driver.InfPath
        Write-Host "INF papkasini nusxalash..." -ForegroundColor Yellow
        Copy-Item -Path $infFolder -Destination "$exportPath\DriverFiles" -Recurse -Force -ErrorAction SilentlyContinue
    }
    
    Write-Host ""
    Write-Host "=== KEYINGI QADAMLAR ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "1. Quyidagi papkani USB ga nusxalang:" -ForegroundColor Yellow
    Write-Host "   $exportPath" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "2. Yoki INF faylni to'g'ridan-to'g'ri nusxalang:" -ForegroundColor Yellow
    Write-Host "   $($driver.InfPath)" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "3. Sherigingizning noutbukida:" -ForegroundColor Yellow
    Write-Host "   - Control Panel -> Devices and Printers" -ForegroundColor White
    Write-Host "   - Add a printer -> The printer that I want isn't listed" -ForegroundColor White
    Write-Host "   - Add a local printer -> Use an existing port (USB001)" -ForegroundColor White
    Write-Host "   - Have Disk -> Browse -> INF faylni tanlang" -ForegroundColor White
    Write-Host "   - 'Xprinter XP-365B' ni tanlang va Install" -ForegroundColor White
    Write-Host ""
    Write-Host "4. YOKi oddiy yo'l - Rasmiy saytdan yuklab oling:" -ForegroundColor Yellow
    Write-Host "   http://www.xprinter.net/download" -ForegroundColor Cyan
    Write-Host "   'XP-365B' yoki 'Seagull Driver' ni toping" -ForegroundColor White
    Write-Host ""
    
} else {
    Write-Host "XATO: Xprinter XP-365B driver topilmadi!" -ForegroundColor Red
    Write-Host ""
    Write-Host "O'rnatilgan printerlar:" -ForegroundColor Yellow
    Get-Printer | Select-Object Name | Format-Table -AutoSize
}

Write-Host ""
Write-Host "=== ALTERNATIV YECHIM ===" -ForegroundColor Green
Write-Host ""
Write-Host "Agar driver o'rnatish qiyin bo'lsa, quyidagi havoladan yuklab oling:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. Seagull BarTender Driver (Professional):" -ForegroundColor Cyan
Write-Host "   https://www.seagullscientific.com/support/downloads/drivers/" -ForegroundColor White
Write-Host ""
Write-Host "2. Xprinter rasmiy driver:" -ForegroundColor Cyan
Write-Host "   http://www.xprinter.net/download" -ForegroundColor White
Write-Host ""
Write-Host "3. Universal Thermal Printer Driver:" -ForegroundColor Cyan
Write-Host "   Windows Settings -> Add Printer -> Generic / Text Only" -ForegroundColor White
Write-Host ""
