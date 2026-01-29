# XPrinter Sozlamalarini O'zgartirish

## Muammo
XPrinter da 58mm x 110mm turibdi. Bu kodda `auto` ni bekor qiladi va har doim 110mm chiqaradi.

## Yechim: Printer Sozlamalarini O'zgartirish

### Variant 1: Windows Printer Settings (Tavsiya Etiladi)

#### Qadamma-qadam:

1. **Control Panel** ni oching
2. **Devices and Printers** ga o'ting
3. **XPrinter** ni toping va o'ng tugma bosing
4. **Printing Preferences** ni tanlang
5. **Paper/Quality** yoki **Page Setup** ga o'ting
6. **Paper Size** ni o'zgartiring:

```
Oldin:  58mm x 110mm (fix)
Keyin:  58mm x Continuous (avtomatik)
```

Yoki:

```
Paper Type: Continuous
Width: 58mm
Length: Auto (yoki Continuous)
```

7. **Apply** → **OK**

### Variant 2: XPrinter Utility Dasturi

Ko'pchilik XPrinter larda maxsus utility dastur bor:

1. **XPrinter Utility** ni oching (Start Menu da qidiring)
2. **Printer Settings** ga o'ting
3. **Paper Settings** ni toping:

```
Paper Width: 58mm
Paper Type: Continuous Roll (yoki Auto)
Paper Length: Continuous (yoki Auto)
```

4. **Save** → **Apply**

### Variant 3: Printer Properties (Advanced)

1. **Devices and Printers** da XPrinter ni toping
2. O'ng tugma → **Printer Properties** (Printing Preferences emas!)
3. **Device Settings** yoki **Advanced** tab
4. **Paper Size** ni toping:

```
Form To Tray Assignment:
  Tray 1: Continuous (58mm)
```

5. **OK**

### Variant 4: Custom Paper Size Yaratish

Agar yuqoridagilar ishlamasa:

1. **Control Panel** → **Devices and Printers**
2. **Print Server Properties** (yuqori menuda)
3. **Forms** tab ga o'ting
4. **Create a new form** ni belgilang
5. Yangi form yarating:

```
Form name: XPrinter Auto
Width: 58mm
Height: 297mm (maksimal, lekin printer auto kesadi)
Form margins: 0mm (barcha tomondan)
```

6. **Save Form**
7. XPrinter Properties da bu formni tanlang

## Browser Print Settings

XPrinter sozlamalarini o'zgartirgandan keyin, browser da:

```
Paper size: XPrinter Auto (yoki Continuous)
Margins: None
Scale: 100%
```

## Test Qilish

### Test 1: 1 ta mahsulot
```
Kutilgan: ~70-80mm
Natija: Agar 110mm chiqsa, printer sozlamalari hali fix
```

### Test 2: 10 ta mahsulot
```
Kutilgan: ~180-200mm
Natija: Agar 110mm chiqsa va kesib ketsa, printer sozlamalari fix
```

## Agar Hali Ham Ishlamasa

### Muqobil Yechim: Printer Auto-Cut

Agar printer sozlamalarini o'zgartirib bo'lmasa:

1. **Auto-Cut** funksiyasini yoqing
2. Printer avtomatik kerakli joyda kesadi
3. 110mm qog'oz chiqadi, lekin printer kerakli joyda kesadi

### Yoki: Kodda Fix Balandlik

Agar hech narsa ishlamasa, kodda fix balandlik qo'ying:

```css
/* 1-3 ta mahsulot uchun */
@page { size: 58mm 80mm; }

/* 4-7 ta mahsulot uchun */
@page { size: 58mm 120mm; }

/* 8+ ta mahsulot uchun */
@page { size: 58mm 200mm; }
```

Lekin bu yaxshi yechim emas, chunki har safar qo'lda sozlash kerak.

## XPrinter Modellari

### XP-58 / XP-80 Series:
```
Utility dastur: XPrinter Tool
Paper Type: Continuous Roll
Auto Cut: Enabled
```

### XP-365B / XP-370B:
```
Driver Settings → Paper → Continuous
Auto Cutter: ON
```

### XP-Q200 / XP-Q260:
```
Preferences → Page Setup → Roll Paper
Length: Auto
```

## Eng Yaxshi Yechim

1. **Birinchi:** XPrinter Utility dasturini oching
2. **Ikkinchi:** Paper Type ni "Continuous" ga o'zgartiring
3. **Uchinchi:** Auto Cut ni yoqing
4. **To'rtinchi:** Test qiling

Agar utility dastur bo'lmasa:
1. Printer Properties → Device Settings
2. Paper Type: Continuous Roll
3. Auto Cut: Enabled

## Xulosa

✅ **Muammo:** XPrinter 58mm x 110mm fix
✅ **Yechim:** Printer sozlamalarida "Continuous" ga o'zgartirish
✅ **Natija:** Avtomatik balandlik ishlaydi
✅ **Qo'shimcha:** Auto-Cut yoqish

Printer sozlamalarini o'zgartirgandan keyin, kodda `size: 58mm auto` to'liq ishlaydi! 🎉
