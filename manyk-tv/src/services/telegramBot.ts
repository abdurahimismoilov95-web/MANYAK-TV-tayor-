/**
 * MANYK TV - Telegram Bot Integration Service
 * Manages communication with Telegram Bot API for payment notifications,
 * command approvals (/approve_<id>, /reject_<id>), and user activation broadcasts.
 */

import { PaymentReceipt, SystemSettings } from '../types';

/**
 * Escapes characters that are special in Telegram HTML parse_mode
 */
export function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

let lastProcessedUpdateId = 0;

/**
 * Send an API message using Telegram Bot API
 */
export async function sendTelegramMessage(
  botToken: string,
  chatId: string,
  text: string,
  parseMode: 'HTML' | 'Markdown' = 'HTML',
  inlineKeyboard?: Array<Array<{ text: string; callback_data?: string; url?: string }>>
): Promise<boolean> {
  if (!botToken || !chatId) {
    console.warn('[TelegramBot] Missing botToken or chatId', { botToken, chatId });
    return false;
  }

  const payload: Record<string, unknown> = {
    chatId,
    text,
    parseMode,
  };

  if (inlineKeyboard && inlineKeyboard.length > 0) {
    payload.inlineKeyboard = inlineKeyboard;
  }

  // 1. Try Backend Proxy first (solves CORS and hides bot logic)
  try {
    const proxyRes = await fetch('/api/telegram/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const proxyData = await proxyRes.json();
    if (proxyRes.ok && proxyData.ok !== false) return true;
  } catch (err) {
    console.warn('[TelegramBot] Proxy failed, falling back to direct API...');
  }

  // 2. Fallback to Direct Telegram API
  try {
    const directPayload: Record<string, unknown> = {
      chat_id: chatId,
      text,
      parse_mode: parseMode,
    };
    if (inlineKeyboard && inlineKeyboard.length > 0) {
      directPayload.reply_markup = { inline_keyboard: inlineKeyboard };
    }
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(directPayload),
    });
    const data = await response.json();
    return Boolean(data.ok);
  } catch (error) {
    console.warn('[TelegramBot] Direct API Error:', error);
    return false;
  }
}

/**
 * Send Photo with Caption to Telegram
 */
export async function sendTelegramPhoto(
  botToken: string,
  chatId: string,
  photoUrl: string,
  caption: string,
  inlineKeyboard?: Array<Array<{ text: string; callback_data?: string; url?: string }>>
): Promise<boolean> {
  if (!botToken || !chatId) return false;

  const isHttpUrl = photoUrl.startsWith('http://') || photoUrl.startsWith('https://');

  // 1. Try Backend Proxy first
  if (isHttpUrl) {
    try {
      const proxyRes = await fetch('/api/telegram/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          chatId,
          text: caption,
          photoUrl,
          parseMode: 'HTML',
          inlineKeyboard,
        })
      });
      const proxyData = await proxyRes.json();
      if (proxyRes.ok && proxyData.ok !== false) return true;
    } catch (err) {
      console.warn('[TelegramBot] Proxy photo failed, falling back...');
    }
  }

  // 2. Fallback Direct Telegram API
  if (isHttpUrl) {
    try {
      const payload: Record<string, unknown> = {
        chat_id: chatId,
        photo: photoUrl,
        caption,
        parse_mode: 'HTML',
      };
      if (inlineKeyboard && inlineKeyboard.length > 0) {
        payload.reply_markup = { inline_keyboard: inlineKeyboard };
      }

      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendPhoto`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      return Boolean(data.ok);
    } catch {
      // Fallback to text message
    }
  }

  return sendTelegramMessage(botToken, chatId, caption, 'HTML', inlineKeyboard);
}

/**
 * 1. NOTIFY NEW RECEIPT SUBMISSION
 * Called when a user uploads and submits a payment receipt in PaymentModal
 */
export async function notifyReceiptSubmissionViaTelegram(
  receipt: PaymentReceipt,
  settings: SystemSettings
): Promise<void> {
  const botToken = settings.botToken || '';
  const targetTypeStr =
    receipt.type === 'vip_subscription'
      ? `💎 VIP Obuna: ${escapeHtml(receipt.planName || "Noma'lum tarif")}`
      : `🎬 Alohida Film/Serial: ${escapeHtml(receipt.contentTitle || "Noma'lum")}`;

  const messageText = [
    `🧾 <b>YANGI TO'LOV CHEKI KELDI!</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 <b>Foydalanuvchi:</b> ${escapeHtml(receipt.userName)}`,
    `🆔 <b>Telegram ID:</b> <code>${escapeHtml(receipt.userId)}</code>`,
    `📞 <b>Telefon:</b> ${escapeHtml(receipt.userPhone || "Ko'rsatilmagan")}`,
    `📦 <b>Xarid:</b> ${targetTypeStr}`,
    `💰 <b>To'lov summasi:</b> <b>${receipt.amount.toLocaleString()} so'm</b>`,
    receipt.promoCodeUsed ? `🏷 <b>Promokod:</b> ${escapeHtml(receipt.promoCodeUsed)} (-${receipt.discountApplied?.toLocaleString()} so'm)` : '',
    receipt.notes ? `📝 <b>Izoh:</b> <i>${escapeHtml(receipt.notes)}</i>` : '',
    `🆔 <b>Chek ID:</b> <code>${escapeHtml(receipt.id)}</code>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `⚡️ <b>TASDIQLASH BUYRUG'I:</b>`,
    `<code>/approve_${receipt.id}</code>`,
    ``,
    `❌ <b>RAD ETISH BUYRUG'I:</b>`,
    `<code>/reject_${receipt.id}</code>`,
  ]
    .filter(Boolean)
    .join('\n');

  const inlineButtons = [
    [
      {
        text: `✅ Tasdiqlash (/approve_${receipt.id})`,
        callback_data: `approve:${receipt.id}`,
      },
      {
        text: `❌ Rad etish (/reject_${receipt.id})`,
        callback_data: `reject:${receipt.id}`,
      },
    ],
  ];

  const adminIds =
    settings.adminTelegramIds && settings.adminTelegramIds.length > 0
      ? settings.adminTelegramIds
      : ['891846690'];

  for (const adminId of adminIds) {
    if (receipt.receiptImageUrl) {
      await sendTelegramPhoto(botToken, adminId, receipt.receiptImageUrl, messageText, inlineButtons);
    } else {
      await sendTelegramMessage(botToken, adminId, messageText, 'HTML', inlineButtons);
    }
  }
}

/**
 * 2. NOTIFY RECEIPT APPROVED ("HAM BOTKA HAM ILOVAGA OBUNANI TASTIQLASH BUYRUG'I KELSIN")
 * Dispatches confirmation notification directly to user's Telegram chat and Admin chat.
 */
export async function notifyReceiptApprovedViaTelegram(
  receipt: PaymentReceipt,
  settings: SystemSettings
): Promise<void> {
  const botToken = settings.botToken || '';
  const targetTitle = escapeHtml(receipt.planName || receipt.contentTitle || 'VIP Obuna');

  // 1. Send confirmation message directly to the USER on Telegram
  const userMessage = [
    `✅ <b>TABRIKLAYMIZ! TO'LOVINGIZ TASDIQLANDI!</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🔥 Siz yuborgan to'lov cheki admin tomonidan muvaffaqiyatli tasdiqlandi.`,
    ``,
    `🎁 <b>Faollashtirildi:</b> <b>${targetTitle}</b>`,
    `💰 <b>Summa:</b> ${receipt.amount.toLocaleString()} so'm`,
    `💎 <b>Status:</b> <b>VIP FOYDALANUVCHI (FAOLLASHTIRILDI)</b>`,
    ``,
    `🎬 Endi <b>MANYK TV</b> ilovasida barcha film, serial va 9:16 vertikal short dramalarni cheksiz Full HD formatda tomosha qilishingiz mumkin!`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `🍿 <i>Maroqli tomosha tilaymiz!</i>`,
  ].join('\n');

  await sendTelegramMessage(botToken, receipt.userId, userMessage, 'HTML', [
    [
      {
        text: "🎬 Ilovani Ochish va Tomosha Qilish",
        url: settings.telegramChannelUrl || 'https://t.me/manyak_tv_kino',
      },
    ],
  ]);

  // 2. Send confirmation report to ADMIN Telegram chat
  const adminIds =
    settings.adminTelegramIds && settings.adminTelegramIds.length > 0
      ? settings.adminTelegramIds
      : ['891846690'];

  const adminReport = [
    `✅ <b>TO'LOV VA OBUNA TASDIQLANDI!</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 <b>Foydalanuvchi:</b> ${receipt.userName} (ID: <code>${receipt.userId}</code>)`,
    `📦 <b>Xarid:</b> ${targetTitle}`,
    `💰 <b>Summa:</b> ${receipt.amount.toLocaleString()} so'm`,
    `🆔 <b>Chek ID:</b> <code>${receipt.id}</code>`,
    `━━━━━━━━━━━━━━━━━━━━━━`,
    `⚡️ <b>Holat:</b> Ham bot orqali foydalanuvchiga xabar yuborildi, ham ilovadagi obuna zudlik bilan ochildi!`,
  ].join('\n');

  for (const adminId of adminIds) {
    await sendTelegramMessage(botToken, adminId, adminReport, 'HTML');
  }
}

/**
 * 3. NOTIFY RECEIPT REJECTED
 */
export async function notifyReceiptRejectedViaTelegram(
  receipt: PaymentReceipt,
  settings: SystemSettings,
  reason?: string
): Promise<void> {
  const botToken = settings.botToken || '';

  const userMessage = [
    `⚠️ <b>TO'LOV CHEKI RAD ETILDI</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Afsuski, siz yuborgan to'lov cheki tasdiqlanmadi.`,
    reason ? `Sabab: <i>${reason}</i>` : `Sabab: Chek ma'lumotlari bank ko'chirmasida topilmadi yoki to'lov summasi mos kelmadi.`,
    ``,
    `Iltimos, qaytadan tekshirib to'g'ri chekni yuklang yoki admin bilan bog'laning.`,
  ].join('\n');

  await sendTelegramMessage(botToken, receipt.userId, userMessage, 'HTML');
}

/**
 * 4. POLL & PROCESS BOT COMMANDS (/approve_<id>, /reject_<id>)
 * Allows the admin to confirm payments by simply writing to the Telegram Bot!
 */
export async function fetchAndProcessBotCommands(
  settings: SystemSettings,
  onApprove: (receiptId: string, adminId: string) => void,
  onReject: (receiptId: string, adminId: string) => void
): Promise<number> {
  const botToken = settings.botToken || '';
  if (!botToken) return 0;

  try {
    const url = `https://api.telegram.org/bot${botToken}/getUpdates?offset=${lastProcessedUpdateId + 1}&limit=20`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.ok || !Array.isArray(data.result)) {
      return 0;
    }

    let processedCount = 0;
    const adminIds =
      settings.adminTelegramIds && settings.adminTelegramIds.length > 0
        ? settings.adminTelegramIds
        : ['891846690'];

    for (const update of data.result) {
      if (update.update_id >= lastProcessedUpdateId) {
        lastProcessedUpdateId = update.update_id;
      }

      // Check callback query (inline button clicks in Telegram)
      if (update.callback_query) {
        const fromId = String(update.callback_query.from?.id || '');
        const dataStr = String(update.callback_query.data || '');

        if (adminIds.includes(fromId) || fromId === '891846690') {
          if (dataStr.startsWith('approve:')) {
            const receiptId = dataStr.replace('approve:', '');
            onApprove(receiptId, fromId);
            processedCount++;
          } else if (dataStr.startsWith('reject:')) {
            const receiptId = dataStr.replace('reject:', '');
            onReject(receiptId, fromId);
            processedCount++;
          }
        }
      }

      // Check text message commands (/approve_rcpt_123)
      if (update.message?.text) {
        const fromId = String(update.message.from?.id || '');
        const text = update.message.text.trim();

        if (adminIds.includes(fromId) || fromId === '891846690') {
          if (text.startsWith('/approve_')) {
            const receiptId = text.replace('/approve_', '').trim();
            onApprove(receiptId, fromId);
            processedCount++;
          } else if (text.startsWith('/reject_')) {
            const receiptId = text.replace('/reject_', '').trim();
            onReject(receiptId, fromId);
            processedCount++;
          }
        }
      }
    }

    return processedCount;
  } catch {
    return 0;
  }
}

/**
 * 5. NOTIFY USER ACCOUNT / PHONE VERIFICATION VIA @Manyaktvbot
 */
export async function notifyUserVerificationViaTelegram(
  user: { id: string; firstName: string; phone?: string; username?: string },
  settings: SystemSettings
): Promise<void> {
  const botToken = settings.botToken || '';
  const botUser = settings.botUsername || 'Manyaktvbot';

  // 1. Notify user
  const userMsg = [
    `✅ <b>HISOBLASH TASDIQLANDI!</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `Sizning hisobingiz <b>@${botUser}</b> orqali muvaffaqiyatli tasdiqlandi.`,
    `Endi siz <b>MANYK TV</b> platformasida barcha imkoniyatlardan foydalanishingiz mumkin.`,
  ].join('\n');

  try {
    await sendTelegramMessage(botToken, user.id, userMsg, 'HTML', [
      [
        {
          text: '🎬 MANYK TV Ilovasiga O\'tish',
          url: settings.telegramChannelUrl || 'https://t.me/manyak_tv_kino',
        },
      ],
    ]);
  } catch (err) {
    console.warn('[TelegramBot] Could not message user directly:', err);
  }

  // 2. Alert admins
  const adminIds =
    settings.adminTelegramIds && settings.adminTelegramIds.length > 0
      ? settings.adminTelegramIds
      : ['891846690'];

  const adminMsg = [
    `🔔 <b>FOYDALANUVCHI TASDIQLANDI (@${botUser})</b>`,
    `━━━━━━━━━━━━━━━━━━━━━━━━`,
    `👤 <b>Foydalanuvchi:</b> ${escapeHtml(user.firstName)} ${user.username ? `(@${escapeHtml(user.username)})` : ''}`,
    `🆔 <b>Telegram ID:</b> <code>${escapeHtml(user.id)}</code>`,
    `📞 <b>Telefon:</b> ${escapeHtml(user.phone || 'Telegram orqali')}`,
    `⏰ <b>Vaqt:</b> ${new Date().toLocaleString()}`,
  ].join('\n');

  for (const adminId of adminIds) {
    try {
      await sendTelegramMessage(botToken, adminId, adminMsg, 'HTML');
    } catch {
      // ignore
    }
  }
}

