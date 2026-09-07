import {
  ContentItem,
  UserProfile,
  SubscriptionPlan,
  PaymentReceipt,
  PromoCode,
  SystemSettings,
  WatchHistoryItem,
  CatalogCategory,
  AdminAuditLog,
  DailyCheckInReward,
  DailyCheckInState,
  AdminPermissions,
  AppointedAdmin,
} from '../types';
import {
  INITIAL_CONTENT,
  INITIAL_PLANS,
  INITIAL_PROMO_CODES,
  INITIAL_SETTINGS,
} from '../data/initialData';
import {
  getOrCreateDeviceFingerprint,
  collectDeviceCharacteristics,
  bindUserToCurrentDevice,
  evaluateDeviceDeviation,
} from './deviceSecurity';
import { getAuthHeaders, invalidateAuthToken } from './authToken';

const KEYS = {
  CONTENT: 'manyak_tv_content_v1',
  SETTINGS: 'manyak_tv_settings_v1',
  PLANS: 'manyak_tv_plans_v1',
  PROMO_CODES: 'manyak_tv_promo_codes_v1',
  CURRENT_USER: 'manyak_tv_current_user_v1',
  USERS: 'manyak_tv_all_users_v1',
  RECEIPTS: 'manyak_tv_receipts_v1',
  HISTORY: 'manyak_tv_history_v1',
  FAVORITES: 'manyak_tv_favorites_v1',
  AUDIT_LOGS: 'manyak_tv_audit_logs_v1',
};

// ═══════════════════════════════════════════════════════════════════════════
//  KESH MIGRATSIYASI — ESKI VERSIYADAN QOLGAN "TASDIQLANGAN" BELGISI
// ═══════════════════════════════════════════════════════════════════════════
//
// ═══ TUZATILGAN XATO: TASDIQLASH OYNASI UMUMAN CHIQMASDI ═══
//
// Ilovaning eski versiyasida `isPhoneVerified = true` KLIENT tomonida
// yozilardi (`verifyUserPhone` / `verifyUserViaBot` — endi olib tashlangan).
// Ya'ni saytdan ilgari foydalangan har bir kishining localStorage'ida
// `isPhoneVerified: true` qolib ketgan.
//
// Yangi versiyada tasdiqlash oynasi shu shart bilan ochiladi:
//     isOpen={isPhoneModalOpen && !user.isPhoneVerified}
// va `refreshData()` da:
//     if (!currentUser.isPhoneVerified) setIsPhoneModalOpen(true);
//
// Eski kesh `true` bo'lgani uchun oyna HECH QACHON ochilmasdi. Bu esa
// halqaga olib kelardi:
//     tasdiqlash oynasi chiqmaydi -> foydalanuvchi bot orqali tasdiqlamaydi
//     -> JWT olinmaydi -> kontent saqlash, chek yuborish va admin panel
//     ishlamaydi (hammasi 401 qaytaradi)
//
// Yangi tashrifchilarda muammo yo'q edi (`stored` bo'sh -> isPhoneVerified
// false), shuning uchun bu faqat MAVJUD foydalanuvchilarda ko'rinardi —
// jumladan saytning egasida.
//
// YECHIM: `isPhoneVerified` endi SERVER maydoni. Eski keshdagi qiymatga
// ishonmaymiz: migratsiya bir marta ishlab, uni `false` ga qaytaradi.
// Haqiqiy holat keyin serverdan (`/api/me/entitlements`) keladi — ya'ni
// haqiqatan tasdiqlangan odam oynani qayta ko'rmaydi.
const SCHEMA_VERSION_KEY = 'manyak_tv_schema_version';
const CURRENT_SCHEMA_VERSION = '2';

function runCacheMigrations(): void {
  if (typeof localStorage === 'undefined') return;

  try {
    if (localStorage.getItem(SCHEMA_VERSION_KEY) === CURRENT_SCHEMA_VERSION) return;

    // 1) Joriy sessiyadagi ishonchsiz "tasdiqlangan" belgisini tozalash
    const rawCurrent = localStorage.getItem(KEYS.CURRENT_USER);
    if (rawCurrent) {
      const user = JSON.parse(rawCurrent);
      if (user && user.isPhoneVerified) {
        user.isPhoneVerified = false;
        localStorage.setItem(KEYS.CURRENT_USER, JSON.stringify(user));
        console.info('[Migration] Eski keshdagi tasdiqlash belgisi tozalandi — Telegram bot orqali qayta tasdiqlash so\'raladi.');
      }
    }

    // 2) Foydalanuvchilar katalogidagi nusxalarni ham
    const rawUsers = localStorage.getItem(KEYS.USERS);
    if (rawUsers) {
      const users = JSON.parse(rawUsers);
      if (Array.isArray(users)) {
        let changed = false;
        for (const u of users) {
          if (u && u.isPhoneVerified) {
            u.isPhoneVerified = false;
            changed = true;
          }
        }
        if (changed) localStorage.setItem(KEYS.USERS, JSON.stringify(users));
      }
    }

    localStorage.setItem(SCHEMA_VERSION_KEY, CURRENT_SCHEMA_VERSION);
  } catch (err) {
    // Migratsiya yiqilsa ilova ishlashda davom etishi kerak
    console.warn('[Migration] Keshni migratsiya qilishda xatolik:', err);
  }
}

// Modul yuklanishi bilan bir marta ishlaydi (getStoredCurrentUser dan oldin)
runCacheMigrations();

// Helper for local storage
function getItem<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw);
  } catch (err) {
    console.error(`Error reading ${key} from storage:`, err);
    return fallback;
  }
}

/**
 * localStorage kvotasi tugaganda ilova ishlashda davom etishi kerak —
 * shuning uchun kesh yozuvi muvaffaqiyatsiz bo'lsa BUG'IB QOLMAYMIZ, lekin
 * uni JIMGINA HAM YUTMAYMIZ: `manyak_storage_error` hodisasi yuboriladi va
 * UI foydalanuvchiga ogohlantirish ko'rsatishi mumkin.
 *
 * ESKI KOD faqat `console.error` qilardi. Bu Safari private rejimi va
 * cheklangan Telegram WebView'larida shunday ko'rinardi: har bir xarid,
 * token sarflash, sevimli va tarix yozuvi JIMGINA yo'qoladi, UI esa
 * muvaffaqiyat haqida xabar beradi.
 *
 * @returns yozuv muvaffaqiyatli bo'lsa `true`
 */
function setItem<T>(key: string, value: T, emitEvent = true): boolean {
  if (typeof localStorage === 'undefined') return false;

  try {
    localStorage.setItem(key, JSON.stringify(value));
    if (emitEvent && typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('manyak_storage_update', { detail: { key } }));
    }
    return true;
  } catch (err) {
    // Kvota tugashi (QuotaExceededError / NS_ERROR_DOM_QUOTA_REACHED) eng
    // ko'p uchraydigan holat — bunda eski keshni tozalab qayta urinamiz.
    const isQuotaError =
      err instanceof DOMException &&
      (err.name === 'QuotaExceededError' ||
        err.name === 'NS_ERROR_DOM_QUOTA_REACHED' ||
        err.code === 22);

    if (isQuotaError && pruneCacheForSpace(key)) {
      try {
        localStorage.setItem(key, JSON.stringify(value));
        if (emitEvent && typeof window !== 'undefined') {
          window.dispatchEvent(new CustomEvent('manyak_storage_update', { detail: { key } }));
        }
        return true;
      } catch {
        // pastdagi umumiy xato yo'liga tushamiz
      }
    }

    console.error(`[Storage] '${key}' saqlanmadi:`, err);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('manyak_storage_error', {
          detail: {
            key,
            isQuotaError,
            message: isQuotaError
              ? "Qurilma xotirasi to'lgan — ma'lumot vaqtincha saqlanmadi. Muhim ma'lumotlar serverda saqlangan."
              : "Ma'lumotni qurilmada saqlab bo'lmadi (brauzer xotirasi cheklangan).",
          },
        })
      );
    }
    return false;
  }
}

/**
 * Kvota tugaganda joy bo'shatish uchun eng KATTA va eng KAM MUHIM keshni
 * tozalaydi. Bu ma'lumotlar serverda bor (yoki qayta yaratiladi), shuning
 * uchun ularni o'chirish xavfsiz.
 *
 * @returns joy bo'shatilgan bo'lsa `true`
 */
function pruneCacheForSpace(exceptKey: string): boolean {
  // Muhimlik tartibida: eng avval tashlab yuborilishi mumkin bo'lganlar
  const disposable = [KEYS.AUDIT_LOGS, KEYS.RECEIPTS, KEYS.HISTORY, KEYS.CONTENT];
  let freed = false;

  for (const key of disposable) {
    if (key === exceptKey) continue;
    try {
      if (localStorage.getItem(key) !== null) {
        localStorage.removeItem(key);
        freed = true;
        console.warn(`[Storage] Xotira tugadi — '${key}' keshi tozalandi (ma'lumot serverda saqlanadi).`);
      }
    } catch {
      // o'chirish ham ishlamasa — davom etamiz
    }
  }
  return freed;
}

// 1. CONTENT
export function getStoredContent(): ContentItem[] {
  const all = getItem<ContentItem[]>(KEYS.CONTENT, INITIAL_CONTENT);
  // Guarantee valid playable video URL for every movie and episode
  const defaultVideo = 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4';
  return all.map((item) => {
    const initialMatch = INITIAL_CONTENT.find((c) => c.id === item.id);
    const resolvedVideoUrl = item.videoUrl || initialMatch?.videoUrl || defaultVideo;
    const resolvedEpisodes = item.episodes?.map((ep, idx) => {
      const initialEp = initialMatch?.episodes?.find((e) => e.id === ep.id || e.episodeNumber === ep.episodeNumber);
      return {
        ...ep,
        videoUrl: ep.videoUrl || initialEp?.videoUrl || defaultVideo,
      };
    });

    return {
      ...item,
      videoUrl: resolvedVideoUrl,
      episodes: resolvedEpisodes || item.episodes,
    };
  });
}

/**
 * Kontentni saqlaydi (qo'shadi yoki tahrirlaydi).
 *
 * ═══════════════════════════════════════════════════════════════════════
 *  1-MUAMMO: "ADMIN QO'SHGAN KONTENT FAQAT ADMINGA KO'RINADI"
 * ═══════════════════════════════════════════════════════════════════════
 *
 * ESKI KOD:
 *     setItem(KEYS.CONTENT, all);              // 1) localStorage'ga yozadi
 *     getAuthHeaders().then((h) => {
 *       fetch('/api/contents', {...})          // 2) serverga "otib yuboradi"
 *         .then(d => { if (!d?.ok) console.error(...) })   // xato -> konsol
 *         .catch(err => console.error(...));
 *     });
 *                                              // 3) darhol qaytadi
 *
 * Nima uchun kontent faqat adminga ko'rinardi:
 *
 *   a) Serverga so'rov NATIJASI KUTILMASDI va xato faqat `console.error`
 *      ga yozilardi. AdminPanel esa `saveStoredContent(...)` dan keyin
 *      darhol "muvaffaqiyatli saqlandi!" xabarini ko'rsatardi.
 *
 *   b) `getAuthHeaders()` Telegram `initData` bo'lmaganda BO'SH `{}`
 *      qaytaradi. Ya'ni admin panelni oddiy brauzerda (Telegram bot
 *      orqali emas) ochgan bo'lsa, so'rov tokensiz ketardi va server
 *      401 bilan RAD ETARDI.
 *
 *   Natijada kontent FAQAT admin brauzerining localStorage'ida qolardi.
 *   Admin uni ko'rardi (o'z keshidan), boshqa foydalanuvchilar esa
 *   serverdan (`syncContentFromServer`) o'qigani uchun ko'rmasdi.
 *
 * ENDI: SERVER BIRINCHI. Avval serverga yoziladi; muvaffaqiyat bo'lsagina
 * lokal kesh yangilanadi. Xato bo'lsa `throw` qiladi — AdminPanel esa
 * haqiqiy sababni ko'rsatadi ("tizimga kirilmagan", "ruxsat yo'q" va h.k.).
 * Shunday qilib "saqlandi" degan xabar faqat kontent HAMMAGA ko'rinadigan
 * holatda chiqadi.
 */
export async function saveStoredContent(content: ContentItem): Promise<ContentItem> {
  const authHeaders = await getAuthHeaders();

  if (!authHeaders.Authorization) {
    throw new Error(
      "Tizimga kirilmagan: kontentni saqlash uchun ilovani Telegram bot orqali ochishingiz kerak. " +
      "Aks holda kontent faqat shu qurilmada qolib, boshqa foydalanuvchilarga ko'rinmaydi."
    );
  }

  const all = getStoredContent();
  const isNew = !all.some((c) => c.id === content.id);

  let res: Response;
  try {
    res = await fetch(isNew ? '/api/contents' : `/api/contents/${content.id}`, {
      method: isNew ? 'POST' : 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(content),
    });
  } catch {
    throw new Error("Serverga ulanib bo'lmadi. Internet aloqasini tekshirib, qayta urinib ko'ring.");
  }

  if (res.status === 401) {
    invalidateAuthToken();
    throw new Error('Sessiya muddati tugagan. Ilovani qayta ochib, yana urinib ko\'ring.');
  }
  if (res.status === 403) {
    throw new Error("Ruxsat yo'q: bu amal uchun administrator huquqi kerak.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Kontentni serverga saqlab bo'lmadi (status ${res.status}).`);
  }

  // Server normallashtirilgan kontentni qaytaradi (id ni o'zi yaratishi mumkin)
  const saved: ContentItem = data.content || content;

  // Endi lokal keshni yangilaymiz. Kesh yozilmasa ham muhim emas —
  // kontent allaqachon serverda va `syncContentFromServer` uni tortadi.
  const cached = getStoredContent();
  const idx = cached.findIndex((c) => c.id === saved.id);
  if (idx >= 0) cached[idx] = saved;
  else cached.unshift(saved);
  setItem(KEYS.CONTENT, cached);

  return saved;
}

/**
 * Kontentni o'chiradi — bu ham SERVER BIRINCHI.
 *
 * ESKI KOD localStorage'dan darhol o'chirib, serverga fire-and-forget
 * DELETE yuborardi. Server rad etsa (401/403), kontent admin ekranidan
 * yo'qolardi, lekin BOSHQA foydalanuvchilarda QOLARDI — ya'ni admin uni
 * "o'chirdim" deb o'ylardi.
 */
export async function deleteStoredContent(id: string): Promise<void> {
  const authHeaders = await getAuthHeaders();

  if (!authHeaders.Authorization) {
    throw new Error(
      "Tizimga kirilmagan: kontentni o'chirish uchun ilovani Telegram bot orqali ochishingiz kerak."
    );
  }

  let res: Response;
  try {
    res = await fetch(`/api/contents/${encodeURIComponent(id)}`, {
      method: 'DELETE',
      headers: { ...authHeaders },
    });
  } catch {
    throw new Error("Serverga ulanib bo'lmadi. Internet aloqasini tekshiring.");
  }

  if (res.status === 401) {
    invalidateAuthToken();
    throw new Error('Sessiya muddati tugagan. Ilovani qayta ochib, yana urinib ko\'ring.');
  }
  if (res.status === 403) {
    throw new Error("Ruxsat yo'q: bu amal uchun administrator huquqi kerak.");
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    throw new Error(data?.error || `Kontentni o'chirib bo'lmadi (status ${res.status}).`);
  }

  setItem(KEYS.CONTENT, getStoredContent().filter((c) => c.id !== id));
}

// Serverdagi (SQLite) umumiy kontent ro'yxatini localStorage keshiga
// tortib olish. Bu — ilova ochilganda va admin/boshqa qurilmada kontent
// o'zgarganda barcha foydalanuvchilarning ekranida bir xil ro'yxat
// ko'rinishini ta'minlaydi (avval umuman chaqirilmagan edi).
/**
 * Serverdagi kontent ro'yxatini keshga tortib oladi.
 *
 * ═══ ENDI AUTENTIFIKATSIYA TALAB QILADI ═══
 * ESKI KOD `fetch('/api/contents')` ni tokensiz yuborardi, chunki endpoint
 * himoyasiz edi. Bu shuni bildirardi: istalgan odam brauzerdan (yoki `curl`
 * bilan) butun katalogni va har bir qismning VIDEO MANZILINI olib qo'yardi.
 *
 * Endi kontent faqat Telegram Mini App ichidagi foydalanuvchiga yoki adminga
 * beriladi (server: `requireAppAccess`), shuning uchun token yuborish shart.
 */
export async function syncContentFromServer(): Promise<void> {
  const authHeaders = await getAuthHeaders();
  if (!authHeaders.Authorization) {
    // Token yo'q — Telegram tashqarisida yoki hali tasdiqlanmagan.
    // Bu xato emas: kirish ekrani ko'rsatiladi.
    return;
  }

  try {
    const res = await fetch('/api/contents', { headers: authHeaders });

    if (res.status === 401) {
      invalidateAuthToken();
      return;
    }
    if (res.status === 403) {
      // Brauzerdan kirish bloklangan (oddiy foydalanuvchi) — kesh o'zgarmaydi
      return;
    }

    const data = await res.json();
    if (data?.ok && Array.isArray(data.contents)) {
      setItem(KEYS.CONTENT, data.contents);
    }
  } catch (err) {
    // Oflayn holat — keshdagi ro'yxat bilan davom etamiz
    console.warn('Kontentni serverdan olishda tarmoq xatosi:', err);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  ENTITLEMENTS — pul bilan bog'liq holatning YAGONA HAQIQAT MANBASI
// ═══════════════════════════════════════════════════════════════════════════
//
// MUAMMO: ilgari VIP holati, sotib olingan kinolar, ochilgan qismlar va
// tokenlar localStorage'da "haqiqat" sifatida saqlanardi va klient kodning
// o'zi ularni BERARDI (`reviewReceipt`, `performInstantPurchase`,
// `useAccessTokenToUnlock`, `claimDailyCheckIn`). Ya'ni brauzer konsolida
//     localStorage.setItem('manyak_tv_current_user_v1',
//       JSON.stringify({ ...user, isVip: true, accessTokens: 999 }))
// deb yozish yetarli edi — hech nima to'lamasdan butun katalog ochilardi.
//
// YECHIM: bu maydonlar endi FAQAT serverdan (`GET /api/me/entitlements`)
// keladi. localStorage esa oddiy KESH: uni tahrirlash foydasiz, chunki
// keyingi sinxronlashda server qiymati ustidan yozadi.

/** Server tomonidan boshqariladigan maydonlar — klient bularni O'ZI YOZMAYDI. */
export interface Entitlements {
  userId: string;
  isVip: boolean;
  vipExpiresAt: string | null;
  purchasedContentIds: string[];
  unlockedEpisodeIds: string[];
  accessTokens: number;
  bonusBalance: number;
  vipDiscountPercent: number;
  isPhoneVerified: boolean;
  isBanned: boolean;
  isAdmin: boolean;
  isSuperAdmin: boolean;
  /** Faqat adminlarga qaytariladi; oddiy foydalanuvchida `null`. */
  superAdminId: string | null;
  syncedAt: string;
}

/**
 * Serverdan avtoritiv entitlement'larni olib, keshlangan profilga yozadi.
 *
 * Telegram tashqarisida (JWT yo'q) `null` qaytaradi — bu holda keshdagi
 * qiymat o'zgarmaydi, lekin u ham hech qanday huquq BERMAYDI, chunki
 * haqiqiy tekshiruv serverda (`/api/tokens/unlock`, chek tasdiqlash va h.k.).
 */
export async function syncEntitlementsFromServer(): Promise<Entitlements | null> {
  const authHeaders = await getAuthHeaders();
  if (!authHeaders.Authorization) return null;

  try {
    const res = await fetch('/api/me/entitlements', { headers: authHeaders });
    if (!res.ok) {
      // 401 => token eskirgan yoki secret o'zgargan; keshni tozalab
      // keyingi so'rovda yangi token olinadi.
      if (res.status === 401) invalidateAuthToken();
      console.warn(`[Entitlements] Serverdan olinmadi (status ${res.status})`);
      return null;
    }
    const data = await res.json();
    if (!data?.ok || !data.entitlements) return null;

    return applyEntitlementsToCache(data.entitlements as Entitlements);
  } catch (err) {
    // Oflayn holat — keshdagi qiymat bilan davom etamiz
    console.warn('[Entitlements] Tarmoq xatosi, keshdagi qiymat ishlatiladi:', err);
    return null;
  }
}

/**
 * Server qiymatlarini keshlangan `CURRENT_USER` va `USERS` yozuvlariga
 * yozadi. Faqat entitlement maydonlari yangilanadi — ism, avatar kabi
 * klient tomonidagi zararsiz maydonlar saqlanadi.
 */
function applyEntitlementsToCache(ent: Entitlements): Entitlements {
  // Adminlik holatini serverning JWT claim'idan belgilaymiz — bu
  // localStorage'dagi hech qanday qiymatga bog'liq emas.
  setServerVerifiedAdmin(ent.userId, ent.isAdmin, ent.isSuperAdmin);

  // Bosh admin ID si faqat adminlarga qaytariladi (aks holda `null`).
  runtimeSuperAdminId = ent.superAdminId || '';

  const stored = getItem<UserProfile | null>(KEYS.CURRENT_USER, null);
  if (!stored || stored.id !== ent.userId) return ent;

  const updated: UserProfile = {
    ...stored,
    isVip: ent.isVip,
    vipExpiresAt: ent.vipExpiresAt || undefined,
    purchasedContentIds: ent.purchasedContentIds,
    unlockedEpisodeIds: ent.unlockedEpisodeIds,
    accessTokens: ent.accessTokens,
    bonusBalance: ent.bonusBalance,
    vipDiscountPercent: ent.vipDiscountPercent,
    isPhoneVerified: ent.isPhoneVerified,
  };

  setItem(KEYS.CURRENT_USER, updated, false);

  // `USERS` katalogidagi nusxani ham moslashtiramiz, aks holda keyinroq
  // `{ ...current, ...targetUser }` shaklidagi birlashmalar eski
  // entitlement qiymatlarini qaytarib qo'yadi.
  const all = getItem<UserProfile[]>(KEYS.USERS, INITIAL_USERS);
  const idx = all.findIndex((u) => u.id === ent.userId);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...updated };
    setItem(KEYS.USERS, all, false);
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('manyak_storage_update', { detail: { key: KEYS.CURRENT_USER } }));
  }

  return ent;
}

// Fayl (poster rasm yoki video) ni serverga yuklab, doimiy URL qaytaradi.
// ESKI KOD: katta fayllar uchun URL.createObjectURL(file) ishlatilardi —
// bu "blob:" URL faqat joriy sahifa sessiyasida yashaydi va sayt
// yangilanishi/qayta ochilishi bilanoq ishlamay qoladi (buzilgan video/rasm).
// Kichik fayllar esa base64 ko'rinishida to'g'ridan-to'g'ri localStorage'ga
// yozilardi — bu ham faqat shu qurilmada saqlanadi va localStorage
// hajmidan (~5-10MB) tez oshib ketadi. Endi fayl haqiqatan ham serverga
// (disk'ga) yuklanadi va barcha foydalanuvchilar uchun ishlaydigan doimiy
// "/uploads/..." manzili qaytariladi.
export function uploadFileToServer(
  file: File,
  onProgress?: (percent: number) => void
): Promise<string> {
  return getAuthHeaders().then((authHeaders) => {
    return new Promise<string>((resolve, reject) => {
      const ext = file.name.includes('.') ? file.name.split('.').pop() : '';
      const xhr = new XMLHttpRequest();
      xhr.open('POST', `/api/upload?ext=${encodeURIComponent(ext || '')}`, true);
      Object.entries(authHeaders).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');

      xhr.upload.onprogress = (evt) => {
        if (onProgress && evt.lengthComputable) {
          onProgress((evt.loaded / evt.total) * 100);
        }
      };

      xhr.onload = () => {
        try {
          const data = JSON.parse(xhr.responseText);
          if (xhr.status >= 200 && xhr.status < 300 && data.ok && data.url) {
            resolve(data.url);
          } else {
            reject(new Error(data?.error || `Yuklashda xatolik (status ${xhr.status})`));
          }
        } catch (err) {
          reject(err instanceof Error ? err : new Error('Server javobini o\'qib bo\'lmadi'));
        }
      };
      xhr.onerror = () => reject(new Error('Tarmoq xatosi: faylni yuklab bo\'lmadi'));
      xhr.send(file);
    });
  });
}

export function recordViewCount(contentId: string, episodeId?: string): void {
  const all = getStoredContent();
  const item = all.find((c) => c.id === contentId);
  if (!item) return;
  item.viewsCount = (item.viewsCount || 0) + 1;
  if (episodeId && item.episodes) {
    const ep = item.episodes.find((e) => e.id === episodeId);
    if (ep) {
      ep.viewsCount = (ep.viewsCount || 0) + 1;
    }
  }
  setItem(KEYS.CONTENT, all);
}

export function recordContentRevenue(contentId: string, amount: number): void {
  const all = getStoredContent();
  const item = all.find((c) => c.id === contentId);
  if (!item) return;
  item.revenue = (item.revenue || 0) + amount;
  setItem(KEYS.CONTENT, all);
}

// 2. SETTINGS
export function getStoredSettings(): SystemSettings {
  const loaded = getItem<SystemSettings>(KEYS.SETTINGS, INITIAL_SETTINGS);
  
  // ═══ 4-MUAMMO: ADMINLIK BOSHQALARGA KO'RINMASLIGI KERAK ═══
  //
  // ESKI KOD har bir foydalanuvchining lokal sozlamalariga Bosh Admin
  // Telegram ID sini QATTIQ YOZILGAN holda qo'shib qo'yardi:
  //
  //   const superAdminIdx = existingAppointed.findIndex(a => a.id === '891846690');
  //   ... existingAppointed.push({ id: '891846690', ... })
  //
  // Ya'ni bu ID frontend bundle'ida ochiq yotardi va HAR BIR oddiy
  // foydalanuvchining localStorage'iga yozilardi — istalgan odam kimning
  // admin ekanini bilib olardi.
  //
  // Endi adminlar ro'yxati faqat SERVERDAN keladi va `/api/settings`
  // endpointi `auth + adminOnly` bilan himoyalangan, ya'ni oddiy
  // foydalanuvchi uni umuman ola olmaydi. Qattiq yozilgan ID olib tashlandi.
  // (Quyidagi eski blok ataylab bo'sh qoldirildi.)
  // Lokal keshda faqat serverdan kelgan (admin ko'rgan) ro'yxat bo'lishi
  // mumkin. Oddiy foydalanuvchida bu ro'yxat BO'SH bo'ladi — va shunday
  // bo'lishi kerak.
  const existingAppointed: AppointedAdmin[] = Array.isArray(loaded.appointedAdmins)
    ? loaded.appointedAdmins
    : [];

  // Ensure backward compatibility with newly added fields
  return {
    ...INITIAL_SETTINGS,
    ...loaded,
    botUsername: loaded.botUsername || loaded.telegramBotUsername || 'Manyaktvbot',
    telegramBotUsername: loaded.telegramBotUsername || loaded.botUsername || 'Manyaktvbot',
    // ESKI KOD: `... || '8918'` — sozlamada PIN o'rnatilmagan bo'lsa,
    // hamma o'rnatma uchun bir xil, kod ichida ochiq yozilgan PIN ishlardi
    // (AdminPanel esa uni xato xabarida to'g'ridan-to'g'ri aytib berardi).
    // Endi standart qiymat YO'Q: PIN o'rnatilmagan bo'lsa, xavfli amallar
    // uchun tasdiqlash o'tmaydi (fail-closed) va admin avval o'zining
    // PIN'ini o'rnatishi kerak.
    secondaryAdminPassword: loaded.secondaryAdminPassword || INITIAL_SETTINGS.secondaryAdminPassword || '',
    enabledPaymentMethods: {
      ...INITIAL_SETTINGS.enabledPaymentMethods!,
      ...(loaded.enabledPaymentMethods || {}),
    },
    catalogs: Array.isArray(loaded.catalogs) ? loaded.catalogs : INITIAL_SETTINGS.catalogs,
    appointedAdmins: existingAppointed,
    bannedUserIds: loaded.bannedUserIds || [],
    bannedDeviceTokens: loaded.bannedDeviceTokens || [],
  };
}

export function updateStoredSettings(updates: Partial<SystemSettings>): SystemSettings {
  const current = getStoredSettings();
  const merged: SystemSettings = { ...current, ...updates };
  setItem(KEYS.SETTINGS, merged);
  return merged;
}

// 2.0 AUDIT TRAIL LOGGING
export function getStoredAuditLogs(): AdminAuditLog[] {
  return getItem<AdminAuditLog[]>(KEYS.AUDIT_LOGS, []);
}

export function addAuditLog(entry: Omit<AdminAuditLog, 'id' | 'timestamp'>): AdminAuditLog {
  const logs = getStoredAuditLogs();
  const newLog: AdminAuditLog = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: new Date().toISOString(),
  };
  logs.unshift(newLog);
  // Keep up to 500 logs
  if (logs.length > 500) {
    logs.length = 500;
  }
  setItem(KEYS.AUDIT_LOGS, logs);
  return newLog;
}

// 2.1 DYNAMIC SCREEN CATALOGS MANAGEMENT
export function getStoredCatalogs(): CatalogCategory[] {
  const settings = getStoredSettings();
  return settings.catalogs || INITIAL_SETTINGS.catalogs;
}

export function saveStoredCatalog(catalog: CatalogCategory): void {
  const settings = getStoredSettings();
  const catalogs = [...settings.catalogs];
  const idx = catalogs.findIndex((c) => c.id === catalog.id);
  if (idx >= 0) {
    catalogs[idx] = catalog;
  } else {
    catalogs.push(catalog);
  }
  updateStoredSettings({ catalogs });
}

export function deleteStoredCatalog(id: string): void {
  const settings = getStoredSettings();
  const catalogs = settings.catalogs.filter((c) => c.id !== id);
  updateStoredSettings({ catalogs });
}

// 3. PLANS
export function getStoredPlans(): SubscriptionPlan[] {
  return getItem<SubscriptionPlan[]>(KEYS.PLANS, INITIAL_PLANS);
}

export function saveStoredPlan(plan: SubscriptionPlan): void {
  const all = getStoredPlans();
  const idx = all.findIndex((p) => p.id === plan.id);
  if (idx >= 0) {
    all[idx] = plan;
  } else {
    all.push(plan);
  }
  setItem(KEYS.PLANS, all);
}

export function deleteStoredPlan(id: string): void {
  const all = getStoredPlans().filter((p) => p.id !== id);
  setItem(KEYS.PLANS, all);
}

// 4. PROMO CODES
export function getStoredPromoCodes(): PromoCode[] {
  return getItem<PromoCode[]>(KEYS.PROMO_CODES, INITIAL_PROMO_CODES);
}

export function saveStoredPromoCode(promo: PromoCode): void {
  const all = getStoredPromoCodes();
  const idx = all.findIndex((p) => p.id === promo.id);
  if (idx >= 0) {
    all[idx] = promo;
  } else {
    all.push(promo);
  }
  setItem(KEYS.PROMO_CODES, all);
}

export function deleteStoredPromoCode(id: string): void {
  const all = getStoredPromoCodes().filter((p) => p.id !== id);
  setItem(KEYS.PROMO_CODES, all);
}

export function validatePromoCode(
  rawCode: string
): { valid: boolean; discountPercent: number; message: string } {
  const code = rawCode.trim().toUpperCase();
  const all = getStoredPromoCodes();
  const match = all.find((p) => p.code.toUpperCase() === code && p.isActive);

  if (!match) {
    return { valid: false, discountPercent: 0, message: 'Promokod topilmadi yoki yaroqsiz' };
  }

  if (match.usedCount >= match.maxUses) {
    return { valid: false, discountPercent: 0, message: 'Ushbu promokoddan foydalanish limiti tugagan' };
  }

  const expiry = new Date(match.expiresAt).getTime();
  if (Date.now() > expiry) {
    return { valid: false, discountPercent: 0, message: 'Promokod muddati o\'tib ketgan' };
  }

  return {
    valid: true,
    discountPercent: match.discountPercent,
    message: `${match.discountPercent}% chegirma qo'llanildi!`,
  };
}

// 5. USERS DIRECTORY & MANAGEMENT
// ═══ 4-MUAMMO: DEMO ADMIN VA DEMO FOYDALANUVCHILAR OLIB TASHLANDI ═══
//
// ESKI KOD bu yerda 3 ta soxta foydalanuvchini, jumladan
//   { id: '891846690', firstName: 'Admin (891846690)', isVip: true, ... }
// ni saqlab turardi va u `KEYS.USERS` uchun ZAXIRA qiymat edi. Ya'ni
// har bir ODDIY foydalanuvchining brauzerida "kim admin ekani" ko'rinib
// turardi (ID, username, telefon raqami bilan). Bu talabga zid:
// "oddiy foydalanuvchilarga boshqa birovning admin ekanligi hech qanday
// joyda ko'rinmasligi kerak".
//
// Foydalanuvchilar ro'yxati endi FAQAT serverdan keladi va
// `GET /api/users` `auth + adminOnly` bilan himoyalangan.
const INITIAL_USERS: UserProfile[] = [];

export function getStoredUsers(): UserProfile[] {
  const users = getItem<UserProfile[]>(KEYS.USERS, INITIAL_USERS);
  // Ensure current user is present
  const current = getItem<UserProfile | null>(KEYS.CURRENT_USER, null);
  if (current) {
    const idx = users.findIndex((u) => u.id === current.id);
    if (idx >= 0) {
      users[idx] = { ...users[idx], ...current };
    } else {
      users.unshift(current);
    }
  }
  return users;
}

export function saveStoredUser(user: UserProfile): void {
  const all = getStoredUsers();
  const idx = all.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    all[idx] = user;
  } else {
    all.unshift(user);
  }
  setItem(KEYS.USERS, all);

  // If this user is also current user, update current user too
  const current = getItem<UserProfile | null>(KEYS.CURRENT_USER, null);
  if (current && current.id === user.id) {
    setItem(KEYS.CURRENT_USER, user);
  }
}

export function findUserById(userId: string): UserProfile | undefined {
  const all = getStoredUsers();
  return all.find((u) => u.id === userId.trim());
}

// Auto-Revocation: Check and expire subscription if duration is over
export function checkAndExpireSubscriptions(): boolean {
  let changed = false;
  const now = Date.now();

  // 1. Check all users in storage
  const allUsers = getItem<UserProfile[]>(KEYS.USERS, INITIAL_USERS);
  let allUsersChanged = false;
  allUsers.forEach((u) => {
    if (u.isVip && u.vipExpiresAt) {
      const expTime = new Date(u.vipExpiresAt).getTime();
      if (!isNaN(expTime) && expTime <= now) {
        u.isVip = false;
        allUsersChanged = true;
      }
    }
  });
  if (allUsersChanged) {
    setItem(KEYS.USERS, allUsers);
    changed = true;
  }

  // 2. Check current user in storage
  const currentUser = getItem<UserProfile | null>(KEYS.CURRENT_USER, null);
  if (currentUser && currentUser.isVip && currentUser.vipExpiresAt) {
    const expTime = new Date(currentUser.vipExpiresAt).getTime();
    if (!isNaN(expTime) && expTime <= now) {
      currentUser.isVip = false;
      setItem(KEYS.CURRENT_USER, currentUser);
      changed = true;
    }
  }

  return changed;
}

// Grant VIP to any user by Telegram ID
export function grantUserVip(userId: string, days: number): UserProfile | null {
  const all = getStoredUsers();
  let user = all.find((u) => u.id === userId);

  if (!user) {
    // Create new user profile if not exists yet
    user = {
      id: userId,
      firstName: `Foydalanuvchi #${userId}`,
      isPhoneVerified: false,
      isVip: true,
      purchasedContentIds: [],
      favorites: [],
      createdAt: new Date().toISOString(),
    };
    all.unshift(user);
  }

  const currentExp = user.vipExpiresAt && new Date(user.vipExpiresAt).getTime() > Date.now()
    ? new Date(user.vipExpiresAt).getTime()
    : Date.now();

  user.isVip = true;
  user.vipExpiresAt = new Date(currentExp + days * 24 * 60 * 60 * 1000).toISOString();
  saveStoredUser(user);

  // Also update current user if matches
  const current = getItem<UserProfile | null>(KEYS.CURRENT_USER, null);
  if (current && current.id === userId) {
    current.isVip = true;
    current.vipExpiresAt = user.vipExpiresAt;
    saveStoredCurrentUser(current);
  }

  return user;
}

// Revoke VIP from user
export function revokeUserVip(userId: string): void {
  const all = getStoredUsers();
  const user = all.find((u) => u.id === userId);
  if (user) {
    user.isVip = false;
    user.vipExpiresAt = undefined;
    saveStoredUser(user);
  }
  const current = getItem<UserProfile | null>(KEYS.CURRENT_USER, null);
  if (current && current.id === userId) {
    current.isVip = false;
    current.vipExpiresAt = undefined;
    saveStoredCurrentUser(current);
  }
}

// Block / Unblock Telegram ID
export function toggleUserBan(userId: string, ban: boolean, reason?: string): void {
  const settings = getStoredSettings();
  let bannedIds = [...settings.bannedUserIds];

  if (ban) {
    if (!bannedIds.includes(userId)) bannedIds.push(userId);
  } else {
    bannedIds = bannedIds.filter((id) => id !== userId);
  }

  updateStoredSettings({ bannedUserIds: bannedIds });

  // Update user profile record
  const all = getStoredUsers();
  const user = all.find((u) => u.id === userId);
  if (user) {
    user.isBanned = ban;
    user.banReason = ban ? (reason || 'Admin tomonidan bloklandi') : undefined;
    saveStoredUser(user);
  }
}

// Block / Unblock Hardware Device Token (Blocks all accounts on this device)
export function toggleDeviceBan(deviceToken: string, ban: boolean): void {
  const settings = getStoredSettings();
  let bannedTokens = [...settings.bannedDeviceTokens];

  if (ban) {
    if (!bannedTokens.includes(deviceToken)) bannedTokens.push(deviceToken);
  } else {
    bannedTokens = bannedTokens.filter((token) => token !== deviceToken);
  }

  updateStoredSettings({ bannedDeviceTokens: bannedTokens });

  // Mark in users that have this deviceToken
  const all = getStoredUsers();
  all.forEach((u) => {
    if (u.deviceToken === deviceToken) {
      u.isDeviceBanned = ban;
    }
  });
  setItem(KEYS.USERS, all);

  // If current user device was banned, update current user
  const current = getItem<UserProfile | null>(KEYS.CURRENT_USER, null);
  if (current && current.deviceToken === deviceToken) {
    current.isDeviceBanned = ban;
    setItem(KEYS.CURRENT_USER, current);
  }
}

// 6. CURRENT USER
export function getStoredCurrentUser(): UserProfile {
  // Proactively check and revoke any expired subscriptions first
  checkAndExpireSubscriptions();

  const currentChars = collectDeviceCharacteristics();
  const currentHwid = getOrCreateDeviceFingerprint();

  // Check if Telegram WebApp user is present in window
  const tgUser = (
    window as unknown as {
      Telegram?: {
        WebApp?: {
          initDataUnsafe?: {
            user?: { id: number; first_name: string; last_name?: string; username?: string };
          };
        };
      };
    }
  ).Telegram?.WebApp?.initDataUnsafe?.user;

  const tgUserId = tgUser ? String(tgUser.id) : null;
  const stored = getItem<UserProfile | null>(KEYS.CURRENT_USER, null);

  // If opened via Telegram WebApp with a real Telegram user:
  if (tgUserId) {
    if (!stored || stored.id !== tgUserId) {
      const allUsers = getStoredUsers();
      const existing = allUsers.find((u) => u.id === tgUserId);
      const isAutoAdmin = isUserAdmin(tgUserId);

      const activeUser: UserProfile = existing
        ? {
            ...existing,
            firstName: tgUser.first_name || existing.firstName,
            lastName: tgUser.last_name || existing.lastName,
            username: tgUser.username || existing.username,
          }
        : {
            id: tgUserId,
            firstName: tgUser.first_name || `Foydalanuvchi #${tgUserId}`,
            lastName: tgUser.last_name || '',
            username: tgUser.username || '',
            phone: undefined,
            isPhoneVerified: false,
            // ESKI KOD: `isVip: isAutoAdmin` va 365 kunlik `vipExpiresAt` —
            // ya'ni klient yangi profil yaratayotganda O'ZIGA VIP berardi.
            // Entitlement endi FAQAT serverdan keladi
            // (`syncEntitlementsFromServer`), shuning uchun bu yerda
            // hech qanday huquq berilmaydi. Agar bu foydalanuvchi haqiqatan
            // admin bo'lsa, server `/api/auth/verify` da uni VIP qilib
            // yaratadi va keyingi sinxronlashda kesh ham yangilanadi.
            isVip: false,
            vipExpiresAt: undefined,
            purchasedContentIds: [],
            favorites: [],
            deviceToken: currentHwid,
            createdAt: new Date().toISOString(),
            lastLoginAt: new Date().toISOString(),
          };

      bindUserToCurrentDevice(activeUser);
      setItem(KEYS.CURRENT_USER, activeUser, false);
      return activeUser;
    }
  }

  // XAVFSIZLIK TUZATILDI: avval shu yerda "agar ilova Telegram tashqarisida
  // (masalan oddiy brauzerda) ochilsa, foydalanuvchini avtomatik ravishda
  // Bosh Admin (to'liq VIP + admin huquqi) qilib kiritish" degan ATAYLAB
  // qo'yilgan (AI Studio'da sinash uchun) qoida bor edi. Bu degani — hech
  // qanday Telegram tasdiqlashisiz, saytni brauzerda to'g'ridan-to'g'ri
  // ochgan ISTALGAN odam avtomatik ravishda Bosh Admin bo'lib qolardi.
  // Bu — ilovadagi ENG XAVFLI zaiflik edi. Endi Telegram tashqarisida
  // ochilganda ham foydalanuvchi oddiy, huquqsiz mehmon (guest) sifatida
  // pastdagi standart oqimga o'tadi — hech kimga avtomatik admin/VIP
  // berilmaydi.
  // XAVFSIZLIK: agar ushbu qurilmada ILGARI (yuqoridagi endi olib tashlangan
  // xato tufayli) soxta "891846690" (Bosh Admin) profili localStorage'ga
  // yozib qo'yilgan bo'lsa-yu, lekin bu safar Telegram orqali haqiqiy shu ID
  // bilan tasdiqlanmagan bo'lsa — bunday "zaharlangan" sessiyaga ishonmaymiz
  // va uni pastdagi oddiy mehmon oqimiga qaytaramiz.
  // Ilgari bu yerda qattiq yozilgan '891846690' bilan taqqoslanardi (ya'ni
  // bosh admin ID si bundle'da oshkor bo'lardi). Endi ID kerak emas:
  // Telegram tashqarisida ochilgan sessiya ADMIN huquqiga ega bo'lib
  // ko'rinsa — u ishonchsiz, chunki adminlik faqat server tasdiqlashi
  // bilan beriladi.
  const poisonedStoredSession = !tgUserId && Boolean(stored?.isVip) && !stored?.isPhoneVerified;
  if (poisonedStoredSession) {
    try {
      localStorage.removeItem(KEYS.CURRENT_USER);
    } catch (err) {
      console.error('Error clearing poisoned session:', err);
    }
  }

  if (stored && !poisonedStoredSession) {
    // Check HWID binding
    if (stored.hwidBinding) {
      const deviation = evaluateDeviceDeviation(stored.hwidBinding.characteristics, currentChars);
      if (!deviation.isSignificantDeviation) {
        // Legitimate access on the bound device: update verification timestamp & login stats
        stored.hwidBinding.lastVerifiedAt = new Date().toISOString();
        stored.hwidBinding.loginCount = (stored.hwidBinding.loginCount || 1) + 1;
        stored.deviceToken = currentHwid;
        stored.lastLoginAt = new Date().toISOString();
        setItem(KEYS.CURRENT_USER, stored, false);
      }
      // Note: If significant deviation is detected, we do NOT overwrite stored.hwidBinding or deviceToken.
      // This ensures checkAccessSecurity will strictly catch and block the unauthorized device!
    } else {
      // First session or after reset: bind account to current device
      bindUserToCurrentDevice(stored);
      setItem(KEYS.CURRENT_USER, stored, false);
    }

    // Check if stored VIP has expired
    if (stored.isVip && stored.vipExpiresAt) {
      const expTime = new Date(stored.vipExpiresAt).getTime();
      if (!isNaN(expTime) && expTime <= Date.now()) {
        stored.isVip = false;
        setItem(KEYS.CURRENT_USER, stored);
      }
    }
    return stored;
  }

  // Default initial guest session for new visitors (NOT ADMIN by default)
  const guestId = 'user_' + currentHwid.slice(-6).toLowerCase();
  const fallback: UserProfile = {
    id: guestId,
    firstName: 'Foydalanuvchi',
    lastName: '',
    username: '',
    phone: undefined,
    isPhoneVerified: false,
    isVip: false,
    purchasedContentIds: [],
    favorites: ['m-parijdagi-akula'],
    deviceToken: currentHwid,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };

  bindUserToCurrentDevice(fallback);

  setItem(KEYS.CURRENT_USER, fallback, false);
  return fallback;
}

export function saveStoredCurrentUser(user: UserProfile): void {
  setItem(KEYS.CURRENT_USER, user);
  // Also sync to all users directory
  const all = getItem<UserProfile[]>(KEYS.USERS, INITIAL_USERS);
  const idx = all.findIndex((u) => u.id === user.id);
  if (idx >= 0) {
    all[idx] = { ...all[idx], ...user };
  } else {
    all.unshift(user);
  }
  setItem(KEYS.USERS, all);
  // Broadcast update event
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('manyak_storage_update'));
  }
}

// ═══════════════════════════════════════════════════════════════════════════
//  OLIB TASHLANGAN: verifyUserPhone() va verifyUserViaBot()
// ═══════════════════════════════════════════════════════════════════════════
//
// Bu ikki funksiya `isPhoneVerified = true` ni KLIENT tomonida
// localStorage'ga yozardi:
//
//     export function verifyUserPhone(phone: string): UserProfile {
//       const user = getStoredCurrentUser();
//       user.phone = phone;
//       user.isPhoneVerified = true;   // <- hech qanday tekshiruvsiz
//       saveStoredCurrentUser(user);
//       return user;
//     }
//
// Uch nuqson bor edi:
//   1) hech qanday haqiqiy tasdiqlash yo'q — istalgan raqam yozilardi;
//   2) `verifyUserViaBot` hatto `TG_<id>` degan SOXTA raqam yozardi;
//   3) `isPhoneVerified` serverda `SERVER_OWNED_USER_FIELDS` ro'yxatida,
//      shuning uchun `/api/sync-user` klient qiymatini server qiymati bilan
//      QAYTA YOZARDI — ya'ni "tasdiqlash" keyingi sinxronlashda yo'qolardi
//      va modal yana ochilardi.
//
// Tasdiqlash endi FAQAT Telegram bot orqali, server tomonida bo'ladi
// (qarang: server.js `handleContactVerification` va
// `src/components/TelegramVerificationModal.tsx`).

/**
 * Bot orqali tasdiqlash muvaffaqiyatli bo'lgandan keyin serverdan kelgan
 * profilni lokal keshga yozadi.
 *
 * MUHIM: bu funksiya hech narsani "tasdiqlamaydi" — u faqat SERVER
 * tasdiqlagan natijani keshlaydi. Foydalanuvchi ID si serverdan keladi va
 * u har doim Telegram ID ga teng.
 */
export function applyVerifiedSession(serverUser: UserProfile): UserProfile {
  const stored = getItem<UserProfile | null>(KEYS.CURRENT_USER, null);

  // Qurilmaga bog'lash (HWID) va boshqa lokal maydonlarni saqlab qolamiz,
  // lekin identifikator va tasdiqlash holatini SERVERDAN olamiz.
  const merged: UserProfile = {
    ...(stored && stored.id === serverUser.id ? stored : {}),
    ...serverUser,
  };

  // Yangi Telegram identifikatoriga o'tilgan bo'lsa (masalan avval mehmon
  // sessiyasi bo'lgan), qurilma bog'lanishini shu profil uchun yangilaymiz.
  if (!merged.hwidBinding) {
    bindUserToCurrentDevice(merged);
  }

  setItem(KEYS.CURRENT_USER, merged, false);
  saveStoredUser(merged);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('manyak_storage_update'));
  }

  return merged;
}

export function switchUserProfile(telegramId: string, firstName: string, username?: string): UserProfile {
  const isAdminId = isUserAdmin(telegramId);
  const currentHwid = getOrCreateDeviceFingerprint();
  const all = getStoredUsers();
  const existing = all.find((u) => u.id === telegramId);

  let newUser: UserProfile;
  if (existing) {
    newUser = { ...existing };
  } else {
    newUser = {
      id: telegramId,
      firstName: firstName || `Foydalanuvchi #${telegramId}`,
      username: username || '',
      // ESKI KOD adminlar uchun bu yerda soxta telefon (`+998901234567`),
      // `isPhoneVerified: true`, `isVip: true` va 60 kunlik muddat berardi.
      // Bularning barchasi entitlement — endi faqat serverdan keladi.
      phone: undefined,
      isPhoneVerified: false,
      isVip: false,
      vipExpiresAt: undefined,
      purchasedContentIds: [],
      favorites: ['m-parijdagi-akula'],
      deviceToken: currentHwid,
      createdAt: new Date().toISOString(),
      lastLoginAt: new Date().toISOString(),
    };
    bindUserToCurrentDevice(newUser);
  }
  saveStoredCurrentUser(newUser);
  return newUser;
}

/**
 * Foydalanuvchini Telegram profili orqali tasdiqlaydi.
 *
 * ═══ OLIB TASHLANGAN XAVFSIZLIK TESHIGI ═══
 *
 * ESKI KOD adminlikni foydalanuvchi KIRITGAN MATNNI tenglashtirish bilan
 * berardi:
 *
 *   const isPrimaryAdmin = cleanInput === '891846690'
 *                       || cleanInput.toLowerCase() === 'manyak_admin';
 *   if (isAdmin) {
 *     localStorage.setItem('manyak_allow_pc_admin', 'true');
 *     const adminUser = switchUserProfile(adminId, 'Bosh Admin (891846690)', ...);
 *     adminUser.isVip = true;                 // <- bepul VIP
 *     saveStoredCurrentUser(adminUser);       // <- admin profili localStorage'ga
 *   }
 *
 * Ya'ni oynaga "891846690" deb yozish yetarli edi: hech qanday Telegram
 * tasdiqlashi (initData HMAC) yo'q, hech qanday parol yo'q. Foydalanuvchi
 * bir zumda Bosh Admin + VIP bo'lardi. `manyak_allow_pc_admin` esa
 * brauzerdagi oddiy `true` satri — u ham avtorizatsiya sifatida
 * ishlatilardi.
 *
 * ENDI: bu funksiya HECH KIMGA adminlik yoki VIP BERMAYDI. Adminlik faqat
 * serverdan (Telegram initData HMAC tekshiruvidan o'tgan JWT `isAdmin`
 * claim'i) keladi — qarang `syncEntitlementsFromServer()` va `isUserAdmin()`.
 * Bu funksiya faqat profilni almashtiradi va telefonni belgilaydi.
 */
export function verifyTelegramProfileAndAuthorize(
  telegramIdOrPhone: string,
  extra?: { firstName?: string; username?: string; phone?: string }
): { success: boolean; isAdmin: boolean; message: string; user: UserProfile } {
  const cleanInput = telegramIdOrPhone.trim().replace(/^@/, '');

  // Regular user verification
  const current = getStoredCurrentUser();
  const userId = cleanInput.match(/^\d+$/) ? cleanInput : current.id;
  const user = switchUserProfile(
    userId,
    extra?.firstName || current.firstName,
    extra?.username || current.username
  );
  user.isPhoneVerified = true;
  if (extra?.phone) {
    user.phone = extra.phone;
  } else if (!user.phone) {
    user.phone = cleanInput.startsWith('+') ? cleanInput : `TG_${cleanInput}`;
  }
  saveStoredCurrentUser(user);

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('manyak_storage_update'));
  }

  return {
    success: true,
    // Adminlik BU YERDA aniqlanmaydi — server tasdiqlaydi. Agar shu
    // foydalanuvchi haqiqatan admin bo'lsa, `syncEntitlementsFromServer()`
    // buni aniqlaydi va admin paneli avtomatik ochiladi.
    isAdmin: false,
    message: `Telegram profilingiz muvaffaqiyatli tasdiqlandi! @${getStoredSettings().botUsername || 'Manyaktvbot'} orqali kinolarni to'liq tomosha qilishingiz mumkin.`,
    user,
  };
}

// Reset HWID binding for a user in storage (Allows user to bind a new device)
export function resetUserHWIDBindingInStorage(userId: string): boolean {
  const allUsers = getStoredUsers();
  const target = allUsers.find((u) => u.id === userId);
  if (target) {
    target.hwidBinding = undefined;
    target.deviceToken = undefined;
    saveStoredUser(target);
  }
  const current = getItem<UserProfile | null>(KEYS.CURRENT_USER, null);
  if (current && current.id === userId) {
    current.hwidBinding = undefined;
    current.deviceToken = undefined;
    saveStoredCurrentUser(current);
  }
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('manyak_storage_update'));
  }
  return true;
}

// ═══ 4-MUAMMO: BOSH ADMIN ID SI BUNDLE'DA QATTIQ YOZILGAN EDI ═══
//
// ESKI KOD: `export const SUPER_ADMIN_ID = '891846690';`
// Bu qiymat frontend build ichida ochiq matnda yotardi, ya'ni saytni
// ochgan istalgan odam platforma egasining Telegram ID sini bilib olardi.
//
// Endi bu qiymat SERVERDAN keladi (`/api/me/entitlements` -> `superAdminId`)
// va server uni FAQAT adminning o'ziga qaytaradi. Oddiy foydalanuvchida
// bu bo'sh satr bo'lib qoladi — uning interfeysida hech qanday admin
// ma'lumoti ko'rinmaydi.
let runtimeSuperAdminId = '';

/**
 * Serverdan tasdiqlangan bosh admin ID si (admin bo'lmaganlar uchun `''`).
 * Faqat admin panel interfeysi uchun ishlatiladi; haqiqiy huquq tekshiruvi
 * har doim serverda bo'ladi.
 */
export function getSuperAdminId(): string {
  return runtimeSuperAdminId;
}

export const FULL_ADMIN_PERMISSIONS: AdminPermissions = {
  canAddContent: true,
  canEditContent: true,
  canDeleteContent: true,
  canManageUsers: true,
  canManageCatalogs: true,
  canManageReceipts: true,
  canManagePlans: true,
  canManagePromoCodes: true,
  canBroadcast: true,
  canViewStats: true,
  canManageSettings: true,
  canManageAdmins: true,
};

export const DEFAULT_SUB_ADMIN_PERMISSIONS: AdminPermissions = {
  canAddContent: true,
  canEditContent: true,
  canDeleteContent: false, // sub-admins cannot delete content by default
  canManageUsers: false,
  canManageCatalogs: false,
  canManageReceipts: false,
  canManagePlans: false,
  canManagePromoCodes: false,
  canBroadcast: false,
  canViewStats: false,
  canManageSettings: false,
  canManageAdmins: false,
};

// ═══════════════════════════════════════════════════════════════════════════
//  ADMINLIK — SERVER TOMONIDAN TASDIQLANADI
// ═══════════════════════════════════════════════════════════════════════════
//
// ESKI KOD adminlikni FAQAT localStorage'dagi sozlamalardan aniqlardi:
//     if (cleanId === SUPER_ADMIN_ID) return FULL_ADMIN_PERMISSIONS;
//     const appointed = settings.appointedAdmins.find(...)
//     const adminIds = settings.adminTelegramIds ...
//
// Ikkisi ham foydalanuvchi tahrirlay oladigan ma'lumot edi. Buni
// `switchUserProfile('891846690')` (ProfileView'dagi test tugmasi) yoki
// oddiy konsol buyrug'i bilan birlashtirsangiz — istalgan odam admin
// panelini ochib, localStorage'dagi kontent/foydalanuvchi/sozlamalarni
// o'zgartira olardi.
//
// ENDI: adminlik faqat SERVER tasdiqlagan JWT da `isAdmin: true` bo'lsa
// beriladi (server buni Telegram initData HMAC tekshiruvidan keyin
// `Admins.isAdmin()` orqali aniqlaydi — bu qiymatni soxtalashtirib
// bo'lmaydi). localStorage'dagi sozlamalar endi faqat GRANULAR huquqlarni
// (qaysi bo'lim ko'rinadi) belgilash uchun ishlatiladi — ya'ni allaqachon
// server tasdiqlagan adminning huquqlarini TORAYTIRISHI mumkin, lekin
// hech kimga adminlik BERA OLMAYDI.

/** Serverdan tasdiqlangan admin foydalanuvchi ID si (JWT `isAdmin` claim). */
let serverVerifiedAdminId: string | null = null;
/** Serverdan tasdiqlangan super admin ID si. */
let serverVerifiedSuperAdminId: string | null = null;

/**
 * `syncEntitlementsFromServer()` dan chaqiriladi — server JWT dagi
 * `isAdmin` claim asosida adminlikni belgilaydi.
 */
function setServerVerifiedAdmin(userId: string, isAdmin: boolean, isSuperAdmin = false): void {
  const id = String(userId).trim();
  serverVerifiedAdminId = isAdmin ? id : null;
  serverVerifiedSuperAdminId = isAdmin && isSuperAdmin ? id : null;
}

/** Server hali javob bermaganini tekshirish uchun (UI "yuklanmoqda" holati). */
export function isAdminStatusVerified(): boolean {
  return serverVerifiedAdminId !== null;
}

export function isUserSuperAdmin(userId?: string): boolean {
  if (!userId) return false;
  if (!serverVerifiedSuperAdminId) return false;
  return serverVerifiedSuperAdminId === String(userId).trim();
}

export function isUserAdmin(userId?: string): boolean {
  if (!userId) return false;
  if (!serverVerifiedAdminId) return false;
  return serverVerifiedAdminId === String(userId).trim();
}

export function getUserAdminPermissions(userId?: string): AdminPermissions | null {
  if (!userId) return null;
  const cleanId = String(userId).trim();

  // 1-QADAM (majburiy): server bu foydalanuvchini admin deb tasdiqladimi?
  if (!isUserAdmin(cleanId)) return null;

  // 2-QADAM: granular huquqlar. Bu yerda faqat huquqlarni TORAYTIRISH
  // mumkin — adminlikning o'zi allaqachon yuqorida tasdiqlangan.
  if (isUserSuperAdmin(cleanId)) {
    return { ...FULL_ADMIN_PERMISSIONS };
  }

  const settings = getStoredSettings();
  const appointed = (settings.appointedAdmins || []).find((a) => a.id === cleanId);
  if (appointed) {
    return appointed.permissions;
  }

  // Server admin deb tasdiqladi, lekin lokal sozlamalarda granular yozuv
  // yo'q — ehtiyotkorlik uchun eng kam huquqlar beriladi.
  return { ...DEFAULT_SUB_ADMIN_PERMISSIONS };
}

export function getAppointedAdmins(): AppointedAdmin[] {
  const settings = getStoredSettings();
  return settings.appointedAdmins || [];
}

export function saveAppointedAdmin(
  adminData: {
    id: string;
    name: string;
    username?: string;
    roleTitle: string;
    permissions: AdminPermissions;
  },
  operatorId: string = getSuperAdminId()
): { success: boolean; message: string; admin?: AppointedAdmin } {
  const cleanId = String(adminData.id).trim();
  if (!cleanId) {
    return { success: false, message: "Telegram ID kiritilishi shart!" };
  }

  // Check operator rights - only Super Admin or admins with canManageAdmins can appoint/edit admins
  const operatorPerms = getUserAdminPermissions(operatorId);
  if (!operatorPerms || (!operatorPerms.canManageAdmins && !isUserSuperAdmin(operatorId))) {
    return { success: false, message: "Adminlarni faqat Bosh Admin tayinlashi yoki o'zgartirishi mumkin!" };
  }

  const settings = getStoredSettings();
  const currentList = [...(settings.appointedAdmins || [])];
  const existingIdx = currentList.findIndex((a) => a.id === cleanId);

  const isSuper = isUserSuperAdmin(cleanId);
  const permissions: AdminPermissions = isSuper ? { ...FULL_ADMIN_PERMISSIONS } : adminData.permissions;

  const updatedAdmin: AppointedAdmin = {
    id: cleanId,
    name: adminData.name || `Admin #${cleanId}`,
    username: adminData.username?.replace('@', '') || '',
    roleTitle: isSuper ? "👑 Bosh Admin (To'liq huquq)" : (adminData.roleTitle || 'Yordamchi Admin'),
    isSuperAdmin: isSuper,
    permissions,
    appointedAt: existingIdx >= 0 ? currentList[existingIdx].appointedAt : new Date().toISOString(),
    appointedBy: isUserSuperAdmin(operatorId) ? 'Bosh Admin' : `Admin #${operatorId}`,
  };

  if (existingIdx >= 0) {
    currentList[existingIdx] = updatedAdmin;
  } else {
    currentList.push(updatedAdmin);
  }

  // Also sync with adminTelegramIds
  const adminIds = new Set(settings.adminTelegramIds || []);
  adminIds.add(cleanId);
  if (getSuperAdminId()) adminIds.add(getSuperAdminId());

  updateStoredSettings({
    appointedAdmins: currentList,
    adminTelegramIds: Array.from(adminIds),
  });

  addAuditLog({
    adminId: operatorId,
    adminName: isUserSuperAdmin(operatorId) ? 'Bosh Admin' : 'Admin',
    targetType: 'ADMIN_ROLE',
    targetId: cleanId,
    targetTitle: updatedAdmin.name,
    action: existingIdx >= 0 ? 'UPDATE_ADMIN_PERMISSIONS' : 'APPOINT_ADMIN',
    details: `${updatedAdmin.name} (${cleanId}) uchun "${updatedAdmin.roleTitle}" roli va huquqlari belgilandi.`,
    secondaryAuthPassed: true,
  });

  return {
    success: true,
    message: `"${updatedAdmin.name}" (${cleanId}) muvaffaqiyatli saqlandi!`,
    admin: updatedAdmin,
  };
}

export function removeAppointedAdmin(
  adminId: string,
  operatorId: string = getSuperAdminId()
): { success: boolean; message: string } {
  const cleanId = String(adminId).trim();
  if (isUserSuperAdmin(cleanId)) {
    return { success: false, message: "Bosh Adminni o'chirib bo'lmaydi!" };
  }

  // Check operator rights
  const operatorPerms = getUserAdminPermissions(operatorId);
  if (!operatorPerms || (!operatorPerms.canManageAdmins && !isUserSuperAdmin(operatorId))) {
    return { success: false, message: "Adminlarni faqat Bosh Admin o'chira oladi!" };
  }

  const settings = getStoredSettings();
  const currentList = (settings.appointedAdmins || []).filter((a) => a.id !== cleanId);
  const adminIds = (settings.adminTelegramIds || []).filter((id) => id !== cleanId);

  updateStoredSettings({
    appointedAdmins: currentList,
    adminTelegramIds: adminIds,
  });

  addAuditLog({
    adminId: operatorId,
    adminName: isUserSuperAdmin(operatorId) ? 'Bosh Admin' : 'Admin',
    targetType: 'ADMIN_ROLE',
    targetId: cleanId,
    targetTitle: cleanId,
    action: 'REMOVE_ADMIN',
    details: `Admin ID ${cleanId} adminlar safidan chiqarildi.`,
    secondaryAuthPassed: true,
  });

  return {
    success: true,
    message: `Admin (ID: ${cleanId}) muvaffaqiyatli o'chirildi!`,
  };
}

export function checkHasAccess(user: UserProfile, content: ContentItem, episode?: { isFree?: boolean; id?: string }): boolean {
  // Super Admin has zero restrictions anywhere in the entire system
  if (isUserSuperAdmin(user.id)) return true;

  // If content is completely free
  if (!content.isPremium && (!episode || episode.isFree) && (!content.price || content.price === 0)) return true;

  // If specific episode is free
  if (episode && episode.isFree) return true;

  // Token-based single episode unlock check:
  // 1 ta token butun serialni emas, faqat foydalanuvchi ochgan 1 ta qismni ochadi!
  if (episode && episode.id && user.unlockedEpisodeIds) {
    const epTokenKey = `${content.id}:${episode.id}`;
    if (user.unlockedEpisodeIds.includes(epTokenKey) || user.unlockedEpisodeIds.includes(episode.id)) {
      return true; // Faqat va faqat shu qism ochilgan!
    }
  }

  // Single purchased content access (bought individually via 'Buy Now' workflow for the whole movie/series)
  if (user.purchasedContentIds && user.purchasedContentIds.includes(content.id)) {
    return true;
  }

  // VIP plan inclusion check:
  // If content is NOT part of a VIP plan (isVipIncluded === false), standard VIP plan does NOT unlock it!
  const isVipPlanIncluded = content.isVipIncluded !== false;

  if (isVipPlanIncluded && user.isVip) {
    // If no expiration date set, permanent VIP
    if (!user.vipExpiresAt) return true;

    const expires = new Date(user.vipExpiresAt).getTime();
    // ═══ TUZATILDI: BU FUNKSIYA RENDER PAYTIDA localStorage'GA YOZARDI ═══
    //
    // ESKI KOD muddat o'tgan bo'lsa shu yerda:
    //     user.isVip = false;              // <- prop obyektini MUTATSIYA qiladi
    //     saveStoredCurrentUser(user);     // <- setItem -> 'manyak_storage_update'
    //                                      //    -> App.refreshData() -> setState
    //
    // `checkHasAccess` esa HomeView, SearchView, ShortsFeed va
    // VideoPlayerModal'ning RENDER TANASIDAN chaqiriladi. Ya'ni render
    // paytida global holat o'zgartirilib, React'da qayta render zanjiri
    // (ba'zi hollarda cheksiz tsikl) yuzaga kelardi.
    //
    // Endi bu funksiya SOF (pure): faqat o'qiydi va hisoblaydi. Muddati
    // o'tgan obunani yopish serverning ishi (`Users.expireSubscriptions`
    // har soatda + `/api/me/entitlements` har so'rovda) va u
    // `syncEntitlementsFromServer()` orqali keshga tushadi.
    if (!isNaN(expires) && expires > Date.now()) {
      return true;
    }
  }

  return false;
}

// 6. WATCH HISTORY
export function getStoredHistory(userId: string): WatchHistoryItem[] {
  const all = getItem<Record<string, WatchHistoryItem[]>>(KEYS.HISTORY, {});
  return all[userId] || [];
}

export function addWatchHistoryItem(
  userId: string,
  entry: Omit<WatchHistoryItem, 'id' | 'watchedAt'>
): void {
  const all = getItem<Record<string, WatchHistoryItem[]>>(KEYS.HISTORY, {});
  const userHistory = all[userId] || [];

  // Remove duplicate entry for same content/episode
  const filtered = userHistory.filter(
    (h) => !(h.contentId === entry.contentId && h.episodeId === entry.episodeId)
  );

  const newItem: WatchHistoryItem = {
    ...entry,
    id: `hist_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    watchedAt: new Date().toISOString(),
  };

  filtered.unshift(newItem);
  all[userId] = filtered.slice(0, 50); // keep last 50
  setItem(KEYS.HISTORY, all);
}

export function clearWatchHistory(userId: string): void {
  const all = getItem<Record<string, WatchHistoryItem[]>>(KEYS.HISTORY, {});
  all[userId] = [];
  setItem(KEYS.HISTORY, all);
}

// 7. RECEIPTS / PAYMENTS
// Demo cheklar ham olib tashlandi: ular boshqa odamlarning ismi, telefon
// raqami va to'lov summasini har bir klientning localStorage'iga yozardi.
// Cheklar faqat serverdan keladi (`GET /api/receipts`, admin himoyasi ostida).
const INITIAL_RECEIPTS: PaymentReceipt[] = [];

export function getStoredReceipts(): PaymentReceipt[] {
  return getItem<PaymentReceipt[]>(KEYS.RECEIPTS, INITIAL_RECEIPTS);
}

/**
 * Serverdagi chek qatorini (snake_case) frontend tipiga (camelCase) o'giradi.
 * Backend `receipts` jadvalini xom holda qaytaradi, frontend esa camelCase
 * `PaymentReceipt` tipini kutadi — mapping bo'lmasa UI maydonlarni o'qiy olmaydi.
 */
function receiptRowToClient(row: Record<string, unknown>): PaymentReceipt {
  return {
    id: String(row.id),
    userId: String(row.user_id ?? row.userId ?? ''),
    userName: String(row.user_name ?? row.userName ?? ''),
    userPhone: (row.user_phone ?? row.userPhone ?? undefined) as string | undefined,
    type: (row.type ?? 'vip_subscription') as PaymentReceipt['type'],
    planId: (row.plan_id ?? row.planId ?? undefined) as string | undefined,
    planName: (row.plan_name ?? row.planName ?? undefined) as string | undefined,
    contentId: (row.content_id ?? row.contentId ?? undefined) as string | undefined,
    contentTitle: (row.content_title ?? row.contentTitle ?? undefined) as string | undefined,
    amount: Number(row.amount ?? 0),
    discountApplied: Number(row.discount_applied ?? row.discountApplied ?? 0),
    promoCodeUsed: (row.promo_code_used ?? row.promoCodeUsed ?? undefined) as string | undefined,
    receiptImageUrl: String(row.receipt_image_url ?? row.receiptImageUrl ?? ''),
    notes: (row.notes ?? undefined) as string | undefined,
    status: (row.status ?? 'pending') as PaymentReceipt['status'],
    createdAt: String(row.created_at ?? row.createdAt ?? new Date().toISOString()),
    reviewedAt: (row.reviewed_at ?? row.reviewedAt ?? undefined) as string | undefined,
    reviewedBy: (row.reviewed_by ?? row.reviewedBy ?? undefined) as string | undefined,
  };
}

/**
 * To'lov chekini yuboradi.
 *
 * ═══ QAYTA YOZILDI: SERVER BIRINCHI, KESH KEYIN ═══
 *
 * ESKI KOD localStorage'ga yozib, keyin serverga "otib yuborardi"
 * (fire-and-forget) va natijani KUTMASDAN chekni qaytarardi:
 *
 *   all.unshift(newReceipt);
 *   setItem(KEYS.RECEIPTS, all);              // <- kvota tugasa jimgina yiqiladi
 *   getAuthHeaders().then(() => fetch('/api/sync-receipt', ...).catch(console.error));
 *   return newReceipt;                        // <- doim "muvaffaqiyat"
 *
 * Oqibatlari:
 *  - chek rasmi base64 bo'lgani uchun `setItem` localStorage kvotasini yorib,
 *    yozuv SAQLANMAY qolardi — lekin funksiya baribir chekni qaytarardi va
 *    UI "yuborildi" deb ko'rsatardi;
 *  - server so'rovi 401/500 bo'lsa ham foydalanuvchi buni bilmasdi;
 *  - chek `id` si klientda yaratilardi, ya'ni ikki qurilma bir xil id
 *    yaratishi (yoki foydalanuvchi id ni o'zi tanlashi) mumkin edi.
 *
 * Endi: chek AVVAL serverga yoziladi (id ham serverda yaratiladi), va faqat
 * muvaffaqiyatdan keyin localStorage keshiga qo'shiladi. Xato bo'lsa
 * `throw` qiladi — chaqiruvchi (PaymentModal) foydalanuvchiga ko'rsatadi.
 */
export async function submitPaymentReceipt(
  receiptData: Omit<PaymentReceipt, 'id' | 'createdAt' | 'status'>
): Promise<PaymentReceipt> {
  const authHeaders = await getAuthHeaders();

  // Telegram tashqarisida token bo'lmaydi — bu holda chekni yuborish
  // MUMKIN EMAS. Ilgari so'rov baribir yuborilib, server 401 qaytarardi va
  // xato `console.error` da qolardi.
  if (!authHeaders.Authorization) {
    throw new Error(
      "Tizimga kirilmagan. Chek yuborish uchun ilovani Telegram bot orqali ochishingiz kerak."
    );
  }

  let res: Response;
  try {
    res = await fetch('/api/receipts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify(receiptData),
    });
  } catch {
    throw new Error('Serverga ulanib bo\'lmadi. Internet aloqasini tekshiring.');
  }

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok || !data.receipt) {
    throw new Error(data?.error || `Server xatosi (${res.status})`);
  }

  const newReceipt = receiptRowToClient(data.receipt);

  // Kesh: server javobini localStorage'ga qo'shamiz. Bu yozuv MUVAFFAQIYATSIZ
  // bo'lsa ham chek allaqachon serverda — shuning uchun faqat ogohlantiramiz.
  try {
    const all = getStoredReceipts();
    all.unshift(newReceipt);
    setItem(KEYS.RECEIPTS, all);
  } catch (err) {
    console.warn('[Receipts] Keshga yozilmadi (chek serverda saqlangan):', err);
  }

  // Adminlarga Telegram xabarnomasi endi SERVER tomonida yuboriladi
  // (`POST /api/receipts` -> `broadcastToAdmins` + bot). Ilgari bu yerda
  // brauzerdan bot tokeni bilan yuborilardi — token oshkor bo'lardi va
  // chek rasmi base64 "data:" URL bo'lgani uchun adminga umuman
  // yetib bormasdi.

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('manyak_storage_update'));
  }

  return newReceipt;
}

export function reviewReceipt(
  receiptId: string,
  reviewerId: string,
  decision: 'approved' | 'rejected'
): void {
  const all = getStoredReceipts();
  const rcpt = all.find((r) => r.id === receiptId);
  if (!rcpt) return;

  rcpt.status = decision;
  rcpt.reviewedAt = new Date().toISOString();
  rcpt.reviewedBy = reviewerId;
  setItem(KEYS.RECEIPTS, all);

  const settings = getStoredSettings();

  if (decision === 'approved') {
    // 1. Locate or create target user in all users database
    const allUsers = getStoredUsers();
    let targetUser = allUsers.find((u) => u.id === rcpt.userId);
    if (!targetUser) {
      targetUser = {
        id: rcpt.userId,
        firstName: rcpt.userName || `Foydalanuvchi #${rcpt.userId}`,
        phone: rcpt.userPhone,
        isPhoneVerified: Boolean(rcpt.userPhone),
        isVip: false,
        purchasedContentIds: [],
        favorites: [],
        createdAt: new Date().toISOString(),
      };
      allUsers.unshift(targetUser);
    }

    if (rcpt.type === 'vip_subscription') {
      const plan = getStoredPlans().find((p) => p.id === rcpt.planId);
      const days = plan?.durationDays || (rcpt.planId === 'plan_1_year' ? 365 : rcpt.planId === 'plan_3_month' ? 90 : 30);
      const currentExp = targetUser.vipExpiresAt && new Date(targetUser.vipExpiresAt).getTime() > Date.now()
        ? new Date(targetUser.vipExpiresAt).getTime()
        : Date.now();
      targetUser.isVip = true;
      targetUser.vipExpiresAt = new Date(currentExp + days * 24 * 60 * 60 * 1000).toISOString();
    } else if (rcpt.type === 'single_content' && rcpt.contentId) {
      if (!targetUser.purchasedContentIds) targetUser.purchasedContentIds = [];
      if (!targetUser.purchasedContentIds.includes(rcpt.contentId)) {
        targetUser.purchasedContentIds.push(rcpt.contentId);
      }
      recordContentRevenue(rcpt.contentId, rcpt.amount);
    }

    saveStoredUser(targetUser);

    // If target user is the currently logged in user, sync current profile too
    const current = getStoredCurrentUser();
    if (current.id === rcpt.userId) {
      saveStoredCurrentUser({ ...current, ...targetUser });
    }

    // 2. Telegram xabarnomasi endi SERVER tomonida yuboriladi
    //    (`PUT /api/receipts/:id/review` -> `sendToUser` + bot xabari).
    //    Ilgari bu yerda brauzerdan, bot tokeni bilan yuborilardi.

    // 3. Dispatch in-app subscription confirmation command & storage update
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('manyak_subscription_approved', {
          detail: {
            receipt: rcpt,
            userId: rcpt.userId,
            planName: rcpt.planName || rcpt.contentTitle || 'VIP Obuna',
            amount: rcpt.amount,
          },
        })
      );
      window.dispatchEvent(
        new CustomEvent('manyak_payment_status_update', {
          detail: {
            receiptId: rcpt.id,
            status: 'approved',
            userId: rcpt.userId,
            planName: rcpt.planName || rcpt.contentTitle || 'VIP Obuna',
            amount: rcpt.amount,
          },
        })
      );
      window.dispatchEvent(new CustomEvent('manyak_storage_update'));
    }
  } else {
    // Rad etilganda ham xabarnoma SERVER tomonidan yuboriladi.
    if (typeof window !== 'undefined') {
      window.dispatchEvent(
        new CustomEvent('manyak_payment_status_update', {
          detail: {
            receiptId: rcpt.id,
            status: 'rejected',
            userId: rcpt.userId,
            planName: rcpt.planName || rcpt.contentTitle || 'To\'lov',
            amount: rcpt.amount,
          },
        })
      );
      window.dispatchEvent(new CustomEvent('manyak_storage_update'));
    }
  }
}

export function performInstantPurchase(
  userId: string,
  type: 'vip_subscription' | 'single_content',
  targetId: string,
  amount: number,
  title: string
): void {
  const allUsers = getStoredUsers();
  let targetUser = allUsers.find((u) => u.id === userId);
  if (!targetUser) {
    const current = getStoredCurrentUser();
    if (current.id === userId) {
      targetUser = current;
    } else {
      targetUser = {
        id: userId,
        firstName: `Foydalanuvchi #${userId}`,
        isPhoneVerified: false,
        isVip: false,
        purchasedContentIds: [],
        favorites: [],
        createdAt: new Date().toISOString(),
      };
    }
  }

  if (type === 'vip_subscription') {
    const plan = getStoredPlans().find((p) => p.id === targetId);
    const days = plan?.durationDays || (targetId === 'plan_1_year' ? 365 : targetId === 'plan_3_month' ? 90 : 30);
    const currentExp = targetUser.vipExpiresAt && new Date(targetUser.vipExpiresAt).getTime() > Date.now()
      ? new Date(targetUser.vipExpiresAt).getTime()
      : Date.now();
    targetUser.isVip = true;
    targetUser.vipExpiresAt = new Date(currentExp + days * 24 * 60 * 60 * 1000).toISOString();
  } else if (type === 'single_content') {
    if (!targetUser.purchasedContentIds) targetUser.purchasedContentIds = [];
    if (!targetUser.purchasedContentIds.includes(targetId)) {
      targetUser.purchasedContentIds.push(targetId);
    }
    recordContentRevenue(targetId, amount);
  }

  saveStoredUser(targetUser);

  // Sync current user if it matches
  const current = getStoredCurrentUser();
  if (current.id === userId) {
    saveStoredCurrentUser({ ...current, ...targetUser });
  }

  // Also log to receipts as approved automatic payment
  const allReceipts = getStoredReceipts();
  const newReceipt = {
    id: `rcpt_auto_${Date.now()}`,
    userId,
    userName: targetUser.firstName,
    userPhone: targetUser.phone,
    type,
    planId: type === 'vip_subscription' ? targetId : undefined,
    planName: type === 'vip_subscription' ? title : undefined,
    contentId: type === 'single_content' ? targetId : undefined,
    contentTitle: type === 'single_content' ? title : undefined,
    amount,
    receiptImageUrl: 'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80',
    notes: 'Avtomatlashtirilgan to\'lov (4800 / SMS)',
    status: 'approved' as const,
    createdAt: new Date().toISOString(),
    reviewedAt: new Date().toISOString(),
    reviewedBy: 'TIZIM (Avtomat)',
  };
  allReceipts.unshift(newReceipt);
  setItem(KEYS.RECEIPTS, allReceipts);

  // Sync to Backend (SQLite)
  // OGOHLANTIRISH: bu funksiya (performInstantPurchase) hozircha hech qayerdan
  // chaqirilmaydi (o'lik kod), lekin agar kelajakda biror joydan chaqirilsa,
  // pastdagi localStorage yozuvi baribir "approved" bo'lib qoladi — chunki bu
  // to'liq klient tomonidagi arxitekturaviy muammo (AUDIT_HISOBOT.md, 7-band).
  // Backend tomoni endi bunday holatda ham xavfsiz: /api/sync-receipt oddiy
  // foydalanuvchi uchun statusni har doim 'pending'ga qaytaradi.
  if (typeof window !== 'undefined') {
    getAuthHeaders().then((authHeaders) => {
      fetch('/api/sync-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...authHeaders },
        body: JSON.stringify(newReceipt)
      }).catch(console.error);
    });
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('manyak_storage_update'));
  }
}

// 8. DAILY CHECK-IN & REWARD SYSTEM
// Qoida: Har kuni 1 tadan qism ochish uchun 1 token beriladi.
// 7-kunga yetganda: faqat VIP obunaga 10% chegirma beriladi (+ 1 token).
// Agarda 1 kun saytga kirmasa, barcha ketma-ketlik nolga tushib qoladi.
export const DAILY_CHECKIN_REWARDS: DailyCheckInReward[] = [
  {
    day: 1,
    title: "+1 ta Qism Ochish Tokeni",
    type: 'tokens',
    amount: 1,
    description: "Serialning 1 ta qismini yoki 1 ta filmni bepul ochish",
  },
  {
    day: 2,
    title: "+1 ta Qism Ochish Tokeni",
    type: 'tokens',
    amount: 1,
    description: "Serialning 1 ta qismini yoki 1 ta filmni bepul ochish",
  },
  {
    day: 3,
    title: "+1 ta Qism Ochish Tokeni",
    type: 'tokens',
    amount: 1,
    description: "Serialning 1 ta qismini yoki 1 ta filmni bepul ochish",
  },
  {
    day: 4,
    title: "+1 ta Qism Ochish Tokeni",
    type: 'tokens',
    amount: 1,
    description: "Serialning 1 ta qismini yoki 1 ta filmni bepul ochish",
  },
  {
    day: 5,
    title: "+1 ta Qism Ochish Tokeni",
    type: 'tokens',
    amount: 1,
    description: "Serialning 1 ta qismini yoki 1 ta filmni bepul ochish",
  },
  {
    day: 6,
    title: "+1 ta Qism Ochish Tokeni",
    type: 'tokens',
    amount: 1,
    description: "Serialning 1 ta qismini yoki 1 ta filmni bepul ochish",
  },
  {
    day: 7,
    title: "VIP Obunaga 10% Chegirma + 1 Token",
    type: 'vip_discount',
    amount: 10,
    description: "7 kunlik natija: Faqat VIP obuna uchun 10% chegirma va 1 ta qism ochish tokeni!",
  },
];

export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export interface CheckInStatus {
  isClaimedToday: boolean;
  currentStreak: number;
  nextDayToClaim: number; // 1..7
  currentReward: DailyCheckInReward;
  allRewards: DailyCheckInReward[];
  lastCheckInDate?: string;
  totalClaims: number;
  hoursUntilNextCheckIn: number;
}

export function getDailyCheckInStatus(user: UserProfile): CheckInStatus {
  const todayStr = getLocalDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  const lastDate = user.dailyCheckIn?.lastCheckInDate;
  const streak = user.dailyCheckIn?.streak || 0;
  const totalClaims = user.dailyCheckIn?.totalClaims || 0;

  const isClaimedToday = lastDate === todayStr;

  let currentStreak = 0;
  let nextDayToClaim = 1;

  if (isClaimedToday) {
    currentStreak = streak;
    nextDayToClaim = ((streak - 1) % 7) + 1; // The day claimed today
  } else if (lastDate === yesterdayStr) {
    // Kecha kirgan bo'lsa, streak davom etadi!
    currentStreak = streak;
    nextDayToClaim = (streak % 7) + 1;
  } else {
    // AGARDA 1 KUN SAYTGA KIRMASA, HAMMASI NOLGA TUSHIB QOLADI!
    currentStreak = 0;
    nextDayToClaim = 1;

    // ═══ TUZATILDI: RENDER PAYTIDA localStorage'GA YOZISH ═══
    // ESKI KOD shu yerda streak'ni nolga tushirib `saveStoredUser(user)`
    // chaqirardi. `getDailyCheckInStatus` esa DailyCheckInWidget'ning
    // `useState(...)` boshlang'ich qiymatida chaqiriladi — ya'ni render
    // paytida global holat o'zgarib, `manyak_storage_update` hodisasi
    // App.refreshData() ni ishga tushirardi, u yangi `user` obyekti
    // qaytarardi, widget'ning `useEffect([user])` esa yana shu funksiyani
    // chaqirardi. Tsikl faqat ikkinchi o'tishda `streak === 0` bo'lgani
    // uchun to'xtardi — juda mo'rt.
    //
    // Endi bu funksiya SOF: streak uzilganini shunchaki HISOBLAB qaytaradi
    // (`currentStreak = 0`), hech narsa yozmaydi. Haqiqiy qiymat keyingi
    // `claimDailyCheckInReward` chaqiruvida serverda hisoblanadi.
  }

  const rewardIndex = Math.max(0, Math.min(6, nextDayToClaim - 1));
  const currentReward = DAILY_CHECKIN_REWARDS[rewardIndex];

  // Hours until tomorrow midnight
  const now = new Date();
  const tomorrow = new Date(now);
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  const hoursUntilNextCheckIn = Math.max(0, Math.round((tomorrow.getTime() - now.getTime()) / (1000 * 60 * 60)));

  return {
    isClaimedToday,
    currentStreak,
    nextDayToClaim,
    currentReward,
    allRewards: DAILY_CHECKIN_REWARDS,
    lastCheckInDate: lastDate,
    totalClaims,
    hoursUntilNextCheckIn,
  };
}

export function claimDailyCheckInReward(userId: string): {
  success: boolean;
  message: string;
  reward?: DailyCheckInReward;
  user?: UserProfile;
} {
  const allUsers = getStoredUsers();
  let user = allUsers.find((u) => u.id === userId);
  const current = getStoredCurrentUser();

  if (!user && (current.id === userId)) {
    user = current;
  }
  if (!user) {
    return { success: false, message: "Foydalanuvchi topilmadi." };
  }

  const todayStr = getLocalDateString();
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = getLocalDateString(yesterday);

  if (user.dailyCheckIn?.lastCheckInDate === todayStr) {
    return {
      success: false,
      message: "Bugungi kunlik bonus allaqachon olingan! Ertaga yana qayting.",
    };
  }

  // Calculate next streak:
  // Agarda bir kun kirmasa hammasi nolga tushib, 1-kundan boshlanadi!
  let newStreak = 1;
  if (user.dailyCheckIn?.lastCheckInDate === yesterdayStr) {
    newStreak = (user.dailyCheckIn.streak || 0) + 1;
  } else {
    // Kecha kirmagan bo'lsa streak 0 ga tushgan edi, yangi kundan 1 boshlanadi
    newStreak = 1;
  }

  const rewardIndex = ((newStreak - 1) % 7);
  const reward = DAILY_CHECKIN_REWARDS[rewardIndex];

  // Apply reward to user profile
  if (reward.type === 'tokens') {
    user.accessTokens = (user.accessTokens || 0) + reward.amount;
  } else if (reward.type === 'vip_discount') {
    // 7-kunda: Faqat VIP obunaga 10% chegirma + 1 ta token
    user.vipDiscountPercent = 10;
    user.accessTokens = (user.accessTokens || 0) + 1;
  } else if (reward.type === 'bonus') {
    user.bonusBalance = (user.bonusBalance || 0) + reward.amount;
  } else if (reward.type === 'vip_hours') {
    const currentExp = user.isVip && user.vipExpiresAt && new Date(user.vipExpiresAt).getTime() > Date.now()
      ? new Date(user.vipExpiresAt).getTime()
      : Date.now();
    user.vipExpiresAt = new Date(currentExp + reward.amount * 60 * 60 * 1000).toISOString();
    user.isVip = true;
  }

  user.dailyCheckIn = {
    lastCheckInDate: todayStr,
    streak: newStreak,
    totalClaims: (user.dailyCheckIn?.totalClaims || 0) + 1,
    lastRewardTitle: reward.title,
  };

  saveStoredUser(user);

  if (current.id === userId) {
    saveStoredCurrentUser({ ...current, ...user });
  }

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('manyak_storage_update'));
  }

  return {
    success: true,
    message: `Tabriklaymiz! Sizga "${reward.title}" berildi!`,
    reward,
    user,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
//  TOKEN BILAN 1 TA QISMNI OCHISH — SERVER TOMONIDA
// ═══════════════════════════════════════════════════════════════════════════
//
// ESKI KODDA 3 TA XATO BOR EDI:
//
// 1) PUL OQISHI: `unlockedEpisodeIds` ga `${contentId}:${episodeId}` bilan
//    BIR QATORDA yalang'och `episodeId` ham qo'shilardi:
//        user.unlockedEpisodeIds.push(epTokenKey);
//        user.unlockedEpisodeIds.push(episodeId);   // <- XATO
//    `checkHasAccess` esa yalang'och id ni ham qabul qiladi. Qism id'lari
//    ('ep1', 'ep2', ...) seriallar orasida takrorlanganligi uchun, A
//    serialning 1-qismini token bilan ochgan odam BARCHA seriallarning
//    1-qismini bepul ko'ra olardi. Bu funksiya ustidagi izohda yozilgan
//    qoidaga to'g'ridan-to'g'ri qarama-qarshi.
//
// 2) BUTUNLAY KLIENT TOMONIDA: token hisobi va ochilgan qismlar
//    localStorage'da kamaytirilardi/qo'shilardi. Konsoldan
//    `accessTokens: 999` yozib, cheksiz qism ochish mumkin edi.
//
// 3) `use` PREFIKSI: nomi `use...` bilan boshlanadi, lekin bu React hook
//    emas — `onClick` ichida chaqirilgani uchun `react-hooks/rules-of-hooks`
//    lint qoidasi buzilardi. Yangi nom: `spendTokenToUnlock`.
//
// ENDI: server `POST /api/tokens/unlock` da tokenni kamaytiradi va faqat
// `contentId:episodeId` kalitini saqlaydi (yalang'och id YO'Q — buni
// server testida tasdiqladim). Klient natijani keshga yozadi.
export async function spendTokenToUnlock(
  userId: string,
  contentId: string,
  title?: string,
  episodeId?: string,
  episodeTitle?: string
): Promise<{ success: boolean; message: string; user?: UserProfile }> {
  const authHeaders = await getAuthHeaders();
  if (!authHeaders.Authorization) {
    return {
      success: false,
      message: "Tizimga kirilmagan. Tokendan foydalanish uchun ilovani Telegram bot orqali ochingiz.",
    };
  }

  let res: Response;
  try {
    res = await fetch('/api/tokens/unlock', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders },
      body: JSON.stringify({ userId, contentId, episodeId, title, episodeTitle }),
    });
  } catch {
    return { success: false, message: "Serverga ulanib bo'lmadi. Internet aloqasini tekshiring." };
  }

  if (res.status === 401) invalidateAuthToken();

  const data = await res.json().catch(() => null);
  if (!res.ok || !data?.ok) {
    return {
      success: false,
      message: data?.message || data?.error || `Qismni ochib bo'lmadi (status ${res.status}).`,
    };
  }

  // Server yangi holatni qaytardi — keshni ANIQ shu qiymat bilan yangilaymiz
  await syncEntitlementsFromServer();

  const detailText = episodeTitle
    ? `"${title || 'Serial'}"ning ${episodeTitle}i`
    : `"${title || 'Tanlangan kontent'}"`;

  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('manyak_storage_update'));
  }

  return {
    success: true,
    message: `1 ta Token sarflandi. Faqat ${detailText} ochildi! Serialning boshqa qismlariga o'tmaydi.`,
    user: getItem<UserProfile | null>(KEYS.CURRENT_USER, null) || undefined,
  };
}

// 9. FAVORITES
export interface FavoriteItem {
  contentId: string;
  addedAt: string;
}

export function getStoredFavorites(userId: string): FavoriteItem[] {
  const all = getItem<Record<string, FavoriteItem[]>>(KEYS.FAVORITES, {});
  return all[userId] || [];
}

export function isFavorite(userId: string, contentId: string): boolean {
  const userFavs = getStoredFavorites(userId);
  return userFavs.some(f => f.contentId === contentId);
}

export function toggleFavorite(userId: string, contentId: string): boolean {
  const all = getItem<Record<string, FavoriteItem[]>>(KEYS.FAVORITES, {});
  let userFavs = all[userId] || [];
  
  const existingIdx = userFavs.findIndex(f => f.contentId === contentId);
  let isAdded = false;
  
  if (existingIdx >= 0) {
    userFavs.splice(existingIdx, 1);
  } else {
    userFavs.unshift({ contentId, addedAt: new Date().toISOString() });
    isAdded = true;
  }
  
  all[userId] = userFavs;
  setItem(KEYS.FAVORITES, all);
  return isAdded;
}
