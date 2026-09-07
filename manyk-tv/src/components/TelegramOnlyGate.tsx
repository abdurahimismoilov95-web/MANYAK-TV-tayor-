/**
 * MANYK TV — "Faqat Telegram ichida" kirish ekrani
 * =================================================
 *
 * TALAB: ilova Telegram Mini App bo'lib ishlasin, brauzerga "otib ketmasin";
 * brauzerdan kirish faqat ADMIN va admin tayinlagan odamlarga ochiq bo'lsin.
 *
 * Bu komponent shu talabning KO'RINISH (UX) qismi: oddiy brauzerda ochilganda
 * ilova o'rniga botga o'tish taklifi ko'rsatiladi.
 *
 * ⚠️ MUHIM: bu ekranning O'ZI himoya EMAS — u shunchaki JavaScript va uni
 * chetlab o'tish mumkin. Haqiqiy bloklash SERVERDA:
 *
 *   - `GET /api/contents` va `/api/plans` -> `auth` + `requireAppAccess`
 *     (faqat `via: 'miniapp'` tokeni yoki admin)
 *   - `/uploads/*` (video fayllar) -> `requireMediaAccess` (cookie/token)
 *   - `/api/verify/status` -> brauzer oqimida token FAQAT adminlarga beriladi
 *
 * Ya'ni bu ekranni chetlab o'tgan odam ham hech qanday kontent yoki video
 * olmaydi — API bo'sh javob qaytaradi.
 */

import React, { useState, useEffect, useCallback } from 'react';
import { Send, ExternalLink, Copy, Check, ShieldCheck, Loader2 } from 'lucide-react';

interface TelegramOnlyGateProps {
  /** Admin brauzerdan kirishi uchun tasdiqlash oqimini boshlash */
  onAdminVerify: () => void;
}

export const TelegramOnlyGate: React.FC<TelegramOnlyGateProps> = ({ onAdminVerify }) => {
  const [botUsername, setBotUsername] = useState('');
  const [botLink, setBotLink] = useState('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Bot manzilini serverdan olamiz (bot username `getMe` orqali aniqlanadi,
  // ya'ni kodda qattiq yozilgan nom yo'q).
  const loadBotLink = useCallback(async () => {
    try {
      const res = await fetch('/api/public-config');
      const data = await res.json().catch(() => null);
      if (data?.ok && data.botUsername) {
        setBotUsername(data.botUsername);
        setBotLink(`https://t.me/${data.botUsername}`);
      }
    } catch {
      // Tarmoq xatosi — pastda umumiy ko'rsatma qoladi
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBotLink();
  }, [loadBotLink]);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(botLink);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard mavjud bo'lmasa — foydalanuvchi qo'lda nusxalaydi
    }
  };

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md bg-zinc-950/95 border border-zinc-800 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
        {/* Fon nuri */}
        <div className="absolute -top-24 -left-24 w-48 h-48 bg-blue-600/20 blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -right-24 w-48 h-48 bg-red-600/20 blur-3xl pointer-events-none" />

        <div className="relative">
          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-blue-950/70 border border-blue-800/70 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-900/30">
            <Send className="w-10 h-10" />
          </div>

          <h1 className="text-xl sm:text-2xl font-black tracking-tight mb-2">
            MANYAK TV Telegram ilovasi
          </h1>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-6">
            Platforma faqat <b>Telegram ilovasi ichida</b> ishlaydi.
            Kinolar, seriallar va short dramalarni ko'rish uchun botni ochib,
            <b> «MANYAK TV ni ochish»</b> tugmasini bosingiz.
          </p>

          {loading ? (
            <div className="flex items-center justify-center gap-2 py-3 text-zinc-400 text-xs">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Yuklanmoqda…</span>
            </div>
          ) : botLink ? (
            <div className="space-y-2.5">
              <a
                href={botLink}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full py-3.5 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-sky-600 hover:from-blue-500 hover:to-sky-500 active:scale-98 font-black text-sm text-white shadow-lg shadow-blue-600/30 transition flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>{botUsername ? `@${botUsername} ni ochish` : 'Botni ochish'}</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>

              <button
                type="button"
                onClick={copyLink}
                className="w-full py-2 px-3 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-zinc-200 text-[11px] font-semibold border border-zinc-800 transition flex items-center justify-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Havola nusxalandi' : 'Havolani nusxalash'}</span>
              </button>
            </div>
          ) : (
            <div className="p-3 rounded-xl bg-zinc-900 border border-zinc-800 text-[11px] text-zinc-400">
              Bot manzili hozircha sozlanmagan. Iltimos, administrator bilan bog'laningiz.
            </div>
          )}

          {/* Adminlar uchun alohida yo'l */}
          <div className="mt-6 pt-5 border-t border-zinc-800/80">
            <button
              type="button"
              onClick={onAdminVerify}
              className="text-[11px] text-zinc-500 hover:text-zinc-300 font-medium inline-flex items-center gap-1.5 transition"
            >
              <ShieldCheck className="w-3.5 h-3.5" />
              <span>Administrator sifatida kirish</span>
            </button>
            <p className="text-[10px] text-zinc-600 mt-1.5 leading-relaxed">
              Brauzerdan kirish faqat administratorlar uchun ochiq.
              Tasdiqlash bot orqali amalga oshiriladi.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
