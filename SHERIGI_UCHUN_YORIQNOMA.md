# Xprinter XP-365B Driver O'rnatish Yo'riqnomasi

## Muammo
Printer sozlamalarida "Type" qismida faqat "Фасонные этикетки" bor, lekin "Continuous (Variable Length)" yo'q.

## Yechim

### Usul 1: Rasmiy Driver O'rnatish (TAVSIYA ETILADI)

1. **Driver yuklab olish:**
   - Sayt: http://www.xprinter.net/download
   - Yoki: https://www.seagullscientific.com/support/downloads/drivers/
   - "XP-365B" yoki "Seagull BarTender Driver" ni toping

2. **Driver o'rnatish:**
   - Yuklab olingan .exe faylni ishga tushiring
   - "Next" -> "Install" -> "Finish"
   - Kompyuterni qayta ishga tushiring (agar kerak bo'lsa)

3. **Tekshirish:**
   - Control Panel -> Devices and Printers
   - "Xprinter XP-365B" -> Right-click -> Printing Preferences
   - "Type" qismida "Continuous (Variable Length)" paydo bo'lishi kerak

---

### Usul 2: INF Fayl Orqali O'rnatish

Agar sizda `C:\XprinterDriverExport` papkasi bo'lsa:

1. **Eski driverni o'chirish:**
   - Control Panel -> Devices and Printers
   - "Xprinter XP-365B" -> Right-click -> Remove device
   - Tasdiqlang

2. **Yangi driver o'rnatish:**
   - Control Panel -> Devices and Printers
   - "Add a printer" -> "The printer that I want isn't listed"
   - "Add a local printer or network printer with manual settings" -> Next
   - "Use an existing port" -> USB001 (yoki printeringiz ulangan port) -> Next
   - "Have Disk..." -> Browse
   - `C:\XprinterDriverExport\DriverFiles\xprinter.inf` ni tanlang
   - "Xprinter XP-365B" ni tanlang -> Next
   - O'rnatish tugaguncha kuting

3. **Sozlash:**
   - Printer Properties -> Printing Preferences
   - Type: "Continuous (Variable Length)" ni tanlang
   - Width: 80mm (yoki 76mm)
   - Save

---

### Usul 3: Windows Built-in Driver (Oddiy)

Agar yuqoridagi usullar ishlamasa:

1. **Generic driver o'rnatish:**
   - Settings -> Devices -> Printers & scanners
   - Add a printer or scanner
   - "The printer that I want isn't listed"
   - "Add a local printer"
   - Port: USB001
   - Manufacturer: "Generic"
   - Printer: "Generic / Text Only"
   - Install

2. **Custom qog'oz o'lchami yaratish:**
   - Control Panel -> Devices and Printers
   - Generic printer -> Right-click -> Printing Preferences
   - Advanced -> Paper Size -> Create New Form
   - Name: "Receipt_80mm"
   - Width: 80mm
   - Height: Continuous (yoki 200mm)
   - Save

---

## Tekshirish

Driver to'g'ri o'rnatilganini tekshirish uchun:

```powershell
Get-PrinterDriver | Where-Object {$_.Name -like '*XP*'} | Select-Object Name, Manufacturer, DriverVersion
```

Natija:
```
Name              Manufacturer  DriverVersion
----              ------------  -------------
Xprinter XP-365B  Xprinter      569423886475591680
```

---

## Muammo Hal Bo'lmasa

Agar hali ham "Continuous (Variable Length)" ko'rinmasa:

1. **Printer portini tekshiring:**
   ```powershell
   Get-Printer | Where-Object {$_.Name -like '*XP*'} | Select-Object Name, PortName
   ```

2. **Driver versiyasini tekshiring:**
   - Seagull driver versiyasi 2023.2.0.0 yoki undan yuqori bo'lishi kerak

3. **Windows Update:**
   - Settings -> Update & Security -> Windows Update
   - "Check for updates"
   - Printer driverlari avtomatik yangilanishi mumkin

4. **Printer qayta ulash:**
   - USB kabelni sug'uring
   - 10 soniya kuting
   - Qayta ulang
   - Windows avtomatik driver o'rnatadi

---

## Qo'shimcha Ma'lumot

**Seagull Driver afzalliklari:**
- Professional thermal printer driver
- "Continuous (Variable Length)" qo'llab-quvvatlaydi
- Barcha Xprinter modellari bilan ishlaydi
- Keng sozlash imkoniyatlari

**Havolalar:**
- Xprinter: http://www.xprinter.net
- Seagull: https://www.seagullscientific.com
- Driver yuklab olish: http://www.xprinter.net/download

---

## Yordam

Agar yordam kerak bo'lsa, quyidagi ma'lumotlarni yuboring:

```powershell
# Printer ma'lumotlari
Get-Printer | Where-Object {$_.Name -like '*XP*'} | Format-List *

# Driver ma'lumotlari
Get-PrinterDriver | Where-Object {$_.Name -like '*XP*'} | Format-List *
```
