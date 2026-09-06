/**
 * MANYK TV — Telegram bot orqali hisobni tasdiqlash
 * ==================================================
 *
 * ═══ BU MODAL ESKI `PhoneVerificationModal` NI ALMASHTIRADI ═══
 *
 * ESKI OQIMDA NIMA XATO EDI:
 *
 *  1) "Telefon raqam" varianti shunchaki INPUT edi. Foydalanuvchi istalgan
 *     raqamni yozib `verifyUserPhone(...)` chaqirardi, u esa
 *     `isPhoneVerified = true` ni localStorage'ga yozardi. Hech qanday
 *     haqiqiy tasdiqlash yo'q — SMS ham, bot ham tekshirmasdi.
 *
 *  2) "Bot orqali" varianti ham aslida hech narsani tasdiqlamasdi:
 *     Telegram tashqarisida u botni yangi oynada ochib, 1 sekunddan keyin
 *     `markVerified(...)` ni SHARTSIZ chaqirardi — foydalanuvchi botga
 *     hech narsa yubormagan bo'lsa ham "tasdiqlandi" deb hisoblanardi.
 *
 *  3) Eng muhimi: `isPhoneVerified` serverda `SERVER_OWNED_USER_FIELDS`
 *     ro'yxatida. Ya'ni `/api/sync-user` klient qiymatini SERVER qiymati
 *     bilan QAYTA YOZARDI — klientdagi "tasdiqlash" keyingi sinxronlashda
 *     baribir yo'qolardi va modal yana ochilardi.
 *
 * YANGI OQIM (haqiqiy, server tomonida tekshiriladi):
 *
 *   1. sayt  -> POST /api/verify/start        -> { code, deepLink }
 *   2. foydalanuvchi botni ochadi (deep link) -> bot kontakt so'raydi
 *   3. foydalanuvchi KONTAKTINI yuboradi
 *   4. server `contact.user_id === from.id` ni tekshiradi va tasdiqlaydi
 *   5. sayt  -> GET /api/verify/status?code=  -> { verified, token, user }
 *
 * Telegram Mini App ichida ochilgan bo'lsa `tg.requestContact()` ishlatiladi
 * — u kontaktni to'g'ridan-to'g'ri botga yuboradi, natijani esa baribir
 * SERVER tasdiqlaydi (soxta "muvaffaqiyat" yo'q).
 */

import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ShieldCheck, Bot, ExternalLink, Copy, Check, RefreshCw, AlertTriangle } from 'lucide-react';
import { UserProfile } from '../types';
import { setBackendAuthToken } from '../services/authToken';
import { applyVerifiedSession } from '../services/storage';

interface TelegramVerificationModalProps {
  user: UserProfile;
  isOpen: boolean;
  onVerified: (updatedUser: UserProfile) => void;
}

type Phase =
  | 'idle'          // hali boshlanmagan
  | 'starting'      // kod olinmoqda
  | 'waiting'       // kod olindi, foydalanuvchi botga o'tishi kerak
  | 'in_bot'        // foydalanuvchi botni ochdi, kontakt kutilmoqda
  | 'verified'
  | 'error';

/** Telegram Mini App API (mavjud bo'lsa). */
function getTelegramWebApp() {
  return (window as unknown as {
    Telegram?: {
      WebApp?: {
        initData?: string;
        requestContact?: (cb: (shared: boolean) => void) => void;
        openTelegramLink?: (url: string) => void;
      };
    };
  }).Telegram?.WebApp;
}

export const TelegramVerificationModal: React.FC<TelegramVerificationModalProps> = ({
  user,
  isOpen,
  onVerified,
}) => {
  const [phase, setPhase] = useState<Phase>('idle');
  const [code, setCode] = useState('');
  const [deepLink, setDeepLink] = useState('');
  const [botUsername, setBotUsername] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  // Polling taymerini tozalash uchun (ilgari bunday taymerlar
  // hech qachon tozalanmasdi va unmount'dan keyin ham ishlab turardi)
  const pollTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
      if (pollTimerRef.current) clearInterval(pollTimerRef.current);
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (pollTimerRef.current) {
      clearInterval(pollTimerRef.current);
      pollTimerRef.current = null;
    }
  }, []);

  /** Serverdan tasdiqlash holatini so'rab turadi. */
  const startPolling = useCallback(
    (verifyCode: string) => {
      stopPolling();

      pollTimerRef.current = setInterval(async () => {
        if (!isMountedRef.current) return stopPolling();

        try {
          const res = await fetch(`/api/verify/status?code=${encodeURIComponent(verifyCode)}`);
          const data = await res.json().catch(() => null);

          if (!data) return;

          if (data.status === 'expired') {
            stopPolling();
            setPhase('error');
            setError("Tasdiqlash kodi muddati tugadi. Iltimos, qaytadan boshlang.");
            return;
          }

          // Bot ochilgani aniqlandi — foydalanuvchiga aniqroq ko'rsatkich
          if (data.status === 'awaiting_contact') {
            setPhase('in_bot');
            return;
          }

          if (data.verified && data.token && data.user) {
            stopPolling();
            // JWT ni saqlaymiz — bundan keyin barcha so'rovlar
            // autentifikatsiya bilan ketadi (kontent saqlash, chek yuborish...)
            setBackendAuthToken(data.token);
            const updated = applyVerifiedSession(data.user);
            setPhase('verified');
            // Foydalanuvchi natijani ko'rib ulgurishi uchun kichik pauza
            setTimeout(() => {
              if (isMountedRef.current) onVerified(updated);
            }, 900);
          }
        } catch {
          // Tarmoq uzilishi — keyingi urinishda davom etadi
        }
      }, 2000);
    },
    [onVerified, stopPolling]
  );

  /** Tasdiqlashni boshlash: serverdan kod va deep link olamiz. */
  const handleStart = useCallback(async () => {
    setPhase('starting');
    setError('');

    let data: {
      ok?: boolean;
      error?: string;
      code?: string;
      deepLink?: string;
      botUsername?: string;
    } | null = null;

    try {
      const res = await fetch('/api/verify/start', { method: 'POST' });
      data = await res.json().catch(() => null);
      if (!res.ok || !data?.ok || !data.code || !data.deepLink) {
        setPhase('error');
        setError(data?.error || `Tasdiqlashni boshlab bo'lmadi (status ${res.status}).`);
        return;
      }
    } catch {
      setPhase('error');
      setError("Serverga ulanib bo'lmadi. Internet aloqasini tekshiring.");
      return;
    }

    setCode(data.code);
    setDeepLink(data.deepLink);
    setBotUsername(data.botUsername || '');
    setPhase('waiting');
    startPolling(data.code);

    // Mini App ichida bo'lsak — kontaktni to'g'ridan-to'g'ri so'raymiz.
    // Bu foydalanuvchi uchun eng qisqa yo'l: botga o'tish kerak emas.
    const tg = getTelegramWebApp();
    if (tg?.requestContact) {
      tg.requestContact((shared: boolean) => {
        if (!shared) {
          // ESKI KOD bu holatda ham "tasdiqlandi" deb hisoblardi.
          // Endi shunchaki kutishda davom etamiz — haqiqiy tasdiqlashni
          // faqat SERVER beradi.
          setError("Kontakt ulashilmadi. Tasdiqlash uchun kontaktingizni yuborishingiz kerak.");
        }
        // Muvaffaqiyat bo'lsa ham hech narsa "tasdiqlanmaydi" —
        // polling serverdan haqiqiy natijani kutadi.
      });
    }
  }, [startPolling]);

  // Modal ochilganda avtomatik boshlaymiz
  useEffect(() => {
    if (isOpen && phase === 'idle') {
      void handleStart();
    }
    if (!isOpen) {
      stopPolling();
    }
  }, [isOpen, phase, handleStart, stopPolling]);

  if (!isOpen || user.isPhoneVerified) return null;

  const openBot = () => {
    const tg = getTelegramWebApp();
    if (tg?.openTelegramLink) {
      tg.openTelegramLink(deepLink);
    } else {
      window.open(deepLink, '_blank', 'noopener,noreferrer');
    }
    setPhase('in_bot');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(deepLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Havolani nusxalab bo'lmadi — uni qo'lda oching.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#121216] border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">

        {/* Sarlavha */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-blue-950/80 border border-blue-800/80 flex items-center justify-center text-blue-400 mb-2.5 shadow-lg shadow-blue-900/30">
            {phase === 'verified' ? <Check className="w-8 h-8 text-emerald-400" /> : <ShieldCheck className="w-8 h-8" />}
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            {phase === 'verified' ? 'Tasdiqlandi!' : 'Telegram orqali tasdiqlash'}
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs leading-relaxed">
            {phase === 'verified'
              ? 'Hisobingiz muvaffaqiyatli tasdiqlandi. Endi barcha imkoniyatlar ochiq.'
              : "Hisobingizni tasdiqlash uchun botga kontaktingizni yuboring. Bu telefon raqamini qo'lda kiritishni almashtiradi."}
          </p>
        </div>

        {/* ═══ MUVAFFAQIYAT ═══ */}
        {phase === 'verified' && (
          <div className="p-4 rounded-xl bg-emerald-950/60 border border-emerald-800/70 text-center">
            <p className="text-xs text-emerald-300 font-bold">
              Hisob Telegram akkauntingizga bog'landi
            </p>
          </div>
        )}

        {/* ═══ KOD OLINMOQDA ═══ */}
        {phase === 'starting' && (
          <div className="flex flex-col items-center gap-3 py-6">
            <div className="w-6 h-6 border-2 border-blue-400 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-zinc-400">Tayyorlanmoqda…</span>
          </div>
        )}

        {/* ═══ XATO ═══ */}
        {phase === 'error' && (
          <div className="space-y-3">
            <div className="p-3.5 rounded-xl bg-red-950/60 border border-red-800/70 flex items-start gap-2.5">
              <AlertTriangle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-[11px] text-red-300 leading-relaxed">{error}</p>
            </div>
            <button
              type="button"
              onClick={() => { setPhase('idle'); setError(''); }}
              className="w-full py-3 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-bold text-xs text-white border border-zinc-700 transition flex items-center justify-center gap-2"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Qaytadan urinish</span>
            </button>
          </div>
        )}

        {/* ═══ KUTISH / BOTDA ═══ */}
        {(phase === 'waiting' || phase === 'in_bot') && (
          <div className="space-y-3.5">
            {/* Qadamlar */}
            <ol className="space-y-2.5">
              {[
                { n: 1, text: 'Pastdagi tugmani bosib botni ochingiz' },
                { n: 2, text: '«📱 Kontaktni yuborish» tugmasini bosingiz' },
                { n: 3, text: 'Shu oynaga qaytingiz — avtomatik davom etadi' },
              ].map((step) => (
                <li key={step.n} className="flex items-start gap-2.5">
                  <span className="w-5 h-5 rounded-full bg-zinc-800 border border-zinc-700 text-[10px] font-bold text-zinc-300 flex items-center justify-center flex-shrink-0 mt-0.5">
                    {step.n}
                  </span>
                  <span className="text-[11px] text-zinc-300 leading-relaxed">{step.text}</span>
                </li>
              ))}
            </ol>

            {/* Holat ko'rsatkichi */}
            <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
              phase === 'in_bot'
                ? 'bg-blue-950/50 border-blue-800/70'
                : 'bg-zinc-900/80 border-zinc-800'
            }`}>
              <div className="w-4 h-4 border-2 border-blue-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <span className="text-[11px] text-zinc-300">
                {phase === 'in_bot'
                  ? 'Bot ochildi — kontaktingizni kutmoqdamiz…'
                  : 'Botga o\'tishingizni kutmoqdamiz…'}
              </span>
            </div>

            {error && (
              <div className="p-2.5 rounded-lg bg-amber-950/50 border border-amber-800/60 text-[11px] text-amber-300">
                {error}
              </div>
            )}

            <button
              type="button"
              onClick={openBot}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 active:scale-98 font-black text-xs sm:text-sm text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4" />
              <span>{botUsername ? `@${botUsername} ni ochish` : 'Botni ochish'}</span>
              <ExternalLink className="w-3.5 h-3.5 opacity-80" />
            </button>

            {/* Zaxira variant: havolani qo'lda ochish */}
            <button
              type="button"
              onClick={copyLink}
              className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] font-semibold border border-zinc-800 transition flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Havola nusxalandi' : 'Tugma ishlamasa — havolani nusxalash'}</span>
            </button>

            <p className="text-[10px] text-zinc-600 text-center font-mono">
              Kod: {code}
            </p>
          </div>
        )}

        <div className="mt-4 text-center">
          <span className="text-[10px] text-zinc-500">
            🔒 Kontaktingiz faqat hisobni tasdiqlash uchun ishlatiladi
          </span>
        </div>
      </div>
    </div>
  );
};
