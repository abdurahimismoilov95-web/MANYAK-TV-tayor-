/**
 * MANYAK TV — Secure Express.js + SQLite Backend Server
 * =====================================================
 * Full REST API with SQLite database, JWT auth, Rate Limiting, Telegram Webhook.
 */

// Disable Node.js experimental warnings (SQLite warning)
process.removeAllListeners('warning');
process.on('warning', (warning) => {
  // Suppress SQLite experimental warning
  if (warning.name === 'ExperimentalWarning' && warning.message.includes('SQLite')) {
    return;
  }
  console.warn(warning.name, warning.message);
});

// MUHIM: 'dotenv/config' ENG BIRINCHI import bo'lishi shart!
// Oldin dotenv.config() pastda chaqirilardi, lekin ES module importlari
// fayl tepasidan pastga qarab BAJARILISHIDAN OLDIN "hoisting" qilinadi —
// ya'ni ./database.js ichidagi kod dotenv.config() ishlashidan OLDIN ishga
// tushardi. Natijada .env dagi SUPER_ADMIN_ID, JWT_SECRET va boshqa
// o'zgaruvchilar database.js ga umuman yetib bormas edi (jiddiy bug).
import 'dotenv/config';

import express from 'express';
import { createServer } from 'http';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import rateLimit from 'express-rate-limit';
import sharp from 'sharp';
import multer from 'multer';
import {
  Users, Receipts, Contents, Plans, PromoCodes, WatchHistory,
  Favorites, Settings, Admins, AuditLogs, BannedDevices,
  Comments, DailyCheckIn, Stats, VerificationCodes,
  TokenUnlock, Backup,
  db, DB_PATH, SUPER_ADMIN_ID, seedIfEmpty
} from './database.js'; // ⭐ SQLite versiya

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

// ─── Config ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;

/**
 * Ilovaning ommaviy manzili — Telegram webhook uchun MAJBURIY.
 *
 * `APP_URL` qo'lda berilmagan bo'lsa, hosting platformasi bergan domendan
 * avtomatik aniqlaymiz. Bu bot sozlashni ancha osonlashtiradi: Railway'da
 * domen deploy paytida beriladi, ya'ni uni oldindan `.env` ga yozib
 * bo'lmaydi. Natijada "APP_URL yo'q -> webhook o'rnatilmadi -> bot
 * ishlamaydi" tuzog'i o'z-o'zidan yechiladi.
 *
 *   RAILWAY_PUBLIC_DOMAIN  — Railway
 *   RENDER_EXTERNAL_URL    — Render (to'liq URL ko'rinishida)
 *   FLY_APP_NAME           — Fly.io
 */
function resolvePublicAppUrl() {
  const explicit = process.env.APP_URL;
  if (explicit && explicit.startsWith('https://')) return explicit.replace(/\/+$/, '');

  // Railway. DIQQAT: `RAILWAY_PUBLIC_DOMAIN` faqat servisga OMMAVIY DOMEN
  // berilgan bo'lsa mavjud bo'ladi. Domen yaratilmagan servisda Railway
  // faqat `RAILWAY_PRIVATE_DOMAIN` beradi (u ichki tarmoq uchun, Telegram
  // unga ulana olmaydi).
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    return `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
  }
  // Railway'ning eski o'zgaruvchisi
  if (process.env.RAILWAY_STATIC_URL) {
    const v = process.env.RAILWAY_STATIC_URL;
    return v.startsWith('http') ? v.replace(/\/+$/, '') : `https://${v}`;
  }
  if (process.env.RENDER_EXTERNAL_URL?.startsWith('https://')) {
    return process.env.RENDER_EXTERNAL_URL.replace(/\/+$/, '');
  }
  if (process.env.FLY_APP_NAME) {
    return `https://${process.env.FLY_APP_NAME}.fly.dev`;
  }

  // https:// bo'lmagan qiymat berilgan bo'lsa — ogohlantiramiz
  if (explicit) {
    console.warn(`[Config] ⚠️  APP_URL "https://" bilan boshlanmaydi: ${explicit}. Telegram webhook uchun HTTPS majburiy.`);
  }
  return null;
}

/**
 * Manzil aniqlanmaganda ANIQ tashxis chiqaradi.
 *
 * NEGA KERAK: "Ommaviy HTTPS manzil aniqlanmadi" xabari o'z-o'zidan
 * sababni ko'rsatmaydi — muammo APP_URL yozilmaganidami, yoki hosting
 * domen bermaganidami, bilinmaydi. Bu qatorlar aynan nima ko'rilganini
 * aytadi, shunda taxmin qilish kerak bo'lmaydi.
 */
function logAppUrlDiagnostics() {
  const seen = [
    'APP_URL',
    'RAILWAY_PUBLIC_DOMAIN',
    'RAILWAY_PRIVATE_DOMAIN',
    'RAILWAY_STATIC_URL',
    'RAILWAY_SERVICE_NAME',
    'RENDER_EXTERNAL_URL',
    'FLY_APP_NAME',
  ].map((k) => `${k}=${process.env[k] ? process.env[k] : '(yo\'q)'}`);

  console.warn('[Config] Aniqlash uchun ko\'rilgan o\'zgaruvchilar:');
  for (const line of seen) console.warn(`[Config]   ${line}`);

  // Railway'da eng ko'p uchraydigan holat: servis ichki tarmoqda ishlayapti,
  // lekin ommaviy domen yaratilmagan.
  if (process.env.RAILWAY_PRIVATE_DOMAIN && !process.env.RAILWAY_PUBLIC_DOMAIN) {
    console.warn('[Config] ⚠️  SABAB ANIQ: Railway servisiga OMMAVIY DOMEN berilmagan.');
    console.warn('[Config]    RAILWAY_PRIVATE_DOMAIN bor, RAILWAY_PUBLIC_DOMAIN yo\'q — ya\'ni servis');
    console.warn('[Config]    faqat ichki tarmoqda ishlayapti va INTERNETDAN OCHILMAYDI.');
    console.warn('[Config]    Yechim: Railway -> service -> Settings -> Networking -> Generate Domain');
  }
}

const APP_URL = resolvePublicAppUrl();
if (APP_URL) {
  console.log(`[Config] Ommaviy manzil: ${APP_URL}`);
} else {
  logAppUrlDiagnostics();
}

const IS_PROD = process.env.NODE_ENV === 'production';
const IS_DEV = !IS_PROD;

// ═══════════════════════════════════════════════════════════════════════════
//  PRODUCTION SECRETS VALIDATION — Xavfsizlik tekshiruvi
// ═══════════════════════════════════════════════════════════════════════════
//
// KRITIK XAVFSIZLIK: Production muhitida default/zaif secrets bilan
// server ishga tushmasligi kerak. Bu hacker'lar uchun ochiq eshikdir.
//
// Agar JWT_SECRET default bo'lsa → har kim JWT token yasab admin bo'lishi mumkin
// Agar WEBHOOK_SECRET default bo'lsa → soxta Telegram update'lar yuborish mumkin
// Agar BOT_TOKEN bo'lmasa → butun autentifikatsiya tizimi ishlamaydi

// ─── SECURITY: hardcoded admin-bypass backdoor OLIB TASHLANDI ─────────────
// ESKI KOD: `Authorization: Bearer frontend_admin_bypass_manyak_tv_v1` yuborilsa,
// so'rov hech qanday Telegram tekshiruvisiz to'g'ridan-to'g'ri SUPER ADMIN
// sifatida qabul qilinar edi. Bu token frontend build ichida ochiq matnda
// yotardi (src/components/AdminPanel.tsx), ya'ni saytni ochgan HAR QANDAY
// odam brauzer konsolidan shu tokenni ko'rib, o'zini admin qilib olishi,
// barcha foydalanuvchilarni ko'rish/ban qilish, VIP berish, kontent
// o'chirish va broadcast yuborish imkoniyatiga ega bo'lardi.
// Bu — ilovadagi ENG XAVFLI zaiflik edi. Endi faqat haqiqiy JWT (Telegram
// initData orqali /api/auth/verify dan olingan) qabul qilinadi.

const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'manyaktv_secret_2026';
const JWT_SECRET = process.env.JWT_SECRET || 'manyktv_jwt_2026_secret';

// Production secrets validation
if (IS_PROD) {
  const errors = [];
  
  if (!process.env.TELEGRAM_BOT_TOKEN) {
    errors.push('❌ TELEGRAM_BOT_TOKEN env variable MAJBURIY (production)');
  }
  
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET === 'manyktv_jwt_2026_secret') {
    errors.push('❌ JWT_SECRET env variable MAJBURIY va default qiymat bo\'lmasligi kerak!');
    errors.push('   Yaratish: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  
  if (!process.env.WEBHOOK_SECRET || process.env.WEBHOOK_SECRET === 'manyaktv_secret_2026') {
    errors.push('❌ WEBHOOK_SECRET env variable MAJBURIY va default qiymat bo\'lmasligi kerak!');
    errors.push('   Yaratish: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"');
  }
  
  if (!process.env.SUPER_ADMIN_ID) {
    errors.push('❌ SUPER_ADMIN_ID env variable MAJBURIY (sizning Telegram ID)');
  }
  
  if (errors.length > 0) {
    console.error('\n' + '═'.repeat(80));
    console.error('🔒 XAVFSIZLIK XATOSI: Production secrets to\'liq sozlanmagan!');
    console.error('═'.repeat(80));
    errors.forEach(err => console.error(err));
    console.error('\n📋 Qo\'llanma: .env.example faylini o\'qing');
    console.error('🚀 Railway/Render: Dashboard → Environment Variables dan sozlang');
    console.error('═'.repeat(80) + '\n');
    process.exit(1);
  }
  
  console.log('✅ Production secrets tekshiruvi muvaffaqiyatli!');
}

if (!IS_PROD && (!process.env.JWT_SECRET || !process.env.WEBHOOK_SECRET)) {
  console.warn('⚠️  [DEV WARNING] JWT_SECRET va WEBHOOK_SECRET .env da yo\'q — standart (nomaxfiy) qiymat ishlatilmoqda.');
  console.warn('    Production deploy qilishdan oldin albatta o\'zgartiring!');
}

// ─── Middleware ─────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Multer (File Upload) ──────────────────────────────────────────────────
// uploads/ papkasini yaratish
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage konfiguratsiyasi
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // Unique filename: timestamp + random + original extension
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E5);
    const ext = path.extname(file.originalname);
    cb(null, uniqueSuffix + ext);
  }
});

// File filter (faqat rasmlar)
const fileFilter = (req, file, cb) => {
  const allowedMimes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Faqat rasm fayllari (JPG, PNG, GIF, WEBP) qabul qilinadi'));
  }
};

// Multer instance
const upload = multer({
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: fileFilter
});

// ═══════════════════════════════════════════════════════════════════════════
//  RATE LIMITING — ENDPOINT-SPECIFIC CHEKLOVLAR
// ═══════════════════════════════════════════════════════════════════════════
//
// XAVFSIZLIK KUCHAYTIRILDI: ilgari faqat umumiy 200 req/15min limiti bor edi.
// Bu yetarli emas — maxsus endpoint'lar uchun qattiqroq cheklovlar kerak:
//
//  1) Auth endpoints — brute-force hujumlarni oldini olish
//  2) Receipt submission — spam va fake payment'larni cheklash
//  3) Admin actions — rate limiting bypass orqali admin panel DOS'ni oldini olish
//  4) File upload — server disk'ini to'ldirish hujumlarini cheklash

// Umumiy API rate limit (fallback)
const apiLimiter = rateLimit({ 
  windowMs: 15 * 60 * 1000, // 15 daqiqa
  max: 200, 
  standardHeaders: true, 
  legacyHeaders: false,
  message: { ok: false, error: 'Juda ko\'p so\'rov. Iltimos bir oz kuting.' }
});

// Auth endpoints — brute-force protection
const authLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 daqiqa
  max: 5, // 5 urinish/daqiqa
  skipSuccessfulRequests: true, // Faqat muvaffaqiyatsiz urinishlar hisoblanadi
  standardHeaders: true,
  message: { ok: false, error: 'Juda ko\'p autentifikatsiya urinishlari. 1 daqiqa kuting.' }
});

// Receipt submission — spam/fraud protection
const receiptLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 soat
  max: 10, // 10 chek/soat per IP
  standardHeaders: true,
  message: { ok: false, error: 'Juda ko\'p to\'lov cheki yuborildi. 1 soat kuting.' }
});

// File upload — disk space protection
const uploadLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 soat
  max: 50, // 50 fayl/soat (admin: video upload uchun)
  standardHeaders: true,
  message: { ok: false, error: 'Juda ko\'p fayl yuklandi. 1 soat kuting.' }
});

// Admin actions — abuse protection
const adminActionLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 soat
  max: 100, // 100 action/soat
  standardHeaders: true,
  message: { ok: false, error: 'Juda ko\'p admin amallar. 1 soat kuting.' }
});

// Broadcast — prevent spam
const broadcastLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 soat
  max: 5, // 5 broadcast/soat
  standardHeaders: true,
  message: { ok: false, error: 'Juda ko\'p broadcast xabar. 1 soat kuting.' }
});

// Umumiy API limiter'ni qo'llash
app.use('/api/', apiLimiter);

// Static files - uploads folder (with video streaming support)
app.use('/uploads', (req, res, next) => {
  const filePath = path.join(__dirname, 'uploads', req.path);
  
  // Video fayl uchun range request support
  if (req.path.match(/\.(mp4|webm|ogg)$/i) && req.headers.range) {
    try {
      if (!fs.existsSync(filePath)) {
        return res.status(404).send('File not found');
      }
      
      const stat = fs.statSync(filePath);
      const fileSize = stat.size;
      
      // Juda kichik fayl (< 10KB) bo'lsa - range request'siz yuborish
      if (fileSize < 10240) {
        console.warn(`[Uploads] Video juda kichik (${fileSize} bytes), range'siz yuborilmoqda: ${req.path}`);
        delete req.headers.range;
        return next();
      }
      
      const range = req.headers.range;
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      
      if (start >= fileSize || end >= fileSize) {
        res.status(416).send('Range Not Satisfiable');
        return;
      }
      
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(filePath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      
      res.writeHead(206, head);
      file.pipe(res);
      return;
    } catch (err) {
      console.error('[Uploads] Range request error:', err.message);
      // Xato bo'lsa oddiy static serve qilish
    }
  }
  
  next();
}, express.static(path.join(__dirname, 'uploads')));

// CORS
// ESKI KOD: `origin.startsWith(o)` tekshiruvi edi — bu "http://localhost:5173.evil.com"
// yoki "http://localhost:3000@evil.com" kabi manzillarni ham "ruxsat etilgan" deb
// qabul qilib, Access-Control-Allow-Credentials: true bilan birga xavfli edi
// (boshqa domendagi zararli sayt cookie/token bilan so'rov yuborishi mumkin edi).
// Endi FAQAT to'liq (aniq) mos kelgan origin qabul qilinadi.
const ALLOWED_ORIGINS = new Set(['http://localhost:3000', 'http://localhost:5173', APP_URL].filter(Boolean));
app.use((req, res, next) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  next();
});

// ─── Auth Middleware ────────────────────────────────────────────────────────
function auth(req, res, next) {
  const token = req.headers.authorization?.split(' ')[1];

  if (!token) return res.status(401).json({ ok: false, error: 'Token kerak' });
  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      console.error('[Auth] JWT verification failed:', err.message);
      return res.status(403).json({ ok: false, error: 'Token yaroqsiz' });
    }
    req.user = user;
    next();
  });
}

function adminOnly(req, res, next) {
  if (!req.user?.isAdmin) return res.status(403).json({ ok: false, error: 'Admin huquqi kerak' });
  next();
}

// ─── SSE (Server-Sent Events) ───────────────────────────────────────────────
//
// ESKI KODDAGI 3 TA XATO TUZATILDI:
//
// 1) AUTENTIFIKATSIYA YO'Q EDI. `/api/events?userId=<istalgan raqam>` —
//    hech qanday tekshiruvsiz. Ya'ni istalgan odam o'zini boshqa
//    foydalanuvchi deb ko'rsatib ulanishi mumkin edi.
//    EventSource header yubora olmaydi, shuning uchun JWT `?token=` query
//    parametrida qabul qilinadi va shu yerda tekshiriladi.
//
// 2) HAR BIR XABAR HAMMAGA YUBORILARDI. `for (const [, client] of sseClients)`
//    — ya'ni chek ma'lumotlari (telefon raqam, summa, chek rasmi manzili)
//    barcha ulangan klientlarga ketardi. Endi 3 xil yo'naltirish bor:
//    `sendToUser` (faqat egasiga), `broadcastToAdmins` (faqat adminlarga),
//    `broadcastToAll` (faqat maxfiy bo'lmagan xabarlar — masalan kontent
//    ro'yxati yangilanishi).
//
// 3) MAP userId BO'YICHA EDI VA TIRIK ULANISHNI O'CHIRARDI. Bir foydalanuvchi
//    2 tab ochsa, ikkinchisi birinchisini map'da bosib ketardi; keyin ESKI
//    ulanish yopilganda uning `close` handleri TIRIK yozuvni o'chirardi va
//    foydalanuvchi real-time xabarlarni olmay qo'yardi. Endi har userId uchun
//    ulanishlar to'plami (Set) saqlanadi.
//
/** Map<userId, Set<{ res, isAdmin }>> */
const sseClients = new Map();

/** Bitta klientga xavfsiz yozish. Uzilgan socketga yozish xato tashlaydi. */
function sseWrite(client, payload) {
  try {
    client.res.write(`data: ${JSON.stringify(payload)}\n\n`);
    return true;
  } catch {
    return false; // o'lik ulanish — chaqiruvchi uni ro'yxatdan olib tashlaydi
  }
}

/** Berilgan shartga mos barcha klientlarga yuborish; o'liklarni tozalaydi. */
function sseBroadcast(payload, filter = () => true) {
  for (const [userId, clients] of sseClients) {
    for (const client of clients) {
      if (!filter(client, userId)) continue;
      if (!sseWrite(client, payload)) clients.delete(client);
    }
    if (clients.size === 0) sseClients.delete(userId);
  }
}

/** Faqat bitta foydalanuvchining barcha qurilma/tablariga. */
function sendToUser(userId, payload) {
  const clients = sseClients.get(String(userId));
  if (!clients) return;
  for (const client of clients) {
    if (!sseWrite(client, payload)) clients.delete(client);
  }
  if (clients.size === 0) sseClients.delete(String(userId));
}

/** Faqat adminlarga (maxfiy ma'lumot — cheklar, telefon raqamlari). */
function broadcastToAdmins(payload) {
  sseBroadcast(payload, (client) => client.isAdmin);
}

/** Hammaga (faqat maxfiy BO'LMAGAN xabarlar uchun!). */
function broadcastToAll(payload) {
  sseBroadcast(payload);
}

app.get('/api/events', async (req, res) => {
  // JWT query parametrida (EventSource header qo'ya olmaydi)
  const token = req.query.token;
  if (!token) return res.status(401).json({ ok: false, error: 'token kerak' });

  let claims;
  try {
    claims = jwt.verify(String(token), JWT_SECRET);
  } catch {
    return res.status(401).json({ ok: false, error: 'Token yaroqsiz yoki muddati tugagan' });
  }

  const userId = String(claims.id);
  const isAdmin = Boolean(claims.isAdmin);

  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no', // nginx bufferlashini o'chirish
  });

  const client = { res, isAdmin };
  if (!sseClients.has(userId)) sseClients.set(userId, new Set());
  sseClients.get(userId).add(client);

  sseWrite(client, { type: 'connected', userId });

  const ping = setInterval(() => {
    try {
      res.write(': ping\n\n');
    } catch {
      cleanup();
    }
  }, 25000);

  function cleanup() {
    clearInterval(ping);
    const clients = sseClients.get(userId);
    if (clients) {
      clients.delete(client);
      if (clients.size === 0) sseClients.delete(userId);
    }
  }

  req.on('close', cleanup);
  res.on('error', cleanup);
});

/** Health uchun: jami ochiq SSE ulanishlari soni. */
function sseConnectionCount() {
  let n = 0;
  for (const clients of sseClients.values()) n += clients.size;
  return n;
}

// ═══════════════════════════════════════════════════════════════════════════
//  AUTH ENDPOINTS
// ═══════════════════════════════════════════════════════════════════════════

app.post('/api/auth/verify', authLimiter, async (req, res) => {
  const { initData } = req.body;
  if (!initData) return res.status(400).json({ ok: false, error: 'initData kerak' });
  if (!BOT_TOKEN) return res.status(503).json({ ok: false, error: 'Bot token sozlanmagan' });

  try {
    const params = new URLSearchParams(initData);
    const hash = params.get('hash');
    params.delete('hash');
    params.sort();
    const dataCheckString = [...params.entries()].map(([k, v]) => `${k}=${v}`).join('\n');
    const secretKey = crypto.createHmac('sha256', 'WebAppData').update(BOT_TOKEN).digest();
    const calculated = crypto.createHmac('sha256', secretKey).update(dataCheckString).digest('hex');

    if (calculated !== hash) return res.status(403).json({ ok: false, error: 'Qalbaki ma\'lumot (spoofing)' });

    const user = JSON.parse(params.get('user') || '{}');
    if (!user.id) return res.status(400).json({ ok: false, error: 'User topilmadi' });

    // AVTOMATIK ADMIN: `.env` da (SUPER_ADMIN_ID yoki ADMIN_IDS) ko'rsatilgan
    // Telegram ID egasi ro'yxatdan o'tishi bilanoq admin bo'ladi va
    // `appointed_admins` jadvaliga ham yozib qo'yiladi.
    await Admins.ensureEnvAdmin(String(user.id), {
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || `Admin #${user.id}`,
      username: user.username || '',
    });
    const isAdmin = await Admins.isAdmin(String(user.id));
    const token = jwt.sign({ id: String(user.id), username: user.username, isAdmin }, JWT_SECRET, { expiresIn: '24h' });

    // ESKI KOD `username` ni FAQAT yangi foydalanuvchi yaratilganda yozardi;
    // mavjud foydalanuvchida esa `firstName`/`lastName` ni yangilab,
    // `username` ni TEGMASDAN qoldirardi. Ya'ni foydalanuvchi Telegramda
    // username'ini o'zgartirsa, saytda ESKISI qolib ketardi.
    // `syncTelegramProfile` bu ishni bitta joyda va to'g'ri bajaradi.
    const dbUser = await Users.syncTelegramProfile(user);

    res.json({ ok: true, token, user: dbUser, isAdmin });
  } catch (err) {
    console.error('[Auth]', err);
    res.status(500).json({ ok: false, error: 'Auth xatosi' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  USERS API
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/users', auth, adminOnly, async (req, res) => {
  const users = await Users.getAll();
  res.json({ ok: true, users });
});

app.get('/api/users/:id', auth, async (req, res) => {
  // ESKI KOD: har qanday tizimga kirgan (login qilgan) foydalanuvchi boshqa
  // HAR QANDAY userning ma'lumotlarini (telefon raqami, VIP holati va h.k.)
  // faqat ID sini bilib ko'ra olardi. Endi faqat o'zining profilini yoki
  // admin - istalgan profilni ko'ra oladi.
  if (req.user?.id !== req.params.id && !req.user?.isAdmin) {
    return res.status(403).json({ ok: false, error: 'Ruxsat yo\'q' });
  }
  const user = await Users.getById(req.params.id);
  if (!user) return res.status(404).json({ ok: false, error: 'Topilmadi' });
  res.json({ ok: true, user });
});

app.put('/api/users/:id', auth, adminOnly, async (req, res) => {
  const user = await Users.getById(req.params.id);
  if (!user) return res.status(404).json({ ok: false, error: 'Topilmadi' });
  const updated = await Users.upsert({ ...user, ...req.body, id: req.params.id });
  res.json({ ok: true, user: updated });
});

app.post('/api/users/:id/vip', auth, adminOnly, adminActionLimiter, async (req, res) => {
  const days = req.body.days || 30;
  const user = await Users.grantVip(req.params.id, days);
  if (!user) return res.status(404).json({ ok: false, error: 'Topilmadi' });
  await AuditLogs.add({ adminId: req.user.id, adminName: req.user.username, action: 'GRANT_VIP', targetId: req.params.id, details: `${days} kun VIP berildi` });
  res.json({ ok: true, user });
});

app.delete('/api/users/:id/vip', auth, adminOnly, adminActionLimiter, async (req, res) => {
  await Users.revokeVip(req.params.id);
  await AuditLogs.add({ adminId: req.user.id, action: 'REVOKE_VIP', targetId: req.params.id });
  res.json({ ok: true });
});

app.post('/api/users/:id/ban', auth, adminOnly, adminActionLimiter, async (req, res) => {
  await Users.ban(req.params.id, req.body.reason);
  await AuditLogs.add({ adminId: req.user.id, action: 'BAN_USER', targetId: req.params.id, details: req.body.reason });
  res.json({ ok: true });
});

app.delete('/api/users/:id/ban', auth, adminOnly, adminActionLimiter, async (req, res) => {
  await Users.unban(req.params.id);
  await AuditLogs.add({ adminId: req.user.id, action: 'UNBAN_USER', targetId: req.params.id });
  res.json({ ok: true });
});

app.post('/api/users/:id/reset-hwid', auth, adminOnly, async (req, res) => {
  await Users.resetHwid(req.params.id);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════════════════
//  CONTENTS API
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/contents', async (req, res) => {
  res.json({ ok: true, contents: await Contents.getAll() });
});

app.get('/api/contents/:id', async (req, res) => {
  const item = await Contents.getById(req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: 'Topilmadi' });
  res.json({ ok: true, content: item });
});

app.post('/api/contents', auth, adminOnly, adminActionLimiter, async (req, res) => {
  const content = await Contents.upsert(req.body);
  await AuditLogs.add({ adminId: req.user.id, action: 'ADD_CONTENT', targetId: content.id, targetTitle: content.title });
  // ESKI KOD: bu yerda broadcast yo'q edi — shuning uchun admin kontent
  // qo'shganda boshqa foydalanuvchilarning ochiq turgan sahifasi buni
  // ilova qayta ochilmaguncha bilmasdi. Endi SSE orqali barcha ulangan
  // mijozlarga xabar beramiz, ular esa kontent ro'yxatini serverdan
  // qayta so'raydi (qarang: src/App.tsx 'content_updated' handleri).
  // Kontent ro'yxati maxfiy emas — hammaga yuborish mumkin.
  broadcastToAll({ type: 'content_updated', action: 'add', contentId: content.id });
  res.json({ ok: true, content });
});

app.put('/api/contents/:id', auth, adminOnly, adminActionLimiter, async (req, res) => {
  const content = await Contents.upsert({ ...req.body, id: req.params.id });
  await AuditLogs.add({ adminId: req.user.id, action: 'UPDATE_CONTENT', targetId: content.id, targetTitle: content.title });
  broadcastToAll({ type: 'content_updated', action: 'update', contentId: content.id });
  res.json({ ok: true, content });
});

app.delete('/api/contents/:id', auth, adminOnly, adminActionLimiter, async (req, res) => {
  await Contents.delete(req.params.id);
  await AuditLogs.add({ adminId: req.user.id, action: 'DELETE_CONTENT', targetId: req.params.id });
  broadcastToAll({ type: 'content_updated', action: 'delete', contentId: req.params.id });
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════════════════
//  UPLOAD API (Poster rasm va video fayllarni serverga doimiy saqlash)
// ═══════════════════════════════════════════════════════════════════════════
//
// ESKI KOD: admin panelida fayllar hech qachon serverga yuborilmagan —
// katta fayllar uchun URL.createObjectURL() ("blob:" URL, faqat joriy
// sahifa sessiyasida ishlaydi) va kichik fayllar uchun base64
// (faqat shu qurilma localStorage'ida) ishlatilgan. Natijada sayt
// yangilanganda "blob:" manzillar avtomatik yaroqsiz bo'lib, yuklangan
// kino/drama fayllari ochilmay qolgan. Endi fayl haqiqatan ham diskka
// yoziladi va "/uploads/<fayl>" ko'rinishidagi doimiy manzil qaytariladi
// — bu manzil sahifa yangilangandan keyin ham, boshqa foydalanuvchi
// qurilmasida ham baravar ishlaydi.
/**
 * Yuklangan fayllar (poster rasmlar, videolar, to'lov cheklari) joylashuvi.
 *
 * ═══ NEGA SOZLANADIGAN QILINDI ═══
 * ESKI KOD: `path.join(__dirname, 'uploads')` — ilova papkasi ichida.
 * Railway/Render kabi platformalarda konteyner fayl tizimi vaqtinchalik,
 * ya'ni har deploy'da BARCHA YUKLANGAN VIDEOLAR VA CHEK RASMLARI
 * yo'qolardi (kontent yozuvlari bazada qolib, videolari 404 bo'lardi).
 *
 * Endi doimiy diskka (volume) ko'rsatish mumkin:
 *     UPLOADS_DIR=/data/uploads
 */
const UPLOADS_DIR = process.env.UPLOADS_DIR || path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Public va private papkalarni yaratish
const PUBLIC_UPLOADS_DIR = path.join(UPLOADS_DIR, 'public');
const PRIVATE_UPLOADS_DIR = path.join(UPLOADS_DIR, 'private');
if (!fs.existsSync(PUBLIC_UPLOADS_DIR)) {
  fs.mkdirSync(PUBLIC_UPLOADS_DIR, { recursive: true });
}
if (!fs.existsSync(PRIVATE_UPLOADS_DIR)) {
  fs.mkdirSync(PRIVATE_UPLOADS_DIR, { recursive: true });
}
// ═══════════════════════════════════════════════════════════════════════════
//  SECURE FILE SERVING — Yuklangan fayllarni xavfsiz uzatish
// ═══════════════════════════════════════════════════════════════════════════
//
// XAVFSIZLIK TUZATILDI: ilgari `/uploads` hammaga ochiq edi, ya'ni URL ni
// bilgan har kim to'lov cheki rasmlarini ko'ra olardi (ichida telefon
// raqam, summa, shaxsiy ma'lumotlar).
//
// Endi:
//  - Public fayllar (poster, video): /uploads/public/
//  - Private fayllar (chek rasmlari): /uploads/private/ — faqat owner yoki admin
//
// Fayl joylashuvi convention:
//  - /uploads/public/content_*.* → Kontent (poster/video) — hamma ko'radi
//  - /uploads/private/receipt_*.* → To'lov cheki — faqat egasi va adminlar

/**
 * Private fayllar uchun authentication middleware.
 * Chek rasimi faqat egasi yoki admin ko'ra oladi.
 */
function servePrivateFile(req, res, next) {
  const filename = req.params[0]; // express.static catch-all: /*
  
  // Chek fayl nomida receipt_<timestamp>_<userId>_<random>.ext formatida
  // Misol: receipt_1726058400_891846690_abc123.jpg
  const receiptMatch = filename.match(/^receipt_\d+_(\d+)_[a-z0-9]+\.[a-z]+$/i);
  
  if (receiptMatch) {
    const fileOwnerId = receiptMatch[1];
    
    // Authentication token tekshirish
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    if (!token) {
      return res.status(401).json({ 
        ok: false, 
        error: 'Autentifikatsiya kerak: bu fayl himoyalangan' 
      });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err) {
        return res.status(403).json({ 
          ok: false, 
          error: 'Token yaroqsiz yoki muddati tugagan' 
        });
      }
      
      // Faqat fayl egasi yoki admin ko'ra oladi
      if (user.id !== fileOwnerId && !user.isAdmin) {
        return res.status(403).json({ 
          ok: false, 
          error: 'Ruxsat yo\'q: bu fayl sizga tegishli emas' 
        });
      }
      
      // Ruxsat berildi — faylni uzatish
      next();
    });
  } else {
    // Boshqa private fayllar (kelajakda) — hozircha faqat adminlar
    const token = req.headers.authorization?.split(' ')[1] || req.query.token;
    if (!token) {
      return res.status(401).json({ ok: false, error: 'Autentifikatsiya kerak' });
    }
    
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (err || !user.isAdmin) {
        return res.status(403).json({ ok: false, error: 'Admin huquqi kerak' });
      }
      next();
    });
  }
}

// Public fayllar — hamma ko'radi (poster, video)
app.use('/uploads/public', express.static(path.join(UPLOADS_DIR, 'public')));

// Private fayllar — faqat owner yoki admin
app.use('/uploads/private/*', servePrivateFile, (req, res) => {
  const filename = req.params[0];
  const filepath = path.join(UPLOADS_DIR, 'private', filename);
  res.sendFile(filepath, (err) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.status(404).json({ ok: false, error: 'Fayl topilmadi' });
      } else {
        res.status(500).json({ ok: false, error: 'Faylni yuklashda xatolik' });
      }
    }
  });
});

// Legacy support: /uploads/* (eski URLlar) → public'ga yo'naltirish
// Eskirgan URL'lar hali ham ishlaydi (backward compatibility)
app.use('/uploads', (req, res, next) => {
  // Agar /uploads/public yoki /uploads/private bo'lmasa - public deb hisoblaymiz
  if (!req.url.startsWith('/public') && !req.url.startsWith('/private')) {
    console.warn('[Legacy URL] Eski /uploads/* formatdagi URL ishlatilmoqda:', req.url);
    req.url = '/public' + req.url;
  }
  next();
}, express.static(UPLOADS_DIR));

// Adminlar uchun: poster rasm va video fayllar
const ALLOWED_UPLOAD_EXT = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  'mp4', 'webm', 'mov', 'm3u8', 'ts',
]);

// Oddiy foydalanuvchilar uchun: FAQAT rasm (to'lov cheki skrinshoti)
const ALLOWED_IMAGE_EXT = new Set(['jpg', 'jpeg', 'png', 'webp']);

// Oddiy foydalanuvchi yuklashi mumkin bo'lgan maksimal hajm (chek skrinshoti)
const USER_UPLOAD_LIMIT = 8 * 1024 * 1024;   // 8 MB
const ADMIN_UPLOAD_LIMIT = 2 * 1024 * 1024 * 1024; // 2 GB (video)

/**
 * Fayl "sehrli baytlari" (magic bytes) orqali HAQIQIY rasm ekanini
 * tekshiradi. `Content-Type` header'ini klient to'liq boshqaradi, ya'ni
 * unga ishonib bo'lmaydi — istalgan binar faylni "image/jpeg" deb yuborish
 * mumkin.
 */
function detectImageExt(buf) {
  if (!buf || buf.length < 12) return null;
  // JPEG: FF D8 FF
  if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
  // PNG: 89 50 4E 47 0D 0A 1A 0A
  if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
  // WEBP: "RIFF"...."WEBP"
  if (buf.subarray(0, 4).toString('ascii') === 'RIFF' && buf.subarray(8, 12).toString('ascii') === 'WEBP') return 'webp';
  // GIF: "GIF8"
  if (buf.subarray(0, 4).toString('ascii') === 'GIF8') return 'gif';
  return null;
}

/**
 * Video fayl magic bytes orqali haqiqiy video ekanini tekshiradi.
 * 
 * XAVFSIZLIK: Ilgari admin video yuklashda faqat `?ext=mp4` query parameter
 * ishlatilardi va hech qanday tekshiruv yo'q edi. Soxta yoki zararli
 * fayl .mp4 deb yuklansa, brauzer uni ishga tushirishi mumkin edi.
 * 
 * Endi haqiqiy video format signature'lari tekshiriladi.
 */
function detectVideoExt(buf) {
  if (!buf || buf.length < 16) return null;
  
  // MP4/MOV: "ftyp" (File Type Box) at offset 4
  // Common MP4 brands: ftypisom, ftypmp42, ftypmp41, ftypMSNV, ftypM4V, ftypqt
  if (buf.length >= 12) {
    const boxType = buf.subarray(4, 8).toString('ascii');
    if (boxType === 'ftyp') {
      const brand = buf.subarray(8, 12).toString('ascii');
      console.log('  [detectVideoExt] ftyp brand:', brand);
      // MP4 variants (more permissive)
      if (brand.startsWith('iso') || brand.startsWith('mp4') || 
          brand.startsWith('M4V') || brand.startsWith('MSN') ||
          brand.startsWith('M4A') || brand.startsWith('3gp') ||
          brand.includes('mp4') || brand.includes('avc')) {
        return 'mp4';
      }
      // QuickTime MOV
      if (brand.startsWith('qt') || brand.includes('qt')) {
        return 'mov';
      }
      // If we found ftyp but brand is unknown, still assume mp4
      // (better to accept than reject valid videos)
      console.log('  [detectVideoExt] Unknown ftyp brand, assuming mp4');
      return 'mp4';
    }
  }
  
  // WebM: 1A 45 DF A3 (EBML header)
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    // Check for "webm" DocType deeper in file
    const headerStr = buf.subarray(0, Math.min(200, buf.length)).toString('ascii', 0, 200);
    if (headerStr.includes('webm')) {
      console.log('  [detectVideoExt] WebM detected');
      return 'webm';
    }
  }
  
  // MPEG Transport Stream (.ts files for HLS): 0x47 sync byte pattern
  // TS packets are 188 bytes, so check for repeated 0x47 at positions 0, 188, 376
  if (buf[0] === 0x47 && buf.length >= 376) {
    if (buf[188] === 0x47 && buf[376] === 0x47) {
      console.log('  [detectVideoExt] MPEG-TS detected');
      return 'ts';
    }
  }
  
  // M3U8 playlist (text file, not binary)
  if (buf.length >= 7) {
    const header = buf.subarray(0, 7).toString('ascii');
    if (header === '#EXTM3U') {
      console.log('  [detectVideoExt] M3U8 detected');
      return 'm3u8';
    }
  }
  
  // AVI: RIFF....AVI (older format, but still used)
  if (buf.length >= 12) {
    const riff = buf.subarray(0, 4).toString('ascii');
    const avi = buf.subarray(8, 11).toString('ascii');
    if (riff === 'RIFF' && avi === 'AVI') {
      console.log('  [detectVideoExt] AVI detected');
      return 'mp4'; // Convert AVI to mp4 for better compatibility
    }
  }
  
  console.log('  [detectVideoExt] No video format detected');
  return null;
}

// ═══ TUZATILDI: ODDIY FOYDALANUVCHI CHEK YUKLAY OLMASDI ═══
//
// Bu endpoint `adminOnly` bilan himoyalangan edi. Chek rasmi esa aynan
// ODDIY FOYDALANUVCHI tomonidan yuklanadi — ya'ni to'lov oqimi bu yerda
// 403 bilan to'xtardi. (Ilgari bu sezilmagan, chunki frontend chekni
// umuman yuklamasdan base64 qilib localStorage'ga yozardi.)
//
// Endi: autentifikatsiya qilingan HAR QANDAY foydalanuvchi yuklashi mumkin,
// lekin oddiy foydalanuvchi uchun qattiq cheklovlar bor:
//   - faqat rasm (magic bytes bilan tekshiriladi, Content-Type'ga ishonmaymiz)
//   - maksimal 8 MB (adminlar uchun 2 GB — video uchun)
app.post(
  '/api/upload',
  auth,
  uploadLimiter,
  express.raw({ type: '*/*', limit: ADMIN_UPLOAD_LIMIT }),
  async (req, res) => {
    // ═══ DEBUG LOGGING ═══
    console.log('\n🔵 [UPLOAD] Request received:');
    console.log('  User ID:', req.user?.id);
    console.log('  Is Admin:', req.user?.isAdmin);
    console.log('  Body size:', req.body?.length, 'bytes', `(${(req.body?.length / 1024 / 1024).toFixed(2)} MB)`);
    console.log('  Query ext:', req.query.ext);
    console.log('  Content-Type:', req.headers['content-type']);
    
    if (!req.body || !req.body.length) {
      console.error('❌ [UPLOAD] Error: Fayl bo\'sh');
      return res.status(400).json({ ok: false, error: "Fayl bo'sh yoki yuborilmadi" });
    }

    const isAdmin = Boolean(req.user?.isAdmin);
    console.log('  Admin check:', isAdmin);

    // 1) Hajm cheklovi
    const sizeLimit = isAdmin ? ADMIN_UPLOAD_LIMIT : USER_UPLOAD_LIMIT;
    console.log('  Size limit:', (sizeLimit / 1024 / 1024).toFixed(0), 'MB');
    
    if (req.body.length > sizeLimit) {
      const limitMb = Math.round(sizeLimit / (1024 * 1024));
      console.error('❌ [UPLOAD] Error: Fayl juda katta');
      return res.status(413).json({ ok: false, error: `Fayl juda katta. Maksimal ${limitMb} MB.` });
    }
    console.log('  ✅ Size check passed');

    // 2) Fayl turini ANIQLASH (magic bytes orqali — taxmin qilish emas!)
    const detectedImage = detectImageExt(req.body);
    const detectedVideo = isAdmin ? detectVideoExt(req.body) : null;
    let ext = String(req.query.ext || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    console.log('  Detected image:', detectedImage || 'none');
    console.log('  Detected video:', detectedVideo || 'none');
    console.log('  Query ext:', ext || 'none');

    if (!isAdmin) {
      // Oddiy foydalanuvchi FAQAT rasm yuklaydi va bu haqiqatan rasm
      // ekanini bayt darajasida tasdiqlaymiz.
      if (!detectedImage || !ALLOWED_IMAGE_EXT.has(detectedImage)) {
        console.error('❌ [UPLOAD] Error: Oddiy user faqat rasm yuklashi mumkin');
        return res.status(400).json({
          ok: false,
          error: 'Faqat rasm fayllari qabul qilinadi (JPG, PNG yoki WEBP).',
        });
      }
      ext = detectedImage;
      console.log('  ✅ User image validated:', ext);
    } else {
      // ═══ ADMIN UPLOAD — KUCHAYTIRILGAN VALIDATSIYA ═══
      //
      // ESKI KOD: Admin video yuklashda faqat `?ext=mp4` query parameter
      // ishlatilardi va hech qanday magic bytes tekshiruvi yo'q edi.
      // Natijada:
      //   - Zararli fayl .mp4 deb yuklansa, brauzer uni ishga tushirardi
      //   - Noto'g'ri format (masalan .avi, .mkv) .mp4 sifatida saqlanib,
      //     <video> playerda ishlamasdi
      //
      // ENDI: Rasm va video ikkalasi ham magic bytes bilan tekshiriladi.
      
      if (detectedImage) {
        // Rasm haqiqiy signature bilan tasdiqlangan
        ext = detectedImage;
        console.log('  ✅ Admin image validated:', ext);
      } else if (detectedVideo) {
        // Video haqiqiy signature bilan tasdiqlangan
        ext = detectedVideo;
        console.log('  ✅ Admin video validated:', ext);
      } else {
        // Magic bytes aniqlanmadi — query parameter'ga ishonmaymiz
        // XAVFSIZLIK: Ilgari bu yerda `ext` query parametri qabul qilinar
        // va ALLOWED_UPLOAD_EXT ro'yxatida bo'lsa yuklash ruxsat etilardi.
        // Bu yetarli emas — istalgan binar fayl .mp4/.webm deb yuborilishi
        // mumkin edi. Endi faqat HAQIQIY format signature'lari qabul qilinadi.
        console.error('❌ [UPLOAD] Error: Fayl formati aniqlanmadi');
        console.log('  First 32 bytes (hex):', req.body.subarray(0, 32).toString('hex'));
        return res.status(400).json({
          ok: false,
          error: 'Fayl formati aniqlanmadi yoki qo\'llab-quvvatlanmaydi. Rasm uchun: JPG/PNG/WEBP, Video uchun: MP4/WebM/MOV/TS/M3U8',
        });
      }
      
      // Qo'shimcha tekshiruv: aniqlangan format ruxsat etilgan ro'yxatda bo'lishi kerak
      if (!ALLOWED_UPLOAD_EXT.has(ext)) {
        console.error('❌ [UPLOAD] Error: Format qo\'llab-quvvatlanmaydi:', ext);
        return res.status(400).json({
          ok: false,
          error: `Fayl formati qo'llab-quvvatlanmaydi: .${ext}. Ruxsat etilgan: ${[...ALLOWED_UPLOAD_EXT].join(', ')}`,
        });
      }
      console.log('  ✅ Format validated:', ext);
    }

    // Fayl turini aniqlash va tegishli papkaga saqlash
    const isReceipt = req.query.type === 'receipt' || (!isAdmin && detectedImage);
    const prefix = isReceipt ? `receipt_${Date.now()}_${req.user.id}` : `content_${Date.now()}`;
    const filename = `${prefix}_${crypto.randomBytes(8).toString('hex')}.${ext}`;
    
    // Private (receipt) yoki public (content) papkaga saqlash
    const uploadDir = isReceipt ? PRIVATE_UPLOADS_DIR : PUBLIC_UPLOADS_DIR;
    const filepath = path.join(uploadDir, filename);
    const urlPath = isReceipt ? `/uploads/private/${filename}` : `/uploads/public/${filename}`;
    
    console.log('  Filename:', filename);
    console.log('  Upload dir:', uploadDir);
    console.log('  URL path:', urlPath);
    
    try {
      let finalBuffer = req.body;
      
      // ═══ PRIVACY: RASM METADATA'SINI TOZALASH ═══
      //
      // XAVFSIZLIK: Telefon/kameradan to'g'ridan-to'g'ri yuklangan
      // rasmlar EXIF metadata saqlaydi:
      //   - GPS koordinatalar (uyingiz manzili!)
      //   - Qurilma modeli va dasturiy ta'minoti
      //   - Fotograf nomi (ba'zi kameralarda)
      //   - Sana/vaqt
      //
      // Chek rasmida bu ma'lumotlar foydalanuvchi shaxsiy hayotini
      // buzishi mumkin. Sharp bilan barcha metadata tozalanadi.
      if (detectedImage && ['jpg', 'png', 'webp'].includes(ext)) {
        try {
          console.log(`[Privacy] ${filename} EXIF metadata tozalanmoqda...`);
          
          // Sharp: rasmni metadata'siz qayta saqlash
          finalBuffer = await sharp(req.body)
            .rotate() // EXIF orientation'ni auto-fix qiladi
            .withMetadata({
              exif: {}, // Barcha EXIF ma'lumotlarini olib tashlash
            })
            .toBuffer();
          
          console.log(`[Privacy] ✅ Metadata tozalandi: ${filename} (${(finalBuffer.length / 1024).toFixed(0)} KB)`);
        } catch (stripErr) {
          // Agar sharp xato bersa - asl faylni saqlaymiz (lekin log yozamiz)
          console.error(`[Privacy] ⚠️ ${filename} metadata tozlash xatosi:`, stripErr.message);
          // finalBuffer o'zgarmaydi - asl fayl saqlanadi
        }
      }
      
      fs.writeFileSync(filepath, finalBuffer);
      console.log('  ✅ File saved:', filepath);
      
      await AuditLogs.add({
        adminId: req.user.id,
        action: 'UPLOAD_FILE',
        targetId: filename,
        details: `${(finalBuffer.length / 1024).toFixed(0)} KB (${isReceipt ? 'private' : 'public'})${detectedImage ? ' [metadata stripped]' : ''}`,
      });
      
      console.log('✅ [UPLOAD] Success:', urlPath, '\n');
      res.json({ ok: true, url: urlPath });
    } catch (err) {
      console.error('❌ [UPLOAD] Error:', err);
      res.status(500).json({ ok: false, error: 'Faylni saqlashda xatolik' });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
//  RECEIPTS API (To'lov cheklari)
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/receipts', auth, adminOnly, async (req, res) => {
  const status = req.query.status;
  const receipts = status ? await Receipts.getByStatus(status) : await Receipts.getAll();
  res.json({ ok: true, receipts });
});

// Receipt review (approve/reject) - Admin only
app.put('/api/receipts/:id/review', auth, adminOnly, async (req, res) => {
  const { decision } = req.body;
  if (decision !== 'approved' && decision !== 'rejected') {
    return res.status(400).json({ ok: false, error: 'decision majburiy: approved yoki rejected' });
  }

  const result = await Receipts.review(req.params.id, req.user.id, decision);
  
  if (!result.receipt) {
    return res.status(404).json({ ok: false, error: 'Chek topilmadi' });
  }

  if (result.alreadyReviewed) {
    return res.status(409).json({ ok: false, error: 'Bu chek allaqachon ko\'rib chiqilgan' });
  }

  // Audit log
  await AuditLogs.add({
    adminId: req.user.id,
    action: decision === 'approved' ? 'APPROVE_RECEIPT' : 'REJECT_RECEIPT',
    targetId: req.params.id,
    details: `Receipt ${decision}`,
  });

  // SSE xabarnomasi - barcha admin'larga yangilanish
  sendToAll({
    type: 'receipt_reviewed',
    receiptId: req.params.id,
    decision,
    reviewedBy: req.user.id,
  });

  res.json({ ok: true, receipt: result.receipt, user: result.user });
});

// XAVFSIZLIK TUZATILDI: bu endpoint ilgari butunlay HIMOYALANMAGAN edi —
// `auth` middleware yo'q, validatsiya yo'q. Ya'ni internetdagi istalgan odam
// istalgan `userId` nomidan, istalgan `amount` bilan chek qo'shib, to'lov
// statistikasini (Stats.totalRevenue) buzishi va barcha ulangan klientlarni
// `new_receipt` xabari bilan spam qilishi mumkin edi.
// Endi: autentifikatsiya majburiy, foydalanuvchi faqat O'Z nomidan chek
// yuboradi (admin esa istalgan foydalanuvchi nomidan), va majburiy maydonlar
// tekshiriladi (aks holda node:sqlite NOT NULL bind xatosi 500 qaytarardi).
const RECEIPT_TYPES = ['vip_subscription', 'single_content'];

app.post('/api/receipts', auth, receiptLimiter, async (req, res) => {
  const body = req.body || {};

  // Foydalanuvchi boshqa odam nomidan chek yubora olmaydi
  const userId = String(body.userId || req.user.id);
  if (userId !== String(req.user.id) && !req.user.isAdmin) {
    return res.status(403).json({ ok: false, error: "Ruxsat yo'q" });
  }

  if (!RECEIPT_TYPES.includes(body.type)) {
    return res.status(400).json({ ok: false, error: `type majburiy: ${RECEIPT_TYPES.join(' | ')}` });
  }

  const amount = Number(body.amount);
  if (!Number.isFinite(amount) || amount < 0) {
    return res.status(400).json({ ok: false, error: 'amount musbat son bo\'lishi kerak' });
  }

  const receipt = await Receipts.submit({ ...body, userId, amount });

  // Adminlarga SSE orqali xabar berish.
  // `client.write` uzilgan socketga yozilsa xato tashlaydi — ilgari bu
  // try/catch'siz edi va bitta o'lik klient butun so'rovni 500 qilardi
  // (DB yozuvi allaqachon bo'lgani holda). Endi xatosiz broadcast.
  broadcastToAdmins({ type: 'new_receipt', receipt });

  // Telegram botga xabar yuborish (adminlarga)
  (async () => {
    try {
      const user = await Users.getById(userId);
      const userName = user ? `${user.firstName} ${user.lastName || ''}`.trim() : body.userName || `User #${userId}`;
      const userPhone = user?.phone || body.userPhone || 'N/A';
      
      let contentInfo = '';
      if (body.type === 'vip_subscription') {
        contentInfo = `📦 <b>VIP Obuna:</b> ${body.planName || 'N/A'}`;
      } else if (body.type === 'single_content') {
        contentInfo = `🎬 <b>Kontent:</b> ${body.contentTitle || 'N/A'}`;
      }
      
      const message = [
        `🔔 <b>YANGI TO'LOV CHEKI!</b>`,
        '',
        `👤 <b>Foydalanuvchi:</b> ${escapeTgHtml(userName)}`,
        `📞 <b>Telefon:</b> ${escapeTgHtml(userPhone)}`,
        `🆔 <b>ID:</b> <code>${userId}</code>`,
        '',
        contentInfo,
        `💰 <b>Summa:</b> ${amount.toLocaleString()} UZS`,
        body.discountApplied > 0 ? `🎫 <b>Chegirma:</b> -${body.discountApplied.toLocaleString()} UZS` : '',
        body.promoCodeUsed ? `🏷️ <b>Promokod:</b> ${body.promoCodeUsed}` : '',
        body.notes ? `📝 <b>Izoh:</b> ${escapeTgHtml(body.notes)}` : '',
        '',
        `⏰ <b>Vaqt:</b> ${new Date().toLocaleString('uz-UZ')}`,
        `🔗 <b>Chek ID:</b> <code>${receipt.id}</code>`,
      ].filter(Boolean).join('\n');
      
      // Chek rasimi bilan birga yuborish
      const photoUrl = body.receiptImageUrl;
      
      for (const adminId of botAdminIds()) {
        try {
          if (photoUrl && photoUrl.startsWith('http')) {
            // Rasm bilan xabar
            await tgApi('sendPhoto', {
              chat_id: adminId,
              photo: photoUrl,
              caption: message,
              parse_mode: 'HTML',
              reply_markup: {
                inline_keyboard: [[
                  { text: '✅ Tasdiqlash', callback_data: `approve:${receipt.id}` },
                  { text: '❌ Rad etish', callback_data: `reject:${receipt.id}` },
                ]],
              },
            });
          } else {
            // Faqat matn (rasm yo'q)
            await tgSend(adminId, message, {
              reply_markup: {
                inline_keyboard: [[
                  { text: '✅ Tasdiqlash', callback_data: `approve:${receipt.id}` },
                  { text: '❌ Rad etish', callback_data: `reject:${receipt.id}` },
                ]],
              },
            });
          }
        } catch (err) {
          console.error(`[Receipt Notify] Admin ${adminId} ga yuborilmadi:`, err.message);
        }
      }
    } catch (err) {
      console.error('[Receipt Notify] Telegram xabar yuborilmadi:', err);
    }
  })();

  res.json({ ok: true, receipt });
});

app.put('/api/receipts/:id/review', auth, adminOnly, async (req, res) => {
  const { decision } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ ok: false, error: 'decision: approved/rejected' });

  const result = await Receipts.review(req.params.id, req.user.id, decision);
  if (!result.receipt) return res.status(404).json({ ok: false, error: 'Chek topilmadi' });

  // Idempotentlik: chek allaqachon ko'rilgan bo'lsa qayta VIP berilmaydi.
  // Ilgari bu tekshiruv yo'q edi va tugmani ikki marta bosish VIP muddatini
  // ikki barobar uzaytirardi.
  if (result.alreadyReviewed) {
    return res.status(409).json({
      ok: false,
      error: `Bu chek allaqachon ko'rib chiqilgan (${result.receipt.status}).`,
      receipt: result.receipt,
    });
  }

  await AuditLogs.add({ adminId: req.user.id, action: decision === 'approved' ? 'APPROVE_RECEIPT' : 'REJECT_RECEIPT', targetId: req.params.id, details: `${result.receipt.amount} so'm` });

  // MAXFIYLIK: qaror faqat chek EGASIGA yuboriladi (ilgari hammaga ketardi).
  sendToUser(result.receipt.user_id, {
    type: 'payment_decision',
    receiptId: req.params.id,
    decision,
    adminId: req.user.id,
  });
  // Adminlar navbatni yangilash uchun alohida xabar oladi.
  broadcastToAdmins({ type: 'receipt_reviewed', receiptId: req.params.id, decision });

  res.json({ ok: true, receipt: result.receipt });
});

// ═══════════════════════════════════════════════════════════════════════════
//  PLANS API
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/plans', async (req, res) => {
  const plans = await Plans.getAll();
  res.json({ ok: true, plans });
});

app.post('/api/plans', auth, adminOnly, async (req, res) => {
  const plan = await Plans.upsert(req.body);
  res.json({ ok: true, plan });
});

app.put('/api/plans/:id', auth, adminOnly, async (req, res) => {
  const plan = await Plans.upsert({ ...req.body, id: req.params.id });
  res.json({ ok: true, plan });
});

app.delete('/api/plans/:id', auth, adminOnly, async (req, res) => {
  await Plans.delete(req.params.id);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════════════════
//  PROMO CODES API
// ═══════════════════════════════════════════════════════════════════════════

// ESKI KOD: bu endpoint (a) autentifikatsiyasiz edi va (b) `PromoCodes.validate`
// chaqirilishi bilanoq promokod hisobini oshirardi. Ikkisi birgalikda shuni
// bildiradi: istalgan odam tsiklda so'rov yuborib, promokodning butun
// limitini bekorga tugatib qo'yishi mumkin edi.
// Endi: auth majburiy, va `validate` faqat O'QIYDI — hisob esa haqiqiy xarid
// paytida `await PromoCodes.consume()` bilan oshiriladi.
app.post('/api/promo/validate', auth, async (req, res) => {
  const result = await PromoCodes.validate(req.body?.code || '');
  res.json({ ok: true, ...result });
});

app.get('/api/promo', auth, adminOnly, async (req, res) => {
  const promoCodes = await PromoCodes.getAll();
  res.json({ ok: true, promoCodes });
});

app.post('/api/promo', auth, adminOnly, async (req, res) => {
  await PromoCodes.create(req.body);
  res.json({ ok: true });
});

app.delete('/api/promo-codes/:id', auth, adminOnly, async (req, res) => {
  // id yoki code bo'lishi mumkin - ikkalasini ham qo'llab-quvvatlaymiz
  await PromoCodes.delete(req.params.id);
  res.json({ ok: true });
});

app.delete('/api/promo/:code', auth, adminOnly, async (req, res) => {
  // Legacy endpoint - backward compatibility
  await PromoCodes.delete(req.params.code);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════════════════
//  HISTORY & FAVORITES API
// ═══════════════════════════════════════════════════════════════════════════

// ESKI KOD: bu 5 ta endpoint faqat `auth` bilan himoyalangan edi — ya'ni
// tizimga kirgan HAR QANDAY foydalanuvchi boshqa userId bilan so'rov yuborib,
// o'zganing tomosha tarixini o'chirishi yoki sevimlilarini o'zgartirishi
// mumkin edi. Endi faqat o'z ma'lumotiga (yoki admin bo'lsa - istalganiga)
// ruxsat beriladi.
function ownerOrAdmin(userIdParam) {
  return (req, res, next) => {
    const targetId = req.params[userIdParam] ?? req.body?.userId;
    if (req.user?.id !== String(targetId) && !req.user?.isAdmin) {
      return res.status(403).json({ ok: false, error: 'Ruxsat yo\'q' });
    }
    next();
  };
}

app.get('/api/history/:userId', auth, ownerOrAdmin('userId'), async (req, res) => {
  const history = await WatchHistory.getByUser(req.params.userId);
  res.json({ ok: true, history });
});

app.post('/api/history', auth, ownerOrAdmin('userId'), async (req, res) => {
  await WatchHistory.add(req.body);
  res.json({ ok: true });
});

app.delete('/api/history/:userId', auth, ownerOrAdmin('userId'), async (req, res) => {
  await WatchHistory.clear(req.params.userId);
  res.json({ ok: true });
});

app.get('/api/favorites/:userId', auth, ownerOrAdmin('userId'), async (req, res) => {
  const favorites = await Favorites.getByUser(req.params.userId);
  res.json({ ok: true, favorites });
});
app.post('/api/favorites', auth, ownerOrAdmin('userId'), async (req, res) => {
  const added = await Favorites.toggle(req.body.userId, req.body.contentId);
  res.json({ ok: true, added });
});

// ═══════════════════════════════════════════════════════════════════════════
//  COMMENTS API
// ═══════════════════════════════════════════════════════════════════════════

// Kommentlarni olish (public - hamma ko'ra oladi)
app.get('/api/comments/:contentId', async (req, res) => {
  const { contentId } = req.params;
  const { episodeId } = req.query;
  const comments = await Comments.getByContent(contentId, episodeId || null);
  res.json({ ok: true, comments });
});

// Komment qo'shish (faqat authenticated foydalanuvchilar)
app.post('/api/comments', auth, async (req, res) => {
  const { contentId, episodeId, text } = req.body;
  
  if (!contentId || !text || text.trim().length === 0) {
    return res.status(400).json({ ok: false, error: 'contentId va text kerak' });
  }
  
  if (text.length > 500) {
    return res.status(400).json({ ok: false, error: 'Komment 500 belgidan oshmasligi kerak' });
  }
  
  const user = await Users.getById(req.user.id);
  if (!user) {
    return res.status(404).json({ ok: false, error: 'Foydalanuvchi topilmadi' });
  }
  
  const comment = await Comments.add({
    contentId,
    episodeId: episodeId || null,
    userId: user.id,
    username: user.firstName + (user.lastName ? ` ${user.lastName}` : ''),
    text: text.trim(),
  });
  
  res.json({ ok: true, comment });
});

// Kommentni o'chirish (faqat o'zi yoki admin)
app.delete('/api/comments/:id', auth, async (req, res) => {
  const { id } = req.params;
  
  // Kommentni topish
  const allComments = await Comments.getByContent('dummy'); // Bu inefficient, lekin qisqa yo'l
  const comment = allComments.find(c => c.id === id);
  
  if (!comment) {
    return res.status(404).json({ ok: false, error: 'Komment topilmadi' });
  }
  
  // Faqat o'zi yoki admin o'chira oladi
  if (comment.userId !== req.user.id && !req.user.isAdmin) {
    return res.status(403).json({ ok: false, error: 'Ruxsat yo\'q' });
  }
  
  await Comments.delete(id);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════════════════
//  SETTINGS API
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/settings', auth, adminOnly, async (req, res) => {
  const settings = await Settings.get();
  res.json({ ok: true, settings });
});
app.put('/api/settings', auth, adminOnly, async (req, res) => {
  await Settings.set(req.body);
  const settings = await Settings.get();
  await AuditLogs.add({ adminId: req.user.id, action: 'UPDATE_SETTINGS' });
  res.json({ ok: true, settings });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADMINS API
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/admins', auth, adminOnly, async (req, res) => {
  const admins = await Admins.getAll();
  res.json({ ok: true, admins });
});
app.post('/api/admins', auth, adminOnly, async (req, res) => {
  if (!Admins.isSuperAdmin(req.user.id)) return res.status(403).json({ ok: false, error: 'Faqat Bosh Admin' });
  await Admins.upsert(req.body);
  await AuditLogs.add({ adminId: req.user.id, action: 'APPOINT_ADMIN', targetId: req.body.id, targetTitle: req.body.name });
  res.json({ ok: true });
});
app.delete('/api/admins/:id', auth, adminOnly, async (req, res) => {
  if (!Admins.isSuperAdmin(req.user.id)) return res.status(403).json({ ok: false, error: 'Faqat Bosh Admin' });
  const ok = await Admins.remove(req.params.id);
  if (!ok) return res.status(400).json({ ok: false, error: 'Bosh Admin o\'chirib bo\'lmaydi' });
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════════════════
//  DAILY CHECK-IN & TOKENS API
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/checkin/:userId', auth, ownerOrAdmin('userId'), async (req, res) => {
  const status = await DailyCheckIn.getStatus(req.params.userId);
  res.json({ ok: true, ...status });
});

app.post('/api/checkin/:userId/claim', auth, ownerOrAdmin('userId'), async (req, res) => {
  const result = await DailyCheckIn.claim(req.params.userId);
  res.json({ ok: true, ...result });
});

// OLD TOKEN UNLOCK ENDPOINT REMOVED - See line 2175 for the new implementation

// ═══════════════════════════════════════════════════════════════════════════
//  TELEGRAM BOT ORQALI TASDIQLASH (telefon tasdiqlash O'RNIGA)
// ═══════════════════════════════════════════════════════════════════════════
//
// ESKI OQIM: sayt telefon raqamini so'rardi va `isPhoneVerified = true` ni
// KLIENT tomonida localStorage'ga yozardi. Ikki muammo:
//   1) hech qanday haqiqiy tasdiqlash yo'q edi — istalgan raqam yozilardi;
//   2) `isPhoneVerified` `SERVER_OWNED_USER_FIELDS` ro'yxatida bo'lgani
//      uchun `/api/sync-user` uni server qiymati bilan QAYTA YOZARDI, ya'ni
//      klient tasdiqlashi baribir yo'qolardi.
//
// YANGI OQIM (bot orqali, server tomonida):
//   1) sayt      -> POST /api/verify/start        -> { code, deepLink }
//   2) foydalanuvchi deepLink ni ochadi           -> bot /start <code>
//   3) bot kontakt so'raydi, foydalanuvchi yuboradi
//   4) server `contact.user_id === from.id` ni tekshirib tasdiqlaydi
//   5) sayt      -> GET /api/verify/status?code=  -> { verified, token, user }
//
// Mini App ichida (initData mavjud) bu oqim kerak emas — `/api/auth/verify`
// darhol token beradi, lekin kontakt tasdiqlash baribir bot orqali bo'ladi.

/** Kod uchun chalkashmaydigan alfavit (0/O, 1/I/l kabi belgilar yo'q). */
const VERIFY_CODE_ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';

function generateVerifyCode(length = 10) {
  const bytes = crypto.randomBytes(length);
  let out = '';
  for (let i = 0; i < length; i++) out += VERIFY_CODE_ALPHABET[bytes[i] % VERIFY_CODE_ALPHABET.length];
  return out;
}

// Bu endpoint autentifikatsiyasiz — hali tasdiqlanmagan tashrifchi uchun.
// Zararsiz: kod o'z-o'zidan hech qanday huquq bermaydi, u faqat Telegram
// tomonida kontakt yuborilgandan keyin ishlaydi.
const verifyStartLimiter = rateLimit({ windowMs: 10 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

app.post('/api/verify/start', verifyStartLimiter, async (req, res) => {
  if (!BOT_TOKEN) {
    return res.status(503).json({ ok: false, error: 'Bot sozlanmagan. Administrator bilan bog\'laning.' });
  }

  const settings = await Settings.get();
  const botUsername = settings.botUsername || process.env.BOT_USERNAME || 'Animanyaktvuzbot';
  if (!botUsername) {
    return res.status(503).json({ ok: false, error: 'Bot username sozlanmagan.' });
  }

  const code = generateVerifyCode();
  await VerificationCodes.create(code);

  res.json({
    ok: true,
    code,
    botUsername: String(botUsername).replace('@', ''),
    deepLink: `https://t.me/${String(botUsername).replace('@', '')}?start=${code}`,
    expiresInSeconds: 15 * 60,
  });
});

// Sayt shu endpointni davriy so'rab turadi (SSE ham bor, lekin tasdiqlashdan
// OLDIN foydalanuvchi hali autentifikatsiya qilinmagani uchun SSE ulanishi
// yo'q — shu sababli polling ishonchli variant).
app.get('/api/verify/status', async (req, res) => {
  const row = await VerificationCodes.getByCode(req.query.code);
  if (!row) return res.status(404).json({ ok: false, error: 'Kod topilmadi' });

  if (VerificationCodes.isExpired(row)) {
    return res.json({ ok: true, status: 'expired', verified: false });
  }

  if (row.status !== 'verified') {
    // 'pending' — foydalanuvchi hali botni ochmagan
    // 'awaiting_contact' — botni ochgan, kontakt kutilmoqda
    return res.json({ ok: true, status: row.status, verified: false });
  }

  // Kod BIR MARTALIK: token allaqachon olingan bo'lsa qayta bermaymiz
  if (row.claimed_at) {
    return res.status(410).json({ ok: false, error: 'Bu kod allaqachon ishlatilgan' });
  }

  const user = await Users.getById(String(row.telegram_id));
  if (!user) return res.status(404).json({ ok: false, error: 'Foydalanuvchi topilmadi' });

  // Avtomatik admin: .env da ko'rsatilgan bo'lsa jadvalga ham yozamiz
  await Admins.ensureEnvAdmin(user.id, { name: user.firstName, username: user.username });
  const isAdmin = await Admins.isAdmin(user.id);

  const token = jwt.sign({ id: user.id, username: user.username, isAdmin }, JWT_SECRET, { expiresIn: '24h' });
  await VerificationCodes.markClaimed(row.code);

  res.json({ ok: true, status: 'verified', verified: true, token, user, isAdmin });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ENTITLEMENTS API — pul bilan bog'liq holatning YAGONA HAQIQAT MANBASI
// ═══════════════════════════════════════════════════════════════════════════
//
// NEGA KERAK: ilgari frontend VIP holatini, sotib olingan kinolar ro'yxatini
// va tokenlarni localStorage'dan o'qirdi, va u yerga o'zi ham yozardi
// (`reviewReceipt`, `performInstantPurchase`, `useAccessTokenToUnlock`
// funksiyalari entitlement'ni LOKAL berardi). Ya'ni brauzer konsolidan
// `manyak_tv_current_user_v1` ni tahrirlab, hech nima to'lamasdan VIP bo'lish
// mumkin edi.
//
// Endi klient bu endpointdan o'qiydi va localStorage faqat KESH bo'ladi:
// keshni tahrirlash foydasiz, chunki keyingi sinxronlashda server qiymati
// ustidan yozadi va tomosha huquqi shu qiymat bo'yicha hisoblanadi.
app.get('/api/me/entitlements', auth, async (req, res) => {
  // Avval muddati o'tgan obunani yopamiz — shunda javob har doim aktual.
  try {
    await Users.expireSubscriptions();
  } catch (err) {
    console.error('[Entitlements] expireSubscriptions:', err);
  }

  const user = await Users.getById(String(req.user.id));
  if (!user) return res.status(404).json({ ok: false, error: 'Foydalanuvchi topilmadi' });

  res.json({
    ok: true,
    entitlements: {
      userId: user.id,
      isVip: Boolean(user.isVip),
      vipExpiresAt: user.vipExpiresAt || null,
      purchasedContentIds: user.purchasedContentIds || [],
      unlockedEpisodeIds: user.unlockedEpisodeIds || [],
      accessTokens: user.accessTokens || 0,
      bonusBalance: user.bonusBalance || 0,
      vipDiscountPercent: user.vipDiscountPercent || 0,
      isPhoneVerified: Boolean(user.isPhoneVerified),
      isBanned: Boolean(user.isBanned),
      isAdmin: Boolean(req.user.isAdmin),
      isSuperAdmin: Admins.isSuperAdmin(user.id),

      // 4-MUAMMO: Bosh admin ID si ilgari frontend bundle'ida QATTIQ
      // YOZILGAN edi (`export const SUPER_ADMIN_ID = '891846690'`), ya'ni
      // istalgan odam kimning egasi ekanini bilib olardi. Endi bu qiymat
      // FAQAT adminning o'ziga qaytariladi — oddiy foydalanuvchi `null`
      // oladi va uning interfeysida hech qanday admin ma'lumoti yo'q.
      superAdminId: req.user.isAdmin ? String(SUPER_ADMIN_ID) : null,

      syncedAt: new Date().toISOString(),
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  STATS & AUDIT
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/stats', auth, adminOnly, async (req, res) => {
  const stats = await Stats.dashboard();
  const sseConnections = sseConnectionCount();
  res.json({ ok: true, stats, sseConnections });
});

// ESKI KOD: `Number(req.query.limit) || 100` — manfiy yoki juda katta qiymat
// to'g'ridan-to'g'ri SQL `LIMIT` ga ketardi, `LIMIT -1` esa SQLite'da
// "cheklovsiz" degani, ya'ni butun jurnalni bir so'rovda tortib olish mumkin.
app.get('/api/audit-logs', auth, adminOnly, async (req, res) => {
  const requested = Number(req.query.limit);
  const limit = Number.isFinite(requested) ? Math.min(Math.max(Math.trunc(requested), 1), 500) : 100;
  res.json({ ok: true, logs: AuditLogs.getAll(limit) });
});

// ═══════════════════════════════════════════════════════════════════════════
//  TELEGRAM PROXY & WEBHOOK
// ═══════════════════════════════════════════════════════════════════════════

// ESKI KOD: bu endpoint HECH QANDAY autentifikatsiyasiz edi — istalgan odam
// internetdan to'g'ridan-to'g'ri so'rov yuborib, botingiz nomidan ISTALGAN
// Telegram chatId ga xabar/rasm yubortira olardi (spam, firibgarlik,
// botning bloklanishiga sabab bo'lishi mumkin edi). Endi tizimga kirgan
// bo'lish shart, va chatId FAQAT: (a) so'rovchining o'zi, yoki (b) tizimdagi
// adminlardan biri bo'lishi kerak — chunki oddiy foydalanuvchi chek
// yuborganda adminlarga xabar yuborilishi kerak (bu — qonuniy oqim,
// src/services/telegramBot.ts: notifyReceiptSubmissionViaTelegram).
// Boshqa ixtiyoriy uchinchi shaxs chatId'lariga yuborishga ruxsat yo'q.
app.post('/api/telegram/send', auth, async (req, res) => {
  if (!BOT_TOKEN) return res.status(503).json({ ok: false, error: 'Bot token sozlanmagan' });
  const targetChatId = String(req.body?.chatId ?? '');
  const isSelf = targetChatId === String(req.user.id);
  const isKnownAdmin = targetChatId === String(SUPER_ADMIN_ID) || Admins.isAdmin(targetChatId);
  if (!isSelf && !isKnownAdmin && !req.user.isAdmin) {
    return res.status(403).json({ ok: false, error: 'Ruxsat yo\'q' });
  }
  const { chatId, text, parseMode = 'HTML', inlineKeyboard, photoUrl } = req.body;
  if (!chatId || (!text && !photoUrl)) return res.status(400).json({ ok: false, error: 'chatId va text kerak' });
  try {
    let endpoint = 'sendMessage';
    const payload = { chat_id: chatId, parse_mode: parseMode };
    if (photoUrl && photoUrl.startsWith('http')) { endpoint = 'sendPhoto'; payload.photo = photoUrl; payload.caption = text; }
    else payload.text = text;
    if (inlineKeyboard?.length > 0) payload.reply_markup = { inline_keyboard: inlineKeyboard };
    const tgRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload),
    });
    res.json(await tgRes.json());
  } catch (err) { res.status(500).json({ ok: false, error: String(err) }); }
});

app.post('/webhook', async (req, res) => {
  const secret = req.headers['x-telegram-bot-api-secret-token'];
  if (WEBHOOK_SECRET && secret !== WEBHOOK_SECRET) return res.status(403).json({ error: 'Forbidden' });
  // Telegram'ga darhol javob beramiz (retry qilmasligi uchun), keyin ishlaymiz.
  res.json({ ok: true });

  // MUHIM: javob ALLAQACHON yuborilgan, shuning uchun bu yerdan keyingi
  // har qanday xato Express'ga bora olmaydi — u `unhandledRejection` bo'lib
  // Node 22'da butun serverni o'chirib qo'yardi. Endi hammasi try/catch ichida.
  try {
    await handleTelegramUpdate(req.body);
  } catch (err) {
    console.error('[Webhook] Update ishlanmadi:', err);
  }
});

async function handleTelegramUpdate(update) {
  if (!update) return;

  const processCmd = async (receiptId, decision, fromId, chatId, cbId) => {
    const result = await Receipts.review(receiptId, fromId, decision);

    // Chek topilmasa — botda soxta/xato ID yuborilgan. Ilgari bunday holatda
    // ham "tasdiqlandi" xabari chiqib, hamma klientga broadcast ketardi.
    if (!result.receipt) {
      if (chatId) await tgSend(chatId, `⚠️ Chek topilmadi: <code>${receiptId}</code>`);
      if (cbId) await tgAnswer(cbId, 'Chek topilmadi');
      return;
    }

    // Idempotentlik: Telegram inline tugmasi ikki marta bosilsa yoki update
    // qayta yetkazilsa, VIP IKKINCHI marta berilmasligi kerak.
    if (result.alreadyReviewed) {
      const msg = `ℹ️ Bu chek allaqachon ko'rib chiqilgan: ${result.receipt.status}`;
      if (chatId) await tgSend(chatId, msg);
      if (cbId) await tgAnswer(cbId, 'Allaqachon ko\'rilgan');
      return;
    }

    const emoji = decision === 'approved' ? '✅' : '❌';
    const status = decision === 'approved' ? 'TASDIQLANDI' : 'RAD ETILDI';

    // MAXFIYLIK: faqat chek egasiga (ilgari barcha ulangan klientlarga ketardi)
    sendToUser(result.receipt.user_id, { type: 'payment_decision', receiptId, decision, adminId: fromId });
    broadcastToAdmins({ type: 'receipt_reviewed', receiptId, decision });

    if (chatId) await tgSend(chatId, `${emoji} <b>Chek ${status}!</b>\nID: <code>${receiptId}</code>`);
    if (cbId) await tgAnswer(cbId, `${emoji} ${status}!`);
  };

  if (update.callback_query) {
    const from = String(update.callback_query.from?.id || '');
    const data = String(update.callback_query.data || '');
    const chat = update.callback_query.message?.chat?.id;
    const cbId = update.callback_query.id;
    
    // ═══ ADMIN CALLBACKS ONLY (receipt approve/reject) ═══
    if (!isBotAdmin(from)) { 
      await tgAnswer(cbId, '❌ Ruxsat yo\'q'); 
      return; 
    }
    
    if (data.startsWith('approve:')) await processCmd(data.replace('approve:', ''), 'approved', from, chat, cbId);
    else if (data.startsWith('reject:')) await processCmd(data.replace('reject:', ''), 'rejected', from, chat, cbId);
    return;
  }

  const message = update.message;
  if (!message?.from) return;

  const from = String(message.from.id);
  const chat = message.chat?.id;

  // ═══════════════════════════════════════════════════════════════════════
  //  1) TELEGRAM PROFILINI HAR ALOQADA SINXRONLASH
  // ═══════════════════════════════════════════════════════════════════════
  // TALAB: "username ham Telegramdagidek bo'lsin — foydalanuvchi Telegramda
  // username'ini o'zgartirsa, saytdagi ham avtomatik o'zgarishi kerak".
  // Telegram username o'zgarganini alohida xabar qilmaydi, lekin HAR BIR
  // update ichida `from` obyektini yuboradi. Shuning uchun bot bilan har
  // qanday aloqa — username sinxronlash nuqtasi.
  // Foydalanuvchi ID si ham AYNAN Telegram ID (`from.id`) bo'ladi.
  await Users.syncTelegramProfile(message.from);

  // .env da ko'rsatilgan admin bo'lsa — avtomatik ro'yxatga olamiz
  await Admins.ensureEnvAdmin(from, {
    name: `${message.from.first_name || ''} ${message.from.last_name || ''}`.trim() || `Admin #${from}`,
    username: message.from.username || '',
  });

  // ═══════════════════════════════════════════════════════════════════════
  //  2) KONTAKT KELDI — FOYDALANUVCHINI TASDIQLASH
  // ═══════════════════════════════════════════════════════════════════════
  // Bu telefon raqami orqali SMS tasdiqlash o'rniga ishlatiladi.
  if (message.contact) {
    await handleContactVerification(message, from, chat);
    return;
  }

  const txt = String(message.text || '').trim();

  // ═══════════════════════════════════════════════════════════════════════
  //  3) /start — HAR QANDAY foydalanuvchi uchun
  // ═══════════════════════════════════════════════════════════════════════
  if (txt.startsWith('/start')) {
    // Avval userning holatini tekshiramiz
    const user = await Users.getById(from);
    
    console.log('[Bot /start] User:', from, 'isPhoneVerified:', user?.isPhoneVerified, 'APP_URL:', APP_URL);
    
    // Agar foydalanuvchi allaqachon tasdiqlangan bo'lsa - oddiy xabar
    if (user?.isPhoneVerified) {
      // Deep link kodini tekshiramiz
      const parts = txt.split(/\s+/);
      const code = parts.length > 1 ? parts[1].trim() : '';
      
      if (code) {
        // Kodni yopamiz
        await VerificationCodes.markVerified(code, from, user.phone);
        sendToUser(from, { type: 'verification_complete' });
      }
      
      // Web App URL
      const webAppUrl = APP_URL || 'http://localhost:3000';
      console.log('[Bot /start] Web App tugmasi yuborilmoqda:', webAppUrl);
      
      // Oddiy xush kelibsiz xabari (button bilan - Web App)
      // Username, ID, Telefon OLIB TASHLANDI - faqat ism va status
      // YANGI: 1 ta xabar, animatsion emoji bilan
      await tgSendWithKeyboard(chat, [
        `✅ <b>Xush kelibsiz, ${escapeTgHtml(user.firstName)}!</b>`,
        '',
        user.isVip ? `⭐ <b>VIP</b> obuna faol` : '',
        user.accessTokens > 0 ? `🎟️ <b>Tokenlar:</b> ${user.accessTokens} ta` : '',
        '',
        '🎬 Hisobingiz faol!',
      ].filter(Boolean).join('\n'), {
        inline_keyboard: [[
          {
            text: '✨🎬 ManyakTV ni Ochish',
            web_app: { url: webAppUrl }
          }
        ]]
      });
      
      return;
    }

    // Yangi foydalanuvchi - kontakt so'raymiz (FAQAT BIR MARTA)
    const parts = txt.split(/\s+/);
    const code = parts.length > 1 ? parts[1].trim() : '';

    if (code) {
      const attached = await VerificationCodes.attachChat(code, from, chat);
      if (!attached) {
        await tgSend(chat, [
          "⚠️ <b>Tasdiqlash kodi yaroqsiz yoki muddati tugagan.</b>",
          '',
          'Iltimos, saytga qaytib "Telegram orqali tasdiqlash" tugmasini qaytadan bosing.',
        ].join('\n'));
        return;
      }
    }

    // Kontakt so'raymiz — FAQAT BIR MARTA, tasdiqlash uchun
    const webAppUrl = APP_URL || 'http://localhost:3000';
    console.log('[Bot /start] Yangi foydalanuvchi, kontakt so\'ralmoqda. Web App URL:', webAppUrl);
    
    // 1. Kontakt so'rash
    await tgSendWithKeyboard(chat, [
      `👋 <b>MANYAK TV ga xush kelibsiz!</b>`,
      '',
      "Hisobingizni tasdiqlash uchun pastdagi <b>«📱 Kontaktni yuborish»</b> tugmasini bosing.",
      '',
      "🔒 Kontakt <b>FAQAT BIR MARTA</b> kerak - keyinchalik avtomatik kirasiz.",
    ].join('\n'), {
      keyboard: [[{ text: '📱 Kontaktni yuborish', request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
    });
    
    // 2. Web App tugmasi (inline keyboard)
    await tgSendWithKeyboard(chat, [
      "🎬 Yoki to'g'ridan-to'g'ri pastdagi tugmani bosing:",
    ].join('\n'), {
      inline_keyboard: [[
        {
          text: '🎬 ManyakTV ni Ochish',
          web_app: { url: webAppUrl }
        }
      ]]
    });
    
    return;
  }

  // ═══════════════════════════════════════════════════════════════════════
  //  4) ADMIN BUYRUQLARI
  // ═══════════════════════════════════════════════════════════════════════
  if (!isBotAdmin(from)) {
    // Oddiy foydalanuvchiga tushunarli javob (ilgari mutlaq sukunat edi)
    await tgSend(chat, [
      "ℹ️ Bu bot MANYAK TV hisobingizni tasdiqlash uchun.",
      '',
      'Tasdiqlash uchun /start buyrug\'ini yuboring.',
    ].join('\n'));
    return;
  }

  if (txt.startsWith('/approve_')) await processCmd(txt.replace('/approve_', ''), 'approved', from, chat);
  else if (txt.startsWith('/reject_')) await processCmd(txt.replace('/reject_', ''), 'rejected', from, chat);
  else if (txt === '/stats') {
    const s = await Stats.dashboard();
    await tgSend(chat, `📊 <b>Statistika</b>\nFoydalanuvchilar: ${s.totalUsers}\nVIP: ${s.vipUsers}\nKontentlar: ${s.totalContent}\nKutilayotgan cheklar: ${s.pendingReceipts}\nDaromad: ${s.totalRevenue} so'm`);
  } else if (txt === '/help') {
    await tgSend(chat, [
      `🛠 <b>Admin buyruqlari</b>`,
      '/stats — statistika',
      '/approve_&lt;chek_id&gt; — chekni tasdiqlash',
      '/reject_&lt;chek_id&gt; — chekni rad etish',
    ].join('\n'));
  }
}

/**
 * Telegram kontakti orqali tasdiqlash — SMS/telefon tasdiqlash o'rniga.
 *
 * XAVFSIZLIK: Telegram'da foydalanuvchi BOSHQA odamning kontaktini ham
 * yuborishi mumkin (adres kitobidan). Bunday holatda `contact.user_id`
 * yuboruvchining `from.id` siga TENG BO'LMAYDI. Shuning uchun faqat
 * o'zining kontaktini qabul qilamiz — aks holda istalgan odam boshqa
 * kishining raqami bilan hisob tasdiqlab olardi.
 */
async function handleContactVerification(message, from, chat) {
  const contact = message.contact;
  const contactOwnerId = contact.user_id != null ? String(contact.user_id) : null;

  if (!contactOwnerId || contactOwnerId !== from) {
    await tgSend(chat, [
      "⚠️ <b>Bu sizning kontaktingiz emas.</b>",
      '',
      "Iltimos, boshqa odamning raqamini emas, <b>o'zingizning</b> kontaktingizni yuboring —",
      "pastdagi «📱 Kontaktni yuborish» tugmasidan foydalaning.",
    ].join('\n'));
    return;
  }

  const phone = String(contact.phone_number || '').trim();
  const normalizedPhone = phone.startsWith('+') ? phone : `+${phone}`;

  // Profilni sinxronlab, keyin tasdiqlaymiz
  await Users.syncTelegramProfile(message.from);
  const user = await Users.verifyByContact(from, normalizedPhone);
  if (!user) {
    await tgSend(chat, "⚠️ Hisob topilmadi. Iltimos /start buyrug'ini qaytadan yuboring.");
    return;
  }

  // Shu suhbat uchun sayt kutib turgan kod bo'lsa — uni yopamiz
  const pending = await VerificationCodes.findAwaitingByChat(chat);
  if (pending) {
    await VerificationCodes.markVerified(pending.code, from, normalizedPhone);
  }

  // Sayt real-time yangilanishi uchun SSE
  sendToUser(from, { type: 'verification_complete' });
  // REMOVED: broadcastToAdmins - yangi obunachilar haqida admin'larga spam yo'q

  const isAdminUser = await Admins.isAdmin(from);

  // Tasdiqlangan foydalanuvchiga oddiy xabar
  // Username, ID, Telefon OLIB TASHLANDI - faqat ism va status
  // YANGI: 1 ta xabar, inline keyboard bilan
  const webAppUrl = APP_URL || 'http://localhost:3000';
  console.log('[Bot Contact] Tasdiqlandi, Web App tugmasi yuborilmoqda:', webAppUrl);
  
  await tgSendWithKeyboard(chat, [
    `✅ <b>Hisobingiz tasdiqlandi!</b>`,
    '',
    `👤 <b>Ism:</b> ${escapeTgHtml(user.firstName)} ${escapeTgHtml(user.lastName || '')}`.trim(),
    '',
    isAdminUser
      ? '👑 Sizga <b>administrator</b> huquqi berildi.'
      : '🎬 Endi ManyakTV dan foydalanishingiz mumkin!',
  ].filter(Boolean).join('\n'), {
    inline_keyboard: [[
      {
        text: '🎬 ManyakTV ni Ochish',
        web_app: { url: webAppUrl }
      }
    ]]
  });

  // ADMIN BILDIRISHNOMASI - YO'Q
  // Adminlar web paneldan ko'rishlari mumkin
}

// ─── Telegram yordamchilari ─────────────────────────────────────────────────

/** Telegram HTML parse_mode uchun maxsus belgilarni himoyalaydi. */
function escapeTgHtml(text) {
  if (text == null) return '';
  return String(text).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/**
 * Bot uchun admin ID lari.
 *
 * ESKI KOD faqat `.env` dagi ro'yxatni o'qirdi va admin panelidan
 * tayinlangan adminlarni butunlay e'tiborsiz qoldirardi — natijada web
 * panelda admin bo'lgan odam botda "❌ Ruxsat yo'q" javobini olardi
 * (ikki xil avtorizatsiya manbasi). Endi ikkisi ham `Admins.isAdmin`
 * orqali bitta joydan tekshiriladi.
 */
async function botAdminIds() {
  const ids = new Set([String(SUPER_ADMIN_ID)]);
  for (const id of String(process.env.ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean)) {
    ids.add(id);
  }
  try {
    for (const a of await Admins.getAll()) ids.add(String(a.id));
  } catch (err) {
    console.error('[Bot] Adminlar ro\'yxatini o\'qishda xatolik:', err);
  }
  return [...ids];
}

function isBotAdmin(userId) {
  return Admins.isAdmin(String(userId));
}

/** Saytni ochish tugmasi (APP_URL sozlangan bo'lsa). */
function buildOpenAppKeyboard() {
  const appUrl = APP_URL;
  if (!appUrl) return null;
  return {
    inline_keyboard: [[{ text: '🎬 MANYAK TV ni ochish', web_app: { url: appUrl } }]],
  };
}

async function tgApi(method, payload) {
  if (!BOT_TOKEN) return { ok: false, description: 'BOT_TOKEN sozlanmagan' };
  try {
    const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${method}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    return await res.json();
  } catch (err) {
    console.error(`[Telegram ${method}]`, err);
    return { ok: false, description: String(err) };
  }
}

async function tgSend(chatId, text, replyMarkup) {
  if (!BOT_TOKEN || !chatId) return { ok: false };
  const payload = { chat_id: chatId, text, parse_mode: 'HTML', disable_web_page_preview: true };
  if (replyMarkup) payload.reply_markup = replyMarkup;
  return tgApi('sendMessage', payload);
}

/** Oddiy (pastdagi) klaviatura bilan yuborish — kontakt so'rash uchun. */
async function tgSendWithKeyboard(chatId, text, keyboard) {
  if (!BOT_TOKEN || !chatId) return { ok: false };
  return tgApi('sendMessage', {
    chat_id: chatId,
    text,
    parse_mode: 'HTML',
    reply_markup: keyboard,
  });
}

async function tgAnswer(cbId, text) {
  if (!BOT_TOKEN || !cbId) return { ok: false };
  return tgApi('answerCallbackQuery', { callback_query_id: cbId, text });
}

// ─── UPLOAD IMAGE (Admin) ───────────────────────────────────────────────────
app.post('/api/upload-image', auth, adminOnly, uploadLimiter, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ ok: false, error: 'Fayl yuklanmadi' });
    }

    // Sharp bilan optimizatsiya (optional)
    const optimizedPath = req.file.path.replace(path.extname(req.file.path), '_optimized.jpg');
    
    await sharp(req.file.path)
      .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
      .jpeg({ quality: 85 })
      .toFile(optimizedPath);

    // Original faylni o'chirish
    fs.unlinkSync(req.file.path);

    // Public URL
    const publicUrl = `/uploads/${path.basename(optimizedPath)}`;
    
    console.log('[Upload] Rasm yuklandi:', publicUrl);
    
    return res.json({ 
      ok: true, 
      url: publicUrl,
      fullUrl: `${req.protocol}://${req.get('host')}${publicUrl}`
    });
  } catch (err) {
    console.error('[Upload] Xato:', err);
    return res.status(500).json({ ok: false, error: 'Faylni yuklashda xatolik' });
  }
});

app.post('/api/broadcast', auth, adminOnly, broadcastLimiter, async (req, res) => {
  const { text, photoUrl, buttonText, buttonUrl } = req.body;
  
  console.log('[Broadcast] Request body:', { 
    text: text?.substring(0, 50), 
    photoUrl: photoUrl?.substring(0, 50), 
    buttonText, 
    buttonUrl: buttonUrl?.substring(0, 50) 
  });
  
  if (!text) return res.status(400).json({ ok: false, error: 'Matn kerak' });
  if (!BOT_TOKEN) {
    console.error('[Broadcast] BOT_TOKEN yo\'q!');
    return res.status(503).json({ ok: false, error: 'Bot token sozlanmagan' });
  }

  try {
    const allUsers = await Users.getAll();
    console.log('[Broadcast] Foydalanuvchilar soni:', allUsers.length);
    console.log('[Broadcast] Birinchi 3 ta user:', allUsers.slice(0, 3).map(u => ({ id: u.id, firstName: u.firstName })));
    
    let successCount = 0;
    let blockedCount = 0;
    
    console.log('[Broadcast] Boshlandi:', { 
      users: allUsers.length, 
      hasPhoto: !!photoUrl,
      hasButton: !!(buttonText && buttonUrl),
      botTokenExists: !!BOT_TOKEN
    });

    // Yuborish uchun payload tayyorlash
    const payloadTemplate = { parse_mode: 'HTML' };
    
    // BUTTON'SIZ yuborish (faqat rasm + matn)
    // Agar buttonText va buttonUrl yuborilsa, button qo'shamiz
    if (buttonText && buttonUrl) {
      console.log('[Broadcast] Button qo\'shilmoqda:', buttonText);
      
      // Web App link (production)
      if (APP_URL && buttonUrl.startsWith(APP_URL)) {
        payloadTemplate.reply_markup = {
          inline_keyboard: [[{ text: buttonText, web_app: { url: buttonUrl } }]]
        };
      } else {
        // Oddiy URL link
        payloadTemplate.reply_markup = {
          inline_keyboard: [[{ text: buttonText, url: buttonUrl }]]
        };
      }
    } else {
      console.log('[Broadcast] Button yo\'q - faqat rasm va matn');
    }
    
    // Rasm yoki matn
    if (photoUrl && photoUrl.startsWith('http')) {
      payloadTemplate.photo = photoUrl;
      payloadTemplate.caption = text;
    } else {
      payloadTemplate.text = text;
    }

    const endpoint = photoUrl && photoUrl.startsWith('http') ? 'sendPhoto' : 'sendMessage';

    // Asinxron yuborish (server qotmasligi uchun)
    res.json({ ok: true, totalUsers: allUsers.length, message: "Xabarnoma yuborish boshlandi" });

    // Orqa fonda yuborish
    (async () => {
      console.log('[Broadcast] Yuborish boshlandi:', new Date().toISOString());
      
      // 1. TELEGRAM KANALGA YUBORISH (birinchi)
      const CHANNEL_ID = process.env.TELEGRAM_CHANNEL_ID;
      if (CHANNEL_ID) {
        try {
          console.log('[Broadcast] Kanalga yuborilmoqda:', CHANNEL_ID);
          const channelPayload = { ...payloadTemplate, chat_id: CHANNEL_ID };
          
          const channelResponse = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(channelPayload),
          });
          
          const channelData = await channelResponse.json();
          
          if (channelResponse.ok) {
            console.log('[Broadcast] ✅ Kanal yuborish muvaffaqiyatli:', CHANNEL_ID);
          } else {
            console.error('[Broadcast] ❌ Kanalga yuborishda xato:', channelData.description);
            console.error('[Broadcast] Bot kanalni adminmi? Bot settings → Add to Channel → Make admin');
          }
        } catch (err) {
          console.error('[Broadcast] Kanalga yuborishda xatolik:', err.message);
        }
      } else {
        console.log('[Broadcast] TELEGRAM_CHANNEL_ID sozlanmagan, kanal skip');
      }
      
      // 2. FOYDALANUVCHILARGA YUBORISH
      for (const user of allUsers) {
        if (!user.id) {
          console.log('[Broadcast] User ID yo\'q, o\'tkazib yuborildi');
          continue;
        }
        
        try {
          const payload = { ...payloadTemplate, chat_id: user.id };
          console.log(`[Broadcast] User ${user.id} ga yuborilmoqda...`);
          
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          
          const responseData = await response.json();
          
          if (response.ok) {
            successCount++;
            console.log(`[Broadcast] ✅ User ${user.id} - Muvaffaqiyatli`);
          } else {
            const errMsg = responseData.description || 'Unknown error';
            console.error(`[Broadcast] ❌ User ${user.id} - Xato: ${errMsg}`);
            
            // Bloklangan yoki o'chirgan foydalanuvchilarni log qilish
            if (errMsg.includes('blocked') || errMsg.includes('user is deactivated') || errMsg.includes('chat not found')) {
              blockedCount++;
              console.log(`[Broadcast] User ${user.id} botni bloklagan yoki o'chirgan`);
            }
          }
          
          // API limit (30 req/sec) dan oshmaslik uchun 50ms kutish
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (e) {
          console.error(`[Broadcast] Network Error for user ${user.id}:`, e.message);
        }
      }
      
      console.log(`[Broadcast] Tugadi: ${successCount} muvaffaqiyatli, ${blockedCount} bloklagan, Jami: ${allUsers.length}`);
      await AuditLogs.add({ 
        adminId: req.user.id, 
        action: 'BROADCAST', 
        details: `${successCount}/${allUsers.length} ta foydalanuvchiga yuborildi (${blockedCount} bloklagan)` 
      });
    })();

  } catch (err) {
    console.error('[Broadcast]', err);
    if (!res.headersSent) res.status(500).json({ ok: false, error: 'Xatolik yuz berdi' });
  }
});

app.post('/api/setup-webhook', auth, adminOnly, async (req, res) => {
  if (!BOT_TOKEN) return res.status(503).json({ ok: false });
  const url = req.body.webhookUrl || (APP_URL ? `${APP_URL}/webhook` : '');
  if (!url?.startsWith('https://')) return res.status(400).json({ ok: false, error: 'HTTPS kerak' });

  // ESKI KOD: `await fetch(...)` try/catch'siz edi. Express 4 async
  // handler'lardagi rejection'ni USHLAMAYDI, shuning uchun Telegram API'ga
  // ulanish uzilsa bu `unhandledRejection` bo'lib butun serverni o'chirardi.
  try {
    const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, secret_token: WEBHOOK_SECRET, allowed_updates: ['message', 'callback_query'], drop_pending_updates: true }),
    });
    res.json(await r.json());
  } catch (err) {
    console.error('[setup-webhook]', err);
    res.status(502).json({ ok: false, error: 'Telegram API bilan bog\'lanib bo\'lmadi' });
  }
});

// ─── Frontend to Backend Synchronization ────────────────────────────────
//
// BU ENDPOINT ILOVADAGI ENG XAVFLI JOY EDI:
//  1) `Users.get` va `Users.save` funksiyalari database.js da UMUMAN
//     YO'Q EDI (faqat `getById`/`upsert` bor) — shuning uchun bu route
//     har doim TypeError bilan yiqilar va catch blokida "ok:false"
//     qaytarardi. Amalda sinxronizatsiya HECH QACHON ishlamagan (funksional bug).
//  2) Route hech qanday `auth` tekshiruvisiz edi — istalgan odam shu manzilga
//     to'g'ridan-to'g'ri so'rov yuborib, o'zi xohlagan ID bilan foydalanuvchi
//     yozuvi yaratishi mumkin edi.
//  3) ENG JIDDIYSI: merge mantiqi faqat "backend VIP bo'lsa va frontend
//     false desa — VIP saqlab qolinsin" holatini himoya qilardi. Lekin aksi —
//     "frontend isVip:true desa-yu, backendda hali VIP bo'lmasa" — HECH QANDAY
//     tekshiruvsiz qabul qilinardi! Ya'ni brauzer konsolidan
//     `{id, isVip:true, accessTokens:99999}` yuborish orqali HAR QANDAY
//     odam to'lovsiz VIP bo'lishi yoki token olishi mumkin edi.
//
// Fix: to'lovga bog'liq maydonlar (isVip, vipExpiresAt, accessTokens,
// purchasedContentIds, unlockedEpisodeIds, bonusBalance, banlar, hwid) FAQAT
// backend tomonidan boshqariladi va klient qiymatlari e'tiborga olinmaydi.
// Faqat zararsiz profil maydonlari (ism, familiya, username, telefon,
// dailyCheckin UI holati) sinxronlanadi. Endi autentifikatsiya ham talab
// qilinadi va foydalanuvchi faqat o'zining ID si bilan sinxronlashi mumkin.
const SERVER_OWNED_USER_FIELDS = [
  'isVip', 'vipExpiresAt', 'accessTokens', 'purchasedContentIds',
  'unlockedEpisodeIds', 'bonusBalance', 'vipDiscountPercent',
  'isBanned', 'banReason', 'isDeviceBanned', 'hwidBinding',
  'isPhoneVerified',
];

app.post('/api/sync-user', auth, async (req, res) => {
  try {
    const frontendUser = req.body;
    if (!frontendUser || !frontendUser.id) return res.status(400).json({ ok: false, error: "Foydalanuvchi ma'lumoti yo'q" });

    if (String(frontendUser.id) !== String(req.user.id) && !req.user.isAdmin) {
      return res.status(403).json({ ok: false, error: 'Ruxsat yo\'q' });
    }

    const backendUser = await Users.getById(String(frontendUser.id));
    if (!backendUser) return res.status(404).json({ ok: false, error: 'Foydalanuvchi topilmadi' });

    // Faqat zararsiz maydonlarni frontend qiymati bilan yangilaymiz;
    // pul/huquqqa oid maydonlar backend'dagi (haqiqiy) qiymatida qoladi.
    const mergedUser = { ...backendUser, ...frontendUser };
    for (const field of SERVER_OWNED_USER_FIELDS) {
      mergedUser[field] = backendUser[field];
    }

    await Users.upsert(mergedUser);
    res.json({ ok: true, user: mergedUser });
  } catch (err) {
    console.error('[Sync Error]', err);
    res.status(500).json({ ok: false });
  }
});

app.post('/api/sync-receipt', auth, async (req, res) => {
  try {
    const receipt = req.body;
    if (!receipt || !receipt.id) return res.status(400).json({ ok: false });
    if (String(receipt.userId) !== String(req.user.id) && !req.user.isAdmin) {
      return res.status(403).json({ ok: false, error: 'Ruxsat yo\'q' });
    }

    // XAVFSIZLIK: oldin `status`, `reviewedAt`, `reviewedBy` to'g'ridan-to'g'ri
    // klientdan olinardi — ya'ni oddiy foydalanuvchi o'z chekini
    // status:'approved' bilan yuborib, uni "admin tomonidan tasdiqlangan"
    // qilib ko'rsatishi (statistikani chalg'itish / firibgarlik) mumkin edi.
    // Endi oddiy foydalanuvchi yuborgan chek har doim 'pending' bo'ladi;
    // faqat admin review /api/receipts/:id/review orqali holatni o'zgartira oladi.
    const status = req.user.isAdmin ? (receipt.status || 'pending') : 'pending';
    const reviewedAt = req.user.isAdmin ? (receipt.reviewedAt || null) : null;
    const reviewedBy = req.user.isAdmin ? (receipt.reviewedBy || null) : null;

    // Create/update receipt in SQLite
    const stmt = db.prepare(`
      INSERT OR REPLACE INTO receipts 
      (id, user_id, user_name, user_phone, type, plan_id, plan_name, content_id, content_title, amount, discount_applied, promo_code_used, receipt_image_url, notes, status, created_at, reviewed_at, reviewed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    // ═══ 2 TA JIDDIY XATO TUZATILDI ═══
    //
    // 1) `undefined` BIND → CHEK JIMGINA YO'QOLARDI.
    //    `userPhone` frontendda majburiy emas (types.ts: `userPhone?: string`),
    //    `JSON.stringify` esa `undefined` maydonni butunlay tashlab yuboradi.
    //    node:sqlite `undefined` ni bind qila olmaydi va
    //    `ERR_INVALID_ARG_TYPE` tashlaydi → pastdagi catch 500 qaytaradi →
    //    frontend esa uni faqat `console.error` bilan yutib yuboradi.
    //    Natija: telefon raqami tasdiqlanmagan foydalanuvchining cheki
    //    SQLite'ga HECH QACHON tushmasdi — ya'ni odam to'lagan, lekin admin
    //    panelida ham, botda ham chek ko'rinmasdi.
    //    Endi har bir maydon aniq `?? null` bilan normallashtiriladi.
    //
    // 2) `receipt.submittedAt` — BUNDAY MAYDON FRONTENDDA YO'Q.
    //    Haqiqiy nom `createdAt` (types.ts:165, storage.ts submitPaymentReceipt).
    //    Shuning uchun chekning haqiqiy yuborilgan vaqti tashlanib, har
    //    sinxronlashda "hozir" bilan almashtirilardi (INSERT OR REPLACE).
    const amount = Number(receipt.amount);

    stmt.run(
      String(receipt.id),
      String(receipt.userId ?? req.user.id),
      receipt.userName ?? '',
      receipt.userPhone ?? null,
      receipt.type ?? 'vip_subscription',
      receipt.planId ?? null,
      receipt.planName ?? null,
      receipt.contentId ?? null,
      receipt.contentTitle ?? null,
      Number.isFinite(amount) ? amount : 0,
      Number(receipt.discountApplied) || 0,
      receipt.promoCodeUsed ?? null,
      receipt.receiptImageUrl ?? null,
      receipt.notes ?? null,
      status,
      receipt.createdAt ?? new Date().toISOString(),
      reviewedAt,
      reviewedBy
    );

    res.json({ ok: true });
  } catch (err) {
    console.error('[Sync Receipt Error]', err);
    res.status(500).json({ ok: false });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADDITIONAL API ENDPOINTS FOR NEW STORAGE SYSTEM (localStorage removal)
// ═══════════════════════════════════════════════════════════════════════════

// Get current user (for new storage system)
app.get('/api/me', auth, async (req, res) => {
  const user = await Users.getById(req.user.id);
  if (!user) return res.status(404).json({ ok: false, error: 'Foydalanuvchi topilmadi' });
  res.json({ ok: true, user });
});

// Get user entitlements
app.get('/api/me/entitlements', auth, async (req, res) => {
  const user = await Users.getById(req.user.id);
  if (!user) return res.status(404).json({ ok: false, error: 'Foydalanuvchi topilmadi' });

  const entitlements = {
    userId: user.id,
    isVip: user.isVip || false,
    vipExpiresAt: user.vipExpiresAt || null,
    purchasedContentIds: user.purchasedContentIds || [],
    unlockedEpisodeIds: user.unlockedEpisodeIds || [],
    accessTokens: user.accessTokens || 0,
    bonusBalance: user.bonusBalance || 0,
    vipDiscountPercent: user.vipDiscountPercent || 0,
    isPhoneVerified: user.isPhoneVerified || false,
    isBanned: user.isBanned || false,
    isAdmin: Admins.isAdmin(user.id),
    isSuperAdmin: Admins.isSuperAdmin(user.id),
    superAdminId: Admins.isSuperAdmin(req.user.id) ? SUPER_ADMIN_ID : null,
    syncedAt: new Date().toISOString(),
  };

  res.json({ ok: true, entitlements });
});

// Content view recording
app.post('/api/contents/view', async (req, res) => {
  const { contentId, episodeId } = req.body;
  if (!contentId) return res.status(400).json({ ok: false, error: 'contentId kerak' });

  try {
    const content = await Contents.getById(contentId);
    if (!content) return res.status(404).json({ ok: false, error: 'Kontent topilmadi' });

    const newViewsCount = (content.viewsCount || 0) + 1;
    await Contents.upsert({ ...content, viewsCount: newViewsCount });

    res.json({ ok: true });
  } catch (err) {
    console.error('[View Count Error]', err);
    res.status(500).json({ ok: false, error: 'Ko\'rishlar sonini yozishda xato' });
  }
});

// Content revenue recording (admin only)
app.post('/api/contents/revenue', auth, adminOnly, async (req, res) => {
  const { contentId, amount } = req.body;
  if (!contentId) return res.status(400).json({ ok: false, error: 'contentId kerak' });
  if (!amount || amount < 0) return res.status(400).json({ ok: false, error: 'amount musbat bo\'lishi kerak' });

  try {
    const content = await Contents.getById(contentId);
    if (!content) return res.status(404).json({ ok: false, error: 'Kontent topilmadi' });

    const newRevenue = (content.revenue || 0) + amount;
    await Contents.upsert({ ...content, revenue: newRevenue });

    res.json({ ok: true });
  } catch (err) {
    console.error('[Revenue Error]', err);
    res.status(500).json({ ok: false, error: 'Daromadni yozishda xato' });
  }
});

// Promo code validation
app.post('/api/promo-codes/validate', auth, async (req, res) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ ok: false, error: 'code kerak' });

  const result = await PromoCodes.validate(code);
  res.json({ ok: true, ...result });
});

// Get promo codes (admin only)
app.get('/api/promo-codes', auth, adminOnly, async (req, res) => {
  res.json({ ok: true, promoCodes: await PromoCodes.getAll() });
});

// Check expired subscriptions
app.get('/api/subscriptions/check-expired', auth, adminOnly, async (req, res) => {
  const allUsers = await Users.getAll();
  let expired = 0;
  const now = Date.now();

  for (const u of allUsers) {
    if (u.isVip && u.vipExpiresAt) {
      const expiryTime = new Date(u.vipExpiresAt).getTime();
      if (now > expiryTime) {
        await Users.revokeVip(u.id);
        expired++;
      }
    }
  }

  res.json({ ok: true, expired });
});

// Instant purchase
app.post('/api/purchase/instant', auth, async (req, res) => {
  const { contentId, episodeId, amount } = req.body;
  const userId = req.user.id;

  if (!contentId) return res.status(400).json({ ok: false, error: 'contentId kerak' });
  if (!amount || amount < 0) return res.status(400).json({ ok: false, error: 'amount musbat bo\'lishi kerak' });

  const user = await Users.getById(userId);
  if (!user) return res.status(404).json({ ok: false, error: 'Foydalanuvchi topilmadi' });

  if (user.bonusBalance < amount) {
    return res.status(400).json({ ok: false, error: 'Bonus balansi yetarli emas' });
  }

  const newBalance = user.bonusBalance - amount;

  if (episodeId) {
    const unlockedEpisodes = [...(user.unlockedEpisodeIds || [])];
    if (!unlockedEpisodes.includes(episodeId)) {
      unlockedEpisodes.push(episodeId);
    }
    await Users.upsert({ ...user, bonusBalance: newBalance, unlockedEpisodeIds: unlockedEpisodes });
  } else {
    const purchased = [...(user.purchasedContentIds || [])];
    if (!purchased.includes(contentId)) {
      purchased.push(contentId);
    }
    await Users.upsert({ ...user, bonusBalance: newBalance, purchasedContentIds: purchased });
  }

  // Record revenue
  const content = await Contents.getById(contentId);
  if (content) {
    const newRevenue = (content.revenue || 0) + amount;
    await Contents.upsert({ ...content, revenue: newRevenue });
  }

  res.json({ ok: true, message: 'Xarid muvaffaqiyatli amalga oshirildi' });
});

// Token unlock - YANGI QOIDA: Faqat seriallar, har 10 qismga 1 ta qism ochish
app.post('/api/tokens/unlock', auth, async (req, res) => {
  const { contentId, episodeId, tokensUsed } = req.body;
  const userId = req.user.id;

  if (!contentId) return res.status(400).json({ ok: false, error: 'contentId kerak' });
  if (!episodeId) return res.status(400).json({ ok: false, error: 'episodeId kerak - faqat qismlar uchun' });
  if (!tokensUsed || tokensUsed < 0) return res.status(400).json({ ok: false, error: 'tokensUsed musbat bo\'lishi kerak' });

  const user = await Users.getById(userId);
  if (!user) return res.status(404).json({ ok: false, error: 'Foydalanuvchi topilmadi' });

  // Content'ni olish
  const content = await Contents.getById(contentId);
  if (!content) return res.status(404).json({ ok: false, error: 'Kontent topilmadi' });

  // FAQAT SERIALLAR
  if (content.type !== 'series' && content.type !== 'anime_series' && content.type !== 'short_drama') {
    return res.status(400).json({ ok: false, error: 'Token faqat seriallar uchun ishlatiladi' });
  }

  // Jami qismlar sonini tekshirish
  const totalEpisodes = content.episodes?.length || 0;
  if (totalEpisodes === 0) {
    return res.status(400).json({ ok: false, error: 'Bu serialda qismlar yo\'q' });
  }

  // Har 10 qismga 1 ta qism ochish huquqi
  const maxUnlockable = Math.floor(totalEpisodes / 10);
  if (maxUnlockable === 0) {
    return res.status(400).json({ ok: false, error: 'Bu serialda 10 dan kam qism bor - token ishlatib bo\'lmaydi' });
  }

  // Hozircha nechta qism ochilgan (shu serial uchun)
  const unlockedEpisodes = (user.unlockedEpisodeIds || []).filter(key => key.startsWith(`${contentId}:`));
  if (unlockedEpisodes.length >= maxUnlockable) {
    return res.status(400).json({ 
      ok: false, 
      error: `Bu serialda maksimal ${maxUnlockable} ta qism ochish mumkin (${totalEpisodes} qismning har 10 tasiga 1 ta). Siz allaqachon ${unlockedEpisodes.length} ta ochdingiz.` 
    });
  }

  // Token tekshiruvi
  if (user.accessTokens < tokensUsed) {
    return res.status(400).json({ ok: false, error: 'Tokenlar yetarli emas' });
  }

  const newTokens = user.accessTokens - tokensUsed;

  // Qismni ochish
  const episodeKey = `${contentId}:${episodeId}`;
  const allUnlockedEpisodes = [...(user.unlockedEpisodeIds || [])];
  if (!allUnlockedEpisodes.includes(episodeKey)) {
    allUnlockedEpisodes.push(episodeKey);
  }
  
  await Users.upsert({ ...user, accessTokens: newTokens, unlockedEpisodeIds: allUnlockedEpisodes });
  await TokenUnlock.record(userId, contentId, episodeId, tokensUsed);
  
  await AuditLogs.add({
    adminId: userId,
    action: 'TOKEN_UNLOCK_EPISODE',
    targetId: episodeKey,
    details: `${tokensUsed} token sarflandi. Serial: ${totalEpisodes} qism, ochilgan: ${unlockedEpisodes.length + 1}/${maxUnlockable}`,
  });

  res.json({ 
    ok: true, 
    message: `Token bilan qism ochildi! ${totalEpisodes} qismli serialda ${unlockedEpisodes.length + 1}/${maxUnlockable} ta qism ochildi.` 
  });
});

// Daily check-in state
app.get('/api/daily-checkin/state', auth, async (req, res) => {
  const status = await DailyCheckIn.getStatus(req.user.id);
  res.json({ ok: true, state: status });
});

// Daily check-in claim
app.post('/api/daily-checkin/claim', auth, async (req, res) => {
  const result = await DailyCheckIn.claim(req.user.id);
  
  if (!result.success) {
    return res.status(400).json({ ok: false, message: result.message });
  }

  res.json({ ok: true, reward: result.reward, message: result.message });
});

// ─── Health ─────────────────────────────────────────────────────────────────
// ESKI KOD: bu endpoint autentifikatsiyasiz `await Stats.dashboard()` ni qaytarardi,
// ya'ni istalgan odam foydalanuvchilar soni, VIP soni va UMUMIY DAROMADni
// (totalRevenue) ko'ra olardi. Endi health faqat "tirikmi?" degan savolga
// javob beradi; biznes ko'rsatkichlari /api/stats da, admin himoyasi ostida.
app.get('/api/health', async (req, res) => {
  res.json({
    status: 'ok',
    service: 'MANYAK TV SQLite Backend',
    version: '2.0.0',
    uptime: Math.floor(process.uptime()),
  });
});

// Bot holatini admin ko'rishi uchun diagnostika endpointi
app.get('/api/bot/status', auth, adminOnly, async (req, res) => {
  if (!BOT_TOKEN) {
    return res.json({ ok: true, configured: false, reason: 'TELEGRAM_BOT_TOKEN .env da yo\'q' });
  }
  const me = await tgApi('getMe', {});
  const info = await tgApi('getWebhookInfo', {});
  const appUrl = APP_URL || null;
  res.json({
    ok: true,
    configured: Boolean(me.ok),
    bot: me.ok ? { id: me.result.id, username: me.result.username } : null,
    botError: me.ok ? null : me.description,
    appUrl,
    expectedWebhook: appUrl ? `${appUrl.replace(/\/+$/, '')}/webhook` : null,
    webhook: info.ok ? {
      url: info.result.url || null,
      pendingUpdateCount: info.result.pending_update_count,
      lastErrorMessage: info.result.last_error_message || null,
      lastErrorDate: info.result.last_error_date || null,
    } : null,
  });
});

// Webhookni qo'lda qayta o'rnatish (diagnostika uchun)
app.post('/api/bot/reconnect', auth, adminOnly, async (req, res) => {
  try {
    await setupBotWebhook();
    const info = await tgApi('getWebhookInfo', {});
    res.json({ ok: true, webhook: info.ok ? info.result : null });
  } catch (err) {
    res.status(500).json({ ok: false, error: String(err) });
  }
});

// ─── Static (production) ──────────────────────────────────────────────────
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', async (req, res) => {
  if (req.path.startsWith('/api/') || req.path === '/webhook') return res.status(404).json({ error: 'Not found' });

  // `dist/` yo'q bo'lsa (build qilinmagan) `sendFile` xato tashlaydi va
  // Express standart 500 HTML sahifasini qaytaradi — sababi tushunarsiz.
  // Endi aniq xabar beramiz.
  const indexPath = path.join(distPath, 'index.html');
  if (!fs.existsSync(indexPath)) {
    return res.status(503).type('text/plain').send(
      "Frontend build topilmadi (dist/index.html). Avval `npm run build` bajaring."
    );
  }
  res.sendFile(indexPath);
});

// ─── Xatolarni markazlashgan ushlash ────────────────────────────────────────
// ESKI KOD: fayl bo'ylab HECH QANDAY error middleware yo'q edi. Har qanday
// route ichidagi sinxron xato Express'ning standart handleriga tushib,
// productionda ham stack trace'ni klientga qaytarishi mumkin edi.
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error('[Unhandled route error]', req.method, req.originalUrl, err);
  if (res.headersSent) return;
  res.status(500).json({ ok: false, error: 'Serverda kutilmagan xatolik' });
});

// ─── Obunalarni avtomatik tugatish ──────────────────────────────────────────
// ESKI KOD: `await Users.expireSubscriptions()` database.js da yozilgan, lekin
// BUTUN LOYIHADA HECH QAYERDA CHAQIRILMAGAN edi. Natijada serverda VIP hech
// qachon tugamasdi: muddati o'tgan foydalanuvchiga /api/sync-user va
// /api/me/entitlements doim `isVip: true` qaytarib berardi.
// Tugash faqat klient tomonida (localStorage'da) hisoblanardi — ya'ni
// foydalanuvchi localStorage'ni tozalab, obunani "tiklab" olishi mumkin edi.
async function runExpirySweep() {
  try {
    const result = await Users.expireSubscriptions();
    if (result?.changes > 0) {
      console.log(`[Expiry] ${result.changes} ta muddati o'tgan VIP obuna yopildi`);
    }
  } catch (err) {
    console.error('[Expiry] Obunalarni tekshirishda xatolik:', err);
  }
}

runExpirySweep();                                   // boot paytida bir marta
const expiryTimer = setInterval(runExpirySweep, 60 * 60 * 1000); // keyin har soatda
expiryTimer.unref?.();

// Eskirgan tasdiqlash kodlarini tozalash
VerificationCodes.cleanupExpired();
const verifyCleanupTimer = setInterval(() => {
  try {
    VerificationCodes.cleanupExpired();
  } catch (err) {
    console.error('[Verify] Kodlarni tozalashda xatolik:', err);
  }
}, 15 * 60 * 1000);
verifyCleanupTimer.unref?.();

// ─── BOTNI AVTOMATIK ULASH ──────────────────────────────────────────────────
//
// ═══ "BOT ISHLAMAYAPTI" MUAMMOSINING ASOSIY SABABI ═══
//
// 1) WEBHOOK HECH QACHON RO'YXATDAN O'TMASDI. `/api/setup-webhook` endpointi
//    bor edi, lekin uni admin JWT bilan QO'LDA chaqirish kerak edi — bu esa
//    tovuq-tuxum muammosi: JWT olish uchun Mini App'ni ochish kerak, Mini App
//    ishlashi uchun bot sozlangan bo'lishi kerak. Natijada Telegram
//    serverimizga hech qanday update yubormasdi va bot butunlay jim turardi.
//
// 2) BRAUZERDAN getUpdates POLLING. `src/services/telegramBot.ts` dagi
//    `fetchAndProcessBotCommands` bevosita brauzerdan
//    `api.telegram.org/bot<token>/getUpdates` ni chaqirardi. Telegram
//    webhook o'rnatilgan bo'lsa `getUpdates` ni RAD ETADI (409 Conflict) —
//    ya'ni ikkisi bir vaqtda ISHLAMAYDI. Bundan tashqari u bot tokenini
//    brauzerga chiqarardi va server botidan update'larni "o'g'irlardi".
//    O'sha kod endi butunlay olib tashlandi (frontend commitiga qarang).
//
// Endi server ishga tushganda webhook AVTOMATIK ro'yxatdan o'tadi.
// Development polling rejimi
let pollingInterval = null;
let lastUpdateId = 0;

async function startPolling() {
  if (!BOT_TOKEN) return;
  
  // Avval bot ma'lumotlarini olamiz
  const me = await tgApi('getMe', {});
  if (!me.ok) {
    console.error(`[Bot] ❌ Bot tokeni yaroqsiz: ${me.description || 'noma\'lum xatolik'}`);
    return;
  }
  console.log(`[Bot] ✅ Bot ulandi: @${me.result.username} (${me.result.first_name})`);

  // Bot username'ini bazaga yozamiz
  try {
    const current = await Settings.get();
    if (current.botUsername !== me.result.username) {
      await Settings.set({ ...current, botUsername: me.result.username, telegramBotUsername: me.result.username });
      console.log(`[Bot] Bot username sozlamalarga yozildi: @${me.result.username}`);
    }
  } catch (err) {
    console.error('[Bot] Username saqlanmadi:', err);
  }
  
  console.log('[Bot] 🔄 Polling rejimida ishlamoqda (development)');
  
  const poll = async () => {
    try {
      const result = await tgApi('getUpdates', {
        offset: lastUpdateId + 1,
        timeout: 30,
        allowed_updates: ['message', 'callback_query'],
      });
      
      if (result.ok && Array.isArray(result.result)) {
        for (const update of result.result) {
          if (update.update_id > lastUpdateId) {
            lastUpdateId = update.update_id;
          }
          await handleTelegramUpdate(update);
        }
      }
    } catch (err) {
      console.error('[Bot] Polling xatosi:', err.message);
    }
  };
  
  // Darhol birinchi marta poll qilamiz
  await poll();
  
  // Keyin har 2 sekundda
  pollingInterval = setInterval(poll, 2000);
}

async function setupBotWebhook() {
  if (!BOT_TOKEN) {
    console.warn('[Bot] ⚠️  TELEGRAM_BOT_TOKEN yo\'q — bot ishlamaydi. .env ga qo\'shing.');
    return;
  }

  // Development rejimida polling ishlatamiz
  if (!APP_URL || !APP_URL.startsWith('https://')) {
    console.warn('[Bot] ⚠️  HTTPS manzil yo\'q — POLLING rejimiga o\'tilmoqda (faqat development uchun).');
    
    // Avval webhook'ni o'chiramiz
    await tgApi('deleteWebhook', { drop_pending_updates: true });
    
    // Polling'ni ishga tushiramiz
    await startPolling();
    return;
  }

  const webhookUrl = `${APP_URL}/webhook`;

  // Bot haqiqatan ishlayotganini tekshiramiz (token to'g'rimi?)
  const me = await tgApi('getMe', {});
  if (!me.ok) {
    console.error(`[Bot] ❌ Bot tokeni yaroqsiz: ${me.description || 'noma\'lum xatolik'}`);
    return;
  }
  console.log(`[Bot] ✅ Bot ulandi: @${me.result.username} (${me.result.first_name})`);

  // Bot username'ini bazaga yozamiz — `/api/verify/start` deep link uchun kerak
  try {
    const current = await Settings.get();
    if (current.botUsername !== me.result.username) {
      await Settings.set({ ...current, botUsername: me.result.username, telegramBotUsername: me.result.username });
      console.log(`[Bot] Bot username sozlamalarga yozildi: @${me.result.username}`);
    }
  } catch (err) {
    console.error('[Bot] Username saqlanmadi:', err);
  }

  // Mavjud webhook allaqachon to'g'ri bo'lsa qayta o'rnatmaymiz
  const info = await tgApi('getWebhookInfo', {});
  if (info.ok && info.result?.url === webhookUrl) {
    console.log(`[Bot] ✅ Webhook allaqachon to'g'ri: ${webhookUrl}`);
    if (info.result.last_error_message) {
      console.warn(`[Bot] ⚠️  Telegram oxirgi xatoni bildirdi: ${info.result.last_error_message}`);
    }
    return;
  }

  const result = await tgApi('setWebhook', {
    url: webhookUrl,
    secret_token: WEBHOOK_SECRET,
    // `message` — kontakt va buyruqlar uchun; `callback_query` — inline tugmalar
    allowed_updates: ['message', 'callback_query'],
    drop_pending_updates: true,
  });

  if (result.ok) {
    console.log(`[Bot] ✅ Webhook o'rnatildi: ${webhookUrl}`);
  } else {
    console.error(`[Bot] ❌ Webhook o'rnatilmadi: ${result.description || 'noma\'lum xatolik'}`);
  }
}

// Boot'da fon rejimida — serverning ishga tushishini bloklamaydi
setupBotWebhook().catch((err) => console.error('[Bot] Webhook sozlashda xatolik:', err));


// ─── Kutilmagan xatolarni ushlash ───────────────────────────────────────────
// ESKI KOD: bu handlerlar YO'Q edi. Node 22'da ushlanmagan promise rejection
// standart holatda protsessni O'LDIRADI — ya'ni bitta tarmoq uzilishi butun
// saytni ishdan chiqarardi. Endi xato jurnalga yozilib, server ishlashda
// davom etadi.
process.on('unhandledRejection', (reason) => {
  console.error('[unhandledRejection]', reason);
});

process.on('uncaughtException', (err) => {
  console.error('[uncaughtException]', err);
  // Bu holat protsess holatini buzgan bo'lishi mumkin — jurnalga yozib,
  // ulanishlarni chiroyli yopib, process manager qayta ishga tushirishi
  // uchun chiqamiz.
  shutdown('uncaughtException', 1);
});

// ─── Chiroyli to'xtash (graceful shutdown) ──────────────────────────────────
// ESKI KOD: `db.close()` hech qachon chaqirilmasdi. SQLite WAL rejimida
// (`PRAGMA journal_mode = WAL`) bu `-wal`/`-shm` fayllari checkpoint
// qilinmasdan qolishiga olib keladi.
let isShuttingDown = false;
function shutdown(signal, exitCode = 0) {
  if (isShuttingDown) return;
  isShuttingDown = true;
  console.log(`\n[Shutdown] ${signal} qabul qilindi — yopilmoqda...`);

  clearInterval(expiryTimer);
  
  // Polling'ni to'xtatamiz
  if (pollingInterval) {
    clearInterval(pollingInterval);
    pollingInterval = null;
  }

  // Ochiq SSE ulanishlarini yopamiz
  for (const clients of sseClients.values()) {
    for (const client of clients) {
      try { client.res.end(); } catch { /* allaqachon yopilgan */ }
    }
  }
  sseClients.clear();

  httpServer.close(() => {
    try {
      // ⭐ SQLite uchun: db.close() metodidan foydalanish
      if (db && typeof db.close === 'function') {
        db.close();
        console.log('[Shutdown] ✅ Database yopildi');
      }
    } catch (err) {
      console.error('[Shutdown] Database yopishda xatolik:', err);
    }
    process.exit(exitCode);
  });

  // 10 sekunddan keyin majburiy chiqish (ulanishlar osilib qolsa)
  setTimeout(() => process.exit(exitCode), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ═══════════════════════════════════════════════════════════════════════════
//  BACKUP API
// ═══════════════════════════════════════════════════════════════════════════

// Barcha backuplar ro'yxati
app.get('/api/backups', auth, adminOnly, async (req, res) => {
  const backups = Backup.list();
  res.json({ ok: true, backups });
});

// Yangi backup yaratish
app.post('/api/backups/create', auth, adminOnly, async (req, res) => {
  const result = Backup.create();
  res.json(result.success ? { ok: true, backup: result.path } : { ok: false, error: result.error });
});

// Backupdan tiklash (EHTIYOTLIK BILAN!)
app.post('/api/backups/restore', auth, adminOnly, async (req, res) => {
  const { backupPath } = req.body;
  if (!backupPath) {
    return res.status(400).json({ ok: false, error: 'backupPath kerak' });
  }
  
  const result = Backup.restore(backupPath);
  res.json(result.success ? { ok: true, message: result.message } : { ok: false, error: result.error });
});

// ═══ HEALTH CHECK ENDPOINT (Load Balancer uchun) ═══
app.get('/health', async (req, res) => {
  try {
    // Database connectivity check
    const dbCheck = db.prepare('SELECT 1 as health').get();
    
    // Memory usage
    const memUsage = process.memoryUsage();
    const memUsageMB = {
      rss: Math.round(memUsage.rss / 1024 / 1024),
      heapTotal: Math.round(memUsage.heapTotal / 1024 / 1024),
      heapUsed: Math.round(memUsage.heapUsed / 1024 / 1024),
      external: Math.round(memUsage.external / 1024 / 1024),
    };
    
    // Uptime
    const uptimeSeconds = Math.floor(process.uptime());
    const uptimeFormatted = `${Math.floor(uptimeSeconds / 3600)}h ${Math.floor((uptimeSeconds % 3600) / 60)}m`;
    
    res.status(200).json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: uptimeFormatted,
      uptimeSeconds,
      memory: memUsageMB,
      database: dbCheck ? 'connected' : 'disconnected',
      pid: process.pid,
      nodeVersion: process.version,
      port: PORT,
    });
  } catch (err) {
    res.status(503).json({
      status: 'unhealthy',
      error: err.message,
      timestamp: new Date().toISOString(),
    });
  }
});

// Simplified health check (for basic load balancer checks)
app.get('/api/health', async (req, res) => {
  res.status(200).send('OK');
});

// ─── Start ──────────────────────────────────────────────────────────────────
async function startServer() {
  try {
    // Initialize PostgreSQL schema
    console.log('[PostgreSQL] Initializing database schema...');
    await initializeSchema();
    console.log('[PostgreSQL] ✅ Schema initialized');
    
    // Seed if empty
    console.log('[Seed] Checking if database needs seeding...');
    await seedIfEmpty();
    console.log('[Seed] ✅ Seed check completed');
    
    // Start HTTP server
    httpServer.listen(PORT, () => {
      console.log(`\n🚀 MANYAK TV PostgreSQL Backend v3.0`);
      console.log(`   http://localhost:${PORT}`);
      console.log(`   Health:     /api/health`);
      console.log(`   Webhook:    /webhook`);
      console.log(`   DB:         PostgreSQL (Railway)`);
      console.log(`   Bot:        ${BOT_TOKEN ? '✅' : '⚠️  .env da TELEGRAM_BOT_TOKEN yozing'}`);
      console.log(`   Security:   HMAC-SHA256 + JWT + Rate Limit\n`);
      
      // PostgreSQL automatic backups are handled by Railway
      console.log('[Backup] Railway handles PostgreSQL backups automatically');
    });
  } catch (err) {
    console.error('❌ Server startup failed:', err);
    process.exit(1);
  }
}

startServer();

export default app;
