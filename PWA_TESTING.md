# PWA O'rnatish - Test Yo'riqnomasi

## 🎯 Tezkor Test

### 1. Development da Test (localhost)

```bash
cd client
npm run dev
```

Browser console ni oching va quyidagi loglarni kuzating:

```
🔧 [PWA] Component mounted
🔧 [PWA] Is standalone: false
🔧 [PWA] Protocol: http:
🔧 [PWA] Host: localhost:5173
🔧 [PWA] Event listener added
```

**3 soniyadan keyin** pastda PWA o'rnatish tugmasi paydo bo'lishi kerak.

### 2. Production da Test (HTTPS)

1. Saytga kiring: `https://pos.universalbozor.uz`
2. Console ni oching
3. Loglarni kuzating

**Agar beforeinstallprompt event ishlamasa:**
- Test rejimi avtomatik ishga tushadi
- "⚠️ Test rejimi" xabari ko'rsatiladi
- Tugma "Ko'rsatma" deb nomlanadi

### 3. PWA Tugmasi Ko'rinmasa

**Sabablari:**

1. **Allaqachon o'rnatilgan**
   - Console: `Is standalone: true`
   - Yechim: Ilovani o'chiring va qayta test qiling

2. **HTTPS yo'q**
   - Console: `Protocol: http:`
   - Yechim: HTTPS da test qiling yoki localhost ishlatiladi

3. **Service Worker xatosi**
   - DevTools → Application → Service Workers
   - Xatolarni tekshiring

4. **Manifest.json xatosi**
   - DevTools → Application → Manifest
   - Xatolarni tekshiring

5. **Brauzer qo'llab-quvvatlamaydi**
   - Safari (iOS) - cheklangan
   - Firefox - cheklangan
   - Chrome/Edge - to'liq qo'llab-quvvatlash

## 🔍 Batafsil Tekshirish

### Chrome DevTools

1. **Application Tab**
   - Manifest: Barcha maydonlar to'g'ri to'ldirilgan
   - Service Workers: Activated and running
   - Cache Storage: universal-static-v2, universal-dynamic-v2

2. **Console Tab**
   - PWA loglarini filtrlash: `🔧 [PWA]`
   - Xatolarni tekshirish

3. **Network Tab**
   - Offline rejimni test qilish
   - Cache dan yuklashni tekshirish

### Lighthouse Audit

1. DevTools → Lighthouse
2. "Progressive Web App" ni tanlang
3. "Analyze page load" ni bosing

**Kutilgan natija:**
- PWA score: 90+
- Installable: ✅
- Service Worker: ✅
- HTTPS: ✅
- Manifest: ✅

## 📱 Qurilmalarda Test

### Android (Chrome)

1. Saytga kiring
2. 3 soniyadan keyin pastda banner paydo bo'ladi
3. "O'rnatish" tugmasini bosing
4. Yoki: ⋮ → "Add to Home screen"

### iOS (Safari)

1. Saytga kiring
2. Share tugmasini bosing (pastdagi o'rta tugma)
3. "Add to Home Screen" ni tanlang
4. "Add" ni bosing

**Eslatma:** iOS da `beforeinstallprompt` event yo'q, shuning uchun test rejimi ishlatiladi.

### Desktop (Chrome/Edge)

1. Saytga kiring
2. Manzil satridagi ⊕ belgisini bosing
3. "O'rnatish" ni tanlang

## 🐛 Muammolarni Hal Qilish

### Tugma umuman ko'rinmaydi

```javascript
// Console da tekshiring:
console.log('Standalone:', window.matchMedia('(display-mode: standalone)').matches);
console.log('Protocol:', window.location.protocol);
console.log('Host:', window.location.host);
```

**Yechim:**
- Sahifani yangilang (Ctrl+Shift+R)
- Cache ni tozalang
- Service Worker ni unregister qiling va qayta register qiling

### "Test rejimi" xabari ko'rsatiladi

Bu normal - `beforeinstallprompt` event quyidagi sabablarga ko'ra ishlamagan:
- HTTP protokol (HTTPS emas)
- Allaqachon o'rnatilgan
- Brauzer qo'llab-quvvatlamaydi
- Engagement yetarli emas

**Yechim:** "Ko'rsatma" tugmasini bosing va qo'lda o'rnatish yo'riqnomasiga amal qiling.

### Service Worker xatosi

```bash
# Service Worker ni qayta register qilish
1. DevTools → Application → Service Workers
2. "Unregister" ni bosing
3. Sahifani yangilang
```

### Manifest xatosi

```bash
# Manifest ni tekshirish
1. DevTools → Application → Manifest
2. Xatolarni o'qing
3. client/public/manifest.json ni tuzating
```

## ✅ Muvaffaqiyatli O'rnatish Belgilari

1. **Console loglar:**
   ```
   🔧 [PWA] beforeinstallprompt event fired!
   🔧 [PWA] Showing install prompt
   🔧 [PWA] User choice: accepted
   🔧 [PWA] PWA installed successfully
   ```

2. **Home screen da ilova ikonkasi paydo bo'ladi**

3. **Standalone rejimda ochiladi** (brauzer UI yo'q)

4. **Console da:**
   ```
   🔧 [PWA] Is standalone: true
   ```

## 📊 Test Checklist

- [ ] Development da tugma ko'rinadi (3s ichida)
- [ ] Production da tugma ko'rinadi
- [ ] "O'rnatish" tugmasi ishlaydi
- [ ] "Keyinroq" tugmasi yashiradi
- [ ] Console loglar to'g'ri
- [ ] Service Worker ishlaydi
- [ ] Manifest xatosiz
- [ ] Offline rejim ishlaydi
- [ ] Cache to'g'ri ishlaydi
- [ ] Standalone rejimda ochiladi
- [ ] Home screen da ikonka ko'rinadi

## 🔗 Foydali Havolalar

- Chrome DevTools: F12
- Manifest validator: https://manifest-validator.appspot.com/
- PWA checklist: https://web.dev/pwa-checklist/
- Service Worker lifecycle: https://web.dev/service-worker-lifecycle/

---

**Eslatma:** Agar hali ham muammo bo'lsa, console loglarni screenshot qiling va xato xabarlarini yuboring.
