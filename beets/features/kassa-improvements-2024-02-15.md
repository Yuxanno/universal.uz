# 🛒 Kassa Tizimi Yaxshilanishlari (2024-02-15)

## 📋 Umumiy Ma'lumot

Ushbu hujjat 2024-02-15 sanasida amalga oshirilgan kassa tizimi yaxshilanishlarini batafsil tavsiflaydi.

---

## 1️⃣ Mahsulot Qidirish - Kod va Narx Bo'yicha Qidirish

### Muammo
Foydalanuvchi raqam kiritganda:
- ❌ Faqat narx bo'yicha qidirardi
- ❌ Kod bo'yicha qidirish ishlamardi
- ❌ Masalan: "5000" deb qidirganda faqat 5000 so'mlik mahsulotlar ko'rsatilardi, lekin kod: 5000 bo'lgan mahsulot ko'rsatilmasdi

### Yechim
Raqamli qidiruv **kod va narx bo'yicha** ishlaydi:

```typescript
// client/src/utils/productSearch.ts
const isNumericQuery = /^\d+$/.test(trimmedQuery);
const numericQuery = isNumericQuery ? parseInt(trimmedQuery) : null;

if (numericQuery !== null) {
  // PRIORITY 1: Kod bo'yicha qidirish
  const codeMatch = product.code && product.code.includes(trimmedQuery);
  
  // PRIORITY 2: Aniq narx bo'yicha qidirish
  const priceMatch = product.price && Math.round(product.price) === numericQuery;
  const donaNarxMatch = product.dona_narx && Math.round(product.dona_narx) === numericQuery;
  const optomNarxMatch = product.optom_narx && Math.round(product.optom_narx) === numericQuery;
  const tanNarxMatch = product.tan_narx && Math.round(product.tan_narx) === numericQuery;
  
  // Kod yoki narx mos kelsa - ko'rsatish
  return codeMatch || priceMatch || donaNarxMatch || optomNarxMatch || tanNarxMatch;
}
```

### Saralash Tartibi
```typescript
// Raqamli qidiruv uchun saralash:
// 1. Kod mos kelgan mahsulotlar (birinchi o'rinda)
// 2. Narx mos kelgan mahsulotlar (ikkinchi o'rinda)
// 3. Har bir guruh ichida: qisqa kod → uzun kod

if (aCodeMatch && !bCodeMatch) return -1; // Kod birinchi
if (!aCodeMatch && bCodeMatch) return 1;

// Agar ikkalasi ham kod bo'yicha topilgan bo'lsa
if (aCodeMatch && bCodeMatch) {
  return a.code.length - b.code.length; // Qisqa kod birinchi
}

// Narx bo'yicha topilgan mahsulotlar
// price > dona_narx > optom_narx > tan_narx
```

### Natija
- ✅ Kod bo'yicha qidirish ishlaydi (masalan: "5000" → kod: 5000)
- ✅ Narx bo'yicha qidirish ishlaydi (masalan: "5000" → narx: 5000 so'm)
- ✅ Kod bo'yicha topilgan mahsulotlar birinchi o'rinda
- ✅ Barcha narx turlarida qidiradi (tan, optom, dona)
- ✅ Qisqa kodlar birinchi o'rinda

---

## 2️⃣ Top Mahsulotlar Birinchi O'rinda

### Muammo
Mahsulotlar tartibsiz ko'rsatilardi, kassir tez-tez sotiladigan mahsulotlarni qidirish uchun ko'p vaqt sarflardi.

### Yechim
Statistika qismidan eng ko'p sotilgan mahsulotlar olinadi va birinchi o'ringa qo'yiladi:

```typescript
// client/src/context/ProductsContext.tsx
// 1. Top mahsulotlarni olish
const topRes = await api.get('/stats/top-products?limit=100');
const topProductsMap = new Map<string, number>();
topRes.data.forEach((item: any, index: number) => {
  topProductsMap.set(item._id, index); // rank: 0, 1, 2, ...
});

// 2. Mahsulotlarni saralash
const sortedProducts = [...productsData].sort((a, b) => {
  const aRank = topProductsMap.get(a._id);
  const bRank = topProductsMap.get(b._id);
  
  // Top mahsulotlar birinchi
  if (aRank !== undefined && bRank !== undefined) {
    return aRank - bRank;
  }
  if (aRank !== undefined) return -1;
  if (bRank !== undefined) return 1;
  
  // Fallback: soldCount
  return (b.soldCount || 0) - (a.soldCount || 0);
});
```

### Backend O'zgarishi
Kassir ham top mahsulotlarni ko'rishi uchun API ochildi:

```javascript
// server/src/routes/stats.js
router.get('/top-products', auth, authorize('admin', 'cashier'), async (req, res) => {
  // Eng ko'p sotilgan mahsulotlar
  const topProducts = await Receipt.aggregate([
    { $match: { status: 'completed' } },
    { $unwind: '$items' },
    { 
      $group: { 
        _id: '$items.product',
        totalQuantity: { $sum: '$items.quantity' }
      } 
    },
    { $sort: { totalQuantity: -1 } },
    { $limit: limit }
  ]);
  
  res.json(topProducts);
});
```

### Natija
- ✅ Eng ko'p sotiladigan mahsulotlar doim birinchi o'rinda
- ✅ Kassirlar tez ishlaydi
- ✅ Keshda ham tartib saqlanadi

---

## 3️⃣ Scroll Optimizatsiyasi

### Muammo
Mahsulotlarni scroll qilganda butun sahifa scroll bo'lardi:
- ❌ Header yuqoriga ko'tarilardi
- ❌ Cart qismi ham harakat qilardi
- ❌ Noqulay foydalanish tajribasi

### Yechim
Layout strukturasi o'zgartirildi:

```typescript
// client/src/pages/admin/Kassa.tsx
// OLDIN:
<div className="min-h-screen flex flex-col overflow-x-hidden">

// HOZIR:
<div className="h-screen flex flex-col overflow-hidden">
```

### Natija
- ✅ Faqat mahsulotlar qismi scroll bo'ladi
- ✅ Header doim ko'rinib turadi
- ✅ Cart o'z joyida qoladi
- ✅ Qulay foydalanish tajribasi

---

## 4️⃣ Narx Rejimi Tuzatildi (Optom/Dona)

### Muammo
Default narx rejimi "optom" bo'lsa ham, ba'zi mahsulotlar "dona" narxida hisoblanardi va chekda ham noto'g'ri narx ko'rsatilardi.

### Yechim
`addToCart` funksiyasi `priceMode` ni tekshiradi:

```typescript
// client/src/pages/admin/Kassa.tsx
const addToCart = useCallback((product: Product) => {
  const donaPrice = product.dona_narx || product.price || 0;
  const optomPrice = product.price || 0;
  
  // CRITICAL: priceMode ga qarab default narx
  const defaultPrice = priceMode === 'retail' ? donaPrice : optomPrice;
  
  setCart(prev => [...prev, {
    ...product,
    price: defaultPrice, // ✅ To'g'ri narx
    dona_narx: donaPrice,
    optom_narx: optomPrice
  }]);
  
  setLocalPrices(prev => ({
    ...prev,
    [product._id]: defaultPrice.toString() // ✅ To'g'ri narx
  }));
}, [priceMode, toast]);
```

### Natija
- ✅ Optom rejimida - optom narxi
- ✅ Dona rejimida - dona narxi
- ✅ Chekda ham to'g'ri narx
- ✅ Narx rejimi o'zgartirilganda barcha mahsulotlar yangilanadi

---

## 5️⃣ Kassir Uchun Qaytarish Funksiyasi

### Muammo
Qaytarish funksiyasi faqat `/admin/customers` sahifasida mavjud edi, kassir qaytarish qila olmasdi.

### Yechim
`/cashier/customers` sahifasiga to'liq qaytarish funksiyasi qo'shildi:

```typescript
// client/src/pages/cashier/Customers.tsx

// 1. Qaytarish modalini ochish
const openReturnModal = (purchase: any) => {
  setSelectedPurchase(purchase);
  setShowReturnModal(true);
};

// 2. Qaytarishni qayta ishlash
const processReturn = async (itemsToReturn: { product: string; quantity: number }[]) => {
  if (!selectedPurchase || !selectedCustomer) return;
  
  // Mahsulot ma'lumotlarini to'ldirish
  const fullItems = itemsToReturn.map(returnItem => {
    const originalItem = selectedPurchase.items.find((item: any) => 
      (item.product || item._id) === returnItem.product
    );
    return {
      product: returnItem.product,
      name: originalItem.name,
      code: originalItem.code,
      price: originalItem.price,
      quantity: returnItem.quantity
    };
  });
  
  // Qaytarish summasini hisoblash
  const returnTotal = fullItems.reduce((sum, item) => 
    sum + (item.price * item.quantity), 0
  );
  
  // Backend API ga so'rov
  const response = await api.post('/receipts/return', {
    customerId: selectedCustomer._id,
    receiptId: selectedPurchase.receiptId,
    items: fullItems,
    returnTotal,
    originalPurchase: {
      total: selectedPurchase.total,
      cashAmount: selectedPurchase.cashAmount || 0,
      cardAmount: selectedPurchase.cardAmount || 0,
      debtAmount: selectedPurchase.debtAmount || 0
    }
  });
  
  // Batafsil success message
  const { refundBreakdown, customerUpdate, receiptUpdate } = response.data;
  let successMessage = 'Mahsulotlar muvaffaqiyatli qaytarildi!\n\n';
  
  if (receiptUpdate?.isFullReturn) {
    successMessage += '🔄 To\'liq qaytarildi\n\n';
  }
  
  if (refundBreakdown.debtReduced > 0) {
    successMessage += `💰 Qarzdan ayrildi: ${formatNumber(refundBreakdown.debtReduced)} so'm\n`;
  }
  if (refundBreakdown.cardRefund > 0) {
    successMessage += `💳 Kartaga qaytarildi: ${formatNumber(refundBreakdown.cardRefund)} so'm\n`;
  }
  if (refundBreakdown.cashRefund > 0) {
    successMessage += `💵 Naqd qaytarildi: ${formatNumber(refundBreakdown.cashRefund)} so'm\n`;
  }
  
  // Mijoz ma'lumotlarini yangilash
  await fetchCustomers(true); // Force refresh
  const res = await api.get(`/customers/${selectedCustomer._id}`);
  setSelectedCustomer({...res.data});
  setCustomerModalKey(prev => prev + 1); // Force re-render
};
```

### UI Xususiyatlari

**Qaytarish Tugmasi**:
- Har bir xarid yonida orange rangdagi qaytarish tugmasi
- Icon: Chap tomonga o'q (return arrow)
- Hover effekt: scale va rang o'zgarishi

```typescript
<button
  onClick={(e) => {
    e.stopPropagation();
    openReturnModal(purchase);
  }}
  className="w-9 h-9 flex items-center justify-center rounded-lg bg-orange-100 hover:bg-orange-200 text-orange-600 transition-all hover:scale-110 active:scale-95"
  title="Mahsulotni qaytarish"
>
  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
  </svg>
</button>
```

**ReturnModal Komponenti**:
- Mahsulotlar ro'yxati (checkbox bilan)
- Har bir mahsulot uchun miqdor tanlash
- Qaytarish summasini ko'rsatish
- Tasdiqlash va bekor qilish tugmalari

### Qaytarish Jarayoni

1. **Mijoz tanlash**: Mijozlar ro'yxatidan mijozni tanlash
2. **Xarid tanlash**: Mijoz xaridlar tarixidan xaridni tanlash
3. **Qaytarish tugmasini bosish**: Orange rangdagi tugmani bosish
4. **Mahsulotlarni tanlash**: ReturnModal da mahsulotlarni belgilash
5. **Tasdiqlash**: "Qaytarishni tasdiqlash" tugmasini bosish
6. **Natija**: Success message va yangilangan ma'lumotlar

### Qaytarish To'lovi Tartibi

Backend avtomatik ravishda to'lovni taqsimlaydi:

```
1. AVVAL: Mijozning barcha qarzlarini kamaytirish
2. KEYIN: Kartaga qaytarish (agar pul qolsa)
3. OXIRIDA: Naqd qaytarish (agar pul qolsa)
```

**Misol**:
```
Mijoz: Javohir
- Eski qarzi: 500,000 so'm
- Yangi xarid: 200,000 so'm (to'liq to'langan)
- Qaytarish: 100,000 so'm

Natija:
1. Qarzdan ayrildi: 100,000 so'm ✅
2. Yangi qarz: 400,000 so'm
3. Mijozga qaytarilmadi (qarz bilan qoplandi)
```

### Natija
- ✅ Kassir ham qaytarish qila oladi
- ✅ Qarzdan ayrilish prioriteti to'g'ri ishlaydi
- ✅ Real-time yangilanish (force refresh)
- ✅ Batafsil success message (qarz, karta, naqd breakdown)
- ✅ Modal avtomatik yangilanadi (customerModalKey)
- ✅ Xaridlar ro'yxati yangilanadi
- ✅ To'liq va qisman qaytarish qo'llab-quvvatlanadi

---

## 📊 Umumiy Statistika

### O'zgartirilgan Fayllar
1. `client/src/utils/productSearch.ts` - Qidirish optimizatsiyasi
2. `client/src/context/ProductsContext.tsx` - Top mahsulotlar
3. `client/src/pages/admin/Kassa.tsx` - Scroll va narx rejimi
4. `client/src/pages/cashier/Customers.tsx` - Qaytarish funksiyasi
5. `server/src/routes/stats.js` - API ruxsatlari
6. `client/src/types/index.ts` - soldCount maydoni

### Qo'shilgan Funksiyalar
- ✅ Kod va narx bo'yicha qidirish (kod birinchi, keyin narx)
- ✅ Top mahsulotlar saralash
- ✅ Scroll optimizatsiyasi
- ✅ Narx rejimi tuzatildi
- ✅ Kassir uchun qaytarish

### Tuzatilgan Xatolar
- ❌ Kod bo'yicha qidirish ishlamardi
- ❌ Tartibsiz mahsulotlar
- ❌ Butun sahifa scroll
- ❌ Noto'g'ri narx hisoblash
- ❌ Kassir qaytarish qila olmasdi

---

## 🧪 Test Qilish

### 1. Narx va Kod Bo'yicha Qidirish
```
1. Kassa sahifasiga o'ting
2. "5000" deb qidiring
3. Birinchi o'rinda kod: 5000 bo'lgan mahsulotlar ko'rsatilishi kerak
4. Keyin 5000 so'mlik mahsulotlar ko'rsatilishi kerak
5. 45000, 25000 kabi mahsulotlar ko'rsatilmasligi kerak
```

### 2. Top Mahsulotlar
```
1. Dashboard → Top mahsulotlar qismini ko'ring
2. Kassa sahifasiga o'ting
3. Mahsulotlar ro'yxatida top mahsulotlar birinchi o'rinda bo'lishi kerak
4. Console'da: "📊 [ProductsContext] Loaded X top products"
```

### 3. Scroll
```
1. Kassa sahifasiga o'ting
2. Mahsulotlar qismini scroll qiling
3. Faqat mahsulotlar qismi scroll bo'lishi kerak
4. Header va cart o'z joyida qolishi kerak
```

### 4. Narx Rejimi
```
1. Kassa sahifasiga o'ting (optom rejimi)
2. Mahsulot qo'shing
3. Savatda optom narxi ko'rsatilishi kerak
4. Chek chiqaring - chekda ham optom narxi bo'lishi kerak
```

### 5. Kassir Qaytarish
```
1. Kassir sifatida kiring
2. /cashier/customers sahifasiga o'ting
3. Mijozni tanlang
4. Xariddan mahsulot qaytaring
5. Qarz kamayishi kerak
```

---

## 📝 Keyingi Qadamlar

### Tavsiya Etiladigan Yaxshilanishlar
1. **Qidirish**: Fuzzy search (taxminiy qidirish)
2. **Top Mahsulotlar**: Vaqt oralig'i bo'yicha filter (bugun, hafta, oy)
3. **Narx Rejimi**: Mahsulot darajasida narx rejimi (ba'zi mahsulotlar faqat optom)
4. **Qaytarish**: Qisman qaytarish uchun miqdor kiritish
5. **Performance**: Virtual scrolling (10000+ mahsulot uchun)

---

**Muallif**: Kiro AI Assistant  
**Sana**: 2024-02-15  
**Versiya**: 1.0.0
