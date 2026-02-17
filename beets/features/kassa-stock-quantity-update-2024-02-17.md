# Kassa - Mahsulot Miqdorini O'zgartirish

**Sana**: 2024-02-17  
**Holat**: ✅ Amalga oshirilgan

## Muammo

Kassir yoki admin kassa sahifasidan mahsulot miqdorini (ombordagi zaxira) o'zgartira olmaydi. Mahsulot miqdorini o'zgartirish uchun alohida mahsulotlar sahifasiga o'tish kerak edi.

## Yechim

Kassa sahifasida mahsulot miqdorini to'g'ridan-to'g'ri o'zgartirish imkoniyati qo'shildi:

### Backend (API)

1. **Controller** (`server/src/controllers/product.controller.js`):
   - `updateQuantity` - mahsulot miqdorini yangilash

2. **Service** (`server/src/services/product.service.js`):
   - `updateQuantity` - business logic
   - Validatsiya: miqdor 0 dan kichik bo'lmasligi kerak
   - Logging va error handling

3. **Route** (`server/src/routes/products.v2.js`):
   ```
   PATCH /api/v2/products/:id/quantity
   ```
   - Auth: admin, cashier
   - Validator: `productValidators.updateQuantity`

4. **Validator** (`server/src/validators/product.validator.js`):
   - `updateQuantity` - request validatsiyasi
   - Miqdor: butun son, 0 dan katta yoki teng

### Frontend

1. **CartItemRow komponenti** (`client/src/components/pos/CartItemRow.tsx`):
   - Ombor miqdorini ikki marta bosish orqali tahrirlash
   - `editingStock` state - tahrirlash rejimi
   - `tempStock` state - vaqtinchalik qiymat
   - `handleStockDoubleClick` - tahrirlashni boshlash
   - `handleStockBlur` - o'zgarishlarni saqlash
   - `onStockQuantityChange` prop - callback funksiya

2. **Kassa sahifasi** (`client/src/pages/admin/Kassa.tsx`):
   - `handleStockQuantityChange` - API ga so'rov yuborish
   - Cart'ni yangilash
   - Mahsulotlarni refresh qilish
   - Toast bildirishnoma

## Foydalanish

### Desktop

1. Kassa sahifasida savatdagi mahsulotni toping
2. "Omborda" ustunidagi miqdorni bir marta bosing
3. Yangi miqdorni kiriting (cursor avtomatik oxirida turadi)
4. Enter bosing yoki input'dan chiqing
5. Miqdor avtomatik yangilanadi

### Mobile

Hozircha faqat desktop versiyada mavjud.

## Xususiyatlar

- ✅ Bir marta bosish orqali tahrirlash
- ✅ Cursor avtomatik oxirida turadi
- ✅ Text-align: right (o'ng tomonda)
- ✅ Real-time yangilanish
- ✅ Validatsiya (0 dan kichik bo'lmasligi)
- ✅ Toast bildirishnoma
- ✅ Error handling
- ✅ Avtomatik refresh
- ✅ Hover effekt (cursor pointer)
- ✅ Tooltip (bosing tahrirlash uchun)

## Texnik Detalllar

### Cart Item ID vs Product ID

Kassa sahifasida mahsulot savatga qo'shilganda:
- Yangi unique cart ID yaratiladi: `${product._id}_${Date.now()}_${Math.random()}`
- Asl mahsulot ID `_productId` ga saqlanadi
- Bu bir xil mahsulotni bir necha marta qo'shish imkonini beradi

Shuning uchun miqdorni yangilashda:
```typescript
const productId = (cartItem as any)._productId || id;
```

### API Request

```typescript
PATCH /api/products/:id/quantity  // Eski API (hozirda ishlatilmoqda)
// yoki
PATCH /api/v2/products/:id/quantity  // Yangi API (kelajakda)

{
  "quantity": 100
}
```

**Eslatma**: Hozirda eski API (`/api/products`) ishlatilmoqda, chunki yangi API (`/api/v2/products`) route tartib muammosi tufayli ishlamayapti. Kelajakda yangi API'ga o'tish kerak.

### API Response

```typescript
{
  "success": true,
  "message": "Mahsulot miqdori yangilandi",
  "data": {
    "_id": "...",
    "name": "...",
    "quantity": 100,
    ...
  }
}
```

### Frontend Flow

```
User clicks once → editingStock = true
Input auto-focused → cursor at end
User enters value → tempStock updated
User presses Enter/blur → handleStockBlur
  → onStockQuantityChange(id, quantity)
    → Get productId from _productId or id
    → API call with productId
    → Update all cart items with same productId
    → Refresh products
    → Show toast
```

## Xavfsizlik

- ✅ Auth middleware (admin, cashier)
- ✅ Input validatsiya (Joi)
- ✅ Error handling
- ✅ Logging

## Kelajakda

- [ ] Mobile versiyada ham qo'shish
- [ ] Bulk update (bir nechta mahsulotni bir vaqtda)
- [ ] History tracking (kim, qachon o'zgartirgan)
- [ ] Undo/Redo funksiyasi

## Bog'liq Fayllar

- `server/src/routes/products.js` (PATCH /:id/quantity endpoint - hozirda ishlatilmoqda)
- `server/src/routes/products.v2.js` (kelajakda)
- `server/src/controllers/product.controller.js` (kelajakda)
- `server/src/services/product.service.js` (kelajakda)
- `server/src/validators/product.validator.js` (kelajakda)
- `client/src/components/pos/CartItemRow.tsx`
- `client/src/pages/admin/Kassa.tsx`
- `client/src/types/index.ts` (CartItem type)

## Muhim Eslatmalar

1. Cart item ID va product ID farq qiladi
2. Bir xil mahsulot savatda bir necha marta bo'lishi mumkin
3. Miqdor yangilanganda barcha cart itemlar yangilanadi
4. Refresh products avtomatik chaqiriladi
5. Hozirda eski API (`/api/products`) ishlatilmoqda
6. Server restart qilish kerak (yangi endpoint uchun)
