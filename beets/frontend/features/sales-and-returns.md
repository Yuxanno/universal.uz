# Savdo va Qaytarish (Sales and Returns) Funksiyalari

## 📋 Umumiy Ma'lumot

Universal UZ tizimida mahsulot sotish va qaytarish (vozvrat) funksiyalari POS (Point of Sale) tizimining asosiy qismidir. Bu funksiyalar `/admin/kassa` sahifasida joylashgan va real-time inventar yangilanishi, qarz boshqaruvi va chek chop etish imkoniyatlarini o'z ichiga oladi.

## 🎯 Asosiy Komponentlar

### Frontend
- **Fayl**: `client/src/pages/admin/Kassa.tsx` (2411 qator)
- **Qaytarish Modal**: `client/src/components/customers/ReturnModal.tsx`
- **To'lov Modal**: `client/src/components/pos/PaymentModal.tsx`

### Backend
- **Route**: `server/src/routes/receipts.js`
- **Model**: `server/src/models/Receipt.js`
- **Bog'liq modellar**: Product, Customer, Debt, WarehouseInventory

---

## 💰 SAVDO (SALES) FUNKSIYASI

### 1. Savdo Jarayoni (Sales Flow)

#### 1.1 Mahsulot Qo'shish
```typescript
// Mahsulotni savatga qo'shish
const addToCart = (product: Product) => {
  // Narx rejimiga qarab narx tanlash
  const selectedPrice = priceMode === 'retail' 
    ? (product.dona_narx || product.price)  // Chakana narx
    : product.price;                         // Optom narx
  
  // Savatga qo'shish
  cart.push({
    ...product,
    cartQuantity: 1,
    price: selectedPrice
  });
}
```

**Xususiyatlar**:
- Mahsulotni kod yoki nom bo'yicha qidirish
- Barcode scanner orqali qo'shish
- Miqdorni o'zgartirish (+ / -)
- Narxni qo'lda o'zgartirish (admin/kassir uchun)
- Mahsulot nomini o'zgartirish

#### 1.2 Narx Rejimlari (Price Modes)
```typescript
type PriceMode = 'retail' | 'wholesale';

// Dona narx (chakana) - default
priceMode = 'retail'  → dona_narx

// Optom narx
priceMode = 'wholesale' → price (optom_narx)
```

#### 1.3 To'lov Jarayoni (Payment Process)

**To'lov Turlari**:
1. **Naqd (Cash)**: `paymentMethod = 'cash'`
2. **Karta (Card)**: `paymentMethod = 'card'`
3. **Aralash (Mixed)**: Naqd + Karta
4. **Qarz (Debt)**: To'liq yoki qisman qarz

**To'lov Funksiyasi**:
```typescript
const handlePayment = async (
  cashAmount: number,
  cardAmount: number, 
  debtAmount: number,
  debtPaymentCash: number = 0,
  debtPaymentCard: number = 0
) => {
  // 1. Qarz uchun mijoz tekshiruvi
  if (debtAmount > 0 && !selectedCustomer) {
    showAlert('Qarz yaratish uchun mijoz tanlang!');
    return;
  }
  
  // 2. Mahsulot zaxirasi tekshiruvi
  for (const item of cart) {
    if (item.cartQuantity > product.quantity) {
      showAlert(`Yetarli tovar yo'q: ${item.name}`);
      return;
    }
  }
  
  // 3. To'lov usulini aniqlash
  let paymentMethod = 'cash';
  if (debtAmount > 0 && cashAmount === 0 && cardAmount === 0) {
    paymentMethod = 'debt';
  } else if (cashAmount > 0 && cardAmount > 0) {
    paymentMethod = 'mixed';
  } else if (cardAmount > 0) {
    paymentMethod = 'card';
  }
  
  // 4. Backend ga so'rov yuborish
  await api.post('/receipts', {
    items: saleItems,
    total: finalTotal,
    paymentMethod,
    cashAmount,
    cardAmount,
    debtAmount,
    isReturn: false,
    customer: selectedCustomer
  });
  
  // 5. Savatni tozalash va chek chop etish
  setCart([]);
  handlePrint(receiptData);
}
```

### 2. Backend Savdo Jarayoni

**Endpoint**: `POST /api/receipts`

```javascript
router.post('/', auth, async (req, res) => {
  const { items, total, paymentMethod, customer, 
          cashAmount, cardAmount, debtAmount } = req.body;
  
  // 1. Zaxira tekshiruvi
  for (const item of items) {
    const product = await Product.findById(item.product);
    if (product.quantity < item.quantity) {
      return res.status(400).json({ 
        message: `Yetarli tovar yo'q: ${item.name}` 
      });
    }
  }
  
  // 2. Chek yaratish
  const receipt = new Receipt({
    items,
    total,
    paymentMethod,
    cashAmount,
    cardAmount,
    debtAmount,
    customer,
    status: 'completed',
    isReturn: false,
    createdBy: req.user._id
  });
  
  // 3. Inventarni yangilash
  for (const item of items) {
    // Product modelni yangilash
    await Product.findByIdAndUpdate(item.product, { 
      $inc: { quantity: -item.quantity } 
    });
    
    // WarehouseInventory ni yangilash
    const inventory = await WarehouseInventory.findOne({ 
      product: item.product 
    });
    if (inventory) {
      inventory.quantity -= item.quantity;
      await inventory.save();
    }
  }
  
  await receipt.save();
  
  // 4. Qarz yaratish (agar kerak bo'lsa)
  if (customer && debtAmount > 0) {
    const debt = new Debt({
      type: 'receivable',
      customer: customer,
      amount: debtAmount,
      paidAmount: 0,
      status: 'pending',
      receipt: receipt._id
    });
    await debt.save();
    
    // Mijoz qarzini yangilash
    await Customer.findByIdAndUpdate(customer, {
      $inc: { debt: debtAmount }
    });
  }
  
  // 5. Mijoz xarid tarixini yangilash
  if (customer) {
    await Customer.findByIdAndUpdate(customer, {
      $inc: { totalPurchases: total },
      $push: { 
        purchaseHistory: {
          date: new Date(),
          amount: total,
          receiptId: receipt._id
        }
      }
    });
  }
  
  // 6. Real-time yangilanish (Socket.IO)
  if (global.io) {
    global.io.emit('inventory:updated', {
      type: 'sale',
      items: items.map(item => ({
        productId: item.product,
        quantity: item.quantity
      }))
    });
  }
  
  res.status(201).json(receipt);
});
```

### 3. Savdo Xususiyatlari

#### 3.1 Mijoz Tanlash
- **Oddiy mijoz**: Mijoz tanlanmagan (customer = null)
- **Doimiy mijoz**: Ro'yxatdan o'tgan mijoz
- Mijoz qidirish: Ism yoki telefon bo'yicha
- Yangi mijoz qo'shish

#### 3.2 Qarz Boshqaruvi
```typescript
// Qarz yaratish
if (debtAmount > 0) {
  // Mijoz qarziga qo'shish
  customer.debt += debtAmount;
  
  // Yangi qarz yozuvi yaratish
  const debt = new Debt({
    customer: customerId,
    amount: debtAmount,
    paidAmount: 0,
    status: 'pending',
    receipt: receiptId
  });
}

// Mavjud qarzni to'lash (savdo paytida)
if (debtPaymentCash > 0 || debtPaymentCard > 0) {
  await api.post('/debts/pay-bulk', {
    customerId: selectedCustomer,
    cashAmount: debtPaymentCash,
    cardAmount: debtPaymentCard
  });
}
```

#### 3.3 Chek Chop Etish
```typescript
const handlePrint = (receiptData: PrintReceipt) => {
  // Thermal printer uchun HTML yaratish
  const html = `
    <div class="receipt">
      <h2>UNIVERSAL</h2>
      <p>Savdo markazi</p>
      <p>Sana: ${receiptData.date}</p>
      <p>Chek: #${receiptData.receiptNumber}</p>
      
      ${receiptData.items.map((item, i) => `
        <div>${i + 1}. ${item.name}</div>
        <div>${item.quantity} x ${item.price} = ${item.quantity * item.price}</div>
      `).join('')}
      
      <div class="total">JAMI: ${receiptData.total} so'm</div>
      <div>To'lov: ${receiptData.paymentMethod}</div>
    </div>
  `;
  
  // Print qilish
  const printWindow = window.open('', '', 'width=300,height=600');
  printWindow.document.write(html);
  printWindow.print();
};
```

---

## 🔄 QAYTARISH (RETURN/VOZVRAT) FUNKSIYASI

### 1. Qaytarish Jarayoni (Return Flow)

#### 1.1 Qaytarish Rejimini Yoqish
```typescript
const toggleReturnMode = () => {
  if (!isReturnMode) {
    // Qaytarish rejimini yoqish
    setIsReturnMode(true);
    setShowReturnSearch(true);
    setCart([]); // Savatni tozalash
  } else {
    // Qaytarish rejimini o'chirish
    setIsReturnMode(false);
    setShowReturnSearch(false);
    setCart([]);
  }
};
```

**UI O'zgarishlari**:
- Sariq/warning ranglar (oddiy savdoda yashil)
- "Qaytarish rejimi" belgisi
- Mahsulot qidirish modali (qaytariladigan mahsulotlar)

#### 1.2 Mahsulotni Qaytarishga Qo'shish
```typescript
const addToReturn = (product: Product) => {
  // Oddiy addToCart funksiyasidan foydalanish
  addToCart(product);
  setShowReturnSearch(false);
};
```

#### 1.3 Xarid Tarixidan Yuklash
```typescript
const loadPurchaseToCart = (receipt: any) => {
  // Chekdagi mahsulotlarni savatga yuklash
  const items = receipt.items.map(item => ({
    _id: item.product,
    name: item.name,
    code: item.code,
    price: item.price,
    cartQuantity: item.quantity
  }));
  
  setCart(items);
  
  // Mijozni tanlash
  if (receipt.customer?._id) {
    setSelectedCustomer(receipt.customer._id);
  }
  
  // Qaytarish rejimini yoqish
  setIsReturnMode(true);
};
```

### 2. Backend Qaytarish Jarayoni

**Endpoint**: `POST /api/receipts/:id/return`

```javascript
router.post('/:id/return', auth, authorize('admin', 'cashier'), async (req, res) => {
  const { items } = req.body; // Qaytariladigan mahsulotlar
  const receiptId = req.params.id;
  
  // 1. Asl chekni topish
  const originalReceipt = await Receipt.findById(receiptId)
    .populate('customer');
  
  if (!originalReceipt) {
    return res.status(404).json({ message: 'Chek topilmadi' });
  }
  
  // 2. Qaytarish summasini hisoblash
  let returnTotal = 0;
  const returnItems = [];
  
  for (const returnItem of items) {
    const originalItem = originalReceipt.items.find(
      i => i.product.toString() === returnItem.product
    );
    
    if (!originalItem) {
      return res.status(400).json({ 
        message: `Mahsulot topilmadi: ${returnItem.product}` 
      });
    }
    
    if (returnItem.quantity > originalItem.quantity) {
      return res.status(400).json({ 
        message: `Qaytarish miqdori xato: ${originalItem.name}` 
      });
    }
    
    returnTotal += originalItem.price * returnItem.quantity;
    returnItems.push({
      product: returnItem.product,
      name: originalItem.name,
      code: originalItem.code,
      price: originalItem.price,
      quantity: returnItem.quantity
    });
  }
  
  // 3. Qaytarish chekini yaratish
  const returnReceipt = new Receipt({
    items: returnItems,
    total: returnTotal,
    paymentMethod: originalReceipt.paymentMethod,
    customer: originalReceipt.customer?._id,
    status: 'completed',
    isReturn: true,
    originalReceipt: receiptId,
    createdBy: req.user._id
  });
  
  // 4. Inventarni yangilash (mahsulotlarni qaytarish)
  for (const item of returnItems) {
    // Product modelni yangilash
    await Product.findByIdAndUpdate(item.product, { 
      $inc: { quantity: item.quantity } // Qo'shish
    });
    
    // WarehouseInventory ni yangilash
    const inventory = await WarehouseInventory.findOne({ 
      product: item.product 
    });
    if (inventory) {
      inventory.quantity += item.quantity;
      await inventory.save();
    }
  }
  
  await returnReceipt.save();
  
  // 5. Qaytarish to'lovini hisoblash
  const refundBreakdown = {
    debtReduced: 0,
    cardRefund: 0,
    cashRefund: 0
  };
  
  let remainingRefund = returnTotal;
  const customer = originalReceipt.customer;
  
  // 5.1 Avval qarzni kamaytirish
  if (customer && customer.debt > 0) {
    const originalPurchase = {
      receiptId: originalReceipt._id,
      total: originalReceipt.total,
      cashAmount: originalReceipt.cashAmount || 0,
      cardAmount: originalReceipt.cardAmount || 0,
      debtAmount: originalReceipt.debtAmount || 0
    };
    
    // Shu chek uchun qarzni topish
    const receiptDebt = await Debt.findOne({
      receipt: receiptId,
      customer: customer._id,
      type: 'receivable',
      status: { $ne: 'paid' }
    });
    
    if (receiptDebt) {
      const debtRemaining = receiptDebt.amount - receiptDebt.paidAmount;
      const debtReduction = Math.min(remainingRefund, debtRemaining);
      
      // Qarzni to'lash
      receiptDebt.payments.push({
        amount: debtReduction,
        method: 'return',
        date: new Date()
      });
      receiptDebt.paidAmount += debtReduction;
      
      if (receiptDebt.paidAmount >= receiptDebt.amount) {
        receiptDebt.status = 'paid';
      }
      
      await receiptDebt.save();
      
      // Mijoz qarzini kamaytirish
      customer.debt -= debtReduction;
      remainingRefund -= debtReduction;
      refundBreakdown.debtReduced = debtReduction;
    }
  }
  
  // 5.2 Kartaga qaytarish (proporsional)
  if (remainingRefund > 0 && originalReceipt.cardAmount > 0) {
    const cardRefund = Math.min(remainingRefund, originalReceipt.cardAmount);
    refundBreakdown.cardRefund = cardRefund;
    remainingRefund -= cardRefund;
  }
  
  // 5.3 Naqd qaytarish (proporsional)
  if (remainingRefund > 0 && originalReceipt.cashAmount > 0) {
    const cashRefund = Math.min(remainingRefund, originalReceipt.cashAmount);
    refundBreakdown.cashRefund = cashRefund;
    remainingRefund -= cashRefund;
  }
  
  // 5.4 Qolgan summani boshqa qarzlardan ayirish
  if (remainingRefund > 0 && customer && customer.debt > 0) {
    const otherDebts = await Debt.find({
      customer: customer._id,
      receipt: { $ne: receiptId },
      type: 'receivable',
      status: { $ne: 'paid' }
    }).sort({ createdAt: 1 }); // Eng eskisidan
    
    for (const debt of otherDebts) {
      if (remainingRefund <= 0) break;
      
      const debtRemaining = debt.amount - debt.paidAmount;
      const debtReduction = Math.min(remainingRefund, debtRemaining);
      
      debt.payments.push({
        amount: debtReduction,
        method: 'return',
        date: new Date()
      });
      debt.paidAmount += debtReduction;
      
      if (debt.paidAmount >= debt.amount) {
        debt.status = 'paid';
      }
      
      await debt.save();
      
      customer.debt -= debtReduction;
      remainingRefund -= debtReduction;
      refundBreakdown.debtReduced += debtReduction;
    }
  }
  
  // 6. Mijoz xarid tarixini yangilash
  if (customer) {
    customer.totalPurchases = Math.max(0, 
      (customer.totalPurchases || 0) - returnTotal
    );
    await customer.save();
  }
  
  // 7. Asl chekni yangilash (to'liq qaytarish bo'lsa)
  const isFullReturn = returnItems.every(returnItem => {
    const originalItem = originalReceipt.items.find(
      i => i.product.toString() === returnItem.product
    );
    return originalItem && returnItem.quantity === originalItem.quantity;
  });
  
  if (isFullReturn && returnItems.length === originalReceipt.items.length) {
    originalReceipt.status = 'returned';
    await originalReceipt.save();
  }
  
  // 8. Real-time yangilanish
  if (global.io) {
    global.io.emit('inventory:updated', {
      type: 'return',
      items: returnItems.map(item => ({
        productId: item.product,
        quantity: item.quantity
      }))
    });
    
    if (customer) {
      global.io.emit('customer:updated', {
        customerId: customer._id
      });
    }
  }
  
  res.json({
    success: true,
    returnReceipt,
    refundBreakdown,
    customerUpdate: {
      debt: customer?.debt || 0,
      totalPurchases: customer?.totalPurchases || 0
    },
    message: 'Mahsulotlar muvaffaqiyatli qaytarildi'
  });
});
```

### 3. Qaytarish Xususiyatlari

#### 3.1 Qisman Qaytarish (Partial Return)
```typescript
// Faqat ba'zi mahsulotlarni qaytarish
const returnItems = [
  { product: 'product1', quantity: 2 }, // 5 tadan 2 ta
  { product: 'product2', quantity: 1 }  // 3 tadan 1 ta
];
```

#### 3.2 To'liq Qaytarish (Full Return)
```typescript
// Barcha mahsulotlarni qaytarish
const isFullReturn = returnItems.length === originalReceipt.items.length &&
  returnItems.every(item => item.quantity === originalItem.quantity);

if (isFullReturn) {
  originalReceipt.status = 'returned';
}
```

#### 3.3 Qaytarish To'lovi Tartibi

**YANGI LOGIKA (2024)**: Mijozning qarzi bo'lsa, qaytariladigan pul **AVVAL qarzdan ayriladi**.

```javascript
// Qaytarish to'lovi tartibi
let remainingRefund = returnTotal; // 100,000 so'm

// 1. AVVAL mijozning BARCHA qarzlarini kamaytirish
if (customer.debt > 0) {
  const allDebts = await Debt.find({
    customer: customerId,
    type: 'receivable',
    status: { $ne: 'paid' }
  }).sort({ createdAt: 1 }); // Eng eskisidan
  
  for (const debt of allDebts) {
    if (remainingRefund <= 0) break;
    
    const debtRemaining = debt.amount - debt.paidAmount;
    const debtReduction = Math.min(remainingRefund, debtRemaining);
    
    // Qarzni to'lash
    debt.paidAmount += debtReduction;
    customer.debt -= debtReduction;
    remainingRefund -= debtReduction;
  }
}

// 2. Kartaga qaytarish (agar pul qolsa)
if (remainingRefund > 0 && originalPurchase.cardAmount > 0) {
  const cardRefund = Math.min(remainingRefund, originalPurchase.cardAmount);
  refundBreakdown.cardRefund = cardRefund;
  remainingRefund -= cardRefund;
}

// 3. Naqd qaytarish (agar pul qolsa)
if (remainingRefund > 0 && originalPurchase.cashAmount > 0) {
  const cashRefund = Math.min(remainingRefund, originalPurchase.cashAmount);
  refundBreakdown.cashRefund = cashRefund;
  remainingRefund -= cashRefund;
}
```

**Misol**:
```
Javohir:
- Eski qarzi: 500,000 so'm
- Yangi xarid: 200,000 so'm (to'liq to'langan)
- Qaytarish: 100,000 so'm

Natija:
1. Qarzdan ayrildi: 100,000 so'm
2. Yangi qarz: 400,000 so'm ✅
3. Mijozga qaytarilmadi (qarz bilan qoplandi)
```

---

## 📊 Ma'lumotlar Strukturasi

### Receipt Model
```javascript
{
  items: [
    {
      product: ObjectId,      // Mahsulot ID
      name: String,           // Mahsulot nomi
      code: String,           // Mahsulot kodi
      price: Number,          // Sotilgan narx
      quantity: Number        // Miqdor
    }
  ],
  total: Number,              // Jami summa
  paymentMethod: String,      // cash/card/mixed/debt
  cashAmount: Number,         // Naqd summa
  cardAmount: Number,         // Karta summa
  debtAmount: Number,         // Qarz summa
  customer: ObjectId,         // Mijoz (optional)
  status: String,             // completed/returned
  isReturn: Boolean,          // Qaytarish belgisi
  originalReceipt: ObjectId,  // Asl chek (qaytarish uchun)
  createdBy: ObjectId,        // Kim yaratgan
  createdAt: Date             // Yaratilgan vaqt
}
```

---

## 🔔 Real-time Yangilanishlar

### Socket.IO Events

#### Savdo
```javascript
// Inventar yangilandi
global.io.emit('inventory:updated', {
  type: 'sale',
  items: [
    { productId: '123', quantity: 5 }
  ]
});
```

#### Qaytarish
```javascript
// Inventar yangilandi
global.io.emit('inventory:updated', {
  type: 'return',
  items: [
    { productId: '123', quantity: 2 }
  ]
});

// Mijoz yangilandi
global.io.emit('customer:updated', {
  customerId: '456'
});
```

---

## ⚠️ Xatoliklar va Tekshiruvlar

### Savdo Xatoliklari
1. **Yetarli tovar yo'q**: `product.quantity < requestedQuantity`
2. **Mijoz tanlanmagan**: Qarz uchun mijoz kerak
3. **To'lov summasi xato**: `cashAmount + cardAmount + debtAmount !== total`

### Qaytarish Xatoliklari
1. **Chek topilmadi**: Asl chek mavjud emas
2. **Miqdor xato**: Qaytarish miqdori asl miqdordan ko'p
3. **Mahsulot topilmadi**: Chekda bunday mahsulot yo'q
4. **Allaqachon qaytarilgan**: `receipt.status === 'returned'`

---

## 🎨 UI/UX Xususiyatlari

### Savdo Rejimi
- **Rang**: Yashil (emerald)
- **Tugma**: "To'lov qilish"
- **Icon**: CreditCard

### Qaytarish Rejimi
- **Rang**: Sariq/Orange (warning)
- **Tugma**: "Qaytarishni tasdiqlash"
- **Icon**: RotateCcw, AlertTriangle

### Animatsiyalar
- Modal ochilish: `animate-scaleIn`
- Slide in: `animate-slide-in-right`
- Fade in: `animate-fadeIn`

---

## 🔐 Ruxsatlar (Permissions)

### Savdo
- **Admin**: ✅ To'liq ruxsat
- **Kassir**: ✅ To'liq ruxsat
- **Yordamchi**: ❌ Faqat draft yaratish

### Qaytarish
- **Admin**: ✅ To'liq ruxsat
- **Kassir**: ✅ To'liq ruxsat
- **Yordamchi**: ❌ Ruxsat yo'q

---

## 📝 Misol: To'liq Savdo Jarayoni

```typescript
// 1. Mahsulot qo'shish
addToCart(product1); // Kod: 001, Narx: 50000, Miqdor: 1
addToCart(product2); // Kod: 002, Narx: 30000, Miqdor: 2

// 2. Mijoz tanlash
setSelectedCustomer('customer123');

// 3. To'lov
handlePayment(
  cashAmount: 80000,    // Naqd
  cardAmount: 0,        // Karta
  debtAmount: 30000,    // Qarz
  debtPaymentCash: 0,   // Eski qarz to'lovi (naqd)
  debtPaymentCard: 0    // Eski qarz to'lovi (karta)
);

// Natija:
// - Jami: 110000 so'm (50000 + 30000*2)
// - To'langan: 80000 so'm (naqd)
// - Qarz: 30000 so'm
// - Mijoz qarziga qo'shildi: 30000 so'm
```

## 📝 Misol: To'liq Qaytarish Jarayoni

```typescript
// 1. Qaytarish rejimini yoqish
toggleReturnMode();

// 2. Xarid tarixidan yuklash
loadPurchaseToCart(receipt); // Chek ID: receipt123

// 3. Qaytarish
handlePayment(0, 0, 0); // isReturn = true

// Backend:
// - Inventar yangilandi: +1, +2
// - Qarz kamaydi: -30000 so'm
// - Naqd qaytarildi: 80000 so'm
// - Chek holati: 'returned'
```

---

## 🚀 Kelajak Yaxshilanishlar

1. **Qisman qaytarish UI**: Har bir mahsulot uchun miqdor tanlash
2. **Qaytarish sababi**: Nima uchun qaytarildi (defekt, noto'g'ri mahsulot, etc.)
3. **Qaytarish tarixi**: Har bir mahsulot uchun qaytarish tarixi
4. **Avtomatik to'lov taqsimlash**: Qarz/naqd/karta proporsional taqsimlash
5. **Chek PDF**: Chekni PDF formatda saqlash

---

**Oxirgi yangilanish**: 2024
**Muallif**: Universal UZ Development Team
**Versiya**: 1.0.0
