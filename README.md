# MANYAK TV v2 - Professional Streaming Platform

## 🎯 Project Overview

Complete rewrite with modern architecture, microservices, and clean code principles.

## 🏗️ Architecture

### Microservices:
- **API Service** (NestJS) - REST API, GraphQL
- **Bot Service** (NestJS) - Telegram bot integration
- **Encoder Service** (NestJS + FFmpeg) - Video encoding, HLS
- **Web App** (React + TypeScript) - User frontend
- **Admin Dashboard** (React + TypeScript) - Admin panel

### Tech Stack:

**Backend:**
- NestJS (TypeScript)
- PostgreSQL (Prisma ORM)
- Redis (caching)
- BullMQ (job queues)
- FFmpeg (video processing)
- JWT (authentication)

**Frontend:**
- React 19
- TypeScript
- Vite
- TanStack Query
- Zustand (state management)
- TailwindCSS

**Infrastructure:**
- Docker
- Railway (hosting)
- GitHub Actions (CI/CD)
- Nginx (reverse proxy, HLS)

## 📁 Project Structure

```
manyak-tv-v2/
├── apps/
│   ├── api/              # API microservice
│   ├── bot/              # Telegram bot microservice
│   ├── encoder/          # Video encoding service
│   ├── web/              # Frontend React app
│   └── admin/            # Admin dashboard
├── packages/
│   ├── shared/           # Shared types, utils
│   ├── database/         # Prisma schema
│   └── config/           # Configs
├── infrastructure/
│   ├── docker/
│   ├── nginx/
│   └── scripts/
└── docs/
```

## 🚀 Getting Started

### Prerequisites:
- Node.js >= 20.x
- PostgreSQL 15+
- Redis 7+
- FFmpeg 6+
- Docker (optional)

### Installation:

```bash
# Install dependencies
npm install

# Setup database
npm run db:migrate

# Start development
npm run dev
```

## 📦 Microservices

### API Service (Port 3000)
REST API + GraphQL for all business logic

### Bot Service (Port 3001)
Telegram bot webhook handler

### Encoder Service (Port 3002)
Video processing with FFmpeg, HLS encoding

### Web App (Port 5173)
React frontend for users

### Admin Dashboard (Port 5174)
React admin panel

## 🔐 Security

- JWT authentication
- HMAC webhook validation
- Rate limiting
- CORS protection
- XSS/CSRF protection
- Input validation (class-validator)

## 📊 Database

PostgreSQL with Prisma ORM:
- Type-safe queries
- Migrations
- Seeding

## 🎥 Video Streaming

- FFmpeg encoding
- HLS adaptive streaming
- Multiple quality levels (360p, 720p, 1080p)
- Nginx streaming server
- CDN ready

## 🧪 Testing

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

## 🚢 Deployment

```bash
# Build all services
npm run build

# Deploy to Railway
npm run deploy
```

## 📝 License

MIT

## 👨‍💻 Author

MANYAK TV Team
