# 🎬 MANYAK TV v2 - Complete Rewrite

Professional video streaming platform built with modern microservices architecture.

## 🚀 **Features**

### ✅ **Backend (NestJS)**
- 🔐 JWT + Telegram WebApp Authentication
- 👥 User Management (VIP, Admins)
- 🎬 Content Management (Movies, Series, Episodes)
- 💳 Payment System (Receipt verification)
- 📊 Admin Dashboard
- 🔍 Full-text Search
- 📈 Analytics & Statistics

### ✅ **Telegram Bot (Telegraf)**
- 🤖 Full Bot Integration
- 📱 Web App Button
- 💎 VIP Subscription System
- 📞 Phone Verification
- 📢 Broadcast Messages
- 🎯 Interactive Commands

### ✅ **Video Encoder (FFmpeg)**
- 🎞️ HLS Adaptive Streaming
- 📹 Multiple Quality Levels (1080p, 720p, 480p, 360p)
- 🖼️ Thumbnail Generation
- ⚡ Background Job Processing (Bull Queue)
- 📊 Encoding Progress Tracking
- 🎬 Preview Clips

### ✅ **Frontend (React)**
- ⚛️ Modern React + TypeScript
- 🎨 Tailwind CSS
- 📱 Telegram WebApp Integration
- 🎥 HLS Video Player
- 🔍 Search & Filters
- 💎 VIP Features
- 🎭 Admin Panel

## 📦 **Tech Stack**

| Component | Technology |
|-----------|------------|
| Backend | NestJS, TypeScript |
| Database | PostgreSQL + Prisma ORM |
| Bot | Telegraf (Telegram) |
| Queue | Bull + Redis |
| Video | FFmpeg + HLS |
| Frontend | React + Vite |
| Styling | Tailwind CSS |
| State | Zustand |
| Deployment | Docker, Nginx, Railway |

## 🏗️ **Architecture**

```
manyak-tv-v2/
├── apps/
│   ├── api/           # NestJS Backend (Port 3000)
│   ├── bot/           # Telegram Bot (Port 3001)
│   ├── encoder/       # FFmpeg Service (Port 3002)
│   └── web/           # React Frontend (Port 5173)
├── packages/
│   └── database/      # Prisma Schema & Migrations
├── nginx/             # Nginx Configuration
├── docker-compose.yml # Docker Setup
└── DEPLOYMENT.md      # Deployment Guide
```

## 🚀 **Quick Start**

### Prerequisites

- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- FFmpeg 5+
- Docker (optional)

### 1. Clone Repository

```bash
git clone https://github.com/yourname/manyak-tv-v2
cd manyak-tv-v2
```

### 2. Install Dependencies

```bash
# Install all packages
npm install

# Or install individually
cd apps/api && npm install
cd apps/bot && npm install
cd apps/encoder && npm install
cd apps/web && npm install
```

### 3. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/manyak_tv

# JWT
JWT_SECRET=your_secret_key

# Telegram
TELEGRAM_BOT_TOKEN=your_bot_token
WEB_APP_URL=http://localhost:5173

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 4. Setup Database

```bash
cd packages/database

# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate deploy

# Seed database
npx prisma db seed
```

### 5. Start Services

**Option A: Separate Terminals**

```bash
# Terminal 1: API
cd apps/api
npm run start:dev

# Terminal 2: Bot
cd apps/bot
npm run start:dev

# Terminal 3: Encoder
cd apps/encoder
npm run start:dev

# Terminal 4: Frontend
cd apps/web
npm run dev
```

**Option B: Docker Compose**

```bash
docker-compose up -d
```

### 6. Access Application

- 🌐 **Frontend:** http://localhost:5173
- 🔌 **API:** http://localhost:3000/api
- 🤖 **Bot:** http://localhost:3001
- 🎬 **Encoder:** http://localhost:3002
- 📊 **API Docs:** http://localhost:3000/api/docs

## 📖 **Documentation**

- [API Documentation](./apps/api/README.md)
- [Bot Documentation](./apps/bot/README.md)
- [Encoder Documentation](./apps/encoder/README.md)
- [Deployment Guide](./DEPLOYMENT.md)
- [Architecture Guide](./ARCHITECTURE.md)

## 🔑 **Environment Variables**

### API Service

```env
DATABASE_URL=postgresql://...
JWT_SECRET=your_secret
PORT=3000
```

### Bot Service

```env
DATABASE_URL=postgresql://...
TELEGRAM_BOT_TOKEN=your_token
WEB_APP_URL=https://your-domain.com
BOT_PORT=3001
```

### Encoder Service

```env
DATABASE_URL=postgresql://...
REDIS_HOST=localhost
REDIS_PORT=6379
ENCODER_PORT=3002
```

### Frontend

```env
VITE_API_URL=http://localhost:3000/api
```

## 🐳 **Docker Deployment**

```bash
# Build all services
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## 📊 **Database Schema**

15+ models including:

- User
- Content (Movies/Series)
- Episode
- Category
- Payment
- Subscription Plans
- Watch History
- Favorites
- Admin
- Audit Logs
- Promo Codes
- Broadcast Logs
- Verification

## 🎯 **Key Features**

### Authentication
- ✅ JWT tokens
- ✅ Telegram WebApp validation
- ✅ HMAC signature verification
- ✅ Role-based access control

### Content Management
- ✅ Movies & Series
- ✅ Episodes & Seasons
- ✅ Categories & Tags
- ✅ Search & Filters
- ✅ Featured content

### Video Processing
- ✅ HLS adaptive streaming
- ✅ Multi-quality encoding
- ✅ Thumbnail generation
- ✅ Preview clips
- ✅ Progress tracking

### Payment System
- ✅ Receipt upload
- ✅ Admin approval
- ✅ VIP plans
- ✅ Promo codes
- ✅ Revenue tracking

### Bot Features
- ✅ /start, /vip, /help commands
- ✅ Web App button
- ✅ Phone verification
- ✅ Broadcast messages
- ✅ User management

## 🧪 **Testing**

```bash
# Run tests
npm test

# API tests
cd apps/api && npm test

# Coverage
npm run test:cov
```

## 📈 **Performance**

- ⚡ HLS adaptive streaming
- 🚀 Redis caching
- 📊 Bull queue for background jobs
- 🎯 Optimized database queries
- 🔄 Lazy loading & pagination

## 🔐 **Security**

- 🔒 JWT authentication
- 🛡️ HMAC validation
- 🔑 Password hashing
- 🚫 Rate limiting
- ✅ Input validation
- 🔐 CORS protection

## 🤝 **Contributing**

Contributions welcome! Please read our [Contributing Guide](./CONTRIBUTING.md).

## 📄 **License**

MIT License - see [LICENSE](./LICENSE)

## 📞 **Support**

- 📧 Email: support@manyak.tv
- 💬 Telegram: @manyaktv_support
- 🐛 Issues: [GitHub Issues](https://github.com/yourname/manyak-tv-v2/issues)

## 🎉 **Acknowledgments**

Built with ❤️ using:
- NestJS
- React
- Prisma
- FFmpeg
- Telegraf
- And many more amazing open-source projects

---

**Made with ❤️ by MANYAK TV Team**
