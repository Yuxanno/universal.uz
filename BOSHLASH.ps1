# Xprinter Driver Boshqaruv Tizimi

function Show-Menu {
    Clear-Host
    Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
    Write-Host "║     XPRINTER XP-365B DRIVER BOSHQARUV TIZIMI                ║" -ForegroundColor Cyan
    Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  [1] Printer sozlamalarini BACKUP qilish" -ForegroundColor Yellow
    Write-Host "  [2] Printer sozlamalarini TIKLASH (Restore)" -ForegroundColor Yellow
    Write-Host "  [3] Driver ma'lumotlarini ko'rish" -ForegroundColor Green
    Write-Host "  [4] Printer holatini tekshirish" -ForegroundColor Green
    Write-Host "  [5] Driver fayllarini USB ga nusxalash" -ForegroundColor Magenta
    Write-Host "  [6] Yo'riqnomalarni ochish" -ForegroundColor Cyan
    Write-Host "  [0] Chiqish" -ForegroundColor Red
    Write-Host ""
}

function Show-PrinterInfo {
    Write-Host "=== Printer Ma'lumotlari ===" -ForegroundColor Green
    Write-Host ""
    
    $printer = Get-Printer | Where-Object {$_.Name -like '*XP*'}
    
    if ($printer) {
        Write-Host "Printer nomi: $($printer.Name)" -ForegroundColor White
        Write-Host "Driver: $($printer.DriverName)" -ForegroundColor White
        Write-Host "Port: $($printer.PortName)" -ForegroundColor White
        Write-Host "Holat: $($printer.PrinterStatus)" -ForegroundColor White
        Write-Host ""
        
        $driver = Get-PrinterDriver | Where-Object {$_.Name -eq $printer.DriverName}
        if ($driver) {
            Write-Host "Driver versiyasi: $($driver.DriverVersion)" -ForegroundColor Cyan
            Write-Host "Manufacturer: $($driver.Manufacturer)" -ForegroundColor Cyan
            Write-Host "INF fayl: $($driver.InfPath)" -ForegroundColor Cyan
        }
    } else {
        Write-Host "Xprinter topilmadi!" -ForegroundColor Red
    }
    
    Write-Host ""
    Read-Host "Davom etish uchun Enter bosing"
}

function Show-PrinterStatus {
    Write-Host "=== Printer Holati ===" -ForegroundColor Green
    Write-Host ""
    
    $printer = Get-Printer | Where-Object {$_.Name -like '*XP*'}
    
    if ($printer) {
        Write-Host "✓ Printer topildi" -ForegroundColor Green
        Write-Host "  Nomi: $($printer.Name)" -ForegroundColor White
        
        # Driver tekshirish
        $driver = Get-PrinterDriver | Where-Object {$_.Name -eq $printer.DriverName}
        if ($driver) {
            Write-Host "✓ Driver o'rnatilgan" -ForegroundColor Green
            Write-Host "  Nomi: $($driver.Name)" -ForegroundColor White
            
            # Seagull driver tekshirish
            if ($driver.Manufacturer -eq "Xprinter" -or $driver.Manufacturer -eq "Seagull") {
                Write-Host "✓ To'g'ri driver (Professional)" -ForegroundColor Green
            } else {
                Write-Host "⚠ Oddiy driver (Continuous type bo'lmasligi mumkin)" -ForegroundColor Yellow
            }
        } else {
            Write-Host "✗ Driver topilmadi" -ForegroundColor Red
        }
        
        # Port tekshirish
        $port = Get-PrinterPort | Where-Object {$_.Name -eq $printer.PortName}
        if ($port) {
            Write-Host "✓ Port ulangan" -ForegroundColor Green
            Write-Host "  Port: $($port.Name)" -ForegroundColor White
        } else {
            Write-Host "✗ Port topilmadi" -ForegroundColor Red
        }
        
        # Backup tekshirish
        if (Test-Path ".\PrinterBackup") {
            $backupFiles = Get-ChildItem ".\PrinterBackup\printer_settings_*.json"
            Write-Host "✓ Backup mavjud ($($backupFiles.Count) ta fayl)" -ForegroundColor Green
        } else {
            Write-Host "⚠ Backup yo'q (Backup qilish tavsiya etiladi!)" -ForegroundColor Yellow
        }
        
    } else {
        Write-Host "✗ Xprinter topilmadi!" -ForegroundColor Red
        Write-Host ""
        Write-Host "Barcha printerlar:" -ForegroundColor Yellow
        Get-Printer | Select-Object Name, DriverName | Format-Table -AutoSize
    }
    
    Write-Host ""
    Read-Host "Davom etish uchun Enter bosing"
}

function Show-Documentation {
    Write-Host "=== Yo'riqnomalar ===" -ForegroundColor Green
    Write-Host ""
    Write-Host "  [1] Driver yangilash yo'riqnomasi" -ForegroundColor Yellow
    Write-Host "  [2] Sherigingiz uchun yo'riqnoma" -ForegroundColor Yellow
    Write-Host "  [3] Tezkor yo'riqnoma" -ForegroundColor Yellow
    Write-Host "  [0] Orqaga" -ForegroundColor Red
    Write-Host ""
    
    $choice = Read-Host "Tanlang"
    
    switch ($choice) {
        "1" {
            if (Test-Path "DRIVER_YANGILASH_YORIQNOMASI.md") {
                Start-Process "notepad.exe" -ArgumentList "DRIVER_YANGILASH_YORIQNOMASI.md"
            } else {
                Write-Host "Fayl topilmadi!" -ForegroundColor Red
            }
        }
        "2" {
            if (Test-Path "SHERIGI_UCHUN_YORIQNOMA.md") {
                Start-Process "notepad.exe" -ArgumentList "SHERIGI_UCHUN_YORIQNOMA.md"
            } else {
                Write-Host "Fayl topilmadi!" -ForegroundColor Red
            }
        }
        "3" {
            if (Test-Path "TEZKOR_YORIQNOMA.txt") {
                Start-Process "notepad.exe" -ArgumentList "TEZKOR_YORIQNOMA.txt"
            } else {
                Write-Host "Fayl topilmadi!" -ForegroundColor Red
            }
        }
    }
}

# Asosiy dastur
do {
    Show-Menu
    $choice = Read-Host "Tanlang"
    
    switch ($choice) {
        "1" {
            if (Test-Path "backup-printer-settings.ps1") {
                & ".\backup-printer-settings.ps1"
            } else {
                Write-Host "Skript topilmadi!" -ForegroundColor Red
            }
            Read-Host "Davom etish uchun Enter bosing"
        }
        "2" {
            if (Test-Path "restore-printer-settings.ps1") {
                & ".\restore-printer-settings.ps1"
            } else {
                Write-Host "Skript topilmadi!" -ForegroundColor Red
            }
            Read-Host "Davom etish uchun Enter bosing"
        }
        "3" {
            Show-PrinterInfo
        }
        "4" {
            Show-PrinterStatus
        }
        "5" {
            if (Test-Path "copy-to-usb.ps1") {
                & ".\copy-to-usb.ps1"
            } else {
                Write-Host "Skript topilmadi!" -ForegroundColor Red
            }
            Read-Host "Davom etish uchun Enter bosing"
        }
        "6" {
            Show-Documentation
        }
        "0" {
            Write-Host ""
            Write-Host "Xayr! 👋" -ForegroundColor Green
            Write-Host ""
            break
        }
        default {
            Write-Host "Noto'g'ri tanlov!" -ForegroundColor Red
            Start-Sleep -Seconds 1
        }
    }
} while ($choice -ne "0")
