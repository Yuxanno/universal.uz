# 🤖 Universal UZ - Loyiha Hujjatlari

## 📋 Loyiha Haqida

**Universal UZ** - O'zbekiston bozori uchun mo'ljallangan zamonaviy POS (Point of Sale) tizimi. Bu tizim chakana savdo korxonalari uchun to'liq yechim bo'lib, inventarizatsiya boshqaruvi, mijozlar bilan ishlash, qarz nazorati va real vaqt yangilanishlarni o'z ichiga oladi.

## 🎯 Asosiy Maqsad

Kichik va o'rta biznes uchun sodda, tez va ishonchli savdo tizimini yaratish. Tizim offline rejimda ham ishlashi va bir nechta ombor bilan ishlash imkoniyatini beradi.

## 🏗️ Texnologik Stack

### Backend (Server)
- **Runtime**: Node.js
- **Framework**: Express.js
- **Ma'lumotlar bazasi**: MongoDB + Mongoose ODM
- **Real-time aloqa**: Socket.IO
- **Autentifikatsiya**: JWT (JSON Web Tokens)
- **Validatsiya**: Joi
- **Logging**: Winston
- **Xavfsizlik**: Helmet, express-rate-limit

### Frontend (Client)
- **Framework**: React 18
- **Til**: TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **State Management**: Context API
- **Routing**: React Router v6
- **Real-time**: Socket.IO Client

### Tashqi Xizmatlar
- **Telegram Bot API**: Mijozlarga bildirishnomalar
- **Thermal Printer**: Chek chop etish

## 📁 Loyiha Strukturasi

```
universal-uz/
├── client/                 # Frontend (React + TypeScript)
│   ├── src/
│   │   ├── components/    # Qayta ishlatiladigan komponentlar
│   │   ├── pages/         # Sahifa komponentlari
│   │   ├── context/       # Global state (Context API)
│   │   ├── hooks/         # Custom React hooks
│   │   ├── utils/         # Yordamchi funksiyalar
│   │   └── types/         # TypeScript type definitions
│   └── package.json
│
├── server/                # Backend (Node.js + Express)
│   ├── src/
│   │   ├── config/       # Konfiguratsiya
│   │   ├── controllers/  # HTTP request handlers
│   │   ├── services/     # Business logic
│   │   ├── models/       # MongoDB models
│   │   ├── routes/       # API routes
│   │   ├── middleware/   # Express middleware
│   │   ├── validators/   # Request validation
│   │   ├── utils/        # Yordamchi funksiyalar
│   │   └── telegram/     # Telegram bot
│   ├── scripts/          # Database scripts
│   └── package.json
│
├── beets/                # Funksiyalar hujjatlari (yangi)
├── agents.md             # Ushbu fayl
├── ARCHITECTURE.md       # Arxitektura hujjati
└── README.md            # Asosiy README
```

## 👥 Foydalanuvchi Rollari

### 1. Admin (Administrator)
- **Ruxsatlar**: To'liq tizim nazorati
- **Funksiyalar**:
  - Barcha mahsulotlarni boshqarish
  - Omborlarni boshqarish
  - Mijozlar va qarzlarni ko'rish
  - Xodimlarni boshqarish
  - Hisobotlarni ko'rish
  - Tizim sozlamalarini o'zgartirish

### 2. Kassir (Cashier)
- **Ruxsatlar**: Savdo operatsiyalari
- **Funksiyalar**:
  - Mahsulot sotish (POS)
  - Mijozlarni qo'shish/tahrirlash
  - Qarzlarni ko'rish va to'lovlarni qabul qilish
  - Chek chop etish
  - O'z savdo hisobotlarini ko'rish

### 3. Yordamchi (Helper)
- **Ruxsatlar**: Cheklangan
- **Funksiyalar**:
  - Mahsulot skanerlash
  - Mahsulot ma'lumotlarini ko'rish

## 🗄️ Ma'lumotlar Bazasi Strukturasi

### Asosiy Collections

#### 1. Products (Mahsulotlar)
```javascript
{
  code: String,              // Mahsulot kodi (unique)
  name: String,              // Mahsulot nomi (unique)
  price: Number,             // Optom narxi
  costPrice: Number,         // Tan narxi
  dona_narx: Number,         // Chakana narxi
  quantity: Number,          // Miqdor
  warehouse: ObjectId,       // Ombor
  soldCount: Number,         // Sotilgan miqdor
  variants: Array,           // Mahsulot turlari
  packages: Array,           // Qop ma'lumotlari
  images: Array,             // Rasmlar
  minStock: Number,          // Minimal zaxira
  createdBy: ObjectId        // Kim yaratgan
}
```

#### 2. Customers (Mijozlar)
```javascript
{
  name: String,              // Mijoz ismi
  phone: String,             // Telefon (unique)
  email: String,             // Email
  address: String,           // Manzil
  debt: Number,              // Qarz miqdori
  totalPurchases: Number,    // Jami xaridlar
  purchaseHistory: Array,    // Xarid tarixi
  createdBy: ObjectId        // Kim yaratgan
}
```

#### 3. Debts (Qarzlar)
```javascript
{
  customer: ObjectId,        // Mijoz
  amount: Number,            // Qarz miqdori
  paidAmount: Number,        // To'langan miqdor
  status: String,            // Holat (pending/paid/overdue)
  type: String,              // Tur (receivable/payable)
  dueDate: Date,             // Muddat
  payments: Array,           // To'lovlar tarixi
  receipt: ObjectId,         // Chek
  createdBy: ObjectId        // Kim yaratgan
}
```

#### 4. Receipts (Cheklar)
```javascript
{
  items: Array,              // Mahsulotlar ro'yxati
  total: Number,             // Jami summa
  paymentMethod: String,     // To'lov usuli
  cashAmount: Number,        // Naqd pul
  cardAmount: Number,        // Karta
  debtAmount: Number,        // Qarz
  customer: ObjectId,        // Mijoz
  status: String,            // Holat
  isReturn: Boolean,         // Qaytarish
  createdBy: ObjectId        // Kim yaratgan
}
```

#### 5. Warehouses (Omborlar)
```javascript
{
  name: String,              // Ombor nomi
  address: String,           // Manzil
  isMain: Boolean,           // Asosiy ombor
  products: Array            // Mahsulotlar
}
```

#### 6. Users (Foydalanuvchilar)
```javascript
{
  name: String,              // Ism
  phone: String,             // Telefon (unique)
  password: String,          // Parol (hashed)
  role: String,              // Rol (admin/cashier/helper)
  image: String,             // Profil rasmi
  createdBy: ObjectId        // Kim yaratgan
}
```

## 🔐 Xavfsizlik

### Autentifikatsiya
- JWT token asosida
- Admin: Session storage (browser yopilganda o'chadi)
- Kassir/Helper: Local storage (saqlanib qoladi)
- Token muddati: 7 kun (admin/kassir), 5 yil (helper)

### Avtorizatsiya
- Rol asosida ruxsatlar
- Middleware orqali tekshirish
- Route-level protection

### Xavfsizlik Choralari
1. Input validatsiya (Joi)
2. XSS himoyasi
3. Rate limiting (100 request/15 min)
4. Auth rate limiting (5 login/15 min)
5. Helmet.js security headers
6. CORS cheklash
7. Parol hashing (bcrypt)

## 🔄 Real-time Yangilanishlar

Socket.IO orqali real-time yangilanishlar:

### Events
- `product-updated`: Mahsulot o'zgardi
- `inventory:updated`: Inventar yangilandi
- `debt-updated`: Qarz holati o'zgardi
- `receipt-created`: Yangi chek yaratildi

### Ishlash Prinsipi
```
Client A → Socket.IO Server → Client B
              ↓
          Database
```

## 📊 API Endpoints

### Autentifikatsiya
```
POST   /api/auth/login          # Kirish
GET    /api/auth/me             # Joriy foydalanuvchi
POST   /api/auth/logout         # Chiqish
```

### Mahsulotlar (v2 - Yangilangan)
```
GET    /api/v2/products         # Ro'yxat
GET    /api/v2/products/:id     # Bitta mahsulot
POST   /api/v2/products         # Yaratish
PUT    /api/v2/products/:id     # Yangilash
DELETE /api/v2/products/:id     # O'chirish
GET    /api/v2/products/next-code  # Keyingi kod
```

### Mijozlar
```
GET    /api/customers           # Ro'yxat
GET    /api/customers/:id       # Bitta mijoz
POST   /api/customers           # Yaratish
PUT    /api/customers/:id       # Yangilash
DELETE /api/customers/:id       # O'chirish
```

### Qarzlar
```
GET    /api/debts               # Ro'yxat
GET    /api/debts/:id           # Bitta qarz
POST   /api/debts               # Yaratish
PUT    /api/debts/:id           # Yangilash
POST   /api/debts/:id/payment   # To'lov qo'shish
DELETE /api/debts/:id           # O'chirish
```

### Cheklar
```
GET    /api/receipts            # Ro'yxat
GET    /api/receipts/:id        # Bitta chek
POST   /api/receipts            # Yaratish
PUT    /api/receipts/:id        # Yangilash
DELETE /api/receipts/:id        # O'chirish
```

### Omborlar
```
GET    /api/warehouses          # Ro'yxat
GET    /api/warehouses/:id      # Bitta ombor
POST   /api/warehouses          # Yaratish
PUT    /api/warehouses/:id      # Yangilash
DELETE /api/warehouses/:id      # O'chirish
```

## 🎨 Frontend Komponentlar

### UI Komponentlar (client/src/components/ui/)
- **Button**: Tugmalar
- **Input**: Kiritish maydonlari
- **Modal**: Modal oynalar
- **Card**: Kartochkalar
- **Alert**: Ogohlantirishlar
- **Badge**: Belgilar
- **Table**: Jadvallar
- **Spinner**: Yuklanish animatsiyasi
- **Toast**: Bildirishnomalar

### POS Komponentlar (client/src/components/pos/)
- **CartItem**: Savatdagi mahsulot
- **PaymentModal**: To'lov oynasi
- **ProductSearchModal**: Mahsulot qidirish
- **CodeInput**: Kod kiritish

### Context Providers
- **AuthContext**: Autentifikatsiya
- **ProductsContext**: Mahsulotlar
- **CustomersContext**: Mijozlar
- **WarehousesContext**: Omborlar
- **LanguageContext**: Til

## 🔧 Yordamchi Funksiyalar

Barcha yordamchi funksiyalar `beets/` papkasida alohida fayllar sifatida hujjatlashtirilgan. Har bir fayl bitta funksiya yoki modul haqida to'liq ma'lumot beradi.

## 📈 Ishlash Optimizatsiyasi

### Backend
- MongoDB connection pooling
- Query optimization (indexes)
- Lean queries
- Pagination
- Response compression (gzip)

### Frontend
- Code splitting (React.lazy)
- Virtual scrolling
- Debounced search
- Session storage caching
- Image lazy loading
- Memory monitoring

## 🐛 Debugging va Logging

### Log Darajalari
- **error**: Kritik xatolar
- **warn**: Ogohlantirishlar
- **info**: Umumiy ma'lumot
- **debug**: Debug ma'lumotlari

### Log Fayllari (Production)
- `error.log`: Faqat xatolar
- `combined.log`: Barcha loglar

## 🚀 Deployment

### Environment Variables
```env
# Server
NODE_ENV=production
PORT=5050
MONGODB_URI=mongodb://...
JWT_SECRET=<strong-secret>
CLIENT_URL=https://...
TELEGRAM_BOT_TOKEN=...

# Client
VITE_API_URL=https://api.example.com
```

### Production Checklist
- [x] Kuchli JWT_SECRET o'rnatish
- [x] MongoDB connection string
- [x] NODE_ENV=production
- [x] CORS origin sozlash
- [ ] SSL/TLS sertifikatlari
- [ ] Reverse proxy (nginx)
- [ ] Process manager (PM2)
- [ ] Log rotation
- [ ] Automated backups
- [ ] Monitoring

## 📝 Yangi Funksiya Qo'shish

Yangi funksiya qo'shishda quyidagi qadamlarni bajaring:

1. **Backend**:
   - Model yaratish (`server/src/models/`)
   - Service yaratish (`server/src/services/`)
   - Controller yaratish (`server/src/controllers/`)
   - Validator yaratish (`server/src/validators/`)
   - Route yaratish (`server/src/routes/`)
   - `beets/` papkasiga hujjat qo'shish

2. **Frontend**:
   - Type yaratish (`client/src/types/`)
   - Context yaratish (agar kerak bo'lsa)
   - Component yaratish
   - API integration (`client/src/utils/api.ts`)
   - `beets/` papkasiga hujjat qo'shish

3. **Testing**:
   - Unit testlar yozish
   - Integration testlar yozish
   - Manual testing

## 🔄 Refactoring Jarayoni

Loyiha hozirda senior-level standartlarga ko'tarilmoqda:

### Bajarilgan
- ✅ Service layer yaratildi
- ✅ Controller layer yaratildi
- ✅ Validator layer yaratildi
- ✅ Error handling yaxshilandi
- ✅ Logging qo'shildi
- ✅ Security middleware qo'shildi

### Rejalashtirilgan
- [ ] Barcha endpointlarni v2 ga ko'chirish
- [ ] Unit testlar yozish
- [ ] Integration testlar yozish
- [ ] API documentation (Swagger)
- [ ] Caching layer (Redis)
- [ ] Message queue (Bull)

## 📚 Qo'shimcha Resurslar

- [README.md](./README.md) - Tezkor boshlash
- [beets/](./beets/) - Funksiyalar hujjatlari

## 🤝 Hissa Qo'shish

Yangi dasturchilar uchun:

1. Loyihani clone qiling
2. `agents.md` (ushbu fayl) ni o'qing
3. `beets/` papkasidagi funksiyalarni o'rganing
4. Development environment o'rnating
5. Yangi feature ustida ishlashdan oldin spec yarating

## 📞 Aloqa

Savollar yoki muammolar bo'lsa:
- Email: support@universal-uz.com
- GitHub Issues: Muammo yarating

---

**Eslatma**: Bu hujjat doimiy yangilanib turadi. Har qangi yangi funksiya yoki o'zgarish bu hujjatga va `beets/` papkasiga qo'shilishi kerak.

**Oxirgi yangilanish**: 2024
**Versiya**: 1.0.0
