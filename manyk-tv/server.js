/**
 * MANYK TV — Secure Express.js + SQLite Backend Server
 * =====================================================
 * Full REST API with SQLite database, JWT auth, Rate Limiting, Telegram Webhook.
 */

// MUHIM: 'dotenv/config' ENG BIRINCHI import bo'lishi shart!
// Oldin dotenv.config() pastda chaqirilardi, lekin ES module importlari
// fayl tepasidan pastga qarab BAJARILISHDAN OLDIN "hoisting" qilinadi —
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
import {
  Users, Receipts, Contents, Plans, PromoCodes, WatchHistory,
  Favorites, Settings, Admins, AuditLogs, BannedDevices,
  DailyCheckIn, TokenUnlock, Stats, VerificationCodes,
  seedIfEmpty, SUPER_ADMIN_ID, db
} from './database.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const httpServer = createServer(app);

// ─── Config ────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3001;
const IS_PROD = process.env.NODE_ENV === 'production';
const BOT_TOKEN = process.env.TELEGRAM_BOT_TOKEN || '';
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET || 'manyaktv_secret_2026';
const JWT_SECRET = process.env.JWT_SECRET || 'manyktv_jwt_2026_secret';

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
if (!process.env.JWT_SECRET) {
  console.warn('[SECURITY WARNING] JWT_SECRET .env da yo\'q — standart (nomaxfiy) qiymat ishlatilmoqda. Productionda albatta o\'zgartiring!');
}
if (IS_PROD && (!process.env.JWT_SECRET || !process.env.WEBHOOK_SECRET)) {
  console.error('[FATAL] Production rejimida JWT_SECRET va WEBHOOK_SECRET .env da MAJBURIY. Server to\'xtatildi.');
  process.exit(1);
}

// ─── Seed initial data ────────────────────────────────────────────────────
seedIfEmpty();

// ─── Middleware ─────────────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

const apiLimiter = rateLimit({ windowMs: 15 * 60 * 1000, max: 200, standardHeaders: true, legacyHeaders: false });
app.use('/api/', apiLimiter);

// CORS
// ESKI KOD: `origin.startsWith(o)` tekshiruvi edi — bu "http://localhost:5173.evil.com"
// yoki "http://localhost:3000@evil.com" kabi manzillarni ham "ruxsat etilgan" deb
// qabul qilib, Access-Control-Allow-Credentials: true bilan birga xavfli edi
// (boshqa domendagi zararli sayt cookie/token bilan so'rov yuborishi mumkin edi).
// Endi FAQAT to'liq (aniq) mos kelgan origin qabul qilinadi.
const ALLOWED_ORIGINS = new Set(['http://localhost:3000', 'http://localhost:5173', process.env.APP_URL].filter(Boolean));
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
    if (err) return res.status(403).json({ ok: false, error: 'Token yaroqsiz' });
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

app.get('/api/events', (req, res) => {
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

app.post('/api/auth/verify', (req, res) => {
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
    Admins.ensureEnvAdmin(String(user.id), {
      name: `${user.first_name || ''} ${user.last_name || ''}`.trim() || `Admin #${user.id}`,
      username: user.username || '',
    });
    const isAdmin = Admins.isAdmin(String(user.id));
    const token = jwt.sign({ id: String(user.id), username: user.username, isAdmin }, JWT_SECRET, { expiresIn: '24h' });

    // ESKI KOD `username` ni FAQAT yangi foydalanuvchi yaratilganda yozardi;
    // mavjud foydalanuvchida esa `firstName`/`lastName` ni yangilab,
    // `username` ni TEGMASDAN qoldirardi. Ya'ni foydalanuvchi Telegramda
    // username'ini o'zgartirsa, saytda ESKISI qolib ketardi.
    // `syncTelegramProfile` bu ishni bitta joyda va to'g'ri bajaradi.
    const dbUser = Users.syncTelegramProfile(user);

    res.json({ ok: true, token, user: dbUser, isAdmin });
  } catch (err) {
    console.error('[Auth]', err);
    res.status(500).json({ ok: false, error: 'Auth xatosi' });
  }
});

// ═══════════════════════════════════════════════════════════════════════════
//  USERS API
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/users', auth, adminOnly, (req, res) => {
  res.json({ ok: true, users: Users.getAll() });
});

app.get('/api/users/:id', auth, (req, res) => {
  // ESKI KOD: har qanday tizimga kirgan (login qilgan) foydalanuvchi boshqa
  // HAR QANDAY userning ma'lumotlarini (telefon raqami, VIP holati va h.k.)
  // faqat ID sini bilib ko'ra olardi. Endi faqat o'zining profilini yoki
  // admin - istalgan profilni ko'ra oladi.
  if (req.user?.id !== req.params.id && !req.user?.isAdmin) {
    return res.status(403).json({ ok: false, error: 'Ruxsat yo\'q' });
  }
  const user = Users.getById(req.params.id);
  if (!user) return res.status(404).json({ ok: false, error: 'Topilmadi' });
  res.json({ ok: true, user });
});

app.put('/api/users/:id', auth, adminOnly, (req, res) => {
  const user = Users.getById(req.params.id);
  if (!user) return res.status(404).json({ ok: false, error: 'Topilmadi' });
  const updated = Users.upsert({ ...user, ...req.body, id: req.params.id });
  res.json({ ok: true, user: updated });
});

app.post('/api/users/:id/vip', auth, adminOnly, (req, res) => {
  const days = req.body.days || 30;
  const user = Users.grantVip(req.params.id, days);
  if (!user) return res.status(404).json({ ok: false, error: 'Topilmadi' });
  AuditLogs.add({ adminId: req.user.id, adminName: req.user.username, action: 'GRANT_VIP', targetId: req.params.id, details: `${days} kun VIP berildi` });
  res.json({ ok: true, user });
});

app.delete('/api/users/:id/vip', auth, adminOnly, (req, res) => {
  Users.revokeVip(req.params.id);
  AuditLogs.add({ adminId: req.user.id, action: 'REVOKE_VIP', targetId: req.params.id });
  res.json({ ok: true });
});

app.post('/api/users/:id/ban', auth, adminOnly, (req, res) => {
  Users.ban(req.params.id, req.body.reason);
  AuditLogs.add({ adminId: req.user.id, action: 'BAN_USER', targetId: req.params.id, details: req.body.reason });
  res.json({ ok: true });
});

app.delete('/api/users/:id/ban', auth, adminOnly, (req, res) => {
  Users.unban(req.params.id);
  AuditLogs.add({ adminId: req.user.id, action: 'UNBAN_USER', targetId: req.params.id });
  res.json({ ok: true });
});

app.post('/api/users/:id/reset-hwid', auth, adminOnly, (req, res) => {
  Users.resetHwid(req.params.id);
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════════════════
//  CONTENTS API
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/contents', (req, res) => {
  res.json({ ok: true, contents: Contents.getAll() });
});

app.get('/api/contents/:id', (req, res) => {
  const item = Contents.getById(req.params.id);
  if (!item) return res.status(404).json({ ok: false, error: 'Topilmadi' });
  res.json({ ok: true, content: item });
});

app.post('/api/contents', auth, adminOnly, (req, res) => {
  const content = Contents.upsert(req.body);
  AuditLogs.add({ adminId: req.user.id, action: 'ADD_CONTENT', targetId: content.id, targetTitle: content.title });
  // ESKI KOD: bu yerda broadcast yo'q edi — shuning uchun admin kontent
  // qo'shganda boshqa foydalanuvchilarning ochiq turgan sahifasi buni
  // ilova qayta ochilmaguncha bilmasdi. Endi SSE orqali barcha ulangan
  // mijozlarga xabar beramiz, ular esa kontent ro'yxatini serverdan
  // qayta so'raydi (qarang: src/App.tsx 'content_updated' handleri).
  // Kontent ro'yxati maxfiy emas — hammaga yuborish mumkin.
  broadcastToAll({ type: 'content_updated', action: 'add', contentId: content.id });
  res.json({ ok: true, content });
});

app.put('/api/contents/:id', auth, adminOnly, (req, res) => {
  const content = Contents.upsert({ ...req.body, id: req.params.id });
  AuditLogs.add({ adminId: req.user.id, action: 'UPDATE_CONTENT', targetId: content.id, targetTitle: content.title });
  broadcastToAll({ type: 'content_updated', action: 'update', contentId: content.id });
  res.json({ ok: true, content });
});

app.delete('/api/contents/:id', auth, adminOnly, (req, res) => {
  Contents.delete(req.params.id);
  AuditLogs.add({ adminId: req.user.id, action: 'DELETE_CONTENT', targetId: req.params.id });
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
const UPLOADS_DIR = path.join(__dirname, 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}
// Yuklangan fayllarni ("/uploads/xxx.mp4" kabi) hammaga ochiq statik
// manzil sifatida uzatamiz — kino/rasm shu manzil orqali istalgan
// foydalanuvchi qurilmasida ochiladi.
app.use('/uploads', express.static(UPLOADS_DIR));

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
  express.raw({ type: '*/*', limit: ADMIN_UPLOAD_LIMIT }),
  (req, res) => {
    if (!req.body || !req.body.length) {
      return res.status(400).json({ ok: false, error: "Fayl bo'sh yoki yuborilmadi" });
    }

    const isAdmin = Boolean(req.user?.isAdmin);

    // 1) Hajm cheklovi
    const sizeLimit = isAdmin ? ADMIN_UPLOAD_LIMIT : USER_UPLOAD_LIMIT;
    if (req.body.length > sizeLimit) {
      const limitMb = Math.round(sizeLimit / (1024 * 1024));
      return res.status(413).json({ ok: false, error: `Fayl juda katta. Maksimal ${limitMb} MB.` });
    }

    // 2) Fayl turini ANIQLASH (taxmin qilish emas)
    const detectedImage = detectImageExt(req.body);
    let ext = String(req.query.ext || '').toLowerCase().replace(/[^a-z0-9]/g, '');

    if (!isAdmin) {
      // Oddiy foydalanuvchi FAQAT rasm yuklaydi va bu haqiqatan rasm
      // ekanini bayt darajasida tasdiqlaymiz.
      if (!detectedImage || !ALLOWED_IMAGE_EXT.has(detectedImage)) {
        return res.status(400).json({
          ok: false,
          error: 'Faqat rasm fayllari qabul qilinadi (JPG, PNG yoki WEBP).',
        });
      }
      ext = detectedImage;
    } else {
      // Admin video ham yuklashi mumkin. Rasm aniqlangan bo'lsa — haqiqiy
      // kengaytmani ishlatamiz; aks holda so'ralgan kengaytma ruxsat
      // etilganlar ro'yxatida bo'lishi SHART.
      //
      // ESKI KOD noma'lum kengaytmani Content-Type'dan "taxmin" qilardi:
      //     if (mime.includes('video')) ext = 'mp4';
      //     ... else ext = 'jpg';
      // Natijada .mkv/.avi fayllar .mp4 bo'lib saqlanib, <video> da
      // ochilmasdi, va istalgan binar fayl .jpg sifatida yozilardi.
      // Endi noto'g'ri kengaytma RAD ETILADI.
      if (detectedImage) {
        ext = detectedImage;
      } else if (!ALLOWED_UPLOAD_EXT.has(ext)) {
        return res.status(400).json({
          ok: false,
          error: `Ruxsat etilmagan fayl turi. Qabul qilinadi: ${[...ALLOWED_UPLOAD_EXT].join(', ')}`,
        });
      }
    }

    const filename = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    try {
      fs.writeFileSync(filepath, req.body);
      AuditLogs.add({
        adminId: req.user.id,
        action: 'UPLOAD_FILE',
        targetId: filename,
        details: `${(req.body.length / 1024).toFixed(0)} KB`,
      });
      res.json({ ok: true, url: `/uploads/${filename}` });
    } catch (err) {
      console.error('[Upload]', err);
      res.status(500).json({ ok: false, error: 'Faylni saqlashda xatolik' });
    }
  }
);

// ═══════════════════════════════════════════════════════════════════════════
//  RECEIPTS API (To'lov cheklari)
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/receipts', auth, adminOnly, (req, res) => {
  const status = req.query.status;
  const receipts = status ? Receipts.getByStatus(status) : Receipts.getAll();
  res.json({ ok: true, receipts });
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

app.post('/api/receipts', auth, (req, res) => {
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

  const receipt = Receipts.submit({ ...body, userId, amount });

  // Adminlarga SSE orqali xabar berish.
  // `client.write` uzilgan socketga yozilsa xato tashlaydi — ilgari bu
  // try/catch'siz edi va bitta o'lik klient butun so'rovni 500 qilardi
  // (DB yozuvi allaqachon bo'lgani holda). Endi xatosiz broadcast.
  broadcastToAdmins({ type: 'new_receipt', receipt });

  res.json({ ok: true, receipt });
});

app.put('/api/receipts/:id/review', auth, adminOnly, (req, res) => {
  const { decision } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ ok: false, error: 'decision: approved/rejected' });

  const result = Receipts.review(req.params.id, req.user.id, decision);
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

  AuditLogs.add({ adminId: req.user.id, action: decision === 'approved' ? 'APPROVE_RECEIPT' : 'REJECT_RECEIPT', targetId: req.params.id, details: `${result.receipt.amount} so'm` });

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

app.get('/api/plans', (req, res) => res.json({ ok: true, plans: Plans.getAll() }));

app.post('/api/plans', auth, adminOnly, (req, res) => {
  const plan = Plans.upsert(req.body);
  res.json({ ok: true, plan });
});

app.put('/api/plans/:id', auth, adminOnly, (req, res) => {
  const plan = Plans.upsert({ ...req.body, id: req.params.id });
  res.json({ ok: true, plan });
});

app.delete('/api/plans/:id', auth, adminOnly, (req, res) => {
  Plans.delete(req.params.id);
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
// paytida `PromoCodes.consume()` bilan oshiriladi.
app.post('/api/promo/validate', auth, (req, res) => {
  const result = PromoCodes.validate(req.body?.code || '');
  res.json({ ok: true, ...result });
});

app.get('/api/promo', auth, adminOnly, (req, res) => res.json({ ok: true, promoCodes: PromoCodes.getAll() }));

app.post('/api/promo', auth, adminOnly, (req, res) => {
  PromoCodes.create(req.body);
  res.json({ ok: true });
});

app.delete('/api/promo/:code', auth, adminOnly, (req, res) => {
  PromoCodes.delete(req.params.code);
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

app.get('/api/history/:userId', auth, ownerOrAdmin('userId'), (req, res) => res.json({ ok: true, history: WatchHistory.getByUser(req.params.userId) }));
app.post('/api/history', auth, ownerOrAdmin('userId'), (req, res) => { WatchHistory.add(req.body); res.json({ ok: true }); });
app.delete('/api/history/:userId', auth, ownerOrAdmin('userId'), (req, res) => { WatchHistory.clear(req.params.userId); res.json({ ok: true }); });

app.get('/api/favorites/:userId', auth, ownerOrAdmin('userId'), (req, res) => res.json({ ok: true, favorites: Favorites.getByUser(req.params.userId) }));
app.post('/api/favorites', auth, ownerOrAdmin('userId'), (req, res) => {
  const added = Favorites.toggle(req.body.userId, req.body.contentId);
  res.json({ ok: true, added });
});

// ═══════════════════════════════════════════════════════════════════════════
//  SETTINGS API
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/settings', auth, adminOnly, (req, res) => res.json({ ok: true, settings: Settings.get() }));
app.put('/api/settings', auth, adminOnly, (req, res) => {
  const settings = Settings.update(req.body);
  AuditLogs.add({ adminId: req.user.id, action: 'UPDATE_SETTINGS' });
  res.json({ ok: true, settings });
});

// ═══════════════════════════════════════════════════════════════════════════
//  ADMINS API
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/admins', auth, adminOnly, (req, res) => res.json({ ok: true, admins: Admins.getAll() }));
app.post('/api/admins', auth, adminOnly, (req, res) => {
  if (!Admins.isSuperAdmin(req.user.id)) return res.status(403).json({ ok: false, error: 'Faqat Bosh Admin' });
  Admins.upsert(req.body);
  AuditLogs.add({ adminId: req.user.id, action: 'APPOINT_ADMIN', targetId: req.body.id, targetTitle: req.body.name });
  res.json({ ok: true });
});
app.delete('/api/admins/:id', auth, adminOnly, (req, res) => {
  if (!Admins.isSuperAdmin(req.user.id)) return res.status(403).json({ ok: false, error: 'Faqat Bosh Admin' });
  const ok = Admins.remove(req.params.id);
  if (!ok) return res.status(400).json({ ok: false, error: 'Bosh Admin o\'chirib bo\'lmaydi' });
  res.json({ ok: true });
});

// ═══════════════════════════════════════════════════════════════════════════
//  DAILY CHECK-IN & TOKENS API
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/checkin/:userId', auth, ownerOrAdmin('userId'), (req, res) => {
  const status = DailyCheckIn.getStatus(req.params.userId);
  res.json({ ok: true, ...status });
});

app.post('/api/checkin/:userId/claim', auth, ownerOrAdmin('userId'), (req, res) => {
  const result = DailyCheckIn.claim(req.params.userId);
  res.json({ ok: true, ...result });
});

app.post('/api/tokens/unlock', auth, ownerOrAdmin('userId'), (req, res) => {
  const { userId, contentId, episodeId, title, episodeTitle } = req.body || {};
  if (!contentId) return res.status(400).json({ ok: false, error: 'contentId majburiy' });

  const result = TokenUnlock.useToken(String(userId), String(contentId), episodeId, title, episodeTitle);

  // Token yetmasa bu MUVAFFAQIYATSIZ so'rov — ilgari har doim `ok: true`
  // qaytarilardi va frontend xatoni ajrata olmasdi.
  if (!result.success) return res.status(400).json({ ok: false, ...result });
  res.json({ ok: true, ...result });
});

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

app.post('/api/verify/start', verifyStartLimiter, (req, res) => {
  if (!BOT_TOKEN) {
    return res.status(503).json({ ok: false, error: 'Bot sozlanmagan. Administrator bilan bog\'laning.' });
  }

  const botUsername = Settings.get().botUsername || process.env.BOT_USERNAME || '';
  if (!botUsername) {
    return res.status(503).json({ ok: false, error: 'Bot username sozlanmagan.' });
  }

  const code = generateVerifyCode();
  VerificationCodes.create(code);

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
app.get('/api/verify/status', (req, res) => {
  const row = VerificationCodes.getByCode(req.query.code);
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

  const user = Users.getById(String(row.telegram_id));
  if (!user) return res.status(404).json({ ok: false, error: 'Foydalanuvchi topilmadi' });

  // Avtomatik admin: .env da ko'rsatilgan bo'lsa jadvalga ham yozamiz
  Admins.ensureEnvAdmin(user.id, { name: user.firstName, username: user.username });
  const isAdmin = Admins.isAdmin(user.id);

  const token = jwt.sign({ id: user.id, username: user.username, isAdmin }, JWT_SECRET, { expiresIn: '24h' });
  VerificationCodes.markClaimed(row.code);

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
app.get('/api/me/entitlements', auth, (req, res) => {
  // Avval muddati o'tgan obunani yopamiz — shunda javob har doim aktual.
  try {
    Users.expireSubscriptions();
  } catch (err) {
    console.error('[Entitlements] expireSubscriptions:', err);
  }

  const user = Users.getById(String(req.user.id));
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
      syncedAt: new Date().toISOString(),
    },
  });
});

// ═══════════════════════════════════════════════════════════════════════════
//  STATS & AUDIT
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/stats', auth, adminOnly, (req, res) => res.json({
  ok: true,
  stats: Stats.dashboard(),
  sseConnections: sseConnectionCount(),
}));

// ESKI KOD: `Number(req.query.limit) || 100` — manfiy yoki juda katta qiymat
// to'g'ridan-to'g'ri SQL `LIMIT` ga ketardi, `LIMIT -1` esa SQLite'da
// "cheklovsiz" degani, ya'ni butun jurnalni bir so'rovda tortib olish mumkin.
app.get('/api/audit-logs', auth, adminOnly, (req, res) => {
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
    const result = Receipts.review(receiptId, fromId, decision);

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
    if (!isBotAdmin(from)) { await tgAnswer(update.callback_query.id, '❌ Ruxsat yo\'q'); return; }
    if (data.startsWith('approve:')) await processCmd(data.replace('approve:', ''), 'approved', from, chat, update.callback_query.id);
    else if (data.startsWith('reject:')) await processCmd(data.replace('reject:', ''), 'rejected', from, chat, update.callback_query.id);
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
  Users.syncTelegramProfile(message.from);

  // .env da ko'rsatilgan admin bo'lsa — avtomatik ro'yxatga olamiz
  Admins.ensureEnvAdmin(from, {
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
  // ESKI KOD: `if (!adminIds.includes(from)) return;` — ya'ni oddiy
  // foydalanuvchi botga yozsa bot BUTUNLAY JIM turardi ("bot ishlamayapti").
  // Endi bot avvalo oddiy foydalanuvchiga xizmat qiladi.
  if (txt.startsWith('/start')) {
    // Deep link: `/start <kod>` — sayt bergan bir martalik kod
    const parts = txt.split(/\s+/);
    const code = parts.length > 1 ? parts[1].trim() : '';

    if (code) {
      const attached = VerificationCodes.attachChat(code, from, chat);
      if (!attached) {
        await tgSend(chat, [
          "⚠️ <b>Tasdiqlash kodi yaroqsiz yoki muddati tugagan.</b>",
          '',
          'Iltimos, saytga qaytib "Telegram orqali tasdiqlash" tugmasini qaytadan bosing.',
        ].join('\n'));
        return;
      }
    }

    const user = Users.getById(from);
    if (user?.isPhoneVerified) {
      await tgSend(chat, [
        `✅ <b>Salom, ${escapeTgHtml(user.firstName)}!</b>`,
        '',
        'Hisobingiz allaqachon tasdiqlangan — saytdan bemalol foydalanishingiz mumkin.',
      ].join('\n'), buildOpenAppKeyboard());

      // Sayt kod orqali kutib turgan bo'lsa, uni ham darhol yopamiz
      if (code) {
        VerificationCodes.markVerified(code, from, user.phone);
        sendToUser(from, { type: 'verification_complete' });
      }
      return;
    }

    // Kontakt so'raymiz — bu tasdiqlashning YAGONA usuli
    await tgSendWithKeyboard(chat, [
      `👋 <b>MANYAK TV ga xush kelibsiz!</b>`,
      '',
      "Hisobingizni tasdiqlash uchun pastdagi <b>«📱 Kontaktni yuborish»</b> tugmasini bosing.",
      '',
      "🔒 Kontakt faqat hisobingizni tasdiqlash uchun ishlatiladi.",
    ].join('\n'), {
      keyboard: [[{ text: '📱 Kontaktni yuborish', request_contact: true }]],
      resize_keyboard: true,
      one_time_keyboard: true,
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
    const s = Stats.dashboard();
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
  Users.syncTelegramProfile(message.from);
  const user = Users.verifyByContact(from, normalizedPhone);
  if (!user) {
    await tgSend(chat, "⚠️ Hisob topilmadi. Iltimos /start buyrug'ini qaytadan yuboring.");
    return;
  }

  // Shu suhbat uchun sayt kutib turgan kod bo'lsa — uni yopamiz
  const pending = VerificationCodes.findAwaitingByChat(chat);
  if (pending) {
    VerificationCodes.markVerified(pending.code, from, normalizedPhone);
  }

  // Sayt real-time yangilanishi uchun SSE
  sendToUser(from, { type: 'verification_complete' });
  broadcastToAdmins({ type: 'user_verified', userId: from });

  const isAdminUser = Admins.isAdmin(from);

  await tgSend(chat, [
    `✅ <b>Hisobingiz tasdiqlandi!</b>`,
    '',
    `👤 <b>Ism:</b> ${escapeTgHtml(user.firstName)} ${escapeTgHtml(user.lastName || '')}`.trim(),
    user.username ? `🔗 <b>Username:</b> @${escapeTgHtml(user.username)}` : '',
    `🆔 <b>ID:</b> <code>${from}</code>`,
    `📞 <b>Telefon:</b> ${escapeTgHtml(normalizedPhone)}`,
    '',
    isAdminUser
      ? '👑 Sizga <b>administrator</b> huquqi berildi.'
      : '🎬 Endi saytda barcha imkoniyatlardan foydalanishingiz mumkin.',
  ].filter(Boolean).join('\n'), buildOpenAppKeyboard());

  // Adminlarga xabar (faqat adminlarga — oddiy foydalanuvchilar ko'rmaydi)
  const adminReport = [
    `🔔 <b>Yangi foydalanuvchi tasdiqlandi</b>`,
    `👤 ${escapeTgHtml(user.firstName)} ${user.username ? `(@${escapeTgHtml(user.username)})` : ''}`,
    `🆔 <code>${from}</code>`,
    `📞 ${escapeTgHtml(normalizedPhone)}`,
  ].join('\n');
  for (const adminId of botAdminIds()) {
    if (adminId === from) continue;
    await tgSend(adminId, adminReport);
  }
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
function botAdminIds() {
  const ids = new Set([String(SUPER_ADMIN_ID)]);
  for (const id of String(process.env.ADMIN_IDS || '').split(',').map((s) => s.trim()).filter(Boolean)) {
    ids.add(id);
  }
  try {
    for (const a of Admins.getAll()) ids.add(String(a.id));
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
  const appUrl = process.env.APP_URL;
  if (!appUrl || !appUrl.startsWith('https://')) return null;
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

app.post('/api/broadcast', auth, adminOnly, async (req, res) => {
  const { text, photoUrl, buttonText, buttonUrl } = req.body;
  if (!text) return res.status(400).json({ ok: false, error: 'Matn kerak' });
  if (!BOT_TOKEN) return res.status(503).json({ ok: false, error: 'Bot token sozlanmagan' });

  try {
    const allUsers = Users.getAll();
    let successCount = 0;
    
    // Yuborish uchun payload tayyorlash
    const payloadTemplate = { parse_mode: 'HTML' };
    if (buttonText && buttonUrl) {
      payloadTemplate.reply_markup = {
        inline_keyboard: [[{ text: buttonText, url: buttonUrl }]]
      };
    }
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
      for (const user of allUsers) {
        if (!user.id) continue;
        try {
          const payload = { ...payloadTemplate, chat_id: user.id };
          const response = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/${endpoint}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          if (response.ok) {
            successCount++;
          } else {
            const errData = await response.json();
            console.error(`[Broadcast API Error for user ${user.id}]:`, errData.description);
          }
          // API limit (30 req/sec) dan oshmaslik uchun kutish
          await new Promise(resolve => setTimeout(resolve, 50));
        } catch (e) {
          console.error(`[Broadcast Network Error]:`, e.message);
        }
      }
      AuditLogs.add({ adminId: req.user.id, action: 'BROADCAST', details: `${successCount} ta foydalanuvchiga yuborildi.` });
    })();

  } catch (err) {
    console.error('[Broadcast]', err);
    if (!res.headersSent) res.status(500).json({ ok: false, error: 'Xatolik yuz berdi' });
  }
});

app.post('/api/setup-webhook', auth, adminOnly, async (req, res) => {
  if (!BOT_TOKEN) return res.status(503).json({ ok: false });
  const url = req.body.webhookUrl || `${process.env.APP_URL}/webhook`;
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

app.post('/api/sync-user', auth, (req, res) => {
  try {
    const frontendUser = req.body;
    if (!frontendUser || !frontendUser.id) return res.status(400).json({ ok: false, error: "Foydalanuvchi ma'lumoti yo'q" });

    if (String(frontendUser.id) !== String(req.user.id) && !req.user.isAdmin) {
      return res.status(403).json({ ok: false, error: 'Ruxsat yo\'q' });
    }

    const backendUser = Users.getById(String(frontendUser.id));
    if (!backendUser) return res.status(404).json({ ok: false, error: 'Foydalanuvchi topilmadi' });

    // Faqat zararsiz maydonlarni frontend qiymati bilan yangilaymiz;
    // pul/huquqqa oid maydonlar backend'dagi (haqiqiy) qiymatida qoladi.
    const mergedUser = { ...backendUser, ...frontendUser };
    for (const field of SERVER_OWNED_USER_FIELDS) {
      mergedUser[field] = backendUser[field];
    }

    Users.upsert(mergedUser);
    res.json({ ok: true, user: mergedUser });
  } catch (err) {
    console.error('[Sync Error]', err);
    res.status(500).json({ ok: false });
  }
});

app.post('/api/sync-receipt', auth, (req, res) => {
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

// ─── Health ─────────────────────────────────────────────────────────────────
// ESKI KOD: bu endpoint autentifikatsiyasiz `Stats.dashboard()` ni qaytarardi,
// ya'ni istalgan odam foydalanuvchilar soni, VIP soni va UMUMIY DAROMADni
// (totalRevenue) ko'ra olardi. Endi health faqat "tirikmi?" degan savolga
// javob beradi; biznes ko'rsatkichlari /api/stats da, admin himoyasi ostida.
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'MANYK TV SQLite Backend',
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
  const appUrl = process.env.APP_URL || null;
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
app.get('*', (req, res) => {
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
// ESKI KOD: `Users.expireSubscriptions()` database.js da yozilgan, lekin
// BUTUN LOYIHADA HECH QAYERDA CHAQIRILMAGAN edi. Natijada serverda VIP hech
// qachon tugamasdi: muddati o'tgan foydalanuvchiga /api/sync-user va
// /api/me/entitlements doim `isVip: true` qaytarib berardi.
// Tugash faqat klient tomonida (localStorage'da) hisoblanardi — ya'ni
// foydalanuvchi localStorage'ni tozalab, obunani "tiklab" olishi mumkin edi.
function runExpirySweep() {
  try {
    const result = Users.expireSubscriptions();
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
async function setupBotWebhook() {
  if (!BOT_TOKEN) {
    console.warn('[Bot] ⚠️  TELEGRAM_BOT_TOKEN yo\'q — bot ishlamaydi. .env ga qo\'shing.');
    return;
  }

  const appUrl = process.env.APP_URL;
  if (!appUrl || !appUrl.startsWith('https://')) {
    console.warn('[Bot] ⚠️  APP_URL yo\'q yoki https:// bilan boshlanmaydi — webhook o\'rnatilmadi.');
    console.warn('[Bot]    Telegram webhook uchun HTTPS majburiy. Lokal ishlab chiqishda');
    console.warn('[Bot]    ngrok/cloudflared kabi tunnel ishlatib, APP_URL ga uning manzilini yozing.');
    return;
  }

  const webhookUrl = `${appUrl.replace(/\/+$/, '')}/webhook`;

  // Bot haqiqatan ishlayotganini tekshiramiz (token to'g'rimi?)
  const me = await tgApi('getMe', {});
  if (!me.ok) {
    console.error(`[Bot] ❌ Bot tokeni yaroqsiz: ${me.description || 'noma\'lum xatolik'}`);
    return;
  }
  console.log(`[Bot] ✅ Bot ulandi: @${me.result.username} (${me.result.first_name})`);

  // Bot username'ini bazaga yozamiz — `/api/verify/start` deep link uchun kerak
  try {
    const current = Settings.get();
    if (current.botUsername !== me.result.username) {
      Settings.update({ botUsername: me.result.username, telegramBotUsername: me.result.username });
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

  // Ochiq SSE ulanishlarini yopamiz
  for (const clients of sseClients.values()) {
    for (const client of clients) {
      try { client.res.end(); } catch { /* allaqachon yopilgan */ }
    }
  }
  sseClients.clear();

  httpServer.close(() => {
    try {
      db.close();
      console.log('[Shutdown] SQLite yopildi');
    } catch (err) {
      console.error('[Shutdown] DB yopishda xatolik:', err);
    }
    process.exit(exitCode);
  });

  // 10 sekunddan keyin majburiy chiqish (ulanishlar osilib qolsa)
  setTimeout(() => process.exit(exitCode), 10000).unref();
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// ─── Start ──────────────────────────────────────────────────────────────────
httpServer.listen(PORT, () => {
  console.log(`\n🚀 MANYK TV SQLite Backend v2.0`);
  console.log(`   http://localhost:${PORT}`);
  console.log(`   Health:     /api/health`);
  console.log(`   Webhook:    /webhook`);
  console.log(`   DB:         data/manyktv.db`);
  console.log(`   Bot:        ${BOT_TOKEN ? '✅' : '⚠️  .env da TELEGRAM_BOT_TOKEN yozing'}`);
  console.log(`   Security:   HMAC-SHA256 + JWT + Rate Limit\n`);
});

export default app;
