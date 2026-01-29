# Chek Logo va Dizayn Yangilanishi

## 🎨 O'zgarishlar

### 1. Logo Qo'shildi
**File**: `universal.uz/client/src/pages/admin/Kassa.tsx`

Chek headeriga logo qo'shildi:
- **Logo fayl**: `/chek_logo.jpg` (public papkada)
- **Joylashuv**: Chap tomonda
- **O'lcham**: Balandligi 12mm (UNIVERSAL + Savdo markazi yozuvlari bilan bir xil)

### 2. Header Dizayni

#### Eski Dizayn:
```
        UNIVERSAL
    (faqat matn, markazda)
```

#### Yangi Dizayn:
```
[LOGO]  UNIVERSAL
        Savdo markazi
```

### 3. CSS Strukturasi

```css
.header { 
  display: flex; 
  align-items: center; 
  justify-content: center; 
  gap: 2mm; 
  margin-bottom: 2mm;
}

.logo { 
  width: auto; 
  height: 12mm;
  object-fit: contain;
}

.header-text { 
  display: flex; 
  flex-direction: column; 
  align-items: flex-start;
  justify-content: center;
}

.title { 
  font-size: 18px; 
  font-weight: bold; 
  line-height: 1.2;
  text-align: left;
}

.subtitle { 
  font-size: 10px; 
  font-weight: normal; 
  line-height: 1.2;
  text-align: left;
}
```

### 4. HTML Strukturasi

```html
<div class="header">
  <img src="/chek_logo.jpg" alt="Logo" class="logo">
  <div class="header-text">
    <div class="title">UNIVERSAL</div>
    <div class="subtitle">Savdo markazi</div>
  </div>
</div>
```

## 📐 Dizayn Talablari

### ✅ Bajarilgan:
1. ✅ Logo chap tomonda
2. ✅ "UNIVERSAL" va "Savdo markazi" o'ng tomonda
3. ✅ Logo balandligi matn balandligi bilan bir xil (12mm)
4. ✅ "Savdo markazi" yozuvi qaytarildi
5. ✅ Barcha matnlar gorizontal o'rtada (contacts, meta, items, total, payment)
6. ✅ Header elementi markazda (logo + matn birgalikda)

### 📏 O'lchamlar:
- **Logo balandligi**: 12mm (auto width)
- **UNIVERSAL font**: 18px, bold
- **Savdo markazi font**: 10px, normal
- **Gap (logo va matn orasida)**: 2mm
- **Line height**: 1.2 (ixcham ko'rinish)

## 🖨️ Print Ko'rinishi

```
    [LOGO] UNIVERSAL
           Savdo markazi

+99893 140-00-04    +99893 657-66-87
    ASADBEK             RAMAZON
+99888 866-66-59    +99850 779-22-03
   UYG'UNJON           OPERATOR

--------------------------------
Sana: 29.01.2026 12:27
Chek: #71676245
--------------------------------

1. kalta tosh natural ch...
   1 x 190 000        190 000
--------------------------------

      JAMI: 190 000 so'm

      To'lov: Naqd pul
```

## 📝 Eslatmalar

1. **Logo fayl**: `chek_logo.jpg` public papkada bo'lishi kerak
2. **Logo formati**: JPG, PNG yoki SVG (JPG tavsiya etiladi)
3. **Logo o'lchami**: Balandligi 12mm ga mos kelishi uchun taxminan 150-200px balandlikda bo'lishi kerak
4. **Logo rangi**: Oq fonli chekda yaxshi ko'rinishi uchun qora yoki to'q rangli bo'lishi kerak
5. **Object-fit**: `contain` - logo nisbati saqlanadi, kesib tashlanmaydi

## 🎯 Natija

Chek endi professional ko'rinishga ega:
- ✅ Brending (logo)
- ✅ Kompaniya nomi va turi
- ✅ Barcha ma'lumotlar o'rtada va tartibli
- ✅ 58mm thermal printer uchun optimallashtirilgan
- ✅ Avtomatik balandlik (content ga qarab)

**Tayyor!** 🎉
