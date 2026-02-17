# 🏪 Universal UZ - POS System

O'zbekiston bozori uchun zamonaviy POS (Point of Sale) tizimi.

## 📚 Hujjatlar

Loyiha haqida to'liq ma'lumot uchun quyidagi hujjatlarni o'qing:

- **[agents.md](./agents.md)** - Loyiha haqida to'liq ma'lumot (texnologiya, arxitektura, API, xavfsizlik)
- **[beets/](./beets/)** - Har bir funksiya va modul haqida batafsil hujjatlar

## 🚀 Tezkor Boshlash

### O'rnatish

```bash
# Barcha dependencies ni o'rnatish
npm run install:all

# Development rejimda ishga tushirish
npm run dev
```

### Environment Variables

**Backend** (`server/.env`):
```env
NODE_ENV=development
PORT=5050
MONGODB_URI=mongodb://localhost:27017/universal_uz
JWT_SECRET=your-super-secret-key
CLIENT_URL=http://localhost:5173
```

**Frontend** (`client/.env`):
```env
VITE_API_URL=http://localhost:5050
```

## 🎯 Asosiy Xususiyatlar

- ✅ Multi-warehouse management
- ✅ POS system
- ✅ Customer & debt tracking
- ✅ Real-time updates (Socket.IO)
- ✅ Telegram integration
- ✅ Receipt printing
- ✅ Role-based access (Admin, Cashier, Helper)
- ✅ Offline support (PWA)
- ✅ **PWA - Ilovani o'rnatish** (yangi!)

## 📱 PWA - Ilovani O'rnatish

Universal.uz ni telefoningizga yoki kompyuteringizga oddiy ilova kabi o'rnatishingiz mumkin!

### Mobil (Android/iOS)

1. Saytga kiring: `https://pos.universalbozor.uz`
2. Pastda "O'rnatish" dialog paydo bo'ladi
3. "O'rnatish" tugmasini bosing
4. Ilova home screen ga qo'shiladi

**iOS Safari uchun**:
- Share tugmasini bosing (pastdagi o'rta tugma)
- "Add to Home Screen" ni tanlang

### Desktop (Chrome/Edge)

1. Saytga kiring
2. Address bar da o'rnatish ikonkasi (⊕) paydo bo'ladi
3. Ikonkani bosing va "O'rnatish" ni tanlang

### Afzalliklar

- ⚡ Tez yuklash (keshdan)
- 📴 Offline ishlash
- 🎨 Ilova kabi tajriba
- 🏠 Home screen da
- 🚫 Brauzer UI yo'q

Batafsil: [beets/features/pwa-install-2024-02-17.md](./beets/features/pwa-install-2024-02-17.md)

## 📖 Yangi Dasturchilar Uchun

1. **[agents.md](./agents.md)** ni o'qing - loyiha haqida umumiy ma'lumot
2. **[beets/README.md](./beets/README.md)** ni o'qing - funksiyalar hujjatlari
3. **[beets/INDEX.md](./beets/INDEX.md)** dan kerakli funksiyani toping
4. Development environment o'rnating va ishni boshlang

## 🛠️ Texnologiyalar

**Backend**: Node.js, Express, MongoDB, Socket.IO, JWT  
**Frontend**: React 18, TypeScript, Vite, Tailwind CSS  
**Real-time**: Socket.IO  
**Security**: Helmet, Rate Limiting, JWT

## 📞 Aloqa

- Email: support@universal-uz.com
- GitHub Issues: Muammo yarating

---

**Eslatma**: To'liq hujjatlar uchun [agents.md](./agents.md) va [beets/](./beets/) papkasini ko'ring.
