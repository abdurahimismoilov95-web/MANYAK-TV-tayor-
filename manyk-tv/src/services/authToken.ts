/**
 * MANYK TV — Backend auth token helper
 * =====================================
 * ESKI KOD: AdminPanel.tsx to'g'ridan-to'g'ri
 *   `Authorization: Bearer frontend_admin_bypass_manyak_tv_v1`
 * degan QATTIQ YOZILGAN (hardcoded) tokenni yuborardi. Bu token frontend
 * build ichida ochiq matnda saqlangani uchun uni saytni ochgan har kim
 * ko'rishi va o'zini SUPER ADMIN sifatida ko'rsatishi mumkin edi.
 *
 * Bu fayl endi haqiqiy backend JWT sini /api/auth/verify orqali
 * (Telegram WebApp initData asosida) oladi va keshlaydi. Backend HMAC bilan
 * initData ni tekshiradi va faqat haqiqatan ham adminlar ro'yxatidagi
 * foydalanuvchiga isAdmin:true bo'lgan token beradi — buni soxtalashtirib
 * bo'lmaydi.
 */

let cachedToken: string | null = null;
let cachedTokenExpiresAt = 0;

function getTelegramInitData(): string | null {
  const w = window as unknown as { Telegram?: { WebApp?: { initData?: string } } };
  return w.Telegram?.WebApp?.initData || null;
}

/**
 * Backenddan haqiqiy JWT oladi (agar hali olinmagan yoki eskirgan bo'lsa).
 * Telegram tashqarisida (initData yo'q) ishlaganda `null` qaytaradi —
 * bunday holda admin so'rovlari backend tomonidan 401 bilan rad etiladi,
 * bu to'g'ri xatti-harakat (soxta "hamma narsaga ruxsat" o'rniga).
 */
export async function getBackendAuthToken(): Promise<string | null> {
  if (cachedToken && Date.now() < cachedTokenExpiresAt) return cachedToken;

  const initData = getTelegramInitData();
  if (!initData) {
    console.warn('[Auth] Telegram initData topilmadi — backend so\'rovlari autentifikatsiyasiz qoladi.');
    return null;
  }

  try {
    const res = await fetch('/api/auth/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ initData }),
    });
    const data = await res.json();
    if (!data.ok || !data.token) {
      console.error('[Auth] Backend autentifikatsiyasi rad etildi:', data.error);
      return null;
    }
    cachedToken = data.token;
    // JWT 24 soatga beriladi (server.js), xavfsizlik uchun 23 soatdan keyin qayta so'raymiz
    cachedTokenExpiresAt = Date.now() + 23 * 60 * 60 * 1000;
    return cachedToken;
  } catch (err) {
    console.error('[Auth] Token olishda xatolik:', err);
    return null;
  }
}

/** Fetch uchun tayyor Authorization header (token bo'lmasa bo'sh object). */
export async function getAuthHeaders(): Promise<Record<string, string>> {
  const token = await getBackendAuthToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Keshlangan tokenni bekor qiladi — keyingi so'rovda yangisi olinadi.
 *
 * NEGA KERAK: token 23 soatga modul xotirasida keshlanadi va ilgari uni
 * BEKOR QILISH YO'LI YO'Q EDI. Agar server qayta ishga tushsa yoki
 * JWT_SECRET almashtirilsa, mavjud token yaroqsiz bo'lib qoladi — lekin
 * klient uni 23 soat davomida yuborishda davom etardi va HAR BIR so'rov
 * 401 bilan qaytardi. Foydalanuvchi uchun bu "hech narsa ishlamayapti"
 * degani, yechim esa faqat sahifani to'liq qayta yuklash bo'lardi.
 * Endi 401 javob olingan joyda shu funksiya chaqiriladi.
 */
export function invalidateAuthToken(): void {
  cachedToken = null;
  cachedTokenExpiresAt = 0;
}
