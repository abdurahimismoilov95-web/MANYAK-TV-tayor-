# ⚖️ Load Balancer Setup - MANYAK TV Production

## 🎯 Maqsad: Yuqori Traffic va Barqarorlikni Ta'minlash

**Load Balancing qanday ishlaydi:**
- ✅ Bir nechta server instance ishlatadi
- ✅ Traffic'ni barcha instance'lar o'rtasida taqsimlaydi
- ✅ Bitta instance crash bo'lsa, boshqalari ishlashda davom etadi
- ✅ Zero-downtime deployment
- ✅ Horizontal scaling (CPU yadrolari soniga qarab)

---

## 🏗️ Arxitektura

```
                    Internet
                       ↓
              ┌────────────────┐
              │  Nginx (Port   │
              │  80/443)       │ ← Reverse Proxy + Load Balancer
              └────────────────┘
                       ↓
         ┌─────────────┼─────────────┐
         ↓             ↓             ↓
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ Node.js │  │ Node.js │  │ Node.js │
    │ :3000   │  │ :3001   │  │ :3002   │
    └─────────┘  └─────────┘  └─────────┘
         ↓             ↓             ↓
         └─────────────┼─────────────┘
                       ↓
              ┌────────────────┐
              │  SQLite DB     │
              └────────────────┘
```

---

## 📦 Yara tilgan Fayllar

### 1. `ecosystem.config.js` - PM2 Cluster Configuration
- PM2 cluster mode sozlamalari
- Auto-restart va error handling
- Memory limits va logging

### 2. `nginx-loadbalancer.conf` - Nginx Load Balancer
- Upstream backend servers
- SSL/HTTPS configuration
- Rate limiting va security headers
- Static file serving va caching

### 3. `start-multi-instance.sh` - Quick Start Script
- Bir nechta instance'ni ishga tushiradi
- Build va deployment automation

### 4. Health Check Endpoints (server.js)
- `/health` - Detailed health check
- `/api/health` - Simple OK response

---

## 🚀 O'rnatish va Ishga Tushirish

### Method 1: PM2 Cluster Mode (Recommended)

```bash
# 1. PM2 o'rnatish (global)
npm install -g pm2

# 2. Dependencies o'rnatish
npm install

# 3. Frontend build
npm run build

# 4. PM2 cluster mode bilan ishga tushirish
pm2 start ecosystem.config.js --env production

# 5. PM2 statusni ko'rish
pm2 status

# 6. Monitoring
pm2 monit

# 7. Logs
pm2 logs

# 8. Auto-startup (server reboot bo'lsa)
pm2 startup
pm2 save
```

**Natija:**
```
┌─────┬───────────────────────┬─────┬────────┬──────────┐
│ id  │ name                  │ mode│ status │ cpu      │
├─────┼───────────────────────┼─────┼────────┼──────────┤
│ 0   │ manyak-tv-production  │ cluster │ online │ 25%      │
│ 1   │ manyak-tv-production  │ cluster │ online │ 23%      │
│ 2   │ manyak-tv-production  │ cluster │ online │ 28%      │
│ 3   │ manyak-tv-production  │ cluster │ online │ 24%      │
└─────┴───────────────────────┴─────┴────────┴──────────┘
```

---

### Method 2: Manual Multi-Instance

```bash
# Start script'ga execute permission bering
chmod +x start-multi-instance.sh

# Ishga tushiring
./start-multi-instance.sh
```

**Natija:**
- Port 3000: Node.js instance 1
- Port 3001: Node.js instance 2
- Port 3002: Node.js instance 3
- Port 3003: Node.js instance 4

---

### Method 3: Nginx + PM2 (Production Setup)

#### Step 1: PM2 Cluster Mode

```bash
pm2 start ecosystem.config.js --env production
pm2 save
pm2 startup
```

#### Step 2: Nginx O'rnatish

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install nginx

# Start nginx
sudo systemctl start nginx
sudo systemctl enable nginx
```

#### Step 3: Nginx Configuration

```bash
# Configuration faylini ko'chirish
sudo cp nginx-loadbalancer.conf /etc/nginx/sites-available/manyak-tv

# Symlink yaratish
sudo ln -s /etc/nginx/sites-available/manyak-tv /etc/nginx/sites-enabled/

# Default config o'chirish (opsional)
sudo rm /etc/nginx/sites-enabled/default

# Configuration test
sudo nginx -t

# Nginx restart
sudo systemctl restart nginx
```

#### Step 4: SSL Certificate (Let's Encrypt)

```bash
# Certbot o'rnatish
sudo apt install certbot python3-certbot-nginx

# SSL certificate olish
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Auto-renewal test
sudo certbot renew --dry-run
```

---

## 🔧 Configuration Sozlamalar

### PM2 Cluster Mode Settings

```javascript
// ecosystem.config.js
{
  instances: 'max',      // CPU yadrolari soni (4 core = 4 instance)
  exec_mode: 'cluster',  // Cluster mode
  max_memory_restart: '1G', // 1GB dan oshsa restart
}
```

**Custom instances:**
```bash
# 2 ta instance
pm2 start ecosystem.config.js --env production -i 2

# 4 ta instance
pm2 start ecosystem.config.js --env production -i 4
```

---

### Nginx Upstream Settings

```nginx
upstream manyak_tv_backend {
    least_conn;  // Eng kam yuklangan serverga yo'naltiradi
    
    // Alternativalar:
    // - (default) round_robin: Navbat bilan
    // - ip_hash: Sticky sessions (har user bir serverga)
    // - least_time: Eng tez javob beradigan serverga
    
    server 127.0.0.1:3000 weight=1;
    server 127.0.0.1:3001 weight=1;
    server 127.0.0.1:3002 weight=1;
    server 127.0.0.1:3003 weight=1;
}
```

---

## 📊 Monitoring va Debugging

### PM2 Commands

```bash
# Status
pm2 status

# Real-time monitoring
pm2 monit

# Logs (barcha instances)
pm2 logs

# Specific instance logs
pm2 logs 0

# Flush logs
pm2 flush

# CPU va memory profiling
pm2 plus  # PM2 Plus registration kerak
```

### Health Check

```bash
# Simple check
curl http://localhost:3000/api/health

# Detailed check
curl http://localhost:3000/health

# Response example:
{
  "status": "healthy",
  "timestamp": "2026-09-11T12:00:00.000Z",
  "uptime": "5h 23m",
  "uptimeSeconds": 19380,
  "memory": {
    "rss": 245,
    "heapTotal": 180,
    "heapUsed": 145,
    "external": 12
  },
  "database": "connected",
  "pid": 12345,
  "nodeVersion": "v20.11.0",
  "port": 3000
}
```

### Nginx Logs

```bash
# Access log
sudo tail -f /var/log/nginx/manyak-tv-access.log

# Error log
sudo tail -f /var/log/nginx/manyak-tv-error.log

# Real-time monitoring with goaccess (opsional)
sudo apt install goaccess
sudo goaccess /var/log/nginx/manyak-tv-access.log -o report.html --log-format=COMBINED
```

---

## 🔄 Deployment (Zero-Downtime)

### PM2 Reload (Recommended)

```bash
# 1. Git pull
git pull origin main

# 2. Dependencies update
npm install

# 3. Frontend build
npm run build

# 4. Zero-downtime reload
pm2 reload ecosystem.config.js --env production

# Or reload all apps
pm2 reload all
```

**Qanday ishlaydi:**
1. PM2 birinchi instance'ni yangi kod bilan restart qiladi
2. Restart tugaguncha boshqa instance'lar trafficni handle qiladi
3. Birinchi instance tayyor bo'lgandan keyin, ikkinchisi restart qilinadi
4. Jarayon tugaguncha davom etadi

**Natija:** ✅ Zero downtime! Users hech qanday uzilish sezm aydi.

---

### Blue-Green Deployment (Advanced)

```bash
# "Blue" environment (hozirgi)
pm2 start ecosystem.config.js --env production --name manyak-tv-blue

# "Green" environment (yangi version)
pm2 start ecosystem.config.js --env production --name manyak-tv-green --watch

# Test "Green"
curl http://localhost:3001/health

# Switch traffic (Nginx config)
# upstream'ni "green" ga o'zgartiring va reload
sudo nginx -s reload

# Eski "Blue" ni to'xtatish
pm2 stop manyak-tv-blue
pm2 delete manyak-tv-blue
```

---

## 🛡️ Security Best Practices

### 1. Rate Limiting (Nginx)

```nginx
limit_req_zone $binary_remote_addr zone=api_limit:10m rate=10r/s;
limit_req zone=api_limit burst=20 nodelay;
```

**Ta'sir:**
- ❌ Har user sekundiga 10 ta request (burst 20)
- ❌ DDoS attack'dan himoya

---

### 2. SSL/HTTPS (Mandatory)

```bash
# Let's Encrypt (free)
sudo certbot --nginx -d your-domain.com
```

**Ta'sir:**
- ✅ HTTPS encryption
- ✅ A+ SSL rating
- ✅ Telegram Web App compatible

---

### 3. Firewall (UFW)

```bash
# Ubuntu
sudo ufw allow 22/tcp     # SSH
sudo ufw allow 80/tcp     # HTTP
sudo ufw allow 443/tcp    # HTTPS
sudo ufw enable

# Port 3000-3003 tashqaridan yopiq (faqat localhost)
```

---

### 4. Process Limits

```javascript
// ecosystem.config.js
max_memory_restart: '1G',  // Memory leak protection
max_restarts: 10,          // Crash loop prevention
```

---

## 📈 Performance Tuning

### 1. Nginx Worker Processes

```nginx
# nginx.conf
worker_processes auto;  # CPU yadrolari soni
worker_connections 1024;
```

### 2. PM2 Instances

```bash
# CPU yadrolari soni
nproc

# 4 core = 4 instances (optimal)
pm2 start ecosystem.config.js -i 4
```

### 3. Node.js Heap Memory

```javascript
// ecosystem.config.js
node_args: '--max-old-space-size=2048'  // 2GB
```

### 4. Keep-Alive Connections

```nginx
# nginx.conf
keepalive_timeout 65;
keepalive_requests 100;
```

---

## 🧪 Load Testing

```bash
# Apache Bench (ab)
ab -n 10000 -c 100 https://your-domain.com/api/health

# wrk (advanced)
wrk -t4 -c100 -d30s --latency https://your-domain.com/

# Artillery (scenario-based)
npm install -g artillery
artillery quick --count 100 --num 10 https://your-domain.com/
```

**Ideal natijalar:**
- ✅ 10,000+ requests/second
- ✅ <50ms latency (average)
- ✅ 0% error rate

---

## 🎉 Natija

**LOAD BALANCER TAYYOR!** ✅

### PM2 Cluster Mode:
- ✅ 4 ta instance (CPU cores)
- ✅ Auto-restart on crash
- ✅ Zero-downtime reload
- ✅ Memory leak protection
- ✅ Detailed monitoring

### Nginx Load Balancer:
- ✅ SSL/HTTPS
- ✅ Rate limiting
- ✅ Static file caching
- ✅ Gzip compression
- ✅ Security headers

### Health Checks:
- ✅ `/health` - Detailed
- ✅ `/api/health` - Simple
- ✅ Database connectivity check

**Production-ready Load Balanced System!** ⚖️🚀

---

## 📚 Qo'shimcha Resurslar

- PM2 Docs: https://pm2.keymetrics.io/docs/usage/cluster-mode/
- Nginx Docs: https://nginx.org/en/docs/http/load_balancing.html
- Let's Encrypt: https://letsencrypt.org/getting-started/

---

Muallif: Kiro AI + SOIL1007  
Versiya: 1.0.14 - Load Balancer  
Sana: 2026-09-11  
Status: ✅ **LOAD BALANCER CONFIGURED**
