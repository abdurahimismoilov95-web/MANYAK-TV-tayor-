import React from 'react';
import { Film, Shield, Crown, Send, ArrowLeft, Flame } from 'lucide-react';
import { UserProfile, SystemSettings } from '../types';

const CustomManyakGhost = ({ className }: { className?: string }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeLinecap="round"
    strokeLinejoin="round"
    className={className}
  >
    {/* Ghost outline */}
    <path d="M9 2a8 8 0 0 0-8 8v11.5l2.5-2.5 2.5 2.5 3-3 3 3 2.5-2.5 2.5 2.5V10c0-4.4-3.6-8-8-8z" className="text-red-500 fill-red-500/10" strokeWidth="1.5" />
    
    {/* X Eye (Left) */}
    <path d="M4.5 8.5l2.5 2.5m0-2.5l-2.5 2.5" className="text-red-500" strokeWidth="1.5" />
    
    {/* O Eye (Right) */}
    <circle cx="11.5" cy="9.5" r="1.5" className="text-red-500 fill-red-500" strokeWidth="1.5" />
    
    {/* Evil Smile */}
    <path d="M7 14.5c1.5 1.5 3.5 1.5 5 0" className="text-red-500" strokeWidth="1.5" />
    
    {/* Arm/Hand */}
    <path d="M15 13h2" className="text-red-500" strokeWidth="1.5" />
    
    {/* Knife Handle */}
    <path d="M19.5 13v4" className="text-amber-700" strokeWidth="2.5" />
    
    {/* Knife Guard */}
    <path d="M18.5 13h2" className="text-zinc-400" strokeWidth="1.5" />
    
    {/* Knife Blade */}
    <path d="M19.5 13V4l3 3.5V13z" className="text-zinc-200 fill-zinc-200/20" strokeWidth="1.5" />
    
    {/* Blood drip on blade */}
    <path d="M22.5 13v1.5a1 1 0 0 1-2 0" className="text-red-600 fill-red-600" strokeWidth="1" />
  </svg>
);

interface HeaderProps {
  user: UserProfile;
  settings: SystemSettings;
  isAdmin: boolean;
  canGoBack?: boolean;
  onBack?: () => void;
  onOpenAdmin: () => void;
  onOpenVip: () => void;
  onOpenTelegramAuth?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  settings,
  isAdmin,
  canGoBack,
  onBack,
  onOpenAdmin,
  onOpenVip,
}) => {
  return (
    <header className="sticky top-0 z-30 w-full bg-[#09090b]/95 backdrop-blur-xl border-b border-zinc-800/80 px-3 sm:px-4 py-3 transition-all shadow-lg shadow-black/50">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 sm:gap-3">
        {/* Left Side: Back button + Logo & Title */}
        <div className="flex items-center gap-2.5 sm:gap-3">
          {canGoBack && onBack && (
            <button
              id="btn-header-back"
              onClick={onBack}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 text-white border border-zinc-700 transition shadow-sm active:scale-95 group"
              title="Orqaga qaytish"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-300 group-hover:-translate-x-0.5 transition-transform" />
            </button>
          )}

          {/* Creative Logo */}
          <div className="relative flex items-center justify-center w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-black via-zinc-900 to-red-950 border-2 border-red-900/50 shadow-[0_0_15px_rgba(220,38,38,0.4)] group overflow-hidden transform -skew-x-6">
            <div className="absolute inset-0 bg-red-600/20 animate-pulse" />
            <CustomManyakGhost className="w-6 h-6 sm:w-7 sm:h-7 group-hover:scale-110 transition-transform duration-300 drop-shadow-md -ml-1" />
          </div>
          <div>
            <div className="flex items-center gap-1 transform -skew-x-6">
              <span className="font-black tracking-tighter text-xl sm:text-2xl text-white uppercase drop-shadow-[0_2px_8px_rgba(220,38,38,0.5)]">
                MANYAK
              </span>
              <span className="font-black tracking-tighter text-xl sm:text-2xl text-red-600 uppercase">
                TV
              </span>
            </div>
          </div>
        </div>

        {/* Right side actions: Uniform standardized buttons */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {/* Telegram Channel Link */}
          {settings.telegramChannelUrl && (
            <a
              href={settings.telegramChannelUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center h-9 sm:h-10 px-2.5 sm:px-3.5 gap-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700/80 text-zinc-300 text-[13px] font-bold border border-zinc-700/50 transition active:scale-95"
              title="Telegram Kanalimiz"
            >
              <Send className="w-4 h-4 text-sky-400" />
              <span className="hidden sm:inline">Kanal</span>
            </a>
          )}

          {/* Admin Panel Button */}
          {isAdmin && (
            <button
              onClick={onOpenAdmin}
              className="flex items-center justify-center h-9 sm:h-10 px-2.5 sm:px-3.5 gap-1.5 rounded-lg text-[13px] font-bold shadow-sm transition bg-red-950/90 hover:bg-red-900 text-red-300 border border-red-700/70 active:scale-95"
              title="Admin Boshqaruv Paneli"
            >
              <Shield className="w-4 h-4 text-red-400" />
              <span className="hidden sm:inline">Admin</span>
            </button>
          )}
        </div>
      </div>
    </header>
  );
};
