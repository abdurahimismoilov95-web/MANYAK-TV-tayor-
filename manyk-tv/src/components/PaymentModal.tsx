import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Upload,
  Check,
  Tag,
  Copy,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Send,
  Bot,
  ExternalLink,
} from 'lucide-react';
import {
  SubscriptionPlan,
  ContentItem,
  UserProfile,
  SystemSettings,
} from '../types';
import {
  validatePromoCode,
  submitPaymentReceipt,
} from '../services/storage';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: UserProfile;
  settings: SystemSettings;
  plans: SubscriptionPlan[];
  targetContent?: ContentItem | null;
  availableContents?: ContentItem[];
  initialPlanId?: string;
  onSuccess: () => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  user,
  settings,
  plans,
  targetContent,
  availableContents = [],
  initialPlanId,
  onSuccess,
}) => {
  // Determine if buying single content or VIP
  const [purchaseMode, setPurchaseMode] = useState<'content' | 'vip'>(
    targetContent ? 'content' : 'vip'
  );
  const [selectedContentItem, setSelectedContentItem] = useState<ContentItem | null>(
    targetContent || null
  );
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    initialPlanId || plans[0]?.id || 'plan_1_month'
  );

  // Promo code
  const [promoInput, setPromoInput] = useState('');
  const [promoMessage, setPromoMessage] = useState<{ text: string; isError: boolean } | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [appliedPromo, setAppliedPromo] = useState<string>('');

  // Receipt upload form
  const [receiptImage, setReceiptImage] = useState<string>('');
  const [receiptNotes, setReceiptNotes] = useState('');
  const [copiedCard, setCopiedCard] = useState(false);
  const [copiedAmount, setCopiedAmount] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState<string | null>(null);
  const [isApprovedLive, setIsApprovedLive] = useState(false);

  // Reset or initialize on open
  useEffect(() => {
    if (isOpen) {
      setPurchaseMode(targetContent ? 'content' : 'vip');
      setSelectedContentItem(targetContent || null);
      if (initialPlanId) {
        setSelectedPlanId(initialPlanId);
      }
      setReceiptImage('');
      setReceiptNotes('');
      setSubmissionSuccess(null);
      setIsApprovedLive(false);
    }
  }, [isOpen, targetContent, initialPlanId]);

  // Real-time listener: if subscription is approved while modal is open (from Bot or Admin Panel)
  useEffect(() => {
    if (!isOpen) return;

    const handleApproved = (e: Event) => {
      const customEvent = e as CustomEvent<{ userId?: string; planName?: string }>;
      if (customEvent.detail?.userId === user.id) {
        setIsApprovedLive(true);
        setSubmissionSuccess(
          `🎉 TO'LOV TASDIQLANDI! Ham Telegram botga, ham ilovangizga tasdiqlash buyrug'i yetkazildi! VIP obunangiz faollashdi.`
        );
      }
    };

    window.addEventListener('manyak_subscription_approved', handleApproved);
    return () => {
      window.removeEventListener('manyak_subscription_approved', handleApproved);
    };
  }, [isOpen, user.id]);

  // Single purchase items available in the store
  const singlePurchaseItems = React.useMemo(() => {
    return [...availableContents]
      .filter((c) => c.isSinglePurchase || (c.price && c.price > 0) || c.isFeaturedStore)
      .sort((a, b) => {
        if (a.isFeaturedStore && !b.isFeaturedStore) return -1;
        if (!a.isFeaturedStore && b.isFeaturedStore) return 1;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [availableContents]);

  const activeContent = selectedContentItem || targetContent || singlePurchaseItems[0] || null;

  if (!isOpen) return null;

  // Calculate pricing
  let basePrice = 0;
  let targetTitle = '';

  if (purchaseMode === 'content' && activeContent) {
    basePrice = activeContent.individualPrice || activeContent.price || 15000;
    targetTitle = `${activeContent.type === 'movie' ? 'Kino' : (activeContent.type === 'series' || activeContent.type === 'anime_series') ? 'Serial' : 'Drama'}: "${activeContent.title}"`;
  } else {
    const plan = plans.find((p) => p.id === selectedPlanId) || plans[0];
    basePrice = plan ? plan.price : 39000;
    targetTitle = plan ? plan.name : 'VIP Obuna';
  }

  // 7-kunlik streak mukofoti: faqat VIP obuna uchun 10% chegirma!
  const vipBonusDiscount = (purchaseMode === 'vip' && (user.vipDiscountPercent || 0) > 0)
    ? (user.vipDiscountPercent || 10)
    : 0;
  const effectiveDiscountPercent = Math.max(discountPercent, vipBonusDiscount);
  const discountAmount = effectiveDiscountPercent > 0 ? Math.round((basePrice * effectiveDiscountPercent) / 100) : 0;
  const finalPrice = Math.max(0, basePrice - discountAmount);

  // Apply promo code
  const handleApplyPromo = () => {
    if (!promoInput.trim()) return;
    const result = validatePromoCode(promoInput);
    if (result.valid) {
      setDiscountPercent(result.discountPercent);
      setAppliedPromo(promoInput.trim().toUpperCase());
      setPromoMessage({ text: result.message, isError: false });
    } else {
      setDiscountPercent(0);
      setAppliedPromo('');
      setPromoMessage({ text: result.message, isError: true });
    }
  };

  // Copy card number
  const handleCopyCard = () => {
    navigator.clipboard.writeText(settings.cardPayment.cardNumber.replace(/\s+/g, ''));
    setCopiedCard(true);
    setTimeout(() => setCopiedCard(false), 2000);
  };

  // Copy payment amount
  const handleCopyAmount = () => {
    navigator.clipboard.writeText(String(finalPrice));
    setCopiedAmount(true);
    setTimeout(() => setCopiedAmount(false), 2000);
  };

  // Image upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setReceiptImage(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  // Submit receipt to admin queue & telegram bot
  const handleSubmitReceipt = (e: React.FormEvent) => {
    e.preventDefault();
    if (!receiptImage) {
      alert("Iltimos, to'lov chekining skrinshot rasmini yuklang");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      submitPaymentReceipt({
        userId: user.id,
        userName: `${user.firstName} ${user.lastName || ''}`.trim() || `Foydalanuvchi #${user.id}`,
        userPhone: user.phone,
        type: purchaseMode === 'content' ? 'single_content' : 'vip_subscription',
        planId: purchaseMode === 'vip' ? selectedPlanId : undefined,
        planName: purchaseMode === 'vip' ? targetTitle : undefined,
        contentId: purchaseMode === 'content' && activeContent ? activeContent.id : undefined,
        contentTitle: purchaseMode === 'content' && activeContent ? activeContent.title : undefined,
        amount: finalPrice,
        discountApplied: discountAmount,
        promoCodeUsed: appliedPromo || (vipBonusDiscount > 0 ? '7_KUNLIK_VIP_10%' : undefined),
        receiptImageUrl: receiptImage,
        notes: receiptNotes || undefined,
      });

      const botName = (settings.botUsername || 'Manyaktvbot').replace('@', '');
      setIsSubmitting(false);
      setSubmissionSuccess(
        `To'lov chekingiz qabul qilindi! Tasdiqlash buyrug'i @${botName} botiga va admin panelga yuborildi. Admin tasdiqlashi bilan obuna ilovada avtomatik ochiladi.`
      );
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-lg bg-[#121216] border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl my-auto animate-in fade-in zoom-in-95">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="mb-5">
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-red-500" />
            <h3 className="text-xl font-black text-white">To'lov va Obuna</h3>
          </div>
          <p className="text-xs text-zinc-400 mt-1">
            Rasmiy to'lov tizimi. Kartaga to'lov qiling va chekni yuklang.
          </p>
        </div>

        {/* Live Approved Banner / Celebration */}
        {isApprovedLive ? (
          <div className="p-6 rounded-2xl bg-gradient-to-b from-emerald-950/80 to-zinc-900 border border-emerald-500/80 text-center space-y-4 animate-in zoom-in-95">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/20 border border-emerald-400/50 flex items-center justify-center text-emerald-400">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">OBUNA TASDIQLANDI!</h4>
              <p className="text-xs text-emerald-300 mt-1 leading-relaxed">
                Ham Telegram botga, ham ilovangizga tasdiqlash buyrug'i keldi. Barcha filmlar va VIP imkoniyatlar ochildi!
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                onSuccess();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-sm shadow-lg shadow-emerald-600/30 transition"
            >
              Tomoshani Boshlash
            </button>
          </div>
        ) : submissionSuccess ? (
          /* Submission Pending Confirmation Screen */
          <div className="p-6 rounded-2xl bg-zinc-900/90 border border-zinc-800 text-center space-y-4 animate-in fade-in">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Send className="w-7 h-7 animate-pulse" />
            </div>
            <div>
              <h4 className="text-base font-black text-white">Chek Adminga Yuborildi</h4>
              <p className="text-xs text-zinc-300 mt-1.5 leading-relaxed">
                {submissionSuccess}
              </p>
            </div>
            <div className="p-3 rounded-xl bg-zinc-950 border border-zinc-800/80 text-[11px] text-zinc-400 text-left space-y-1.5">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Tasdiqlash jarayoni:</span>
              </div>
              <p>• Admin tasdiqlashi bilan <b>@{settings.botUsername || 'Manyaktvbot'}</b> orqali xabar olasiz.</p>
              <p>• Ilovadagi hisobingizga avtomatik <b>VIP obuna buyrug'i</b> o'rnatiladi.</p>
            </div>

            <a
              href={`https://t.me/${(settings.botUsername || 'Manyaktvbot').replace('@', '')}`}
              target="_blank"
              rel="noreferrer"
              className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-zinc-700"
            >
              <Bot className="w-3.5 h-3.5 text-blue-400" />
              <span>Botda tekshirish (@{settings.botUsername || 'Manyaktvbot'})</span>
              <ExternalLink className="w-3 h-3 text-zinc-400" />
            </a>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setSubmissionSuccess(null)}
                className="flex-1 py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition"
              >
                Qayta chek yuklash
              </button>
              <button
                type="button"
                onClick={() => {
                  onSuccess();
                  onClose();
                }}
                className="flex-1 py-2.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white font-bold text-xs transition"
              >
                Tushundim (Yopish)
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Purchase Mode toggle: Buy Single Content vs Full VIP */}
            <div className="grid grid-cols-2 gap-2 p-1 bg-zinc-900 rounded-xl mb-4 border border-zinc-800">
              <button
                type="button"
                onClick={() => setPurchaseMode('content')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  purchaseMode === 'content'
                    ? 'bg-red-600 text-white shadow-md'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <span>Alohida Serial/Film</span>
              </button>
              <button
                type="button"
                onClick={() => setPurchaseMode('vip')}
                className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                  purchaseMode === 'vip'
                    ? 'bg-amber-500 text-zinc-950 shadow-md font-black'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>To'liq VIP (Barchasi)</span>
              </button>
            </div>

            {/* SINGLE CONTENT SELECTION */}
            {purchaseMode === 'content' && (
              <div className="space-y-2 mb-4">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center justify-between">
                  <span>Sotib olinadigan serial yoki filmni tanlang:</span>
                  <span className="text-[10px] text-amber-400 font-bold">Alohida xarid</span>
                </label>

                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {singlePurchaseItems.map((item) => {
                    const isSelected = activeContent?.id === item.id;
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedContentItem(item)}
                        className={`relative p-2.5 rounded-xl border cursor-pointer transition flex items-center gap-3 ${
                          isSelected
                            ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500'
                            : 'bg-zinc-900/80 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <img
                          src={item.posterUrl}
                          alt={item.title}
                          className="w-12 h-16 object-cover rounded-lg flex-shrink-0 border border-zinc-800"
                        />
                        <div className="flex-1 min-w-0">
                          {item.isFeaturedStore && (
                            <div className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-amber-500/20 border border-amber-500/40 text-[9px] font-black text-amber-300 uppercase tracking-wider mb-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              <span>1-O'rinda: Yangi Premyera</span>
                            </div>
                          )}
                          <h5 className="text-xs font-bold text-white truncate">{item.title}</h5>
                          <div className="text-[11px] text-zinc-400 truncate">
                            {item.type === 'series' || item.type === 'anime_series' ? "Ko'p qismli serial" : item.type === 'short_drama' ? 'Short drama' : 'Film'} • {item.year}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-xs font-black text-red-400">
                              {(item.individualPrice || item.price || 15000).toLocaleString()} UZS
                            </span>
                            {item.isVipIncluded === false && (
                              <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-800/80 px-1 py-0.2 rounded font-bold">
                                VIP kirmaydi (Buy Now)
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="flex-shrink-0">
                          <div
                            className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                              isSelected
                                ? 'border-red-500 bg-red-600 text-white'
                                : 'border-zinc-700 bg-zinc-950'
                            }`}
                          >
                            {isSelected && <Check className="w-3 h-3 stroke-[3]" />}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* VIP Plans Selection */}
            {purchaseMode === 'vip' && (
              <div className="space-y-2 mb-4">
                <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider">
                  Tarifni tanlang:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  {plans.map((plan) => {
                    const isSelected = selectedPlanId === plan.id;
                    return (
                      <div
                        key={plan.id}
                        onClick={() => setSelectedPlanId(plan.id)}
                        className={`relative p-3 rounded-xl border cursor-pointer transition text-left ${
                          isSelected
                            ? 'bg-red-950/40 border-red-500 ring-1 ring-red-500'
                            : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        {plan.badge && (
                          <span className="text-[9px] font-black bg-red-600 text-white px-1.5 py-0.5 rounded-full absolute -top-2 right-2">
                            {plan.badge}
                          </span>
                        )}
                        <div className="text-xs font-bold text-white mb-0.5">{plan.name}</div>
                        <div className="text-sm font-black text-red-400">
                          {plan.price.toLocaleString()} so'm
                        </div>
                        {plan.originalPrice && (
                          <div className="text-[10px] text-zinc-500 line-through">
                            {plan.originalPrice.toLocaleString()} so'm
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 7-kunlik VIP 10% chegirma eslatmasi */}
            {purchaseMode === 'vip' && vipBonusDiscount > 0 && (
              <div className="p-3 bg-amber-950/40 border border-amber-500/60 rounded-xl flex items-center justify-between text-xs mb-4">
                <div className="flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                  <div>
                    <div className="font-bold text-amber-300">7 kunlik kirish bonusi: 10% VIP Chegirma!</div>
                    <div className="text-[11px] text-zinc-300">Ushbu VIP obunangizga avtomatik -10% chegirma qo'llandi.</div>
                  </div>
                </div>
                <span className="text-xs font-black text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-800 shrink-0">
                  -10%
                </span>
              </div>
            )}

            {/* Promo Code Box */}
            <div className="p-3 bg-zinc-900/90 rounded-xl border border-zinc-800/80 mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Tag className="w-4 h-4 text-red-400" />
                <span className="text-xs font-bold text-zinc-300">Chegirma promokodi bormi?</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Masalan: MANYK2025"
                  value={promoInput}
                  onChange={(e) => setPromoInput(e.target.value.toUpperCase())}
                  className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white uppercase placeholder:normal-case placeholder:text-zinc-500 outline-none focus:border-red-500"
                />
                <button
                  onClick={handleApplyPromo}
                  type="button"
                  className="px-3 py-1.5 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-lg border border-zinc-700 transition"
                >
                  Qo'llash
                </button>
              </div>
              {promoMessage && (
                <p
                  className={`text-[11px] mt-1.5 font-medium ${
                    promoMessage.isError ? 'text-red-400' : 'text-emerald-400'
                  }`}
                >
                  {promoMessage.text}
                </p>
              )}
            </div>

            {/* Total Price Summary */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-zinc-900 to-zinc-950 border border-zinc-800 mb-4">
              <div>
                <div className="text-xs text-zinc-400">To'lov miqdori:</div>
                <div className="text-xs font-medium text-zinc-300 truncate max-w-[200px]">
                  {targetTitle}
                </div>
              </div>
              <div className="text-right">
                {discountAmount > 0 && (
                  <div className="text-xs text-emerald-400 font-semibold line-through">
                    {basePrice.toLocaleString()} so'm
                  </div>
                )}
                <div className="text-lg font-black text-red-500">
                  {finalPrice.toLocaleString()} <span className="text-xs text-zinc-400">UZS</span>
                </div>
              </div>
            </div>

            {/* Receipt Submission Form */}
            <form onSubmit={handleSubmitReceipt} className="space-y-4">
              {/* Bank Card Box */}
              <div className="p-4 rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-red-950/30 border border-zinc-800 space-y-3">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span className="font-semibold text-zinc-300">{settings.cardPayment.bankName}</span>
                  <span className="text-zinc-400">{settings.cardPayment.cardHolder}</span>
                </div>

                {/* Card Number with Copy Button */}
                <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div>
                    <div className="text-[10px] text-zinc-500">Qabul qiluvchi karta raqami:</div>
                    <div className="font-mono text-base font-extrabold text-white tracking-wider">
                      {settings.cardPayment.cardNumber}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyCard}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition active:scale-95"
                  >
                    {copiedCard ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 text-xs font-bold">Nusxalandi</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-xs">Nusxalash</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Payment Amount with Copy Button */}
                <div className="flex items-center justify-between bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  <div>
                    <div className="text-[10px] text-zinc-500">To‘lanishi kerak bo‘lgan summa:</div>
                    <div className="font-mono text-base font-black text-red-400 tracking-wider">
                      {finalPrice.toLocaleString()} <span className="text-xs text-zinc-400 font-normal">so'm</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyAmount}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-medium transition active:scale-95"
                  >
                    {copiedAmount ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-emerald-400 text-xs font-bold">Nusxalandi</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span className="text-xs">Nusxalash</span>
                      </>
                    )}
                  </button>
                </div>

                <p className="text-[11px] text-zinc-400 mt-1 leading-relaxed">
                  {settings.cardPayment.instructions || "Kartaga to'lov qiling va pastda chek skrinshotini yuklang"}
                </p>
              </div>

              {/* VIP Perks Summary */}
              <div className="p-3 rounded-xl bg-zinc-900/60 border border-zinc-800 text-[11px] text-zinc-300 space-y-1">
                <div className="font-bold text-white flex items-center gap-1.5 text-xs text-amber-400 mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Obunachi imtiyozlari:</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span>Barcha 9:16 vertikal short dramalar va kinolarga to'liq kirish</span>
                </div>
                <div className="flex items-center gap-1.5 text-zinc-300">
                  <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                  <span>Cheksiz Full HD / 4K tomosha va hech qanday reklamalarsiz</span>
                </div>
              </div>

              {/* Receipt File Upload */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1.5">
                  To'lov chekini rasm qilib yuklang:
                </label>
                <div className="relative border-2 border-dashed border-zinc-700 hover:border-red-500/80 rounded-xl p-4 text-center cursor-pointer transition bg-zinc-900/50">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                  />
                  {receiptImage ? (
                    <div className="flex items-center justify-center gap-3">
                      <img
                        src={receiptImage}
                        alt="Chek"
                        className="w-16 h-16 object-cover rounded-lg border border-zinc-700"
                      />
                      <div className="text-left">
                        <span className="text-xs text-emerald-400 font-bold block">
                          Chek muvaffaqiyatli tanlandi!
                        </span>
                        <span className="text-[10px] text-zinc-400">
                          Boshqa rasm tanlash uchun bosing
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-2">
                      <Upload className="w-8 h-8 text-red-500 mb-1" />
                      <span className="text-xs font-medium text-zinc-300">
                        Chek skrinshotini bu yerga yuklang
                      </span>
                      <span className="text-[10px] text-zinc-500 mt-0.5">
                        JPG, PNG yoki Galereyadan tanlang
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Optional Notes */}
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Izoh yoki karta egasi ismi (ixtiyoriy):
                </label>
                <input
                  type="text"
                  value={receiptNotes}
                  onChange={(e) => setReceiptNotes(e.target.value)}
                  placeholder="Masalan: Click orqali o'tkazdim..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-zinc-500 outline-none focus:border-red-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting || !receiptImage}
                className="w-full py-3.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 disabled:opacity-50 disabled:hover:bg-red-600 active:scale-98 font-bold text-sm text-white shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <ShieldCheck className="w-4 h-4" />
                    <span>Chekni Adminga Yuborish</span>
                  </>
                )}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
