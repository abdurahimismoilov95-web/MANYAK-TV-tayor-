# Production Setup Guide

## 1. TELEGRAM BOT TOKEN OLISH

### BotFather orqali:
1. Telegram'da `@BotFather` ni oching
2. `/newbot` buyrug'ini yuboring
3. Bot nomini kiriting: `MANYAK TV Bot`
4. Username kiriting: `manyaktvbot` (yoki boshqa)
5. BotFather sizga **token** yuboradi:
   ```
   1234567890:ABCdefGHIjklMNOpqrsTUVwxyz123456789
   ```

### Mavjud bot uchun:
1. `@BotFather` → `/mybots`
2. O'z botingizni tanlang
3. `API Token` → Token ko'rinadi

---

## 2. .ENV FAYLINI SOZLASH

### Development (test) rejim:
```env
NODE_ENV="development"
DEV_MODE="true"
TELEGRAM_BOT_TOKEN=""
SUPER_ADMIN_ID="891846690"
```

### Production (to'liq ishlash) rejim:
```env
NODE_ENV="production"
DEV_MODE="false"
TELEGRAM_BOT_TOKEN="HAQIQIY_TOKEN_SHU_YERGA"
SUPER_ADMIN_ID="891846690"
ADMIN_IDS="891846690"
WEBHOOK_SECRET="GENERATE_RANDOM_SECRET"
JWT_SECRET="GENERATE_RANDOM_SECRET"
APP_URL="https://your-domain.com"
```

---

## 3. SECRET'LAR GENERATSIYA QILISH

PowerShell'da:
```powershell
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Webhook Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Natija (misol):
```
a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8s9t0u1v2w3x4y5z6
```

---

## 4. PRODUCTION DEPLOY

### Railway.app:
1. GitHub repo ulang
2. Environment Variables:
   - `TELEGRAM_BOT_TOKEN` = haqiqiy token
   - `JWT_SECRET` = generated secret
   - `WEBHOOK_SECRET` = generated secret
   - `SUPER_ADMIN_ID` = sizning Telegram ID
   - `NODE_ENV` = production
   - `PORT` = 3001

### Render.com:
1. GitHub repo ulang
2. Environment Variables:
   - Same as Railway
3. Build Command: `npm install && npm run build`
4. Start Command: `node server.js`

---

## 5. DOMEN VA WEBHOOK

### Railway domen:
```
https://manyaktv-production.up.railway.app
```

### Webhook setup:
Server avtomatik webhook o'rnatadi:
```
https://your-domain.com/webhook
```

---

## 6. TEST QILISH

### Local test (haqiqiy bot bilan):
1. `.env` ga haqiqiy token qo'shing
2. `DEV_MODE="false"`
3. Server restart: `node server.js`
4. Telegram botga `/start` yuboring
5. Web App ochilishi kerak

### Production test:
1. Telegram botga `/start`
2. Inline button "Open App" bosing
3. Mini App ochiladi
4. Login qilish
5. Content ko'rish

---

## 7. XAVFSIZLIK TEKSHIRUVI

✅ Tekshirish listi:
- [ ] `.env` fayli `.gitignore` da
- [ ] Haqiqiy secrets production'da
- [ ] Default secrets (test_*) o'chirilgan
- [ ] SUPER_ADMIN_ID to'g'ri
- [ ] HTTPS domain bor
- [ ] Webhook ishlayapti
- [ ] Database backup configured

---

## 8. MONITORING

### Log'larni ko'rish:
```bash
# Railway
railway logs

# Render
render logs

# Local
node server.js
```

### Health check:
```bash
curl https://your-domain.com/api/health
```

Natija:
```json
{
  "status": "ok",
  "service": "MANYK TV SQLite Backend",
  "version": "2.0.0"
}
```

---

## KEYINGI QADAMLAR

1. ✅ Bot token oling
2. ✅ Production .env sozlang
3. ✅ Railway/Render'ga deploy qiling
4. ✅ Webhook test qiling
5. ✅ Telegram'dan kirish test qiling

**Hozircha local'da test qilish uchun bot token kerak!**
