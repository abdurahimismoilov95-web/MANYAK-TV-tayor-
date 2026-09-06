import React, { useState } from 'react';
import {
  X,
  Send,
  ExternalLink,
  Bot,
  CheckCircle2,
  AlertCircle,
  Crown,
} from 'lucide-react';
import { UserProfile, SystemSettings } from '../types';

interface TelegramAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  settings: SystemSettings;
  onSuccess: (isAdmin: boolean) => void;
}

export const TelegramAuthModal: React.FC<TelegramAuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  settings,
}) => {
  const [statusMessage] = useState<{
    type: 'success' | 'error' | 'admin';
    text: string;
  } | null>(null);
  const [isBotOpened, setIsBotOpened] = useState(false);

  if (!isOpen) return null;

  const botUsername = (settings.botUsername || 'Manyaktvbot').replace('@', '');

  const handleOpenBotForContact = () => {
    setIsBotOpened(true);
    const deepLink = `https://t.me/${botUsername}?start=auth_${currentUser.id}`;
    window.open(deepLink, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-md bg-[#121216] border border-zinc-800 rounded-3xl p-5 sm:p-6 shadow-2xl my-auto animate-in fade-in zoom-in-95">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
          aria-label="Yopish"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header Icon & Title */}
        <div className="text-center mb-5">
          <div className="w-14 h-14 mx-auto mb-3 rounded-2xl bg-blue-950/70 border border-blue-600/50 flex items-center justify-center text-blue-400 shadow-xl shadow-blue-900/30">
            <Bot className="w-8 h-8" />
          </div>
          <h3 className="text-lg sm:text-xl font-black text-white tracking-tight">
            Telegram Profil Orqali Tasdiqlash
          </h3>
          <p className="text-xs text-zinc-400 mt-1 leading-relaxed max-w-sm mx-auto">
            Sayt va rasmiy <b>@{botUsername}</b> boti integratsiyasi. Profilingizni bot orqali tasdiqlang.
          </p>
        </div>

        {/* Status Message Alert */}
        {statusMessage && (
          <div
            className={`p-3.5 rounded-2xl mb-4 text-xs font-semibold flex items-start gap-2.5 animate-in fade-in ${
              statusMessage.type === 'admin'
                ? 'bg-emerald-950/80 border border-emerald-500/80 text-emerald-300'
                : statusMessage.type === 'success'
                ? 'bg-blue-950/80 border border-blue-500/80 text-blue-300'
                : 'bg-red-950/80 border border-red-500/80 text-red-300'
            }`}
          >
            {statusMessage.type === 'admin' ? (
              <Crown className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            ) : statusMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
            )}
            <div className="flex-1 leading-relaxed">{statusMessage.text}</div>
          </div>
        )}

        <div className="space-y-3">
          {/* Primary Action: Open @Manyaktvbot to verify */}
          <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bot className="w-4 h-4 text-blue-400" />
                <span className="text-xs font-bold text-white">
                  Telegram Bot Orqali Tasdiqlash
                </span>
              </div>
              <span className="text-[10px] text-blue-400 bg-blue-950/80 border border-blue-800/80 px-2 py-0.5 rounded-full font-mono">
                @{botUsername}
              </span>
            </div>

            <p className="text-xs text-zinc-300 leading-relaxed">
              Rasmiy botimizga o'ting va <b>"📞 Kontaktni yuborish"</b> tugmasi orqali hisobingizni tasdiqlang.
            </p>

            <button
              type="button"
              onClick={handleOpenBotForContact}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition active:scale-98"
            >
              <Send className="w-3.5 h-3.5" />
              <span>@{botUsername} Botga O'tish va Tasdiqlash</span>
              <ExternalLink className="w-3 h-3 text-blue-200" />
            </button>

            {isBotOpened && (
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 pt-1">
                <CheckCircle2 className="w-3 h-3 shrink-0" />
                <span>Bot ochildi! Botda kontakt yuborilgach, hisobingiz avtomatik biriktiriladi.</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
