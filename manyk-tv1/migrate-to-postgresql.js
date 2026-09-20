/**
 * MANYK TV — SQLite → PostgreSQL Migration Script
 * ================================================
 * Mavjud SQLite ma'lumotlarini PostgreSQL ga ko'chiradi.
 * 
 * ISHLATISH:
 * 1. PostgreSQL database yarating: createdb manyaktv
 * 2. .env faylda PostgreSQL ma'lumotlarini kiriting
 * 3. node migrate-to-postgresql.js
 */

import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// SQLite database
const DATA_DIR = process.env.DATA_DIR || path.join(__dirname, 'data');
const SQLITE_DB_PATH = path.join(DATA_DIR, 'manyktv.db');

if (!fs.existsSync(SQLITE_DB_PATH)) {
  console.error('❌ SQLite database topilmadi:', SQLITE_DB_PATH);
  process.exit(1);
}

console.log('📂 SQLite database:', SQLITE_DB_PATH);

const sqliteDb = new DatabaseSync(SQLITE_DB_PATH);

// PostgreSQL connection
import('./database.pg.js').then(async (pgModule) => {
  const { 
    pool, 
    initializeSchema, 
    Users, 
    Receipts, 
    Contents, 
    Plans, 
    PromoCodes, 
    WatchHistory, 
    Favorites, 
    Settings, 
    AppointedAdmins, 
    AuditLogs, 
    VerificationCodes, 
    BannedDevices, 
    Comments 
  } = pgModule;

  console.log('\n🚀 PostgreSQL migratsiya boshlanmoqda...\n');

  try {
    // Step 1: Schema yaratish
    console.log('1️⃣  PostgreSQL schema yaratilmoqda...');
    await initializeSchema();
    console.log('   ✅ Schema tayyor\n');

    // Step 2: Settings
    console.log('2️⃣  Settings ko\'chirilmoqda...');
    const settingsRow = sqliteDb.prepare('SELECT * FROM settings WHERE id = 1').get();
    if (settingsRow) {
      const settingsData = JSON.parse(settingsRow.data || '{}');
      await Settings.set(settingsData);
      console.log('   ✅ Settings ko\'chirildi\n');
    } else {
      console.log('   ⚠️  Settings topilmadi\n');
    }

    // Step 3: Users
    console.log('3️⃣  Foydalanuvchilar ko\'chirilmoqda...');
    const sqliteUsers = sqliteDb.prepare('SELECT * FROM users').all();
    let userCount = 0;
    for (const row of sqliteUsers) {
      const user = {
        id: row.id,
        firstName: row.first_name,
        lastName: row.last_name,
        username: row.username,
        phone: row.phone,
        isPhoneVerified: Boolean(row.is_phone_verified),
        isVip: Boolean(row.is_vip),
        vipExpiresAt: row.vip_expires_at,
        purchasedContentIds: JSON.parse(row.purchased_content_ids || '[]'),
        deviceToken: row.device_token,
        accessTokens: row.access_tokens || 0,
        unlockedEpisodeIds: JSON.parse(row.unlocked_episode_ids || '[]'),
        vipDiscountPercent: row.vip_discount_percent || 0,
        bonusBalance: row.bonus_balance || 0,
        dailyCheckIn: JSON.parse(row.daily_checkin || '{}'),
        hwidBinding: row.hwid_binding ? JSON.parse(row.hwid_binding) : undefined,
        isBanned: Boolean(row.is_banned),
        banReason: row.ban_reason,
        isDeviceBanned: Boolean(row.is_device_banned),
        createdAt: row.created_at,
        lastLoginAt: row.last_login_at,
      };
      await Users.upsert(user);
      userCount++;
    }
    console.log(`   ✅ ${userCount} ta foydalanuvchi ko'chirildi\n`);

    // Step 4: Contents
    console.log('4️⃣  Kontent ko\'chirilmoqda...');
    const sqliteContents = sqliteDb.prepare('SELECT * FROM contents').all();
    let contentCount = 0;
    for (const row of sqliteContents) {
      const content = JSON.parse(row.data || '{}');
      content.id = row.id;
      await Contents.upsert(content);
      contentCount++;
    }
    console.log(`   ✅ ${contentCount} ta kontent ko'chirildi\n`);

    // Step 5: Plans
    console.log('5️⃣  Tariflar ko\'chirilmoqda...');
    const sqlitePlans = sqliteDb.prepare('SELECT * FROM plans').all();
    let planCount = 0;
    for (const row of sqlitePlans) {
      const plan = JSON.parse(row.data || '{}');
      plan.id = row.id;
      await Plans.upsert(plan);
      planCount++;
    }
    console.log(`   ✅ ${planCount} ta tarif ko'chirildi\n`);

    // Step 6: Receipts
    console.log('6️⃣  To\'lov cheklari ko\'chirilmoqda...');
    const sqliteReceipts = sqliteDb.prepare('SELECT * FROM receipts').all();
    let receiptCount = 0;
    for (const row of sqliteReceipts) {
      await pool.query(`
        INSERT INTO receipts (
          id, user_id, user_name, user_phone, type, plan_id, plan_name,
          content_id, content_title, amount, discount_applied, promo_code_used,
          receipt_image_url, notes, status, created_at, reviewed_at, reviewed_by
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        ON CONFLICT(id) DO NOTHING
      `, [
        row.id, row.user_id, row.user_name, row.user_phone, row.type,
        row.plan_id, row.plan_name, row.content_id, row.content_title,
        row.amount, row.discount_applied, row.promo_code_used,
        row.receipt_image_url, row.notes, row.status, row.created_at,
        row.reviewed_at, row.reviewed_by
      ]);
      receiptCount++;
    }
    console.log(`   ✅ ${receiptCount} ta chek ko'chirildi\n`);

    // Step 7: Promo Codes
    console.log('7️⃣  Promokodlar ko\'chirilmoqda...');
    const sqlitePromos = sqliteDb.prepare('SELECT * FROM promo_codes').all();
    let promoCount = 0;
    for (const row of sqlitePromos) {
      await pool.query(`
        INSERT INTO promo_codes (code, discount_percent, max_uses, current_uses, expires_at, is_active)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT(code) DO NOTHING
      `, [
        row.code, row.discount_percent, row.max_uses, row.current_uses,
        row.expires_at, Boolean(row.is_active)
      ]);
      promoCount++;
    }
    console.log(`   ✅ ${promoCount} ta promokod ko'chirildi\n`);

    // Step 8: Watch History
    console.log('8️⃣  Tomosha tarixi ko\'chirilmoqda...');
    const sqliteHistory = sqliteDb.prepare('SELECT * FROM watch_history').all();
    let historyCount = 0;
    for (const row of sqliteHistory) {
      await WatchHistory.upsert({
        id: row.id,
        userId: row.user_id,
        contentId: row.content_id,
        episodeId: row.episode_id,
        contentTitle: row.content_title,
        episodeTitle: row.episode_title,
        posterUrl: row.poster_url,
        progressSeconds: row.progress_seconds,
        totalSeconds: row.total_seconds,
        watchedAt: row.watched_at,
      });
      historyCount++;
    }
    console.log(`   ✅ ${historyCount} ta tomosha yozuvi ko'chirildi\n`);

    // Step 9: Favorites
    console.log('9️⃣  Sevimlilar ko\'chirilmoqda...');
    const sqliteFavorites = sqliteDb.prepare('SELECT * FROM favorites').all();
    let favCount = 0;
    for (const row of sqliteFavorites) {
      await pool.query(`
        INSERT INTO favorites (user_id, content_id, added_at)
        VALUES ($1, $2, $3)
        ON CONFLICT DO NOTHING
      `, [row.user_id, row.content_id, row.added_at]);
      favCount++;
    }
    console.log(`   ✅ ${favCount} ta sevimli ko'chirildi\n`);

    // Step 10: Appointed Admins
    console.log('🔟 Adminlar ko\'chirilmoqda...');
    const sqliteAdmins = sqliteDb.prepare('SELECT * FROM appointed_admins').all();
    let adminCount = 0;
    for (const row of sqliteAdmins) {
      await AppointedAdmins.upsert({
        id: row.id,
        name: row.name,
        username: row.username,
        roleTitle: row.role_title,
        isSuperAdmin: Boolean(row.is_super_admin),
        permissions: JSON.parse(row.permissions || '{}'),
        appointedAt: row.appointed_at,
        appointedBy: row.appointed_by,
      });
      adminCount++;
    }
    console.log(`   ✅ ${adminCount} ta admin ko'chirildi\n`);

    // Step 11: Audit Logs
    console.log('1️⃣1️⃣  Audit logs ko\'chirilmoqda...');
    const sqliteLogs = sqliteDb.prepare('SELECT * FROM audit_logs').all();
    let logCount = 0;
    for (const row of sqliteLogs) {
      await pool.query(`
        INSERT INTO audit_logs (
          admin_id, admin_name, action, target_type, target_id, target_title,
          details, secondary_auth_passed, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      `, [
        row.admin_id, row.admin_name, row.action, row.target_type,
        row.target_id, row.target_title, row.details,
        Boolean(row.secondary_auth_passed), row.created_at
      ]);
      logCount++;
    }
    console.log(`   ✅ ${logCount} ta audit log ko'chirildi\n`);

    // Step 12: Verification Codes
    console.log('1️⃣2️⃣  Tasdiqlash kodlari ko\'chirilmoqda...');
    const sqliteCodes = sqliteDb.prepare('SELECT * FROM verification_codes').all();
    let codeCount = 0;
    for (const row of sqliteCodes) {
      await pool.query(`
        INSERT INTO verification_codes (
          code, status, telegram_id, chat_id, phone, created_at, verified_at, claimed_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        ON CONFLICT(code) DO NOTHING
      `, [
        row.code, row.status, row.telegram_id, row.chat_id, row.phone,
        row.created_at, row.verified_at, row.claimed_at
      ]);
      codeCount++;
    }
    console.log(`   ✅ ${codeCount} ta kod ko'chirildi\n`);

    // Step 13: Banned Devices
    console.log('1️⃣3️⃣  Bloklangan qurilmalar ko\'chirilmoqda...');
    const sqliteBanned = sqliteDb.prepare('SELECT * FROM banned_devices').all();
    let bannedCount = 0;
    for (const row of sqliteBanned) {
      await pool.query(`
        INSERT INTO banned_devices (device_token, banned_at)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [row.device_token, row.banned_at]);
      bannedCount++;
    }
    console.log(`   ✅ ${bannedCount} ta bloklangan qurilma ko'chirildi\n`);

    // Step 14: Comments
    console.log('1️⃣4️⃣  Izohlar ko\'chirilmoqda...');
    const sqliteComments = sqliteDb.prepare('SELECT * FROM comments').all();
    let commentCount = 0;
    for (const row of sqliteComments) {
      await pool.query(`
        INSERT INTO comments (
          id, content_id, episode_id, user_id, username, text, created_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT(id) DO NOTHING
      `, [
        row.id, row.content_id, row.episode_id, row.user_id,
        row.username, row.text, row.created_at
      ]);
      commentCount++;
    }
    console.log(`   ✅ ${commentCount} ta izoh ko'chirildi\n`);

    // Summary
    console.log('\n═══════════════════════════════════════════════════════');
    console.log('🎉 MIGRATSIYA MUVAFFAQIYATLI TUGADI!');
    console.log('═══════════════════════════════════════════════════════');
    console.log(`✅ Users: ${userCount}`);
    console.log(`✅ Contents: ${contentCount}`);
    console.log(`✅ Plans: ${planCount}`);
    console.log(`✅ Receipts: ${receiptCount}`);
    console.log(`✅ Promo Codes: ${promoCount}`);
    console.log(`✅ Watch History: ${historyCount}`);
    console.log(`✅ Favorites: ${favCount}`);
    console.log(`✅ Admins: ${adminCount}`);
    console.log(`✅ Audit Logs: ${logCount}`);
    console.log(`✅ Verification Codes: ${codeCount}`);
    console.log(`✅ Banned Devices: ${bannedCount}`);
    console.log(`✅ Comments: ${commentCount}`);
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('\n❌ MIGRATSIYA XATOSI:', error);
    console.error(error.stack);
    process.exit(1);
  } finally {
    await pool.end();
    sqliteDb.close();
    console.log('👋 Database connections yopildi');
  }
});
