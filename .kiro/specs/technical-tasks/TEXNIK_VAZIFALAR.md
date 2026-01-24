# TEXNIK VAZIFALAR REJASI
## Universal.uz - Biznes Boshqaruv Tizimi

**Loyiha nomi:** Universal.uz  
**Versiya:** 1.0  
**Sana:** 2025-01-22  
**Holat:** Ishlab chiqish jarayonida

---

## LOYIHANING ASOSIY MAQSADI

**Umumiy tavsif:**  
Universal.uz - bu kichik va o'rta bizneslar uchun mo'ljallangan zamonaviy biznes boshqaruv tizimi (ERP). Tizim savdo, ombor, mijozlar, qarzlar va xodimlarni bir joyda boshqarish imkonini beradi.

**Asosiy maqsadlar:**

1. **Savdo jarayonini avtomatlashtirish**  
   - Tez va qulay kassa (POS) tizimi orqali savdo jarayonini tezlashtirish
   - Offline rejimda ishlash imkoniyati (internet yo'q bo'lganda ham)
   - Chek chiqarish va hisobot yuritish

2. **Ombor va mahsulotlarni nazorat qilish**  
   - Mahsulotlar qoldig'ini real-time kuzatish
   - Bir nechta omborlarni boshqarish
   - Omborlar o'rtasida mahsulot ko'chirish
   - QR kod orqali tez mahsulot qidirish

3. **Mijozlar bilan munosabatlarni yaxshilash**  
   - Mijozlar bazasini yuritish
   - Xaridlar tarixini saqlash
   - Telegram bot orqali avtomatik xabarnomalar
   - Qarzlarni kuzatish va eslatmalar yuborish

4. **Xodimlar samaradorligini oshirish**  
   - Turli rollar (Admin, Kassir, Yordamchi) uchun maxsus interfeyslar
   - Yordamchilar uchun QR skaner va kassaga chek yuborish
   - Xodimlar faoliyatini kuzatish

5. **Biznes qarorlar uchun analitika**  
   - Kunlik, haftalik, oylik sotuvlar statistikasi
   - Eng ko'p sotilgan mahsulotlar tahlili
   - Daromad va foyda ko'rsatkichlari
   - Vizual grafiklar va diagrammalar

6. **Mobil va zamonaviy texnologiyalar**  
   - Responsive dizayn (telefon, planshet, kompyuter)
   - Zamonaviy va intuitiv interfeys
   - Tez ishlash va optimallashtirish

**Maqsadli auditoriya:**  
- Do'konlar va savdo nuqtalari
- Ulgurji va chakana savdo
- Kichik va o'rta korxonalar
- Omborxonalar va distribyutorlar

**Kutilayotgan natijalar:**  
- Savdo jarayonini 50% tezlashtirish
- Ombor xatolarini 80% kamaytirish
- Mijozlar bilan munosabatlarni yaxshilash
- Biznes qarorlarni ma'lumotlarga asoslangan holda qabul qilish
- Xodimlar ish samaradorligini oshirish

---

## 1. UMUMIY TIZIM SOZLAMALARI

☑ 1.1. Foydalanuvchi rollari va huquqlarini sozlash (Admin, Kassir, Yordamchi).  
☑ 1.2. JWT autentifikatsiya tizimini joriy etish.  
☑ 1.3. MongoDB ma'lumotlar bazasini ulash va sozlash.  
☑ 1.4. Frontend va Backend arxitekturasini qurish.  
☑ 1.5. Responsive dizayn (mobil va desktop) qo'llab-quvvatlash.  
☐ 1.6. Tizim xavfsizlik siyosatini to'liq joriy etish (rate limiting, CORS).  
☐ 1.7. Backup va restore mexanizmini avtomatlashtirish.  
☐ 1.8. Tizim loglarini yig'ish va monitoring qilish.

---

## 2. AUTENTIFIKATSIYA VA FOYDALANUVCHILAR

☑ 2.1. Login sahifasini yaratish (telefon raqam va parol).  
☑ 2.2. Foydalanuvchi sessiyasini boshqarish (JWT token).  
☑ 2.3. Xodimlarni qo'shish, tahrirlash va o'chirish.  
☑ 2.4. Xodim profil rasmini yuklash va saqlash.  
☑ 2.5. Parolni o'zgartirish funksiyasi.  
☐ 2.6. Parolni tiklash (SMS yoki email orqali).  
☐ 2.7. Ikki faktorli autentifikatsiya (2FA).  
☐ 2.8. Foydalanuvchi faoliyat tarixini ko'rish.

---

## 3. DASHBOARD VA STATISTIKA

☑ 3.1. Asosiy dashboard sahifasini yaratish.  
☑ 3.2. Kunlik, haftalik, oylik sotuvlar statistikasi.  
☑ 3.3. Umumiy daromad va foyda ko'rsatkichlari.  
☑ 3.4. Top sotilgan mahsulotlar ro'yxati.  
☑ 3.5. Grafik va diagrammalar (Recharts kutubxonasi).  
☐ 3.6. Eksport funksiyasi (Excel, PDF).  
☐ 3.7. Mijozlar bo'yicha statistika (eng ko'p xarid qilganlar).  
☐ 3.8. Xodimlar samaradorligi statistikasi.

---

## 4. KASSA (POS) TIZIMI

☑ 4.1. Mahsulot qidirish va tanlash interfeysi.  
☑ 4.2. Savatchaga mahsulot qo'shish va o'chirish.  
☑ 4.3. Narx va miqdorni o'zgartirish.  
☑ 4.4. Jami summani hisoblash.  
☑ 4.5. To'lov usulini tanlash (naqd, karta, qarz).  
☑ 4.6. Mijozni tanlash va yangi mijoz qo'shish.  
☑ 4.7. Chek chiqarish (printer orqali).  
☑ 4.8. Offline rejimda ishlash (IndexedDB).  
☑ 4.9. Qaytarish (return) funksiyasi.  
☐ 4.10. Chegirma va aksiya qo'llash.  
☐ 4.11. Barcode scanner integratsiyasi.  
☐ 4.12. Kassir smena ochish/yopish funksiyasi.  
☐ 4.13. Kassa hisoboti (smena oxirida).

---

## 5. MAHSULOTLAR BOSHQARUVI

☑ 5.1. Mahsulotlar ro'yxatini ko'rish.  
☑ 5.2. Yangi mahsulot qo'shish.  
☑ 5.3. Mahsulotni tahrirlash va o'chirish.  
☑ 5.4. Mahsulot rasmi yuklash.  
☑ 5.5. Mahsulot kodi (SKU) generatsiyasi.  
☑ 5.6. QR kod yaratish va chop etish.  
☑ 5.7. Mahsulot qidirish va filtrlash.  
☑ 5.8. Sotilgan mahsulotlar soni (soldCount).  
☐ 5.9. Mahsulot kategoriyalari va guruhlari.  
☐ 5.10. Mahsulot variantlari (o'lcham, rang).  
☐ 5.11. Minimal qoldiq ogohlantirishlari.  
☐ 5.12. Mahsulot tarixini ko'rish (kim qo'shgan, kim o'zgartirgan).

---

## 6. OMBOR BOSHQARUVI

☑ 6.1. Omborlar ro'yxatini ko'rish.  
☑ 6.2. Yangi ombor qo'shish va tahrirlash.  
☑ 6.3. Ombor inventarizatsiyasi (mahsulotlar soni).  
☑ 6.4. Omborlar o'rtasida mahsulot ko'chirish.  
☑ 6.5. Ko'chirish tarixini ko'rish.  
☐ 6.6. Ombor qoldig'i bo'yicha hisobot.  
☐ 6.7. Mahsulot kirim-chiqim jurnali.  
☐ 6.8. Ombor xodimlari va mas'uliyat.  
☐ 6.9. Inventarizatsiya aktini chop etish.

---

## 7. MIJOZLAR BOSHQARUVI

☑ 7.1. Mijozlar ro'yxatini ko'rish.  
☑ 7.2. Yangi mijoz qo'shish (ism, telefon, manzil).  
☑ 7.3. Mijozni tahrirlash va o'chirish.  
☑ 7.4. Mijoz xaridlar tarixini ko'rish.  
☑ 7.5. Mijoz umumiy xaridlar summasi.  
☑ 7.6. Telegram bot orqali mijozga xabar yuborish.  
☐ 7.7. Mijoz guruhlarini yaratish (VIP, oddiy).  
☐ 7.8. Mijoz tug'ilgan kunini eslatish.  
☐ 7.9. Sodiqlik dasturi (bonus ballar).  
☐ 7.10. Mijoz SMS xabarnomasi.

---

## 8. QARZ DAFTARCHA

☑ 8.1. Qarzlar ro'yxatini ko'rish.  
☑ 8.2. Yangi qarz qo'shish.  
☑ 8.3. Qarzni to'lash (to'liq yoki qisman).  
☑ 8.4. Qarz tarixini ko'rish.  
☑ 8.5. Qarz summasi bo'yicha filtrlash.  
☑ 8.6. Telegram orqali qarz eslatmasi yuborish.  
☐ 8.7. Qarz muddati tugash ogohlantirishlari.  
☐ 8.8. Qarz bo'yicha hisobot (Excel, PDF).  
☐ 8.9. Qarz limitlarini sozlash (mijoz uchun maksimal qarz).  
☐ 8.10. Qarz to'lash rejasi (oylik to'lovlar).

---

## 9. BUYURTMALAR (MARKETPLACE)

☑ 9.1. Buyurtmalar ro'yxatini ko'rish.  
☑ 9.2. Yangi buyurtma qo'shish.  
☑ 9.3. Buyurtma holatini o'zgartirish (yangi, jarayonda, yetkazildi).  
☑ 9.4. Buyurtma mahsulotlarini ko'rish.  
☐ 9.5. Buyurtmani bekor qilish.  
☐ 9.6. Yetkazib berish manzilini xaritada ko'rsatish.  
☐ 9.7. Kuryer tayinlash va kuzatish.  
☐ 9.8. Buyurtma bo'yicha SMS xabarnoma.  
☐ 9.9. Buyurtmalar statistikasi.

---

## 10. YORDAMCHILAR (HELPER) TIZIMI

☑ 10.1. Yordamchi panelini yaratish.  
☑ 10.2. QR kod skanerlash funksiyasi.  
☑ 10.3. Mahsulot qidirish va savatga qo'shish.  
☑ 10.4. Narx va miqdorni kiritish.  
☑ 10.5. Kassirga chek yuborish (draft → pending).  
☑ 10.6. Yuborilgan cheklarni ko'rish.  
☑ 10.7. Kassir tomonidan o'zgartirilgan ma'lumotlarni real-time ko'rish.  
☑ 10.8. Avtomatik saqlash (debounce mexanizmi).  
☑ 10.9. Faqat o'zgarishlar bo'lganda serverga yuborish.  
☐ 10.10. Yordamchi statistikasi (nechta chek yuborgan).

---

## 11. KASSIR PANELI

☑ 11.1. Yordamchilardan kelgan cheklarni ko'rish.  
☑ 11.2. Chek mahsulotlarini tahrirlash (narx, miqdor).  
☑ 11.3. Chek mahsulotini o'chirish.  
☑ 11.4. Chekni kassaga yuklash (to'lov qabul qilish).  
☑ 11.5. Chekni rad etish.  
☐ 11.6. Bir nechta chekni birlashtirib yuklash.  
☐ 11.7. Kassir smena hisoboti.

---

## 12. CHOP ETISH (PRINTING)

☑ 12.1. Chek chop etish (thermal printer).  
☑ 12.2. QR kod chop etish (mahsulot uchun).  
☐ 12.3. Xprinter orqali tezkor chek chiqarish.  
☐ 12.4. Oddiy printer orqali to'liq hisobot chiqarish.  
☐ 12.5. Printer sozlamalarini boshqarish.  
☐ 12.6. Chek shablonini sozlash (logo, manzil, telefon).  
☐ 12.7. PDF formatda chek saqlash.

---

## 13. TELEGRAM BOT INTEGRATSIYASI

☑ 13.1. Telegram bot yaratish va ulash.  
☑ 13.2. Mijozlarga xarid xabarnomasi yuborish.  
☑ 13.3. Qarz eslatmalarini yuborish.  
☑ 13.4. Kunlik sotuvlar hisobotini yuborish.  
☐ 13.5. Bot orqali mahsulot qidirish.  
☐ 13.6. Bot orqali buyurtma berish.  
☐ 13.7. Bot orqali qarz to'lash.

---

## 14. OFFLINE REJIM

☑ 14.1. IndexedDB orqali mahsulotlarni saqlash.  
☑ 14.2. Offline rejimda savdo qilish.  
☑ 14.3. Internet qayta ulanganda ma'lumotlarni sinxronlashtirish.  
☐ 14.4. Offline rejim indikatori (UI).  
☐ 14.5. Sinxronlash xatoliklarini boshqarish.

---

## 15. XAVFSIZLIK VA OPTIMALLASHTIRISH

☑ 15.1. JWT token autentifikatsiya.  
☑ 15.2. Parollarni hash qilish (bcrypt).  
☑ 15.3. CORS sozlamalari.  
☐ 15.4. Rate limiting (so'rovlar cheklash).  
☐ 15.5. SQL injection va XSS himoyasi.  
☐ 15.6. Ma'lumotlarni shifrlash (encryption).  
☐ 15.7. Tizim loglarini saqlash va tahlil qilish.  
☐ 15.8. Performance monitoring (APM).

---

## 16. DEPLOY VA INFRATUZILMA

☑ 16.1. Linux serverga deploy qilish skripti.  
☑ 16.2. Nginx konfiguratsiyasi.  
☑ 16.3. PM2 orqali backend ishga tushirish.  
☐ 16.4. SSL sertifikat o'rnatish (HTTPS).  
☐ 16.5. Avtomatik backup tizimi.  
☐ 16.6. CI/CD pipeline (GitHub Actions).  
☐ 16.7. Docker konteynerizatsiya.  
☐ 16.8. Load balancing va scaling.

---

## 17. HISOBOTLAR VA ANALITIKA

☐ 17.1. Kunlik sotuvlar hisoboti.  
☐ 17.2. Oylik daromad hisoboti.  
☐ 17.3. Mahsulotlar bo'yicha hisobot (eng ko'p sotilgan).  
☐ 17.4. Mijozlar bo'yicha hisobot (eng ko'p xarid qilgan).  
☐ 17.5. Xodimlar samaradorligi hisoboti.  
☐ 17.6. Qarzlar bo'yicha hisobot.  
☐ 17.7. Ombor qoldig'i hisoboti.  
☐ 17.8. Excel va PDF formatda eksport.

---

## 18. MOBIL ILOVA (KEYINGI BOSQICH)

☐ 18.1. React Native yoki Flutter bilan mobil ilova.  
☐ 18.2. Mobil uchun QR skaner.  
☐ 18.3. Push notifications.  
☐ 18.4. Offline rejim (mobil).  
☐ 18.5. App Store va Google Play'ga joylashtirish.

---

## KEYINGI BOSQICHDA BAJARILADIGAN ISHLAR

### Ustuvor vazifalar (1-3 oy)
1. Kassir smena ochish/yopish funksiyasi
2. Mahsulot kategoriyalari va guruhlari
3. Chegirma va aksiya tizimi
4. Minimal qoldiq ogohlantirishlari
5. SSL sertifikat va HTTPS
6. Avtomatik backup tizimi
7. Hisobotlarni Excel/PDF formatda eksport qilish

### O'rta muddatli vazifalar (3-6 oy)
1. Sodiqlik dasturi (bonus ballar)
2. Ikki faktorli autentifikatsiya (2FA)
3. Kuryer tizimi va buyurtmalarni kuzatish
4. Telegram bot orqali buyurtma berish
5. Mobil ilova ishlab chiqish
6. CI/CD pipeline joriy etish

### Uzoq muddatli vazifalar (6-12 oy)
1. AI tavsiyalar tizimi (mahsulot tavsiyalari)
2. CRM tizimi (mijozlar bilan munosabatlar)
3. Multi-filial qo'llab-quvvatlash
4. Buxgalteriya moduli
5. HR moduli (xodimlar boshqaruvi)
6. Franshiza tizimi

---

## XULOSA

**Bajarilgan ishlar:** 85 ta  
**Bajarilmagan ishlar:** 78 ta  
**Umumiy progress:** ~52%
