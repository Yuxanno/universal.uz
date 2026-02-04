# 🔍 QARZ MUAMMOSI TAHLILI VA YECHIM

## 📋 MUAMMO

Mirfayz mijozning qarzi ikki joyda turlicha ko'rsatilgan edi:

- **Qarz daftarcha (Debts):** 3,028,700 so'm ✅ TO'G'RI
- **Mijozlar (Customer.debt):** 2,353,700 so'm ❌ NOTO'G'RI
- **Farqi:** 675,000 so'm

## 🔎 SABAB

Sistemada ikki xil qarz hisoblash usuli mavjud:

### 1. Qarz Daftarcha (Debts Collection) - ASOSIY MANBA
- Har bir qarz alohida yoziladi
- Har bir to'lov kuzatiladi
- Haqiqiy qarz holati bu yerda

### 2. Mijozlar (Customer.debt) - KO'RSATISH UCHUN
- Faqat umumiy qarzni ko'rsatish uchun
- Qarz qo'shilganda yoki to'langanda yangilanishi kerak
- Lekin ba'zi hollarda sinxronlashmaydi

## 🐛 NIMA BO'LGAN?

13-qarzga qarang:
- Jami qarz: 500,000 so'm
- To'langan: 700,000 so'm (200,000 so'm ortiqcha!)
- Qoldiq: -200,000 so'm

Bu ortiqcha to'lov Customer.debt dan to'g'ri ayrilmagan. Shuning uchun farq paydo bo'lgan.

## ✅ YECHIM

Customer.debt ni Qarz daftarchadagi haqiqiy qarzga moslash kerak.

### Qanday tuzatdik:

```javascript
// 1. Qarz daftarchadagi haqiqiy qarzni hisoblash
const totalRemainingDebt = debts.reduce((sum, debt) => {
  return sum + (debt.amount - debt.paidAmount);
}, 0);

// 2. Customer.debt ni yangilash
customer.debt = totalRemainingDebt;
await customer.save();
```

## 📊 NATIJA

**OLDIN:**
- Qarz daftarcha: 3,028,700 so'm
- Customer.debt: 2,353,700 so'm
- Farqi: 675,000 so'm ❌

**KEYIN:**
- Qarz daftarcha: 3,028,700 so'm
- Customer.debt: 3,028,700 so'm
- Farqi: 0 so'm ✅

## 🎯 QAYSI TO'G'RI?

**Qarz daftarcha (3,028,700 so'm) to'g'ri!**

Sabablari:
1. Har bir qarz alohida yozilgan
2. Har bir to'lov kuzatilgan
3. Hisob-kitob aniq
4. Mijozlar sahifasi faqat ko'rsatish uchun

## 💡 KELAJAKDA OLDINI OLISH

Sistemada qarz to'lash logikasi to'g'ri ishlaydi, lekin ba'zi maxsus holatlarda (masalan, ortiqcha to'lov) Customer.debt yangilanmaydi.

### Tavsiya:
Customer.debt ni har doim Qarz daftarchadagi haqiqiy qarzdan hisoblash kerak, alohida saqlash emas.

## 🛠️ SCRIPTLAR

### Tekshirish:
```bash
cd server
node check-mirfayz-debt.js
```

### Tuzatish:
```bash
cd server
node fix-mirfayz-debt.js
```

## 📝 XULOSA

Muammo hal qilindi. Endi ikki joy ham bir xil qarzni ko'rsatyapti: **3,028,700 so'm**

---

**Sana:** 04.02.2026
**Tuzatdi:** Senior Developer
**Status:** ✅ Hal qilindi
