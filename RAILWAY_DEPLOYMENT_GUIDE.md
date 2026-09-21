# 🚂 MANYAK TV V2 - RAILWAY DEPLOYMENT GUIDE

**Complete step-by-step guide for deploying to Railway.app**

---

## 📋 PREREQUISITES

### 1. Railway Account
- Go to https://railway.app
- Sign up with GitHub
- Verify your email

### 2. GitHub Repository
- Push your V2 code to GitHub:
```bash
cd manyak-tv-v2
git init
git add .
git commit -m "V2 Complete - Ready for Railway"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/manyak-tv-v2.git
git push -u origin main
```

### 3. Railway CLI (Optional)
```bash
npm install -g @railway/cli
railway login
```

---

## 🚀 DEPLOYMENT STEPS

### STEP 1: Create New Railway Project

1. Go to https://railway.app/new
2. Click **"New Project"**
3. Select **"Deploy from GitHub repo"**
4. Choose your `manyak-tv-v2` repository
5. Name it: **"MANYAK TV V2"**

---

### STEP 2: Add PostgreSQL Database

1. In your project, click **"+ New"**
2. Select **"Database"** → **"PostgreSQL"**
3. Railway will create a database and set `DATABASE_URL` automatically
4. **Copy the database URL** for later use

---

### STEP 3: Add Redis

1. Click **"+ New"** again
2. Select **"Database"** → **"Redis"**
3. Railway will set `REDIS_URL` automatically

---

### STEP 4: Create API Service

#### 4.1 Add Service
1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Name it: **"API Service"**

#### 4.2 Configure Build
1. Go to **Settings** tab
2. **Root Directory:** Leave empty
3. **Build Command:**
```bash
cd packages/database && npx prisma generate && cd ../../apps/api && npm install && npm run build
```

4. **Start Command:**
```bash
cd apps/api && npx prisma migrate deploy && npm run start:prod
```

5. **Watch Paths:** 
```
apps/api/**
packages/database/**
```

#### 4.3 Environment Variables
Click **"Variables"** tab and add:

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_URL=${{Redis.REDIS_URL}}

# JWT & Security
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production_12345

# Admin
SUPER_ADMIN_ID=891846690
ADMIN_IDS=891846690

# Telegram
TELEGRAM_BOT_TOKEN=6680993256:AAH14MeHY8NWb9zlO9DF6rB1d8ASiXi6RKE

# URLs (will update after deployment)
WEB_APP_URL=${{Web.RAILWAY_PUBLIC_DOMAIN}}
API_URL=${{API.RAILWAY_PUBLIC_DOMAIN}}
```

#### 4.4 Networking
1. Go to **Settings** → **Networking**
2. Click **"Generate Domain"**
3. Copy the URL (e.g., `api-production-xxxx.up.railway.app`)

---

### STEP 5: Create Bot Service

#### 5.1 Add Service
1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Name it: **"Bot Service"**

#### 5.2 Configure Build
1. **Root Directory:** Leave empty
2. **Build Command:**
```bash
cd packages/database && npx prisma generate && cd ../../apps/bot && npm install && npm run build
```

3. **Start Command:**
```bash
cd apps/bot && npm run start:prod
```

4. **Watch Paths:**
```
apps/bot/**
packages/database/**
```

#### 5.3 Environment Variables
```env
NODE_ENV=production
BOT_PORT=3001
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Telegram
TELEGRAM_BOT_TOKEN=6680993256:AAH14MeHY8NWb9zlO9DF6rB1d8ASiXi6RKE
WEB_APP_URL=${{Web.RAILWAY_PUBLIC_DOMAIN}}
API_URL=${{API.RAILWAY_PUBLIC_DOMAIN}}

# Webhook (update after getting domain)
WEBHOOK_URL=${{Bot.RAILWAY_PUBLIC_DOMAIN}}/webhook/telegram
```

#### 5.4 Networking
1. Generate Domain
2. Copy URL for webhook setup

---

### STEP 6: Create Encoder Service

#### 6.1 Add Service
1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Name it: **"Encoder Service"**

#### 6.2 Configure Build
1. **Root Directory:** Leave empty
2. **Build Command:**
```bash
cd packages/database && npx prisma generate && cd ../../apps/encoder && npm install && npm run build
```

3. **Start Command:**
```bash
cd apps/encoder && npm run start:prod
```

4. **Watch Paths:**
```
apps/encoder/**
packages/database/**
```

#### 6.3 Environment Variables
```env
NODE_ENV=production
ENCODER_PORT=3002
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
```

#### 6.4 Add FFmpeg
1. Go to **Settings** → **Nixpacks**
2. Add **nixpacks.toml** in project root:

```toml
[phases.setup]
nixPkgs = ["ffmpeg"]
```

---

### STEP 7: Create Web Service

#### 7.1 Add Service
1. Click **"+ New"** → **"GitHub Repo"**
2. Select your repository
3. Name it: **"Web Frontend"**

#### 7.2 Configure Build
1. **Root Directory:** `apps/web`
2. **Build Command:**
```bash
npm install && npm run build
```

3. **Start Command:**
```bash
npx serve -s dist -p $PORT
```

4. **Watch Paths:**
```
apps/web/**
```

#### 7.3 Environment Variables
```env
NODE_ENV=production
VITE_API_URL=${{API.RAILWAY_PUBLIC_DOMAIN}}/api
```

#### 7.4 Networking
1. Generate Domain
2. This will be your main URL!

---

### STEP 8: Update Cross-Service URLs

After all services are deployed, update environment variables with actual domains:

#### API Service
```env
WEB_APP_URL=https://web-production-xxxx.up.railway.app
```

#### Bot Service
```env
WEB_APP_URL=https://web-production-xxxx.up.railway.app
API_URL=https://api-production-xxxx.up.railway.app
WEBHOOK_URL=https://bot-production-xxxx.up.railway.app/webhook/telegram
```

#### Web Service
```env
VITE_API_URL=https://api-production-xxxx.up.railway.app/api
```

---

### STEP 9: Setup Telegram Webhook

```bash
curl -X POST "https://api.telegram.org/bot6680993256:AAH14MeHY8NWb9zlO9DF6rB1d8ASiXi6RKE/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://bot-production-xxxx.up.railway.app/webhook/telegram",
    "allowed_updates": ["message", "callback_query", "inline_query"]
  }'
```

**Or using the Bot:**
```bash
# In your bot service logs, you'll see the webhook setup automatically
```

---

### STEP 10: Run Database Migrations

Railway will run migrations automatically on first deploy via the start command:
```bash
npx prisma migrate deploy
```

If you need to run manually:
1. Go to API Service
2. Click **"Deploy"** → **"New Deployment"**
3. Or connect via Railway CLI:
```bash
railway run npx prisma migrate deploy
```

---

## 📊 RAILWAY PROJECT STRUCTURE

Your Railway project should look like this:

```
MANYAK TV V2
├── PostgreSQL Database
├── Redis Database
├── API Service (Port 3000)
├── Bot Service (Port 3001)
├── Encoder Service (Port 3002)
└── Web Service (Port 80/443)
```

---

## 🔒 SECURITY CHECKLIST

Before going live:

### 1. Change Secrets
```env
JWT_SECRET=generate_new_64_char_random_string
DATABASE_URL=check_postgresql_password
```

### 2. Update Admin IDs
```env
SUPER_ADMIN_ID=your_real_telegram_id
ADMIN_IDS=id1,id2,id3
```

### 3. Enable CORS Whitelist (API)
In `apps/api/src/main.ts`:
```typescript
app.enableCors({
  origin: [
    'https://your-web-domain.up.railway.app',
    'https://t.me'
  ]
});
```

### 4. Rate Limiting
Already configured in API service (10 requests/minute)

---

## 💰 RAILWAY PRICING

### Free Tier
- $5 credit per month
- ~500 hours of service time
- Good for testing

### Pro Tier ($20/month)
- Unlimited service time
- Better performance
- Custom domains
- Priority support

**Estimated Cost for V2:**
- 4 services running 24/7
- PostgreSQL database
- Redis cache
- **~$20-30/month**

---

## 🛠️ ALTERNATIVE: SINGLE SERVICE DEPLOYMENT

If you want to save costs, deploy as a single service:

### Option A: Monorepo Service

**Build Command:**
```bash
npm install && \
cd packages/database && npx prisma generate && cd ../.. && \
cd apps/api && npm run build && cd ../.. && \
cd apps/bot && npm run build && cd ../.. && \
cd apps/encoder && npm run build && cd ../.. && \
cd apps/web && npm run build
```

**Start Command:**
```bash
concurrently \
  "cd apps/api && npm run start:prod" \
  "cd apps/bot && npm run start:prod" \
  "cd apps/encoder && npm run start:prod" \
  "cd apps/web && npx serve -s dist -p 5173"
```

**Cost:** ~$5-10/month (1 service)

---

## 📱 POST-DEPLOYMENT TASKS

### 1. Test Each Service

```bash
# API Health
curl https://api-production-xxxx.up.railway.app/health

# Bot Health  
curl https://bot-production-xxxx.up.railway.app/webhook/health

# Encoder Health
curl https://encoder-production-xxxx.up.railway.app/health

# Web
open https://web-production-xxxx.up.railway.app
```

### 2. Upload Test Content

1. Open Web app
2. Login with your Telegram ID
3. Go to Admin Panel
4. Upload a test video
5. Verify playback

### 3. Test Telegram Bot

1. Open Telegram
2. Search for your bot
3. Send `/start`
4. Click **"Open App"** button
5. Test navigation

### 4. Monitor Logs

```bash
# Railway Dashboard
# Click each service → View Logs

# Or use Railway CLI
railway logs api
railway logs bot
railway logs encoder
railway logs web
```

---

## 🐛 TROUBLESHOOTING

### Issue 1: Build Fails

**Error:** `npm ERR! missing script: build`

**Fix:** Check `package.json` has build script:
```json
{
  "scripts": {
    "build": "nest build"
  }
}
```

### Issue 2: Database Connection Failed

**Error:** `P1001: Can't reach database server`

**Fix:** 
1. Check `DATABASE_URL` is set correctly
2. Use Railway's provided `${{Postgres.DATABASE_URL}}`
3. Verify database is running

### Issue 3: Telegram Webhook Not Working

**Error:** Bot not responding

**Fix:**
```bash
# Check webhook status
curl https://api.telegram.org/bot<TOKEN>/getWebhookInfo

# Reset webhook
curl -X POST https://api.telegram.org/bot<TOKEN>/setWebhook \
  -d "url=https://bot-production-xxxx.up.railway.app/webhook/telegram"
```

### Issue 4: CORS Error in Web

**Error:** `Access-Control-Allow-Origin`

**Fix:** Add Web domain to API CORS whitelist

### Issue 5: Out of Memory

**Error:** `JavaScript heap out of memory`

**Fix:** 
1. Go to Service Settings
2. Increase memory limit (if Pro plan)
3. Or optimize build process

---

## 📊 MONITORING & MAINTENANCE

### Railway Dashboard Metrics
- CPU usage
- Memory usage
- Network traffic
- Build times
- Deployment history

### Recommended Tools
1. **Sentry** - Error tracking
2. **LogTail** - Log aggregation
3. **UptimeRobot** - Uptime monitoring
4. **Google Analytics** - User analytics

### Backup Strategy
```bash
# Automated Railway backups (Pro plan)
# Or manual backups:
railway run pg_dump $DATABASE_URL > backup.sql
```

---

## 🚀 CUSTOM DOMAIN SETUP

### 1. Buy Domain (Namecheap, GoDaddy, etc.)

### 2. Add to Railway
1. Go to Web Service → Settings → Domains
2. Click "Add Custom Domain"
3. Enter: `manyak.tv`

### 3. Configure DNS
Add CNAME record:
```
Type: CNAME
Name: www (or @)
Value: <your-railway-domain>.up.railway.app
```

### 4. SSL Certificate
Railway automatically provisions SSL via Let's Encrypt

---

## 📚 USEFUL COMMANDS

```bash
# Railway CLI
railway login
railway link
railway status
railway logs
railway run <command>
railway open

# Check service health
curl https://<service>.up.railway.app/health

# Database commands
railway run npx prisma studio
railway run npx prisma migrate deploy
railway run npx prisma db push

# Restart services
railway restart api
railway restart bot
```

---

## 🎯 SUCCESS CHECKLIST

- [ ] All 4 services deployed to Railway
- [ ] PostgreSQL database created and migrated
- [ ] Redis cache configured
- [ ] Environment variables set correctly
- [ ] Domains generated for all services
- [ ] Cross-service URLs updated
- [ ] Telegram webhook configured
- [ ] API health check passes
- [ ] Bot responds to /start
- [ ] Web app loads successfully
- [ ] Video upload works
- [ ] Video playback works
- [ ] Logs are clean (no errors)
- [ ] Secrets changed from defaults
- [ ] Custom domain configured (optional)
- [ ] Monitoring setup (optional)

---

## 💡 PRO TIPS

1. **Use Railway Templates**
   - Create a template from your project
   - Share with team members
   - One-click deployments

2. **Environment Groups**
   - Create staging & production groups
   - Separate databases for each
   - Test before production deploy

3. **GitHub Auto-Deploy**
   - Push to `main` = auto-deploy
   - Use branches for development
   - Railway watches for changes

4. **Resource Optimization**
   - Start with 1GB memory per service
   - Monitor usage in Railway dashboard
   - Increase only if needed

5. **Cost Savings**
   - Use free tier for testing
   - Upgrade to Pro only when live
   - Consider monorepo deployment for lower costs

---

## 🆘 SUPPORT

### Railway Support
- Discord: https://discord.gg/railway
- Docs: https://docs.railway.app
- Status: https://status.railway.app

### V2 Documentation
- Setup Guide: `V2_COMPLETE_SETUP_GUIDE.md`
- Status Report: `V2_100_PERCENT_COMPLETE.md`
- Architecture: `ARCHITECTURE.md`

---

## 🎊 DEPLOYMENT COMPLETE!

Once all services show **"✅ Active"** in Railway:

**Your app is LIVE!** 🚀

Access at:
- 🌐 Web: `https://web-production-xxxx.up.railway.app`
- 🔌 API: `https://api-production-xxxx.up.railway.app`
- 🤖 Bot: Available in Telegram

**Share with users!** 📱

---

**Next:** Monitor logs, test thoroughly, and enjoy your production deployment! 🎉
