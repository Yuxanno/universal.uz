# Qarz Daftarcha - Mijozlar Bo'yicha Guruhlash

## Amalga Oshirilgan O'zgarishlar

### 1. Backend (Server)
**Fayl**: `universal.uz/server/src/routes/debts.js`

✅ Yangi endpoint qo'shildi: `GET /debts/grouped`
- Qarzlarni mijozlar bo'yicha guruhlaydi
- Har bir mijoz uchun:
  - Jami qarz summasi
  - To'langan summa
  - Qoldiq summa
  - Qarzlar soni
  - Barcha qarzlar ro'yxati
  - Eng yangi qarz sanasi
  - Eng eski muddat

### 2. Frontend (Client)
**Fayl**: `universal.uz/client/src/pages/admin/Debts.tsx`

#### Yangi Funksiyalar:
✅ **Ikkita ko'rinish rejimi**:
- **Mijozlar bo'yicha** (grouped) - Asosiy ko'rinish
- **Barcha qarzlar** (individual) - Eski ko'rinish

✅ **Mijozlar bo'yicha ko'rinish**:
- Har bir mijoz uchun bitta karta
- Kartada ko'rsatiladi:
  - Mijoz ismi va telefon raqami
  - Jami qarz, to'langan va qoldiq summalar
  - Qarzlar soni
  - Holat (kutilmoqda, muddati o'tgan, to'langan)
- Kartani bosish bilan qarzlar ro'yxati ochiladi
- Har bir qarz uchun:
  - Izoh (description)
  - Muddat
  - Zalog (agar mavjud bo'lsa)
  - Qarz, to'langan va qoldiq summalar
  - To'lov, tahrirlash va o'chirish tugmalari

✅ **Qidiruv va Filtr**:
- Mijoz ismi yoki telefon raqami bo'yicha qidiruv
- Holat bo'yicha filtr (kutilmoqda, bugun to'lanadigan, to'langan, muddati o'tgan)
- Ikkala ko'rinishda ham ishlaydi

✅ **Mijoz Tanlash**:
- Qidiruv inputi bilan mijoz tanlash
- Dropdown ro'yxatda mijozlar ko'rsatiladi
- Tanlangan mijoz uchun vizual ko'rsatkich (✓ Tanlandi)
- Tanlangan mijozni tozalash tugmasi
- Yangi mijoz qo'shish imkoniyati

### 3. Xatoliklar Tuzatildi

✅ **500 Server Error**:
- `dueDate` maydoni uchun `null` qiymat qo'llab-quvvatlanadi
- Bo'sh muddat yuborilganda xatolik yuz bermaydi

✅ **Mijoz Tanlash Validatsiyasi**:
- Qarz qo'shishda mijoz tanlanmaganida ogohlantirish
- Formani yuborishdan oldin tekshirish

## Foydalanish

### Mijozlar Bo'yicha Ko'rinish (Tavsiya Etiladi)
1. "Qarz daftarcha" sahifasiga o'ting
2. "Mijozlar bo'yicha" tugmasini bosing
3. Mijozlar ro'yxatini ko'ring
4. Mijoz kartasini bosing - qarzlar ro'yxati ochiladi
5. Qarzga to'lov qilish, tahrirlash yoki o'chirish mumkin

### Barcha Qarzlar Ko'rinishi
1. "Barcha qarzlar" tugmasini bosing
2. Barcha qarzlar jadval ko'rinishida ko'rsatiladi
3. Har bir qarz alohida qator sifatida

### Yangi Qarz Qo'shish
1. "Yangi qarz" tugmasini bosing
2. Mijozni qidiring va tanlang
3. Summa, muddat, izoh va zalogni kiriting
4. "Saqlash" tugmasini bosing

### To'lov Qilish
1. Mijoz kartasidagi qarzni toping
2. "To'lov" tugmasini bosing
3. To'lov summasini kiriting
4. "Tasdiqlash" tugmasini bosing

## Texnik Tafsilotlar

### TypeScript Interface
```typescript
interface GroupedDebt {
  customer: {
    _id: string;
    name: string;
    phone: string;
    address?: string;
  };
  totalAmount: number;
  totalPaid: number;
  remainingAmount: number;
  debtCount: number;
  debts: Debt[];
  latestDebt: string;
  oldestDueDate: string | null;
  status: 'pending' | 'overdue' | 'paid';
}
```

### API Endpoints
- `GET /debts` - Barcha qarzlar (individual)
- `GET /debts/grouped` - Mijozlar bo'yicha guruhlangan qarzlar
- `POST /debts` - Yangi qarz qo'shish
- `POST /debts/:id/payment` - To'lov qilish
- `PUT /debts/:id` - Qarzni tahrirlash
- `DELETE /debts/:id` - Qarzni o'chirish

## Afzalliklari

✅ Mijozlar bo'yicha tashkil etilgan
✅ Har bir mijozning umumiy qarz holatini ko'rish oson
✅ Qarzlar tarixi bir joyda
✅ Qidiruv va filtr imkoniyatlari
✅ Mobil qurilmalar uchun optimallashtirilgan
✅ Kassadan va qarz daftarchadan qo'shilgan qarzlar bir joyda

## Keyingi Qadamlar (Ixtiyoriy)

- [ ] Qarz to'lov grafigi (chart)
- [ ] Excel/PDF eksport
- [ ] SMS/Telegram xabarnomalar
- [ ] Qarz tarixi statistikasi
- [ ] Mijoz profili sahifasi
