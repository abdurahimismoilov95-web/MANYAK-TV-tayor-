# 🚀 MANYAK TV v2 - START HERE

## ✅ **PROJECT IS 100% COMPLETE!**

Welcome to MANYAK TV v2 - a professional video streaming platform with microservices architecture.

---

## 📋 **QUICK START GUIDE**

### **Option 1: Docker (Recommended - Easiest)**

```bash
# 1. Clone repository
git clone <your-repo-url>
cd manyak-tv-v2

# 2. Configure environment
cp .env.example .env
# Edit .env with your values

# 3. Start all services
docker-compose up -d

# 4. Access application
# Frontend: http://localhost:80
# API: http://localhost:3000
# Bot: http://localhost:3001
# Encoder: http://localhost:3002
```

### **Option 2: Manual (Development)**

```bash
# 1. Install dependencies
npm install

# 2. Setup database
cd packages/database
npx prisma generate
npx prisma migrate deploy
npx prisma db seed

# 3. Start services (4 terminals)

# Terminal 1: API
cd apps/api
npm install
cp .env.example .env
npm run start:dev

# Terminal 2: Bot
cd apps/bot
npm install
cp .env.example .env
npm run start:dev

# Terminal 3: Encoder
cd apps/encoder
npm install
cp .env.example .env
npm run start:dev

# Terminal 4: Frontend
cd apps/web
npm install
cp .env.example .env
npm run dev
```

---

## 📚 **DOCUMENTATION**

### **Essential Reads:**
1. 📖 **[README.md](./README.md)** - Main project documentation
2. 🚀 **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Complete deployment guide (Docker, Railway, VPS)
3. 🏗️ **[ARCHITECTURE.md](./ARCHITECTURE.md)** - System architecture
4. ✅ **[PROJECT_COMPLETE.md](./PROJECT_COMPLETE.md)** - Completion report & metrics

### **Service-Specific:**
- 🔌 **[API Documentation](./apps/api/README.md)** - Backend API
- 🤖 **[Bot Documentation](./apps/bot/README.md)** - Telegram bot
- 🎬 **[Encoder Documentation](./apps/encoder/README.md)** - Video processing

---

## 🏗️ **PROJECT STRUCTURE**

```
manyak-tv-v2/
├── apps/
│   ├── api/           ✅ NestJS Backend (Port 3000)
│   ├── bot/           ✅ Telegram Bot (Port 3001)
│   ├── encoder/       ✅ FFmpeg Service (Port 3002)
│   └── web/           ✅ React Frontend (Port 5173)
├── packages/
│   └── database/      ✅ Prisma + PostgreSQL
├── nginx/             ✅ Reverse Proxy Config
├── docker-compose.yml ✅ Docker Setup
└── DEPLOYMENT.md      ✅ Deploy Guide
```

---

## 🎯 **WHAT'S INCLUDED**

### ✅ **Backend (NestJS)**
- JWT + Telegram authentication
- User management with VIP system
- Content management (movies, series)
- Payment system with receipt verification
- Admin panel with statistics
- 40+ REST API endpoints
- PostgreSQL with Prisma ORM

### ✅ **Telegram Bot (Telegraf)**
- Bot commands (/start, /vip, /help)
- Web App button integration
- Phone verification system
- Broadcast messaging
- VIP subscription management

### ✅ **Video Encoder (FFmpeg)**
- HLS adaptive streaming
- Multiple qualities (1080p, 720p, 480p, 360p)
- Thumbnail generation
- Background job processing (Bull + Redis)
- Upload handling

### ✅ **Frontend (React)**
- Modern React + TypeScript + Vite
- Telegram WebApp integration
- HLS video player
- Search & browse
- Admin dashboard
- Tailwind CSS styling

### ✅ **Infrastructure**
- Docker containerization
- Nginx reverse proxy
- PostgreSQL database
- Redis for queues
- Complete deployment configs

---

## 🔧 **REQUIREMENTS**

### **Development:**
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- FFmpeg 5+

### **Production (Docker):**
- Docker & Docker Compose
- That's it! 🎉

---

## 🌐 **DEPLOYMENT OPTIONS**

### **1. Docker Compose** (Easiest)
```bash
docker-compose up -d
```
✅ **Best for:** Testing, single-server deployment

### **2. Railway** (Cloud)
```bash
railway up
```
✅ **Best for:** Production, auto-scaling

### **3. VPS Manual** (Full Control)
See [DEPLOYMENT.md](./DEPLOYMENT.md) for complete guide.
✅ **Best for:** Custom infrastructure

---

## 📊 **PROJECT STATS**

| Metric | Value |
|--------|-------|
| Total Files | 100+ |
| Lines of Code | ~8,000+ |
| Services | 4 |
| API Endpoints | 40+ |
| Database Models | 15+ |
| Git Commits | 14 |
| Documentation | 6 files |

---

## 🚀 **FIRST STEPS**

1. **Read** [README.md](./README.md) for project overview
2. **Choose** deployment method (Docker recommended)
3. **Configure** environment variables (.env)
4. **Deploy** using chosen method
5. **Access** application at configured URL
6. **Test** with Telegram bot

---

## 📞 **SUPPORT**

Need help?
- 📧 Email: support@manyak.tv
- 💬 Telegram: @manyaktv_support
- 🐛 Issues: GitHub Issues

---

## ✅ **VERIFICATION CHECKLIST**

Before deploying, verify:
- [ ] Node.js 18+ installed
- [ ] PostgreSQL running
- [ ] Redis running (for encoder)
- [ ] FFmpeg installed (for encoder)
- [ ] Environment variables configured
- [ ] Telegram bot token obtained
- [ ] Domain name ready (for production)

---

## 🎉 **YOU'RE READY!**

Everything is complete and production-ready. Choose your deployment method and get started!

**Recommended path:**
1. Start with Docker Compose for testing
2. Deploy to Railway for production
3. Configure domain and SSL
4. Set up Telegram bot webhook
5. Upload content and go live! 🚀

---

**Happy deploying! 🎬**

---

**Made with ❤️ by MANYAK TV Team**
