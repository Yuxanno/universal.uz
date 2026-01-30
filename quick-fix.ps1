# Tez tuzatish - faqat stats.js faylini yuklash va restart

Write-Host "🚀 Bugungi statistika muammosini tuzatish..." -ForegroundColor Cyan

Write-Host "`n1️⃣ stats.js faylini VPS ga yuklash..." -ForegroundColor Yellow
scp server/src/routes/stats.js root@vmi3023927.contaboserver.net:/var/www/universalbozor/server/src/routes/stats.js

if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Fayl yuklandi" -ForegroundColor Green
} else {
    Write-Host "❌ Fayl yuklanmadi!" -ForegroundColor Red
    exit 1
}

Write-Host "`n2️⃣ VPS da serverni restart qilish..." -ForegroundColor Yellow
ssh root@vmi3023927.contaboserver.net @"
cd /var/www/universalbozor
echo '🔄 PM2 ni restart qilish...'
pm2 restart universalbozor-api
pm2 save
echo ''
echo '✅ Server restart qilindi'
echo ''
echo '📊 API ni tekshirish:'
curl -s http://localhost:5000/api/stats | grep -o '"todaySales":[0-9]*' || echo 'API javob bermadi'
"@

Write-Host "`n✅ Tayyor!" -ForegroundColor Green
Write-Host "🌐 Brauzerda tekshiring: https://pos.universalbozor.uz" -ForegroundColor Cyan
Write-Host "💡 Agar hali ham 0 ko'rsatsa, Ctrl+Shift+R bosing (hard refresh)" -ForegroundColor Yellow
