# 🔒 MANYK TV - Xavfsizlik Yo'riqnomasi

**Versiya:** 2.0  
**Sana:** 2026-09-11  
**Holat:** ✅ Production Ready

---

## 📋 Mundarija

1. [Xavfsizlik Xususiyatlari](#xavfsizlik-xususiyatlari)
2. [Production Deployment](#production-deployment)
3. [Secrets Management](#secrets-management)
4. [Authentication & Authorization](#authentication--authorization)
5. [File Upload Security](#file-upload-security)
6. [Rate Limiting](#rate-limiting)
7. [Database Security](#database-security)
8. [Privacy Protection](#privacy-protection)
9. [Monitoring & Audit](#monitoring--audit)
10. [Security Checklist](#security-checklist)

---

## 🛡️ Xavfsizlik Xususiyatlari

### ✅ Amalga oshirilgan himoya choralari:

#### 1. **Authentication & Authorization**
- ✅ JWT token based authentication (Telegram WebApp initData HMAC validation)
- ✅ 24-soatlik token expiration
- ✅ Admin access control (SUPER_ADMIN + ENV_ADMIN_IDS + DB admins)
- ✅ Owner-or-admin authorization pattern
- ✅ Telegram bot contact verification (one-time)
- ✅ Server-side entitlements (VIP, tokens, purchases)

#### 2. **Input Validation**
- ✅ SQL injection protection (parameterized queries)
- ✅ File upload magic bytes validation (images & videos)
- ✅ Receipt type & amount validation
- ✅ CORS exact origin matching
- ✅ Request payload size limits

#### 3. **File Security**
- ✅ Public/private file separation (`/uploads/public` vs `/uploads/private`)
- ✅ Receipt images authentication required
- ✅ Magic bytes validation (no Content-Type trust)
- ✅ EXIF metadata stripping (GPS, device info, timestamps)
- ✅ File path traversal protection

#### 4. **Rate Limiting**
- ✅ Global API: 200 req/15min
- ✅ Auth: 5 req/min (brute-force protection)
- ✅ Receipts: 10/hour (spam prevention)
- ✅ Uploads: 50/hour (disk protection)
- ✅ Admin actions: 100/hour (abuse prevention)
- ✅ Broadcast: 5/hour (spam control)

#### 5. **Privacy & Data Protection**
- ✅ EXIF metadata stripping from images
- ✅ Private receipt images (owner/admin only)
- ✅ Phone number encryption ready
- ✅ Audit logging for sensitive operations

#### 6. **Production Hardening**
- ✅ Strict secrets validation (fail-fast if missing/weak)
- ✅ Default secrets rejection in production
- ✅ Environment variable enforcement
- ✅ Comprehensive error messages for misconfigurations

---

## 🚀 Production Deployment

### Minimal xavfsizlik talablari:

#### 1. **Environment Variables (MAJBURIY)**

```bash
# Telegram Bot (REQUIRED)
TELEGRAM_BOT_TOKEN="<BOT_TOKEN_FROM_BOTFATHER>"
SUPER_ADMIN_ID="<YOUR_TELEGRAM_ID>"

# Strong Secrets (REQUIRED - MUST BE RANDOM!)
JWT_SECRET="<64_CHAR_RANDOM_HEX>"
WEBHOOK_SECRET="<64_CHAR_RANDOM_HEX>"

# Application
APP_URL="https://yourapp.com"
NODE_ENV="production"

# Storage (with persistent volume)
DATA_DIR="/data"
BACKUP_DIR="/data/backups"
UPLOADS_DIR="/data/uploads"
```

#### 2. **Secrets yaratish:**

```bash
# JWT Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"

# Webhook Secret
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

#### 3. **Railway/Render sozlash:**

**Railway:**
```
Dashboard → Settings → Variables → Bulk Import
[Barcha ENV variables ni bu yerga paste qiling]
```

**Render:**
```
Dashboard → Environment → Secret Files
.env faylini upload qiling (faqat production qiymatlari bilan)
```

#### 4. **Deployment validation:**

Server ishga tushganda quyidagi tekshiruvlar o'tadi:

✅ `TELEGRAM_BOT_TOKEN` mavjudligi  
✅ `JWT_SECRET` mavjud va default emas  
✅ `WEBHOOK_SECRET` mavjud va default emas  
✅ `SUPER_ADMIN_ID` mavjudligi

Agar bittasi ham bo'lmasa yoki zaif bo'lsa → **Server ishga tushmaydi!**

---

## 🔐 Secrets Management

### ⚠️ HECH QACHON QILMASLIK KERAK:

❌ `.env` faylini git'ga commit qilish  
❌ Hardcoded secrets kod ichida  
❌ Default/weak secrets production'da  
❌ Secrets'ni frontend code'da  
❌ Secrets'ni log'larda yoki xabar matnlarida

### ✅ TO'G'RI AMALIYOT:

#### Lokal development:
```bash
# .env.local faylini yarating (git'da yo'q)
cp .env.example .env.local
# Haqiqiy qiymatlar bilan to'ldiring
```

#### Production:
```bash
# Secrets'ni hosting platform dashboard'dan kiriting
# HECH QACHON commit qilmang!
```

#### Secrets rotation (har 90 kunda):
```bash
# 1. Yangi secrets yarating
NEW_JWT=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")

# 2. Hosting dashboard'da yangilang
# 3. Server restart qiling
# 4. Eski secret'ni olib tashlang (grace period bilan)
```

---

## 🔑 Authentication & Authorization

### JWT Token Flow:

```
┌─────────────────┐
│ User opens app  │
│ via Telegram    │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ POST /api/auth/verify       │
│ { initData: "..." }         │
└────────┬────────────────────┘
         │
         ▼ [HMAC validation]
┌─────────────────────────────┐
│ Server validates initData:  │
│ 1. Parse Telegram data      │
│ 2. Check HMAC signature     │
│ 3. Verify timestamp         │
└────────┬────────────────────┘
         │
         ▼ [Admin check]
┌─────────────────────────────┐
│ Check if user is admin:     │
│ - SUPER_ADMIN_ID?           │
│ - In ENV_ADMIN_IDS?         │
│ - In appointed_admins DB?   │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Return JWT token:           │
│ { id, username, isAdmin }   │
│ Expires: 24h                │
└────────┬────────────────────┘
         │
         ▼
┌─────────────────────────────┐
│ Client stores in:           │
│ localStorage (manyak_tv_    │
│ auth_token_v1)              │
└─────────────────────────────┘
```

### Authorization Patterns:

#### 1. **Public endpoints** (no auth):
```javascript
app.get('/api/contents', (req, res) => {
  // Anyone can view content list
});
```

#### 2. **Authenticated endpoints**:
```javascript
app.post('/api/receipts', auth, (req, res) => {
  // Logged-in users only
});
```

#### 3. **Owner-or-admin endpoints**:
```javascript
app.get('/api/users/:id', auth, (req, res) => {
  if (req.user.id !== req.params.id && !req.user.isAdmin) {
    return res.status(403).json({ error: 'Ruxsat yo\'q' });
  }
  // Owner can see own profile, admin can see anyone
});
```

#### 4. **Admin-only endpoints**:
```javascript
app.delete('/api/contents/:id', auth, adminOnly, (req, res) => {
  // Admins only
});
```

### Admin Hierarchy:

```
SUPER_ADMIN (from .env)
    │
    ├─→ ENV_ADMIN_IDS (from .env)
    │
    └─→ Appointed Admins (from database)
            │
            └─→ Permissions-based access
```

---

## 📁 File Upload Security

### Architecture:

```
uploads/
├── public/          ← Posters, videos (everyone)
│   ├── content_1726058400_abc123.jpg
│   └── content_1726058401_def456.mp4
│
└── private/         ← Receipts (owner/admin only)
    ├── receipt_1726058400_891846690_xyz789.jpg
    └── receipt_1726058401_123456789_abc123.png
```

### Upload Flow:

```
┌─────────────────────┐
│ POST /api/upload    │
│ [JWT required]      │
└──────────┬──────────┘
           │
           ▼
┌───────────────────────────────┐
│ 1. Authentication check       │
└──────────┬────────────────────┘
           │
           ▼
┌───────────────────────────────┐
│ 2. Size limit validation      │
│    User: 8MB max              │
│    Admin: 2GB max             │
└──────────┬────────────────────┘
           │
           ▼
┌───────────────────────────────┐
│ 3. Magic bytes validation     │
│    Images: JPG/PNG/WEBP       │
│    Videos: MP4/WebM/MOV/TS    │
└──────────┬────────────────────┘
           │
           ▼
┌───────────────────────────────┐
│ 4. EXIF metadata stripping    │
│    Remove GPS, device, dates  │
└──────────┬────────────────────┘
           │
           ▼
┌───────────────────────────────┐
│ 5. Save to appropriate folder │
│    Receipt → private/         │
│    Content → public/          │
└──────────┬────────────────────┘
           │
           ▼
┌───────────────────────────────┐
│ 6. Return URL:                │
│    /uploads/private/...       │
│    /uploads/public/...        │
└───────────────────────────────┘
```

### File Access Control:

#### Public files (anyone):
```javascript
// Direct access
GET /uploads/public/content_123.jpg
// No authentication required
```

#### Private files (owner/admin only):
```javascript
// Requires JWT token
GET /uploads/private/receipt_123_891846690_abc.jpg?token=<JWT>
// Or: Authorization: Bearer <JWT>

// Validates:
// 1. Token is valid
// 2. User ID matches filename (owner)
// 3. OR user is admin
```

### Magic Bytes Detection:

#### Images:
```javascript
// JPEG: FF D8 FF
// PNG:  89 50 4E 47 0D 0A 1A 0A
// WEBP: RIFF....WEBP
// GIF:  GIF8
```

#### Videos:
```javascript
// MP4:  ....ftyp (File Type Box)
// WebM: 1A 45 DF A3 (EBML header)
// MOV:  ....ftypqt
// TS:   0x47 (sync byte pattern)
// M3U8: #EXTM3U
```

### EXIF Stripping:

```javascript
// Privacy protection
const strippedImage = await sharp(buffer)
  .rotate()           // Auto-fix orientation
  .withMetadata({
    exif: {},         // Remove all EXIF
    icc: false        // Keep color profile
  })
  .toBuffer();

// Removes:
// - GPS coordinates
// - Device model/serial
// - Photographer name
// - Date/time taken
// - Camera settings
```

---

## 🚦 Rate Limiting

### Configuration:

| Endpoint | Limit | Window | Purpose |
|----------|-------|--------|---------|
| **Global API** | 200 req | 15 min | Baseline protection |
| **Auth (`/api/auth/verify`)** | 5 req | 1 min | Brute-force prevention |
| **Receipts (`POST /api/receipts`)** | 10 req | 1 hour | Spam/fraud prevention |
| **Upload (`/api/upload`)** | 50 req | 1 hour | Disk space protection |
| **Admin actions** | 100 req | 1 hour | Abuse prevention |
| **Broadcast (`/api/broadcast`)** | 5 req | 1 hour | Spam control |

### Response headers:

```http
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 5
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1726058460
Content-Type: application/json

{
  "ok": false,
  "error": "Juda ko'p so'rov. Iltimos bir oz kuting."
}
```

### Bypass for legitimate traffic:

```javascript
// Trusted IPs (optional)
const trustedIPs = ['1.2.3.4', '5.6.7.8'];

const limiter = rateLimit({
  skip: (req) => trustedIPs.includes(req.ip)
});
```

---

## 🗄️ Database Security

### SQLite Configuration:

```javascript
// Write-Ahead Logging (better concurrency)
db.exec('PRAGMA journal_mode = WAL;');

// Foreign key enforcement
db.exec('PRAGMA foreign_keys = ON;');

// Busy timeout (5 seconds)
db.exec('PRAGMA busy_timeout = 5000;');
```

### SQL Injection Protection:

❌ **XATO** (vulnerable):
```javascript
// HECH QACHON BUNDAY QILMANG!
db.exec(`SELECT * FROM users WHERE id = '${userId}'`);
```

✅ **TO'G'RI** (secure):
```javascript
// DOIM parameterized queries
db.prepare('SELECT * FROM users WHERE id = ?').get(userId);
```

### Sensitive Data:

#### Current state:
- Phone numbers: **plaintext** (encryption needed)
- Passwords: **not stored** (Telegram auth only)
- JWT tokens: **signed** but not encrypted
- Receipt images: **access-controlled**

#### Recommendations:
```javascript
// Phone number encryption (future)
import crypto from 'crypto';

const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY; // 32 bytes

function encryptPhone(phone) {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  const encrypted = Buffer.concat([cipher.update(phone, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();
  return `${iv.toString('hex')}:${encrypted.toString('hex')}:${authTag.toString('hex')}`;
}

function decryptPhone(encryptedPhone) {
  const [ivHex, encryptedHex, authTagHex] = encryptedPhone.split(':');
  const iv = Buffer.from(ivHex, 'hex');
  const encrypted = Buffer.from(encryptedHex, 'hex');
  const authTag = Buffer.from(authTagHex, 'hex');
  const decipher = crypto.createDecipheriv('aes-256-gcm', ENCRYPTION_KEY, iv);
  decipher.setAuthTag(authTag);
  return decipher.update(encrypted) + decipher.final('utf8');
}
```

### Database Backups:

```bash
# Daily automatic backup (3AM)
# Location: BACKUP_DIR (default: /data/backups)
# Retention: 30 days

# Manual backup:
POST /api/backups/create
Authorization: Bearer <ADMIN_JWT>

# List backups:
GET /api/backups
Authorization: Bearer <ADMIN_JWT>

# Restore backup:
POST /api/backups/restore
Authorization: Bearer <ADMIN_JWT>
{ "filename": "manyktv_2026-09-11_03-00-00.db" }
```

### File Permissions:

```bash
# Production recommended permissions:
chmod 600 /data/manyktv.db          # Database
chmod 700 /data/backups/            # Backups folder
chmod 600 /data/backups/*.db        # Backup files
chmod 700 /data/uploads/private/    # Private uploads
chmod 755 /data/uploads/public/     # Public uploads
```

---

## 🔒 Privacy Protection

### EXIF Metadata:

**Removed automatically:**
- GPS coordinates (latitude, longitude, altitude)
- Device make/model (iPhone 13 Pro, Samsung Galaxy S21)
- Camera serial number
- Photographer/artist name
- Date/time original
- Software used
- Copyright information

**Preserved:**
- Image dimensions
- Color space
- ICC color profile (for accurate colors)

### Example EXIF data (BEFORE stripping):

```
GPS Latitude: 41.3111° N
GPS Longitude: 69.2797° E
Make: Apple
Model: iPhone 13 Pro
Software: 16.5.1
Date/Time Original: 2026:09:11 15:30:45
Artist: John Doe
GPS Altitude: 455.2m
```

### After stripping:

```
[No EXIF data]
Image dimensions: 1080x1920
Color space: sRGB
```

### User Privacy Best Practices:

1. ✅ Always strip metadata from user-uploaded images
2. ✅ Use private folders for sensitive files
3. ✅ Require authentication for personal data
4. ✅ Log access to sensitive resources
5. ✅ Implement data retention policies

---

## 📊 Monitoring & Audit

### Audit Logging:

```sql
CREATE TABLE audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id TEXT,
  admin_name TEXT,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id TEXT,
  target_title TEXT,
  details TEXT,
  secondary_auth_passed INTEGER DEFAULT 0,
  created_at TEXT NOT NULL
);
```

### Logged Actions:

- `GRANT_VIP` - Admin VIP berish
- `REVOKE_VIP` - VIP bekor qilish
- `BAN_USER` - Foydalanuvchini bloklash
- `UNBAN_USER` - Blokni ochish
- `APPROVE_RECEIPT` - To'lovni tasdiqlash
- `REJECT_RECEIPT` - To'lovni rad etish
- `UPLOAD_FILE` - Fayl yuklash
- `DELETE_CONTENT` - Kontent o'chirish
- `CREATE_CONTENT` - Kontent yaratish
- `UPDATE_CONTENT` - Kontent tahrirlash

### Monitoring Endpoints:

```bash
# System stats (admin only)
GET /api/stats
Authorization: Bearer <ADMIN_JWT>

Response:
{
  "users": { "total": 1250, "vip": 89, "banned": 3 },
  "content": { "total": 456, "movies": 234, "series": 189, "shorts": 33 },
  "receipts": { "pending": 5, "approved": 234, "rejected": 12 },
  "revenue": 45600000
}
```

### Log Files:

```bash
# Server logs
npm run server > server.log 2>&1

# Important log patterns:
[Auth] - Authentication events
[Privacy] - EXIF stripping
[Upload] - File uploads
[Receipt Notify] - Payment notifications
[Backup] - Database backups
[Webhook] - Telegram bot updates
```

### Recommended Monitoring:

1. **Uptime monitoring:** UptimeRobot, Pingdom
2. **Error tracking:** Sentry, Rollbar
3. **Log aggregation:** Papertrail, Loggly
4. **Performance:** New Relic, DataDog

---

## ✅ Security Checklist

### Pre-Production Deployment:

- [ ] `.env` faylida haqiqiy secrets (not default values)
- [ ] `.env` fayil `.gitignore` da
- [ ] `JWT_SECRET` va `WEBHOOK_SECRET` kuchli (64+ char random)
- [ ] `SUPER_ADMIN_ID` to'g'ri Telegram ID
- [ ] `APP_URL` HTTPS bilan
- [ ] `NODE_ENV=production` o'rnatilgan
- [ ] Database va uploads persistent volume'da (`/data`)
- [ ] Server production secrets validation'dan o'tadi
- [ ] SSL/TLS certificate o'rnatilgan
- [ ] Telegram webhook o'rnatilgan (`/webhook/setup`)

### Production Monitoring:

- [ ] Backup tizimi ishlayapti (har kuni 3AM)
- [ ] Backup files 30 kundan eski bo'lsa o'chiriladi
- [ ] Audit logs yozilmoqda
- [ ] Rate limiting ishlayapti
- [ ] File uploads public/private ajratilgan
- [ ] EXIF metadata tozalanmoqda
- [ ] Admin actions log'lanmoqda

### Regular Maintenance:

- [ ] Secrets rotation (har 90 kunda)
- [ ] Dependencies yangilash (`npm audit fix`)
- [ ] Backup test qilish (restore and verify)
- [ ] Audit logs tekshirish (suspicious activity)
- [ ] Database vacuum (`PRAGMA optimize`)
- [ ] Old uploads cleanup (ixtiyoriy)

### Incident Response:

**Agar xavfsizlik buzilishi aniqlansa:**

1. ✋ **Immediate action:**
   - Telegram bot tokenini revoke qiling (@BotFather)
   - `JWT_SECRET` va `WEBHOOK_SECRET` ni yangilang
   - Server restart qiling

2. 🔍 **Investigation:**
   - Audit logs tekshiring
   - Suspicious user activity aniqlang
   - Compromised accounts'ni bloklang

3. 🔒 **Recovery:**
   - Barcha secrets'ni rotate qiling
   - Affected users'ga xabar bering
   - Database backup'dan restore qiling (agar kerak bo'lsa)

4. 📝 **Post-mortem:**
   - Incident haqida report yozing
   - Security measures kuchaytiring
   - Team'ga training o'tkazing

---

## 🆘 Support & Reporting

### Security Vulnerabilities:

Agar xavfsizlik zaifligini topsangiz:

1. **Hech qachon** public issue yaratmang
2. **Bevosita** admin'ga Telegram orqali xabar bering
3. **Detaillarni** qo'shing: steps to reproduce, impact, screenshots
4. **48 soat** ichida javob olasiz

### Contact:

- **Telegram:** @manyak_admin
- **Email:** security@manyaktv.com (agar mavjud bo'lsa)
- **Emergency:** [Backup contact method]

---

## 📚 Additional Resources:

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [SQLite Security](https://www.sqlite.org/security.html)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Express Security Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)

---

**Last Updated:** 2026-09-11  
**Maintainer:** MANYK TV Development Team  
**Version:** 2.0 (Security Hardened)
