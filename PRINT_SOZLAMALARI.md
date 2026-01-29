# Chek Print Sozlamalari

## Muammo
Chekni print qilganda pastda ortiqcha joy qolib ketyapti. Margin 0 qilsangiz chap tomonga o'tib qolyapti.

## Yechim

### 1. Browser Print Sozlamalari (Tavsiya Etiladi)

**Chrome/Edge da:**
1. Print oynasini oching (Ctrl+P)
2. "More settings" ni bosing
3. Quyidagi sozlamalarni o'zgartiring:

```
Paper size: USER (yoki Custom)
Margins: None
Scale: Default (100%)
Pages per sheet: 1
```

**Muhim:** 
- "Margins: None" ni tanlang - bu barcha tomondan marginni olib tashlaydi
- Agar chap tomonga o'tsa, "Scale" ni 90-95% ga kamaytiring
- "Background graphics" ni yoqing (agar kerak bo'lsa)

### 2. Kod Orqali Sozlash (Hozirgi Holat)

Hozirda kodda quyidagi sozlamalar mavjud:

```css
@page { 
  size: 2in 4in;  /* Chek o'lchami: 2 dyuym x 4 dyuym */
  margin: 0;      /* Barcha marginlar 0 */
}

body { 
  width: 2in;
  padding: 3mm;   /* Ichki padding */
}
```

### 3. Agar Pastda Joy Ko'p Qolsa

**Variant A: Chek balandligini kamaytirish**

Agar mahsulotlar kam bo'lsa va pastda joy ko'p qolsa, `@page` da balandlikni avtomatik qilish mumkin:

```css
@page { 
  size: 2in auto;  /* Balandlik avtomatik */
  margin: 0;
}
```

**Variant B: Padding kamaytirish**

Body padding ni kamaytiring:

```css
body { 
  padding: 2mm;  /* 3mm dan 2mm ga */
}
```

### 4. Printer Sozlamalari

Agar thermal printer ishlatayotgan bo'lsangiz:

1. **Printer Properties** ga o'ting
2. **Paper Size** ni to'g'ri tanlang (58mm yoki 80mm)
3. **Margins** ni 0 qiling
4. **Auto Cut** ni yoqing (agar printer qo'llab-quvvatlasa)

### 5. Optimal Sozlamalar (Tavsiya)

```css
@page { 
  size: 58mm auto;  /* 58mm kenglik, balandlik avtomatik */
  margin: 0;
}

body { 
  font-family: 'Courier New', monospace;
  font-size: 13px;
  width: 58mm;
  padding: 2mm;
  text-align: center;
}
```

## Qo'shimcha Maslahatlar

### Chap Tomonga O'tishni Oldini Olish

Agar margin 0 qilganda chap tomonga o'tsa:

1. **Browser Print Preview da:**
   - "Center horizontally" ni belgilang
   - Yoki "Scale" ni 95% ga qo'ying

2. **CSS da:**
```css
body {
  margin: 0 auto;  /* Markazga joylashtirish */
}
```

### Pastdagi Joyni Kamaytirish

1. **Barcha margin va padding larni tekshiring:**
```css
.payment { 
  font-size: 12px; 
  margin: 1mm 0;  /* 1.5mm dan 1mm ga */
}
```

2. **Oxirgi element dan keyin margin qo'shmang**

3. **Body padding ni kamaytiring:**
```css
body { 
  padding: 2mm 3mm;  /* Yuqori/pastdan 2mm, chap/o'ngdan 3mm */
}
```

## Amaliy Qo'llanma

### Qadamma-qadam:

1. **Birinchi:** Browser print sozlamalarida "Margins: None" ni tanlang
2. **Ikkinchi:** Agar chap tomonga o'tsa, "Scale" ni 90-95% ga qo'ying
3. **Uchinchi:** Agar pastda joy ko'p qolsa, kodda `@page { size: 2in auto; }` qiling
4. **To'rtinchi:** Padding larni kamaytiring: `padding: 2mm;`

## Hozirgi O'zgarishlar

✅ "Savdo markazi" yozuvi olib tashlandi
✅ "Xaridingiz uchun rahmat! Yana kutamiz!" yozuvi olib tashlandi
✅ Footer CSS stillari olib tashlandi

Natijada chek qisqaroq va ixchamroq bo'ldi!

## Test Qilish

1. Kassaga o'ting
2. Mahsulot qo'shing
3. To'lov qiling
4. Print tugmasini bosing
5. Print preview da tekshiring
6. Sozlamalarni o'zgartiring
7. Print qiling

## Muammo Bo'lsa

Agar hali ham muammo bo'lsa:
- Printer driver ni yangilang
- Boshqa browser da sinab ko'ring (Chrome, Edge, Firefox)
- Printer sozlamalarini reset qiling
- Thermal printer bo'lsa, printer utility dasturidan sozlang
