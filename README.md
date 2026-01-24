# Universal.uz - Biznes Boshqaruv Tizimi

Zamonaviy biznes boshqaruv tizimi: kassa, ombor, mijozlar, qarzlar va buyurtmalar.

## Xususiyatlar

- 📊 **Statistika** - Sotuvlar, daromad, top mahsulotlar
- 🛒 **Kassa (POS)** - Tez va qulay savdo
- 📦 **Tovarlar** - Mahsulotlarni boshqarish
- 🏭 **Omborlar** - Ombor hisobi
- 👥 **Mijozlar** - Mijozlar bazasi
- 💳 **Qarz daftarcha** - Qarzlarni kuzatish
- 📋 **Buyurtmalar** - Marketplace buyurtmalari
- 👷 **Yordamchilar** - Xodimlarni boshqarish

## Rollar

| Rol | Huquqlar |
|-----|----------|
| Admin | Barcha funksiyalar |
| Kassir | Kassa, Qarzlar, Xodimlar cheklari |
| Yordamchi | QR skaner, Tovar qidirish, Kassaga yuborish |

## O'rnatish

```bash
# Barcha paketlarni o'rnatish
npm run install:all

# .env faylini sozlash
cp server/.env.example server/.env
# Keyin server/.env faylini tahrirlang va o'z ma'lumotlaringizni kiriting:
# - MONGODB_URI (MongoDB connection string)
# - JWT_SECRET (kuchli tasodifiy string)
# - TELEGRAM_BOT_TOKEN (Telegram bot token)
# - BASE_URL (server URL)

# Ishga tushirish
npm run dev
```

## ⚠️ XAVFSIZLIK

**MUHIM:** Quyidagi fayllar GitHub'ga push bo'lmaydi (`.gitignore` da):

### Maxfiy fayllar:
- ✅ `.env` - Environment variables (parollar, tokenlar)
- ✅ `server/.env` - Server sozlamalari
- ✅ `server/.telegram_*` - Telegram ma'lumotlari
- ✅ `server/uploads/` - Yuklangan fayllar
- ✅ `server/temp/` - Vaqtinchalik fayllar
- ✅ `node_modules/` - Dependencies

### GitHub'ga push bo'ladigan fayllar:
- ✅ `.env.example` - Namuna fayl (maxfiy ma'lumotlarsiz)
- ✅ Barcha kod fayllari
- ✅ README.md va dokumentatsiya

**Agar `.env` fayl allaqachon GitHub'ga push bo'lgan bo'lsa:**
```bash
# 1. Git history'dan o'chirish
git rm --cached server/.env
git commit -m "Remove .env from git"
git push

# 2. Barcha parollarni o'zgartiring!
# - MongoDB parol
# - JWT secret
# - Telegram bot tokenlar
```

## Deploy (Linux Server)

```bash
# Deploy qilish
bash deploy/deploy.sh

# Printerlarni sozlash (agar kerak bo'lsa)
sudo bash deploy/setup-printer.sh
```

**⚠️ Muhim:** Linux serverda printerlar ishlamasa, ko'rsatmaga qarang:
- O'zbek: `PRINTER_FIX_UZ.md`
- Русский: `PRINTER_FIX_README.md`
- Tezkor: `QUICK_FIX.md`

## Texnologiyalar

- **Frontend:** React, TypeScript, Tailwind CSS, Recharts
- **Backend:** Node.js, Express, MongoDB, JWT
- **QR Scanner:** html5-qrcode

## Loyiha tuzilishi

```
universal-uz/
├── client/          # React frontend
│   └── src/
│       ├── components/
│       ├── context/
│       ├── layouts/
│       ├── pages/
│       ├── types/
│       └── utils/
├── server/          # Node.js backend
│   └── src/
│       ├── middleware/
│       ├── models/
│       └── routes/
└── .env             # Sozlamalar
```
