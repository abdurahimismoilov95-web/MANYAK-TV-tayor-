import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  Sparkles,
  Phone,
  ShieldCheck,
  Send,
  Headphones,
  CheckCircle2,
  Clock,
  ChevronRight,
  Gift,
  Film,
  ExternalLink,
  Shield,
  UserCheck,
  ShoppingBag,
  Ticket,
  Coins,
  Flame,
  AlertTriangle,
  BellRing,
  X,
  Zap,
  ArrowRight,
  Bot,
  Trash2,
  ImagePlus,
} from 'lucide-react';
import { UserProfile, SystemSettings, ContentItem } from '../types';
import { validatePromoCode, clearWatchHistory, saveStoredCurrentUser, uploadFileToServer } from '../services/storage';

interface ProfileViewProps {
  user: UserProfile;
  settings: SystemSettings;
  contents: ContentItem[];
  isAdmin: boolean;
  onOpenAdmin: () => void;
  onOpenVip: () => void;
  onOpenVerifyPhone: () => void;
  onOpenTelegramAuth?: () => void;
  onSelectContent: (item: ContentItem) => void;
  onOpenPayment?: (content?: ContentItem) => void;
  onRefreshUser: () => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  settings,
  contents,
  isAdmin,
  onOpenAdmin,
  onOpenVip,
  onOpenVerifyPhone,
  onOpenTelegramAuth,
  onSelectContent,
  onOpenPayment,
  onRefreshUser,
}) => {
  const botUsername = (settings.botUsername || 'Manyaktvbot').replace('@', '');
  const [promoInput, setPromoInput] = useState('');
  const [promoResult, setPromoResult] = useState<string | null>(null);

  // Switch demo account tester state
  const [customIdInput, setCustomIdInput] = useState('');

  // Toast notification state: user can dismiss toast, but it re-evaluates when user state changes
  const [isToastDismissed, setIsToastDismissed] = useState(false);

  // Calculate VIP remaining days & expiring notification condition (3 days or less)
  let vipRemainingDays = 0;
  let vipRemainingHours = 0;
  let isExpiringSoon = false; // <= 3 days left
  if (user.isVip && user.vipExpiresAt) {
    const diff = new Date(user.vipExpiresAt).getTime() - Date.now();
    if (diff > 0) {
      vipRemainingDays = Math.max(1, Math.ceil(diff / (1000 * 60 * 60 * 24)));
      vipRemainingHours = Math.max(1, Math.ceil(diff / (1000 * 60 * 60)));
      if (vipRemainingDays <= 3) {
        isExpiringSoon = true;
      }
    }
  }

  // Reset toast dismissal state when user changes
  useEffect(() => {
    setIsToastDismissed(false);
  }, [user.id, user.vipExpiresAt]);

  // Get purchased contents
  const purchasedItems = contents.filter((c) =>
    user.purchasedContentIds?.includes(c.id)
  );

  const handleApplyPromo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!promoInput.trim()) return;
    const res = validatePromoCode(promoInput);
    if (res.valid) {
      setPromoResult(`Muvaffaqiyatli! ${res.discountPercent}% chegirma kodi faollashtirildi. To'lovda avtomatik chegirma beriladi.`);
    } else {
      setPromoResult(res.message);
    }
  };

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isAvatarUploading, setIsAvatarUploading] = useState(false);
  const [avatarError, setAvatarError] = useState<string | null>(null);

  const handleClearCache = () => {
    if (window.confirm("Keshni va ko'rishlar tarixini tozalashni xohlaysizmi? Bu qurilmangizdagi joyni bo'shatadi.")) {
      // 1. Clear Watch History from DB/Storage
      clearWatchHistory(user.id);

      // 2. Clear other temporary localStorage items (progress, temporary states)
      const keysToRemove: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && (key.startsWith('manyak_progress_') || key.startsWith('manyak_last_') || key === 'manyak_viewed_shorts')) {
          keysToRemove.push(key);
        }
      }
      keysToRemove.forEach(k => localStorage.removeItem(k));

      alert("Kesh va ko'rishlar tarixi muvaffaqiyatli tozalandi!");
      
      // Dispatch an event so other components (like HistoryView) refresh if needed
      window.dispatchEvent(new CustomEvent('manyak_storage_update'));
      onRefreshUser();
    }
  };

  // ═══ AVATAR: base64 -> serverga yuklash ═══
  // ESKI KOD rasmni `readAsDataURL` bilan base64 qilib localStorage'ga
  // yozardi — chek rasmi bilan bir xil muammo: katta rasm ~5 MB kvotani
  // yorib, avatar (va ba'zan butun profil yozuvi) jimgina saqlanmasdi.
  // Bundan tashqari avatar faqat shu qurilmada ko'rinardi.
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const input = e.target;
    const file = input.files?.[0];
    if (!file) return;

    setAvatarError(null);

    if (file.size > 8 * 1024 * 1024) {
      setAvatarError('Rasm juda katta (maksimal 8 MB).');
      input.value = '';
      return;
    }

    setIsAvatarUploading(true);
    try {
      const url = await uploadFileToServer(file);
      // Avatar — zararsiz profil maydoni, shuning uchun uni klient
      // yangilashi mumkin; server `/api/sync-user` orqali qabul qiladi
      // (u SERVER_OWNED_USER_FIELDS ro'yxatida emas).
      saveStoredCurrentUser({ ...user, avatarUrl: url });
      onRefreshUser();
    } catch (err) {
      setAvatarError(
        err instanceof Error ? `Rasmni yuklab bo'lmadi: ${err.message}` : "Rasmni yuklab bo'lmadi."
      );
    } finally {
      setIsAvatarUploading(false);
      input.value = '';
    }
  };

  return (
    <div className="p-4 pb-28 space-y-5 max-w-2xl mx-auto">
      {/* 0. Expiring Subscription Warning Toast (Triggered when 3 days or less remain) */}
      {isExpiringSoon && !isToastDismissed && (
        <div className="sticky top-2 z-40 w-full animate-in fade-in slide-in-from-top-4 duration-300">
          <div className="p-4 rounded-2xl bg-gradient-to-r from-[#1e140a] via-[#16131c] to-[#1c0d0d] border-2 border-amber-500/80 shadow-2xl shadow-amber-950/60 backdrop-blur-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative overflow-hidden">
            {/* Ambient pulse effect */}
            <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-500 p-0.5 shadow-lg shadow-amber-500/30 flex-shrink-0">
                <div className="w-full h-full rounded-[10px] bg-zinc-950 flex items-center justify-center text-amber-400">
                  <BellRing className="w-5 h-5 animate-bounce" />
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-xs font-black text-amber-400 tracking-wide flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    OBUNA TUGAMOQDA!
                  </span>
                  <span className="text-[10px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full animate-pulse">
                    {vipRemainingDays === 1 ? '1 kun qoldi' : `${vipRemainingDays} kun qoldi`}
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed">
                  Premyera filmlar, seriallar va vertikal short dramalarni to'xtovsiz ko'rishda davom etish uchun VIP obunani hoziroq uzaytiring!
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto justify-end pt-1 sm:pt-0">
              <button
                onClick={onOpenVip}
                className="flex-1 sm:flex-initial px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 via-amber-400 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/30 transition flex items-center justify-center gap-1.5 active:scale-95"
              >
                <Zap className="w-4 h-4 fill-zinc-950" />
                <span>Hoziroq Uzaytirish</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>

              <button
                onClick={() => setIsToastDismissed(true)}
                className="p-2 rounded-xl text-zinc-400 hover:text-white hover:bg-zinc-800/80 transition"
                title="Yopish"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 1. User Header Card */}
      <div className="p-4 rounded-3xl bg-gradient-to-b from-zinc-900 via-zinc-900/90 to-[#121216] border border-zinc-800/80 shadow-xl flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 w-full min-w-0">
          {/* Avatar Area with Upload */}
          <div className="relative cursor-pointer group flex-shrink-0" onClick={() => fileInputRef.current?.click()} title="Rasmni o'zgartirish">
            <input type="file" accept="image/*" hidden ref={fileInputRef} onChange={handleAvatarChange} />
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-red-600 via-red-700 to-amber-600 flex items-center justify-center text-white text-lg font-extrabold shadow-lg shadow-red-600/30 overflow-hidden relative border border-zinc-800">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span>{user.firstName ? user.firstName.charAt(0).toUpperCase() : 'U'}</span>
              )}
              {/* Overlay: yuklanmoqda yoki hover */}
              {isAvatarUploading ? (
                <div className="absolute inset-0 bg-black/75 flex items-center justify-center">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex flex-col items-center justify-center transition-opacity">
                  <ImagePlus className="w-4 h-4 text-white" />
                </div>
              )}
            </div>
            {user.isVip && (
              <div className="absolute -bottom-1 -right-1 bg-amber-500 rounded-full p-1 ring-2 ring-[#121216] shadow">
                <Crown className="w-2.5 h-2.5 text-zinc-950 fill-zinc-950" />
              </div>
            )}
          </div>

          {/* Avatar yuklash xatosi — ilgari xatolar jimgina yo'qolardi */}
          {avatarError && (
            <div className="absolute left-4 right-4 -bottom-2 translate-y-full z-10 p-2 rounded-lg bg-red-950/90 border border-red-800 text-[11px] text-red-300">
              {avatarError}
            </div>
          )}

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="text-sm sm:text-base font-black text-white truncate">
                {user.firstName} {user.lastName || ''}
              </h3>
              {isAdmin && (
                <span className="text-[9px] font-extrabold bg-red-950 text-red-400 border border-red-800 px-1.5 py-0.5 rounded uppercase">
                  ADMIN
                </span>
              )}
            </div>

            <div className="text-[10px] text-zinc-400 font-mono mt-0.5 truncate">
              ID: {user.id} {user.username && <span className="hidden sm:inline">• @{user.username}</span>}
            </div>

            {/* Phone / Bot Verification Status */}
            <div className="mt-1">
              {user.isPhoneVerified ? (
                <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-1.5 py-0.5 rounded">
                  <ShieldCheck className="w-3 h-3" />
                  <span className="truncate max-w-[120px] sm:max-w-none">Tasdiqlangan {user.phone ? `(${user.phone})` : ''}</span>
                </span>
              ) : (
                <button
                  onClick={onOpenVerifyPhone}
                  className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded hover:border-amber-500 transition active:scale-95"
                >
                  <Bot className="w-3 h-3 text-red-400" />
                  <span>Tasdiqlash</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Quick VIP Action */}
        <button
          onClick={onOpenVip}
          className={`w-12 h-12 flex-shrink-0 rounded-2xl flex flex-col items-center justify-center transition border ${
            user.isVip
              ? 'bg-amber-500/10 border-amber-500/40 text-amber-300'
              : 'bg-red-600/10 border-red-600/40 text-red-400 hover:bg-red-600 hover:text-white'
          }`}
        >
          <Crown className="w-4 h-4" />
          <span className="text-[8px] font-black mt-1 uppercase tracking-wider">
            {user.isVip ? 'VIP' : 'Olish'}
          </span>
        </button>
      </div>

      {/* 2. VIP Subscription Status & Countdown Monitor (Explicitly requested) */}
      <div className="p-4 rounded-3xl bg-gradient-to-br from-[#15151c] to-[#121216] border border-zinc-800 relative overflow-hidden shadow-lg">
        {/* Glow effect */}
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-amber-500/10 rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Crown className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-black text-white">VIP Obuna</h4>
          </div>

          <span
            className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
              user.isVip
                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {user.isVip ? 'FAOL' : 'NOFAOL'}
          </span>
        </div>

        {user.isVip ? (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-400" />
                <div>
                   <div className="text-[10px] text-zinc-400">Qolgan muddat:</div>
                   <div className="text-sm font-black text-white">{vipRemainingDays} kun</div>
                </div>
              </div>

              <div className="text-right">
                <div className="text-[10px] text-zinc-400">Tugash sanasi:</div>
                <div className="text-[11px] font-bold text-zinc-300">
                  {user.vipExpiresAt
                    ? new Date(user.vipExpiresAt).toLocaleDateString('uz-UZ', {
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                      })
                    : 'Cheksiz'}
                </div>
              </div>
            </div>

            {isExpiringSoon && (
              <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-950/80 to-red-950/60 border border-amber-500/60 flex items-center justify-between gap-3 shadow-md">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400 animate-pulse flex-shrink-0" />
                  <div className="text-[11px] font-black text-amber-300">
                    {vipRemainingDays} kundan so'ng tugaydi!
                  </div>
                </div>
                <button
                  onClick={onOpenVip}
                  className="px-3 py-1 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-zinc-950 font-black text-[10px] shadow whitespace-nowrap transition active:scale-95 flex items-center gap-1"
                >
                  <Zap className="w-3 h-3 fill-zinc-950" />
                  <span>Yangilash</span>
                </button>
              </div>
            )}

            <p className="text-xs text-zinc-400">
              Sizda barcha kino, serial va vertikal short dramalar to'liq ochiq!
            </p>

            <button
              onClick={onOpenVip}
              className={`w-full py-3 px-4 rounded-xl font-black text-xs shadow-md transition flex items-center justify-center gap-2 ${
                isExpiringSoon
                  ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-red-600 hover:from-amber-400 hover:to-orange-400 text-white shadow-amber-500/25'
                  : 'bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-zinc-950'
              }`}
            >
              <Zap className="w-4 h-4 fill-current" />
              <span>
                {isExpiringSoon
                  ? "VIP Obunani Hoziroq Uzaytirish (39,000 so'm)"
                  : 'Obunani Muddatini Uzaytirish'}
              </span>
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-zinc-400">
              VIP obuna bilan barcha pullik premyeralar, seriallar va vertikal short dramalarni 1 oylik cheksiz tomosha qiling.
            </p>
            <button
              onClick={onOpenVip}
              className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>1 Oylik VIP Obunani Faollashtirish (39,000 so'm)</span>
            </button>
          </div>
        )}
      </div>

      {/* 2.1 Daily Check-in & Tokens Wallet */}
      <div className="p-5 rounded-3xl bg-zinc-900/90 border border-zinc-800 shadow-lg space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Gift className="w-5 h-5 text-red-500" />
            <h4 className="text-sm font-black text-white">Kunlik Kirish & Balans</h4>
          </div>
          {user.dailyCheckIn?.streak ? (
            <span className="inline-flex items-center gap-1 text-[11px] font-black text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2.5 py-0.5 rounded-full">
              <Flame className="w-3 h-3 fill-amber-400" />
              <span>{user.dailyCheckIn.streak} kunlik seriya</span>
            </span>
          ) : (
            <span className="text-[11px] text-zinc-500 font-medium">Boshlang'ich</span>
          )}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
              <Ticket className="w-4 h-4 text-amber-400" />
              <span>Ko'rish Tokenlari</span>
            </div>
            <div className="text-xl font-black text-amber-400">
              {user.accessTokens || 0} <span className="text-xs text-zinc-400 font-bold">ta</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              1 token = 1 ta pullik film yoki qismni tekinga ochish
            </p>
          </div>

          <div className="p-3.5 rounded-2xl bg-zinc-950/80 border border-zinc-800/80">
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mb-1">
              <Coins className="w-4 h-4 text-emerald-400" />
              <span>Bonus Balans</span>
            </div>
            <div className="text-xl font-black text-emerald-400">
              {(user.bonusBalance || 0).toLocaleString()} <span className="text-xs text-zinc-400 font-bold">UZS</span>
            </div>
            <p className="text-[10px] text-zinc-500 mt-1">
              Xarid va obunada chegirma sifatida hisoblanadi
            </p>
          </div>
        </div>
      </div>

      {/* 3. My Purchased Dramas (Single Content Purchases) */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Film className="w-4 h-4 text-red-500" />
            <h4 className="text-sm font-bold text-white">Xarid Qilingan Dramalarim</h4>
          </div>
          <span className="text-xs text-zinc-400 font-bold">
            {purchasedItems.length} ta
          </span>
        </div>

        {purchasedItems.length === 0 ? (
          <p className="text-xs text-zinc-500">
            Alohida xarid qilingan dramalar yo'q. VIP obuna bo'lsa hamma filmlar avtomatik ochiq bo'ladi.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {purchasedItems.map((item) => (
              <div
                key={item.id}
                onClick={() => onSelectContent(item)}
                className="p-2.5 rounded-xl bg-zinc-950 border border-zinc-800 hover:border-zinc-700 cursor-pointer transition flex items-center gap-3"
              >
                <img
                  src={item.posterUrl}
                  alt={item.title}
                  className="w-10 h-14 object-cover rounded-lg"
                />
                <div className="min-w-0 flex-1">
                  <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>
                  <div className="text-[10px] text-emerald-400 font-bold mt-0.5">
                    To'liq ochilgan
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-zinc-500" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 3.5. Individual Movie & Series Store (Requested by user: Yangi chiqqan serial birinchi bo'lib turadi) */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-4 h-4 text-amber-400" />
            <h4 className="text-sm font-bold text-white">Filmlar & Seriallarni Alohida Sotib Olish</h4>
          </div>
          <span className="text-[10px] bg-amber-950 text-amber-400 border border-amber-800/80 px-2 py-0.5 rounded font-mono font-bold">
            Yangi chiqqanlar birinchi
          </span>
        </div>
        <p className="text-xs text-zinc-400">
          Butun ilovaga obuna olmasdan faqat o'zingiz yoqtirgan serial yoki kinoni alohida arzon narxda sotib olishingiz mumkin.
        </p>

        {/* Content list with newest featured on top (#1 in store) */}
        <div className="space-y-2 max-h-80 overflow-y-auto pr-1">
          {[...contents]
            .sort((a, b) => {
              if (a.isFeaturedStore && !b.isFeaturedStore) return -1;
              if (!a.isFeaturedStore && b.isFeaturedStore) return 1;
              return new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();
            })
            .map((item, idx) => {
              const price = item.price || 15000;
              const isUnlocked =
                user.isVip ||
                user.purchasedContentIds?.includes(item.id) ||
                !item.isPremium ||
                item.price === 0;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                    idx === 0 || item.isFeaturedStore
                      ? 'bg-gradient-to-r from-red-950/40 via-zinc-900 to-zinc-950 border-red-800/60 ring-1 ring-red-700/30'
                      : 'bg-zinc-950/80 border-zinc-800/90 hover:border-zinc-700'
                  }`}
                >
                  <div
                    onClick={() => onSelectContent(item)}
                    className="flex items-center gap-3 min-w-0 cursor-pointer flex-1"
                  >
                    <div className="relative flex-shrink-0">
                      <img
                        src={item.posterUrl}
                        alt={item.title}
                        className="w-11 h-14 object-cover rounded-lg"
                      />
                      {(idx === 0 || item.isFeaturedStore) && (
                        <span className="absolute -top-1.5 -left-1.5 bg-amber-500 text-zinc-950 text-[8px] font-black px-1.5 py-0.2 rounded-full shadow">
                          #1
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>
                        <span className="text-[9px] bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded font-semibold uppercase">
                          {item.type === 'series' ? 'Serial' : item.type === 'anime_series' ? 'Anime' : item.type === 'short_drama' ? 'Mini Drama' : 'Kino'}
                        </span>
                        {(idx === 0 || item.isFeaturedStore) && (
                          <span className="text-[8px] bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded font-black uppercase">
                            Yangi Premyera
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5 flex items-center gap-2">
                        <span>{item.year || 2025}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-black font-mono">
                          {price.toLocaleString()} so'm
                        </span>
                      </div>
                    </div>
                  </div>

                <div className="flex-shrink-0">
                  {isUnlocked ? (
                    <button
                      onClick={() => onSelectContent(item)}
                      className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-700 text-emerald-300 text-xs font-bold hover:bg-emerald-900 transition flex items-center gap-1"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      <span>Ko'rish</span>
                    </button>
                  ) : (
                    <button
                      onClick={() => {
                        if (onOpenPayment) {
                          onOpenPayment(item);
                        } else {
                          onOpenVip();
                        }
                      }}
                      className="px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-black shadow-md shadow-red-600/30 transition flex items-center gap-1.5"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                      <span>Sotib olish</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. Promo Code Redemption */}
      <div className="p-4 rounded-2xl bg-zinc-900/80 border border-zinc-800">
        <div className="flex items-center gap-2 mb-2">
          <Gift className="w-4 h-4 text-amber-400" />
          <h4 className="text-sm font-bold text-white">Promokod Faollashtirish</h4>
        </div>
        <form onSubmit={handleApplyPromo} className="flex gap-2">
          <input
            type="text"
            placeholder="Kodni kiriting (Masalan: MANYK2025)"
            value={promoInput}
            onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
            className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white uppercase outline-none focus:border-red-500"
          />
          <button
            type="submit"
            className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white font-bold text-xs rounded-xl border border-zinc-700 transition"
          >
            Faollashtirish
          </button>
        </form>
        {promoResult && (
          <p className="text-xs text-emerald-400 font-semibold mt-2">{promoResult}</p>
        )}
      </div>

      {/* 5. Public Links: Telegram Channel, Official Bot & Admin Contact */}
      <div className="space-y-2">
        {/* Rasmiy Telegram Bot */}
        <a
          href={`https://t.me/${botUsername}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 flex items-center justify-between group transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Bot className="w-4 h-4" />
            </div>
            <div>
              <h5 className="text-xs font-bold text-white group-hover:text-purple-400 transition flex items-center gap-1.5">
                <span>Rasmiy Telegram Botimiz</span>
                <span className="text-[10px] bg-purple-950 text-purple-300 border border-purple-800 px-1.5 py-0.2 rounded font-mono">
                  @{botUsername}
                </span>
              </h5>
              <p className="text-[11px] text-zinc-400">Hisobni tasdiqlash va bildirishnomalar boti</p>
            </div>
          </div>
          <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white" />
        </a>

        {settings.telegramChannelUrl && (
          <a
            href={settings.telegramChannelUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 flex items-center justify-between group transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
                <Send className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white group-hover:text-sky-400 transition">
                  Rasmiy Telegram Kanalimiz
                </h5>
                <p className="text-[11px] text-zinc-400">Yangi premyeralar va yangiliklar</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white" />
          </a>
        )}

        {settings.adminContactUrl && (
          <a
            href={settings.adminContactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 flex items-center justify-between group transition"
          >
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <Headphones className="w-4 h-4" />
              </div>
              <div>
                <h5 className="text-xs font-bold text-white group-hover:text-emerald-400 transition">
                  Adminga Murojaat (Yordam)
                </h5>
                <p className="text-[11px] text-zinc-400">To'lov va savollar bo'yicha 24/7 yordam</p>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-zinc-500 group-hover:text-white" />
          </a>
        )}
      </div>

      {/* 5.5 App Settings & Data */}
      <div className="space-y-2">
        <button
          onClick={handleClearCache}
          className="w-full p-3.5 rounded-2xl bg-zinc-900/80 hover:bg-zinc-850 border border-zinc-800 flex items-center justify-between group transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-500/10 text-red-400 flex items-center justify-center">
              <Trash2 className="w-4 h-4" />
            </div>
            <div className="text-left">
              <h5 className="text-xs font-bold text-white group-hover:text-red-400 transition">
                Keshni tozalash
              </h5>
              <p className="text-[11px] text-zinc-400">Tarix va vaqtinchalik xotirani tozalash</p>
            </div>
          </div>
          <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-red-400" />
        </button>
      </div>

      {/* 6. Admin Panel & Developer Tools - STRICTLY FOR VERIFIED ADMINS ONLY */}
      {isAdmin && (
        <div className="space-y-3 pt-2">
          {/* Admin Boshqaruv Paneli Card */}
          <div className="p-4 rounded-2xl border bg-red-950/40 border-red-800/80 transition shadow-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Shield className="w-5 h-5 text-red-400" />
                <div>
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-black text-white">Admin Boshqaruv Paneli</h4>
                    <span className="text-[9px] bg-red-600 text-white font-extrabold px-1.5 py-0.2 rounded">
                      FAOL
                    </span>
                  </div>
                  <p className="text-[11px] text-zinc-400">
                    Kino yuklash, to'lov cheklari, foydalanuvchilar va kataloglar boshqaruvi
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={onOpenAdmin}
                className="px-4 py-2 rounded-xl font-bold text-xs shadow-md transition bg-red-600 hover:bg-red-500 text-white active:scale-95"
              >
                Kirish
              </button>
            </div>
          </div>

          {/* Telegram profilini tasdiqlash tugmasi */}
          <div className="flex flex-col items-center gap-2">
            <div className="flex items-center justify-center gap-3 flex-wrap">
              {onOpenTelegramAuth && (
                <button
                  type="button"
                  onClick={onOpenTelegramAuth}
                  className="text-xs text-zinc-500 hover:text-blue-400 font-medium flex items-center gap-1 transition"
                >
                  <Bot className="w-3.5 h-3.5 text-blue-400" />
                  <span>Telegram Profil Orqali Tasdiqlash</span>
                </button>
              )}
            </div>

            {/* ═══ OLIB TASHLANGAN: "Hisobni almashtirish / Test rejim" paneli ═══
              *
              * Bu blokda 3 ta tugma bor edi va HAMMASI oddiy foydalanuvchiga
              * ko'rinardi:
              *   - handleSwitchAccount('891846690', 'Admin (891846690)')
              *     -> switchUserProfile() -> localStorage'ga Bosh Admin
              *        profilini yozardi -> isUserAdmin() true -> ADMIN PANELI
              *        OCHILARDI. Bu ilovadagi eng katta xavfsizlik teshigi edi.
              *   - handleSwitchAccount('77441199', ...) — boshqa odam profiliga
              *     kirish.
              *   - handleSimulateExpiringSoon() -> `isVip: true` bilan bepul
              *     2 kunlik VIP.
              *
              * Bu tugmalar ishlab chiqish (dev) uchun yozilgan, lekin
              * productionda ham qolib ketgan. Ular butunlay olib tashlandi.
              *
              * Adminlik endi FAQAT server tasdiqlagan JWT `isAdmin` claim'i
              * bilan beriladi (Telegram initData HMAC tekshiruvi orqali) —
              * qarang: services/storage.ts `isUserAdmin()`.
              */}
          </div>
        </div>
      )}
    </div>
  );
};
