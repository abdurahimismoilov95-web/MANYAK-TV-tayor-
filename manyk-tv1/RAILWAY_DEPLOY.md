# 🚂 Railway Deployment Guide - MANYAK TV V1

## ✅ Tayyor!

V1 loyiha Railway'ga deploy qilish uchun tayyor. Barcha kerakli konfiguratsiya fayllari yaratildi:

- ✅ `package.json` - start command qo'shildi
- ✅ `nixpacks.toml` - Railway build konfiguratsiyasi
- ✅ `railway.toml` - Railway deploy settings
- ✅ `.railwayignore` - kerak yo'q fayllar ignore qilinadi

## 📋 Deployment Qadamlari

### 1. GitHub'ga Push Qiling

```bash
git add .
git commit -m "Railway deployment ready - V1 fixes applied"
git push origin main
```

### 2. Railway Project Yarating

1. [Railway Dashboard](https://railway.app/dashboard) ga kiring
2. **New Project** > **Deploy from GitHub repo** ni tanlang
3. Repository'ni tanlang (authorize qiling agar kerak bo'lsa)
4. `manyk-tv1` branch'ini tanlang

### 3. Environment Variables

Railway Dashboard'da **Variables** tab'ida quyidagi o'zgaruvchilarni qo'shing:

```env
# Node.js
NODE_ENV=production
PORT=3000

# JWT Secret
JWT_SECRET=your-super-secret-jwt-key-here

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token
BOT_TOKEN=your-bot-token

# Admin
SUPER_ADMIN_ID=your-telegram-id
ADMIN_IDS=telegram-id-1,telegram-id-2

# Database (SQLite)
DATA_DIR=/data

# App URL (Railway beradi)
APP_URL=${{RAILWAY_PUBLIC_DOMAIN}}
PUBLIC_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Optional: Backups
BACKUP_DIR=/backups
```

### 4. Volume Setup (Database uchun)

Railway'da **Volumes** qo'shing:
- **Mount Path**: `/data`
- **Size**: 1GB (yoki kerak bo'lganicha)

Bu SQLite database'ni saqlaydi (har deploy'da yo'qolmaydi).

### 5. Domain Setup

1. Railway sizga domain beradi: `xxx.up.railway.app`
2. Yoki custom domain qo'shing: **Settings** > **Domains**
3. Domain olganingizdan keyin, `APP_URL` o'zgaruvchisini yangilang

### 6. Deploy!

Railway avtomatik deploy qiladi:
- ✅ Dependencies o'rnatadi (`npm install`)
- ✅ Frontend build qiladi (`npm run build`)
- ✅ Server'ni ishga tushiradi (`npm start`)

Deploy holati **Deployments** tab'ida ko'rinadi.

## 🔧 Deploy'dan Keyin

### Telegram Bot Webhook'ni Sozlang

Railway domain olganingizdan keyin, botga webhook o'rnating:

```bash
curl -X POST "https://api.telegram.org/bot<BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url": "https://your-app.up.railway.app/webhook"}'
```

Yoki browser'da oching:
```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://your-app.up.railway.app/webhook
```

### Database Seed

Birinchi deploy'da super admin yaratiladi avtomatik (`seedIfEmpty()` server.js'da).

## 📊 Monitoring

Railway Dashboard'da:
- **Logs** - real-time logs
- **Metrics** - CPU, RAM, Network
- **Deployments** - deploy history

## 🔄 Update Qilish

Kod o'zgartirganingizda:

```bash
git add .
git commit -m "Update description"
git push origin main
```

Railway avtomatik qayta deploy qiladi.

## ⚠️ Muhim

1. **Environment Variables** - hamma o'zgaruvchilar to'g'ri kiritilganini tekshiring
2. **Volume** - `/data` volume yaratilganini tasdiqlang
3. **Domain** - APP_URL Railway domain bilan mos kelishini tekshiring
4. **Bot Token** - webhook Railway domain'ga o'rnatilganini tasdiqlang

## 🐛 Troubleshooting

### Deploy Failed?

1. **Logs**'ni tekshiring: Railway Dashboard > Deployments > View Logs
2. Build xatolari: `npm install` yoki `npm run build` muammosi
3. Start xatolari: `npm start` - environment variables tekshiring

### Bot ishlamayapti?

1. Webhook to'g'ri o'rnatilganini tekshiring:
   ```
   https://api.telegram.org/bot<TOKEN>/getWebhookInfo
   ```

2. APP_URL to'g'ri domain'ga sozlanganini tasdiqlang

3. Railway logs'da bot xatolarini qidiring

### Database yo'qoldi?

Volume ulangan bo'lishini tekshiring:
- Railway Dashboard > Service > Volumes
- Mount path: `/data`

## 🎉 Deploy Tayyor!

Railway'ga deploy qilish uchun yuqoridagi qadamlarni bajaring. 

Savollar bo'lsa:
- [Railway Docs](https://docs.railway.app)
- [Node.js Deploy Guide](https://docs.railway.app/guides/nodejs)

Good luck! 🚀
