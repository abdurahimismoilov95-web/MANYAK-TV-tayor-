import React, { useState } from 'react';
import { ShieldCheck, Phone, CheckCircle2, Bot, ExternalLink, Sparkles, Send } from 'lucide-react';
import { verifyUserPhone, verifyUserViaBot, getStoredSettings, isUserAdmin } from '../services/storage';
import { notifyUserVerificationViaTelegram } from '../services/telegramBot';
import { UserProfile } from '../types';

interface PhoneVerificationModalProps {
  user: UserProfile;
  isOpen: boolean;
  onVerified: (updatedUser: UserProfile) => void;
}

export const PhoneVerificationModal: React.FC<PhoneVerificationModalProps> = ({
  user,
  isOpen,
  onVerified,
}) => {
  const settings = getStoredSettings();
  const botUsername = (settings.botUsername || 'Manyaktvbot').replace('@', '');

  const [verifyMode, setVerifyMode] = useState<'bot' | 'phone'>('bot');
  const [phoneNumber, setPhoneNumber] = useState(user.phone || '+998 ');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!isOpen || user.isPhoneVerified) return null;

  const handleBotVerify = () => {
    setLoading(true);

    const markVerified = (verifiedPhone: string) => {
      const isAdmin = isUserAdmin(user.id);
      if (isAdmin && typeof window !== 'undefined') {
        localStorage.setItem('manyak_allow_pc_admin', 'true');
      }

      const updated = verifyUserViaBot(verifiedPhone);
      if (isAdmin) {
        updated.isVip = true;
      }

      // Notify via Telegram bot
      notifyUserVerificationViaTelegram(
        {
          id: user.id,
          firstName: user.firstName || 'Foydalanuvchi',
          phone: updated.phone,
          username: user.username,
        },
        settings
      ).catch(() => {});

      setLoading(false);
      onVerified(updated);
    };

    // @ts-ignore
    const tg = window.Telegram?.WebApp;
    if (tg && tg.requestContact) {
      tg.requestContact((shared: boolean) => {
        if (shared) {
          // Telegram Web App handles sending the contact to the bot automatically
          markVerified(user.phone || `TG_${user.id}`);
        } else {
          setError("Iltimos, tasdiqlash uchun kontaktingizni ulashing!");
          setLoading(false);
        }
      });
    } else {
      // Fallback: Open bot in Telegram app for Web / Desktop users
      const botUrl = `https://t.me/${botUsername}?start=verify_${user.id}`;
      try {
        window.open(botUrl, '_blank');
      } catch {
        // ignore
      }
      setTimeout(() => markVerified(user.phone || `TG_${user.id}`), 1000);
    }
  };

  const handlePhoneVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanNumber = phoneNumber.trim();

    if (cleanNumber.length < 9) {
      setError('Iltimos, haqiqiy telefon raqamini kiriting');
      return;
    }

    setLoading(true);
    setTimeout(() => {
      const updated = verifyUserPhone(cleanNumber);
      // Notify via Telegram bot
      notifyUserVerificationViaTelegram(
        {
          id: user.id,
          firstName: user.firstName || 'Foydalanuvchi',
          phone: cleanNumber,
          username: user.username,
        },
        settings
      ).catch(() => {});

      setLoading(false);
      onVerified(updated);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div className="relative w-full max-w-md bg-[#121216] border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        {/* Security Shield Header */}
        <div className="flex flex-col items-center text-center mb-4">
          <div className="w-14 h-14 rounded-2xl bg-red-950/80 border border-red-800/80 flex items-center justify-center text-red-500 mb-2.5 shadow-lg shadow-red-900/30">
            <ShieldCheck className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-extrabold text-white tracking-tight">
            Hisobni Tasdiqlash
          </h3>
          <p className="text-xs text-zinc-400 mt-1 max-w-xs">
            MANYK TV platformasidan foydalanish uchun hisobingizni rasmiy <b>@{botUsername}</b> boti orqali tasdiqlang.
          </p>
        </div>

        {/* Telegram User Badge */}
        <div className="flex items-center gap-3 bg-zinc-900/90 border border-zinc-800 p-2.5 sm:p-3 rounded-xl mb-4">
          <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-red-600 to-red-800 flex items-center justify-center text-white font-bold text-xs">
            {user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-xs font-bold text-white truncate">
              {user.firstName} {user.lastName || ''}
            </div>
            <div className="text-[11px] text-zinc-400 flex items-center gap-1.5">
              <span>Telegram ID:</span>
              <span className="text-red-400 font-mono font-semibold">{user.id}</span>
            </div>
          </div>
          <span className="text-[10px] bg-red-950/80 border border-red-800/60 text-red-400 px-2 py-0.5 rounded-full font-bold">
            Tasdiqlanmagan
          </span>
        </div>

        {/* Tab switch between Bot and Phone */}
        <div className="grid grid-cols-2 gap-1.5 p-1 bg-zinc-900/90 border border-zinc-800 rounded-xl mb-4">
          <button
            type="button"
            onClick={() => setVerifyMode('bot')}
            className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              verifyMode === 'bot'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Bot className="w-3.5 h-3.5" />
            <span>@{botUsername}</span>
          </button>
          <button
            type="button"
            onClick={() => setVerifyMode('phone')}
            className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              verifyMode === 'phone'
                ? 'bg-red-600 text-white shadow-md'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <Phone className="w-3.5 h-3.5" />
            <span>Telefon Raqam</span>
          </button>
        </div>

        {verifyMode === 'bot' ? (
          /* BOT VERIFICATION (PRIMARY) */
          <div className="space-y-3.5">
            <div className="p-3.5 rounded-xl bg-zinc-950 border border-zinc-800 space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-400">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Kontaktni avtomatik yuborish</span>
              </div>
              <p className="text-[11px] text-zinc-300 leading-relaxed">
                Platformadan foydalanish uchun quyidagi tugmani bosing va <b>"Kontaktni ulashish"</b> ni tasdiqlang.
                <br /><br />
                Sizning raqamingiz botga avtomatik jo'natiladi va profilingiz tasdiqlanadi.
              </p>
              {error && (
                <div className="text-[10px] text-red-500 font-bold bg-red-500/10 p-2 rounded-lg mt-2">
                  {error}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={handleBotVerify}
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 active:scale-98 font-black text-xs sm:text-sm text-white shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <Bot className="w-4 h-4" />
                  <span>Telegram orqali kirish</span>
                  <Send className="w-3.5 h-3.5 opacity-80 ml-1" />
                </>
              )}
            </button>
          </div>
        ) : (
          /* PHONE FORM VERIFICATION */
          <form onSubmit={handlePhoneVerify} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-300 mb-1.5">
                Telefon raqamingiz:
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
                <input
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => {
                    setPhoneNumber(e.target.value);
                    setError('');
                  }}
                  placeholder="+998 90 123 45 67"
                  className="w-full bg-zinc-900 border border-zinc-700 focus:border-red-500 rounded-xl pl-10 pr-4 py-2.5 text-sm text-white placeholder:text-zinc-500 outline-none transition"
                />
              </div>
              {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:scale-98 font-bold text-sm text-white shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Tasdiqlash va Boshlash</span>
                </>
              )}
            </button>
          </form>
        )}

        <div className="mt-4 text-center">
          <span className="text-[10px] text-zinc-500">
            🔒 Rasmiy tasdiqlash tizimi • @{botUsername}
          </span>
        </div>
      </div>
    </div>
  );
};
