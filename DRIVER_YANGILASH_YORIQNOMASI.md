# Xprinter Driver Yangilash (Sozlamalarni Saqlab)

## Muammo
Driver yangilanganda barcha sozlamalar (o'lchamlar, margins, va boshqalar) o'chib ketadi.

## Yechim: Backup va Restore

---

## QADAMLAR

### 1. Hozirgi Sozlamalarni Backup Qilish

PowerShell da quyidagi buyruqni ishga tushiring:

```powershell
.\backup-printer-settings.ps1
```

Bu skript:
- ✓ Printer nomini saqlaydi
- ✓ Driver nomini saqlaydi
- ✓ Port ma'lumotlarini saqlaydi
- ✓ Registry sozlamalarini eksport qiladi
- ✓ Barcha ma'lumotlarni JSON faylga yozadi

**Natija:** `PrinterBackup` papkasida backup fayllari yaratiladi.

---

### 2. Driverni Yangilash

Endi xavfsiz ravishda driverni yangilashingiz mumkin:

**Usul A: Rasmiy saytdan**
1. http://www.xprinter.net/download
2. XP-365B driverini yuklab oling
3. O'rnatish (.exe faylni ishga tushiring)

**Usul B: Seagull Driver**
1. https://www.seagullscientific.com/support/downloads/drivers/
2. Seagull BarTender Driver ni yuklab oling
3. O'rnatish

**Usul C: USB dan**
1. USB diskdagi INF fayldan o'rnating
2. Control Panel -> Add Printer -> Have Disk

---

### 3. Sozlamalarni Qayta Tiklash

Driver o'rnatilgandan keyin:

```powershell
.\restore-printer-settings.ps1
```

Bu skript:
- ✓ Backup fayllarni ko'rsatadi
- ✓ Tanlangan backup ni tiklaydi
- ✓ Printer sozlamalarini qayta o'rnatadi
- ✓ Registry sozlamalarini import qiladi

---

### 4. Qo'lda Sozlash (Agar Kerak Bo'lsa)

Agar ba'zi sozlamalar tiklanmasa:

1. **Control Panel → Devices and Printers**
2. **Xprinter XP-365B → Right-click → Printing Preferences**
3. **Quyidagi sozlamalarni kiriting:**

#### Stock (Qog'oz) Sozlamalari:
```
Name: USER (yoki sizning nomingiz)
Type: Continuous (Variable Length)
```

#### Maximum Size:
```
Width: 3.00 in (76.2 mm)
Length: 6.00 in (152.4 mm)
```

#### Exposed Liner Widths:
```
Left: 0.05 in (1.3 mm)
Right: 0.05 in (1.3 mm)
```

#### Margins:
```
Top: 0.03 in (0.76 mm)
Bottom: 0.00 in (0 mm)
```

4. **Save/OK** tugmasini bosing

---

## MUHIM ESLATMALAR

### ✓ Backup Qilish Majburiy
Driver yangilashdan **OLDIN** backup qiling!

### ✓ Backup Fayllarini Saqlang
`PrinterBackup` papkasini USB ga nusxalab saqlang.

### ✓ Bir Necha Backup
Har safar o'zgartirish qilganingizda yangi backup yarating.

### ✓ Registry Backup
Registry sozlamalari ham saqlanadi - bu juda muhim!

---

## TEZKOR BUYRUQLAR

### Backup qilish:
```powershell
.\backup-printer-settings.ps1
```

### Tiklash:
```powershell
.\restore-printer-settings.ps1
```

### Hozirgi sozlamalarni ko'rish:
```powershell
Get-Printer | Where-Object {$_.Name -like '*XP*'} | Format-List *
```

### Driver ma'lumotlarini ko'rish:
```powershell
Get-PrinterDriver | Where-Object {$_.Name -like '*XP*'} | Format-List *
```

---

## MUAMMO HAL QILISH

### Agar backup ishlamasa:

1. **PowerShell ni Administrator sifatida oching:**
   - Start → PowerShell → Right-click → Run as Administrator

2. **Execution Policy ni o'zgartiring:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```

3. **Qayta urinib ko'ring:**
   ```powershell
   .\backup-printer-settings.ps1
   ```

### Agar restore ishlamasa:

1. **Backup faylni qo'lda oching:**
   ```powershell
   notepad .\PrinterBackup\printer_settings_*.json
   ```

2. **Ma'lumotlarni ko'ring va qo'lda kiriting**

3. **Registry faylni qo'lda import qiling:**
   - Double-click on `.reg` file
   - "Yes" → "OK"

---

## QO'SHIMCHA MASLAHATLAR

### 1. Muntazam Backup
Har hafta yoki muhim o'zgarishlardan oldin backup qiling.

### 2. Bir Necha Nusxa
Backup fayllarni:
- ✓ USB diskda saqlang
- ✓ Cloud storage ga yuklang (Google Drive, OneDrive)
- ✓ Boshqa kompyuterda saqlang

### 3. Dokumentatsiya
Maxsus sozlamalaringizni yozib qo'ying:
- Qog'oz o'lchamlari
- Margins
- Boshqa muhim sozlamalar

### 4. Test Qiling
Backup va restore jarayonini avval test qiling:
1. Backup qiling
2. Biror sozlamani o'zgartiring
3. Restore qiling
4. Tekshiring

---

## SHERIGINGIZ UCHUN

Sherigingizga ham shu skriptlarni bering:

1. **USB ga nusxalash:**
   ```powershell
   .\copy-to-usb.ps1
   ```

2. **USB da bo'lishi kerak:**
   - `backup-printer-settings.ps1`
   - `restore-printer-settings.ps1`
   - `DRIVER_YANGILASH_YORIQNOMASI.md`
   - Driver fayllari

3. **Sherigingiz qilishi kerak:**
   - Avval backup qilish
   - Driver o'rnatish
   - Restore qilish

---

## YORDAM

Agar muammo bo'lsa:

1. **Backup fayllarni tekshiring:**
   ```powershell
   Get-ChildItem .\PrinterBackup
   ```

2. **Printer holatini tekshiring:**
   ```powershell
   Get-Printer | Where-Object {$_.Name -like '*XP*'}
   ```

3. **Driver holatini tekshiring:**
   ```powershell
   Get-PrinterDriver | Where-Object {$_.Name -like '*XP*'}
   ```

4. **Agar hech narsa ishlamasa:**
   - Backup faylni qo'lda oching
   - Barcha ma'lumotlarni yozib oling
   - Driver o'rnatgandan keyin qo'lda kiriting

---

## XULOSA

✓ Har doim backup qiling
✓ Backup fayllarni saqlang
✓ Restore skriptdan foydalaning
✓ Qo'lda sozlashga tayyor bo'ling
✓ Sherigingizga ham o'rgating

**Omad!** 🚀
