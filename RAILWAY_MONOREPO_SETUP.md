# 🚂 Railway Monorepo Deployment Guide - MANYAK TV V2

**V2 Architecture:** 4 separate microservices in monorepo  
**Railway Strategy:** Deploy each service separately

---

## 📦 V2 Services

1. **API Service** (`apps/api`) - Backend REST API
2. **Bot Service** (`apps/bot`) - Telegram Bot
3. **Encoder Service** (`apps/encoder`) - Video/Image Processing
4. **Web Service** (`apps/web`) - Frontend React App

---

## 🚀 Railway Deployment Options

### Option 1: Simple (Recommended for Testing) 
Deploy only **API Service** first, then add others

### Option 2: Complete (Production)
Deploy all 4 services separately

---

## ✅ Option 1: Simple - API Only

Birinchi API service'ni deploy qiling, keyin boshqalarini qo'shing.

### Step 1: GitHub'ga Push

```bash
cd c:\Users\SOIL1007\Documents\GIT\MANYAK-TV-tayor-\manyak-tv-v2
git add .
git commit -m "Railway deployment ready - V2"
git push origin main
```

### Step 2: Railway'da API Service Deploy

1. [Railway Dashboard](https://railway.app) ga kiring
2. **New Project** > **Deploy from GitHub repo**
3. Repository tanlang: `manyak-tv-v2`
4. Service nomi: `manyak-tv-api`

### Step 3: API Environment Variables

Railway'da **Variables** tab:

```env
# Node
NODE_ENV=production
PORT=3000

# Database (PostgreSQL)
DATABASE_URL=${{Postgres.DATABASE_URL}}

# JWT
JWT_SECRET=your-super-secret-jwt-key-minimum-32-chars

# Telegram Bot
TELEGRAM_BOT_TOKEN=your-bot-token
TELEGRAM_BOT_USERNAME=YourBot

# Admin
SUPER_ADMIN_ID=your-telegram-id

# App URLs
API_URL=${{RAILWAY_PUBLIC_DOMAIN}}
WEB_URL=https://your-web-domain.com
BOT_WEBHOOK_URL=${{RAILWAY_PUBLIC_DOMAIN}}/webhook

# Redis (optional)
REDIS_URL=${{Redis.REDIS_URL}}

# S3/Storage (optional)
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_REGION=
AWS_BUCKET=
```

### Step 4: PostgreSQL Database

Railway'da database qo'shing:
1. Service'ga o'ting
2. **+ New** > **Database** > **Add PostgreSQL**
3. Avtomatik `DATABASE_URL` variable qo'shiladi

### Step 5: Deploy!

Railway avtomatik:
- ✅ Dependencies install (`npm install`)
- ✅ Prisma generate (`npm run build` ichida)
- ✅ API build (`apps/api`)
- ✅ Prisma migrations run
- ✅ API start (`npm start`)

---

## 🎯 Option 2: Complete - All Services

Har bir service alohida deploy qiling.

### 1. API Service (yuqoridagi kabi)

### 2. Bot Service

**New Service:**
- Name: `manyak-tv-bot`
- Same repo: `manyak-tv-v2`
- Root Directory: `/` (monorepo root)

**Custom Start Command:**
```bash
npm run start:bot
```

**nixpacks.toml** (bot uchun):
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install --include=dev"]

[phases.build]
cmds = ["npm run build:bot"]

[start]
cmd = "npm run start:bot"
```

**Environment Variables:**
```env
NODE_ENV=production
DATABASE_URL=${{manyak-tv-api.DATABASE_URL}}
TELEGRAM_BOT_TOKEN=your-bot-token
API_URL=${{manyak-tv-api.RAILWAY_PUBLIC_DOMAIN}}
```

### 3. Encoder Service

**New Service:**
- Name: `manyak-tv-encoder`
- Root Directory: `/`

**Custom Start Command:**
```bash
npm run start:encoder
```

**nixpacks.toml** (encoder uchun):
```toml
[phases.setup]
nixPkgs = ["nodejs_20", "ffmpeg"]  # FFmpeg kerak!

[phases.install]
cmds = ["npm install --include=dev"]

[phases.build]
cmds = ["npm run build:encoder"]

[start]
cmd = "npm run start:encoder"
```

**Environment Variables:**
```env
NODE_ENV=production
REDIS_URL=${{Redis.REDIS_URL}}
UPLOAD_DIR=/uploads
OUTPUT_DIR=/outputs
```

**Volumes:**
- `/uploads` - kiruvchi video fayllar
- `/outputs` - encode qilingan fayllar

### 4. Web Service (Frontend)

**New Service:**
- Name: `manyak-tv-web`
- Root Directory: `/`

**Custom Start Command:**
```bash
npm run start:web
```

**nixpacks.toml** (web uchun):
```toml
[phases.setup]
nixPkgs = ["nodejs_20"]

[phases.install]
cmds = ["npm install --include=dev"]

[phases.build]
cmds = ["npm run build:web"]

[start]
cmd = "npm run start:web"
```

**Environment Variables:**
```env
NODE_ENV=production
VITE_API_URL=${{manyak-tv-api.RAILWAY_PUBLIC_DOMAIN}}
```

---

## 🔗 Service Communication

Railway'da service'lar bir-biri bilan private network orqali gaplashadi:

```env
# API service ichida
BOT_SERVICE_URL=${{manyak-tv-bot.RAILWAY_PRIVATE_DOMAIN}}
ENCODER_SERVICE_URL=${{manyak-tv-encoder.RAILWAY_PRIVATE_DOMAIN}}

# Bot service ichida  
API_SERVICE_URL=${{manyak-tv-api.RAILWAY_PRIVATE_DOMAIN}}

# Web service ichida
VITE_API_URL=${{manyak-tv-api.RAILWAY_PUBLIC_DOMAIN}}
```

---

## 📊 Cost Optimization

### Free Tier Strategy:
1. **Birinchi oy:** Faqat API + Web (testing)
2. **Ikkinchi oy:** Bot qo'shing
3. **Uchinchi oy:** Encoder qo'shing (kerak bo'lsa)

### Resource Limits:
- API: 2GB RAM, 2 vCPU
- Bot: 1GB RAM, 1 vCPU  
- Encoder: 4GB RAM, 2 vCPU (video processing)
- Web: 1GB RAM, 1 vCPU

---

## 🐛 Troubleshooting

### "No start command detected"

**Sabab:** `package.json` da `start` script yo'q  
**Yechim:** Root `package.json` da:
```json
{
  "scripts": {
    "start": "npm run start:api",
    "build": "npm run build:api"
  }
}
```

### "Module not found: @manyak-tv/database"

**Sabab:** Prisma generate ishlamagan  
**Yechim:** Build command'da:
```bash
npm run build:api  # ichida prisma generate bor
```

### "Cannot connect to database"

**Sabab:** DATABASE_URL noto'g'ri  
**Yechim:** Railway Variables:
```env
DATABASE_URL=${{Postgres.DATABASE_URL}}
```

### "Migration failed"

**Sabab:** Prisma migrations yo'q  
**Yechim:** `start:api` script ichida:
```json
"start:api": "cd apps/api && npx prisma migrate deploy && npm run start:prod"
```

---

## ✅ Deployment Checklist

### API Service:
- [ ] Repository connected
- [ ] PostgreSQL database qo'shilgan
- [ ] Environment variables to'ldirilgan
- [ ] Build successful
- [ ] Migrations deployed
- [ ] Health check: `https://api-domain.railway.app/health`

### Bot Service:
- [ ] Custom start command: `npm run start:bot`
- [ ] DATABASE_URL configured
- [ ] TELEGRAM_BOT_TOKEN set
- [ ] Webhook configured

### Encoder Service:
- [ ] FFmpeg installed (nixpacks)
- [ ] Volumes created (`/uploads`, `/outputs`)
- [ ] Redis connected

### Web Service:
- [ ] Build successful
- [ ] VITE_API_URL points to API
- [ ] Static files served

---

## 📚 Qo'shimcha Resources

- [Railway Monorepo Guide](https://docs.railway.app/deploy/monorepo)
- [Railway Environment Variables](https://docs.railway.app/develop/variables)
- [Nixpacks Configuration](https://nixpacks.com/docs/configuration)

---

**Ready to deploy V2! 🚀**

Option 1 bilan boshlab, keyin Option 2 ga o'ting.
