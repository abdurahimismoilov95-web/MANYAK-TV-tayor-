import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Gift,
  Flame,
  Ticket,
  Coins,
  Crown,
  CheckCircle2,
  Lock,
  Sparkles,
  Clock,
  HelpCircle,
  X,
  ChevronRight,
  Percent,
} from 'lucide-react';
import { UserProfile, DailyCheckInReward } from '../types';
import {
  getDailyCheckInStatus,
  claimDailyCheckInReward,
} from '../services/storage';

interface DailyCheckInWidgetProps {
  user: UserProfile;
  onRewardClaimed?: (reward: DailyCheckInReward) => void;
  onOpenVip?: () => void;
}

export const DailyCheckInWidget: React.FC<DailyCheckInWidgetProps> = ({
  user,
  onRewardClaimed,
  onOpenVip,
}) => {
  const [status, setStatus] = useState(getDailyCheckInStatus(user));
  const [isClaiming, setIsClaiming] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);
  const [claimedReward, setClaimedReward] = useState<DailyCheckInReward | null>(null);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [isOpen, setIsOpen] = useState(false);

  React.useEffect(() => {
    setStatus(getDailyCheckInStatus(user));
  }, [user]);

  const handleClaim = () => {
    if (status.isClaimedToday || isClaiming) return;
    setIsClaiming(true);

    try {
      // Telegram WebApp subtle haptic vibration if available
      const tg = (window as unknown as { Telegram?: { WebApp?: { HapticFeedback?: { notificationOccurred: (type: string) => void } } } }).Telegram?.WebApp;
      if (tg?.HapticFeedback) {
        tg.HapticFeedback.notificationOccurred('success');
      }
    } catch {
      // Ignore if not supported
    }

    setTimeout(() => {
      const result = claimDailyCheckInReward(user.id);
      setIsClaiming(false);
      if (result.success && result.reward) {
        setClaimedReward(result.reward);
        setShowCelebration(true);
        if (onRewardClaimed) {
          onRewardClaimed(result.reward);
        }
      } else {
        alert(result.message);
      }
    }, 400);
  };

  const getRewardIcon = (type: string, isBig = false) => {
    const sizeClass = isBig ? 'w-8 h-8' : 'w-4 h-4';
    if (type === 'tokens') {
      return <Ticket className={`${sizeClass} text-amber-400`} />;
    }
    if (type === 'vip_discount') {
      return <Percent className={`${sizeClass} text-amber-300`} />;
    }
    if (type === 'bonus') {
      return <Coins className={`${sizeClass} text-emerald-400`} />;
    }
    return <Crown className={`${sizeClass} text-amber-300 fill-amber-300/30`} />;
  };

  return (
    <>
      {/* DRAGGABLE FAB */}
      {!isOpen && (
        <motion.div
          drag
          dragConstraints={{ left: -window.innerWidth + 80, right: 0, top: -window.innerHeight + 80, bottom: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          onClick={() => setIsOpen(true)}
          className="fixed right-4 bottom-24 z-[40] w-12 h-12 rounded-full bg-gradient-to-tr from-red-600 to-amber-600 shadow-xl shadow-red-600/40 flex items-center justify-center cursor-pointer border-2 border-zinc-900"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Gift className="w-5 h-5 text-white animate-bounce" style={{ animationDuration: '2s' }} />
          {!status.isClaimedToday && (
            <span className="absolute top-0 right-0 w-3 h-3 bg-red-500 border-2 border-zinc-900 rounded-full animate-pulse" />
          )}
        </motion.div>
      )}

      {/* WIDGET MODAL OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-none rounded-3xl"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 z-10 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-zinc-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-full">
                <div id="daily-checkin-card" className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-900 to-[#121217] border border-zinc-800 shadow-2xl p-4 sm:p-5">
                  {/* Subtle decorative glow */}
        <div className="absolute -top-16 -right-16 w-36 h-36 bg-red-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top bar: Title + Streaks + Balances */}
        <div className="flex flex-wrap items-center justify-between gap-2.5 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-red-600 to-amber-600 flex items-center justify-center text-white shadow-md shadow-red-600/20">
              <Gift className="w-5 h-5 text-white animate-bounce" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm sm:text-base font-black text-white tracking-tight">
                  Kunlik Kirish Bonusi
                </h3>
                {status.currentStreak > 0 && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-950/70 border border-amber-800/80 px-2 py-0.5 rounded-full">
                    <Flame className="w-3 h-3 fill-amber-400 text-amber-400" />
                    <span>{status.currentStreak} kun</span>
                  </span>
                )}
              </div>
              <p className="text-[11px] text-zinc-400">
                Har kuni kirib bepul ko'rish tokeni va bonuslarni oling!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* User Token & Bonus balance indicators */}
            <div className="flex items-center gap-1.5 bg-zinc-950/80 border border-zinc-800 px-2.5 py-1 rounded-xl text-xs font-bold text-zinc-200">
              <Ticket className="w-3.5 h-3.5 text-amber-400" />
              <span>{user.accessTokens || 0}</span>
              <span className="text-[10px] text-zinc-500 font-normal">token</span>
            </div>

            {(user.bonusBalance || 0) > 0 && (
              <div className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-800 px-2.5 py-1 rounded-xl text-xs font-bold text-emerald-400">
                <Coins className="w-3.5 h-3.5" />
                <span>{(user.bonusBalance || 0).toLocaleString()}</span>
                <span className="text-[10px] text-zinc-500 font-normal">so'm</span>
              </div>
            )}

            <button
              onClick={() => setShowInfoModal(true)}
              className="p-1.5 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800 transition"
              title="Qanday ishlaydi?"
            >
              <HelpCircle className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 7-Days Reward Progression Track */}
        <div className="grid grid-cols-4 grid-rows-2 gap-1.5 sm:gap-2 mb-4">
          {status.allRewards.map((reward) => {
            const dayNum = reward.day;
            const isClaimed = status.isClaimedToday
              ? dayNum <= status.nextDayToClaim
              : dayNum < status.nextDayToClaim;
            const isToday = !status.isClaimedToday && dayNum === status.nextDayToClaim;
            const isFinalVipDay = dayNum === 7;

            return (
              <div
                key={dayNum}
                className={`relative rounded-xl p-1.5 sm:p-2 flex flex-col items-center justify-center text-center transition duration-200 ${
                  isFinalVipDay ? 'col-start-4 row-start-1 row-span-2' : ''
                } ${
                  isClaimed
                    ? 'bg-zinc-950/50 border border-emerald-900/60 opacity-80'
                    : isToday
                    ? 'bg-gradient-to-b from-red-950/70 to-zinc-900 border-2 border-red-500 shadow-lg shadow-red-600/20 scale-[1.03] z-10'
                    : isFinalVipDay
                    ? 'bg-gradient-to-b from-amber-950/30 to-zinc-950 border border-amber-700/60'
                    : 'bg-zinc-950/80 border border-zinc-800/80'
                }`}
              >
                {/* Day Header */}
                <span className={`text-[9px] font-bold mb-1 ${
                  isToday ? 'text-red-400' : isClaimed ? 'text-emerald-400' : isFinalVipDay ? 'text-amber-400' : 'text-zinc-500'
                }`}>
                  {dayNum}-kun
                </span>

                {/* Reward Visual */}
                <div className={`my-1 flex items-center justify-center ${isFinalVipDay ? 'scale-125' : ''}`}>
                  {isClaimed ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 fill-emerald-950" />
                  ) : (
                    getRewardIcon(reward.type)
                  )}
                </div>

                {/* Reward Value */}
                <span className={`text-[9px] sm:text-[10px] font-extrabold truncate max-w-full leading-tight mt-1 ${
                  isClaimed
                    ? 'text-zinc-500'
                    : isToday
                    ? 'text-white'
                    : isFinalVipDay
                    ? 'text-amber-300'
                    : 'text-zinc-400'
                }`}>
                  {reward.type === 'tokens'
                    ? `+${reward.amount} Token`
                    : reward.type === 'vip_discount'
                    ? '10% VIP'
                    : reward.type === 'bonus'
                    ? `${reward.amount >= 1000 ? reward.amount / 1000 + 'k' : reward.amount}`
                    : 'VIP'}
                </span>

                {/* Status indicator bottom badge */}
                <div className="mt-1">
                  {isClaimed ? (
                    <span className="text-[8px] font-bold text-emerald-500 uppercase">Olindi</span>
                  ) : isToday ? (
                    <span className="text-[8px] font-black text-red-400 uppercase animate-pulse">Bugun</span>
                  ) : (
                    <Lock className="w-2.5 h-2.5 text-zinc-600" />
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Claim Action or Status Bar */}
        <div className="pt-1">
          {status.isClaimedToday ? (
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-zinc-950/90 border border-zinc-800 text-xs text-zinc-300">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <div>
                  <span className="font-bold text-white">Bugungi bonus olindi! </span>
                  <span className="text-zinc-400 hidden sm:inline">Ertaga yana kiring.</span>
                </div>
              </div>

              <div className="flex items-center gap-1 text-[10px] font-mono text-zinc-400 bg-zinc-900 px-2 py-1 rounded-lg border border-zinc-800">
                <Clock className="w-3 h-3 text-amber-400" />
                <span>~{status.hoursUntilNextCheckIn} soat</span>
              </div>
            </div>
          ) : (
            <button
              id="claim-daily-reward-btn"
              type="button"
              onClick={handleClaim}
              disabled={isClaiming}
              className="w-full py-2 px-3 rounded-lg bg-gradient-to-r from-red-600 via-red-600 to-amber-600 hover:from-red-500 hover:to-amber-500 text-white font-bold text-[13px] shadow-md shadow-red-600/25 flex items-center justify-center gap-1.5 transition duration-200 transform hover:scale-[1.01] active:scale-[0.99]"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-spin" />
              <span>
                {isClaiming
                  ? 'Qabul qilinmoqda...'
                  : `🎁 Bonusni Olish: ${status.currentReward.title}`}
              </span>
              <ChevronRight className="w-3.5 h-3.5 text-white" />
            </button>
          )}
        </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* REWARD CELEBRATION MODAL */}
      {showCelebration && claimedReward && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
          <div className="relative w-full max-w-sm rounded-3xl bg-gradient-to-b from-zinc-900 to-[#121218] border border-red-600/40 p-6 text-center shadow-2xl">
            {/* Close button */}
            <button
              onClick={() => setShowCelebration(false)}
              className="absolute top-4 right-4 p-2 rounded-full bg-zinc-800/80 text-zinc-400 hover:text-white transition"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Glowing Icon */}
            <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-gradient-to-tr from-red-600 to-amber-500 flex items-center justify-center shadow-xl shadow-red-600/40 transform hover:rotate-6 transition">
              {getRewardIcon(claimedReward.type, true)}
            </div>

            <div className="inline-flex items-center gap-1 text-xs font-black text-amber-400 bg-amber-950/80 border border-amber-800 px-3 py-1 rounded-full mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>KUNLIK BONUS BERILDI!</span>
            </div>

            <h3 className="text-xl font-black text-white mb-1">
              {claimedReward.title}
            </h3>

            <p className="text-xs text-zinc-400 mb-5 leading-relaxed">
              {claimedReward.description}
            </p>

            {/* Token details info card */}
            <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800 text-left mb-5 space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Jami Bepul Tokenlar:</span>
                <span className="font-extrabold text-amber-400 flex items-center gap-1">
                  <Ticket className="w-3 h-3" />
                  {user.accessTokens || 0} ta
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-zinc-400">Bonus Balans:</span>
                <span className="font-extrabold text-emerald-400 flex items-center gap-1">
                  <Coins className="w-3 h-3" />
                  {(user.bonusBalance || 0).toLocaleString()} UZS
                </span>
              </div>
              {claimedReward.type === 'vip_discount' && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800">
                  <span className="text-zinc-400">VIP Chegirma:</span>
                  <span className="font-extrabold text-amber-300">10% Chegirma Faol!</span>
                </div>
              )}
              {claimedReward.type === 'vip_hours' && (
                <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800">
                  <span className="text-zinc-400">VIP Maqomi:</span>
                  <span className="font-extrabold text-amber-300">24 Soat Faol!</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setShowCelebration(false)}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 font-black text-white text-xs shadow-lg shadow-red-600/30 transition"
            >
              Ajoyib, Rahmat!
            </button>
          </div>
        </div>
      )}

      {/* HOW IT WORKS INFO MODAL */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="relative w-full max-w-md rounded-3xl bg-zinc-900 border border-zinc-800 p-6 text-left shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-4">
              <div className="flex items-center gap-2">
                <Gift className="w-5 h-5 text-red-500" />
                <h3 className="text-base font-black text-white">
                  Kunlik Kirish Qoidalari
                </h3>
              </div>
              <button
                onClick={() => setShowInfoModal(false)}
                className="p-1.5 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs text-zinc-300">
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <Ticket className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white mb-0.5">Har kuni 1 ta Token</h4>
                  <p className="text-zinc-400">
                    Har kuni saytga kirganingizda 1 ta qism ochish tokeni olasiz. 1 ta token faqat tanlangan serialning 1 ta qismini (masalan, 10-qism yoki 20-qismni) ochadi. Qolgan seriallarga va serialning boshqa qismlariga o'tmaydi.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-zinc-950 border border-zinc-800">
                <Percent className="w-5 h-5 text-amber-300 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-white mb-0.5">7-kunga Yetganda 10% VIP Chegirma</h4>
                  <p className="text-zinc-400">
                    Ketma-ket 7-kunga yetganingizda, faqat VIP obunaga 10% chegirma beriladi va hisobingizga qo'shimcha 1 ta token qo'shiladi!
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-red-950/30 border border-red-900/50">
                <Flame className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-red-300 mb-0.5">Qat'iy Qoida: 1 Kun Kirmasangiz Nolga Tushadi</h4>
                  <p className="text-zinc-400">
                    Agarda biror kun saytga kirmasangiz, barcha ketma-ketlik (streak) darhol 0 ga tushib qoladi va 1-kundan qaytadan boshlanadi!
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-5 flex gap-2">
              {onOpenVip && (
                <button
                  onClick={() => {
                    setShowInfoModal(false);
                    onOpenVip();
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold transition"
                >
                  VIP Tariflar
                </button>
              )}
              <button
                onClick={() => setShowInfoModal(false)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold transition"
              >
                Tushunarli
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
