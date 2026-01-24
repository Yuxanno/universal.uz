# Warehouse Migration Scripts

Bu scriptlar barcha mahsulotlarni "Asosiy ombor"ga ko'chirish uchun yaratilgan.

## Scripts

### 1. `forceAllToMainWarehouse.js` ⭐ (Asosiy script)
Barcha mahsulotlar va inventory'larni "Asosiy ombor"ga ko'chiradi.

**Nima qiladi:**
- Product.warehouse maydonini "Asosiy ombor"ga o'zgartiradi
- WarehouseInventory'dagi barcha yozuvlarni "Asosiy ombor"ga ko'chiradi
- Boshqa omborlardagi inventory'larni "Asosiy ombor"ga qo'shadi
- Eski inventory yozuvlarini o'chiradi

**Ishlatish:**
```bash
node server/scripts/forceAllToMainWarehouse.js
```

### 2. `moveAllToMainWarehouse.js`
Faqat Product.warehouse maydonini yangilaydi.

**Ishlatish:**
```bash
node server/scripts/moveAllToMainWarehouse.js
```

### 3. `checkWarehouseDistribution.js`
Mahsulotlarning omborlarga taqsimlanishini ko'rsatadi.

**Ishlatish:**
```bash
node server/scripts/checkWarehouseDistribution.js
```

### 4. `listWarehouses.js`
Barcha omborlarni ro'yxatini ko'rsatadi.

**Ishlatish:**
```bash
node server/scripts/listWarehouses.js
```

## Natija

✅ **1021 ta mahsulot** "Asosiy ombor"ga ko'chirildi
✅ **965 ta inventory** yozuvi "Asosiy ombor"da
✅ **8 ta inventory** "Qishki ombor"dan "Asosiy ombor"ga ko'chirildi
✅ Boshqa omborlarda inventory qolmadi

## Frontend o'zgarishlari

- "Barcha omborlar" select/option olib tashlandi
- Faqat "Asosiy ombor" mahsulotlari ko'rsatiladi
- Sarlavha: "Tovarlar (Asosiy ombor)"
