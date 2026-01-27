# Keshni tozalash va to'g'ri ko'rinishni olish

## Muammo
Brauzer eski HTML/JavaScript keshini ko'rsatyapti. Kod to'g'ri, lekin brauzer yangilanmagan.

## Yechim

### 1. Vite keshini tozaladim ✅
```
client/node_modules/.vite - o'chirildi
client/dist - o'chirildi
```

### 2. Dev serverni to'liq qayta ishga tushiring

**Agar dev server ishlab turgan bo'lsa:**
1. Terminal oynasini toping (npm run dev yoki vite ishlab turgan)
2. `Ctrl+C` bosing (serverini to'xtatish)
3. Quyidagi buyruqni bajaring:

```bash
cd client
npm run dev
```

### 3. Brauzerni to'liq yangilang

**Chrome/Edge:**
- `Ctrl + Shift + R` (hard refresh)
- Yoki `Ctrl + F5`
- Yoki DevTools ochib (F12), Network tabda "Disable cache" ni belgilang va sahifani yangilang

**Yoki Incognito rejimda oching:**
- `Ctrl + Shift + N` (Chrome/Edge)
- `http://localhost:5173/cashier/products` ga o'ting

### 4. Agar hali ham eski ko'rinish chiqsa

Browser keshini to'liq tozalang:
1. `Ctrl + Shift + Delete`
2. "Cached images and files" ni tanlang
3. "Clear data" bosing
4. Brauzerni yoping va qayta oching

## Kassir versiyasida bo'lishi kerak:

### ✅ To'g'ri (8 ustun):
```
Rasm | Kod | Nomi | Tan narxi | Optom narxi | Dona narxi | Miqdori | Amallar
```

### ❌ Noto'g'ri (9 ustun - eski kesh):
```
Rasm | Kod | Nomi | Ombor | Tan narxi | Optom narxi | Dona narxi | Miqdori | Amallar
```

## Kod to'g'ri!

Kassir versiyasida:
- ✅ 8 ustun (ombor yo'q)
- ✅ Dona narxi ustuni bor
- ✅ Grid template: `'auto 80px 1fr 110px 110px 110px 90px 140px'`
- ✅ Hech qanday `` `r`n `` yoki `\r\n` yo'q
- ✅ Backend dona_narx qaytaryapti

Muammo faqat brauzer keshida!
