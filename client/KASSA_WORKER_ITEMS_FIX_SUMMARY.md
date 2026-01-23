# Kassaga Yuklash - Narx va Son Fix

## Muammo
StaffReceipts sahifasida "Kassaga yuklash" bosilganda, xodim tomonidan kiritilgan narx va son kassaga o'tmayotgan edi.

## Sabab
Kassa sahifasida `loadWorkerItems` funksiyasi mahsulotlarni yuklayotgan edi, lekin narxlarni `localPrices` state'iga saqlamayotgan edi. Natijada:
- Mahsulotlar cart'ga qo'shilardi ✅
- Miqdor (cartQuantity) to'g'ri o'tardi ✅
- Lekin narx (price) ko'rinmayotgan edi ❌

## Yechim

### File: `client/src/pages/admin/Kassa.tsx`

**Eski kod:**
```typescript
const loadWorkerItems = () => {
  const kassaItems = localStorage.getItem('kassaItems');
  const receiptId = localStorage.getItem('kassaReceiptId');
  
  if (kassaItems) {
    try {
      const items = JSON.parse(kassaItems);
      setCart(items); // Faqat cart'ga qo'shilardi
      
      if (receiptId) {
        setWorkerReceiptIds(receiptId.split(','));
      }
      localStorage.removeItem('kassaItems');
      localStorage.removeItem('kassaReceiptId');
    } catch (err) {
      console.error('Error loading worker items:', err);
    }
  }
};
```

**Yangi kod:**
```typescript
const loadWorkerItems = () => {
  const kassaItems = localStorage.getItem('kassaItems');
  const receiptId = localStorage.getItem('kassaReceiptId');
  
  if (kassaItems) {
    try {
      const items = JSON.parse(kassaItems);
      console.log('📦 Kassaga yuklangan mahsulotlar:', items);
      setCart(items);
      
      // ✅ Narxlarni localPrices state'iga saqlash
      const prices: {[key: string]: string} = {};
      items.forEach((item: CartItem) => {
        if (item.price) {
          prices[item._id] = item.price.toString();
        }
      });
      console.log('💰 Narxlar:', prices);
      setLocalPrices(prices);
      
      if (receiptId) {
        setWorkerReceiptIds(receiptId.split(','));
      }
      localStorage.removeItem('kassaItems');
      localStorage.removeItem('kassaReceiptId');
    } catch (err) {
      console.error('Error loading worker items:', err);
    }
  }
};
```

## O'zgarishlar

1. **Narxlarni saqlash:**
   - Har bir mahsulotning narxini `localPrices` object'iga qo'shadi
   - Key: mahsulot ID (`item._id`)
   - Value: narx string formatda (`item.price.toString()`)

2. **Console log'lar:**
   - Yuklangan mahsulotlarni ko'rsatadi
   - Narxlarni ko'rsatadi
   - Debug qilish uchun qulay

## Qanday ishlaydi

### StaffReceipts'dan yuborilgan ma'lumot:
```javascript
{
  _id: "product123",
  name: "Mahsulot nomi",
  code: "001",
  price: 50000,           // ← Xodim kiritgan narx
  cartQuantity: 5,        // ← Xodim kiritgan son
  quantity: 0
}
```

### Kassa'da qabul qilingan ma'lumot:
```javascript
// Cart state
[
  {
    _id: "product123",
    name: "Mahsulot nomi",
    code: "001",
    price: 50000,
    cartQuantity: 5,
    quantity: 0
  }
]

// LocalPrices state
{
  "product123": "50000"  // ← Narx saqlanadi
}
```

## Natija

✅ **Mahsulot nomi** - To'g'ri ko'rinadi
✅ **Mahsulot kodi** - To'g'ri ko'rinadi
✅ **Miqdor (Son)** - Xodim kiritgan son ko'rinadi
✅ **Narx** - Xodim kiritgan narx ko'rinadi
✅ **Jami summa** - To'g'ri hisoblanadi

## Test qilish

1. StaffReceipts sahifasiga o'ting
2. Xodim uchun mahsulot qo'shing (narx va son kiriting)
3. "Kassaga yuklash" tugmasini bosing
4. Kassa sahifasiga o'tadi
5. Console'da log'larni tekshiring:
   - `📦 Kassaga yuklangan mahsulotlar:` - mahsulotlar ro'yxati
   - `💰 Narxlar:` - narxlar object'i
6. Cart'da mahsulotlarni tekshiring:
   - Narx to'g'ri ko'rinishi kerak
   - Miqdor to'g'ri ko'rinishi kerak
   - Jami summa to'g'ri hisoblanishi kerak

## Status

✅ **FIXED** - Narx va son endi to'g'ri kassaga o'tadi
