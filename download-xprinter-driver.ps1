# Xprinter XP-365B driver yuklab olish va o'rnatish yo'riqnomasi

Write-Host "=== Xprinter XP-365B Driver O'rnatish ===" -ForegroundColor Green
Write-Host ""
Write-Host "1. Quyidagi havoladan driverni yuklab oling:" -ForegroundColor Yellow
Write-Host "   http://www.xprinter.net/download" -ForegroundColor Cyan
Write-Host ""
Write-Host "2. Yoki to'g'ridan-to'g'ri:" -ForegroundColor Yellow
Write-Host "   https://drive.google.com/drive/folders/1-xprinter-drivers" -ForegroundColor Cyan
Write-Host ""
Write-Host "3. 'XP-365B' yoki 'XP-360B' driverini toping" -ForegroundColor Yellow
Write-Host ""
Write-Host "4. Driver o'rnatilgandan keyin:" -ForegroundColor Yellow
Write-Host "   - Control Panel -> Devices and Printers" -ForegroundColor White
Write-Host "   - XPrinter XP-365B -> Right-click -> Printing Preferences" -ForegroundColor White
Write-Host "   - 'Type' qismida 'Continuous (Variable Length)' paydo bo'ladi" -ForegroundColor White
Write-Host ""
Write-Host "5. Agar driver topilmasa, universal thermal printer driver o'rnating:" -ForegroundColor Yellow
Write-Host "   - Windows Settings -> Printers -> Add Printer" -ForegroundColor White
Write-Host "   - 'Generic / Text Only' driverni tanlang" -ForegroundColor White
Write-Host ""

# Hozirgi o'rnatilgan printerlarni ko'rsatish
Write-Host "=== Hozirgi printerlar ===" -ForegroundColor Green
Get-Printer | Select-Object Name, DriverName, PortName | Format-Table -AutoSize

Write-Host ""
Write-Host "Agar yordam kerak bo'lsa, quyidagi buyruqni ishga tushiring:" -ForegroundColor Yellow
Write-Host "Get-PrinterDriver | Where-Object {`$_.Name -like '*XP*'}" -ForegroundColor Cyan
