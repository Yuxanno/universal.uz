# 📚 Beets - Funksiyalar Hujjatlari

Bu papka loyihadagi barcha funksiyalar, modullar va yordamchi kodlar haqida batafsil ma'lumot beradi. Har bir fayl bitta funksiya yoki modul haqida to'liq tushuntirish beradi.

## 🚀 Tezkor Boshlash

Yangi dasturchi sifatida quyidagi tartibda o'qing:

1. **[INDEX.md](./INDEX.md)** - Barcha hujjatlar ro'yxati
2. **Backend Asoslari**:
   - [logger.md](./backend/utils/logger.md) - Logging tizimi
   - [errors.md](./backend/utils/errors.md) - Xatolarni boshqarish
   - [asyncHandler.md](./backend/utils/asyncHandler.md) - Async wrapper
3. **Backend Middleware**:
   - [auth.md](./backend/middleware/auth.md) - Autentifikatsiya
   - [errorHandler.md](./backend/middleware/errorHandler.md) - Error handling
   - [security.md](./backend/middleware/security.md) - Xavfsizlik
4. **Frontend Asoslari**:
   - [api.md](./frontend/utils/api.md) - API client
   - [socket.md](./frontend/utils/socket.md) - Real-time aloqa
5. **Frontend Hooks**:
   - [useToast.md](./frontend/hooks/useToast.md) - Bildirishnomalar
   - [useDebounce.md](./frontend/hooks/useDebounce.md) - Qidiruv optimizatsiyasi

## 📁 Struktura

```
beets/
├── README.md                    # Ushbu fayl
├── INDEX.md                     # Barcha hujjatlar indeksi
├── backend/                     # Backend funksiyalari
│   ├── utils/                   # Yordamchi funksiyalar
│   │   ├── logger.md           # ✅ Logging tizimi
│   │   ├── errors.md           # ✅ Custom error classes
│   │   └── asyncHandler.md     # ✅ Async wrapper
│   ├── middleware/              # Middleware funksiyalari
│   │   ├── auth.md             # ✅ Autentifikatsiya
│   │   ├── errorHandler.md     # ✅ Error handling
│   │   └── security.md         # ✅ Xavfsizlik
│   ├── services/                # Business logic
│   └── models/                  # Database models
└── frontend/                    # Frontend funksiyalari
    ├── utils/                   # Yordamchi funksiyalar
    │   ├── api.md              # ✅ API client
    │   └── socket.md           # ✅ Socket.IO client
    ├── hooks/                   # Custom React hooks
    │   ├── useToast.md         # ✅ Toast notifications
    │   └── useDebounce.md      # ✅ Debounce hook
    └── context/                 # Context providers
```

## 🎯 Maqsad

Har bir yangi dasturchi loyihaga qo'shilganda, u bu papkadagi fayllarni o'qib, tizimning qanday ishlashini tez va oson tushunib olishi mumkin.

## 📝 Qoidalar

1. Har bir yangi funksiya yoki modul uchun alohida fayl yarating
2. Fayl nomini funksiya nomiga mos qilib qo'ying
3. Har bir faylda quyidagilar bo'lishi kerak:
   - Funksiya nomi va maqsadi
   - Parametrlar va qaytariladigan qiymat
   - Ishlatish misollari
   - Bog'liq funksiyalar
   - Muhim eslatmalar

## 🔍 Fayllarni Qidirish

- Backend utils: `beets/backend/utils/`
- Backend middleware: `beets/backend/middleware/`
- Frontend utils: `beets/frontend/utils/`
- Frontend hooks: `beets/frontend/hooks/`

## 📖 Foydalanish

Yangi funksiya qo'shganingizda:
1. Tegishli papkada yangi `.md` fayl yarating
2. Quyidagi strukturani ishlating:
   ```markdown
   # Funksiya Nomi
   
   ## Maqsad
   Funksiya nima qiladi
   
   ## Joylashuv
   Fayl yo'li
   
   ## Funksiyalar
   Barcha funksiyalar va parametrlar
   
   ## Ishlatish
   Kod misollari
   
   ## Muhim Eslatmalar
   Eslatmalar va ogohlantirishlar
   
   ## Bog'liq Modullar
   Qaysi modullar bilan ishlaydi
   
   ## Best Practices
   To'g'ri va noto'g'ri misollar
   ```
3. [INDEX.md](./INDEX.md) ga qo'shing

## 📊 Statistika

**Yaratilgan hujjatlar**: 10 ta
- ✅ Backend Utils: 3 ta
- ✅ Backend Middleware: 3 ta
- ✅ Frontend Utils: 2 ta
- ✅ Frontend Hooks: 2 ta

**Rejalashtirilgan**: 6+ ta
- ⏳ Backend Services
- ⏳ Backend Models
- ⏳ Frontend Context
- ⏳ Frontend Components

## 🔍 Qidiruv

Funksiya nomini bilsangiz, [INDEX.md](./INDEX.md) dan toping.

Mavzu bo'yicha qidirish:
- **Xatolar**: errors.md, errorHandler.md
- **Autentifikatsiya**: auth.md
- **API**: api.md
- **Real-time**: socket.md
- **Bildirishnomalar**: useToast.md
- **Qidiruv**: useDebounce.md
- **Xavfsizlik**: security.md
- **Logging**: logger.md

## 🤝 Hissa Qo'shish

Yangi hujjat qo'shish:
1. Tegishli papkada `.md` fayl yarating
2. Yuqoridagi strukturani ishlating
3. INDEX.md ga qo'shing
4. Pull request yarating

---

**Eslatma**: Bu hujjatlar doimiy yangilanib turadi. Har qangi o'zgarish yoki yangi funksiya qo'shilganda, tegishli faylni yangilang.

**Oxirgi yangilanish**: 2024
**Versiya**: 1.0.0
