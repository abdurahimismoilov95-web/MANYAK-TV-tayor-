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
  DailyCheckIn, TokenUnlock, Stats, seedIfEmpty, SUPER_ADMIN_ID, db
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

    const isAdmin = Admins.isAdmin(String(user.id));
    const token = jwt.sign({ id: String(user.id), username: user.username, isAdmin }, JWT_SECRET, { expiresIn: '24h' });

    // Upsert user in DB
    const existing = Users.getById(String(user.id));
    if (!existing) {
      Users.upsert({
        id: String(user.id), firstName: user.first_name || '', lastName: user.last_name || '',
        username: user.username || '', isVip: isAdmin, createdAt: new Date().toISOString(),
        lastLoginAt: new Date().toISOString(), purchasedContentIds: [], accessTokens: 0,
      });
    } else {
      existing.firstName = user.first_name || existing.firstName;
      existing.lastName = user.last_name || existing.lastName;
      existing.lastLoginAt = new Date().toISOString();
      Users.upsert(existing);
    }

    res.json({ ok: true, token, user: Users.getById(String(user.id)), isAdmin });
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

  const adminIds = [SUPER_ADMIN_ID, ...(process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean)];

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
    if (!adminIds.includes(from)) { await tgAnswer(update.callback_query.id, '❌ Ruxsat yo\'q'); return; }
    if (data.startsWith('approve:')) await processCmd(data.replace('approve:', ''), 'approved', from, chat, update.callback_query.id);
    else if (data.startsWith('reject:')) await processCmd(data.replace('reject:', ''), 'rejected', from, chat, update.callback_query.id);
  }

  if (update.message?.text) {
    const from = String(update.message.from?.id || '');
    const txt = update.message.text.trim();
    const chat = update.message.chat?.id;
    if (!adminIds.includes(from)) return;
    if (txt.startsWith('/approve_')) await processCmd(txt.replace('/approve_', ''), 'approved', from, chat);
    else if (txt.startsWith('/reject_')) await processCmd(txt.replace('/reject_', ''), 'rejected', from, chat);
    else if (txt === '/start') await tgSend(chat, `✅ <b>MANYK TV Bot</b>\nBuyruqlar:\n/approve_ID\n/reject_ID`);
    else if (txt === '/stats') {
      const s = Stats.dashboard();
      await tgSend(chat, `📊 <b>Statistika</b>\nFoydalanuvchilar: ${s.totalUsers}\nVIP: ${s.vipUsers}\nKontentlar: ${s.totalContent}\nKutilayotgan cheklar: ${s.pendingReceipts}\nDaromad: ${s.totalRevenue} so'm`);
    }
  }
}

async function tgSend(chatId, text) {
  if (!BOT_TOKEN || !chatId) return;
  try { await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }) }); } catch {}
}
async function tgAnswer(cbId, text) {
  if (!BOT_TOKEN || !cbId) return;
  try { await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/answerCallbackQuery`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ callback_query_id: cbId, text }) }); } catch {}
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
