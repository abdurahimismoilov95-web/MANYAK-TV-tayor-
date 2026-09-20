# 🚀 MANYK TV - PostgreSQL Migration Guide

## 📋 MIGRATION QADAMLARI

### 1️⃣ LOCAL DEVELOPMENT SETUP

#### PostgreSQL o'rnatish (Windows)

```powershell
# PostgreSQL installer yuklab oling:
# https://www.postgresql.org/download/windows/

# Yoki Chocolatey orqali:
choco install postgresql

# PostgreSQL service ishga tushirish:
net start postgresql-x64-15
```

#### Database yaratish

```powershell
# PostgreSQL shell ochish
psql -U postgres

# Database yaratish
CREATE DATABASE manyaktv;
\q
```

#### .env faylni sozlash

```bash
PG_HOST="localhost"
PG_PORT="5432"
PG_DATABASE="manyaktv"
PG_USER="postgres"
PG_PASSWORD="abdurahim521"
PG_SSL="false"
```

### 2️⃣ DEPENDENCIES O'RNATISH

```bash
npm install pg
```

### 3️⃣ MIGRATION ISHGA TUSHIRISH

```bash
# Ma'lumotlarni SQLite'dan PostgreSQL'ga ko'chirish
npm run migrate
```

Migration script quyidagilarni ko'chiradi:
- ✅ Users (foydalanuvchilar)
- ✅ Contents (kino, serial, shorts)
- ✅ Plans (tariflar)
- ✅ Receipts (to'lov cheklari)
- ✅ Promo Codes
- ✅ Watch History
- ✅ Favorites
- ✅ Settings
- ✅ Appointed Admins
- ✅ Audit Logs
- ✅ Verification Codes
- ✅ Banned Devices
- ✅ Comments

### 4️⃣ SERVER.JS YANGILASH

`server.js` faylda import path o'zgartiring:

```javascript
// ESKI:
import { Users, Receipts, Contents, ... } from './database.js';

// YANGI:
import { Users, Receipts, Contents, ... } from './database.pg.js';
```

### 5️⃣ TEST QILISH

```bash
# Server ishga tushirish
npm run server

# Alohida terminalda frontend
npm run dev
```

### 6️⃣ BUILD VA DEPLOY

```bash
# Build
npm run build

# Railway deploy
git add .
git commit -m "Migrate to PostgreSQL"
git push origin main
```

---

## 🚂 RAILWAY PRODUCTION SETUP

### 1️⃣ PostgreSQL Plugin qo'shish

1. Railway Dashboard → Project ochish
2. **+ New** → **Database** → **PostgreSQL**
3. PostgreSQL service yaratiladi (avtomatik)

### 2️⃣ Environment Variables (Avtomatik)

Railway PostgreSQL plugin qo'shilganda quyidagi variables avtomatik yaratiladi:

```
DATABASE_URL=postgresql://user:pass@host:port/db
PGHOST=...
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...
```

**Siz faqat bitta variable qo'shishingiz kerak:**

```
PG_SSL=true
```

### 3️⃣ Migration ishga tushirish (Railway)

Railway dashboard → Service → **Settings** → **Deploy**

Deploy trigger'dan keyin migration avtomatik ishlamaydi, shuning uchun:

**Option 1: One-time Command**

Railway CLI orqali:

```bash
railway run npm run migrate
```

**Option 2: Manual SQL Import**

Agar local'da migration qilgan bo'lsangiz, PostgreSQL dump yarating:

```bash
pg_dump -U postgres manyaktv > manyaktv_backup.sql
```

Railway PostgreSQL'ga import qiling:

```bash
railway connect PostgreSQL
\i manyaktv_backup.sql
```

### 4️⃣ Volume Setup (Uploads)

Railway → Service → **Settings** → **Volumes**

Volume yaratish:
- **Mount Path:** `/data/uploads`
- **Size:** 5GB+ (kerakli hajm)

`.env` da:
```
UPLOADS_DIR=/data/uploads
BACKUP_DIR=/data/backups
```

### 5️⃣ Deploy

```bash
git push origin main
```

Railway avtomatik deploy qiladi.

---

## 🔒 XAVFSIZLIK

### ✅ Qilingan

1. **Connection Pooling** - 20 max connections
2. **SSL Support** - Production'da avtomatik
3. **Prepared Statements** - SQL injection himoyasi
4. **Error Handling** - Xatoliklar to'g'ri boshqariladi
5. **Transaction Support** - ACID garantiyasi
6. **Password Encryption** - .env faqat server'da

### ⚠️ Qilish kerak

1. **Production'da `.env` o'chirish** - Faqat Railway variables ishlatish
2. **PG_PASSWORD o'zgartirish** - Kuchli parol qo'yish
3. **Connection limit monitoring** - Pool size monitoring
4. **Backup setup** - Avtomatik PostgreSQL backup

---

## 📊 PERFORMANCE OPTIMIZATION

### Indexlar

Barcha zaruriy indexlar avtomatik yaratiladi:

```sql
CREATE INDEX idx_receipts_user ON receipts(user_id);
CREATE INDEX idx_receipts_status ON receipts(status);
CREATE INDEX idx_history_user ON watch_history(user_id);
CREATE INDEX idx_audit_admin ON audit_logs(admin_id);
CREATE INDEX idx_comments_content ON comments(content_id);
CREATE INDEX idx_users_last_login ON users(last_login_at DESC);
CREATE INDEX idx_contents_type ON contents(type);
```

### Query Optimization

- `LIMIT` va `OFFSET` barcha listlarda
- `JSONB` types - native PostgreSQL JSON support
- `TIMESTAMPTZ` - timezone-aware timestamps
- Connection pooling - concurrent requests uchun

---

## 🐛 TROUBLESHOOTING

### Migration xatolari

**Xato: "connection refused"**
```bash
# PostgreSQL service tekshirish
net start postgresql-x64-15

# Port tekshirish
netstat -an | findstr 5432
```

**Xato: "database does not exist"**
```bash
# Database yaratish
psql -U postgres -c "CREATE DATABASE manyaktv;"
```

**Xato: "authentication failed"**
```bash
# .env faylda parol to'g'ri ekanligini tekshiring
# pg_hba.conf faylni tekshiring (trust/md5)
```

### Production xatolari

**Railway connection issues:**

1. Railway Dashboard → PostgreSQL service → **Connect** tugmasi
2. Connection string nusxalash
3. Environment variables'ni tekshirish

**Slow queries:**

```sql
-- Slow query log yoqish
ALTER DATABASE manyaktv SET log_min_duration_statement = 1000;

-- Active queries ko'rish
SELECT * FROM pg_stat_activity WHERE state = 'active';
```

---

## 📖 RESURSLAR

- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [node-postgres (pg) Docs](https://node-postgres.com/)
- [Railway PostgreSQL Guide](https://docs.railway.app/databases/postgresql)

---

## ✅ CHECKLIST

### Local Development
- [ ] PostgreSQL o'rnatildi
- [ ] Database yaratildi
- [ ] `.env` to'ldirildi
- [ ] `npm install pg` ishga tushdi
- [ ] Migration muvaffaqiyatli
- [ ] Server ishga tushdi
- [ ] API endpoints ishlayapti

### Production (Railway)
- [ ] PostgreSQL plugin qo'shildi
- [ ] Environment variables sozlandi
- [ ] Migration ishga tushirildi (one-time)
- [ ] Volume yaratildi (/data/uploads)
- [ ] Deploy muvaffaqiyatli
- [ ] Health check OK
- [ ] Users login qila olmoqda
- [ ] Admin panel ishlayapti
- [ ] Uploads saqlanyapti

---

**🎉 Migration tayyor! PostgreSQL bilan ishlashdan zavqlaning!**
