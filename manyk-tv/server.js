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

// ─── SSE ────────────────────────────────────────────────────────────────────
const sseClients = new Map();
app.get('/api/events', (req, res) => {
  const userId = req.query.userId;
  if (!userId) return res.status(400).json({ error: 'userId required' });
  res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', 'Connection': 'keep-alive' });
  res.write(`data: ${JSON.stringify({ type: 'connected', userId })}\n\n`);
  const ping = setInterval(() => res.write(': ping\n\n'), 25000);
  sseClients.set(String(userId), res);
  req.on('close', () => { clearInterval(ping); sseClients.delete(String(userId)); });
});

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
  for (const [, client] of sseClients) {
    client.write(`data: ${JSON.stringify({ type: 'content_updated', action: 'add', contentId: content.id })}\n\n`);
  }
  res.json({ ok: true, content });
});

app.put('/api/contents/:id', auth, adminOnly, (req, res) => {
  const content = Contents.upsert({ ...req.body, id: req.params.id });
  for (const [, client] of sseClients) {
    client.write(`data: ${JSON.stringify({ type: 'content_updated', action: 'update', contentId: content.id })}\n\n`);
  }
  res.json({ ok: true, content });
});

app.delete('/api/contents/:id', auth, adminOnly, (req, res) => {
  Contents.delete(req.params.id);
  AuditLogs.add({ adminId: req.user.id, action: 'DELETE_CONTENT', targetId: req.params.id });
  for (const [, client] of sseClients) {
    client.write(`data: ${JSON.stringify({ type: 'content_updated', action: 'delete', contentId: req.params.id })}\n\n`);
  }
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

const ALLOWED_UPLOAD_EXT = new Set([
  'jpg', 'jpeg', 'png', 'webp', 'gif',
  'mp4', 'webm', 'mov', 'm3u8', 'ts',
]);

app.post(
  '/api/upload',
  auth,
  adminOnly,
  express.raw({ type: '*/*', limit: '2gb' }),
  (req, res) => {
    if (!req.body || !req.body.length) {
      return res.status(400).json({ ok: false, error: "Fayl bo'sh yoki yuborilmadi" });
    }
    let ext = String(req.query.ext || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (!ALLOWED_UPLOAD_EXT.has(ext)) {
      // Kengaytma ruxsat etilmagan yoki noma'lum bo'lsa — Content-Type'dan tахmin qilamiz
      const mime = String(req.headers['content-type'] || '');
      if (mime.includes('video')) ext = 'mp4';
      else if (mime.includes('png')) ext = 'png';
      else if (mime.includes('webp')) ext = 'webp';
      else ext = 'jpg';
    }
    const filename = `${Date.now()}_${crypto.randomBytes(8).toString('hex')}.${ext}`;
    const filepath = path.join(UPLOADS_DIR, filename);
    try {
      fs.writeFileSync(filepath, req.body);
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

app.post('/api/receipts', (req, res) => {
  const receipt = Receipts.submit(req.body);
  // Notify admin via SSE
  for (const [, client] of sseClients) {
    client.write(`data: ${JSON.stringify({ type: 'new_receipt', receipt })}\n\n`);
  }
  res.json({ ok: true, receipt });
});

app.put('/api/receipts/:id/review', auth, adminOnly, (req, res) => {
  const { decision } = req.body; // 'approved' | 'rejected'
  if (!['approved', 'rejected'].includes(decision)) return res.status(400).json({ ok: false, error: 'decision: approved/rejected' });

  const receipt = Receipts.review(req.params.id, req.user.id, decision);
  if (!receipt) return res.status(404).json({ ok: false, error: 'Chek topilmadi' });

  AuditLogs.add({ adminId: req.user.id, action: decision === 'approved' ? 'APPROVE_RECEIPT' : 'REJECT_RECEIPT', targetId: req.params.id, details: `${receipt.amount} so'm` });

  // SSE broadcast
  for (const [, client] of sseClients) {
    client.write(`data: ${JSON.stringify({ type: 'payment_decision', receiptId: req.params.id, decision, adminId: req.user.id })}\n\n`);
  }

  res.json({ ok: true, receipt });
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

app.post('/api/promo/validate', (req, res) => {
  const result = PromoCodes.validate(req.body.code || '');
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
  const { userId, contentId, episodeId, title, episodeTitle } = req.body;
  const result = TokenUnlock.useToken(userId, contentId, episodeId, title, episodeTitle);
  res.json({ ok: true, ...result });
});

// ═══════════════════════════════════════════════════════════════════════════
//  STATS & AUDIT
// ═══════════════════════════════════════════════════════════════════════════

app.get('/api/stats', auth, adminOnly, (req, res) => res.json({ ok: true, stats: Stats.dashboard() }));
app.get('/api/audit-logs', auth, adminOnly, (req, res) => res.json({ ok: true, logs: AuditLogs.getAll(Number(req.query.limit) || 100) }));

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
  res.json({ ok: true });

  const update = req.body;
  if (!update) return;

  const adminIds = [SUPER_ADMIN_ID, ...(process.env.ADMIN_IDS || '').split(',').map(s => s.trim()).filter(Boolean)];

  const processCmd = async (receiptId, decision, fromId, chatId, msgId, cbId) => {
    const receipt = Receipts.review(receiptId, fromId, decision);
    const emoji = decision === 'approved' ? '✅' : '❌';
    const status = decision === 'approved' ? 'TASDIQLANDI' : 'RAD ETILDI';

    for (const [, c] of sseClients) c.write(`data: ${JSON.stringify({ type: 'payment_decision', receiptId, decision, adminId: fromId })}\n\n`);

    if (chatId) await tgSend(chatId, `${emoji} <b>Chek ${status}!</b>\nID: <code>${receiptId}</code>`);
    if (cbId) await tgAnswer(cbId, `${emoji} ${status}!`);
  };

  if (update.callback_query) {
    const from = String(update.callback_query.from?.id || '');
    const data = String(update.callback_query.data || '');
    const chat = update.callback_query.message?.chat?.id;
    if (!adminIds.includes(from)) { await tgAnswer(update.callback_query.id, '❌ Ruxsat yo\'q'); return; }
    if (data.startsWith('approve:')) await processCmd(data.replace('approve:', ''), 'approved', from, chat, null, update.callback_query.id);
    else if (data.startsWith('reject:')) await processCmd(data.replace('reject:', ''), 'rejected', from, chat, null, update.callback_query.id);
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
});

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
  const r = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ url, secret_token: WEBHOOK_SECRET, allowed_updates: ['message', 'callback_query'], drop_pending_updates: true }) });
  res.json(await r.json());
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
    
    stmt.run(
      receipt.id, receipt.userId, receipt.userName, receipt.userPhone, receipt.type, 
      receipt.planId || null, receipt.planName || null, receipt.contentId || null, receipt.contentTitle || null, 
      receipt.amount, receipt.discountApplied || 0, receipt.promoCodeUsed || null, 
      receipt.receiptImageUrl, receipt.notes || null, status,
      receipt.submittedAt || new Date().toISOString(), reviewedAt, reviewedBy
    );
    
    res.json({ ok: true });
  } catch (err) {
    console.error('[Sync Receipt Error]', err);
    res.status(500).json({ ok: false });
  }
});

// ─── Bot Webhook & API ──────────────────────────────────────────────────────
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'MANYK TV SQLite Backend', version: '2.0.0', uptime: Math.floor(process.uptime()), sseClients: sseClients.size, stats: Stats.dashboard() });
});

// ─── Static (production) ──────────────────────────────────────────────────
const distPath = path.join(__dirname, 'dist');
app.use(express.static(distPath));
app.get('*', (req, res) => {
  if (req.path.startsWith('/api/') || req.path === '/webhook') return res.status(404).json({ error: 'Not found' });
  res.sendFile(path.join(distPath, 'index.html'));
});

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
