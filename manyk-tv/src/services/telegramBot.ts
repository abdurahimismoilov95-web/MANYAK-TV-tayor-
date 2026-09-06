/**
 * MANYK TV — Telegram xabarnomalari (FAQAT server orqali)
 * ========================================================
 *
 * ═══ BU FAYL TO'LIQ QAYTA YOZILDI ═══
 *
 * ESKI KODDA 3 TA JIDDIY MUAMMO BOR EDI:
 *
 * 1) BOT TOKENI BRAUZERDA ISHLATILARDI.
 *    Har bir funksiya `settings.botToken` dan tokenni olib,
 *    `https://api.telegram.org/bot${botToken}/sendMessage` ga
 *    TO'G'RIDAN-TO'G'RI so'rov yuborardi. Bu tokenni DevTools /
 *    tarmoq jurnalidan ko'rish mumkin degani — token esa botni to'liq
 *    boshqarish huquqini beradi.
 *
 * 2) BRAUZERDAN `getUpdates` POLLING (`fetchAndProcessBotCommands`).
 *    Bu "bot ishlamayapti" muammosining asosiy sabablaridan biri edi:
 *      - Telegram webhook o'rnatilgan bo'lsa `getUpdates` ni RAD ETADI
 *        (409 Conflict) — webhook va polling BIR VAQTDA ISHLAMAYDI;
 *      - aksincha, brauzer polling qilsa, u serverdagi botdan
 *        update'larni "o'g'irlab" olardi va webhook bo'sh qolardi;
 *      - `lastProcessedUpdateId` modul o'zgaruvchisi har sahifa
 *        yangilanishida nolga qaytardi, ya'ni allaqachon bajarilgan
 *        `/approve_` buyruqlari QAYTA bajarilib, VIP ikki marta berilardi.
 *
 * 3) SOXTA MUVAFFAQIYAT. `proxyData.ok !== false` sharti HTML xato
 *    sahifasini ham "yuborildi" deb hisoblardi, shuning uchun xatolar
 *    ko'rinmasdi. Chek rasmi esa `photoUrl.startsWith('http')`
 *    tekshiruvidan o'tmagani uchun (base64 "data:" URL) adminga
 *    hech qachon yuborilmasdi.
 *
 * ENDI: bot mantiqi TO'LIQ SERVERDA (`server.js` + `/webhook`).
 * Bu fayl faqat serverdagi `/api/telegram/send` proxy'siga murojaat
 * qiladigan yupqa qatlam — brauzerda bot tokeni YO'Q.
 *
 * Xabarnomalarning aksariyati endi umuman bu yerdan yuborilmaydi:
 *  - chek kelganda adminlarga xabar  -> server (`POST /api/receipts`)
 *  - chek tasdiqlanganda/rad etilganda -> server (`Receipts.review`)
 *  - foydalanuvchi tasdiqlanganda    -> server (`/webhook` contact)
 * Shuning uchun bu fayldagi funksiyalar faqat qo'shimcha (ixtiyoriy)
 * kanal bo'lib xizmat qiladi va xatosi asosiy oqimni buzmaydi.
 */

import { getAuthHeaders } from './authToken';

/** Telegram HTML parse_mode uchun maxsus belgilarni himoyalaydi. */
export function escapeHtml(text: string | undefined | null): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export interface TelegramSendResult {
  ok: boolean;
  error?: string;
}

/**
 * Serverdagi proxy orqali Telegram xabari yuboradi.
 *
 * Server (`/api/telegram/send`) bot tokenini o'zida saqlaydi va kimga
 * yuborish mumkinligini tekshiradi (foydalanuvchi faqat o'ziga yoki
 * adminlarga yozishi mumkin) — ya'ni bu endpoint spam uchun ishlatilmaydi.
 *
 * ESKI KOD xatoni yashirardi; endi natija ANIQ qaytariladi.
 */
export async function sendTelegramMessage(
  chatId: string,
  text: string,
  options?: {
    photoUrl?: string;
    inlineKeyboard?: Array<Array<{ text: string; callback_data?: string; url?: string }>>;
  }
): Promise<TelegramSendResult> {
  if (!chatId || (!text && !options?.photoUrl)) {
    return { ok: false, error: 'chatId va matn kerak' };
  }

  const authHeaders = await getAuthHeaders();
  if (!authHeaders.Authorization) {
    // Telegram tashqarisida token bo'lmaydi — bu kutilgan holat, xato emas
    return { ok: false, error: 'Tizimga kirilmagan' };
  }

  // Nisbiy manzilni ("/uploads/...") to'liq manzilga aylantiramiz:
  // Telegram faqat ochiq HTTPS manzildan rasm oladi.
  let photoUrl = options?.photoUrl;
  if (photoUrl && photoUrl.startsWith('/')) {
    photoUrl = `${window.location.origin}${photoUrl}`;
  }
  // "data:" (base64) manzilni Telegram qabul qilmaydi — yubormaymiz.
  if (photoUrl && !photoUrl.startsWith('http')) {
    photoUrl = undefined;
  }

  try {
    const res = await fetch('/api/telegram/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({
        chatId,
        text,
        parseMode: 'HTML',
        photoUrl,
        inlineKeyboard: options?.inlineKeyboard,
      }),
    });

    const data = await res.json().catch(() => null);
    // Telegram API javobida ham `ok` bo'ladi — ikkisini ham tekshiramiz
    if (!res.ok || data?.ok === false) {
      return { ok: false, error: data?.error || data?.description || `status ${res.status}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err instanceof Error ? err.message : 'tarmoq xatosi' };
  }
}
