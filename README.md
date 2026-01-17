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
# MONGODB_URI ni o'zgartiring

# Ishga tushirish
npm run dev
```

## Deploy (Linux Server)

```bash
# Deploy qilish
bash deploy/deploy.sh

# Printerlarni sozlash (agar kerak bo'lsa)
sudo bash deploy/setup-printer.sh
```

## 🖨️ Printer sozlash

### Variant 1: QZ Tray (tavsiya etiladi)

**QZ Tray** - brauzerdan to'g'ridan-to'g'ri chop etish uchun professional yechim.

1. **Yuklab oling:** https://qz.io/download/
2. **O'rnating** (bir marta)
3. **Tayyor!** Chop etish avtomatik ishlaydi

📖 Ko'rsatma: `QZ_TRAY_SETUP.md`

### Variant 2: Server orqali (Linux)

Agar QZ Tray o'rnatilmagan bo'lsa:

```bash
sudo bash deploy/setup-printer.sh
```

**⚠️ Muhim:** 
- **QZ Tray:** Istalgan kompyuterda ishlaydi ✅
- **Server:** Faqat serverga ulangan printerlar ❌

📖 Ko'rsatmalar:
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
