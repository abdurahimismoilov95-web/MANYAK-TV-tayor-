# 🚀 MANYK TV - Production Deployment Guide

**Target Platform:** Railway / Render / Vercel  
**Date:** 2026-09-11  
**Status:** Ready for deployment

---

## 📋 Pre-Deployment Checklist

### ✅ Ko'rib chiqing:

- [ ] `SECURITY.md` faylini to'liq o'qidingiz
- [ ] `.env.example` template tayyorlangan
- [ ] `.env` fayil git'ga commit qilinmagan (`.gitignore` tekshiring)
- [ ] Barcha o'zgarishlar commit qilingan
- [ ] Build muvaffaqiyatli (`npm run build`)
- [ ] Lokal test o'tkazilgan

---

## 🔐 Step 1: Strong Secrets Yaratish

### Terminal'da ishga tushiring:

```bash
# JWT Secret yaratish
echo "JWT_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex')")"

# Webhook Secret yaratish
echo "WEBHOOK_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex')")"
```

### Nusxa oling va xavfsiz joyda saqlang:

```
JWT_SECRET=a1b2c3d4e5f6... (64 char)
WEBHOOK_SECRET=f6e5d4c3b2a1... (64 char)
```

⚠️ **MUHIM:** Bu secretlar hech qachon git'ga yoki public joyga qo'ymang!

---

## 🌐 Step 2: Railway Deployment

### 2.1 Railway Project Yaratish:

1. **Railway.app ga kiring:** https://railway.app
2. **"New Project"** bosing
3. **"Deploy from GitHub repo"** tanlang
4. **Repository tanlang:** `MANYAK-TV-tayor-/manyk-tv1`
5. **Branch:** `main` yoki aktiv branch
6. **Railway avtomatik detect qiladi:** Node.js project

### 2.2 Environment Variables Sozlash:

**Settings → Variables → Raw Editor**

```env
# ════════════════════════════════════════════════════════
# MANYK TV - PRODUCTION ENVIRONMENT VARIABLES
# ════════════════════════════════════════════════════════

# ────────────────────────────────────────────────────────
# TELEGRAM BOT (MAJBURIY)
# ────────────────────────────────────────────────────────
# @BotFather dan olgan tokeningiz
TELEGRAM_BOT_TOKEN=6680993256:AAH14MeHY8NWb9zlO9DF6rB1d8ASiXi6RKE

# Sizning Telegram ID'ingiz (@userinfobot dan oling)
SUPER_ADMIN_ID=891846690

# Qo'shimcha adminlar (ixtiyoriy, vergul bilan)
ADMIN_IDS=

# ────────────────────────────────────────────────────────
# XAVFSIZLIK SECRETS (MAJBURIY - YUQORIDA YARATGAN)
# ────────────────────────────────────────────────────────
# ⚠️ Bu yerga yuqorida yaratgan HAQIQIY secretlarni qo'ying!
JWT_SECRET=<PASTE_YOUR_64_CHAR_HEX_HERE>
WEBHOOK_SECRET=<PASTE_YOUR_64_CHAR_HEX_HERE>

# ────────────────────────────────────────────────────────
# APPLICATION SETTINGS
# ────────────────────────────────────────────────────────
# Railway avtomatik APP_URL beradi, lekin qo'lda ham qo'yish mumkin
APP_URL=${{ RAILWAY_PUBLIC_DOMAIN }}

# Production rejim
NODE_ENV=production

# Port (Railway avtomatik belgilaydi)
PORT=3001

# ────────────────────────────────────────────────────────
# STORAGE (Railway Volume Required!)
# ────────────────────────────────────────────────────────
# Database joylashuvi
DATA_DIR=/data

# Backup papkasi
BACKUP_DIR=/data/backups

# Yuklangan fayllar
UPLOADS_DIR=/data/uploads

# ────────────────────────────────────────────────────────
# OPTIONAL
# ────────────────────────────────────────────────────────
GEMINI_API_KEY=
```

### 2.3 Railway Volume Qo'shish (Database uchun):

⚠️ **MUHIM:** Railway'da database va uploadlar yo'qolmasligi uchun volume kerak!

1. **Project Settings → Volumes**
2. **"Add Volume"** bosing
3. **Mount Path:** `/data`
4. **Size:** 1 GB (yoki kerak bo'lganicha)
5. **Save**

### 2.4 Deploy Boshlash:

Railway avtomatik deploy qiladi:

```
✓ Cloning repository...
✓ Installing dependencies (npm install)...
✓ Building frontend (npm run build)...
✓ Starting server (npm run server)...
✓ Health check passed!
✓ Deployment live at: https://manyk-tv-production.up.railway.app
```

### 2.5 Telegram Webhook Sozlash:

Deploy tugagach, webhook o'rnatish kerak:

```bash
# Railway URL'ingizni oling
APP_URL="https://manyk-tv-production.up.railway.app"

# Webhook o'rnatish (browser'da oching)
open "${APP_URL}/webhook/setup"

# Yoki curl bilan:
curl "${APP_URL}/webhook/setup"
```

**Response:**
```json
{
  "ok": true,
  "message": "Webhook muvaffaqiyatli o'rnatildi!",
  "url": "https://manyk-tv-production.up.railway.app/webhook"
}
```

---

## 🎨 Step 3: Render Deployment (Alternative)

### 3.1 Render Project Yaratish:

1. **Render.com ga kiring:** https://render.com
2. **"New +" → "Web Service"**
3. **GitHub repository connect qiling**
4. **Configuration:**
   - **Name:** `manyk-tv-production`
   - **Region:** Frankfurt (yoki yaqin)
   - **Branch:** `main`
   - **Runtime:** Node
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npm run server`

### 3.2 Environment Variables:

**Environment → Add Environment Variable**

Yuqoridagi Railway uchun yaratgan `.env` ni shu yerga copy qiling.

⚠️ **O'zgartiring:**
```env
# Render o'z URL'ini beradi
APP_URL=${{ RENDER_EXTERNAL_URL }}
```

### 3.3 Persistent Disk Qo'shish:

1. **Settings → Disks**
2. **Add Disk:**
   - **Name:** `data-volume`
   - **Mount Path:** `/data`
   - **Size:** 1 GB
3. **Save Changes**

### 3.4 Deploy & Webhook:

Deploy tugagach webhook o'rnating (Railway kabi).

---

## ✅ Step 4: Deployment Verification

### 4.1 Health Check:

```bash
# Replace with your actual URL
APP_URL="https://manyk-tv-production.up.railway.app"

# Test server
curl "${APP_URL}/api/health"
# Expected: { "ok": true, "message": "Server ishlayapti" }

# Test webhook
curl "${APP_URL}/webhook/info"
# Expected: { "ok": true, "webhook": { "url": "...", "has_custom_certificate": false } }
```

### 4.2 Secrets Validation:

Server logs'da ko'ring:

```
✅ Production secrets tekshiruvi muvaffaqiyatli!
[DB] Baza joylashuvi: /data/manyktv.db
[Server] 🚀 Server http://0.0.0.0:3001 da ishga tushdi
```

Agar xato bo'lsa:
```
❌ JWT_SECRET env variable MAJBURIY va default qiymat bo'lmasligi kerak!
```

### 4.3 Bot Test:

1. **Telegram bot'ga boring:** `@Manyaktvbot`
2. **`/start` yuboring**
3. **Kontakt tasdiqlash** so'ralishi kerak
4. **Kontaktni yuboring**
5. **Tasdiqlash muvaffaqiyatli** bo'lishi kerak

### 4.4 Frontend Test:

```bash
# Browser'da oching
open "${APP_URL}"

# Login via Telegram
# ✅ Mini App ochilishi kerak
# ✅ Content ko'rinishi kerak
# ✅ Profile ishlashi kerak
```

### 4.5 Admin Panel Test:

**Admin sifatida kirganingizdan so'ng:**

1. **Settings → Admin Panel** oching
2. **Barcha tablar ishlashini tekshiring:**
   - Users
   - Content
   - Receipts
   - Plans
   - Settings
3. **Fayl yuklash test qiling:**
   - Rasm yuklash (receipt) → Private folder
   - Poster yuklash → Public folder

---

## 📊 Step 5: Monitoring Setup

### 5.1 Railway Logs:

```
Dashboard → Your Project → Logs
```

**Muhim loglar:**
```
[Privacy] ✅ Metadata tozalandi: receipt_...
[Backup] Backup yaratildi: manyktv_2026-09-11_03-00-00.db
[Receipt Notify] Admin 891846690 ga yuborildi ✅
[Auth] JWT token generated for user 891846690
```

### 5.2 Uptime Monitor (Recommended):

**UptimeRobot setup:**

1. **uptimerobot.com** ga kiring
2. **Add New Monitor:**
   - **Type:** HTTP(s)
   - **URL:** `${APP_URL}/api/health`
   - **Interval:** 5 minutes
   - **Alert Contacts:** Your email/Telegram

### 5.3 Error Tracking (Optional):

**Sentry.io integration:**

```bash
npm install @sentry/node

# server.js ga qo'shing:
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 1.0
});
```

---

## 🔧 Step 6: Database Backup Verification

### 6.1 Manual Backup Test:

```bash
# Admin JWT token bilan (Postman/curl)
curl -X POST "${APP_URL}/api/backups/create" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"

# Response:
{
  "ok": true,
  "backup": {
    "filename": "manyktv_2026-09-11_15-30-00.db",
    "size": 524288,
    "created": "2026-09-11T15:30:00.000Z"
  }
}
```

### 6.2 Automatic Backup Verification:

Har kuni soat 03:00 da avtomatik backup qilinadi.

**Ertaga tekshiring:**

```bash
# List backups
curl "${APP_URL}/api/backups" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT"

# Should show today's 3AM backup
```

### 6.3 Backup Restoration Test (Staging faqat!):

```bash
# ⚠️ HECH QACHON production'da restore QILMANG test qilmasdan!

curl -X POST "${APP_URL}/api/backups/restore" \
  -H "Authorization: Bearer YOUR_ADMIN_JWT" \
  -H "Content-Type: application/json" \
  -d '{"filename": "manyktv_2026-09-10_03-00-00.db"}'
```

---

## 🔐 Step 7: Security Final Checks

### 7.1 SSL/TLS Certificate:

Railway va Render avtomatik SSL beradi:

```bash
# Check HTTPS
curl -I "${APP_URL}"
# Should show: HTTP/2 200
# SSL certificate should be valid
```

### 7.2 Secrets Rotation (Har 90 kunda):

**Qachon rotate qilish kerak:**
- ✅ First deployment (hozir)
- ✅ 90 kun o'tgandan keyin
- ✅ Agar compromised bo'lsa (darhol!)

**Qanday rotate qilish:**
```bash
# 1. Yangi secrets yarating
NEW_JWT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NEW_WEBHOOK=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Railway/Render dashboard'da yangilang
# 3. Server restart qiladi avtomatik
# 4. Webhook'ni qayta o'rnating
```

### 7.3 Rate Limiting Test:

```bash
# Test auth rate limit (5 req/min)
for i in {1..10}; do
  curl -X POST "${APP_URL}/api/auth/verify" \
    -H "Content-Type: application/json" \
    -d '{"initData":"test"}' &
done

# After 5 requests, should return:
# HTTP 429 Too Many Requests
```

---

## 🎯 Step 8: Post-Deployment Tasks

### Immediate (24 soat ichida):

- [ ] Webhook ishlashini verify qiling (`/start` bot'da)
- [ ] Admin panel orqali test content yuklang
- [ ] Test payment receipt yuboring
- [ ] EXIF stripping ishlaganini tekshiring
- [ ] Backup fayli yaratilganini tasdiqlang
- [ ] Monitoring alerts sozlang

### Weekly:

- [ ] Logs'ni ko'rib chiqing (errors, suspicious activity)
- [ ] Backup files'ni tekshiring
- [ ] User growth metrics
- [ ] Performance monitoring

### Monthly:

- [ ] Dependencies yangilash (`npm audit fix`)
- [ ] Database optimize (`PRAGMA optimize`)
- [ ] Old backups cleanup (30+ days)
- [ ] Security review

### Quarterly (3 oyda):

- [ ] **Secrets rotation** (JWT, WEBHOOK)
- [ ] Penetration testing
- [ ] Security audit
- [ ] Performance optimization

---

## 🚨 Troubleshooting

### Agar server ishga tushmasa:

**Error:** `JWT_SECRET env variable MAJBURIY`

**Fix:**
```bash
# Railway/Render dashboard → Environment → Check JWT_SECRET
# Should be 64 char hex, NOT "manyktv_jwt_2026_secret"
```

### Agar webhook ishlamasa:

**Error:** `Webhook not set`

**Fix:**
```bash
# Re-setup webhook
curl "${APP_URL}/webhook/setup"

# Check Telegram bot settings
curl "https://api.telegram.org/bot${BOT_TOKEN}/getWebhookInfo"
```

### Agar file upload xato bersa:

**Error:** `Faylni saqlashda xatolik`

**Fix:**
```bash
# Check volume mounted at /data
# Railway → Volumes → Verify /data exists
# Check disk space
```

### Agar database yo'qolsa:

**Error:** `SQLITE_CANTOPEN`

**Fix:**
```bash
# Restore from backup
curl -X POST "${APP_URL}/api/backups/restore" \
  -H "Authorization: Bearer ADMIN_JWT" \
  -d '{"filename": "latest_backup.db"}'
```

---

## 📞 Support & Help

### Railway Support:

- **Docs:** https://docs.railway.app
- **Discord:** https://discord.gg/railway
- **Status:** https://status.railway.app

### Render Support:

- **Docs:** https://render.com/docs
- **Community:** https://community.render.com
- **Status:** https://status.render.com

### MANYK TV Issues:

- **Telegram:** @manyak_admin
- **GitHub Issues:** (if public repo)
- **Email:** support@manyaktv.com

---

## 🎉 Success!

Agar barcha checklar ✅ bo'lsa:

```
🚀 MANYK TV PRODUCTION DEPLOYMENT SUCCESSFUL!

✅ Server running
✅ Secrets validated
✅ Telegram bot connected
✅ Database backed up
✅ SSL certificate active
✅ Monitoring enabled

🌐 Live URL: https://manyk-tv-production.up.railway.app
🤖 Telegram Bot: @Manyaktvbot
📊 Admin Panel: ${APP_URL}/settings

READY FOR USERS! 🎬🍿
```

---

**Keyingi qadam:** User'larni invite qiling va monitoring qiling! 👥📈

**Eslatma:** `SECURITY.md` faylini muntazam o'qib turing va best practices'ga rioya qiling.

---

**Last Updated:** 2026-09-11  
**Version:** 1.0  
**Status:** ✅ Ready for Production
