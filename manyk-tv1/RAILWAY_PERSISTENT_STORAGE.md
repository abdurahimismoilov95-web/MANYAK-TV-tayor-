# Railway'da Ma'lumotlarni Saqlash

## Muammo
Server restart bo'lganda:
- ❌ Database (`/data/manyktv.db`) o'chib ketyapti
- ❌ Yuklangan videolar (`/uploads/`) o'chib ketyapti
- ❌ Foydalanuvchilar yo'qolib ketyapti

## Sababi
Railway default filesystem **ephemeral** (vaqtinchalik):
- Har restart'da yangi container yaratiladi
- Eski fayllar yo'qoladi

## Yechim 1: Railway Volume (Tavsiya etiladi)

### 1. Railway Dashboard'ga kiring
```
https://railway.app
```

### 2. Project'ni tanlang
- MANYAK TV project'ni oching

### 3. Volume qo'shing
- **Settings** → **Volumes** → **+ New Volume**

**Volume 1: Database**
```
Mount Path: /app/data
Name: manyak-tv-database
Size: 1GB (yetarli)
```

**Volume 2: Uploads**
```
Mount Path: /app/uploads
Name: manyak-tv-uploads
Size: 5GB (videolarga qarab)
```

### 4. Server'ni restart qiling
- Deploy → Restart
- Ma'lumotlar endi saqlanadi!

---

## Yechim 2: External Database (PostgreSQL)

Railway'da PostgreSQL plugin qo'shing:
- **+ New** → **Database** → **Add PostgreSQL**
- SQLite o'rniga PostgreSQL ishlatish

**Kamchiligi:** Code'ni ko'p o'zgartirish kerak

---

## Yechim 3: AWS S3 / Cloudflare R2 (Videolar uchun)

Yuklangan videolarni cloud storage'ga saqlash:
- AWS S3
- Cloudflare R2 (bepul - 10GB)
- Backblaze B2

---

## Migration: Ma'lumotlarni Ko'chirish

### Database'ni eksport qilish (hozirgi serverdan):
```bash
# Railway CLI orqali
railway run bash

# Database'ni zip qilish
cd /app/data
tar -czf manyak-tv-backup.tar.gz manyktv.db

# Download (Railway dashboard orqali)
```

### Yangi server'ga import qilish:
```bash
# Railway volume yaratilgandan keyin
railway run bash

# Unzip
cd /app/data
tar -xzf manyak-tv-backup.tar.gz
```

---

## Avtomatik Backup

`server.js`'da allaqachon bor:
```javascript
// Har kuni 03:00 da backup
cron.schedule('0 3 * * *', async () => {
  await createBackup();
});
```

Backup fayllar: `/backups/` papkada

**MUHIM:** `/backups/` papkani ham Volume'ga mount qiling!

---

## Qo'shimcha: Railway nixpacks.toml

Volume ishlatmasdan ham saqlab qolish (cheklangan):

**.railwayignore** yarating:
```
node_modules/
.git/
```

**nixpacks.toml** yarating:
```toml
[phases.setup]
nixPkgs = ['nodejs_18', 'sqlite']

[phases.install]
cmds = ['npm install']

[phases.build]
cmds = ['npm run build']

[start]
cmd = 'node server.js'

[variables]
NODE_ENV = 'production'
```

**Lekin bu ham ephemeral** - restart bo'lganda yo'qoladi!

---

## Xulosa

✅ **Eng yaxshi yechim:** Railway Volume ishlatish
- Database: 1GB Volume
- Uploads: 5GB Volume
- Backups: 1GB Volume

Bu serverni qayta ishga tushursa ham barcha ma'lumotlar saqlanadi!

---

## Qo'shimcha Savollar

- Railway Volume qanday qo'shiladi?
- PostgreSQL'ga migration kerakmi?
- Cloud storage (S3) ishlatish kerakmi?
