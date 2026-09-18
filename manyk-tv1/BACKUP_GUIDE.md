# 🔐 Database Backup va Tiklash

Server yangilanganda yoki xatolik yuz berganda ma'lumotlaringiz xavfsiz saqlanadi.

## 📋 Avtomatik Backup Tizimi

### ✅ Har kuni avtomatik backup
- **Vaqti:** Har kuni soat 03:00 da
- **Joylashuv:** `./backups/` papkasi
- **Format:** `manyktv-2026-09-11T03-00-00.db`
- **Tozalash:** 30 kundan eski backuplar avtomatik o'chiriladi

### ✅ Server ishga tushganda backup
- Agar 7 kundan ortiq backup qilinmagan bo'lsa, darhol backup yaratiladi
- Server log'ida backup holati ko'rsatiladi

## 🛠️ Qo'lda Backup Boshqaruvi

### Admin Panel orqali:
1. Admin panelga kiring
2. "Sozlamalar" bo'limiga o'ting
3. "Database Backup" tugmasini bosing

### API orqali:

```bash
# Barcha backuplar ro'yxati
GET /api/backups
Authorization: Bearer <JWT_TOKEN>

# Yangi backup yaratish
POST /api/backups/create
Authorization: Bearer <JWT_TOKEN>

# Backupdan tiklash
POST /api/backups/restore
Authorization: Bearer <JWT_TOKEN>
Content-Type: application/json

{
  "backupPath": "./backups/manyktv-2026-09-11T03-00-00.db"
}
```

## 📁 Data Papkasi Sozlash

### Lokal (Development):
```env
# .env faylida
DATA_DIR="./data"
BACKUP_DIR="./backups"
```

### Production (Railway, Render, Fly.io):
```env
# Volume'ga ko'rsating
DATA_DIR="/data"
BACKUP_DIR="/data/backups"
```

## 🚀 Railway Deploy uchun

1. **Volume yarating:**
   - Railway Dashboard → Your Project → Add Volume
   - Mount Path: `/data`
   - Size: 1GB+ (loyihangiz hajmiga qarab)

2. **Environment variables:**
   ```env
   DATA_DIR=/data
   BACKUP_DIR=/data/backups
   ```

3. **Deploy qiling:**
   - Har safar deploy qilganingizda ma'lumotlar saqlanadi
   - Volume tarkibi o'chib ketmaydi

## 🔄 Tiklash Jarayoni

### Server'da:
```bash
# 1. Backup yaratish
node -e "import('./database.js').then(m => m.Backup.create())"

# 2. Backupdan tiklash
node -e "import('./database.js').then(m => m.Backup.restore('./backups/manyktv-2026-09-11.db'))"

# 3. Serverni qayta ishga tushiring
npm run server
```

### Xavfsizlik:
- ✅ Tiklashdan oldin hozirgi database avtomatik backup qilinadi
- ✅ Backup fayli `.before-restore` nomi bilan saqlanadi
- ✅ Xatolik bo'lsa, oldingi holatga qaytish mumkin

## 📊 Backup Monitoring

### Server log'ida:
```
[Backup] ✅ Backup yaratildi: ./backups/manyktv-2026-09-11T03-00-00.db
[Backup] 🧹 5 ta eski backup tozalandi
[Backup] Keyingi backup: 12.09.2026, 03:00:00
```

### Backup hajmi:
- Odatda 1-5 MB
- Foydalanuvchilar va kontentlar ko'paygan sayin ortadi
- 30 kunlik backuplar ~50-150 MB egallaydi

## ⚠️ Muhim Eslatmalar

1. **`/uploads/` papkasi alohida backup qilinadi**
   - Foydalanuvchi yuklagan rasm va videolar
   - Database backupga KIRMAYDI
   - Cloud storage yoki server backup'iga kiradi

2. **`.db-wal` va `.db-shm` fayllar**
   - SQLite WAL (Write-Ahead Logging) fayllari
   - Backupda kerak emas (VACUUM INTO tozalaydi)
   - Git'da ignore qilingan

3. **Production'da:**
   - Volume'ni ALBATTA ulang
   - Avtomatik cloud backup sozlang (Railway Volumes auto-backup)
   - Haftada bir marta qo'lda tekshiring

## 🎯 Muammolarni Bartaraf Qilish

### Backup yaratilmayapti?
```bash
# Papka mavjudligini tekshiring
ls -la ./backups

# Ruxsatlarni tekshiring
chmod -R 755 ./data ./backups

# Log'ni tekshiring
npm run server | grep Backup
```

### "Disk full" xatosi?
```bash
# Eski backuplarni tozalang
find ./backups -name "manyktv-*.db" -mtime +30 -delete

# Yoki barcha eski backuplarni o'chiring
rm -f ./backups/*.db
```

### Backupdan tiklanmayapti?
1. Server to'xtating
2. `data/manyktv.db` faylini alohida joyga nusxalang
3. Backup faylini `data/manyktv.db` ga ko'chiring
4. Server'ni qayta ishga tushiring

---

**Savol-javob:** Issues'da yozing yoki Telegram @your_support_bot
