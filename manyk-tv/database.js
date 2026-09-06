/**
 * MANYK TV — SQLite Database Module
 * ===================================
 * Barcha jadvallar, CRUD amallar, va ma'lumotlar bazasi logikasi.
 * node:sqlite — Node.js'ning o'zida ichki mavjud bo'lgan sinxron SQLite modul.
 *
 * MUHIM: avval "better-sqlite3" (native/C++ kompilyatsiya talab qiladigan modul)
 * ishlatilgan edi. Bu loyiha Bun bilan o'rnatilib, keyin oddiy Node.js bilan
 * ishga tushirilgani sababli, kompilyatsiya qilingan native fayl ikkala muhit
 * o'rtasida mos kelmay, server ishga tushgan zahoti "SIGSEGV" bilan qulab
 * tushardi. node:sqlite Node.js'ning o'zida tayyor kelgani uchun bunday
 * moslik muammosi umuman bo'lmaydi — kompilyatsiya kerak emas.
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, 'data', 'manyktv.db');

// Ensure data directory exists
import fs from 'fs';
fs.mkdirSync(path.join(__dirname, 'data'), { recursive: true });

const db = new DatabaseSync(DB_PATH);

// Performance optimizations
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');

// node:sqlite'da better-sqlite3'dagi db.transaction() yordamchisi yo'q —
// shu yordamchi funksiya bilan xuddi shu xatti-harakatni takrorlaymiz.
function transaction(fn) {
  return (items) => {
    db.exec('BEGIN');
    try {
      fn(items);
      db.exec('COMMIT');
    } catch (err) {
      db.exec('ROLLBACK');
      throw err;
    }
  };
}

// ══════════════════════════════════════════════════════════════════
//  SCHEMA — Jadvallar yaratish
// ══════════════════════════════════════════════════════════════════

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    first_name TEXT NOT NULL DEFAULT '',
    last_name TEXT DEFAULT '',
    username TEXT DEFAULT '',
    phone TEXT,
    is_phone_verified INTEGER DEFAULT 0,
    is_vip INTEGER DEFAULT 0,
    vip_expires_at TEXT,
    purchased_content_ids TEXT DEFAULT '[]',
    device_token TEXT,
    access_tokens INTEGER DEFAULT 0,
    unlocked_episode_ids TEXT DEFAULT '[]',
    vip_discount_percent INTEGER DEFAULT 0,
    bonus_balance INTEGER DEFAULT 0,
    daily_checkin TEXT DEFAULT '{}',
    hwid_binding TEXT,
    is_banned INTEGER DEFAULT 0,
    ban_reason TEXT,
    is_device_banned INTEGER DEFAULT 0,
    created_at TEXT NOT NULL,
    last_login_at TEXT
  );

  CREATE TABLE IF NOT EXISTS receipts (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    user_name TEXT,
    user_phone TEXT,
    type TEXT NOT NULL,
    plan_id TEXT,
    plan_name TEXT,
    content_id TEXT,
    content_title TEXT,
    amount INTEGER NOT NULL DEFAULT 0,
    discount_applied INTEGER DEFAULT 0,
    promo_code_used TEXT,
    receipt_image_url TEXT,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'pending',
    created_at TEXT NOT NULL,
    reviewed_at TEXT,
    reviewed_by TEXT
  );

  CREATE TABLE IF NOT EXISTS contents (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    type TEXT NOT NULL,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS plans (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    price INTEGER NOT NULL,
    original_price INTEGER,
    duration_days INTEGER NOT NULL,
    badge TEXT,
    is_active INTEGER DEFAULT 1,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS promo_codes (
    code TEXT PRIMARY KEY,
    discount_percent INTEGER NOT NULL,
    max_uses INTEGER DEFAULT 100,
    current_uses INTEGER DEFAULT 0,
    expires_at TEXT,
    is_active INTEGER DEFAULT 1
  );

  CREATE TABLE IF NOT EXISTS watch_history (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    episode_id TEXT,
    content_title TEXT,
    episode_title TEXT,
    poster_url TEXT,
    progress_seconds REAL DEFAULT 0,
    total_seconds REAL DEFAULT 0,
    watched_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS favorites (
    user_id TEXT NOT NULL,
    content_id TEXT NOT NULL,
    added_at TEXT NOT NULL,
    PRIMARY KEY (user_id, content_id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    data TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS appointed_admins (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT DEFAULT '',
    role_title TEXT DEFAULT 'Admin',
    is_super_admin INTEGER DEFAULT 0,
    permissions TEXT NOT NULL DEFAULT '{}',
    appointed_at TEXT,
    appointed_by TEXT
  );

  CREATE TABLE IF NOT EXISTS audit_logs (
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

  CREATE TABLE IF NOT EXISTS banned_devices (
    device_token TEXT PRIMARY KEY,
    banned_at TEXT NOT NULL
  );

  CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);
  CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
  CREATE INDEX IF NOT EXISTS idx_history_user ON watch_history(user_id);
  CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id);
`);

// ══════════════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════════════

// MUHIM: Bosh admin ID endi .env fayldagi SUPER_ADMIN_ID dan olinadi.
// Avval bu yerda '891846690' qattiq yozilgan edi — bu .env ga SUPER_ADMIN_ID
// yozilsa ham hech qanday ta'sir qilmasligini anglatardi (jiddiy bug).
if (!process.env.SUPER_ADMIN_ID) {
  console.warn('[SECURITY WARNING] SUPER_ADMIN_ID .env faylda topilmadi! Standart qiymat vaqtincha ishlatilmoqda — buni albatta o\'zgartiring.');
}
const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID || '891846690';

export const Users = {
  getById(id) {
    const row = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
    return row ? rowToUser(row) : null;
  },

  getAll() {
    return db.prepare('SELECT * FROM users ORDER BY last_login_at DESC').all().map(rowToUser);
  },

  upsert(user) {
    db.prepare(`
      INSERT INTO users (id, first_name, last_name, username, phone, is_phone_verified, is_vip,
        vip_expires_at, purchased_content_ids, device_token, access_tokens, unlocked_episode_ids,
        vip_discount_percent, bonus_balance, daily_checkin, hwid_binding, is_banned, ban_reason,
        is_device_banned, created_at, last_login_at)
      VALUES (@id, @firstName, @lastName, @username, @phone, @isPhoneVerified, @isVip,
        @vipExpiresAt, @purchasedContentIds, @deviceToken, @accessTokens, @unlockedEpisodeIds,
        @vipDiscountPercent, @bonusBalance, @dailyCheckin, @hwidBinding, @isBanned, @banReason,
        @isDeviceBanned, @createdAt, @lastLoginAt)
      ON CONFLICT(id) DO UPDATE SET
        first_name = @firstName, last_name = @lastName, username = @username,
        phone = @phone, is_phone_verified = @isPhoneVerified, is_vip = @isVip,
        vip_expires_at = @vipExpiresAt, purchased_content_ids = @purchasedContentIds,
        device_token = @deviceToken, access_tokens = @accessTokens,
        unlocked_episode_ids = @unlockedEpisodeIds, vip_discount_percent = @vipDiscountPercent,
        bonus_balance = @bonusBalance, daily_checkin = @dailyCheckin,
        hwid_binding = @hwidBinding, is_banned = @isBanned, ban_reason = @banReason,
        is_device_banned = @isDeviceBanned, last_login_at = @lastLoginAt
    `).run(userToRow(user));
    return user;
  },

  grantVip(userId, days) {
    const user = this.getById(userId);
    if (!user) return null;
    const currentExp = user.isVip && user.vipExpiresAt && new Date(user.vipExpiresAt).getTime() > Date.now()
      ? new Date(user.vipExpiresAt).getTime() : Date.now();
    user.isVip = true;
    user.vipExpiresAt = new Date(currentExp + days * 86400000).toISOString();
    return this.upsert(user);
  },

  revokeVip(userId) {
    db.prepare('UPDATE users SET is_vip = 0, vip_expires_at = NULL WHERE id = ?').run(userId);
  },

  ban(userId, reason) {
    db.prepare('UPDATE users SET is_banned = 1, ban_reason = ? WHERE id = ?').run(reason || 'Admin tomonidan bloklandi', userId);
  },

  unban(userId) {
    db.prepare('UPDATE users SET is_banned = 0, ban_reason = NULL WHERE id = ?').run(userId);
  },

  resetHwid(userId) {
    db.prepare('UPDATE users SET hwid_binding = NULL, device_token = NULL WHERE id = ?').run(userId);
  },

  expireSubscriptions() {
    const now = new Date().toISOString();
    return db.prepare("UPDATE users SET is_vip = 0 WHERE is_vip = 1 AND vip_expires_at IS NOT NULL AND vip_expires_at <= ?").run(now);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as cnt FROM users').get().cnt;
  },

  vipCount() {
    return db.prepare('SELECT COUNT(*) as cnt FROM users WHERE is_vip = 1').get().cnt;
  },
};

function userToRow(u) {
  return {
    id: u.id,
    firstName: u.firstName || u.first_name || '',
    lastName: u.lastName || u.last_name || '',
    username: u.username || '',
    phone: u.phone || null,
    isPhoneVerified: u.isPhoneVerified ? 1 : 0,
    isVip: u.isVip ? 1 : 0,
    vipExpiresAt: u.vipExpiresAt || null,
    purchasedContentIds: JSON.stringify(u.purchasedContentIds || []),
    deviceToken: u.deviceToken || null,
    accessTokens: u.accessTokens || 0,
    unlockedEpisodeIds: JSON.stringify(u.unlockedEpisodeIds || []),
    vipDiscountPercent: u.vipDiscountPercent || 0,
    bonusBalance: u.bonusBalance || 0,
    dailyCheckin: JSON.stringify(u.dailyCheckIn || u.daily_checkin || {}),
    hwidBinding: u.hwidBinding ? JSON.stringify(u.hwidBinding) : null,
    isBanned: u.isBanned ? 1 : 0,
    banReason: u.banReason || null,
    isDeviceBanned: u.isDeviceBanned ? 1 : 0,
    createdAt: u.createdAt || new Date().toISOString(),
    lastLoginAt: u.lastLoginAt || new Date().toISOString(),
  };
}

function rowToUser(r) {
  return {
    id: r.id,
    firstName: r.first_name,
    lastName: r.last_name,
    username: r.username,
    phone: r.phone,
    isPhoneVerified: Boolean(r.is_phone_verified),
    isVip: Boolean(r.is_vip),
    vipExpiresAt: r.vip_expires_at,
    purchasedContentIds: JSON.parse(r.purchased_content_ids || '[]'),
    deviceToken: r.device_token,
    accessTokens: r.access_tokens || 0,
    unlockedEpisodeIds: JSON.parse(r.unlocked_episode_ids || '[]'),
    vipDiscountPercent: r.vip_discount_percent || 0,
    bonusBalance: r.bonus_balance || 0,
    dailyCheckIn: JSON.parse(r.daily_checkin || '{}'),
    hwidBinding: r.hwid_binding ? JSON.parse(r.hwid_binding) : undefined,
    isBanned: Boolean(r.is_banned),
    banReason: r.ban_reason,
    isDeviceBanned: Boolean(r.is_device_banned),
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at,
  };
}

// ══════════════════════════════════════════════════════════════════
//  RECEIPTS (To'lov cheklari)
// ══════════════════════════════════════════════════════════════════

export const Receipts = {
  getAll() {
    return db.prepare('SELECT * FROM receipts ORDER BY created_at DESC').all();
  },

  getByStatus(status) {
    return db.prepare('SELECT * FROM receipts WHERE status = ? ORDER BY created_at DESC').all(status);
  },

  getById(id) {
    return db.prepare('SELECT * FROM receipts WHERE id = ?').get(id);
  },

  getByUserId(userId) {
    return db.prepare('SELECT * FROM receipts WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  },

  submit(data) {
    const id = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const receipt = {
      id,
      user_id: data.userId,
      user_name: data.userName || '',
      user_phone: data.userPhone || null,
      type: data.type,
      plan_id: data.planId || null,
      plan_name: data.planName || null,
      content_id: data.contentId || null,
      content_title: data.contentTitle || null,
      amount: data.amount || 0,
      discount_applied: data.discountApplied || 0,
      promo_code_used: data.promoCodeUsed || null,
      receipt_image_url: data.receiptImageUrl || null,
      notes: data.notes || null,
      status: 'pending',
      created_at: new Date().toISOString(),
      reviewed_at: null,
      reviewed_by: null,
    };

    db.prepare(`
      INSERT INTO receipts (id, user_id, user_name, user_phone, type, plan_id, plan_name,
        content_id, content_title, amount, discount_applied, promo_code_used,
        receipt_image_url, notes, status, created_at)
      VALUES (@id, @user_id, @user_name, @user_phone, @type, @plan_id, @plan_name,
        @content_id, @content_title, @amount, @discount_applied, @promo_code_used,
        @receipt_image_url, @notes, @status, @created_at)
    `).run(receipt);

    return receipt;
  },

  review(receiptId, reviewerId, decision) {
    const now = new Date().toISOString();
    db.prepare('UPDATE receipts SET status = ?, reviewed_at = ?, reviewed_by = ? WHERE id = ?')
      .run(decision, now, reviewerId, receiptId);

    const receipt = this.getById(receiptId);

    // Tasdiqlanganda — foydalanuvchiga VIP yoki kontent berish
    if (decision === 'approved' && receipt) {
      if (receipt.type === 'vip_subscription') {
        const plan = Plans.getById(receipt.plan_id);
        const days = plan?.duration_days || 30;
        Users.grantVip(receipt.user_id, days);
      } else if (receipt.type === 'single_content' && receipt.content_id) {
        const user = Users.getById(receipt.user_id);
        if (user) {
          if (!user.purchasedContentIds.includes(receipt.content_id)) {
            user.purchasedContentIds.push(receipt.content_id);
            Users.upsert(user);
          }
        }
      }
    }

    return receipt;
  },

  pendingCount() {
    return db.prepare("SELECT COUNT(*) as cnt FROM receipts WHERE status = 'pending'").get().cnt;
  },

  totalRevenue() {
    return db.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM receipts WHERE status = 'approved'").get().total;
  },
};

// ══════════════════════════════════════════════════════════════════
//  CONTENTS (Kino, Serial, Short Drama)
// ══════════════════════════════════════════════════════════════════

export const Contents = {
  getAll() {
    return db.prepare('SELECT * FROM contents ORDER BY rowid DESC').all()
      .map(r => ({ ...JSON.parse(r.data), id: r.id }));
  },

  getById(id) {
    const row = db.prepare('SELECT * FROM contents WHERE id = ?').get(id);
    return row ? { ...JSON.parse(row.data), id: row.id } : null;
  },

  upsert(content) {
    const { id, title, type, ...rest } = content;
    db.prepare(`
      INSERT INTO contents (id, title, type, data)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET title = ?, type = ?, data = ?
    `).run(id, title, type, JSON.stringify(content), title, type, JSON.stringify(content));
    return content;
  },

  delete(id) {
    db.prepare('DELETE FROM contents WHERE id = ?').run(id);
  },

  count() {
    return db.prepare('SELECT COUNT(*) as cnt FROM contents').get().cnt;
  },

  bulkInsert(items) {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO contents (id, title, type, data)
      VALUES (?, ?, ?, ?)
    `);
    const tx = transaction((items) => {
      for (const item of items) {
        insert.run(item.id, item.title, item.type, JSON.stringify(item));
      }
    });
    tx(items);
  },
};

// ══════════════════════════════════════════════════════════════════
//  PLANS (Obuna tariflari)
// ══════════════════════════════════════════════════════════════════

export const Plans = {
  getAll() {
    return db.prepare('SELECT * FROM plans WHERE is_active = 1 ORDER BY price ASC').all()
      .map(r => ({ ...JSON.parse(r.data), id: r.id }));
  },

  getById(id) {
    const row = db.prepare('SELECT * FROM plans WHERE id = ?').get(id);
    return row ? { ...JSON.parse(row.data), id: row.id } : null;
  },

  upsert(plan) {
    db.prepare(`
      INSERT INTO plans (id, name, price, original_price, duration_days, badge, is_active, data)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
      ON CONFLICT(id) DO UPDATE SET name = ?, price = ?, original_price = ?,
        duration_days = ?, badge = ?, data = ?
    `).run(plan.id, plan.name, plan.price, plan.originalPrice || null,
      plan.durationDays, plan.badge || null, JSON.stringify(plan),
      plan.name, plan.price, plan.originalPrice || null,
      plan.durationDays, plan.badge || null, JSON.stringify(plan));
    return plan;
  },

  delete(id) {
    db.prepare('UPDATE plans SET is_active = 0 WHERE id = ?').run(id);
  },

  bulkInsert(items) {
    const insert = db.prepare(`
      INSERT OR REPLACE INTO plans (id, name, price, original_price, duration_days, badge, is_active, data)
      VALUES (?, ?, ?, ?, ?, ?, 1, ?)
    `);
    const tx = transaction((items) => {
      for (const p of items) {
        insert.run(p.id, p.name, p.price, p.originalPrice || null, p.durationDays, p.badge || null, JSON.stringify(p));
      }
    });
    tx(items);
  },
};

// ══════════════════════════════════════════════════════════════════
//  PROMO CODES
// ══════════════════════════════════════════════════════════════════

export const PromoCodes = {
  validate(code) {
    const row = db.prepare('SELECT * FROM promo_codes WHERE code = ? AND is_active = 1').get(code.toUpperCase());
    if (!row) return { valid: false, message: 'Promokod topilmadi yoki muddati tugagan.' };
    if (row.max_uses > 0 && row.current_uses >= row.max_uses) {
      return { valid: false, message: 'Bu promokod ishlatish limiti tugagan.' };
    }
    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return { valid: false, message: 'Bu promokodning muddati tugagan.' };
    }
    // Increment usage
    db.prepare('UPDATE promo_codes SET current_uses = current_uses + 1 WHERE code = ?').run(code.toUpperCase());
    return { valid: true, discountPercent: row.discount_percent, message: `${row.discount_percent}% chegirma qo'llanildi!` };
  },

  getAll() {
    return db.prepare('SELECT * FROM promo_codes ORDER BY rowid DESC').all();
  },

  create(data) {
    db.prepare(`
      INSERT INTO promo_codes (code, discount_percent, max_uses, expires_at, is_active)
      VALUES (?, ?, ?, ?, 1)
    `).run(data.code.toUpperCase(), data.discountPercent, data.maxUses || 100, data.expiresAt || null);
  },

  delete(code) {
    db.prepare('UPDATE promo_codes SET is_active = 0 WHERE code = ?').run(code);
  },
};

// ══════════════════════════════════════════════════════════════════
//  WATCH HISTORY
// ══════════════════════════════════════════════════════════════════

export const WatchHistory = {
  getByUser(userId, limit = 50) {
    return db.prepare('SELECT * FROM watch_history WHERE user_id = ? ORDER BY watched_at DESC LIMIT ?').all(userId, limit);
  },

  add(entry) {
    // Remove duplicate for same content/episode
    db.prepare('DELETE FROM watch_history WHERE user_id = ? AND content_id = ? AND episode_id IS ?')
      .run(entry.userId, entry.contentId, entry.episodeId || null);

    const id = `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    db.prepare(`
      INSERT INTO watch_history (id, user_id, content_id, episode_id, content_title, episode_title,
        poster_url, progress_seconds, total_seconds, watched_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(id, entry.userId, entry.contentId, entry.episodeId || null,
      entry.contentTitle || '', entry.episodeTitle || '', entry.posterUrl || '',
      entry.progressSeconds || 0, entry.totalSeconds || 0, new Date().toISOString());
  },

  clear(userId) {
    db.prepare('DELETE FROM watch_history WHERE user_id = ?').run(userId);
  },
};

// ══════════════════════════════════════════════════════════════════
//  FAVORITES
// ══════════════════════════════════════════════════════════════════

export const Favorites = {
  getByUser(userId) {
    return db.prepare('SELECT * FROM favorites WHERE user_id = ? ORDER BY added_at DESC').all(userId);
  },

  toggle(userId, contentId) {
    const existing = db.prepare('SELECT * FROM favorites WHERE user_id = ? AND content_id = ?').get(userId, contentId);
    if (existing) {
      db.prepare('DELETE FROM favorites WHERE user_id = ? AND content_id = ?').run(userId, contentId);
      return false; // removed
    } else {
      db.prepare('INSERT INTO favorites (user_id, content_id, added_at) VALUES (?, ?, ?)')
        .run(userId, contentId, new Date().toISOString());
      return true; // added
    }
  },

  isFavorite(userId, contentId) {
    return Boolean(db.prepare('SELECT 1 FROM favorites WHERE user_id = ? AND content_id = ?').get(userId, contentId));
  },
};

// ══════════════════════════════════════════════════════════════════
//  SETTINGS (Tizim sozlamalari — bitta qator)
// ══════════════════════════════════════════════════════════════════

const DEFAULT_SETTINGS = {
  botToken: '',
  botUsername: 'Manyaktvbot',
  telegramBotUsername: 'Manyaktvbot',
  telegramChannelUrl: 'https://t.me/manyak_tv_kino',
  adminContactUrl: 'https://t.me/manyak_admin',
  adminTelegramIds: [SUPER_ADMIN_ID],
  cardPayment: {
    cardNumber: '8600 0000 0000 0000',
    cardHolder: 'MANYK TV',
    bankName: 'Uzcard / Humo',
    instructions: "Kartaga to'lov qiling va chekni yuklang",
  },
  bannedUserIds: [],
  bannedDeviceTokens: [],
};

export const Settings = {
  get() {
    const row = db.prepare('SELECT data FROM settings WHERE id = 1').get();
    if (!row) {
      db.prepare('INSERT INTO settings (id, data) VALUES (1, ?)').run(JSON.stringify(DEFAULT_SETTINGS));
      return { ...DEFAULT_SETTINGS };
    }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(row.data) };
  },

  update(partial) {
    const current = this.get();
    const merged = { ...current, ...partial };
    db.prepare('UPDATE settings SET data = ? WHERE id = 1').run(JSON.stringify(merged));
    return merged;
  },
};

// ══════════════════════════════════════════════════════════════════
//  APPOINTED ADMINS
// ══════════════════════════════════════════════════════════════════

export const Admins = {
  getAll() {
    return db.prepare('SELECT * FROM appointed_admins ORDER BY is_super_admin DESC').all()
      .map(r => ({
        id: r.id, name: r.name, username: r.username,
        roleTitle: r.role_title, isSuperAdmin: Boolean(r.is_super_admin),
        permissions: JSON.parse(r.permissions), appointedAt: r.appointed_at,
        appointedBy: r.appointed_by,
      }));
  },

  upsert(admin) {
    db.prepare(`
      INSERT INTO appointed_admins (id, name, username, role_title, is_super_admin, permissions, appointed_at, appointed_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(id) DO UPDATE SET name = ?, username = ?, role_title = ?,
        is_super_admin = ?, permissions = ?, appointed_by = ?
    `).run(admin.id, admin.name, admin.username || '', admin.roleTitle || 'Admin',
      admin.isSuperAdmin ? 1 : 0, JSON.stringify(admin.permissions || {}),
      admin.appointedAt || new Date().toISOString(), admin.appointedBy || SUPER_ADMIN_ID,
      admin.name, admin.username || '', admin.roleTitle || 'Admin',
      admin.isSuperAdmin ? 1 : 0, JSON.stringify(admin.permissions || {}), admin.appointedBy || SUPER_ADMIN_ID);
  },

  remove(id) {
    if (id === SUPER_ADMIN_ID) return false;
    db.prepare('DELETE FROM appointed_admins WHERE id = ?').run(id);
    return true;
  },

  isAdmin(userId) {
    if (userId === SUPER_ADMIN_ID) return true;
    return Boolean(db.prepare('SELECT 1 FROM appointed_admins WHERE id = ?').get(userId));
  },

  isSuperAdmin(userId) {
    return userId === SUPER_ADMIN_ID;
  },

  getPermissions(userId) {
    if (userId === SUPER_ADMIN_ID) return fullPermissions();
    const row = db.prepare('SELECT permissions FROM appointed_admins WHERE id = ?').get(userId);
    return row ? JSON.parse(row.permissions) : null;
  },
};

function fullPermissions() {
  return {
    canAddContent: true, canEditContent: true, canDeleteContent: true,
    canManageUsers: true, canManageCatalogs: true, canManageReceipts: true,
    canManagePlans: true, canManagePromoCodes: true, canBroadcast: true,
    canViewStats: true, canManageSettings: true, canManageAdmins: true,
  };
}

// ══════════════════════════════════════════════════════════════════
//  AUDIT LOGS
// ══════════════════════════════════════════════════════════════════

export const AuditLogs = {
  add(entry) {
    db.prepare(`
      INSERT INTO audit_logs (admin_id, admin_name, action, target_type, target_id, target_title, details, secondary_auth_passed, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(entry.adminId, entry.adminName || '', entry.action, entry.targetType || '',
      entry.targetId || '', entry.targetTitle || '', entry.details || '',
      entry.secondaryAuthPassed ? 1 : 0, new Date().toISOString());
  },

  getAll(limit = 100) {
    return db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT ?').all(limit);
  },
};

// ══════════════════════════════════════════════════════════════════
//  BANNED DEVICES
// ══════════════════════════════════════════════════════════════════

export const BannedDevices = {
  isBanned(token) {
    return Boolean(db.prepare('SELECT 1 FROM banned_devices WHERE device_token = ?').get(token));
  },

  ban(token) {
    db.prepare('INSERT OR IGNORE INTO banned_devices (device_token, banned_at) VALUES (?, ?)').run(token, new Date().toISOString());
  },

  unban(token) {
    db.prepare('DELETE FROM banned_devices WHERE device_token = ?').run(token);
  },

  getAll() {
    return db.prepare('SELECT * FROM banned_devices').all();
  },
};

// ══════════════════════════════════════════════════════════════════
//  DAILY CHECK-IN
// ══════════════════════════════════════════════════════════════════

const DAILY_REWARDS = [
  { day: 1, title: '+1 ta Qism Ochish Tokeni', type: 'tokens', amount: 1 },
  { day: 2, title: '+1 ta Qism Ochish Tokeni', type: 'tokens', amount: 1 },
  { day: 3, title: '+1 ta Qism Ochish Tokeni', type: 'tokens', amount: 1 },
  { day: 4, title: '+1 ta Qism Ochish Tokeni', type: 'tokens', amount: 1 },
  { day: 5, title: '+1 ta Qism Ochish Tokeni', type: 'tokens', amount: 1 },
  { day: 6, title: '+1 ta Qism Ochish Tokeni', type: 'tokens', amount: 1 },
  { day: 7, title: 'VIP Obunaga 10% Chegirma + 1 Token', type: 'vip_discount', amount: 10 },
];

function getDateStr(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}

export const DailyCheckIn = {
  getStatus(userId) {
    const user = Users.getById(userId);
    if (!user) return null;
    const ci = user.dailyCheckIn || {};
    const todayStr = getDateStr();
    const yd = new Date(); yd.setDate(yd.getDate() - 1);
    const yesterdayStr = getDateStr(yd);
    const isClaimedToday = ci.lastCheckInDate === todayStr;
    let currentStreak = 0, nextDay = 1;
    if (isClaimedToday) { currentStreak = ci.streak || 0; nextDay = ((ci.streak - 1) % 7) + 1; }
    else if (ci.lastCheckInDate === yesterdayStr) { currentStreak = ci.streak || 0; nextDay = (ci.streak % 7) + 1; }
    return { isClaimedToday, currentStreak, nextDayToClaim: nextDay, rewards: DAILY_REWARDS, totalClaims: ci.totalClaims || 0 };
  },

  claim(userId) {
    const user = Users.getById(userId);
    if (!user) return { success: false, message: 'Foydalanuvchi topilmadi.' };
    const ci = user.dailyCheckIn || {};
    const todayStr = getDateStr();
    if (ci.lastCheckInDate === todayStr) return { success: false, message: 'Bugungi bonus allaqachon olingan!' };
    const yd = new Date(); yd.setDate(yd.getDate() - 1);
    let newStreak = ci.lastCheckInDate === getDateStr(yd) ? (ci.streak || 0) + 1 : 1;
    const reward = DAILY_REWARDS[(newStreak - 1) % 7];
    if (reward.type === 'tokens') user.accessTokens = (user.accessTokens || 0) + reward.amount;
    else if (reward.type === 'vip_discount') { user.vipDiscountPercent = 10; user.accessTokens = (user.accessTokens || 0) + 1; }
    user.dailyCheckIn = { lastCheckInDate: todayStr, streak: newStreak, totalClaims: (ci.totalClaims || 0) + 1, lastRewardTitle: reward.title };
    Users.upsert(user);
    return { success: true, message: `Tabriklaymiz! "${reward.title}" berildi!`, reward, user };
  },
};

// ══════════════════════════════════════════════════════════════════
//  TOKEN UNLOCK
// ══════════════════════════════════════════════════════════════════

export const TokenUnlock = {
  useToken(userId, contentId, episodeId, title, episodeTitle) {
    const user = Users.getById(userId);
    if (!user) return { success: false, message: 'Foydalanuvchi topilmadi.' };
    if (!user.accessTokens || user.accessTokens < 1) {
      return { success: false, message: 'Yetarli token mavjud emas! Kunlik bonusdan token oling.' };
    }
    user.accessTokens -= 1;
    if (episodeId) {
      if (!user.unlockedEpisodeIds) user.unlockedEpisodeIds = [];
      const key = `${contentId}:${episodeId}`;
      if (!user.unlockedEpisodeIds.includes(key)) user.unlockedEpisodeIds.push(key);
    } else {
      if (!user.purchasedContentIds) user.purchasedContentIds = [];
      if (!user.purchasedContentIds.includes(contentId)) user.purchasedContentIds.push(contentId);
    }
    Users.upsert(user);
    return { success: true, message: `1 ta Token sarflandi. "${title || contentId}" ochildi!`, user };
  },
};

// ══════════════════════════════════════════════════════════════════
//  STATS (Statistika)
// ══════════════════════════════════════════════════════════════════

export const Stats = {
  dashboard() {
    return {
      totalUsers: Users.count(),
      vipUsers: Users.vipCount(),
      totalContent: Contents.count(),
      pendingReceipts: Receipts.pendingCount(),
      totalRevenue: Receipts.totalRevenue(),
    };
  },
};

// ══════════════════════════════════════════════════════════════════
//  SEED — Boshlang'ich ma'lumotlar (birinchi ishga tushirishda)
// ══════════════════════════════════════════════════════════════════

export function seedIfEmpty() {
  if (Users.count() === 0) {
    // Super admin
    Users.upsert({
      id: SUPER_ADMIN_ID, firstName: 'Bosh Admin', lastName: '', username: 'manyak_admin',
      phone: '+998901234567', isPhoneVerified: true, isVip: true,
      vipExpiresAt: new Date(Date.now() + 365 * 86400000).toISOString(),
      purchasedContentIds: [], favorites: [], accessTokens: 0,
      createdAt: new Date().toISOString(), lastLoginAt: new Date().toISOString(),
    });

    Admins.upsert({
      id: SUPER_ADMIN_ID, name: 'Bosh Admin (Egasi)', username: 'manyak_admin',
      roleTitle: "Bosh Admin (To'liq huquq)", isSuperAdmin: true, permissions: fullPermissions(),
    });

    console.log('[DB Seed] Super Admin yaratildi');
  }

  if (Settings.get().botUsername === DEFAULT_SETTINGS.botUsername) {
    Settings.update(DEFAULT_SETTINGS);
    console.log('[DB Seed] Default settings saqlandi');
  }
}

export { db, SUPER_ADMIN_ID };
export default db;
