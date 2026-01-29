# Chek O'rtaga Joylashtirish va Logo Rangi

## 🎯 Muammolar va Yechimlar

### 1. O'rtaga Kelmayotgan Muammo
**Muammo**: Margin default qilsangiz ham chek o'rtaga kelmayapti

**Yechim**: Barcha elementlarga `margin: 0 auto` va `width: 100%` qo'shildi

### 2. Logo Rangi
**Muammo**: Logo rangsiz (oq-qora)

**Yechim**: CSS filter bilan logo rangini yaxshilash

## ✅ O'zgarishlar

### 1. Body Centering
```css
body { 
  font-family: 'Courier New', monospace;
  font-size: 13px;
  width: 58mm;
  padding: 3mm;
  margin: 0 auto;  /* ✅ O'rtaga joylashtirish */
  text-align: center;
}
```

### 2. Header Centering
```css
.header { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 2mm; 
  margin: 0 auto 2mm auto;  /* ✅ O'rtaga joylashtirish */
  width: 100%;
}
```

### 3. Logo Rangi va Kontrast
```css
.logo { 
  width: auto; 
  height: 12mm;
  object-fit: contain;
  filter: brightness(0.8) saturate(1.2);  /* ✅ Rang va kontrast */
}
```

**Filter tushuntirish:**
- `brightness(0.8)` - Yorqinlikni 20% kamaytiradi (logo to'qroq ko'rinadi)
- `saturate(1.2)` - Rangni 20% kuchaytiradi (logo ranglirog'i ko'rinadi)

### 4. Matn Ranglari
```css
.title { 
  font-size: 18px; 
  font-weight: bold; 
  line-height: 1.2;
  text-align: left;
  color: #1a1a1a;  /* ✅ To'q qora */
}

.subtitle { 
  font-size: 10px; 
  font-weight: normal; 
  line-height: 1.2;
  text-align: left;
  color: #333;  /* ✅ Kulrang-qora */
}
```

### 5. Barcha Elementlar O'rtada
```css
.contacts { 
  margin: 0 auto 2mm auto; 
  width: 100%;
}

.line { 
  margin: 1.5mm auto; 
  width: 100%; 
}

.meta { 
  margin: 0 auto 0.5mm auto; 
  width: 100%; 
}

.items { 
  margin: 0 auto; 
  width: 100%; 
}

.total-box { 
  margin: 1.5mm auto; 
  width: 100%; 
}

.payment { 
  margin: 1.5mm auto; 
  width: 100%; 
}
```

### 6. Print Media Query
```css
@media print {
  .logo { filter: none; }
}
```

**Sabab**: Thermal printer oq-qora chop etadi, shuning uchun print vaqtida filter o'chiriladi. Lekin ekranda rangli ko'rinadi.

## 🎨 Logo Filter Variantlari

Agar logo rangini o'zgartirmoqchi bo'lsangiz:

### Variant 1: Hozirgi (Tavsiya etiladi)
```css
filter: brightness(0.8) saturate(1.2);
```
- Ekranda: Rangli va kontrast
- Printda: Oq-qora (thermal printer)

### Variant 2: Ko'proq Rang
```css
filter: brightness(0.7) saturate(1.5);
```
- Ekranda: Juda rangli va to'q
- Printda: Oq-qora

### Variant 3: Sepia (Jigarrang)
```css
filter: sepia(0.5) brightness(0.9);
```
- Ekranda: Jigarrang ohang
- Printda: Oq-qora

### Variant 4: Hue Rotate (Rang o'zgartirish)
```css
filter: hue-rotate(180deg) saturate(1.3);
```
- Ekranda: Ranglar teskari (masalan, qizil → ko'k)
- Printda: Oq-qora

### Variant 5: Filtersiz (Original)
```css
/* filter yo'q */
```
- Ekranda: Original rang
- Printda: Oq-qora

## 📊 Natija

### Ekranda:
- ✅ Barcha elementlar o'rtada
- ✅ Logo rangli va kontrast
- ✅ Matnlar to'q rangda
- ✅ Professional ko'rinish

### Printda (Thermal):
- ✅ Barcha elementlar o'rtada
- ✅ Logo oq-qora (thermal printer)
- ✅ Matnlar qora
- ✅ Aniq va o'qilishi oson

## 🔧 Qo'shimcha Sozlamalar

Agar hali ham o'rtaga kelmasa:

### 1. Printer Sozlamalari
- Margins: 0mm (barcha tomonlar)
- Scale: 100% (Default)
- Paper size: 58mm (Continuous)

### 2. Browser Print Sozlamalari
- Margins: None
- Scale: Default
- Background graphics: Enabled (logoni ko'rish uchun)

### 3. CSS Debugging
Agar muammo bo'lsa, quyidagi CSS qo'shing:
```css
* { 
  outline: 1px solid red; /* Elementlarni ko'rish uchun */
}
```

## ✅ Xulosa

Endi chek:
- ✅ To'liq o'rtada joylashgan
- ✅ Logo ekranda rangli
- ✅ Logo printda oq-qora (thermal printer)
- ✅ Barcha matnlar o'rtada
- ✅ Professional va chiroyli

**Tayyor!** 🎉
