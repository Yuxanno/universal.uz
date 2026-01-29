# Chek To'lov Tafsilotlari

## 🎯 Yangi Funksionallik

To'lov qismida endi batafsil ma'lumot ko'rsatiladi:
- To'liq to'lov: Faqat to'lov turi
- Aralash to'lov: Har bir to'lov turi va summasi

## ✅ O'zgarishlar

### 1. PrintReceipt Interface Yangilandi
```typescript
interface PrintReceipt {
  items: { name: string; code: string; price: number; quantity: number }[];
  total: number;
  paymentMethod: 'cash' | 'card' | 'mixed' | 'debt';  // ✅ 'mixed' va 'debt' qo'shildi
  cashAmount?: number;      // ✅ Yangi
  cardAmount?: number;      // ✅ Yangi
  debtAmount?: number;      // ✅ Yangi
  date: string;
  receiptNumber: string;
}
```

### 2. Payment Method Aniqlash
```typescript
let paymentMethod: 'cash' | 'card' | 'mixed' | 'debt' = 'cash';

if (debtAmount > 0 && cashAmount === 0 && cardAmount === 0) {
  paymentMethod = 'debt';  // ✅ Faqat qarz
} else if (cashAmount > 0 && cardAmount > 0) {
  paymentMethod = 'mixed';  // ✅ Aralash
} else if (cardAmount > 0) {
  paymentMethod = 'card';  // ✅ Faqat karta
} else {
  paymentMethod = 'cash';  // ✅ Faqat naqd
}
```

### 3. Receipt Data
```typescript
const receiptData: PrintReceipt = {
  items: saleItems,
  total: finalTotal,
  paymentMethod: paymentMethod,
  cashAmount: cashAmount,      // ✅ Saqlandi
  cardAmount: cardAmount,      // ✅ Saqlandi
  debtAmount: debtAmount,      // ✅ Saqlandi
  date: ...,
  receiptNumber: ...
};
```

### 4. Print Receipt HTML
```html
<div class="payment">To'lov: ${
  printReceipt.paymentMethod === 'cash' ? 'Naqd pul' :
  printReceipt.paymentMethod === 'card' ? 'Karta orqali' :
  printReceipt.paymentMethod === 'debt' ? 'Qarz qilindi' :
  'Aralash'
}</div>

<!-- Agar aralash to'lov bo'lsa, tafsilotlar -->
${printReceipt.paymentMethod === 'mixed' || ... ? `
<div class="payment-details">
  ${printReceipt.cashAmount > 0 ? `Naqd: ${formatNum(printReceipt.cashAmount)}` : ''}
  ${printReceipt.cardAmount > 0 ? `Karta: ${formatNum(printReceipt.cardAmount)}` : ''}
  ${printReceipt.debtAmount > 0 ? `Qarz: ${formatNum(printReceipt.debtAmount)}` : ''}
</div>
` : ''}
```

### 5. CSS Styles
```css
.payment { 
  font-size: 12px; 
  margin: 1.5mm auto 0.5mm auto; 
  text-align: center; 
  width: 100%; 
  font-weight: bold;  /* ✅ Bold qilindi */
}

.payment-details { 
  font-size: 10px;  /* ✅ Kichikroq */
  margin: 0 auto 1.5mm auto; 
  text-align: center; 
  width: 100%; 
  color: #333;  /* ✅ Kulrang */
}
```

## 📊 Chek Ko'rinishlari

### Variant 1: Faqat Naqd Pul
```
      JAMI: 190 000 so'm

      To'lov: Naqd pul
```

### Variant 2: Faqat Karta
```
      JAMI: 190 000 so'm

      To'lov: Karta orqali
```

### Variant 3: Faqat Qarz
```
      JAMI: 190 000 so'm

      To'lov: Qarz qilindi
```

### Variant 4: Aralash (Naqd + Karta)
```
      JAMI: 190 000 so'm

      To'lov: Aralash
   Naqd: 100 000 | Karta: 90 000
```

### Variant 5: Aralash (Naqd + Qarz)
```
      JAMI: 190 000 so'm

      To'lov: Aralash
   Naqd: 150 000 | Qarz: 40 000
```

### Variant 6: Aralash (Karta + Qarz)
```
      JAMI: 190 000 so'm

      To'lov: Aralash
   Karta: 100 000 | Qarz: 90 000
```

### Variant 7: Aralash (Naqd + Karta + Qarz)
```
      JAMI: 190 000 so'm

      To'lov: Aralash
Naqd: 50 000 | Karta: 100 000 | Qarz: 40 000
```

## 🎨 Dizayn Xususiyatlari

### 1. Qatorlar Minimallashtirildi
- To'lov turi: 1 qator (bold, 12px)
- Tafsilotlar: 1 qator (10px, kulrang)
- Jami: Maksimum 2 qator

### 2. Separator (|)
- To'lov turlari orasida `|` belgisi
- Ixcham va o'qilishi oson
- Bir qatorda 3 ta to'lov turi sig'adi

### 3. Font O'lchamlari
- To'lov turi: 12px, bold
- Tafsilotlar: 10px, normal
- Rang: #333 (kulrang-qora)

### 4. Margin va Padding
- To'lov: `margin: 1.5mm auto 0.5mm auto`
- Tafsilotlar: `margin: 0 auto 1.5mm auto`
- Ixcham va professional

## ✅ Afzalliklar

1. ✅ **Aniq ma'lumot**: Har bir to'lov turi va summasi ko'rsatiladi
2. ✅ **Ixcham dizayn**: Maksimum 2 qator
3. ✅ **O'qilishi oson**: Bold va kulrang ranglar
4. ✅ **58mm uchun optimallashtirilgan**: Barcha matn sig'adi
5. ✅ **Professional**: Haqiqiy do'kon cheklari kabi

## 🔧 Qo'shimcha Imkoniyatlar

Agar kerak bo'lsa, quyidagilarni qo'shish mumkin:
- Qaytim summasi (agar naqd to'lovda ortiqcha berilgan bo'lsa)
- To'lov vaqti (agar kerak bo'lsa)
- Mijoz nomi (agar qarz bo'lsa)

**Tayyor!** 🎉
