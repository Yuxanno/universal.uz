# 🧪 SAYTNI QANDAY TEST QILISH MUMKIN

## 📋 TEZKOR BOSHLASH

### 1. Saytni Ishga Tushirish

```bash
# Terminal 1: Backend
cd server
npm run dev:v2

# Terminal 2: Frontend
cd client
npm run dev
```

Sayt ochiladi: **http://localhost:5173**

---

## 🎯 TEST USULLARI

### 1️⃣ MANUAL TESTING (Qo'lda Test)
### 2️⃣ API TESTING (Postman/cURL)
### 3️⃣ AUTOMATED TESTING (Jest)
### 4️⃣ BROWSER TESTING (DevTools)
### 5️⃣ LOAD TESTING (Performance)

---

## 1️⃣ MANUAL TESTING (Qo'lda Test)

### A. Login Funksiyasi

#### Test Case 1: To'g'ri login
```
1. Saytni oching: http://localhost:5173
2. Login sahifasida:
   - Telefon: +998901234567
   - Parol: password123
3. "Kirish" tugmasini bosing

✅ Kutilgan natija:
   - Dashboard sahifasiga o'tadi
   - Foydalanuvchi nomi ko'rinadi
   - Menu ko'rinadi
```

#### Test Case 2: Noto'g'ri parol
```
1. Login sahifasida:
   - Telefon: +998901234567
   - Parol: wrongpassword
2. "Kirish" tugmasini bosing

✅ Kutilgan natija:
   - Xato xabari ko'rinadi
   - Login sahifasida qoladi
```

#### Test Case 3: Bo'sh maydonlar
```
1. Login sahifasida hech narsa yozmasdan "Kirish" bosing

✅ Kutilgan natija:
   - Validation xatolari ko'rinadi
   - "Telefon raqam kiritilishi shart"
   - "Parol kiritilishi shart"
```

### B. Mahsulotlar (Products)

#### Test Case 4: Mahsulotlar ro'yxati
```
1. Login qiling (admin yoki cashier)
2. "Mahsulotlar" menyusiga o'ting
3. Mahsulotlar ro'yxatini ko'ring

✅ Kutilgan natija:
   - Mahsulotlar ro'yxati ko'rinadi
   - Har bir mahsulotda: kod, nom, narx, miqdor
   - Search qutisi ishlaydi
   - Pagination ishlaydi
```

#### Test Case 5: Yangi mahsulot qo'shish
```
1. "Mahsulotlar" sahifasida
2. "+ Yangi mahsulot" tugmasini bosing
3. Formani to'ldiring:
   - Kod: 12345
   - Nom: Test Mahsulot
   - Narx: 50000
   - Ombor: tanlang
4. "Saqlash" tugmasini bosing

✅ Kutilgan natija:
   - Success xabari ko'rinadi
   - Yangi mahsulot ro'yxatda paydo bo'ladi
   - Modal yopiladi
```

#### Test Case 6: Dublikat kod
```
1. Mavjud mahsulot kodini qayta kiriting
2. "Saqlash" tugmasini bosing

✅ Kutilgan natija:
   - Xato xabari: "Kod allaqachon mavjud"
   - Mahsulot saqlanmaydi
```

#### Test Case 7: Mahsulotni tahrirlash
```
1. Mahsulot ustiga bosing yoki "Edit" tugmasini bosing
2. Narxni o'zgartiring: 60000
3. "Saqlash" tugmasini bosing

✅ Kutilgan natija:
   - Success xabari
   - Yangi narx ko'rinadi
```

#### Test Case 8: Mahsulotni o'chirish
```
1. Mahsulot ustida "O'chirish" tugmasini bosing
2. Tasdiqlash oynasida "Ha" bosing

✅ Kutilgan natija:
   - Mahsulot ro'yxatdan o'chadi
   - Success xabari ko'rinadi
```

#### Test Case 9: Qidiruv (Search)
```
1. Search qutisiga "test" yozing
2. Kutib turing (debounce)

✅ Kutilgan natija:
   - Faqat "test" so'zi bor mahsulotlar ko'rinadi
   - Real-time qidiruv ishlaydi
```

### C. Mijozlar (Customers)

#### Test Case 10: Yangi mijoz qo'shish
```
1. "Mijozlar" sahifasiga o'ting
2. "+ Yangi mijoz" tugmasini bosing
3. Ma'lumotlarni kiriting:
   - Ism: Test Mijoz
   - Telefon: +998901111111
   - Manzil: Test manzil
4. "Saqlash" tugmasini bosing

✅ Kutilgan natija:
   - Mijoz ro'yxatga qo'shiladi
   - Success xabari
```

#### Test Case 11: Telefon validatsiya
```
1. Noto'g'ri telefon kiriting: 123456
2. "Saqlash" tugmasini bosing

✅ Kutilgan natija:
   - Validation xatosi
   - "Telefon raqam +998XXXXXXXXX formatida bo'lishi kerak"
```

### D. Kassa (POS)

#### Test Case 12: Mahsulot sotish
```
1. "Kassa" sahifasiga o'ting
2. Mahsulot kodini kiriting yoki qidiring
3. Miqdorni kiriting
4. "Savatchaga qo'shish" tugmasini bosing
5. "To'lov" tugmasini bosing
6. To'lov usulini tanlang (naqd/karta)
7. "Tasdiqlash" tugmasini bosing

✅ Kutilgan natija:
   - Chek chop etiladi
   - Mahsulot miqdori kamayadi
   - Success xabari
```

#### Test Case 13: Qarz bilan sotish
```
1. Kassada mahsulot qo'shing
2. "To'lov" tugmasini bosing
3. To'lov usuli: "Qarz"
4. Mijozni tanlang
5. "Tasdiqlash" tugmasini bosing

✅ Kutilgan natija:
   - Qarz ro'yxatga qo'shiladi
   - Mijoz qarzi oshadi
   - Chek chop etiladi
```

### E. Qarzlar (Debts)

#### Test Case 14: Qarzlar ro'yxati
```
1. "Qarzlar" sahifasiga o'ting
2. Barcha qarzlarni ko'ring

✅ Kutilgan natija:
   - Qarzlar ro'yxati ko'rinadi
   - Status: pending/paid/overdue
   - Jami qarz summasi ko'rinadi
```

#### Test Case 15: Qarzni to'lash
```
1. Qarz ustida "To'lash" tugmasini bosing
2. Summa kiriting
3. "Tasdiqlash" tugmasini bosing

✅ Kutilgan natija:
   - Qarz summasi kamayadi
   - Status yangilanadi
   - Success xabari
```

### F. Ruxsatlar (Authorization)

#### Test Case 16: Admin ruxsatlari
```
1. Admin sifatida login qiling
2. Barcha sahifalarga kirish mumkinligini tekshiring:
   - Dashboard ✅
   - Mahsulotlar ✅
   - Mijozlar ✅
   - Qarzlar ✅
   - Kassa ✅
   - Omborlar ✅
   - Hisobotlar ✅
   - Sozlamalar ✅
```

#### Test Case 17: Cashier ruxsatlari
```
1. Cashier sifatida login qiling
2. Ruxsat bor sahifalar:
   - Kassa ✅
   - Mahsulotlar ✅
   - Mijozlar ✅
   - Qarzlar ✅
3. Ruxsat yo'q sahifalar:
   - Sozlamalar ❌
   - Foydalanuvchilar ❌
```

#### Test Case 18: Helper ruxsatlari
```
1. Helper sifatida login qiling
2. Faqat Scanner sahifasiga kirish mumkin ✅
3. Boshqa sahifalarga kirish taqiqlangan ❌
```

---

## 2️⃣ API TESTING (Postman/cURL)

### A. Postman bilan test

#### 1. Postman'ni o'rnating
```
https://www.postman.com/downloads/
```

#### 2. Collection yarating

**Login:**
```
POST http://localhost:5050/api/auth/login
Content-Type: application/json

{
  "phone": "+998901234567",
  "password": "password123"
}

Response:
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "...",
    "name": "Admin",
    "role": "admin"
  }
}
```

**Get Products (v2):**
```
GET http://localhost:5050/api/v2/products
Authorization: Bearer YOUR_TOKEN_HERE

Response:
{
  "success": true,
  "count": 10,
  "data": [...]
}
```

**Create Product:**
```
POST http://localhost:5050/api/v2/products
Authorization: Bearer YOUR_TOKEN_HERE
Content-Type: application/json

{
  "code": "12345",
  "name": "Test Product",
  "price": 50000,
  "warehouse": "WAREHOUSE_ID"
}

Response:
{
  "success": true,
  "message": "Mahsulot muvaffaqiyatli yaratildi",
  "data": {...}
}
```

### B. cURL bilan test

#### Health Check:
```bash
curl http://localhost:5050/health
```

#### Login:
```bash
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+998901234567",
    "password": "password123"
  }'
```

#### Get Products:
```bash
curl http://localhost:5050/api/v2/products \
  -H "Authorization: Bearer YOUR_TOKEN"
```

#### Create Product:
```bash
curl -X POST http://localhost:5050/api/v2/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "code": "12345",
    "name": "Test Product",
    "price": 50000,
    "warehouse": "WAREHOUSE_ID"
  }'
```

### C. Test Script bilan

```bash
# Server test scriptini ishga tushiring
cd server
node test-refactored-api.js
```

---

## 3️⃣ AUTOMATED TESTING (Jest)

### Backend testlar

```bash
cd server

# Barcha testlar
npm test

# Faqat unit testlar
npm run test:unit

# Faqat integration testlar
npm run test:integration

# Watch mode (development)
npm run test:watch

# Coverage bilan
npm test -- --coverage
```

### Test natijalarini ko'rish

```bash
# Terminal'da ko'rinadi:
PASS  tests/unit/services/product.service.test.js
  ✓ should return products (5ms)
  ✓ should create product (8ms)
  ✓ should update product (6ms)
  ...

Test Suites: 2 passed, 2 total
Tests:       39 passed, 39 total
Coverage:    85.5%
```

---

## 4️⃣ BROWSER TESTING (DevTools)

### A. Chrome DevTools

#### 1. Network Tab
```
1. F12 bosing (DevTools ochish)
2. "Network" tabiga o'ting
3. Saytda biror amalni bajaring
4. API so'rovlarini ko'ring:
   - Status: 200 (success), 400 (error), 401 (unauthorized)
   - Response time
   - Request/Response data
```

#### 2. Console Tab
```
1. F12 > Console
2. JavaScript xatolarini ko'ring
3. console.log() chiqishlarini ko'ring
4. API so'rovlarini kuzating
```

#### 3. Application Tab
```
1. F12 > Application
2. Local Storage:
   - token: JWT token
   - user: Foydalanuvchi ma'lumotlari
3. Session Storage:
   - products_cache: Mahsulotlar keshi
   - customers_cache: Mijozlar keshi
```

#### 4. Performance Tab
```
1. F12 > Performance
2. "Record" tugmasini bosing
3. Saytda biror amalni bajaring
4. "Stop" tugmasini bosing
5. Performance tahlilini ko'ring:
   - Loading time
   - Rendering time
   - JavaScript execution time
```

### B. Responsive Testing

```
1. F12 > Toggle device toolbar (Ctrl+Shift+M)
2. Turli qurilmalarni tanlang:
   - iPhone 12 Pro
   - iPad
   - Desktop
3. Har bir qurilmada test qiling
```

### C. Lighthouse Audit

```
1. F12 > Lighthouse
2. "Generate report" tugmasini bosing
3. Natijalarni ko'ring:
   - Performance: 90+
   - Accessibility: 90+
   - Best Practices: 90+
   - SEO: 90+
```

---

## 5️⃣ LOAD TESTING (Performance)

### A. Apache Bench (ab)

```bash
# 100 ta so'rov, 10 ta parallel
ab -n 100 -c 10 http://localhost:5050/api/v2/products

# Natija:
Requests per second:    150.23 [#/sec]
Time per request:       66.56 [ms]
```

### B. Artillery

```bash
# Artillery o'rnatish
npm install -g artillery

# Test yaratish
artillery quick --count 100 --num 10 http://localhost:5050/api/v2/products

# Natija:
Summary:
  scenarios launched:  100
  scenarios completed: 100
  requests completed:  100
  mean response time:  65ms
  min response time:   45ms
  max response time:   120ms
```

---

## 📋 TEST CHECKLIST

### Funksional Testlar

#### Authentication
- [ ] To'g'ri login ishlaydi
- [ ] Noto'g'ri parol rad etiladi
- [ ] Token saqlanadi
- [ ] Logout ishlaydi
- [ ] Token expiry ishlaydi

#### Products
- [ ] Mahsulotlar ro'yxati ko'rinadi
- [ ] Yangi mahsulot qo'shish ishlaydi
- [ ] Mahsulotni tahrirlash ishlaydi
- [ ] Mahsulotni o'chirish ishlaydi
- [ ] Qidiruv ishlaydi
- [ ] Pagination ishlaydi
- [ ] Validation ishlaydi

#### Customers
- [ ] Mijozlar ro'yxati ko'rinadi
- [ ] Yangi mijoz qo'shish ishlaydi
- [ ] Mijozni tahrirlash ishlaydi
- [ ] Telefon validatsiya ishlaydi

#### POS (Kassa)
- [ ] Mahsulot qo'shish ishlaydi
- [ ] Miqdorni o'zgartirish ishlaydi
- [ ] To'lov ishlaydi (naqd/karta)
- [ ] Qarz bilan sotish ishlaydi
- [ ] Chek chop etiladi

#### Debts
- [ ] Qarzlar ro'yxati ko'rinadi
- [ ] Qarzni to'lash ishlaydi
- [ ] Status yangilanadi
- [ ] Overdue qarzlar belgilanadi

#### Authorization
- [ ] Admin barcha sahifalarga kiradi
- [ ] Cashier cheklangan sahifalarga kiradi
- [ ] Helper faqat scanner'ga kiradi
- [ ] 403 error to'g'ri ishlaydi

### Non-Funksional Testlar

#### Performance
- [ ] Sahifa 3 soniyada yuklanadi
- [ ] API so'rovlar 200ms dan tez
- [ ] Qidiruv debounce ishlaydi
- [ ] Virtual scrolling ishlaydi

#### Security
- [ ] JWT token tekshiriladi
- [ ] Rate limiting ishlaydi
- [ ] Input sanitization ishlaydi
- [ ] XSS himoyasi ishlaydi

#### Usability
- [ ] UI intuitiv
- [ ] Error xabarlari tushunarli
- [ ] Loading states ko'rinadi
- [ ] Success messages ko'rinadi

#### Compatibility
- [ ] Chrome'da ishlaydi
- [ ] Firefox'da ishlaydi
- [ ] Safari'da ishlaydi
- [ ] Mobile'da ishlaydi

---

## 🐛 BUG REPORTING

### Bug topilsa:

#### 1. Screenshot oling
```
Windows: Win + Shift + S
Mac: Cmd + Shift + 4
```

#### 2. Bug ma'lumotlarini yozing:

```
Title: Mahsulot qo'shishda xato

Description:
Yangi mahsulot qo'shishda "Kod allaqachon mavjud" xatosi 
ko'rinadi, lekin kod yangi.

Steps to Reproduce:
1. Mahsulotlar sahifasiga o'ting
2. "+ Yangi mahsulot" tugmasini bosing
3. Kod: 99999 (yangi kod)
4. Nom: Test
5. Narx: 10000
6. "Saqlash" tugmasini bosing

Expected Result:
Mahsulot saqlanishi kerak

Actual Result:
"Kod allaqachon mavjud" xatosi ko'rinadi

Environment:
- Browser: Chrome 120
- OS: Windows 11
- Server: localhost:5050
- Client: localhost:5173

Console Errors:
[Screenshot yoki error text]

Network:
POST /api/v2/products - 409 Conflict
```

---

## 🎯 TEST PRIORITIES

### Priority 1 (Har doim test qiling)
1. Login/Logout
2. Mahsulot CRUD
3. Kassa (sotish)
4. Authorization

### Priority 2 (Muhim)
1. Mijozlar CRUD
2. Qarzlar
3. Qidiruv
4. Validation

### Priority 3 (Qo'shimcha)
1. Hisobotlar
2. Sozlamalar
3. Performance
4. Mobile view

---

## 📊 TEST REPORTING

### Kunlik Test Report

```
Date: 2024-XX-XX
Tester: Your Name

Tests Run: 50
Passed: 47
Failed: 3
Blocked: 0

Pass Rate: 94%

Failed Tests:
1. Mahsulot qo'shishda kod validatsiya ishlamayapti
2. Qarzni to'lashda summa noto'g'ri hisoblanmoqda
3. Mobile'da menu ochilmayapti

Notes:
- Barcha asosiy funksiyalar ishlayapti
- Performance yaxshi
- 3 ta bug topildi, tuzatish kerak
```

---

## 🚀 QUICK TEST COMMANDS

```bash
# Backend test
cd server && npm test

# Frontend dev
cd client && npm run dev

# Backend dev (v2)
cd server && npm run dev:v2

# API test
node server/test-refactored-api.js

# Health check
curl http://localhost:5050/health

# Login test
curl -X POST http://localhost:5050/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phone":"+998901234567","password":"password123"}'
```

---

## 📞 YORDAM

Agar test qilishda muammo bo'lsa:

1. **Documentation o'qing**:
   - README.md
   - ARCHITECTURE.md
   - TEST_IMPLEMENTATION_GUIDE.md

2. **Logs tekshiring**:
   - Browser Console (F12)
   - Server logs (terminal)

3. **Test scriptlarni ishga tushiring**:
   ```bash
   npm test
   ```

4. **Issue yarating**:
   - Bug description
   - Steps to reproduce
   - Screenshots
   - Environment info

---

**Happy Testing!** 🧪✅
 