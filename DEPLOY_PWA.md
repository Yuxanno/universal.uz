# PWA Deploy Qilish Yo'riqnomasi

## 🚀 Tezkor Deploy

### 1. Client ni Build Qilish

```bash
cd client
npm run build
```

Bu `client/dist/` papkasini yaratadi.

### 2. Serverga Yuklash

```bash
# dist papkasini serverga yuklang
scp -r client/dist/* user@pos.universalbozor.uz:/var/www/universal-uz/client/dist/

# Yoki rsync bilan
rsync -avz --delete client/dist/ user@pos.universalbozor.uz:/var/www/universal-uz/client/dist/
```

### 3. Nginx ni Qayta Yuklash

```bash
ssh user@pos.universalbozor.uz
sudo systemctl reload nginx
```

## 📋 To'liq Deploy Jarayoni

### Lokal Mashinada

```bash
# 1. Oxirgi o'zgarishlarni commit qiling
git add .
git commit -m "feat: PWA install prompt added"
git push origin main

# 2. Client ni build qiling
cd client
npm run build

# 3. Build fayllarini tekshiring
ls -la dist/
# Quyidagilar bo'lishi kerak:
# - index.html
# - manifest.json
# - sw.js
# - logo.jpg
# - assets/
```

### Serverda

```bash
# 1. Serverga kiring
ssh user@pos.universalbozor.uz

# 2. Loyihani yangilang
cd /var/www/universal-uz
git pull origin main

# 3. Client dependencies ni o'rnating (agar kerak bo'lsa)
cd client
npm install

# 4. Build qiling
npm run build

# 5. Nginx konfiguratsiyasini tekshiring
sudo nginx -t

# 6. Nginx ni qayta yuklang
sudo systemctl reload nginx

# 7. PM2 ni qayta ishga tushiring (agar server o'zgardi)
pm2 restart universal-server
```

## 🔍 Deploy Tekshirish

### 1. Fayllar Mavjudligini Tekshirish

```bash
# Serverda
ls -la /var/www/universal-uz/client/dist/
ls -la /var/www/universal-uz/client/dist/manifest.json
ls -la /var/www/universal-uz/client/dist/sw.js
```

### 2. Brauzerda Tekshirish

1. Saytga kiring: `https://pos.universalbozor.uz`
2. Hard refresh: `Ctrl+Shift+R` (yoki `Cmd+Shift+R` Mac da)
3. Console ni oching (F12)
4. Quyidagi loglarni qidiring:

```
🔧 [PWA] Component mounted
🔧 [PWA] Is standalone: false
🔧 [PWA] Protocol: https:
🔧 [PWA] Host: pos.universalbozor.uz
🔧 [PWA] Event listener added
```

5. 3 soniya kuting - pastda PWA tugmasi paydo bo'lishi kerak

### 3. Manifest va Service Worker Tekshirish

Chrome DevTools:
1. F12 → Application tab
2. Manifest: Barcha maydonlar to'g'ri
3. Service Workers: Activated and running

Yoki URL orqali:
- `https://pos.universalbozor.uz/manifest.json`
- `https://pos.universalbozor.uz/sw.js`

## 🐛 Muammolarni Hal Qilish

### Muammo 1: Fayllar Topilmadi (404)

**Sabab:** Build fayllari serverga yuklanmagan

**Yechim:**
```bash
# Lokal mashinada
cd client
npm run build
scp -r dist/* user@pos.universalbozor.uz:/var/www/universal-uz/client/dist/
```

### Muammo 2: Eski Versiya Ko'rsatiladi

**Sabab:** Brauzer cache

**Yechim:**
```bash
# Brauzerda
1. Ctrl+Shift+R (hard refresh)
2. DevTools → Application → Clear storage → Clear site data
3. Sahifani yangilang
```

### Muammo 3: Service Worker Xatosi

**Sabab:** Service Worker ro'yxatdan o'tmagan

**Yechim:**
```bash
# DevTools → Console
navigator.serviceWorker.getRegistrations().then(registrations => {
  registrations.forEach(reg => reg.unregister());
  location.reload();
});
```

### Muammo 4: PWA Tugmasi Hali Ham Yo'q

**Tekshirish:**
```javascript
// Console da
console.log('App.tsx loaded:', !!document.querySelector('#root'));
console.log('PWAInstallPrompt imported:', typeof PWAInstallPrompt);
```

**Yechim:** Kod hali deploy qilinmagan. Yuqoridagi deploy qadamlarini bajaring.

## 📦 Nginx Konfiguratsiyasi

Nginx `/manifest.json` va `/sw.js` ni to'g'ri serve qilishi kerak:

```nginx
location / {
    root /var/www/universal-uz/client/dist;
    try_files $uri $uri/ /index.html;
    
    # PWA fayllar uchun to'g'ri MIME types
    location ~* \.(json)$ {
        add_header Content-Type application/json;
        add_header Cache-Control "public, max-age=0";
    }
    
    location ~* \.(js)$ {
        add_header Content-Type application/javascript;
        add_header Service-Worker-Allowed "/";
    }
}
```

## ✅ Deploy Muvaffaqiyatli Bo'ldi

Quyidagi belgilar deploy muvaffaqiyatli bo'lganini ko'rsatadi:

1. ✅ `https://pos.universalbozor.uz/manifest.json` ochiladi
2. ✅ `https://pos.universalbozor.uz/sw.js` ochiladi
3. ✅ Console da PWA loglari ko'rinadi
4. ✅ 3 soniyadan keyin PWA tugmasi paydo bo'ladi
5. ✅ DevTools → Application → Manifest xatosiz
6. ✅ DevTools → Application → Service Workers ishlaydi

## 🔄 Tez Deploy (Keyingi Safar)

```bash
# Lokal mashinada
cd client && npm run build && \
scp -r dist/* user@pos.universalbozor.uz:/var/www/universal-uz/client/dist/ && \
ssh user@pos.universalbozor.uz "sudo systemctl reload nginx"
```

Yoki script yarating:

```bash
# deploy-pwa.sh
#!/bin/bash
cd client
npm run build
rsync -avz --delete dist/ user@pos.universalbozor.uz:/var/www/universal-uz/client/dist/
ssh user@pos.universalbozor.uz "sudo systemctl reload nginx"
echo "✅ PWA deployed successfully!"
```

```bash
chmod +x deploy-pwa.sh
./deploy-pwa.sh
```

---

**Eslatma:** Har safar PWA kodini o'zgartirsangiz, yuqoridagi deploy jarayonini takrorlang.
