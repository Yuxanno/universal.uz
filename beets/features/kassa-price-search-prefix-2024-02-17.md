# Kassa - Narx Bo'yicha Prefiks Qidirish

**Sana**: 2024-02-17  
**Muallif**: AI Assistant  
**Holat**: ✅ Amalga oshirilgan

## 📋 Muammo

Kassada mahsulot qidirishda raqam kiritilganda (masalan, "5000") nomida shu raqam bo'lgan barcha mahsulotlar chiqardi:
- 5000T deb qidirganda: 5000T, 15000T, 25000T, 45000T - hammasi chiqardi
- Foydalanuvchi faqat 5000T bilan **boshlanadigan** narxlarni ko'rishni xohlaydi

### Sabab
Qidirish funksiyasi mahsulot nomida ham qidirmoqda edi. Mahsulot nomi "JENS KOJA20,15000T" bo'lsa, "5000" qidirganda nom ichida "15000" topilardi va mahsulot natijaga qo'shilardi.

## ✅ Yechim

Qidirish funksiyasida **prefiks** (boshidan) qidirish amalga oshirildi:

### 1. Faqat Raqam (5000)
- Faqat narx maydonlarini tekshirish (costPrice, optomPrice, donaPrice)
- Mahsulot nomini tekshirmaslik
- Narxni string ga o'tkazib, **prefiks** qidirish

### 2. Harf + Raqam (5000T)
- Kod bo'yicha prefiks qidirish
- Nom bo'yicha **faqat boshidan** yoki **so'z boshidan** qidirish
- Nom o'rtasida qidirmaslik

### Qidirish Logikasi

```typescript
// 5000T deb qidirganda:
// ✅ "5000T COLA"           -> topiladi (nom boshidan)
// ✅ "COLA 5000T"           -> topiladi (so'z boshidan)
// ✅ "CHIPS 5000T KATTA"    -> topiladi (so'z boshidan)
// ❌ "JENS KOJA20,15000T"   -> topilmaydi (15000T - 5000T bilan boshlanmaydi)
// ❌ "IRINKA3035,25,15000T" -> topilmaydi (15000T - 5000T bilan boshlanmaydi)
```

## 🔧 O'zgarishlar

### Fayl: `client/src/utils/productSearch.ts`

#### 1. Faqat Raqam Qidiruvi (5000)

**Oldingi kod**:
```typescript
// Faqat to'liq tenglik tekshirilardi
if (optomPrice != null && Number(optomPrice) === numValue) {
    return true;
}
```

**Yangi kod**:
```typescript
// Barcha narx turlarini tekshirish va prefiks qidirish
const costStr = costPrice != null ? String(costPrice) : '';
const optomStr = optomPrice != null ? String(optomPrice) : '';
const donaStr = donaPrice != null ? String(donaPrice) : '';

if (costStr.startsWith(q) || optomStr.startsWith(q) || donaStr.startsWith(q)) {
    return true;
}
```

#### 2. Harf + Raqam Qidiruvi (5000T)

**Oldingi kod**:
```typescript
// Nom ichida istalgan joyda qidirish
const name = normalize(product.name);
if (name.includes(q)) {
    return true;
}
```

**Yangi kod**:
```typescript
// Faqat nom boshidan yoki so'z boshidan qidirish
const name = normalize(product.name);

// 1. Nom boshidan
if (name.startsWith(q)) {
    return true;
}

// 2. So'z boshidan (bo'sh joy yoki verguldan keyin)
const words = name.split(/[\s,]+/);
for (const word of words) {
    if (word.startsWith(q)) {
        return true;
    }
}
```

## 📊 Natija

### Oldin
```
5000T qidirganda:
- JENS KOJA20,15000T (nom ichida "5000T" bor - 15000T)
- IRINKA3035,25,15000T (nom ichida "5000T" bor - 15000T)
- CHIPS TAPICHKA30,25000T (nom ichida "5000T" bor - 25000T)
- TOPIK6759 O'ZI 4,25000T (nom ichida "5000T" bor - 25000T)
```

### Keyin
```
5000T qidirganda:
- Faqat nom boshidan yoki so'z boshidan "5000T" bilan boshlanadigan mahsulotlar
- "JENS KOJA20,15000T" topilmaydi (15000T - 5000T bilan boshlanmaydi)
- "COLA 5000T" topiladi (so'z boshidan)
- "5000T CHIPS" topiladi (nom boshidan)
```

## 🎯 Afzalliklar

1. **Aniqlik**: Foydalanuvchi xohlagan narxni topadi
2. **Tezlik**: Keraksiz natijalar yo'q
3. **Intuitiv**: Qidirish kutilganidek ishlaydi
4. **Moslashuvchan**: Barcha narx turlarida ishlaydi (tan, optom, dona)

## 🔍 Qo'shimcha Ma'lumot

### Qidirish Prioriteti (Raqamli Qidiruv)
1. **Kod** - Avval kod bo'yicha qidirish (to'liq mos)
2. **Narx** - Agar kod topilmasa, narx bo'yicha prefiks qidirish

### Qidirish Turlari
- **Faqat harf**: Faqat nom bo'yicha qidirish
- **Faqat raqam**: Kod → Narx (prefiks)
- **Harf + raqam**: Kod va nom bo'yicha qidirish

## 📝 Eslatma

Bu o'zgarish faqat **raqamli qidiruv** uchun. Agar foydalanuvchi "cola 5000" deb qidirsa, nom bo'yicha qidirish ishlaydi va barcha "cola" mahsulotlar chiqadi.

## 🔗 Bog'liq Fayllar

- `client/src/utils/productSearch.ts` - Qidirish funksiyasi
- `client/src/pages/admin/Kassa.tsx` - Kassa sahifasi
- `client/src/components/pos/ProductSearchModal.tsx` - Qidirish modali

## 📚 Qo'shimcha Hujjatlar

- [search-optimization-2024-02-15.md](./search-optimization-2024-02-15.md) - Oldingi qidirish optimizatsiyasi
- [kassa-improvements-2024-02-15.md](./kassa-improvements-2024-02-15.md) - Kassa yaxshilanishlari
