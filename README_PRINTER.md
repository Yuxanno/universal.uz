# Xprinter Driver Boshqaruv Tizimi

## Tezkor Boshlash

### 1. Asosiy Menyu
```powershell
.\BOSHLASH.ps1
```

Bu sizga interaktiv menyu beradi:
- Backup qilish
- Tiklash
- Ma'lumotlarni ko'rish
- USB ga nusxalash
- Yo'riqnomalar

---

## Sizning Vazifangiz (Driver Yangilashdan Oldin)

### ✅ QADAMLAR:

1. **Backup qiling:**
   ```powershell
   .\backup-printer-settings.ps1
   ```

2. **Driverni yangilang:**
   - http://www.xprinter.net/download dan yuklab oling
   - Yoki Seagull driver o'rnating

3. **Sozlamalarni tiklang:**
   ```powershell
   .\restore-printer-settings.ps1
   ```

4. **Tekshiring:**
   - Control Panel → Devices and Printers
   - Xprinter XP-365B → Printing Preferences
   - Type: "Continuous (Variable Length)" bo'lishi kerak

---

## Sherigingiz Uchun

### USB ga nusxalash:
```powershell
.\copy-to-usb.ps1
```

Bu quyidagilarni USB ga nusxalaydi:
- ✓ Driver fayllari
- ✓ Barcha skriptlar
- ✓ Yo'riqnomalar

Sherigingiz USB dan:
1. Driver o'rnatadi
2. Sozlaydi
3. "Continuous (Variable Length)" turini oladi

---

## Fayllar Ro'yxati

| Fayl | Vazifasi |
|------|----------|
| `BOSHLASH.ps1` | Asosiy menyu (BUNI ISHGA TUSHIRING) |
| `backup-printer-settings.ps1` | Sozlamalarni saqlash |
| `restore-printer-settings.ps1` | Sozlamalarni tiklash |
| `copy-to-usb.ps1` | USB ga nusxalash |
| `DRIVER_YANGILASH_YORIQNOMASI.md` | To'liq yo'riqnoma |
| `SHERIGI_UCHUN_YORIQNOMA.md` | Sherigingiz uchun |
| `TEZKOR_YORIQNOMA.txt` | Qisqa yo'riqnoma |

---

## Muhim Eslatmalar

### ⚠️ DRIVER YANGILASHDAN OLDIN:
- **ALBATTA** backup qiling!
- Backup fayllarni USB ga nusxalang
- Hozirgi sozlamalarni yozib qo'ying

### ✅ DRIVER YANGILASHDAN KEYIN:
- Restore skriptni ishga tushiring
- Yoki qo'lda sozlang
- Tekshiring: "Continuous (Variable Length)" bormi?

### 💾 BACKUP FAYLLARI:
- `PrinterBackup` papkasida saqlanadi
- Har safar yangi backup yaratiladi
- Eski backuplar o'chirilmaydi

---

## Tezkor Buyruqlar

```powershell
# Asosiy menyu
.\BOSHLASH.ps1

# Backup
.\backup-printer-settings.ps1

# Tiklash
.\restore-printer-settings.ps1

# USB ga nusxalash
.\copy-to-usb.ps1

# Printer holatini ko'rish
Get-Printer | Where-Object {$_.Name -like '*XP*'}

# Driver ma'lumotlarini ko'rish
Get-PrinterDriver | Where-Object {$_.Name -like '*XP*'}
```

---

## Yordam

Agar muammo bo'lsa:

1. **PowerShell ni Administrator sifatida oching**
2. **Execution Policy ni o'zgartiring:**
   ```powershell
   Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
   ```
3. **Qayta urinib ko'ring**

---

## Omad! 🚀

Barcha skriptlar tayyor. Faqat `BOSHLASH.ps1` ni ishga tushiring va menyudan foydalaning.
