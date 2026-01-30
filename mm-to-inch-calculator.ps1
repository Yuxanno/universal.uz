# MM to INCH Calculator

function Convert-MmToInch {
    param([double]$mm)
    return [math]::Round($mm / 25.4, 3)
}

function Convert-InchToMm {
    param([double]$inch)
    return [math]::Round($inch * 25.4, 2)
}

Clear-Host
Write-Host "╔══════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          MM ↔ INCH KONVERTATSIYA KALKULYATORI               ║" -ForegroundColor Cyan
Write-Host "╚══════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Tezkor jadval
Write-Host "=== TEZKOR JADVAL (Chek va Etiketka uchun) ===" -ForegroundColor Green
Write-Host ""

$commonSizes = @(
    @{mm=57; desc="Chek kengligi (kichik)"},
    @{mm=76; desc="Chek kengligi (standart)"},
    @{mm=80; desc="Chek kengligi (keng)"},
    @{mm=39; desc="Etiketka balandligi"},
    @{mm=1.3; desc="Chet bo'shliq (Left/Right)"},
    @{mm=0.8; desc="Yuqori margin (Top)"},
    @{mm=2; desc="Yon margin"},
    @{mm=3; desc="Kichik margin"},
    @{mm=5; desc="O'rtacha margin"}
)

Write-Host "┌────────────┬────────────┬─────────────────────────────┐" -ForegroundColor White
Write-Host "│ Millimetr  │   Inch     │   Ishlatilishi              │" -ForegroundColor White
Write-Host "├────────────┼────────────┼─────────────────────────────┤" -ForegroundColor White

foreach ($size in $commonSizes) {
    $inch = Convert-MmToInch $size.mm
    Write-Host ("│ {0,7} mm │ {1,7} in │ {2,-27} │" -f $size.mm, $inch, $size.desc) -ForegroundColor Cyan
}

Write-Host "└────────────┴────────────┴─────────────────────────────┘" -ForegroundColor White
Write-Host ""

# Interaktiv kalkulyator
Write-Host "=== INTERAKTIV KALKULYATOR ===" -ForegroundColor Yellow
Write-Host ""
Write-Host "Tanlang:" -ForegroundColor White
Write-Host "  [1] MM → INCH" -ForegroundColor Cyan
Write-Host "  [2] INCH → MM" -ForegroundColor Cyan
Write-Host "  [0] Chiqish" -ForegroundColor Red
Write-Host ""

do {
    $choice = Read-Host "Tanlov"
    
    switch ($choice) {
        "1" {
            Write-Host ""
            $mm = Read-Host "Millimetr (mm) kiriting"
            if ($mm -match '^\d+\.?\d*$') {
                $inch = Convert-MmToInch ([double]$mm)
                Write-Host ""
                Write-Host "═══════════════════════════════════" -ForegroundColor Green
                Write-Host "  $mm mm = $inch inch" -ForegroundColor Yellow
                Write-Host "═══════════════════════════════════" -ForegroundColor Green
                Write-Host ""
            } else {
                Write-Host "Noto'g'ri qiymat!" -ForegroundColor Red
            }
        }
        "2" {
            Write-Host ""
            $inch = Read-Host "Inch (in) kiriting"
            if ($inch -match '^\d+\.?\d*$') {
                $mm = Convert-InchToMm ([double]$inch)
                Write-Host ""
                Write-Host "═══════════════════════════════════" -ForegroundColor Green
                Write-Host "  $inch inch = $mm mm" -ForegroundColor Yellow
                Write-Host "═══════════════════════════════════" -ForegroundColor Green
                Write-Host ""
            } else {
                Write-Host "Noto'g'ri qiymat!" -ForegroundColor Red
            }
        }
        "0" {
            Write-Host ""
            Write-Host "Xayr! 👋" -ForegroundColor Green
            Write-Host ""
            break
        }
        default {
            Write-Host "Noto'g'ri tanlov!" -ForegroundColor Red
        }
    }
    
    if ($choice -ne "0") {
        Write-Host "Yana hisoblashni xohlaysizmi? (y/n)" -ForegroundColor Yellow
        $continue = Read-Host
        if ($continue -ne 'y') {
            Write-Host ""
            Write-Host "Xayr! 👋" -ForegroundColor Green
            Write-Host ""
            break
        }
        Write-Host ""
        Write-Host "Tanlang:" -ForegroundColor White
        Write-Host "  [1] MM → INCH" -ForegroundColor Cyan
        Write-Host "  [2] INCH → MM" -ForegroundColor Cyan
        Write-Host "  [0] Chiqish" -ForegroundColor Red
        Write-Host ""
    }
} while ($choice -ne "0")
