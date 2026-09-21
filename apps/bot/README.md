# 🤖 MANYAK TV - Bot Service

Telegram Bot microservice for MANYAK TV platform.

## 📋 Features

- ✅ **Telegram Bot Integration** - Full Telegraf setup
- ✅ **Commands** - /start, /vip, /help
- ✅ **Phone Verification** - SMS-style code verification
- ✅ **Broadcast System** - Mass messaging to users
- ✅ **Webhook Support** - Production-ready webhook mode
- ✅ **Database Integration** - Prisma ORM with PostgreSQL

## 🚀 Quick Start

### 1. Install Dependencies

```bash
cd apps/bot
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:

```env
BOT_PORT=3001
TELEGRAM_BOT_TOKEN=your_bot_token_from_botfather
WEB_APP_URL=https://your-frontend.com
DATABASE_URL=postgresql://user:password@localhost:5432/manyak_tv
```

### 3. Generate Prisma Client

```bash
cd ../../packages/database
npx prisma generate
```

### 4. Run Bot Service

**Development (Polling mode):**
```bash
npm run start:dev
```

**Production (Webhook mode):**
```bash
npm run build
npm run start:prod
```

## 📱 Bot Commands

| Command | Description |
|---------|-------------|
| `/start` | Start bot & open web app |
| `/vip` | VIP subscription info |
| `/help` | Get help |

## 🎯 Bot Features

### 1️⃣ Welcome Message
- Inline keyboard with Web App button
- User registration in database
- VIP and Help buttons

### 2️⃣ VIP Subscription
- Check VIP status
- View subscription plans
- Payment instructions

### 3️⃣ Phone Verification
- Generate 6-digit codes
- 10-minute expiry
- Database verification

### 4️⃣ Broadcast System
- Send to ALL users
- Send to VIP only
- Send to NON-VIP only
- Image support
- Rate limiting

## 🔌 API Endpoints

Base URL: `http://localhost:3001`

### Webhook
```bash
POST /webhook/telegram        # Telegram webhook
GET  /webhook/health          # Health check
```

### Broadcast
```bash
POST /webhook/broadcast                # Send broadcast
GET  /webhook/broadcast/history        # Get history
```

### Verification
```bash
POST /webhook/verification/create      # Create code
POST /webhook/verification/verify      # Verify code
```

## 📦 Project Structure

```
apps/bot/
├── src/
│   ├── bot/                 # Bot service (Telegraf)
│   ├── commands/            # Command handlers
│   ├── verification/        # Phone verification
│   ├── broadcast/           # Mass messaging
│   ├── webhook/             # HTTP endpoints
│   ├── prisma/              # Database service
│   ├── app.module.ts        # Main module
│   └── main.ts              # Entry point
├── package.json
├── tsconfig.json
└── .env.example
```

## 🔐 Security

- Telegram HMAC validation
- Rate limiting on broadcasts
- Code expiry (10 minutes)
- Database validation

## 🛠 Development

### Run in Watch Mode
```bash
npm run start:dev
```

### Build
```bash
npm run build
```

### Lint
```bash
npm run lint
```

## 📊 Monitoring

Health check endpoint:
```bash
curl http://localhost:3001/webhook/health
```

Response:
```json
{
  "status": "ok",
  "service": "bot",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔗 Integration with API Service

Bot service communicates with main API service:

- User registration
- VIP status checks
- Payment processing
- Content access

Set `API_SERVICE_URL` in `.env` to connect services.

## 📝 Environment Variables

| Variable | Description | Required |
|----------|-------------|----------|
| `BOT_PORT` | Service port | Yes |
| `TELEGRAM_BOT_TOKEN` | Bot token from @BotFather | Yes |
| `WEB_APP_URL` | Frontend URL | Yes |
| `WEBHOOK_URL` | Webhook URL (prod only) | No |
| `DATABASE_URL` | PostgreSQL connection | Yes |
| `API_SERVICE_URL` | Main API URL | Yes |

## 🚀 Deployment

### Development
Uses **polling mode** - no webhook needed.

### Production
Uses **webhook mode** - set `WEBHOOK_URL` in `.env`:

```env
WEBHOOK_URL=https://your-bot-api.com/webhook/telegram
```

Bot will automatically set webhook on startup.

## 🎯 Next Steps

- [ ] Add payment gateway integration
- [ ] Add inline queries
- [ ] Add admin commands
- [ ] Add scheduled broadcasts
- [ ] Add analytics

## 📚 Resources

- [Telegraf Documentation](https://telegraf.js.org/)
- [Telegram Bot API](https://core.telegram.org/bots/api)
- [NestJS Documentation](https://docs.nestjs.com/)

---

**Made with ❤️ by MANYAK TV Team**
