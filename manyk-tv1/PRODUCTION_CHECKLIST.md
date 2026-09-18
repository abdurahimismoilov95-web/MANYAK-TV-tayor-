# MANYAK TV - Production Deployment Checklist

## ✅ PRE-DEPLOYMENT TEKSHIRUV

### 1. Build Test
```bash
npm run build
```
✅ **Status:** Muvaffaqiyatli

### 2. Environment Variables
Quyidagi o'zgaruvchilar `.env` faylida yoki Railway'da bo'lishi kerak:

#### Muhim (REQUIRED):
- [x] `TELEGRAM_BOT_TOKEN` - Bot tokeni: `6680993256:AAH14MeHY8NWb9zlO9DF6rB1d8ASiXi6RKE`
- [x] `TELEGRAM_CHANNEL_ID` - Kanal: `@Manyak_tv`
- [x] `SUPER_ADMIN_ID` - Admin ID: `891846690`
- [x] `JWT_SECRET` - JWT kaliti: `13be87714...`
- [x] `WEBHOOK_SECRET` - Webhook kaliti: `83913760a...`
- [ ] `APP_URL` - **⚠️ Railway URL kerak!**

#### Ixtiyoriy (OPTIONAL):
- [ ] `GEMINI_API_KEY` - AI support uchun (optional)

---

## 🚀 RAILWAY DEPLOYMENT

### Step 1: Railway Project Yaratish

1. **Railway.app**'ga kiring: https://railway.app
2. **New Project** → **Deploy from GitHub repo**
3. Repository'ni tanlang: `MANYAK-TV-tayor-/manyk-tv1`
4. **Deploy Now** bosing

### Step 2: Environment Variables Qo'shish

**Settings** → **Variables** → **Add Variables**

```env
NODE_ENV=production
TELEGRAM_BOT_TOKEN=6680993256:AAH14MeHY8NWb9zlO9DF6rB1d8ASiXi6RKE
TELEGRAM_CHANNEL_ID=@Manyak_tv
SUPER_ADMIN_ID=891846690
ADMIN_IDS=891846690
WEBHOOK_SECRET=83913760abebc02506c968efc02bd6f1b91fea7a744dba9228c70fc636731ed3
JWT_SECRET=13be87714bc758c2b730b4fdb6426632e373a82d2ba2b6872b599040679c0896
PORT=3001
```

**⚠️ DIQQAT:** `APP_URL` ni Step 3'dan keyin qo'shamiz!

### Step 3: Domain Olish

1. **Settings** → **Networking** → **Public Networking**
2. **Generate Domain** bosing
3. URL paydo bo'ladi: `https://manyk-tv1-production.up.railway.app`
4. Bu URL'ni yozib oling!

### Step 4: APP_URL Qo'shish

1. **Settings** → **Variables**
2. Yangi o'zgaruvchi qo'shing:

```env
APP_URL=https://manyk-tv1-production.up.railway.app
VITE_API_BASE_URL=https://manyk-tv1-production.up.railway.app/api
```

3. **Redeploy** tugmasini bosing

### Step 5: Volume Qo'shish (MUHIM!)

**Settings** → **Volumes** → **+ New Volume**

**Volume 1: Database**
```
Name: manyak-tv-database
Mount Path: /app/data
```

**Volume 2: Uploads**
```
Name: manyak-tv-uploads
Mount Path: /app/uploads
```

**Volume 3: Backups**
```
Name: manyak-tv-backups
Mount Path: /app/backups
```

**Save** → **Redeploy**

---

## ✅ POST-DEPLOYMENT TEKSHIRUV

### 1. Health Check
```bash
curl https://YOUR-RAILWAY-URL.railway.app/api/health
```

Javob:
```json
{"ok":true,"message":"MANYAK TV API is running"}
```

### 2. Bot Webhook
Loglarni tekshiring (Railway dashboard):
```
[Bot] ✅ Bot ulandi: @Animanyaktvuzbot
[Bot] ✅ Webhook o'rnatildi: https://YOUR-URL/webhook
```

### 3. Bot Test
1. Telegram'da: `@Animanyaktvuzbot`
2. `/start` bosing
3. Mini app ochilishi kerak!

### 4. Admin Panel
1. Mini app'da **Profile** → **Admin Panel**
2. Barcha tab'lar ochilishini tekshiring:
   - Content
   - Users
   - Plans
   - Promos
   - Catalogs
   - Settings
   - Stats
   - Logs

### 5. Broadcast Test
1. **Content** tab'da biror kontent tanlang
2. **📢** (Broadcast) tugmasini bosing
3. Tasdiqlash dialog chiqishini tekshiring
4. **Ha** bosing
5. Xabar kanalga va foydalanuvchilarga borishini tekshiring

---

## 🔒 XAVFSIZLIK

### 1. Secrets
✅ `.env` fayli `.gitignore`'da
✅ `JWT_SECRET` va `WEBHOOK_SECRET` generated
✅ Bot token xavfsiz

### 2. Admin Access
- Super Admin ID: `891846690`
- Faqat siz admin panel'ga kirasiz

### 3. Rate Limiting
- Login: 5 req/15min
- Broadcast: 1 req/5min
- File upload: 10 req/15min

---

## 📊 MONITORING

### Railway Logs
**Deployments** → **View Logs**

Quyidagilarni tekshiring:
```
✅ Bot ulandi
✅ Webhook o'rnatildi
✅ Database joylashuvi: /app/data/manyktv.db
✅ Backup scheduled
```

### Metrics
**Metrics** tabda:
- CPU usage
- Memory usage
- Network I/O
- Request count

---

## 🚨 MUAMMOLAR VA YECHIMLAR

### Muammo 1: Bot javob bermayapti
**Sabab:** Webhook noto'g'ri
**Yechim:**
1. `APP_URL` to'g'ri ekanligini tekshiring
2. Server restart qiling
3. Bot settings'da webhook tekshiring: `/getWebhookInfo`

### Muammo 2: Ma'lumotlar restart'dan keyin yo'qolyapti
**Sabab:** Volume qo'shilmagan
**Yechim:**
- **RAILWAY_VOLUME_SETUP.md** ni o'qing
- 3 ta volume qo'shing (database, uploads, backups)

### Muammo 3: Broadcast ishlamayapti
**Sabab:** Database'da foydalanuvchilar yo'q
**Yechim:**
1. Botda `/start` bosing
2. `node check-users.mjs` ishlatib tekshiring
3. Foydalanuvchilar paydo bo'lishini kutib, qayta broadcast qiling

### Muammo 4: File upload ishlamayapti
**Sabab:** Uploads volume qo'shilmagan yoki permissions
**Yechim:**
- Volume qo'shing: `/app/uploads`
- Railway'da folder permissions avtomatik

---

## 📝 KEYINGI QADAMLAR

### 1. Custom Domain (Ixtiyoriy)
Railway'da custom domain qo'shish:
1. **Settings** → **Networking** → **Custom Domain**
2. Domain qo'shing: `manyak.tv`
3. DNS'da CNAME record yarating

### 2. Monitoring Setup
- Railway metrics'ni sozlang
- Error tracking qo'shing (Sentry)
- Uptime monitoring (UptimeRobot)

### 3. Backup Strategy
- Railway Volume automatic backup'ga ega
- Qo'shimcha: Database'ni S3'ga yuklash
- Script: `backup-and-restore.ps1`

### 4. Scaling
Agar foydalanuvchilar ko'paysa:
- **Settings** → **Resources** → Upgrade plan
- Redis cache qo'shing
- CDN qo'shing (Cloudflare)

---

## ✅ DEPLOYMENT COMPLETE!

Barcha tekshiruvlar muvaffaqiyatli bo'lsa:

🎉 **MANYAK TV production'da!**

- URL: https://YOUR-RAILWAY-URL.railway.app
- Bot: @Animanyaktvuzbot
- Kanal: @Manyak_tv
- Admin: Siz

**Omad!** 🚀
