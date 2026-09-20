/**
 * MANYK TV — PostgreSQL Database Module
 * ======================================
 * SQLite'dan PostgreSQL'ga to'liq migratsiya.
 * 
 * O'ZGARISHLAR:
 * - node:sqlite → pg (PostgreSQL client)
 * - Sinxron → Asinxron (async/await)
 * - ? placeholders → $1, $2, $3...
 * - INTEGER → SERIAL, BIGSERIAL
 * - TEXT → VARCHAR, TEXT
 * - JSON.stringify/parse → JSONB
 */

import pg from 'pg';
const { Pool } = pg;

// ══════════════════════════════════════════════════════════════════
//  CONNECTION CONFIGURATION
// ══════════════════════════════════════════════════════════════════

const pool = new Pool({
  host: process.env.PG_HOST || 'localhost',
  port: parseInt(process.env.PG_PORT || '5432', 10),
  database: process.env.PG_DATABASE || 'manyaktv',
  user: process.env.PG_USER || 'postgres',
  password: process.env.PG_PASSWORD,
  
  // Connection pool settings
  max: 20, // max pool size
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
  
  // SSL for production
  ssl: process.env.NODE_ENV === 'production' && process.env.PG_SSL !== 'false'
    ? { rejectUnauthorized: false }
    : false,
});

// Test connection
pool.on('connect', () => {
  console.log('[PG] Yangi database connection ochildi');
});

pool.on('error', (err) => {
  console.error('[PG] Kutilmagan database xatosi:', err);
});

// Graceful shutdown
process.on('SIGINT', async () => {
  await pool.end();
  process.exit(0);
});

console.log(`[PG] PostgreSQL connection pool yaratildi: ${process.env.PG_DATABASE || 'manyaktv'}`);

// ══════════════════════════════════════════════════════════════════
//  HELPER FUNCTIONS
// ══════════════════════════════════════════════════════════════════

/**
 * Query wrapper with error handling
 */
async function query(text, params = []) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    if (duration > 1000) {
      console.warn(`[PG] Slow query (${duration}ms):`, text.substring(0, 100));
    }
    return res;
  } catch (err) {
    console.error('[PG] Query error:', err.message);
    console.error('[PG] Query:', text);
    console.error('[PG] Params:', params);
    throw err;
  }
}

/**
 * Transaction wrapper
 */
async function inTransaction(fn) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Safe JSON parse with fallback
 */
function safeJsonParse(raw, fallback, context = 'JSON') {
  if (raw == null || raw === '') return fallback;
  if (typeof raw === 'object') return raw; // PostgreSQL JSONB already parsed
  try {
    const parsed = JSON.parse(raw);
    return parsed == null ? fallback : parsed;
  } catch (err) {
    console.error(`[PG] ${context} parse error:`, err.message);
    return fallback;
  }
}

// ══════════════════════════════════════════════════════════════════
//  SCHEMA INITIALIZATION
// ══════════════════════════════════════════════════════════════════

export async function initializeSchema() {
  console.log('[PG] Database schema yaratilmoqda...');
  
  await query(`
    -- Users table
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      first_name TEXT NOT NULL DEFAULT '',
      last_name TEXT DEFAULT '',
      username TEXT DEFAULT '',
      phone TEXT,
      is_phone_verified BOOLEAN DEFAULT FALSE,
      is_vip BOOLEAN DEFAULT FALSE,
      vip_expires_at TIMESTAMPTZ,
      purchased_content_ids JSONB DEFAULT '[]'::jsonb,
      device_token TEXT,
      access_tokens INTEGER DEFAULT 0,
      unlocked_episode_ids JSONB DEFAULT '[]'::jsonb,
      vip_discount_percent INTEGER DEFAULT 0,
      bonus_balance INTEGER DEFAULT 0,
      daily_checkin JSONB DEFAULT '{}'::jsonb,
      hwid_binding JSONB,
      is_banned BOOLEAN DEFAULT FALSE,
      ban_reason TEXT,
      is_device_banned BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_login_at TIMESTAMPTZ
    );

    -- Receipts table
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
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      reviewed_at TIMESTAMPTZ,
      reviewed_by TEXT
    );

    -- Contents table
    CREATE TABLE IF NOT EXISTS contents (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      type TEXT NOT NULL,
      data JSONB NOT NULL
    );

    -- Plans table
    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      price INTEGER NOT NULL,
      original_price INTEGER,
      duration_days INTEGER NOT NULL,
      badge TEXT,
      is_active BOOLEAN DEFAULT TRUE,
      data JSONB NOT NULL
    );

    -- Promo codes table
    CREATE TABLE IF NOT EXISTS promo_codes (
      code TEXT PRIMARY KEY,
      discount_percent INTEGER NOT NULL,
      max_uses INTEGER DEFAULT 100,
      current_uses INTEGER DEFAULT 0,
      expires_at TIMESTAMPTZ,
      is_active BOOLEAN DEFAULT TRUE
    );

    -- Watch history table
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
      watched_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Favorites table
    CREATE TABLE IF NOT EXISTS favorites (
      user_id TEXT NOT NULL,
      content_id TEXT NOT NULL,
      added_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      PRIMARY KEY (user_id, content_id)
    );

    -- Settings table
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY DEFAULT 1,
      data JSONB NOT NULL,
      CONSTRAINT single_settings_row CHECK (id = 1)
    );

    -- Appointed admins table
    CREATE TABLE IF NOT EXISTS appointed_admins (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      username TEXT DEFAULT '',
      role_title TEXT DEFAULT 'Admin',
      is_super_admin BOOLEAN DEFAULT FALSE,
      permissions JSONB NOT NULL DEFAULT '{}'::jsonb,
      appointed_at TIMESTAMPTZ,
      appointed_by TEXT
    );

    -- Audit logs table
    CREATE TABLE IF NOT EXISTS audit_logs (
      id SERIAL PRIMARY KEY,
      admin_id TEXT,
      admin_name TEXT,
      action TEXT NOT NULL,
      target_type TEXT,
      target_id TEXT,
      target_title TEXT,
      details TEXT,
      secondary_auth_passed BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Verification codes table
    CREATE TABLE IF NOT EXISTS verification_codes (
      code TEXT PRIMARY KEY,
      status TEXT NOT NULL DEFAULT 'pending',
      telegram_id TEXT,
      chat_id TEXT,
      phone TEXT,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      verified_at TIMESTAMPTZ,
      claimed_at TIMESTAMPTZ
    );

    -- Banned devices table
    CREATE TABLE IF NOT EXISTS banned_devices (
      device_token TEXT PRIMARY KEY,
      banned_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );

    -- Comments table
    CREATE TABLE IF NOT EXISTS comments (
      id TEXT PRIMARY KEY,
      content_id TEXT NOT NULL,
      episode_id TEXT,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      text TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (content_id) REFERENCES contents(id) ON DELETE CASCADE
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_receipts_user ON receipts(user_id);
    CREATE INDEX IF NOT EXISTS idx_receipts_status ON receipts(status);
    CREATE INDEX IF NOT EXISTS idx_history_user ON watch_history(user_id);
    CREATE INDEX IF NOT EXISTS idx_audit_admin ON audit_logs(admin_id);
    CREATE INDEX IF NOT EXISTS idx_comments_content ON comments(content_id);
    CREATE INDEX IF NOT EXISTS idx_comments_episode ON comments(episode_id);
    CREATE INDEX IF NOT EXISTS idx_users_last_login ON users(last_login_at DESC);
    CREATE INDEX IF NOT EXISTS idx_contents_type ON contents(type);
  `);

  console.log('[PG] ✅ Schema tayyor!');
}

// ══════════════════════════════════════════════════════════════════
//  USERS
// ══════════════════════════════════════════════════════════════════

const SUPER_ADMIN_ID = process.env.SUPER_ADMIN_ID || '891846690';
const ENV_ADMIN_IDS = String(process.env.ADMIN_IDS || '')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

if (ENV_ADMIN_IDS.length > 0) {
  console.log(`[Admin] .env ADMIN_IDS: ${ENV_ADMIN_IDS.join(', ')}`);
}

export const Users = {
  async getById(id) {
    const res = await query('SELECT * FROM users WHERE id = $1', [id]);
    return res.rows[0] ? rowToUser(res.rows[0]) : null;
  },

  async getAll() {
    const res = await query('SELECT * FROM users ORDER BY last_login_at DESC NULLS LAST');
    return res.rows.map(rowToUser);
  },

  async upsert(user) {
    const row = userToRow(user);
    await query(`
      INSERT INTO users (
        id, first_name, last_name, username, phone, is_phone_verified, is_vip,
        vip_expires_at, purchased_content_ids, device_token, access_tokens,
        unlocked_episode_ids, vip_discount_percent, bonus_balance, daily_checkin,
        hwid_binding, is_banned, ban_reason, is_device_banned, created_at, last_login_at
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21
      )
      ON CONFLICT(id) DO UPDATE SET
        first_name = $2, last_name = $3, username = $4, phone = $5,
        is_phone_verified = $6, is_vip = $7, vip_expires_at = $8,
        purchased_content_ids = $9, device_token = $10, access_tokens = $11,
        unlocked_episode_ids = $12, vip_discount_percent = $13, bonus_balance = $14,
        daily_checkin = $15, hwid_binding = $16, is_banned = $17, ban_reason = $18,
        is_device_banned = $19, last_login_at = $21
    `, [
      row.id, row.firstName, row.lastName, row.username, row.phone,
      row.isPhoneVerified, row.isVip, row.vipExpiresAt, row.purchasedContentIds,
      row.deviceToken, row.accessTokens, row.unlockedEpisodeIds, row.vipDiscountPercent,
      row.bonusBalance, row.dailyCheckin, row.hwidBinding, row.isBanned, row.banReason,
      row.isDeviceBanned, row.createdAt, row.lastLoginAt
    ]);
    return user;
  },

  async grantVip(userId, days) {
    const user = await this.getById(userId);
    if (!user) return null;
    
    const currentExp = user.isVip && user.vipExpiresAt && new Date(user.vipExpiresAt).getTime() > Date.now()
      ? new Date(user.vipExpiresAt).getTime()
      : Date.now();
    
    user.isVip = true;
    user.vipExpiresAt = new Date(currentExp + days * 86400000).toISOString();
    return await this.upsert(user);
  },

  async revokeVip(userId) {
    await query('UPDATE users SET is_vip = FALSE, vip_expires_at = NULL WHERE id = $1', [userId]);
  },

  async ban(userId, reason) {
    await query(
      'UPDATE users SET is_banned = TRUE, ban_reason = $1 WHERE id = $2',
      [reason || 'Admin tomonidan bloklandi', userId]
    );
  },

  async unban(userId) {
    await query('UPDATE users SET is_banned = FALSE, ban_reason = NULL WHERE id = $1', [userId]);
  },

  async resetHwid(userId) {
    await query('UPDATE users SET hwid_binding = NULL, device_token = NULL WHERE id = $1', [userId]);
  },

  async syncTelegramProfile(tgUser) {
    const id = String(tgUser.id);
    const existing = await this.getById(id);
    const now = new Date().toISOString();
    const username = tgUser.username != null ? String(tgUser.username) : '';

    if (!existing) {
      const isAdmin = Admins.isAdmin(id);
      const created = {
        id,
        firstName: tgUser.first_name || `Foydalanuvchi #${id}`,
        lastName: tgUser.last_name || '',
        username,
        isVip: isAdmin,
        vipExpiresAt: isAdmin ? new Date(Date.now() + 365 * 86400000).toISOString() : null,
        purchasedContentIds: [],
        accessTokens: 0,
        createdAt: now,
        lastLoginAt: now,
      };
      await this.upsert(created);
      return await this.getById(id);
    }

    existing.firstName = tgUser.first_name || existing.firstName;
    existing.lastName = tgUser.last_name != null ? tgUser.last_name : existing.lastName;
    existing.username = username;
    existing.lastLoginAt = now;
    await this.upsert(existing);
    return await this.getById(id);
  },

  async verifyByContact(userId, phone) {
    const id = String(userId);
    const user = await this.getById(id);
    if (!user) return null;
    
    user.phone = phone || user.phone || null;
    user.isPhoneVerified = true;
    await this.upsert(user);
    return await this.getById(id);
  },

  async expireSubscriptions() {
    const res = await query(
      'UPDATE users SET is_vip = FALSE WHERE is_vip = TRUE AND vip_expires_at IS NOT NULL AND vip_expires_at <= NOW()'
    );
    return res.rowCount;
  },

  async count() {
    const res = await query('SELECT COUNT(*) as cnt FROM users');
    return parseInt(res.rows[0].cnt, 10);
  },

  async vipCount() {
    const res = await query('SELECT COUNT(*) as cnt FROM users WHERE is_vip = TRUE');
    return parseInt(res.rows[0].cnt, 10);
  },
};

function userToRow(u) {
  return {
    id: u.id,
    firstName: u.firstName || u.first_name || '',
    lastName: u.lastName || u.last_name || '',
    username: u.username || '',
    phone: u.phone || null,
    isPhoneVerified: u.isPhoneVerified || false,
    isVip: u.isVip || false,
    vipExpiresAt: u.vipExpiresAt || null,
    purchasedContentIds: JSON.stringify(u.purchasedContentIds || []),
    deviceToken: u.deviceToken || null,
    accessTokens: u.accessTokens || 0,
    unlockedEpisodeIds: JSON.stringify(u.unlockedEpisodeIds || []),
    vipDiscountPercent: u.vipDiscountPercent || 0,
    bonusBalance: u.bonusBalance || 0,
    dailyCheckin: JSON.stringify(u.dailyCheckIn || u.daily_checkin || {}),
    hwidBinding: u.hwidBinding ? JSON.stringify(u.hwidBinding) : null,
    isBanned: u.isBanned || false,
    banReason: u.banReason || null,
    isDeviceBanned: u.isDeviceBanned || false,
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
    purchasedContentIds: safeJsonParse(r.purchased_content_ids, []),
    deviceToken: r.device_token,
    accessTokens: r.access_tokens || 0,
    unlockedEpisodeIds: safeJsonParse(r.unlocked_episode_ids, []),
    vipDiscountPercent: r.vip_discount_percent || 0,
    bonusBalance: r.bonus_balance || 0,
    dailyCheckIn: safeJsonParse(r.daily_checkin, {}),
    hwidBinding: r.hwid_binding ? safeJsonParse(r.hwid_binding, undefined) : undefined,
    isBanned: Boolean(r.is_banned),
    banReason: r.ban_reason,
    isDeviceBanned: Boolean(r.is_device_banned),
    createdAt: r.created_at,
    lastLoginAt: r.last_login_at,
  };
}

// ══════════════════════════════════════════════════════════════════
//  RECEIPTS
// ══════════════════════════════════════════════════════════════════

export const Receipts = {
  async getAll() {
    const res = await query('SELECT * FROM receipts ORDER BY created_at DESC');
    return res.rows;
  },

  async getByStatus(status) {
    const res = await query('SELECT * FROM receipts WHERE status = $1 ORDER BY created_at DESC', [status]);
    return res.rows;
  },

  async getById(id) {
    const res = await query('SELECT * FROM receipts WHERE id = $1', [id]);
    return res.rows[0] || null;
  },

  async getByUserId(userId) {
    const res = await query('SELECT * FROM receipts WHERE user_id = $1 ORDER BY created_at DESC', [userId]);
    return res.rows;
  },

  async submit(data) {
    const id = `rcpt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date().toISOString();

    await query(`
      INSERT INTO receipts (
        id, user_id, user_name, user_phone, type, plan_id, plan_name,
        content_id, content_title, amount, discount_applied, promo_code_used,
        receipt_image_url, notes, status, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16)
    `, [
      id,
      String(data.userId),
      data.userName || '',
      data.userPhone || null,
      data.type,
      data.planId || null,
      data.planName || null,
      data.contentId || null,
      data.contentTitle || null,
      Number(data.amount) || 0,
      Number(data.discountApplied) || 0,
      data.promoCodeUsed || null,
      data.receiptImageUrl || null,
      data.notes || null,
      'pending',
      now
    ]);

    return await this.getById(id);
  },

  async review(receiptId, reviewerId, decision) {
    return await inTransaction(async (client) => {
      const res = await client.query('SELECT * FROM receipts WHERE id = $1', [receiptId]);
      const existing = res.rows[0];
      
      if (!existing) return { receipt: null, alreadyReviewed: false };

      const now = new Date().toISOString();
      const updateRes = await client.query(
        `UPDATE receipts 
         SET status = $1, reviewed_at = $2, reviewed_by = $3 
         WHERE id = $4 AND status = 'pending'`,
        [decision, now, reviewerId, receiptId]
      );

      if (updateRes.rowCount === 0) {
        return { receipt: existing, alreadyReviewed: true };
      }

      const receiptRes = await client.query('SELECT * FROM receipts WHERE id = $1', [receiptId]);
      const receipt = receiptRes.rows[0];

      if (decision === 'approved') {
        if (receipt.type === 'vip_subscription') {
          const planRes = await client.query('SELECT * FROM plans WHERE id = $1', [receipt.plan_id]);
          const plan = planRes.rows[0];
          if (plan) {
            const planData = safeJsonParse(plan.data, {});
            const days = Number(planData.durationDays ?? plan.duration_days) || 30;
            await Users.grantVip(receipt.user_id, days);
          }
        } else if (receipt.type === 'single_content' && receipt.content_id) {
          const user = await Users.getById(receipt.user_id);
          if (user && !user.purchasedContentIds.includes(receipt.content_id)) {
            user.purchasedContentIds.push(receipt.content_id);
            await Users.upsert(user);
          }
        }
      }

      return { receipt, alreadyReviewed: false };
    });
  },

  async pendingCount() {
    const res = await query("SELECT COUNT(*) as cnt FROM receipts WHERE status = 'pending'");
    return parseInt(res.rows[0].cnt, 10);
  },

  async totalRevenue() {
    const res = await query("SELECT COALESCE(SUM(amount), 0) as total FROM receipts WHERE status = 'approved'");
    return parseInt(res.rows[0].total, 10);
  },
};

// ══════════════════════════════════════════════════════════════════
//  CONTENTS
// ══════════════════════════════════════════════════════════════════

export const Contents = {
  async getAll() {
    const res = await query('SELECT * FROM contents ORDER BY id DESC');
    return res.rows.map(r => ({
      ...safeJsonParse(r.data, {}),
      id: r.id
    }));
  },

  async getById(id) {
    const res = await query('SELECT * FROM contents WHERE id = $1', [id]);
    const row = res.rows[0];
    return row ? { ...safeJsonParse(row.data, {}), id: row.id } : null;
  },

  async upsert(content) {
    if (!content || typeof content !== 'object') {
      throw new Error('Kontent obyekti majburiy');
    }

    const title = typeof content.title === 'string' ? content.title.trim() : '';
    if (!title) throw new Error('Kontent sarlavhasi (title) majburiy');

    const type = content.type || 'movie';

    let id = content.id != null ? String(content.id).trim() : '';
    if (!id) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9\u0400-\u04FF]+/gi, '-')
        .replace(/^-+|-+$/g, '')
        .slice(0, 40);
      id = `${slug || 'content'}-${Date.now().toString(36)}`;
    }

    const normalized = { ...content, id, title, type };

    await query(`
      INSERT INTO contents (id, title, type, data)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT(id) DO UPDATE SET title = $2, type = $3, data = $4
    `, [id, title, type, JSON.stringify(normalized)]);

    return normalized;
  },

  async delete(id) {
    await query('DELETE FROM contents WHERE id = $1', [id]);
  },

  async count() {
    const res = await query('SELECT COUNT(*) as cnt FROM contents');
    return parseInt(res.rows[0].cnt, 10);
  },

  async bulkInsert(items) {
    await inTransaction(async (client) => {
      for (const item of items) {
        await client.query(
          'INSERT INTO contents (id, title, type, data) VALUES ($1, $2, $3, $4) ON CONFLICT(id) DO UPDATE SET title = $2, type = $3, data = $4',
          [item.id, item.title, item.type, JSON.stringify(item)]
        );
      }
    });
  },
};

// ══════════════════════════════════════════════════════════════════
//  PLANS
// ══════════════════════════════════════════════════════════════════

export const Plans = {
  async getAll() {
    const res = await query('SELECT * FROM plans WHERE is_active = TRUE ORDER BY price ASC');
    return res.rows.map(r => ({
      ...safeJsonParse(r.data, {}),
      id: r.id
    }));
  },

  async getById(id) {
    const res = await query('SELECT * FROM plans WHERE id = $1', [id]);
    const row = res.rows[0];
    return row ? { ...safeJsonParse(row.data, {}), id: row.id } : null;
  },

  async upsert(plan) {
    await query(`
      INSERT INTO plans (id, name, price, original_price, duration_days, badge, is_active, data)
      VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)
      ON CONFLICT(id) DO UPDATE SET 
        name = $2, price = $3, original_price = $4, duration_days = $5, badge = $6, data = $7
    `, [
      plan.id,
      plan.name,
      plan.price,
      plan.originalPrice || null,
      plan.durationDays,
      plan.badge || null,
      JSON.stringify(plan)
    ]);
    return plan;
  },

  async delete(id) {
    await query('UPDATE plans SET is_active = FALSE WHERE id = $1', [id]);
  },

  async bulkInsert(items) {
    await inTransaction(async (client) => {
      for (const p of items) {
        await client.query(
          `INSERT INTO plans (id, name, price, original_price, duration_days, badge, is_active, data)
           VALUES ($1, $2, $3, $4, $5, $6, TRUE, $7)
           ON CONFLICT(id) DO UPDATE SET name = $2, price = $3, original_price = $4, duration_days = $5, badge = $6, data = $7`,
          [p.id, p.name, p.price, p.originalPrice || null, p.durationDays, p.badge || null, JSON.stringify(p)]
        );
      }
    });
  },
};

// ══════════════════════════════════════════════════════════════════
//  PROMO CODES
// ══════════════════════════════════════════════════════════════════

export const PromoCodes = {
  async validate(code) {
    if (typeof code !== 'string' || !code.trim()) {
      return { valid: false, message: 'Promokod kiritilmadi.' };
    }

    const res = await query(
      'SELECT * FROM promo_codes WHERE code = $1 AND is_active = TRUE',
      [code.trim().toUpperCase()]
    );
    const row = res.rows[0];

    if (!row) return { valid: false, message: 'Promokod topilmadi yoki muddati tugagan.' };

    if (row.expires_at && new Date(row.expires_at) < new Date()) {
      return { valid: false, message: 'Bu promokodning muddati tugagan.' };
    }

    if (row.max_uses > 0 && row.current_uses >= row.max_uses) {
      return { valid: false, message: 'Bu promokod ishlatish limiti tugagan.' };
    }

    return {
      valid: true,
      discountPercent: row.discount_percent,
      message: `${row.discount_percent}% chegirma qo'llanildi!`,
    };
  },

  async consume(code) {
    if (typeof code !== 'string' || !code.trim()) {
      return { ok: false, message: 'Promokod kiritilmadi.' };
    }

    const normalized = code.trim().toUpperCase();

    return await inTransaction(async (client) => {
      const check = await this.validate(normalized);
      if (!check.valid) return { ok: false, message: check.message };

      const res = await client.query(
        `UPDATE promo_codes
         SET current_uses = current_uses + 1
         WHERE code = $1 AND is_active = TRUE
           AND (max_uses <= 0 OR current_uses < max_uses)`,
        [normalized]
      );

      if (res.rowCount === 0) {
        return { ok: false, message: 'Bu promokod ishlatish limiti tugagan.' };
      }

      return { ok: true, discountPercent: check.discountPercent };
    });
  },

  async getAll() {
    const res = await query('SELECT * FROM promo_codes ORDER BY code');
    return res.rows;
  },

  async create(data) {
    if (typeof data?.code !== 'string' || !data.code.trim()) {
      throw new Error('Promokod (code) majburiy');
    }
    const discount = Number(data.discountPercent);
    if (!Number.isFinite(discount) || discount <= 0 || discount > 100) {
      throw new Error('discountPercent 1..100 oralig\'ida bo\'lishi kerak');
    }

    await query(
      `INSERT INTO promo_codes (code, discount_percent, max_uses, expires_at, is_active)
       VALUES ($1, $2, $3, $4, TRUE)`,
      [
        data.code.trim().toUpperCase(),
        discount,
        Number(data.maxUses) || 100,
        data.expiresAt || null
      ]
    );
  },

  async delete(code) {
    await query(
      'UPDATE promo_codes SET is_active = FALSE WHERE code = $1',
      [String(code || '').toUpperCase()]
    );
  },
};

// ══════════════════════════════════════════════════════════════════
//  WATCH HISTORY
// ══════════════════════════════════════════════════════════════════

export const WatchHistory = {
  async getByUserId(userId) {
    const res = await query(
      'SELECT * FROM watch_history WHERE user_id = $1 ORDER BY watched_at DESC LIMIT 50',
      [userId]
    );
    return res.rows;
  },

  async upsert(data) {
    const id = data.id || `wh_${data.userId}_${data.contentId}_${data.episodeId || 'movie'}`;
    
    await query(`
      INSERT INTO watch_history (
        id, user_id, content_id, episode_id, content_title, episode_title,
        poster_url, progress_seconds, total_seconds, watched_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
      ON CONFLICT(id) DO UPDATE SET
        progress_seconds = $8, total_seconds = $9, watched_at = $10
    `, [
      id, data.userId, data.contentId, data.episodeId || null,
      data.contentTitle, data.episodeTitle || null, data.posterUrl || null,
      data.progressSeconds || 0, data.totalSeconds || 0,
      data.watchedAt || new Date().toISOString()
    ]);
  },

  async clearByUserId(userId) {
    await query('DELETE FROM watch_history WHERE user_id = $1', [userId]);
  },
};

// ══════════════════════════════════════════════════════════════════
//  FAVORITES
// ══════════════════════════════════════════════════════════════════

export const Favorites = {
  async getByUserId(userId) {
    const res = await query(
      'SELECT * FROM favorites WHERE user_id = $1 ORDER BY added_at DESC',
      [userId]
    );
    return res.rows;
  },

  async add(userId, contentId) {
    await query(
      'INSERT INTO favorites (user_id, content_id, added_at) VALUES ($1, $2, NOW()) ON CONFLICT DO NOTHING',
      [userId, contentId]
    );
  },

  async remove(userId, contentId) {
    await query(
      'DELETE FROM favorites WHERE user_id = $1 AND content_id = $2',
      [userId, contentId]
    );
  },

  async toggle(userId, contentId) {
    const res = await query(
      'SELECT 1 FROM favorites WHERE user_id = $1 AND content_id = $2',
      [userId, contentId]
    );
    
    if (res.rows.length > 0) {
      await this.remove(userId, contentId);
      return { action: 'removed' };
    } else {
      await this.add(userId, contentId);
      return { action: 'added' };
    }
  },
};

// ══════════════════════════════════════════════════════════════════
//  SETTINGS
// ══════════════════════════════════════════════════════════════════

export const Settings = {
  async get() {
    const res = await query('SELECT data FROM settings WHERE id = 1');
    if (res.rows.length === 0) {
      const defaults = {
        vipBenefits: [],
        paymentMethods: [],
        telegramChannel: '',
        telegramBot: '',
        supportContact: '',
        appointedAdmins: [],
      };
      await this.set(defaults);
      return defaults;
    }
    return safeJsonParse(res.rows[0].data, {});
  },

  async set(data) {
    await query(
      'INSERT INTO settings (id, data) VALUES (1, $1) ON CONFLICT(id) DO UPDATE SET data = $1',
      [JSON.stringify(data)]
    );
  },
};

// ══════════════════════════════════════════════════════════════════
//  APPOINTED ADMINS
// ══════════════════════════════════════════════════════════════════

export const AppointedAdmins = {
  async getAll() {
    const res = await query('SELECT * FROM appointed_admins ORDER BY appointed_at DESC');
    return res.rows.map(r => ({
      ...r,
      permissions: safeJsonParse(r.permissions, {})
    }));
  },

  async getById(id) {
    const res = await query('SELECT * FROM appointed_admins WHERE id = $1', [id]);
    if (res.rows.length === 0) return null;
    const r = res.rows[0];
    return {
      ...r,
      permissions: safeJsonParse(r.permissions, {})
    };
  },

  async upsert(admin) {
    await query(`
      INSERT INTO appointed_admins (
        id, name, username, role_title, is_super_admin, permissions, appointed_at, appointed_by
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT(id) DO UPDATE SET
        name = $2, username = $3, role_title = $4, is_super_admin = $5,
        permissions = $6, appointed_at = $7, appointed_by = $8
    `, [
      admin.id,
      admin.name,
      admin.username || '',
      admin.roleTitle || 'Admin',
      admin.isSuperAdmin || false,
      JSON.stringify(admin.permissions || {}),
      admin.appointedAt || new Date().toISOString(),
      admin.appointedBy || null
    ]);
  },

  async remove(id) {
    await query('DELETE FROM appointed_admins WHERE id = $1', [id]);
  },
};

// ══════════════════════════════════════════════════════════════════
//  AUDIT LOGS
// ══════════════════════════════════════════════════════════════════

export const AuditLogs = {
  async log(data) {
    await query(`
      INSERT INTO audit_logs (
        admin_id, admin_name, action, target_type, target_id, target_title, details, secondary_auth_passed, created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
    `, [
      data.adminId || null,
      data.adminName || null,
      data.action,
      data.targetType || null,
      data.targetId || null,
      data.targetTitle || null,
      data.details || null,
      data.secondaryAuthPassed || false
    ]);
  },

  async getRecent(limit = 100) {
    const res = await query(
      'SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT $1',
      [limit]
    );
    return res.rows;
  },

  async getByAdmin(adminId, limit = 50) {
    const res = await query(
      'SELECT * FROM audit_logs WHERE admin_id = $1 ORDER BY created_at DESC LIMIT $2',
      [adminId, limit]
    );
    return res.rows;
  },
};

// ══════════════════════════════════════════════════════════════════
//  VERIFICATION CODES (Telegram bot)
// ══════════════════════════════════════════════════════════════════

const VerificationCodesBase = {
  async create(code) {
    await query(
      'INSERT INTO verification_codes (code, status, created_at) VALUES ($1, $2, NOW())',
      [code, 'pending']
    );
  },

  async getByCode(code) {
    const res = await query('SELECT * FROM verification_codes WHERE code = $1', [code]);
    return res.rows[0] || null;
  },

  async updateStatus(code, status, updates = {}) {
    const fields = ['status = $2'];
    const values = [code, status];
    let paramIndex = 3;

    if (updates.telegramId) {
      fields.push(`telegram_id = $${paramIndex++}`);
      values.push(updates.telegramId);
    }
    if (updates.chatId) {
      fields.push(`chat_id = $${paramIndex++}`);
      values.push(updates.chatId);
    }
    if (updates.phone) {
      fields.push(`phone = $${paramIndex++}`);
      values.push(updates.phone);
    }
    if (updates.verifiedAt) {
      fields.push(`verified_at = $${paramIndex++}`);
      values.push(updates.verifiedAt);
    }
    if (updates.claimedAt) {
      fields.push(`claimed_at = $${paramIndex++}`);
      values.push(updates.claimedAt);
    }

    await query(
      `UPDATE verification_codes SET ${fields.join(', ')} WHERE code = $1`,
      values
    );
  },

  async cleanup() {
    await query("DELETE FROM verification_codes WHERE created_at < NOW() - INTERVAL '24 hours'");
  },
};

// ══════════════════════════════════════════════════════════════════
//  BANNED DEVICES
// ══════════════════════════════════════════════════════════════════

export const BannedDevices = {
  async isBanned(deviceToken) {
    const res = await query('SELECT 1 FROM banned_devices WHERE device_token = $1', [deviceToken]);
    return res.rows.length > 0;
  },

  async ban(deviceToken) {
    await query(
      'INSERT INTO banned_devices (device_token, banned_at) VALUES ($1, NOW()) ON CONFLICT DO NOTHING',
      [deviceToken]
    );
  },

  async unban(deviceToken) {
    await query('DELETE FROM banned_devices WHERE device_token = $1', [deviceToken]);
  },
};

// ══════════════════════════════════════════════════════════════════
//  COMMENTS
// ══════════════════════════════════════════════════════════════════

export const Comments = {
  async getByContentId(contentId, episodeId = null) {
    let sql = 'SELECT * FROM comments WHERE content_id = $1';
    const params = [contentId];
    
    if (episodeId) {
      sql += ' AND episode_id = $2';
      params.push(episodeId);
    }
    
    sql += ' ORDER BY created_at DESC';
    
    const res = await query(sql, params);
    return res.rows;
  },

  async add(data) {
    const id = `cmt_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    await query(`
      INSERT INTO comments (id, content_id, episode_id, user_id, username, text, created_at)
      VALUES ($1, $2, $3, $4, $5, $6, NOW())
    `, [
      id,
      data.contentId,
      data.episodeId || null,
      data.userId,
      data.username,
      data.text
    ]);
    
    return { id, ...data, createdAt: new Date().toISOString() };
  },

  async delete(id) {
    await query('DELETE FROM comments WHERE id = $1', [id]);
  },
};

// ══════════════════════════════════════════════════════════════════
//  ADMINS
// ══════════════════════════════════════════════════════════════════

export const Admins = {
  isAdmin(userId) {
    if (!userId) return false;
    const id = String(userId).trim();
    return id === SUPER_ADMIN_ID || ENV_ADMIN_IDS.includes(id);
  },

  isSuperAdmin(userId) {
    if (!userId) return false;
    return String(userId).trim() === SUPER_ADMIN_ID;
  },

  async ensureEnvAdmin(userId) {
    if (!this.isAdmin(userId)) return;
    const user = await Users.getById(String(userId));
    if (user && !user.isVip) {
      await Users.grantVip(String(userId), 365);
    }
  },
};

// ══════════════════════════════════════════════════════════════════
//  EXPORT
// ══════════════════════════════════════════════════════════════════

export { pool, query, inTransaction };


// ══════════════════════════════════════════════════════════════════
//  DAILY CHECK-IN
// ══════════════════════════════════════════════════════════════════

export const DailyCheckIn = {
  getStatus(userId) {
    return inTransaction(async (client) => {
      const res = await client.query('SELECT daily_checkin FROM users WHERE id = $1', [userId]);
      if (res.rows.length === 0) return { canClaim: false, streak: 0, lastClaimed: null };
      
      const data = safeJsonParse(res.rows[0].daily_checkin, {});
      const today = new Date().toISOString().split('T')[0];
      const lastClaimed = data.lastClaimed ? data.lastClaimed.split('T')[0] : null;
      const canClaim = lastClaimed !== today;
      
      return {
        canClaim,
        streak: data.streak || 0,
        lastClaimed: data.lastClaimed || null,
      };
    });
  },

  async claim(userId) {
    return await inTransaction(async (client) => {
      const userRes = await client.query('SELECT * FROM users WHERE id = $1', [userId]);
      if (userRes.rows.length === 0) {
        return { success: false, message: 'User not found' };
      }
      
      const user = rowToUser(userRes.rows[0]);
      const data = user.dailyCheckIn || {};
      const today = new Date().toISOString().split('T')[0];
      const lastClaimed = data.lastClaimed ? data.lastClaimed.split('T')[0] : null;
      
      if (lastClaimed === today) {
        return { success: false, message: 'Already claimed today' };
      }
      
      const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
      const isConsecutive = lastClaimed === yesterday;
      const newStreak = isConsecutive ? (data.streak || 0) + 1 : 1;
      
      const reward = Math.min(newStreak * 10, 100); // Max 100 tokens
      
      user.dailyCheckIn = {
        lastClaimed: new Date().toISOString(),
        streak: newStreak,
      };
      user.accessTokens = (user.accessTokens || 0) + reward;
      
      await client.query(`
        UPDATE users 
        SET daily_checkin = $1, access_tokens = $2 
        WHERE id = $3
      `, [JSON.stringify(user.dailyCheckIn), user.accessTokens, userId]);
      
      return {
        success: true,
        reward,
        newStreak,
        totalTokens: user.accessTokens,
      };
    });
  },
};

// ══════════════════════════════════════════════════════════════════
//  TOKEN UNLOCK (Episode unlock tracking)
// ══════════════════════════════════════════════════════════════════

export const TokenUnlock = {
  async record(userId, contentId, episodeId, tokensUsed) {
    await AuditLogs.log({
      adminId: userId,
      action: 'token_unlock',
      targetType: 'episode',
      targetId: episodeId,
      details: `Unlocked with ${tokensUsed} tokens from content ${contentId}`,
    });
  },
};

// ══════════════════════════════════════════════════════════════════
//  STATS
// ══════════════════════════════════════════════════════════════════

export const Stats = {
  async dashboard() {
    const [users, vipUsers, contents, pending, revenue] = await Promise.all([
      Users.count(),
      Users.vipCount(),
      Contents.count(),
      Receipts.pendingCount(),
      Receipts.totalRevenue(),
    ]);
    
    return {
      totalUsers: users,
      vipUsers,
      totalContent: contents,
      pendingReceipts: pending,
      totalRevenue: revenue,
    };
  },
};

// ══════════════════════════════════════════════════════════════════
//  VERIFICATION CODES (Enhanced from base implementation)
// ══════════════════════════════════════════════════════════════════

const VerificationCodesExtended = {
  ...VerificationCodesBase,
  
  isExpired(row) {
    if (!row || !row.created_at) return true;
    const created = new Date(row.created_at);
    const now = new Date();
    return (now - created) > 24 * 60 * 60 * 1000; // 24 hours
  },

  async markVerified(code, telegramId, phone) {
    await VerificationCodesBase.updateStatus(code, 'verified', {
      telegramId: String(telegramId),
      phone,
      verifiedAt: new Date().toISOString(),
    });
  },

  async markClaimed(code) {
    await VerificationCodesBase.updateStatus(code, 'verified', {
      claimedAt: new Date().toISOString(),
    });
  },

  async attachChat(code, telegramId, chatId) {
    try {
      await VerificationCodesBase.updateStatus(code, 'awaiting_contact', {
        telegramId: String(telegramId),
        chatId: String(chatId),
      });
      return true;
    } catch (err) {
      console.error('[VerificationCodes] attachChat error:', err);
      return false;
    }
  },

  async findAwaitingByChat(chatId) {
    const res = await query(
      'SELECT * FROM verification_codes WHERE chat_id = $1 AND status = $2 LIMIT 1',
      [String(chatId), 'awaiting_contact']
    );
    return res.rows[0] || null;
  },

  async cleanupExpired() {
    await VerificationCodesBase.cleanup();
  },
};

export { VerificationCodesExtended as VerificationCodes };

// ══════════════════════════════════════════════════════════════════
//  BACKUP (PostgreSQL version)
// ══════════════════════════════════════════════════════════════════

export const Backup = {
  list() {
    const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
      return [];
    }

    const files = fs.readdirSync(backupDir)
      .filter(f => f.endsWith('.sql'))
      .map(f => {
        const stats = fs.statSync(path.join(backupDir, f));
        return {
          name: f,
          path: path.join(backupDir, f),
          size: stats.size,
          created: stats.birthtime,
        };
      })
      .sort((a, b) => b.created - a.created);

    return files;
  },

  create() {
    try {
      const backupDir = process.env.BACKUP_DIR || path.join(process.cwd(), 'backups');
      fs.mkdirSync(backupDir, { recursive: true });

      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').split('T')[0];
      const filename = `manyaktv-backup-${timestamp}.sql`;
      const filepath = path.join(backupDir, filename);

      console.log('[Backup] PostgreSQL backup requires pg_dump command');
      console.log('[Backup] Manual backup command:');
      console.log(`  pg_dump ${process.env.PG_DATABASE} > ${filepath}`);

      return {
        success: true,
        path: filepath,
        message: 'Use pg_dump manually or set up automated backups',
      };
    } catch (err) {
      console.error('[Backup] Error:', err);
      return { success: false, error: err.message };
    }
  },

  restore(backupPath) {
    console.log('[Backup] PostgreSQL restore requires psql command');
    console.log('[Backup] Manual restore command:');
    console.log(`  psql ${process.env.PG_DATABASE} < ${backupPath}`);
    
    return {
      success: false,
      error: 'Manual restore required. Use: psql manyaktv < backup.sql',
    };
  },
};

// ══════════════════════════════════════════════════════════════════
//  SEED DATA
// ══════════════════════════════════════════════════════════════════

export async function seedIfEmpty() {
  try {
    const contentCount = await Contents.count();
    if (contentCount > 0) {
      console.log('[Seed] Database already has content, skipping seed');
      return;
    }

    console.log('[Seed] Seeding initial data...');
    
    // Initial settings
    const defaultSettings = {
      vipBenefits: [
        'Barcha kino va seriallarni reklam siz tomosha qiling',
        'Yangi qismlar chiqishi bilan bir vaqtda tomosha qiling',
        'HD sifatda tomosha qiling',
      ],
      paymentMethods: [],
      telegramChannel: process.env.TELEGRAM_CHANNEL_ID || '@Manyak_tv',
      telegramBot: 'https://t.me/Animanyaktvuzbot',
      supportContact: '@Manyak_tv',
      appointedAdmins: [],
    };
    
    await Settings.set(defaultSettings);
    
    // Initial plan
    const initialPlan = {
      id: 'vip-1-month',
      name: '1 oylik VIP',
      price: 50000,
      originalPrice: 70000,
      durationDays: 30,
      badge: 'Mashhur',
      features: [
        'Barcha kontent ochiq',
        'Reklam yo\'q',
        'HD sifat',
      ],
    };
    
    await Plans.upsert(initialPlan);
    
    console.log('[Seed] ✅ Initial data seeded');
  } catch (err) {
    console.error('[Seed] Error:', err);
  }
}

// Export DB_PATH for compatibility (not used in PostgreSQL)
export const DB_PATH = `postgresql://${process.env.PG_HOST}:${process.env.PG_PORT}/${process.env.PG_DATABASE}`;

// Export db for compatibility (connection pool)
export const db = pool;

// Path import for Backup
import path from 'path';
import fs from 'fs';
