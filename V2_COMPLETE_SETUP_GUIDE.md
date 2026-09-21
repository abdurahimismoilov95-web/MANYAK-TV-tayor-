# 🚀 MANYAK TV V2 — TO'LIQ SETUP GUIDE

## Professional Microservices Architecture Implementation

---

## 📋 **TABLE OF CONTENTS**

1. [Overview](#overview)
2. [Current Status](#current-status)
3. [Prerequisites](#prerequisites)
4. [Step-by-Step Setup](#step-by-step-setup)
5. [Docker Deployment](#docker-deployment)
6. [Manual Deployment](#manual-deployment)
7. [Troubleshooting](#troubleshooting)
8. [Production Checklist](#production-checklist)

---

## 🎯 **OVERVIEW**

V2 **skeleton project** yaratilgan, lekin to'liq implement qilinmagan. Bu guide sizga:
- ✅ Barcha TypeScript error'larni fix qilishni
- ✅ Missing implementation'larni to'ldirishni
- ✅ Database setup qilishni
- ✅ Docker bilan deploy qilishni
- ✅ Production-ready qilishni

**Ko'rsatadi.**

---

## 📊 **CURRENT STATUS**

### ✅ **Done:**
- Project structure created
- Dependencies installed (API, Bot, Encoder, Web, Database)
- Prisma schema configured
- Docker Compose setup
- .env configured
- Documentation complete

### ❌ **Todo:**
- Fix TypeScript decorator errors (16 errors)
- Implement missing service methods
- Create Prisma migrations
- Fix build errors
- Test all services
- Deploy to production

---

## 🔧 **PREREQUISITES**

### **Software Requirements:**
```bash
# Required:
- Node.js 18+ (LTS)
- Docker Desktop 24+
- PostgreSQL 15+ (for local dev) or Docker
- Git 2.40+

# Optional:
- VSCode with extensions:
  - ESLint
  - Prettier
  - Prisma
  - Docker
```

### **Knowledge Requirements:**
- TypeScript intermediate level
- NestJS basics
- Prisma ORM
- Docker & Docker Compose
- PostgreSQL

---

## 📝 **STEP-BY-STEP SETUP**

### **STEP 1: Fix TypeScript Configuration** ⭐

**Problem:** Decorator errors in bot service

**File:** `apps/bot/tsconfig.json`

```json
{
  "extends": "../../tsconfig.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./",
    "rootDir": "src",
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "strictPropertyInitialization": false,
    "resolveJsonModule": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "test"]
}
```

**Apply to all services:**
- `apps/api/tsconfig.json`
- `apps/bot/tsconfig.json`
- `apps/encoder/tsconfig.json`

---

### **STEP 2: Fix Bot Controller Decorator Errors** ⭐⭐

**File:** `apps/bot/src/webhook/webhook.controller.ts`

**Current errors:**
```typescript
@Post('broadcast')  // ❌ Missing descriptor
async createBroadcast(@Body() body: BroadcastDto) { ... }
```

**Fix:**
```typescript
import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';

@ApiTags('Webhook')
@Controller('webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService) {}

  @Post('broadcast')
  @ApiOperation({ summary: 'Create broadcast message' })
  @ApiBody({ type: BroadcastDto })
  @ApiResponse({ status: 201, description: 'Broadcast created successfully' })
  async createBroadcast(
    @Body() body: BroadcastDto
  ): Promise<{ success: boolean; broadcastId: string }> {
    return await this.webhookService.createBroadcast(body);
  }

  @Get('broadcast/history')
  @ApiOperation({ summary: 'Get broadcast history' })
  @ApiResponse({ status: 200, description: 'Broadcast history retrieved' })
  async getBroadcastHistory(
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10
  ): Promise<{
    broadcasts: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    return await this.webhookService.getBroadcastHistory(page, limit);
  }

  @Post('verification/create')
  @ApiOperation({ summary: 'Create phone verification' })
  async createVerification(
    @Body() body: { telegramId: string; phoneNumber: string }
  ): Promise<{ code: string; expiresAt: Date }> {
    return await this.webhookService.createVerification(
      body.telegramId,
      body.phoneNumber
    );
  }

  @Post('verification/verify')
  @ApiOperation({ summary: 'Verify phone code' })
  async verifyCode(
    @Body() body: { telegramId: string; code: string }
  ): Promise<{ success: boolean; message: string }> {
    return await this.webhookService.verifyCode(body.telegramId, body.code);
  }

  @Get('health')
  @ApiOperation({ summary: 'Health check' })
  async healthCheck(): Promise<{
    status: string;
    service: string;
    timestamp: Date;
  }> {
    return {
      status: 'ok',
      service: 'bot-service',
      timestamp: new Date()
    };
  }
}
```

**Create DTOs:**

**File:** `apps/bot/src/webhook/dto/broadcast.dto.ts`
```typescript
import { IsString, IsArray, IsOptional, IsBoolean } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class BroadcastDto {
  @ApiProperty({ description: 'Broadcast message text' })
  @IsString()
  message: string;

  @ApiProperty({ description: 'Target user IDs', required: false })
  @IsArray()
  @IsOptional()
  targetUserIds?: string[];

  @ApiProperty({ description: 'Send to all users', default: false })
  @IsBoolean()
  @IsOptional()
  sendToAll?: boolean;

  @ApiProperty({ description: 'Send to VIP users only', default: false })
  @IsBoolean()
  @IsOptional()
  vipOnly?: boolean;
}
```

---

### **STEP 3: Implement Missing Service Methods** ⭐⭐⭐

**File:** `apps/bot/src/webhook/webhook.service.ts`

```typescript
import { Injectable } from '@nestjs/common';
import { PrismaService } from '@your-org/database';

@Injectable()
export class WebhookService {
  constructor(private readonly prisma: PrismaService) {}

  async createBroadcast(dto: BroadcastDto): Promise<{
    success: boolean;
    broadcastId: string;
  }> {
    // TODO: Implement broadcast logic
    const broadcast = await this.prisma.broadcast.create({
      data: {
        message: dto.message,
        targetUserIds: dto.targetUserIds || [],
        sendToAll: dto.sendToAll || false,
        vipOnly: dto.vipOnly || false,
        status: 'pending',
        createdAt: new Date()
      }
    });

    // TODO: Queue broadcast job to BullMQ
    // await this.broadcastQueue.add('send-broadcast', { broadcastId: broadcast.id });

    return {
      success: true,
      broadcastId: broadcast.id
    };
  }

  async getBroadcastHistory(
    page: number,
    limit: number
  ): Promise<{
    broadcasts: any[];
    total: number;
    page: number;
    totalPages: number;
  }> {
    const skip = (page - 1) * limit;

    const [broadcasts, total] = await Promise.all([
      this.prisma.broadcast.findMany({
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' }
      }),
      this.prisma.broadcast.count()
    ]);

    return {
      broadcasts,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    };
  }

  async createVerification(
    telegramId: string,
    phoneNumber: string
  ): Promise<{ code: string; expiresAt: Date }> {
    // Generate 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    await this.prisma.phoneVerification.create({
      data: {
        telegramId,
        phoneNumber,
        code,
        expiresAt,
        verified: false
      }
    });

    // TODO: Send SMS with code via Twilio/etc

    return { code, expiresAt };
  }

  async verifyCode(
    telegramId: string,
    code: string
  ): Promise<{ success: boolean; message: string }> {
    const verification = await this.prisma.phoneVerification.findFirst({
      where: {
        telegramId,
        code,
        verified: false,
        expiresAt: { gt: new Date() }
      }
    });

    if (!verification) {
      return {
        success: false,
        message: 'Invalid or expired code'
      };
    }

    await this.prisma.phoneVerification.update({
      where: { id: verification.id },
      data: { verified: true }
    });

    // Update user phone verification status
    await this.prisma.user.update({
      where: { telegramId },
      data: { isPhoneVerified: true, phoneNumber: verification.phoneNumber }
    });

    return {
      success: true,
      message: 'Phone verified successfully'
    };
  }
}
```

---

### **STEP 4: Add Missing Prisma Models** ⭐

**File:** `packages/database/prisma/schema.prisma`

**Add these models:**

```prisma
model Broadcast {
  id             String    @id @default(cuid())
  message        String
  targetUserIds  String[]
  sendToAll      Boolean   @default(false)
  vipOnly        Boolean   @default(false)
  status         String    // 'pending', 'sending', 'completed', 'failed'
  sentCount      Int       @default(0)
  failedCount    Int       @default(0)
  createdAt      DateTime  @default(now())
  completedAt    DateTime?
  
  @@index([status])
  @@index([createdAt])
}

model PhoneVerification {
  id          String    @id @default(cuid())
  telegramId  String
  phoneNumber String
  code        String
  verified    Boolean   @default(false)
  expiresAt   DateTime
  createdAt   DateTime  @default(now())
  verifiedAt  DateTime?
  
  @@index([telegramId, code])
  @@index([expiresAt])
}
```

---

### **STEP 5: Generate & Run Prisma Migrations** ⭐⭐

```bash
cd packages/database

# Generate migration
npx prisma migrate dev --name add_broadcast_and_verification

# Generate Prisma Client
npx prisma generate

# Push to database (if using cloud PostgreSQL)
npx prisma db push
```

---

### **STEP 6: Fix Remaining Services** ⭐⭐

**Similar fixes needed for:**

1. **API Service** (`apps/api/src`)
   - Auth controller
   - Users controller
   - Content controller
   - Payments controller

2. **Encoder Service** (`apps/encoder/src`)
   - Video encoding jobs
   - HLS generation
   - Thumbnail creation

3. **Web Frontend** (`apps/web/src`)
   - React components
   - API integration
   - HLS video player

**Template for each controller:**

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminGuard } from '../auth/guards/admin.guard';

@ApiTags('YourResource')
@Controller('your-resource')
@UseGuards(JwtAuthGuard)
export class YourController {
  constructor(private readonly yourService: YourService) {}

  @Get()
  @ApiOperation({ summary: 'List all items' })
  async findAll(@Query('page') page: number = 1) {
    return this.yourService.findAll(page);
  }

  @Post()
  @UseGuards(AdminGuard)
  @ApiOperation({ summary: 'Create new item' })
  async create(@Body() dto: CreateDto) {
    return this.yourService.create(dto);
  }

  // ... more endpoints
}
```

---

### **STEP 7: Build Each Service** ⭐

```bash
# API
cd apps/api
npm run build

# Bot
cd ../bot
npm run build

# Encoder
cd ../encoder
npm run build

# Web
cd ../web
npm run build
```

**Fix any build errors before continuing!**

---

## 🐳 **DOCKER DEPLOYMENT**

### **Method 1: Full Docker Compose (Recommended)**

**File:** `docker-compose.yml` (already configured)

```bash
# Build and start all services
docker compose up -d --build

# Check logs
docker compose logs -f

# Check status
docker compose ps

# Stop all
docker compose down
```

**Access:**
- Web: http://localhost:5173
- API: http://localhost:3000
- Bot: http://localhost:3001
- Encoder: http://localhost:3002

---

### **Method 2: Local Services + Docker Database**

**Start only database services:**

```yaml
# docker-compose.dev.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: ${DB_PASSWORD}
      POSTGRES_DB: manyak_tv
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"

volumes:
  postgres_data:
```

```bash
# Start databases only
docker compose -f docker-compose.dev.yml up -d

# Run services locally
cd apps/api
npm run start:dev  # Port 3000

cd apps/bot
npm run start:dev  # Port 3001

cd apps/encoder
npm run start:dev  # Port 3002

cd apps/web
npm run dev        # Port 5173
```

---

## 🚀 **MANUAL DEPLOYMENT (Railway / Render)**

### **Railway Deployment**

**Step 1: Create Railway Project**
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Init project
railway init

# Link to GitHub repo
railway link
```

**Step 2: Configure Services**

Create 4 Railway services:
1. **API Service**
   - Root directory: `apps/api`
   - Build command: `npm install && npm run build`
   - Start command: `npm run start:prod`
   - Port: `3000`

2. **Bot Service**
   - Root directory: `apps/bot`
   - Build command: `npm install && npm run build`
   - Start command: `npm run start:prod`
   - Port: `3001`

3. **Encoder Service**
   - Root directory: `apps/encoder`
   - Build command: `npm install && npm run build`
   - Start command: `npm run start:prod`
   - Port: `3002`

4. **Web Service**
   - Root directory: `apps/web`
   - Build command: `npm install && npm run build`
   - Start command: `npx serve -s dist -p 80`
   - Port: `80`

**Step 3: Add Database**
```bash
# Add PostgreSQL
railway add postgresql

# Add Redis
railway add redis

# Environment variables auto-configured
```

**Step 4: Deploy**
```bash
railway up
```

---

### **Render Deployment**

**Create `render.yaml`:**
```yaml
services:
  - type: web
    name: manyak-api
    env: node
    region: frankfurt
    buildCommand: cd apps/api && npm install && npm run build
    startCommand: cd apps/api && npm run start:prod
    envVars:
      - key: NODE_ENV
        value: production
      - key: DATABASE_URL
        fromDatabase:
          name: manyak-postgres
          property: connectionString

  - type: web
    name: manyak-bot
    env: node
    region: frankfurt
    buildCommand: cd apps/bot && npm install && npm run build
    startCommand: cd apps/bot && npm run start:prod

  - type: web
    name: manyak-encoder
    env: node
    region: frankfurt
    buildCommand: cd apps/encoder && npm install && npm run build
    startCommand: cd apps/encoder && npm run start:prod

  - type: web
    name: manyak-web
    env: static
    buildCommand: cd apps/web && npm install && npm run build
    staticPublishPath: apps/web/dist

databases:
  - name: manyak-postgres
    databaseName: manyak_tv
    user: postgres
    region: frankfurt
```

---

## 🔍 **TROUBLESHOOTING**

### **Issue 1: TypeScript Decorator Errors**

**Error:**
```
error TS1241: Unable to resolve signature of method decorator
```

**Fix:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "experimentalDecorators": true,
    "emitDecoratorMetadata": true
  }
}
```

---

### **Issue 2: Prisma Client Not Generated**

**Error:**
```
Cannot find module '@prisma/client'
```

**Fix:**
```bash
cd packages/database
npx prisma generate
```

---

### **Issue 3: Database Connection Failed**

**Error:**
```
Error: P1001: Can't reach database server
```

**Fix:**
```bash
# Check DATABASE_URL in .env
DATABASE_URL="postgresql://user:password@localhost:5432/dbname"

# Test connection
npx prisma db pull
```

---

### **Issue 4: Docker Build Fails**

**Error:**
```
npm ci can only install with an existing package-lock.json
```

**Fix:**
```dockerfile
# Change in Dockerfile
RUN npm install
# Instead of:
# RUN npm ci
```

---

### **Issue 5: FFmpeg Not Found (Encoder)**

**Error:**
```
Error: spawn ffmpeg ENOENT
```

**Fix (Dockerfile):**
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache ffmpeg
```

---

## ✅ **PRODUCTION CHECKLIST**

### **Security**
- [ ] Change all default secrets in `.env`
- [ ] Enable CORS whitelist
- [ ] Add rate limiting
- [ ] Enable Helmet.js
- [ ] Setup SSL certificates (Let's Encrypt)
- [ ] Configure firewall rules
- [ ] Enable PostgreSQL SSL connection

### **Performance**
- [ ] Setup Redis caching
- [ ] Configure CDN (Cloudflare)
- [ ] Enable Gzip compression
- [ ] Optimize database indexes
- [ ] Setup connection pooling
- [ ] Configure BullMQ for jobs

### **Monitoring**
- [ ] Setup logging (Winston)
- [ ] Configure error tracking (Sentry)
- [ ] Setup APM (New Relic / DataDog)
- [ ] Configure uptime monitoring
- [ ] Setup database backups

### **Testing**
- [ ] Unit tests (Jest)
- [ ] Integration tests
- [ ] E2E tests (Playwright)
- [ ] Load testing (k6)
- [ ] Security audit (npm audit)

---

## 📚 **ADDITIONAL RESOURCES**

### **Documentation**
- NestJS: https://docs.nestjs.com
- Prisma: https://www.prisma.io/docs
- Docker: https://docs.docker.com
- PostgreSQL: https://www.postgresql.org/docs

### **Video Tutorials**
- NestJS Crash Course: https://youtube.com/watch?v=...
- Prisma Tutorial: https://youtube.com/watch?v=...
- Docker Compose Guide: https://youtube.com/watch?v=...

---

## 🎯 **ESTIMATED TIMELINE**

| Task | Time | Difficulty |
|------|------|------------|
| Fix TypeScript errors | 2-3 hours | ⭐⭐ |
| Implement services | 1-2 days | ⭐⭐⭐ |
| Database migrations | 2-3 hours | ⭐⭐ |
| Docker build fixes | 1-2 hours | ⭐ |
| Testing | 1 day | ⭐⭐ |
| Deployment | 3-4 hours | ⭐⭐ |
| **TOTAL** | **3-5 days** | ⭐⭐⭐ |

---

## 🚀 **QUICK START SUMMARY**

```bash
# 1. Fix TypeScript config
# Edit tsconfig.json files in each app

# 2. Install dependencies (already done)
npm install  # in each app

# 3. Generate Prisma Client
cd packages/database
npx prisma generate
npx prisma migrate dev

# 4. Fix code errors
# Follow STEP 2 & STEP 3 above

# 5. Build all services
npm run build  # in each app

# 6. Docker deploy
docker compose up -d --build

# 7. Access
# Web: http://localhost:5173
# API: http://localhost:3000
```

---

## 📞 **SUPPORT**

Agar muammolarga duch kelsangiz:

1. **Check logs:** `docker compose logs -f [service-name]`
2. **Review errors:** TypeScript errors birinchi fix qiling
3. **Test locally:** Docker'siz test qiling
4. **Ask for help:** GitHub Issues yoki team chat

---

## 🎉 **FINAL NOTES**

V2 **skeleton to'liq**, lekin **implementation incomplete**. 

**Agar vaqtingiz kam bo'lsa:**
- ✅ V1'ni production'ga oling (hozir ishlaydi!)
- ✅ V2'ni background'da fix qiling
- ✅ Keyinchalik V1 → V2 migrate qiling

**Agar v2'ni hozir kerak bo'lsa:**
- ✅ Bu guide'ni follow qiling
- ✅ 3-5 kun sarflang
- ✅ Professional microservices oling!

**Good luck!** 🚀

---

**NEXT STEPS:**
1. Read this guide fully
2. Start with STEP 1 (TypeScript config)
3. Fix errors one by one
4. Test locally before Docker
5. Deploy to production

**You got this!** 💪
