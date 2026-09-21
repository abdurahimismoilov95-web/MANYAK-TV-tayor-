# 🚀 MANYAK TV v2 - Deployment Guide

Complete deployment guide for production environment.

## 📋 Prerequisites

- Docker & Docker Compose
- PostgreSQL (or use Docker)
- Redis (or use Docker)
- FFmpeg installed
- Domain name (for production)
- SSL certificate (Let's Encrypt recommended)

---

## 🐳 **Option 1: Docker Compose (Recommended)**

### 1. Clone Repository

```bash
git clone https://github.com/yourname/manyak-tv-v2
cd manyak-tv-v2
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env` with your values:

```env
DB_PASSWORD=your_secure_password
JWT_SECRET=your_jwt_secret
TELEGRAM_BOT_TOKEN=your_bot_token
WEB_APP_URL=https://your-domain.com
```

### 3. Build & Run

```bash
# Build all services
docker-compose build

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

### 4. Initialize Database

```bash
# Run migrations
docker-compose exec api npx prisma migrate deploy

# Seed database
docker-compose exec api npx prisma db seed
```

### 5. Access Services

- **Frontend:** http://localhost:80
- **API:** http://localhost:3000
- **Bot:** http://localhost:3001
- **Encoder:** http://localhost:3002

---

## ☁️ **Option 2: Railway Deployment**

### Step 1: Create Railway Project

1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub"
4. Connect your repository

### Step 2: Add Services

#### PostgreSQL Database

```bash
railway add postgresql
```

#### Redis

```bash
railway add redis
```

### Step 3: Deploy Each Service

#### API Service

```bash
cd apps/api
railway init
railway up
```

Environment variables:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
JWT_SECRET=your_secret
PORT=3000
```

#### Bot Service

```bash
cd apps/bot
railway init
railway up
```

Environment variables:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
TELEGRAM_BOT_TOKEN=your_token
WEB_APP_URL=https://your-domain.com
BOT_PORT=3001
```

#### Encoder Service

```bash
cd apps/encoder
railway init
railway up
```

Environment variables:
```
DATABASE_URL=${{Postgres.DATABASE_URL}}
REDIS_HOST=${{Redis.REDIS_HOST}}
REDIS_PORT=${{Redis.REDIS_PORT}}
ENCODER_PORT=3002
```

#### Web Frontend

```bash
cd apps/web
railway init
railway up
```

Environment variables:
```
VITE_API_URL=https://your-api-domain.railway.app/api
```

### Step 4: Configure Domains

1. Go to each service settings
2. Click "Generate Domain" or add custom domain
3. Update environment variables with new URLs

---

## 🌐 **Option 3: Manual VPS Deployment**

### Prerequisites

- Ubuntu 22.04 LTS
- Root/sudo access
- Domain pointing to server IP

### Step 1: Install Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Redis
sudo apt install -y redis-server

# Install FFmpeg
sudo apt install -y ffmpeg

# Install Nginx
sudo apt install -y nginx

# Install PM2
sudo npm install -g pm2
```

### Step 2: Setup PostgreSQL

```bash
sudo -u postgres psql

CREATE DATABASE manyak_tv;
CREATE USER manyak_user WITH ENCRYPTED PASSWORD 'your_password';
GRANT ALL PRIVILEGES ON DATABASE manyak_tv TO manyak_user;
\q
```

### Step 3: Clone & Setup Project

```bash
# Clone repository
git clone https://github.com/yourname/manyak-tv-v2 /var/www/manyak-tv
cd /var/www/manyak-tv

# Install dependencies
npm install

# Build all services
npm run build
```

### Step 4: Configure Environment

```bash
cp .env.example .env
nano .env
```

Update values:
```env
DATABASE_URL=postgresql://manyak_user:your_password@localhost:5432/manyak_tv
JWT_SECRET=your_jwt_secret
TELEGRAM_BOT_TOKEN=your_bot_token
WEB_APP_URL=https://your-domain.com
```

### Step 5: Run Database Migrations

```bash
cd packages/database
npx prisma migrate deploy
npx prisma db seed
```

### Step 6: Start Services with PM2

```bash
# API Service
cd /var/www/manyak-tv/apps/api
pm2 start dist/main.js --name manyak-api

# Bot Service
cd /var/www/manyak-tv/apps/bot
pm2 start dist/main.js --name manyak-bot

# Encoder Service
cd /var/www/manyak-tv/apps/encoder
pm2 start dist/main.js --name manyak-encoder

# Save PM2 config
pm2 save
pm2 startup
```

### Step 7: Configure Nginx

```bash
sudo nano /etc/nginx/sites-available/manyak-tv
```

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend
    location / {
        root /var/www/manyak-tv/apps/web/dist;
        try_files $uri $uri/ /index.html;
    }

    # API
    location /api/ {
        proxy_pass http://localhost:3000/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # Bot webhooks
    location /bot/ {
        proxy_pass http://localhost:3001/;
    }

    # Encoder
    location /encoder/ {
        proxy_pass http://localhost:3002/;
    }

    # HLS Streaming
    location /streams/ {
        alias /var/www/manyak-tv/uploads/;
        types {
            application/vnd.apple.mpegurl m3u8;
            video/mp2t ts;
        }
        add_header Cache-Control "max-age=3600";
        add_header Access-Control-Allow-Origin "*";
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/manyak-tv /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Step 8: SSL with Let's Encrypt

```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
sudo systemctl reload nginx
```

---

## 🔧 **Post-Deployment Tasks**

### 1. Set Telegram Bot Webhook

```bash
curl -X POST "https://api.telegram.org/bot<YOUR_BOT_TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://your-domain.com/bot/webhook/telegram"}'
```

### 2. Create Admin User

```bash
# Connect to database
psql $DATABASE_URL

INSERT INTO "Admin" (
  id, "telegramId", username, role, "isActive", "appointedAt"
) VALUES (
  gen_random_uuid(),
  'YOUR_TELEGRAM_ID',
  'your_username',
  'SUPER_ADMIN',
  true,
  NOW()
);
```

### 3. Upload Test Content

Use the admin panel or API to upload test videos.

---

## 📊 **Monitoring**

### Check Service Status

```bash
# Docker
docker-compose ps
docker-compose logs -f api

# PM2
pm2 status
pm2 logs manyak-api
```

### Health Checks

```bash
# API
curl http://localhost:3000/health

# Bot
curl http://localhost:3001/webhook/health

# Encoder
curl http://localhost:3002/encoder/health
```

---

## 🔄 **Updates & Maintenance**

### Update Code

```bash
git pull origin main
npm install
npm run build
docker-compose restart  # Docker
pm2 restart all         # PM2
```

### Database Migrations

```bash
cd packages/database
npx prisma migrate deploy
```

### Backup Database

```bash
# PostgreSQL
pg_dump -U manyak_user manyak_tv > backup_$(date +%Y%m%d).sql

# Restore
psql -U manyak_user manyak_tv < backup_20240101.sql
```

---

## 🐛 **Troubleshooting**

### Service Won't Start

```bash
# Check logs
docker-compose logs api
pm2 logs manyak-api

# Check ports
netstat -tulpn | grep -E '3000|3001|3002'
```

### Database Connection Issues

```bash
# Test connection
psql $DATABASE_URL

# Check Prisma
npx prisma studio
```

### FFmpeg Not Working

```bash
# Check FFmpeg
ffmpeg -version

# Test encoding
ffmpeg -i test.mp4 -c:v libx264 output.mp4
```

---

## 📞 **Support**

- 📧 Email: support@manyak.tv
- 💬 Telegram: @manyaktv_support
- 🐛 Issues: GitHub Issues

---

**Happy Deploying! 🚀**
