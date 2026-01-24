# Database Scripts - Dublikat Mahsulotlarni Oldini Olish

Bu scriptlar mahsulot dublikatlarini topish, o'chirish va database darajasida unique constraint qo'shish uchun.

## 🚀 Ishlatish Tartibi

### 1. Avval dublikatlarni toping va o'chiring

```bash
cd server
node scripts/findAndRemoveDuplicates.js
```

Bu script:
- ✅ Barcha dublikat mahsulotlarni topadi (nom bo'yicha, case-insensitive)
- ✅ Eng eski mahsulotni saqlaydi, qolganlarini o'chiradi
- ✅ Kod bo'yicha dublikatlarni ham tekshiradi
- ⚠️ 5 soniya kutadi (bekor qilish uchun Ctrl+C)

**Natija:**
```
⚠️  Found 2 duplicate product names:

1. "twig pad o'g'il" (2 copies):
   ✅ KEEP - ID: 507f1f77bcf86cd799439011
           Code: 980, Qty: 2000
           Created: 1/19/2026, 10:30:00 AM
   ❌ REMOVE - ID: 507f1f77bcf86cd799439012
           Code: 979, Qty: 2000
           Created: 1/19/2026, 10:35:00 AM

✅ Successfully removed 1 duplicate products!
```

### 2. Keyin unique indexlarni yarating

```bash
node scripts/createProductIndexes.js
```

Bu script:
- ✅ `code` uchun unique index yaratadi
- ✅ `name` uchun case-insensitive unique index yaratadi
- ✅ `warehouse + code` uchun compound index yaratadi
- ⚠️ Agar dublikatlar qolgan bo'lsa, xabar beradi

**Natija:**
```
✅ Created unique index for code
✅ Created case-insensitive unique index for name
✅ Created compound index for warehouse + code

📊 Final indexes:
   - _id_: {"_id":1}
   - code_unique: {"code":1}
   - name_unique_case_insensitive: {"name":1}
   - warehouse_code: {"warehouse":1,"code":1}

✅ Index creation completed successfully!
```

## 🛡️ Himoya Darajalari

### 1. Database Level (Eng kuchli)
- MongoDB unique index
- Case-insensitive (katta-kichik harf farqi yo'q)
- Har qanday dasturdan kiritilsa ham bloklaydi

### 2. Backend Level
- Express route validation
- Duplicate check before save
- MongoDB error handling (code 11000)
- HTTP 409 Conflict response

### 3. Frontend Level
- Real-time validation (onBlur)
- Submit validation
- User-friendly error messages
- Disabled submit button

## 📋 Xatolik Kodlari

| Kod | Ma'nosi | Sabab |
|-----|---------|-------|
| 409 | Conflict | Dublikat mahsulot |
| 400 | Bad Request | Noto'g'ri ma'lumot |
| 500 | Server Error | Server xatosi |

## 🔍 Qo'shimcha Tekshiruvlar

### Barcha mahsulotlarni ko'rish
```bash
mongosh
use pos-system
db.products.find({}, {name: 1, code: 1}).pretty()
```

### Dublikatlarni qo'lda topish
```bash
db.products.aggregate([
  {
    $group: {
      _id: { $toLower: "$name" },
      count: { $sum: 1 },
      docs: { $push: { name: "$name", code: "$code" } }
    }
  },
  { $match: { count: { $gt: 1 } } }
])
```

### Indexlarni ko'rish
```bash
db.products.getIndexes()
```

## ⚠️ Muhim Eslatmalar

1. **Backup oling!** Scriptlarni ishlatishdan oldin database backup oling
2. **Production'da test qiling** - avval test muhitda sinab ko'ring
3. **Dublikatlarni tekshiring** - o'chirishdan oldin qaysi mahsulotni saqlashni aniqlang
4. **Indexlar yaratilgandan keyin** - yangi dublikat qo'shish imkonsiz bo'ladi

## 🐛 Muammolar

### "Cannot create unique index" xatosi
**Sabab:** Hali dublikatlar mavjud
**Yechim:** 
```bash
node scripts/findAndRemoveDuplicates.js
```

### "Duplicate key error" xatosi
**Sabab:** Unique constraint ishlayapti (bu yaxshi!)
**Yechim:** Boshqa nom yoki kod kiriting

## 📞 Yordam

Muammo bo'lsa:
1. Script loglarini o'qing
2. MongoDB loglarini tekshiring
3. Backend console.error() larni ko'ring
