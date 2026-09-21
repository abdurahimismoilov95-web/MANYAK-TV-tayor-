# 🚂 RAILWAY QUICK START - 15 MIN DEPLOY

**Deploy MANYAK TV V2 to Railway in 15 minutes!**

---

## ⚡ SUPER FAST DEPLOYMENT

### 1️⃣ Push to GitHub (2 min)

```bash
cd manyak-tv-v2

# If not a git repo yet
git init
git add .
git commit -m "V2 Ready for Railway"

# Create GitHub repo and push
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/manyak-tv-v2.git
git push -u origin main
```

### 2️⃣ Railway Setup (3 min)

1. Go to https://railway.app
2. Sign in with GitHub
3. Click **"New Project"**
4. Select **"Deploy from GitHub repo"**
5. Choose `manyak-tv-v2`

### 3️⃣ Add Databases (2 min)

**PostgreSQL:**
1. Click **"+ New"** → **"Database"** → **"PostgreSQL"**
2. Wait 30 seconds for creation

**Redis:**
1. Click **"+ New"** → **"Database"** → **"Redis"**
2. Wait 30 seconds for creation

### 4️⃣ Deploy API Service (3 min)

1. Click **"+ New"** → **"GitHub Repo"** → Select your repo
2. Name: **"API"**
3. Settings:
   - **Build Command:** `npm run build:api`
   - **Start Command:** `npm run start:api`
4. Variables:
```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your_secret_change_this
SUPER_ADMIN_ID=891846690
TELEGRAM_BOT_TOKEN=6680993256:AAH14MeHY8NWb9zlO9DF6rB1d8ASiXi6RKE
```
5. Settings → Networking → **Generate Domain**
6. Click **"Deploy"**

### 5️⃣ Deploy Bot Service (2 min)

1. Click **"+ New"** → **"GitHub Repo"**
2. Name: **"Bot"**
3. Settings:
   - **Build Command:** `npm run build:bot`
   - **Start Command:** `npm run start:bot`
4. Variables:
```env
NODE_ENV=production
BOT_PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}
TELEGRAM_BOT_TOKEN=6680993256:AAH14MeHY8NWb9zlO9DF6rB1d8ASiXi6RKE
API_URL=${{API.RAILWAY_PUBLIC_DOMAIN}}
```
5. Generate Domain
6. Deploy

### 6️⃣ Deploy Encoder Service (2 min)

1. Click **"+ New"** → **"GitHub Repo"**
2. Name: **"Encoder"**
3. Settings:
   - **Build Command:** `npm run build:encoder`
   - **Start Command:** `npm run start:encoder`
4. Variables:
```env
NODE_ENV=production
ENCODER_PORT=3002
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
```
5. Deploy

### 7️⃣ Deploy Web Service (2 min)

1. Click **"+ New"** → **"GitHub Repo"**
2. Name: **"Web"**
3. Settings:
   - **Root Directory:** `apps/web`
   - **Build Command:** `npm install && npm run build`
   - **Start Command:** `npx serve -s dist -p $PORT`
4. Variables:
```env
VITE_API_URL=${{API.RAILWAY_PUBLIC_DOMAIN}}/api
```
5. Generate Domain
6. Deploy

---

## ✅ VERIFY DEPLOYMENT

### Check Service Status
All services should show **"✅ Active"**

### Test Endpoints

```bash
# API
curl https://api-production-xxxx.up.railway.app/health

# Bot
curl https://bot-production-xxxx.up.railway.app/webhook/health

# Web
open https://web-production-xxxx.up.railway.app
```

---

## 🎊 DONE!

**Your app is LIVE in 15 minutes!** 🚀

**Access:**
- 🌐 **Web:** https://web-production-xxxx.up.railway.app
- 🤖 **Telegram:** Search for your bot and click "Open App"

---

## 🔧 OPTIONAL: Setup Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot6680993256:AAH14MeHY8NWb9zlO9DF6rB1d8ASiXi6RKE/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://bot-production-xxxx.up.railway.app/webhook/telegram"
  }'
```

---

## 💰 COST

**Free Tier:** $5 credit/month (enough for testing)  
**Pro Tier:** $20/month (recommended for production)

**Estimated:** ~$20-30/month for all services

---

## 📚 NEXT STEPS

1. ✅ Update environment variables with actual domains
2. ✅ Change JWT_SECRET to secure value
3. ✅ Test all features
4. ✅ Upload content
5. ✅ Share with users!

**Full Guide:** `RAILWAY_DEPLOYMENT_GUIDE.md`

---

**Congratulations! You're live on Railway!** 🎉
