# ✅ PRODUCTION DEPLOYMENT CHECKLIST - PostgreSQL

## 🎯 PRE-DEPLOYMENT

### 1. Code Preparation

- [ ] **Git commit barcha o'zgarishlar**
  ```bash
  git add .
  git commit -m "PostgreSQL migration complete"
  git push origin main
  ```

- [ ] **Build local test**
  ```bash
  npm run build
  # Check dist/ folder generated
  ```

- [ ] **Dependencies check**
  ```bash
  npm audit
  npm outdated
  ```

### 2. Environment Variables Tayyorlash

**Railway Dashboard → Settings → Variables:**

```bash
# PostgreSQL (Railway avtomatik beradi, faqat tekshirish)
DATABASE_URL=postgresql://...
PGHOST=...
PGPORT=5432
PGUSER=...
PGPASSWORD=...
PGDATABASE=...

# Qo'shimcha (siz qo'shasiz):
PG_SSL=true

# Telegram Bot
TELEGRAM_BOT_TOKEN=6680993256:AAH14MeHY8NWb9zlO9DF6rB1d8ASiXi6RKE
TELEGRAM_CHANNEL_ID=@Manyak_tv
SUPER_ADMIN_ID=891846690
ADMIN_IDS=891846690

# Security
JWT_SECRET=13be87714bc758c2b730b4fdb6426632e373a82d2ba2b6872b599040679c0896
WEBHOOK_SECRET=83913760abebc02506c968efc02bd6f1b91fea7a744dba9228c70fc636731ed3

# App
NODE_ENV=production
APP_URL=https://manyk-tv1-production.up.railway.app
PORT=3001

# Storage
UPLOADS_DIR=/data/uploads
BACKUP_DIR=/data/backups

# Frontend
VITE_API_BASE_URL=/api
VITE_SUPER_ADMIN_ID=891846690
```

### 3. Railway Service Setup

- [ ] **PostgreSQL Plugin qo'shish**
  - Dashboard → + New → Database → PostgreSQL
  - Auto-configure (DATABASE_URL, PGHOST, etc.)

- [ ] **Volume yaratish**
  - Service Settings → Volumes → + New Volume
  - Mount Path: `/data/uploads`
  - Size: 5GB+ (o'zingiz tanlang)

---

## 🚀 DEPLOYMENT

### 1. Deploy Trigger

```bash
git push origin main
```

Railway avtomatik:
1. Code pull
2. `npm install`
3. `npm run build`
4. `npm start`

### 2. Deploy Logs Monitoring

Railway Dashboard → Service → Deployments → Latest

**Kutilayotgan log:**
```
[PostgreSQL] Initializing database schema...
[PostgreSQL] ✅ Schema initialized
[Seed] Checking if database needs seeding...
[Seed] ✅ Seed check completed
🚀 MANYAK TV PostgreSQL Backend v3.0
   http://localhost:3001
   Health:     /api/health
   Webhook:    /webhook
   DB:         postgresql://...
   Bot:        ✅
```

**⚠️ Xatolar:**
```
# Connection refused → Check PostgreSQL plugin
# Port already in use → Check PORT env var
# Schema creation failed → Check DATABASE_URL
```

### 3. Health Check

**Railway URL olish:**
```
https://manyk-tv1-production.up.railway.app
```

**API test:**
```bash
curl https://your-app.up.railway.app/api/health
# Expected: {"ok": true, "status": "online"}
```

---

## 🗄️ DATABASE MIGRATION

### Option 1: Fresh Start (Recommended if empty DB)

Schema avtomatik yaratiladi `initializeSchema()` orqali.  
Initial data seeding avtomatik: `seedIfEmpty()`

**No action needed!** ✅

### Option 2: Migrate from SQLite

**Railway CLI:**
```bash
railway login
railway link  # Link to your project
railway run npm run migrate
```

**Yoki local'dan migration qilib, SQL dump import:**
```bash
# Local migration
npm run migrate

# Dump local PostgreSQL
pg_dump -U postgres manyaktv > manyaktv_backup.sql

# Import to Railway
railway connect PostgreSQL
\i manyaktv_backup.sql
\q
```

### Migration Verification

```bash
railway run node -e "
import('./database.pg.js').then(async (db) => {
  const userCount = await db.Users.count();
  const contentCount = await db.Contents.count();
  console.log('Users:', userCount);
  console.log('Contents:', contentCount);
  process.exit(0);
});
"
```

---

## 🤖 TELEGRAM BOT SETUP

### 1. Webhook URL Update

**Manual (if needed):**
```bash
curl -X POST "https://api.telegram.org/bot6680993256:AAH14MeHY8NWb9zlO9DF6rB1d8ASiXi6RKE/setWebhook" \
  -d "url=https://manyk-tv1-production.up.railway.app/webhook" \
  -d "max_connections=100"
```

**Auto (server startup script does this):**
Server.js automatically sets webhook on startup.

### 2. Test Bot

1. Open Telegram: @Animanyaktvuzbot
2. Send: `/start`
3. Expected:
   ```
   👋 Xush kelibsiz, MANYAK TV'ga!
   
   🎬 Minglab kino, serial va qisqa dramalar
   ✨ Har kuni yangiliklar
   
   Kirish uchun telefon raqamingizni yuboring:
   [📱 Raqamni yuborish]
   ```

### 3. Admin Commands

```
/stats   → Statistics
/users   → User count
/backup  → Database backup
```

---

## 📤 FILE UPLOAD TEST

### 1. Admin Panel → Content Upload

1. Login as admin (SUPER_ADMIN_ID)
2. Profile → Adminlik Paneli
3. Kontent → Yangi kontent qo'shish
4. Upload video/image
5. Save

### 2. Verify Upload

**Check Railway Logs:**
```
[Upload] File saved: /data/uploads/public/content_...mp4
[Privacy] ✅ Metadata cleaned
```

**Check Volume:**
Railway Dashboard → Service → Volumes → Usage

---

## 🔒 SECURITY CHECKLIST

- [ ] **Parollar kuchli**
  - PG_PASSWORD (Railway auto-generates)
  - JWT_SECRET (64+ characters)
  - WEBHOOK_SECRET (64+ characters)

- [ ] **SSL Enabled**
  - PG_SSL=true
  - APP_URL=https://...

- [ ] **Environment variables faqat Railway'da**
  - `.env` faqat local development
  - Production → Railway dashboard

- [ ] **Rate limiting ishlayapti**
  - Test: 100+ requests/minute → 429 Too Many Requests

- [ ] **Bot webhook secure**
  - WEBHOOK_SECRET configured
  - HMAC validation enabled

---

## 🧪 POST-DEPLOYMENT TESTING

### 1. API Endpoints

```bash
BASE_URL="https://manyk-tv1-production.up.railway.app"

# Health
curl $BASE_URL/api/health

# Contents (no auth)
curl $BASE_URL/api/contents

# Plans
curl $BASE_URL/api/plans

# Settings
curl $BASE_URL/api/settings
```

### 2. User Flow

1. **Register/Login** (Telegram WebApp yoki bot)
2. **Browse content** → Home page
3. **Watch video** → Player opens
4. **Add to favorites** → Heart icon
5. **View history** → History tab
6. **Check profile** → Profile tab

### 3. Admin Flow

1. **Login as admin** (SUPER_ADMIN_ID)
2. **Open admin panel** → Profile → Adminlik Paneli
3. **Upload content** → Video/Image upload
4. **Create promo code** → Promokodlar
5. **Review receipt** → To'lov cheklari
6. **View stats** → Dashboard

### 4. Payment Flow

1. **User opens VIP modal**
2. **Selects plan** → 1-month/3-month/etc
3. **Uploads receipt** → Image upload
4. **Admin reviews** → Approve/Reject
5. **User gets VIP** → Access granted

---

## 📊 MONITORING

### 1. Railway Metrics

Dashboard → Service → Metrics:
- CPU usage
- Memory usage
- Network traffic
- Request count

### 2. Database Monitoring

```sql
-- Active connections
SELECT count(*) FROM pg_stat_activity;

-- Slow queries
SELECT query, mean_exec_time 
FROM pg_stat_statements 
ORDER BY mean_exec_time DESC 
LIMIT 10;

-- Database size
SELECT pg_size_pretty(pg_database_size('manyaktv'));
```

### 3. Error Tracking

Railway → Service → Logs → Filter by "ERROR"

---

## 🐛 TROUBLESHOOTING

### Issue: "Cannot connect to database"

**Check:**
1. PostgreSQL service running?
2. DATABASE_URL configured?
3. PG_SSL=true for Railway?

**Fix:**
```bash
# Test connection
railway run node -e "
import('pg').then(({ default: pg }) => {
  const client = new pg.Client({ connectionString: process.env.DATABASE_URL });
  client.connect().then(() => {
    console.log('✅ Connected');
    process.exit(0);
  }).catch(err => {
    console.error('❌', err);
    process.exit(1);
  });
});
"
```

### Issue: "Port already in use"

**Fix:**
- Remove `PORT=3001` from Railway env (Railway auto-assigns)
- Or change to `PORT=3000`

### Issue: "Webhook not working"

**Check:**
1. APP_URL correct?
2. BOT_TOKEN correct?
3. Webhook registered?

**Fix:**
```bash
# Check webhook status
curl "https://api.telegram.org/bot$BOT_TOKEN/getWebhookInfo"

# Re-register
curl -X POST "https://api.telegram.org/bot$BOT_TOKEN/setWebhook" \
  -d "url=$APP_URL/webhook"
```

### Issue: "File uploads not saving"

**Check:**
1. Volume mounted? (`/data/uploads`)
2. UPLOADS_DIR correct?
3. Permissions?

**Fix:**
```bash
railway run ls -la /data/uploads
# Should show files, not "Permission denied"
```

---

## 📋 ROLLBACK PLAN

Agar deployment fail bo'lsa:

### 1. Previous Deployment

Railway Dashboard → Deployments → Previous → Redeploy

### 2. Revert Git

```bash
git revert HEAD
git push origin main
```

### 3. Database Restore

```bash
# If you have backup
railway connect PostgreSQL
\i backup.sql
```

---

## ✅ SUCCESS CRITERIA

Deployment muvaffaqiyatli bo'lganda:

- [x] ✅ Railway deploy successful
- [x] ✅ PostgreSQL connected
- [x] ✅ Schema initialized
- [x] ✅ /api/health returns 200
- [x] ✅ Bot webhook registered
- [x] ✅ Bot responds to /start
- [x] ✅ Users can login
- [x] ✅ Content visible
- [x] ✅ Video playback works
- [x] ✅ Admin panel accessible
- [x] ✅ File uploads work
- [x] ✅ VIP subscription works
- [x] ✅ No errors in logs

---

## 🎉 POST-DEPLOYMENT

### 1. Announce to Users

Telegram channel post:
```
🎉 MANYAK TV yangilandi!

✨ Yangiliklar:
- Tezroq ishlash
- Yanada barqaror
- Ma'lumotlar xavfsizligi yaxshilandi

📲 Botga o'ting va zavqlaning:
@Animanyaktvuzbot

❤️ MANYAK TV jamoasi
```

### 2. Monitor First 24 Hours

- User registration rate
- Error count
- Performance metrics
- User feedback

### 3. Backup Schedule

Railway PostgreSQL auto-backups:
- Daily snapshots
- 7-day retention
- Point-in-time recovery

**Manual backups (optional):**
```bash
# Weekly backup
railway run pg_dump > weekly_backup_$(date +%Y%m%d).sql
```

---

**📅 Deployment Date:** _______  
**👨‍💻 Deployed By:** _______  
**🎯 Status:** _______  
**⏱️ Downtime:** _______ minutes  

---

**🔗 Production URL:** https://manyk-tv1-production.up.railway.app  
**🤖 Bot:** @Animanyaktvuzbot  
**📱 Channel:** @Manyak_tv  
**👨‍💻 Admin:** @SUPER_ADMIN_USERNAME

---

## 📞 SUPPORT

Muammolar bo'lsa:
1. Railway logs tekshiring
2. PostgreSQL connection test
3. Error logs analyze
4. Rollback if critical

---

**Status: 🚀 READY FOR DEPLOYMENT**
