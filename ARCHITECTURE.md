# MANYAK TV v2 - System Architecture

## 🎯 Overview

This document describes the complete system architecture, design decisions, and implementation details.

---

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENT LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  Telegram Web App  │  Admin Dashboard  │  Mobile App (Future)  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      NGINX (Reverse Proxy)                       │
│                    SSL, Load Balancing, HLS                      │
└─────────────────────────────────────────────────────────────────┘
                              │
        ┌─────────────────────┼─────────────────────┐
        ▼                     ▼                     ▼
┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ API Service  │    │ Bot Service  │    │   Encoder    │
│  (NestJS)    │    │  (NestJS)    │    │   Service    │
│  Port 3000   │    │  Port 3001   │    │  Port 3002   │
└──────────────┘    └──────────────┘    └──────────────┘
        │                     │                     │
        └─────────────────────┼─────────────────────┘
                              ▼
        ┌─────────────────────────────────────────┐
        │         SHARED INFRASTRUCTURE           │
        ├─────────────────────────────────────────┤
        │  PostgreSQL  │  Redis  │  BullMQ       │
        └─────────────────────────────────────────┘
```

---

## 📦 Microservices

### 1. API Service (Port 3000)

**Responsibilities:**
- User authentication & authorization
- Content management (CRUD)
- Payment processing
- Admin operations
- User profiles & subscriptions

**Tech Stack:**
- NestJS with TypeScript
- Prisma ORM
- JWT authentication
- Class-validator for validation
- Swagger/OpenAPI docs

**Modules:**
```
api/
├── src/
│   ├── auth/           # Authentication & JWT
│   ├── users/          # User management
│   ├── content/        # Movies, series, episodes
│   ├── payments/       # Payments, receipts
│   ├── admin/          # Admin operations
│   ├── subscriptions/  # VIP plans
│   ├── promo-codes/    # Promo codes
│   └── common/         # Guards, decorators, pipes
```

**Endpoints:**
- `POST /auth/login` - User authentication
- `GET /users/me` - Current user profile
- `GET /content` - List content
- `POST /content` - Create content (admin)
- `POST /payments/verify` - Verify payment receipt

---

### 2. Bot Service (Port 3001)

**Responsibilities:**
- Telegram webhook handling
- User verification
- Payment notifications
- Broadcast messages
- Deep linking

**Tech Stack:**
- NestJS with TypeScript
- Telegram Bot API
- BullMQ for async jobs
- Redis for session storage

**Modules:**
```
bot/
├── src/
│   ├── webhook/        # Telegram webhooks
│   ├── commands/       # Bot commands (/start, /help)
│   ├── callbacks/      # Inline button handlers
│   ├── verification/   # Phone verification
│   ├── payments/       # Payment notifications
│   └── broadcast/      # Mass messaging
```

**Bot Commands:**
- `/start` - Welcome & deep link handling
- `/verify` - Phone verification
- `/vip` - VIP subscription info
- `/help` - Help menu

---

### 3. Encoder Service (Port 3002)

**Responsibilities:**
- Video encoding (HLS)
- Thumbnail generation
- Quality transcoding (360p, 720p, 1080p)
- Video metadata extraction

**Tech Stack:**
- NestJS with TypeScript
- FFmpeg for video processing
- BullMQ for job queues
- Sharp for image processing

**Modules:**
```
encoder/
├── src/
│   ├── jobs/           # BullMQ job processors
│   ├── ffmpeg/         # FFmpeg wrapper
│   ├── hls/            # HLS encoding
│   ├── thumbnails/     # Thumbnail generator
│   └── storage/        # File storage management
```

**Encoding Pipeline:**
```
Upload → Validate → Extract Metadata → 
  ├─ Generate Thumbnail
  ├─ Encode 360p HLS
  ├─ Encode 720p HLS
  └─ Encode 1080p HLS
```

---

## 🗄️ Database Schema (PostgreSQL)

**Core Tables:**
- `users` - User accounts
- `content` - Movies & series
- `episodes` - Series episodes
- `subscriptions` - VIP plans
- `payments` - Payment receipts
- `promo_codes` - Discount codes
- `watch_history` - User watch history
- `favorites` - User favorites
- `admins` - Admin users & permissions
- `audit_logs` - Admin action logs

**Relationships:**
```
users ──< payments
users ──< watch_history
users ──< favorites
content ──< episodes
content ──< watch_history
```

---

## 🔐 Authentication & Authorization

### JWT Strategy:
1. User logs in via Telegram Web App
2. Server validates `initData` (HMAC)
3. Server generates JWT (24h expiry)
4. Client stores JWT in localStorage
5. Client sends JWT in `Authorization: Bearer <token>`

### Role-Based Access Control (RBAC):
- **User** - Basic access
- **VIP** - Premium content
- **Admin** - Content management
- **Super Admin** - Full access

---

## 🎥 Video Streaming Architecture

### HLS (HTTP Live Streaming):

**Why HLS?**
- Adaptive bitrate streaming
- No special server required (standard HTTP)
- Supported by all modern browsers
- CDN-friendly

**Encoding Process:**
```bash
# Input: video.mp4
ffmpeg -i video.mp4 \
  -c:v libx264 -c:a aac \
  -hls_time 10 \
  -hls_playlist_type vod \
  -hls_segment_filename "video_%03d.ts" \
  video.m3u8
```

**Output Structure:**
```
uploads/videos/movie123/
├── master.m3u8         # Master playlist
├── 360p/
│   ├── playlist.m3u8
│   ├── segment000.ts
│   ├── segment001.ts
│   └── ...
├── 720p/
│   ├── playlist.m3u8
│   └── ...
└── 1080p/
    ├── playlist.m3u8
    └── ...
```

**Nginx Streaming Config:**
```nginx
location /streams/ {
    alias /data/uploads/videos/;
    add_header Cache-Control "public, max-age=3600";
    add_header Access-Control-Allow-Origin "*";
}
```

---

## 📊 Caching Strategy

### Redis Usage:
- **Session Storage** - User sessions (JWT blacklist)
- **API Cache** - Content lists, user profiles
- **Rate Limiting** - API request throttling
- **Job Queues** - BullMQ

**Cache Keys:**
```
content:list:page:1        # TTL: 5 min
user:profile:123           # TTL: 10 min
settings:global            # TTL: 1 hour
ratelimit:user:123:api     # TTL: 1 min
```

---

## 🚀 Deployment

### Docker Compose:
```yaml
version: '3.8'
services:
  api:
    build: ./apps/api
    ports: [3000:3000]
  bot:
    build: ./apps/bot
    ports: [3001:3001]
  encoder:
    build: ./apps/encoder
    ports: [3002:3002]
  postgres:
    image: postgres:15
  redis:
    image: redis:7
  nginx:
    image: nginx:alpine
    ports: [80:80, 443:443]
```

### Railway Deployment:
- Each service = separate Railway service
- Shared PostgreSQL & Redis
- Auto-deploy on git push

---

## 🔄 CI/CD Pipeline

### GitHub Actions:
```yaml
on: [push]
jobs:
  test:
    - Run linter
    - Run unit tests
    - Run e2e tests
  build:
    - Build Docker images
    - Push to registry
  deploy:
    - Deploy to Railway
```

---

## 📈 Monitoring & Logging

- **Logging**: Winston + structured logs
- **Monitoring**: Railway metrics
- **Error Tracking**: Sentry (optional)
- **APM**: New Relic (optional)

---

## 🔒 Security Best Practices

1. ✅ HTTPS only (Railway SSL)
2. ✅ JWT with short expiry (24h)
3. ✅ Rate limiting (100 req/min per user)
4. ✅ Input validation (class-validator)
5. ✅ SQL injection prevention (Prisma ORM)
6. ✅ XSS protection (Content Security Policy)
7. ✅ CSRF tokens for state-changing operations
8. ✅ CORS whitelist
9. ✅ Helmet.js security headers
10. ✅ Password hashing (bcrypt)

---

## 🎯 Performance Optimizations

1. ✅ PostgreSQL connection pooling
2. ✅ Redis caching
3. ✅ HLS adaptive streaming
4. ✅ CDN for static assets
5. ✅ Gzip/Brotli compression
6. ✅ Database indexing
7. ✅ Lazy loading (frontend)
8. ✅ Image optimization (Sharp)
9. ✅ Code splitting (Vite)
10. ✅ Service worker caching

---

## 📚 API Documentation

- Swagger/OpenAPI auto-generated
- Available at `/api/docs`
- Postman collection included

---

## 🧪 Testing Strategy

### Unit Tests:
- Services: 80%+ coverage
- Controllers: 70%+ coverage
- Utilities: 90%+ coverage

### Integration Tests:
- API endpoints
- Database operations
- External services (mocked)

### E2E Tests:
- Critical user flows
- Admin operations
- Payment processing

---

## 🔮 Future Enhancements

1. **Mobile Apps** (React Native)
2. **Live Streaming** (WebRTC)
3. **AI Recommendations** (ML)
4. **Multi-language Support**
5. **Offline Mode** (PWA)
6. **Analytics Dashboard**
7. **CDN Integration** (Cloudflare)
8. **Kubernetes** (scalability)

---

## 📞 Support

For questions or issues, contact the development team.
