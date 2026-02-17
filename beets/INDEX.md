# 📚 Beets - Funksiyalar Indeksi

Bu fayl barcha hujjatlashtirilgan funksiyalar va modullarning to'liq ro'yxatini o'z ichiga oladi.

## 🎯 Tezkor Navigatsiya

### Backend
- [Utils](#backend-utils)
- [Middleware](#backend-middleware)
- [Services](#backend-services)
- [Models](#backend-models)

### Frontend
- [Utils](#frontend-utils)
- [Hooks](#frontend-hooks)
- [Context](#frontend-context)
- [Components](#frontend-components)

---

## Backend Utils

### logger.js
**Fayl**: `beets/backend/utils/logger.md`

Winston asosida yaratilgan logging tizimi.

**Funksiyalar**:
- `logger.error()` - Xatolarni log qilish
- `logger.warn()` - Ogohlantirishlar
- `logger.info()` - Umumiy ma'lumot
- `logger.debug()` - Debug ma'lumotlari

**Qachon ishlatish**: Barcha xatolar, muhim operatsiyalar, debug

---

### errors.js
**Fayl**: `beets/backend/utils/errors.md`

Custom error classlar.

**Classlar**:
- `AppError` - Asosiy error class
- `ValidationError` - Validatsiya xatolari (400)
- `AuthenticationError` - Autentifikatsiya xatolari (401)
- `AuthorizationError` - Avtorizatsiya xatolari (403)
- `NotFoundError` - Ma'lumot topilmadi (404)
- `ConflictError` - Konflikt xatolari (409)
- `DatabaseError` - Database xatolari (500)

**Qachon ishlatish**: Barcha xatolar uchun

---

### asyncHandler.js
**Fayl**: `beets/backend/utils/asyncHandler.md`

Async funksiyalarni wrap qilish va xatolarni avtomatik catch qilish.

**Funksiya**:
- `asyncHandler(fn)` - Async funksiyani wrap qiladi

**Qachon ishlatish**: Barcha async controller funksiyalari

---

## Backend Middleware

### errorHandler.js
**Fayl**: `beets/backend/middleware/errorHandler.md`

Markazlashtirilgan xatolarni boshqarish.

**Funksiya**:
- `errorHandler(err, req, res, next)` - Barcha xatolarni handle qiladi

**Handle qilinadigan xatolar**:
- Mongoose CastError
- Mongoose Duplicate Key
- Mongoose ValidationError
- JWT Errors
- Multer Errors
- Custom Errors

**Qachon ishlatish**: Express app da oxirgi middleware

---

### auth.js
**Fayl**: `beets/backend/middleware/auth.md`

Autentifikatsiya va avtorizatsiya.

**Funksiyalar**:
- `auth(req, res, next)` - JWT token tekshirish
- `authorize(...roles)` - Rol asosida ruxsat
- `optionalAuth(req, res, next)` - Optional autentifikatsiya

**Qachon ishlatish**: Protected routelar uchun

---

### security.js
**Fayl**: `beets/backend/middleware/security.md`

Xavfsizlik choralari.

**Funksiyalar**:
- `apiLimiter` - API rate limiting (100/15min)
- `authLimiter` - Auth rate limiting (5/15min)
- `helmetConfig` - Security headers
- `sanitizeInput` - XSS himoyasi

**Qachon ishlatish**: Barcha API endpointlari

---

## Frontend Utils

### api.ts
**Fayl**: `beets/frontend/utils/api.md`

Backend bilan aloqa (Axios).

**Funksiyalar**:
- `api.get(url, config)` - GET request
- `api.post(url, data, config)` - POST request
- `api.put(url, data, config)` - PUT request
- `api.delete(url, config)` - DELETE request

**Interceptors**:
- Request: JWT token qo'shish
- Response: 401 xatolarni handle qilish

**Qachon ishlatish**: Barcha API so'rovlar

---

### socket.ts
**Fayl**: `beets/frontend/utils/socket.md`

Real-time aloqa (Socket.IO).

**Funksiyalar**:
- `initSocket()` - Socket yaratish
- `getSocket()` - Socket olish
- `disconnectSocket()` - Socket yopish

**Events**:
- `product-updated` - Mahsulot yangilandi
- `inventory:updated` - Inventar yangilandi
- `debt-updated` - Qarz yangilandi
- `receipt-created` - Yangi chek

**Qachon ishlatish**: Real-time yangilanishlar kerak bo'lganda

---

### memoryOptimizer.ts
**Fayl**: `beets/frontend/utils/memoryOptimizer.md` (yaratilmagan)

Xotira optimizatsiyasi.

**Funksiyalar**:
- `limitArraySize()` - Array hajmini cheklash
- `clearLargeCache()` - Katta cache tozalash
- `monitorMemory()` - Xotira monitoringi
- `startMemoryMonitoring()` - Monitoring boshlash
- `stopMemoryMonitoring()` - Monitoring to'xtatish

**Qachon ishlatish**: Katta ma'lumotlar bilan ishlashda

---

## Frontend Hooks

### useToast
**Fayl**: `beets/frontend/hooks/useToast.md`

Toast bildirishnomalar.

**Funksiyalar**:
- `success(title, message?, duration?)` - Muvaffaqiyat xabari
- `error(title, message?, duration?)` - Xato xabari
- `info(title, message?, duration?)` - Ma'lumot xabari
- `warning(title, message?, duration?)` - Ogohlantirish xabari
- `removeToast(id)` - Toast o'chirish

**Qachon ishlatish**: Foydalanuvchiga xabar ko'rsatish

---

### useDebounce
**Fayl**: `beets/frontend/hooks/useDebounce.md`

Qiymatni kechiktirish (debounce).

**Funksiya**:
- `useDebounce(value, delay)` - Qiymatni debounce qilish

**Qachon ishlatish**: Qidiruv, filtrlash, API so'rovlar

---

### useAlert
**Fayl**: `beets/frontend/hooks/useAlert.md` (yaratilmagan)

Alert modal ko'rsatish.

**Qachon ishlatish**: Tasdiqlash, ogohlantirish

---

### useOffline
**Fayl**: `beets/frontend/hooks/useOffline.md` (yaratilmagan)

Offline rejimni aniqlash.

**Qachon ishlatish**: PWA, offline support

---

## Frontend Features

### Sales and Returns
**Fayl**: `beets/frontend/features/sales-and-returns.md`

Mahsulot sotish va qaytarish (vozvrat) funksiyalari.

**Asosiy Funksiyalar**:
- `handlePayment()` - To'lov jarayoni
- `addToCart()` - Savatga qo'shish
- `addToReturn()` - Qaytarishga qo'shish
- `loadPurchaseToCart()` - Xarid tarixidan yuklash
- `toggleReturnMode()` - Qaytarish rejimini yoqish/o'chirish

**Backend Endpoints**:
- `POST /api/receipts` - Savdo yaratish
- `POST /api/receipts/:id/return` - Mahsulot qaytarish

**Xususiyatlar**:
- Naqd, karta, aralash to'lov
- Qarz boshqaruvi
- Qisman va to'liq qaytarish
- Real-time inventar yangilanishi
- Chek chop etish

**Qachon ishlatish**: POS (Kassa) tizimida

---

### Kassa Improvements (2024-02-15)
**Fayl**: `beets/features/kassa-improvements-2024-02-15.md`

Kassa tizimi yaxshilanishlari.

---

### Search Optimization (2024-02-15 v2)
**Fayl**: `beets/features/search-optimization-2024-02-15.md`

Qidiruv tizimidagi "aniq qidirish" va "variantlarni cheklash" optimizatsiyasi.
- Raqamlar uchun aniq narx va kod mosligi.
- Nomlar uchun so'z chegaralari (word boundaries).
- Noiseless results (ortiqcha natijalarsiz).

---

## Frontend Context

### AuthContext
**Fayl**: `beets/frontend/context/AuthContext.md` (yaratilmagan)

Autentifikatsiya state.

**Funksiyalar**:
- `login()` - Kirish
- `logout()` - Chiqish
- `updateUser()` - User yangilash

---

### ProductsContext
**Fayl**: `beets/frontend/context/ProductsContext.md` (yaratilmagan)

Mahsulotlar state.

**Funksiyalar**:
- `fetchProducts()` - Mahsulotlarni yuklash
- `refreshProducts()` - Yangilash
- `clearCache()` - Cache tozalash

---

### CustomersContext
**Fayl**: `beets/frontend/context/CustomersContext.md` (yaratilmagan)

Mijozlar state.

---

### WarehousesContext
**Fayl**: `beets/frontend/context/WarehousesContext.md` (yaratilmagan)

Omborlar state.

---

## Yangi Hujjat Qo'shish

Yangi funksiya yoki modul qo'shganingizda:

1. Tegishli papkada `.md` fayl yarating
2. Quyidagi strukturani ishlating:
   - Maqsad
   - Joylashuv
   - Funksiyalar/Classlar
   - Ishlatish misollari
   - Muhim eslatmalar
   - Bog'liq modullar
   - Best practices

3. Ushbu INDEX.md ga qo'shing

---

## Hujjatlar Statistikasi

**Yaratilgan**: 11 ta hujjat
**Yaratilmagan**: 6 ta hujjat (rejalashtirilgan)

### Yaratilgan Hujjatlar
- ✅ backend/utils/logger.md
- ✅ backend/utils/errors.md
- ✅ backend/utils/asyncHandler.md
- ✅ backend/middleware/errorHandler.md
- ✅ backend/middleware/auth.md
- ✅ backend/middleware/security.md
- ✅ frontend/utils/api.md
- ✅ frontend/utils/socket.md
- ✅ frontend/hooks/useToast.md
- ✅ frontend/hooks/useDebounce.md
- ✅ frontend/features/sales-and-returns.md

### Rejalashtirilgan Hujjatlar
- ⏳ frontend/utils/memoryOptimizer.md
- ⏳ frontend/hooks/useAlert.md
- ⏳ frontend/hooks/useOffline.md
- ⏳ frontend/context/AuthContext.md
- ⏳ frontend/context/ProductsContext.md
- ⏳ backend/services/product.service.md

---

**Oxirgi yangilanish**: 2024
**Versiya**: 1.0.0
