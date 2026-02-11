# 🔧 Git Conflict Hal Qilish

## Muammo
```
error: Pulling is not possible because you have unmerged files.
```

## Yechim

### Variant 1: Conflict'larni ko'rish va hal qilish

```bash
# 1. Qaysi fayllar conflict'da ekanini ko'ring
git status

# 2. Conflict'dagi fayllarni ko'ring (masalan)
# Conflict'li fayllar "both modified" yoki "unmerged" deb ko'rsatiladi

# 3. Har bir conflict'li faylni tahrirlang
# Faylda quyidagicha belgilar bo'ladi:
# <<<<<<< HEAD
# Sizning o'zgarishlaringiz
# =======
# Server'dagi o'zgarishlar
# >>>>>>> origin/main

# 4. Conflict'ni hal qilganingizdan keyin
git add <file>

# 5. Barcha conflict'lar hal qilingandan keyin
git commit -m "Resolved merge conflicts"

# 6. Endi pull qilishingiz mumkin
git pull origin main
```

### Variant 2: Local o'zgarishlarni saqlash (Stash)

```bash
# 1. Local o'zgarishlarni vaqtincha saqlang
git stash

# 2. Server'dan yangilanishlarni oling
git pull origin main

# 3. Local o'zgarishlarni qaytaring
git stash pop

# 4. Agar conflict bo'lsa, hal qiling va commit qiling
```

### Variant 3: Local o'zgarishlarni bekor qilish (EHTIYOT!)

⚠️ **DIQQAT**: Bu barcha local o'zgarishlarni o'chiradi!

```bash
# 1. Barcha local o'zgarishlarni bekor qiling
git reset --hard HEAD

# 2. Server'dan yangilanishlarni oling
git pull origin main
```

### Variant 4: Fresh start (Eng xavfsiz)

```bash
# 1. Backup oling
cp -r /var/www/universalbozor /var/www/universalbozor_backup

# 2. Conflict'li fayllarni ko'ring
git status

# 3. Agar kerakli o'zgarishlar bo'lsa, alohida saqlang
# Masalan:
cp server/src/index.js ~/index.js.backup

# 4. Hard reset
git reset --hard origin/main

# 5. Pull qiling
git pull origin main

# 6. Agar kerak bo'lsa, backup'dan o'zgarishlarni qaytaring
```

## Tavsiya qilinadigan yechim (Production uchun)

```bash
# 1. Avval status ko'ring
cd /var/www/universalbozor
git status

# 2. Conflict'li fayllarni ko'ring
git diff

# 3. Agar local o'zgarishlar muhim bo'lmasa
git reset --hard origin/main
git pull origin main

# 4. Agar local o'zgarishlar muhim bo'lsa
git stash
git pull origin main
git stash pop
# Conflict'larni hal qiling
git add .
git commit -m "Resolved conflicts"
```

## Conflict'dan keyin

```bash
# 1. Dependencies'ni yangilang
cd server
npm install

cd ../client
npm install

# 2. Server'ni restart qiling
pm2 restart all
# yoki
pm2 restart universal-uz-api

# 3. Log'larni tekshiring
pm2 logs
```

## Kelajakda conflict'dan qochish

```bash
# Pull qilishdan oldin doim:
git stash        # Local o'zgarishlarni saqlang
git pull         # Server'dan oling
git stash pop    # Local o'zgarishlarni qaytaring
```

## Yordam

Agar muammo hal bo'lmasa:
1. `git status` natijasini yuboring
2. Qaysi fayllar conflict'da ekanini ko'rsating
3. Local o'zgarishlar muhimmi yoki yo'qmi aytib bering
