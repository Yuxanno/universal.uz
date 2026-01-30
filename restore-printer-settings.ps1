# Printer sozlamalarini qayta tiklash

Write-Host "=== Printer Sozlamalarini Qayta Tiklash ===" -ForegroundColor Green
Write-Host ""

$backupPath = ".\PrinterBackup"

if (!(Test-Path $backupPath)) {
    Write-Host "XATO: Backup papkasi topilmadi!" -ForegroundColor Red
    Write-Host "Avval 'backup-printer-settings.ps1' ni ishga tushiring" -ForegroundColor Yellow
    exit
}

# Backup fayllarini ko'rsatish
Write-Host "Mavjud backup fayllar:" -ForegroundColor Yellow
$backupFiles = Get-ChildItem "$backupPath\printer_settings_*.json" | Sort-Object LastWriteTime -Descending

if ($backupFiles.Count -eq 0) {
    Write-Host "XATO: Backup fayllari topilmadi!" -ForegroundColor Red
    exit
}

for ($i = 0; $i -lt $backupFiles.Count; $i++) {
    Write-Host "  [$i] $($backupFiles[$i].Name) - $($backupFiles[$i].LastWriteTime)" -ForegroundColor Cyan
}

Write-Host ""
$selection = Read-Host "Qaysi backup faylni tiklashni xohlaysiz? (0-$($backupFiles.Count-1))"

if ($selection -match '^\d+$' -and [int]$selection -lt $backupFiles.Count) {
    $selectedFile = $backupFiles[[int]$selection].FullName
} else {
    Write-Host "Noto'g'ri tanlov!" -ForegroundColor Red
    exit
}

# Backup faylni o'qish
$config = Get-Content $selectedFile | ConvertFrom-Json

Write-Host ""
Write-Host "Tiklash boshlandi..." -ForegroundColor Yellow
Write-Host ""

# Printer mavjudligini tekshirish
$printer = Get-Printer | Where-Object {$_.Name -eq $config.Name}

if ($printer) {
    Write-Host "✓ Printer topildi: $($config.Name)" -ForegroundColor Green
    
    # Printer sozlamalarini yangilash
    Write-Host "Sozlamalar yangilanmoqda..." -ForegroundColor Yellow
    
    try {
        # Location va Comment ni yangilash
        if ($config.Location) {
            Set-Printer -Name $config.Name -Location $config.Location -ErrorAction SilentlyContinue
        }
        if ($config.Comment) {
            Set-Printer -Name $config.Name -Comment $config.Comment -ErrorAction SilentlyContinue
        }
        
        Write-Host "✓ Asosiy sozlamalar tiklandi" -ForegroundColor Green
    } catch {
        Write-Host "⚠ Ba'zi sozlamalarni tiklab bo'lmadi: $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
} else {
    Write-Host "⚠ Printer topilmadi: $($config.Name)" -ForegroundColor Yellow
    Write-Host "Yangi printer qo'shilsinmi? (y/n)" -ForegroundColor Yellow
    $addPrinter = Read-Host
    
    if ($addPrinter -eq 'y') {
        try {
            Add-Printer -Name $config.Name -DriverName $config.DriverName -PortName $config.PortName
            Write-Host "✓ Printer qo'shildi" -ForegroundColor Green
        } catch {
            Write-Host "✗ Printer qo'shib bo'lmadi: $($_.Exception.Message)" -ForegroundColor Red
        }
    }
}

# Registry sozlamalarini tiklash
$regBackupFiles = Get-ChildItem "$backupPath\printer_registry_*.reg" | Sort-Object LastWriteTime -Descending

if ($regBackupFiles.Count -gt 0) {
    Write-Host ""
    Write-Host "Registry sozlamalarini tiklamoqchimisiz? (y/n)" -ForegroundColor Yellow
    $restoreReg = Read-Host
    
    if ($restoreReg -eq 'y') {
        $regFile = $regBackupFiles[0].FullName
        try {
            reg import $regFile 2>$null
            Write-Host "✓ Registry sozlamalari tiklandi" -ForegroundColor Green
        } catch {
            Write-Host "⚠ Registry tiklab bo'lmadi" -ForegroundColor Yellow
        }
    }
}

Write-Host ""
Write-Host "=== Tiklash Tugallandi ===" -ForegroundColor Green
Write-Host ""
Write-Host "KEYINGI QADAMLAR:" -ForegroundColor Yellow
Write-Host "1. Control Panel -> Devices and Printers" -ForegroundColor White
Write-Host "2. '$($config.Name)' -> Right-click -> Printing Preferences" -ForegroundColor White
Write-Host "3. Quyidagi sozlamalarni tekshiring:" -ForegroundColor White
Write-Host "   - Type: Continuous (Variable Length)" -ForegroundColor Cyan
Write-Host "   - Width: 80mm (yoki sizning o'lchamingiz)" -ForegroundColor Cyan
Write-Host "   - Margins, Exposed Liner Widths va boshqalar" -ForegroundColor Cyan
Write-Host ""
Write-Host "4. Agar sozlamalar noto'g'ri bo'lsa, qo'lda to'g'rilang" -ForegroundColor White
Write-Host ""

# Saqlangan ma'lumotlarni ko'rsatish
Write-Host "=== Saqlangan Ma'lumotlar ===" -ForegroundColor Yellow
Write-Host "Printer: $($config.Name)" -ForegroundColor White
Write-Host "Driver: $($config.DriverName)" -ForegroundColor White
Write-Host "Port: $($config.PortName)" -ForegroundColor White
if ($config.Driver) {
    Write-Host "Driver versiyasi: $($config.Driver.DriverVersion)" -ForegroundColor White
    Write-Host "Manufacturer: $($config.Driver.Manufacturer)" -ForegroundColor White
}
Write-Host ""
