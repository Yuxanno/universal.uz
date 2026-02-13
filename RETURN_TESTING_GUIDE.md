# 🧪 Mahsulot Qaytarish Test Qo'llanmasi

## ✅ Yangi Xususiyatlar

### 1. **To'liq qaytarish**
- Agar xariddagi barcha mahsulotlar qaytarilsa
- Xarid ro'yxatdan **butunlay o'chib ketadi**
- Receipt status = 'returned'

### 2. **Qisman qaytarish**
- Agar faqat ba'zi mahsulotlar qaytarilsa
- Xarid ro'yxatda qoladi
- Faqat **qaytarilgan summa kamayadi**
- Mahsulotlar soni yangilanadi

### 3. **Real-time yangilanish**
- Modal ichidagi ma'lumotlar avtomatik yangilanadi
- Jami xaridlar yangilanadi
- Qarz yangilanadi

---

## Test Senariylari

### ✅ Test 1: To'liq qaytarish (butun xarid)

**Boshlang'ich holat:**
- Mijoz: Test User
- Xarid: 50,000 so'm
  - Mahsulot A: 30,000 so'm (1 dona)
  - Mahsulot B: 20,000 so'm (1 dona)
- To'lov: 100% naqd

**Qaytarish:**
- Mahsulot A: 1 dona = 30,000 so'm
- Mahsulot B: 1 dona = 20,000 so'm
- **Jami: 50,000 so'm (100% qaytarish)**

**Kutilayotgan natija:**
```
🔄 To'liq qaytarildi - xarid ro'yxatdan o'chirildi

💵 Naqd qaytarildi: 50,000 so'm

📊 Jami xaridlar: 0 so'm (50,000 - 50,000)
```

**Tekshirish:**
1. Mijoz modalini oching
2. Xaridlar ro'yxatida bu xarid **ko'rinmasligi** kerak
3. Jami xaridlar: 0 so'm

---

### ✅ Test 2: Qisman qaytarish

**Boshlang'ich holat:**
- Xarid: 85,000 so'm
  - Pocco pampers ×2 = 50,000 so'm
  - Duxi Jenskiy ×4 = 28,000 so'm
  - KD-7 ZAR ×1 = 7,000 so'm

**Qaytarish:**
- Pocco pampers 1 dona = 25,000 so'm

**Kutilayotgan natija:**
```
📦 Qisman qaytarildi
Qolgan summa: 60,000 so'm

💵 Naqd qaytarildi: 25,000 so'm

📊 Jami xaridlar: 60,000 so'm (85,000 - 25,000)
```

**Tekshirish:**
1. Mijoz modalini oching
2. Xarid ro'yxatida bu xarid **hali ko'rinadi**
3. Xarid summasi: **60,000 so'm** (85,000 emas!)
4. Pocco pampers: **×1** (×2 emas!)
5. Duxi Jenskiy: ×4 (o'zgarmagan)
6. KD-7 ZAR: ×1 (o'zgarmagan)

---

### ✅ Test 3: Qarzga yozilgan xaridni qaytarish

**Boshlang'ich holat:**
- Mijoz: Ilhom darvozachi
- Xarid: 85,000 so'm
  - Naqd: 20,000 so'm
  - Karta: 35,000 so'm
  - Qarz: 30,000 so'm
- Mijoz qarzi: 30,000 so'm

**Qaytarish:**
- Pocco pampers 1 dona = 25,000 so'm

**Kutilayotgan natija:**
```
✅ Qarzdan ayrildi: 25,000 so'm
✅ Kartaga qaytarildi: 0 so'm
✅ Naqd qaytarildi: 0 so'm

📊 Yangi qarz: 5,000 so'm (30,000 - 25,000)
📊 Jami xaridlar: 60,000 so'm (85,000 - 25,000)
```

**Tekshirish:**
1. `/admin/customers` sahifasiga o'ting
2. Ilhom darvozachi mijozini toping
3. Mijoz kartasini bosing (modal ochiladi)
4. Xarid kartasida qaytarish tugmasini bosing (🔄 icon)
5. ReturnModal ochiladi:
   - ✅ Xarid ma'lumotlari ko'rinadi
   - ✅ To'lov tafsilotlari ko'rinadi (Naqd, Karta, Qarz)
   - ✅ Mahsulotlar ro'yxati ko'rinadi
6. Pocco pampers uchun 1 dona kiriting
7. "Qaytarishni tasdiqlash" tugmasini bosing
8. Kutilayotgan natija:
   - ✅ Success modal ko'rinadi (qarzdan ayrildi)
   - ✅ Modal yopiladi
   - ✅ Mijoz ma'lumotlari yangilanadi
   - ✅ Qarz: 5,000 so'm
   - ✅ Jami xaridlar: 60,000 so'm

---

### ✅ Test 2: Qarzsiz xaridni qaytarish (Karta + Naqd)

**Boshlang'ich holat:**
- Mijoz: Test User
- Xarid: 50,000 so'm
  - Naqd: 20,000 so'm
  - Karta: 30,000 so'm
  - Qarz: 0 so'm
- Mijoz qarzi: 0 so'm

**Qaytarish:**
- Mahsulot 1 dona = 15,000 so'm

**Kutilayotgan natija:**
```
✅ Qarzdan ayrildi: 0 so'm
✅ Kartaga qaytarildi: 15,000 so'm
✅ Naqd qaytarildi: 0 so'm

📊 Yangi qarz: 0 so'm
📊 Jami xaridlar: 35,000 so'm (50,000 - 15,000)
```

---

### ✅ Test 3: Karta tugasa naqd qaytarish

**Boshlang'ich holat:**
- Xarid: 100,000 so'm
  - Naqd: 50,000 so'm
  - Karta: 30,000 so'm
  - Qarz: 20,000 so'm
- Mijoz qarzi: 20,000 so'm

**Qaytarish:**
- Mahsulot = 60,000 so'm

**Kutilayotgan natija:**
```
✅ Qarzdan ayrildi: 20,000 so'm (qarz to'liq to'landi)
✅ Kartaga qaytarildi: 30,000 so'm (karta to'liq qaytarildi)
✅ Naqd qaytarildi: 10,000 so'm (qolgan summa)

📊 Yangi qarz: 0 so'm
📊 Jami xaridlar: 40,000 so'm (100,000 - 60,000)
```

---

### ✅ Test 4: Bir nechta mahsulotni qaytarish

**Qaytarish:**
- Pocco pampers 1 dona = 25,000 so'm
- Duxi Jenskiy 2 dona = 14,000 so'm
- Jami: 39,000 so'm

**Tekshirish:**
1. ReturnModal'da har ikkala mahsulot uchun sonni kiriting
2. Jami qaytariladigan summa: 39,000 so'm ko'rinadi
3. Tasdiqlang
4. Barcha mahsulotlar ombor inventariga qaytadi

---

## 🔍 Browser Console Loglar

### Frontend (Client)
```javascript
// ReturnModal ochilganda
🔍 [ReturnModal] Purchase data: {
  receiptId: "...",
  total: 410000,
  cashAmount: 410000,
  cardAmount: 0,
  debtAmount: 0,
  items: [...]
}

// Qaytarish muvaffaqiyatli bo'lganda
✅ Return response: {
  success: true,
  refundBreakdown: {
    debtReduced: 0,
    cardRefund: 0,
    cashRefund: 190000
  },
  customerUpdate: {
    debt: 968889,
    totalPurchases: 8606500  // ✅ Yangi summa
  },
  receiptUpdate: {
    isFullReturn: false,
    remainingTotal: 220000,
    remainingItemsCount: 1
  }
}

✅ Customer data refreshed: {
  debt: 968889,
  totalPurchases: 8606500,  // ✅ Yangi summa
  purchaseHistoryCount: 23,
  oldDebt: 968889,
  oldTotalPurchases: 8796500  // ❌ Eski summa
}

🔄 State updated, component should re-render
```

**MUHIM:** Agar `oldTotalPurchases` va `totalPurchases` bir xil bo'lsa, modal yangilanmaydi!

### Backend (Server)
```javascript
🔄 [RETURN] Processing return: {
  customerId: "...",
  receiptId: "...",
  itemsCount: 1,
  returnTotal: 25000,
  originalPurchase: { ... }
}

✅ [RETURN] Return receipt created: "..."

📦 [RETURN] Added 1 to inventory for Pocco pampers

💰 [RETURN] Starting refund calculation: {
  returnTotal: 25000,
  customerDebt: 30000,
  originalPurchase: { ... }
}

💰 [RETURN] Step 1: Checking debts...
💰 [RETURN] Found 1 related debts
💰 [RETURN] Processing debt ...: {
  debtAmount: 30000,
  debtPaid: 0,
  debtRemaining: 30000,
  debtReduction: 25000
}
💰 [RETURN] Reduced debt by 25000 so'm, remaining refund: 0

💳 [RETURN] Step 2: No card refund (remaining: 0, cardAmount: 35000)
💵 [RETURN] Step 3: No cash refund needed

✅ [RETURN] Customer updated: {
  customerId: "...",
  name: "Ilhom darvozachi",
  newDebt: 5000,
  newTotalPurchases: 60000
}

✅ [RETURN] Return processed successfully: {
  returnTotal: 25000,
  refundBreakdown: {
    debtReduced: 25000,
    cardRefund: 0,
    cashRefund: 0
  },
  returnReceiptId: "..."
}
```

---

## 📊 Database O'zgarishlar

### Receipts Collection
```javascript
// Yangi return receipt
{
  _id: "new_receipt_id",
  items: [...],
  total: 25000,
  isReturn: true,
  status: "completed",
  customer: "customer_id",
  description: "Qaytarilgan: Ilhom darvozachi - 13.02.2026 - 25 000 so'm"
}
```

### Customers Collection
```javascript
{
  debt: 30000 → 5000,
  totalPurchases: 85000 → 60000,
  purchaseHistory: [
    // Yangi yozuv
    {
      date: "2026-02-13",
      amount: 25000,
      type: "debt_payment",
      paymentMethod: "return"
    }
  ]
}
```

### Debts Collection
```javascript
{
  amount: 30000,
  paidAmount: 0 → 25000,
  status: "pending", // 5000 qoldi
  payments: [
    {
      amount: 25000,
      method: "return",
      date: "2026-02-13"
    }
  ]
}
```

### Products & WarehouseInventory
```javascript
// Product
{
  quantity: 50 → 51
}

// WarehouseInventory
{
  quantity: 50 → 51
}
```

---

## ❌ Xatolik Holatlari

### 1. Mahsulot tanlanmagan
```
⚠️ Qaytariladigan mahsulot tanlanmagan
```

### 2. Server xatosi
```
❌ Qaytarishda xatolik yuz berdi
```

### 3. Mijoz topilmadi
```
❌ Mijoz topilmadi
```

---

## ✅ UI Tekshirish Ro'yxati

- [ ] Qaytarish tugmasi (🔄) har bir xarid kartasida ko'rinadi
- [ ] ReturnModal to'g'ri ochiladi
- [ ] Xarid ma'lumotlari to'g'ri ko'rinadi
- [ ] To'lov tafsilotlari ko'rinadi (Naqd, Karta, Qarz)
- [ ] Mahsulotlar ro'yxati to'g'ri
- [ ] Quantity controls ishlaydi (+/- tugmalar)
- [ ] Jami qaytariladigan summa real-time hisoblanadi
- [ ] Loading state ko'rinadi (Qaytarilmoqda...)
- [ ] Success message batafsil ma'lumot beradi
- [ ] Modal yopilgandan keyin ma'lumotlar yangilanadi
- [ ] Mijoz qarzi yangilanadi
- [ ] Jami xaridlar yangilanadi
- [ ] Xaridlar tarixi yangilanadi

---

## 🎯 Performance Test

1. **Bir vaqtning o'zida bir nechta qaytarish:**
   - 3-5 ta turli mijozlar uchun qaytarish qiling
   - Barcha ma'lumotlar to'g'ri yangilanishini tekshiring

2. **Katta hajmdagi qaytarish:**
   - 10+ ta mahsulotli xaridni qaytaring
   - Modal tezligi va responsiveness'ni tekshiring

3. **Real-time yangilanish:**
   - Bir browserda qaytarish qiling
   - Boshqa browserda mijozlar ro'yxati avtomatik yangilanishini tekshiring (Socket.io)

---

## 🐛 Debug Qo'llanmasi

Agar muammo bo'lsa:

1. **Browser Console'ni oching** (F12)
2. **Network tab'ni tekshiring** (API calls)
3. **Server logs'ni ko'ring** (terminal)
4. **Database'ni tekshiring** (MongoDB Compass)

Barcha loglar emoji bilan belgilangan:
- 🔄 = Qaytarish boshlandi
- ✅ = Muvaffaqiyat
- ❌ = Xatolik
- 💰 = Qarz operatsiyasi
- 💳 = Karta operatsiyasi
- 💵 = Naqd operatsiyasi
- 📦 = Inventar operatsiyasi
- 📊 = Ma'lumot yangilanishi
