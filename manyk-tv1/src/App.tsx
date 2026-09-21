import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { VideoPlayerModal } from './components/VideoPlayerModal';
import { ContentDetailsModal } from './components/ContentDetailsModal';
import { PaymentModal } from './components/PaymentModal';
import { TelegramVerificationModal } from './components/TelegramVerificationModal';
import { TelegramAuthModal } from './components/TelegramAuthModal';
import { AdminPanel } from './components/AdminPanel';
import { ErrorBoundary } from './components/ErrorBoundary';
import { ShortsFeed } from './components/ShortsFeed';
import { HomeView } from './views/HomeView';
import { SearchView } from './views/SearchView';
import { HistoryView } from './views/HistoryView';
import { ProfileView } from './views/ProfileView';
import {
  HomeViewSkeleton,
  ShortsViewSkeleton,
  SearchViewSkeleton,
  HistoryViewSkeleton,
  ProfileViewSkeleton,
} from './components/SkeletonLoader';
import { SplashScreen } from './components/SplashScreen';

import {
  ContentItem,
  Episode,
  UserProfile,
  SubscriptionPlan,
  PromoCode,
  SystemSettings,
  PaymentReceipt,
} from './types';

import {
  getStoredContent,
  syncContentFromServer,
  getStoredSettings,
  getStoredPlans,
  getStoredPromoCodes,
  getStoredCurrentUser,
  getStoredReceipts,
  isUserAdmin,
  syncEntitlementsFromServer,
  switchUserProfile,
  saveStoredCurrentUser,
  saveStoredUser,
} from './services/storage';

import {
  checkAccessSecurity,
  getOrCreateDeviceFingerprint,
  initSecurityGuards,
} from './services/deviceSecurity';
import { getAuthHeaders, getBackendAuthToken } from './services/authToken';
import {
  registerDialogHandler,
  overrideBrowserDialogs,
  blockServiceWorkerPermissions,
  preventTelegramNotifications,
} from './utils/customDialogs';
import {
  ShieldAlert,
  AlertTriangle,
  Lock,
  ExternalLink,
  CheckCircle2,
  XCircle,
  Sparkles,
  X,
  Smartphone,
  Fingerprint,
  RotateCcw,
  Bot,
  ShieldCheck,
} from 'lucide-react';

export default function App() {
  // Navigation
  const [activeTab, setActiveTab] = useState<NavTab>('home');

  // Main Data States
  const [contents, setContents] = useState<ContentItem[]>([]);
  const [settings, setSettings] = useState<SystemSettings>(getStoredSettings());
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [receipts, setReceipts] = useState<PaymentReceipt[]>([]);
  const [user, setUser] = useState<UserProfile>(getStoredCurrentUser());

  // Modals
  const [activeVideoContent, setActiveVideoContent] = useState<ContentItem | null>(null);
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | undefined>(undefined);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [paymentTargetContent, setPaymentTargetContent] = useState<ContentItem | null>(null);
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);
  const [isTelegramAuthModalOpen, setIsTelegramAuthModalOpen] = useState(false);
  const [detailsModalContent, setDetailsModalContent] = useState<ContentItem | null>(null);

  // Custom Dialog State (sayt ichidagi dialog'lar uchun)
  const [customDialog, setCustomDialog] = useState<{
    type: 'alert' | 'confirm' | 'prompt';
    title: string;
    message: string;
    defaultValue?: string;
    onConfirm?: (value?: string) => void;
    onCancel?: () => void;
  } | null>(null);

  // Real-time payment notification toast state
  const [paymentToast, setPaymentToast] = useState<{
    id: string;
    type: 'success' | 'error';
    title: string;
    message: string;
  } | null>(null);

  // Skeleton loading states (with MANYAK TV branded animations)
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [isTabLoading, setIsTabLoading] = useState(false);

  const prevReceiptsRef = React.useRef<Map<string, string>>(new Map());

  // Smooth Tab Change with branded Skeleton transition
  const handleTabChange = useCallback((newTab: NavTab) => {
    if (newTab === activeTab) return;
    setIsTabLoading(true);
    setActiveTab(newTab);
    const timer = setTimeout(() => {
      setIsTabLoading(false);
    }, 220);
    return () => clearTimeout(timer);
  }, [activeTab]);

  // Auto-dismiss payment toast
  useEffect(() => {
    if (!paymentToast) return;
    const timer = setTimeout(() => {
      setPaymentToast(null);
    }, 6000);
    return () => clearTimeout(timer);
  }, [paymentToast]);

  // Refresh all state from storage AND server
  const refreshData = useCallback(async () => {
    console.log('[refreshData] Starting refresh...');
    
    // 1. LocalStorage'dan o'qish (tezkor ko'rsatish uchun)
    setContents(getStoredContent());
    setSettings(getStoredSettings());
    setPlans(getStoredPlans());
    setPromoCodes(getStoredPromoCodes());
    setReceipts(getStoredReceipts());
    const currentUser = getStoredCurrentUser();
    setUser(currentUser);
    if (!currentUser.isPhoneVerified) {
      setIsPhoneModalOpen(true);
    }
    
    // 2. Server'dan yangi ma'lumotlarni olish (sync qilish)
    try {
      console.log('[refreshData] Fetching fresh data from server...');
      const authHeaders = await getAuthHeaders();
      
      // Plans'ni server'dan olish
      const plansResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/plans`, {
        headers: authHeaders,
      });
      
      if (plansResponse.ok) {
        const freshPlans = await plansResponse.json();
        console.log('[refreshData] ✅ Fresh plans from server:', freshPlans.length);
        setPlans(freshPlans);
        // LocalStorage'ni yangilash
        localStorage.setItem('manyak_tv_plans_v1', JSON.stringify(freshPlans));
      }
      
      // Promo codes'ni server'dan olish
      const promosResponse = await fetch(`${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'}/promo-codes`, {
        headers: authHeaders,
      });
      
      if (promosResponse.ok) {
        const freshPromos = await promosResponse.json();
        console.log('[refreshData] ✅ Fresh promo codes from server:', freshPromos.length);
        setPromoCodes(freshPromos);
        localStorage.setItem('manyak_tv_promo_codes_v1', JSON.stringify(freshPromos));
      }
      
      console.log('[refreshData] ✅ Server sync completed');
    } catch (error) {
      console.error('[refreshData] ❌ Server sync error (using cached data):', error);
      // Xato bo'lsa, localStorage'dagi ma'lumotlar qoladi
    }
  }, []);

  // ═══ CUSTOM DIALOG SYSTEM INITIALIZATION ═══
  useEffect(() => {
    console.log('[CustomDialogs] Initializing custom dialog system...');
    
    // Dialog handler'ni ro'yxatdan o'tkazish
    registerDialogHandler((config) => {
      setCustomDialog(config);
    });

    // Browser native dialog'larni override qilish
    const restoreDialogs = overrideBrowserDialogs();

    // Notification va Service Worker permission'larni bloklash
    blockServiceWorkerPermissions();

    // Telegram WebApp notification'larni override qilish
    preventTelegramNotifications();

    console.log('[CustomDialogs] ✅ Custom dialog system initialized');

    // Cleanup
    return () => {
      if (restoreDialogs) restoreDialogs();
    };
  }, []);

  useEffect(() => {
    // ═══ TELEGRAM WEB APP MAJBURIY TEKSHIRUVI ═══
    // FAQAT SUPER ADMIN brauzerdan kirishlari mumkin
    // Qolgan barcha foydalanuvchilar FAQAT TELEGRAM WEB APP orqali ishlashlari kerak
    const isTelegramWebApp = typeof window !== 'undefined' && window.Telegram?.WebApp;
    const checkUser = getStoredCurrentUser();
    const isSuperAdmin = checkUser.id === String(import.meta.env.VITE_SUPER_ADMIN_ID || '');
    
    console.log('[Security] Telegram Web App:', isTelegramWebApp);
    console.log('[Security] User ID:', checkUser.id);
    console.log('[Security] Is Super Admin:', isSuperAdmin);
    
    // Agar Telegram Web App emas VA super admin emas bo'lsa - BLOKLAYMIZ
    if (!isTelegramWebApp && !isSuperAdmin) {
      console.warn('[Security] Brauzerdan kirish bloklandi! Faqat Telegram Web App orqali kiring.');
      
      // Bloklov ekranini ko'rsatish uchun flag
      // App.tsx da alohida state qo'shamiz
      const blockElement = document.createElement('div');
      blockElement.id = 'browser-block-screen';
      blockElement.innerHTML = `
        <div style="
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, #09090b 0%, #18181b 100%);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 99999;
          color: white;
          font-family: 'Plus Jakarta Sans', sans-serif;
        ">
          <div style="
            max-width: 500px;
            padding: 40px;
            text-align: center;
            background: rgba(24, 24, 27, 0.95);
            border: 1px solid rgba(220, 38, 38, 0.5);
            border-radius: 24px;
            box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
          ">
            <div style="
              width: 80px;
              height: 80px;
              margin: 0 auto 20px;
              background: rgba(220, 38, 38, 0.1);
              border: 2px solid rgba(220, 38, 38, 0.5);
              border-radius: 16px;
              display: flex;
              align-items: center;
              justify-content: center;
              font-size: 40px;
            ">
              🔒
            </div>
            <h1 style="
              font-size: 28px;
              font-weight: 900;
              margin-bottom: 16px;
              color: #dc2626;
              text-transform: uppercase;
              letter-spacing: 1px;
            ">
              BRAUZERDAN KIRISH YOPIQ
            </h1>
            <p style="
              font-size: 16px;
              color: #a1a1aa;
              line-height: 1.6;
              margin-bottom: 24px;
            ">
              MANYAK TV platformasiga kirish uchun <strong style="color: #3b82f6;">Telegram Web App</strong> orqali kiring.
              <br><br>
              Brauzerdan faqat <strong style="color: #fbbf24;">Super Admin</strong> kirishi mumkin.
            </p>
            <a
              href="https://t.me/manyaktvbot"
              style="
                display: inline-block;
                padding: 14px 32px;
                background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
                color: white;
                text-decoration: none;
                border-radius: 12px;
                font-weight: 700;
                font-size: 15px;
                transition: transform 0.2s;
                box-shadow: 0 4px 20px rgba(59, 130, 246, 0.3);
              "
              onmouseover="this.style.transform='scale(1.05)'"
              onmouseout="this.style.transform='scale(1)'"
            >
              📱 Telegram Botga O'tish
            </a>
          </div>
        </div>
      `;
      document.body.appendChild(blockElement);
      
      // App rendering'ni to'xtatish
      return;
    }

    // Notify Telegram WebApp
    // Telegram Web App theme sync
    // @ts-ignore
    if (window.Telegram?.WebApp) {
      // @ts-ignore
      const tg = window.Telegram.WebApp;
      tg.expand();
      tg.ready();
    }

    // URL parametridan content ochish (broadcast link)
    const urlParams = new URLSearchParams(window.location.search);
    const contentIdToOpen = urlParams.get('openContent');
    
    if (contentIdToOpen) {
      console.log('[App] Broadcast link orqali content ochilmoqda:', contentIdToOpen);
      
      // Content'ni topish va ochish
      const foundContent = getStoredContent().find(c => c.id === contentIdToOpen);
      if (foundContent) {
        console.log('[App] Content topildi:', foundContent.title);
        
        // URL'dan parametrni olib tashlash (refresh qilganda qayta ochmasligi uchun)
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Content details modal'ini ochish
        setTimeout(() => {
          setDetailsModalContent(foundContent);
        }, 500);
      } else {
        console.warn('[App] Content topilmadi:', contentIdToOpen);
      }
    }

    // Sync user profile to backend SQLite database, and receive updates if offline-approved
    // ESKI KOD: bu so'rov hech qanday Authorization header'siz yuborilardi.
    // /api/sync-user endi autentifikatsiya talab qilgani uchun (xavfsizlik
    // tuzatishi — qarang: AUDIT_HISOBOT.md, band 2), bu yerda ham haqiqiy
    // tokenni olib yuborish kerak.
    const currentUser = getStoredCurrentUser();
    if (currentUser) {
      getAuthHeaders().then((authHeaders) => {
        fetch('/api/sync-user', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', ...authHeaders },
          body: JSON.stringify(currentUser)
        })
        .then(res => res.json())
        .then(data => {
          if (data.ok && data.user) {
            // Update local storage with the merged data from backend
            saveStoredCurrentUser(data.user);
            saveStoredUser(data.user);
          }
        })
        .catch(console.error);
      });
    }

    // SSE connection is established in the second useEffect below with proper userId

    // Initialize anti-piracy and inspect protection guards
    const cleanupGuards = initSecurityGuards();

    refreshData();

    // MUHIM: kontent (kino/serial) ilgari faqat localStorage'dan
    // o'qilardi — bu admin qo'shgan/o'zgartirgan kontent boshqa
    // foydalanuvchilarga umuman ko'rinmasligi bugining asosiy sababi edi.
    // Ilova ochilganda serverdagi (SQLite) umumiy ro'yxatni tortib olib,
    // localStorage keshini yangilaymiz — bu esa 'manyak_storage_update'
    // orqali avtomatik refreshData()ni ishga tushiradi.
    syncContentFromServer();

    // Listen to custom storage updates with debounce
    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const handleStorageUpdate = () => {
      if (timeoutId) clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        refreshData();
      }, 50);
    };

    window.addEventListener('manyak_storage_update', handleStorageUpdate);

    // 1. Real-time listener for payment_status updates
    const handlePaymentStatusUpdate = (e: Event) => {
      const customEvent = e as CustomEvent<{
        receiptId?: string;
        status: 'approved' | 'rejected';
        userId?: string;
        planName?: string;
        amount?: number;
      }>;
      const detail = customEvent.detail;
      const currentUser = getStoredCurrentUser();
      if (!detail || (detail.userId && detail.userId !== currentUser.id)) {
        return;
      }

      // Immediately refresh subscription and user state without manual refresh
      refreshData();

      if (detail.status === 'approved') {
        try {
          if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
        } catch {
          // ignore
        }
        setPaymentToast({
          id: String(Date.now()),
          type: 'success',
          title: "🎉 To'lovingiz tasdiqlandi!",
          message: `${detail.planName || 'VIP Obuna'} muvaffaqiyatli faollashtirildi! Barcha serial va filmlar ochildi.`,
        });
      } else if (detail.status === 'rejected') {
        setPaymentToast({
          id: String(Date.now()),
          type: 'error',
          title: "To'lov cheki rad etildi",
          message: "Yuborilgan to'lov chekingiz admin tomonidan qabul qilinmadi.",
        });
      }
    };

    window.addEventListener('manyak_payment_status_update', handlePaymentStatusUpdate);

    // 2. Real-time background watcher for receipt status transitions
    const checkReceiptsStatus = () => {
      const allReceipts = getStoredReceipts();
      const currentUser = getStoredCurrentUser();
      const userReceipts = allReceipts.filter((r) => r.userId === currentUser.id);

      userReceipts.forEach((rcpt) => {
        const prevStatus = prevReceiptsRef.current.get(rcpt.id);
        if (prevStatus && prevStatus !== rcpt.status) {
          if (rcpt.status === 'approved') {
            refreshData();
            try {
              if (navigator.vibrate) navigator.vibrate([100, 50, 150]);
            } catch {
              // ignore
            }
            setPaymentToast({
              id: String(Date.now()),
              type: 'success',
              title: "🎉 To'lovingiz tasdiqlandi!",
              message: `${rcpt.planName || rcpt.contentTitle || 'VIP Obuna'} faollashtirildi!`,
            });
          } else if (rcpt.status === 'rejected') {
            refreshData();
            setPaymentToast({
              id: String(Date.now()),
              type: 'error',
              title: "To'lov cheki rad etildi",
              message: "Yuborilgan to'lov chekingiz qabul qilinmadi.",
            });
          }
        }
        prevReceiptsRef.current.set(rcpt.id, rcpt.status);
      });
    };

    // Initialize snapshot
    getStoredReceipts()
      .filter((r) => r.userId === getStoredCurrentUser().id)
      .forEach((r) => prevReceiptsRef.current.set(r.id, r.status));

    const pollInterval = setInterval(checkReceiptsStatus, 3000);

    // ═══ 3. BACKEND SSE ULANISHI — QAYTA YOZILDI ═══
    //
    // ESKI KODDA 4 TA XATO:
    //
    //  1) `?userId=${currentUser.id}` — server bu qiymatga ISHONARDI, ya'ni
    //     istalgan odam boshqa foydalanuvchi nomidan ulanib, uning to'lov
    //     xabarlarini olishi mumkin edi. Backend endi JWT talab qiladi va
    //     userId ni TOKEN ichidan oladi (`?token=`).
    //
    //  2) SSE `payment_decision` kelganda klient O'ZI `reviewReceipt` ni
    //     chaqirib, VIP ni LOKAL ravishda berardi. 3 sekundlik poller ham
    //     shu holatga reaksiya qilardi — natijada bir qaror IKKI MARTA
    //     qo'llanib, VIP muddati ikki barobar uzayishi mumkin edi.
    //     Endi klient hech qanday huquq BERMAYDI: shunchaki serverdan
    //     avtoritiv entitlement'ni qayta so'raydi.
    //
    //  3) `onerror` yo'q edi va `try/catch` async ulanish xatosini
    //     ushlamaydi — ya'ni `console.warn("Backend ulanishi yo'q")` hech
    //     qachon bajarilmaydigan o'lik kod edi, uzilgan ulanish esa qayta
    //     tiklanmasdi.
    //
    //  4) `catch (err) {}` — bo'sh blok barcha xatolarni izsiz yutardi.
    let eventSource: EventSource | null = null;
    let sseRetryTimer: ReturnType<typeof setTimeout> | null = null;
    let sseAttempt = 0;
    let sseClosed = false;

    const handleSseMessage = (e: MessageEvent) => {
      let data: { type?: string; receiptId?: string; decision?: string };
      try {
        data = JSON.parse(e.data);
      } catch (err) {
        console.warn('[SSE] Xabarni o\'qib bo\'lmadi:', err);
        return;
      }

      if (data.type === 'payment_decision') {
        // Server allaqachon VIP/xaridni bergan — biz faqat AVTORITIV
        // holatni tortib olamiz va foydalanuvchiga xabar ko'rsatamiz.
        void syncEntitlementsFromServer().then(() => refreshData());

        setPaymentToast({
          id: String(Date.now()),
          type: data.decision === 'approved' ? 'success' : 'error',
          title: data.decision === 'approved' ? "🎉 To'lovingiz tasdiqlandi!" : "To'lov cheki rad etildi",
          message:
            data.decision === 'approved'
              ? 'Obuna faollashtirildi! Barcha serial va filmlar ochildi.'
              : "Yuborilgan to'lov chekingiz admin tomonidan qabul qilinmadi.",
        });
      } else if (data.type === 'content_updated') {
        // Admin kino/serial qo'shsa, tahrirlasa yoki o'chirsa — ro'yxatni
        // serverdan qayta so'rab, hammaning ekranida bir xil holat bo'ladi.
        void syncContentFromServer();
      } else if (data.type === 'verification_complete') {
        // Foydalanuvchi Telegram botga kontaktini yubordi va server uni
        // tasdiqladi. `isPhoneVerified` server tomonida boshqarilgani uchun
        // entitlement'ni qayta tortamiz — tasdiqlash modali avtomatik yopiladi.
        void syncEntitlementsFromServer().then(() => {
          refreshData();
          setIsPhoneModalOpen(false);
        });
        setPaymentToast({
          id: String(Date.now()),
          type: 'success',
          title: '✅ Hisob tasdiqlandi',
          message: 'Telegram akkauntingiz muvaffaqiyatli bog\'landi.',
        });
      }
    };

    const connectSse = async () => {
      if (sseClosed) return;

      // SSE header yubora olmaydi, shuning uchun JWT query parametrida.
      const token = await getBackendAuthToken();
      if (!token) {
        // Telegram tashqarisida token bo'lmaydi — real-time yangilanish
        // ishlamaydi, lekin ilova 3 sekundlik poller bilan ishlashda davom
        // etadi. Qayta urinishning ma'nosi yo'q.
        console.info('[SSE] Token yo\'q — real-time kanal o\'chirilgan.');
        return;
      }
      if (sseClosed) return;

      const es = new EventSource(`/api/events?token=${encodeURIComponent(token)}`);
      eventSource = es;

      es.onmessage = handleSseMessage;

      es.onopen = () => {
        sseAttempt = 0; // muvaffaqiyatli ulanishdan keyin kechikish tiklanadi
      };

      es.onerror = () => {
        es.close();
        if (sseClosed) return;

        // Eksponensial kechikish bilan qayta ulanish (maks. 30 sekund).
        // Bu ayni paytda backend'dagi rate-limit'ni ham urib yubormaydi.
        sseAttempt += 1;
        const delay = Math.min(1000 * 2 ** (sseAttempt - 1), 30000);
        console.warn(`[SSE] Ulanish uzildi — ${delay / 1000}s dan keyin qayta urinamiz (${sseAttempt})`);
        sseRetryTimer = setTimeout(() => {
          void connectSse();
        }, delay);
      };
    };

    void connectSse();

    // Periodic automatic VIP subscription expiration check (auto-revocation)
    // ═══ OBUNA MUDDATINI TEKSHIRISH ═══
    // Muddati o'tgan obunani YOPISH endi serverning ishi
    // (`Users.expireSubscriptions` boot'da va har soatda). Klient faqat
    // avtoritiv holatni davriy ravishda tortib oladi — shunda bot orqali
    // tasdiqlangan to'lov yoki tugagan obuna ekranda ham ko'rinadi.
    // Interval 10s dan 60s ga oshirildi: ilgari har 10 sekundda `user`
    // obyekti yangilanib, `checkAccessSecurity` (canvas + WebGL + AudioContext
    // yaratadigan barmoq izi) qayta hisoblanardi.
    const entitlementInterval = setInterval(() => {
      void syncEntitlementsFromServer().then((ent) => {
        if (ent) refreshData();
      });
    }, 60000);

    // Ilova ochilganda darhol bir marta
    void syncEntitlementsFromServer().then((ent) => {
      if (ent) refreshData();
    });

    // Kesh yozilmasa (masalan xotira to'lgan) foydalanuvchini ogohlantiramiz
    const handleStorageError = (e: Event) => {
      const detail = (e as CustomEvent<{ message?: string }>).detail;
      setPaymentToast({
        id: String(Date.now()),
        type: 'error',
        title: 'Qurilma xotirasi',
        message: detail?.message || "Ma'lumotni qurilmada saqlab bo'lmadi.",
      });
    };
    window.addEventListener('manyak_storage_error', handleStorageError);

    // Initial loading state with branded MANYAK TV skeleton
    const initialTimer = setTimeout(() => {
      setIsInitialLoading(false);
    }, 1500);

    return () => {
      cleanupGuards();
      clearTimeout(initialTimer);
      if (timeoutId) clearTimeout(timeoutId);
      clearInterval(entitlementInterval);
      clearInterval(pollInterval);

      // SSE ni to'liq to'xtatamiz: qayta ulanish taymerini ham bekor qilish
      // kerak, aks holda komponent yopilgandan keyin ham yangi ulanish
      // yaratilib, unmount qilingan komponentda setState chaqirilardi.
      sseClosed = true;
      if (sseRetryTimer) clearTimeout(sseRetryTimer);
      if (eventSource) eventSource.close();

      window.removeEventListener('manyak_storage_update', handleStorageUpdate);
      window.removeEventListener('manyak_payment_status_update', handlePaymentStatusUpdate);
      window.removeEventListener('manyak_storage_error', handleStorageError);
    };
  }, [refreshData]);

  const isAdmin = isUserAdmin(user.id);
  
  // DEBUG: Admin check
  console.log('[App] User ID:', user.id);
  console.log('[App] isAdmin from isUserAdmin():', isAdmin);
  
  const currentHwid = React.useMemo(() => getOrCreateDeviceFingerprint(), []);
  const securityCheck = React.useMemo(
    () => checkAccessSecurity(user.id, settings, isAdmin, user),
    [user, settings, isAdmin]
  );

  // Safety: auto-close admin panel if user is not admin
  React.useEffect(() => {
    if (!isAdmin && isAdminPanelOpen) {
      setIsAdminPanelOpen(false);
    }
  }, [isAdmin, isAdminPanelOpen]);

  // Handle video selection (Both Movies and Dramas open directly)
  const handleSelectContent = (item: ContentItem, episodeId?: string) => {
    setActiveVideoContent(item);
    const targetEpId = episodeId || (item.episodes && item.episodes.length > 0 ? item.episodes[0].id : undefined);
    setActiveEpisodeId(targetEpId);
  };

  const handleOpenDetails = (item: ContentItem) => {
    setDetailsModalContent(item);
  };

  // Handle open payment modal
  const handleOpenPayment = (targetContent?: ContentItem, episode?: Episode) => {
    setPaymentTargetContent(targetContent || null);
    setIsPaymentModalOpen(true);
  };

  const shortDramas = contents.filter((c) => c.type === 'short_drama');

  // If user or hardware device is banned or not opened via Telegram or HWID mismatch detected
  if (!securityCheck.isAllowed) {
    const isDevice = securityCheck.banType === 'device';
    const isNotTelegram = securityCheck.banType === 'not_telegram';
    const isHwidMismatch = securityCheck.banType === 'hwid_mismatch';

    return (
      <div className="min-h-screen bg-[#070709] text-white flex flex-col items-center justify-center p-4 selection:bg-red-600">
        <div className="w-full max-w-md bg-zinc-950/95 border border-red-900/60 rounded-3xl p-6 sm:p-8 text-center shadow-2xl relative overflow-hidden">
          {/* Red glow backdrop */}
          <div className="absolute -top-20 -left-20 w-40 h-40 bg-red-600/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -right-20 w-40 h-40 bg-red-600/20 blur-3xl pointer-events-none" />

          <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-red-950/70 border border-red-700/60 flex items-center justify-center text-red-500 shadow-xl shadow-red-900/30">
            {isNotTelegram ? (
              <Lock className="w-10 h-10 text-amber-500 animate-pulse" />
            ) : isHwidMismatch ? (
              <Fingerprint className="w-10 h-10 text-amber-500 animate-pulse" />
            ) : (
              <ShieldAlert className="w-10 h-10 animate-pulse" />
            )}
          </div>

          <h2 className="text-xl sm:text-2xl font-black text-white mb-2 tracking-tight uppercase">
            {isNotTelegram
              ? 'TELEGRAM PROFILI BILAN TASDIQLASH'
              : isDevice
              ? 'Qurilma Butunlay Bloklangan'
              : isHwidMismatch
              ? 'Qurilma Mos Kelmadi (HWID)'
              : 'Akkaunt Bloklangan'}
          </h2>

          <div className="inline-block px-3 py-1 rounded-full bg-blue-950/80 border border-blue-800 text-blue-400 text-xs font-mono font-bold mb-4">
            {isNotTelegram
              ? `@${(settings.botUsername || 'Manyaktvbot').replace('@', '')} BOTI INTEGRATSIYASI`
              : isDevice
              ? 'HARDWARE ID (HWID) BAN'
              : isHwidMismatch
              ? 'XAVFSIZLIK: HWID BOG\'LANISH BUZILISHI'
              : `TELEGRAM ID #${user.id}`}
          </div>

          <p className="text-xs sm:text-sm text-zinc-300 leading-relaxed mb-4">
            {isNotTelegram
              ? 'MANYAK TV platformasi rasmiy Telegram boti bilan to\'liq integratsiya qilingan. Saytga kirish uchun Telegram profilingiz orqali tasdiqlang. Admin profili tasdiqlansa, saytga va boshqaruv paneliga to\'liq kirish huquqi beriladi.'
              : isHwidMismatch
              ? 'Akkauntingiz xavfsizligi va obunalarni himoyalash maqsadida MANYAK TV hisobingiz faqat ro\'yxatdan o\'tgan shaxsiy qurilmangizga qat\'iy biriktirilgan. Boshqa qurilmadan ruxsatsiz kirish aniqlandi.'
              : securityCheck.reason}
          </p>

          {/* HWID Deviation Breakdown Card */}
          {isHwidMismatch && (
            <div className="text-left bg-zinc-900/90 border border-amber-900/40 rounded-2xl p-3.5 mb-5 space-y-2.5 text-xs">
              <div className="flex items-center justify-between pb-1.5 border-b border-zinc-800 text-[11px]">
                <span className="text-zinc-400">Xavfsizlik statusi:</span>
                <span className="text-amber-400 font-black uppercase text-[10px] tracking-wider px-2 py-0.5 rounded bg-amber-950/50 border border-amber-800/60">
                  Ruxsatsiz Qurilma
                </span>
              </div>

              {securityCheck.boundDeviceSummary && (
                <div>
                  <div className="text-zinc-500 text-[10px] font-bold uppercase mb-0.5">
                    Biriktirilgan Asosiy Qurilma:
                  </div>
                  <div className="text-zinc-200 font-mono text-[11px] bg-zinc-950 px-2.5 py-1.5 rounded-lg border border-zinc-800">
                    {securityCheck.boundDeviceSummary}
                  </div>
                </div>
              )}

              {securityCheck.currentDeviceSummary && (
                <div>
                  <div className="text-zinc-500 text-[10px] font-bold uppercase mb-0.5">
                    Joriy Kirilgan Qurilma:
                  </div>
                  <div className="text-red-300 font-mono text-[11px] bg-red-950/40 px-2.5 py-1.5 rounded-lg border border-red-900/50">
                    {securityCheck.currentDeviceSummary}
                  </div>
                </div>
              )}

              {securityCheck.deviationReasons && securityCheck.deviationReasons.length > 0 && (
                <div className="pt-1">
                  <div className="text-zinc-500 text-[10px] font-bold uppercase mb-1">
                    Aniqlangan Tafovutlar:
                  </div>
                  <ul className="space-y-1">
                    {securityCheck.deviationReasons.map((r, i) => (
                      <li key={i} className="text-red-400 flex items-start gap-1.5 text-[11px]">
                        <span className="text-red-500 font-bold">•</span>
                        <span>{r}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}

          <div className="space-y-2.5">
            {/* HWID Mismatch Contact Admin */}
            {isHwidMismatch && (
              <a
                href={`${settings.adminContactUrl || 'https://t.me/manyak_admin'}?text=${encodeURIComponent(
                  `Salom, yangi qurilma ishlatayotganim sababli MANYAK TV hisobimdagi (#${user.id}) HWID biriktirilishini tiklab (reset qilib) berishingizni so'rayman.`
                )}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-amber-600 hover:bg-amber-500 text-black font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-600/30 transition"
              >
                <span>Admin bilan bog'lanish (HWID Reset)</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {/* Telegram Profile Verification Button - Primary entry */}
            {isNotTelegram && (
              <button
                type="button"
                onClick={() => setIsTelegramAuthModalOpen(true)}
                className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 active:scale-98 text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-lg shadow-blue-600/30 transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>Telegram Profil Orqali Tasdiqlash</span>
              </button>
            )}

            {/* Telegram Bot Access for ordinary users who landed here by mistake */}
            {!isHwidMismatch && (
              <a
                href={`https://t.me/${(settings.botUsername || 'Manyaktvbot').replace('@', '')}`}
                target="_blank"
                rel="noreferrer"
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-red-600/30 transition"
              >
                <Bot className="w-4 h-4 text-white" />
                <span>Telegram Bot Orqali Kirish (@{(settings.botUsername || 'Manyaktvbot').replace('@', '')})</span>
                <ExternalLink className="w-3.5 h-3.5 opacity-80" />
              </a>
            )}

            {/* Quick check button */}
            {isHwidMismatch && (
              <button
                type="button"
                onClick={() => refreshData()}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-800 flex items-center justify-center gap-2 transition"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Qaytadan Tekshirish</span>
              </button>
            )}

            {!isNotTelegram && !isHwidMismatch && (
              <a
                href={settings.adminContactUrl || 'https://t.me/manyak_admin'}
                target="_blank"
                rel="noreferrer"
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-semibold text-xs border border-zinc-800 flex items-center justify-center gap-2 transition"
              >
                <span>Administrator Bilan Bog'lanish</span>
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            )}

            {isAdmin && (
              <button
                type="button"
                onClick={() => setIsAdminPanelOpen(true)}
                className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-xs transition"
              >
                Admin Panel orqali ochish (Bosh Admin)
              </button>
            )}
          </div>
        </div>

        {/* Telegram Auth Modal for blocked screen */}
        {isTelegramAuthModalOpen && (
          <TelegramAuthModal
            isOpen={isTelegramAuthModalOpen}
            onClose={() => setIsTelegramAuthModalOpen(false)}
            currentUser={user}
            settings={settings}
            onSuccess={(verifiedAdmin) => {
              refreshData();
              if (verifiedAdmin) {
                setIsAdminPanelOpen(true);
              }
            }}
          />
        )}

        {isAdmin && isAdminPanelOpen && (
          <ErrorBoundary
            title="Admin panelida xatolik yuz berdi"
            onReset={() => setIsAdminPanelOpen(false)}
          >
            <AdminPanel
              isOpen={isAdminPanelOpen}
              onClose={() => setIsAdminPanelOpen(false)}
              currentUser={user}
              contents={contents}
              receipts={receipts}
              plans={plans}
              promoCodes={promoCodes}
              settings={settings}
              onRefreshData={refreshData}
            />
          </ErrorBoundary>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#09090b] text-[#f4f4f5] flex flex-col antialiased selection:bg-red-600 selection:text-white">
      {/* Header bar (hidden in full vertical shorts mode for immersive TikTok feel) */}
      {activeTab !== 'shorts' && (
        <Header
          user={user}
          settings={settings}
          isAdmin={isAdmin}
          canGoBack={activeTab !== 'home'}
          onBack={() => handleTabChange('home')}
          onOpenAdmin={() => setIsAdminPanelOpen(true)}
          onOpenVip={() => handleOpenPayment()}
          onOpenTelegramAuth={() => setIsTelegramAuthModalOpen(true)}
        />
      )}

      {/* Main View Router */}
      <main className="flex-1 w-full max-w-7xl mx-auto">
        {isInitialLoading ? (
          <SplashScreen />
        ) : isTabLoading ? (
          <div className="animate-in fade-in duration-200">
            {activeTab === 'home' && <HomeViewSkeleton />}
            {activeTab === 'shorts' && <ShortsViewSkeleton />}
            {activeTab === 'search' && <SearchViewSkeleton />}
            {activeTab === 'history' && <HistoryViewSkeleton />}
            {activeTab === 'profile' && <ProfileViewSkeleton />}
          </div>
        ) : (
          <>
            {activeTab === 'home' && (
              <HomeView
                contents={contents}
                user={user}
                settings={settings}
                onSelectContent={handleSelectContent}
                onOpenDetails={handleOpenDetails}
                onOpenShorts={() => handleTabChange('shorts')}
                onOpenVip={() => handleOpenPayment()}
                onOpenPayment={(content) => handleOpenPayment(content)}
              />
            )}

            {activeTab === 'shorts' && (
              <div className="pt-2">
                <ShortsFeed
                  shortDramas={shortDramas}
                  user={user}
                  onBack={() => handleTabChange('home')}
                  onOpenPayment={(content, episode) => handleOpenPayment(content, episode)}
                />
              </div>
            )}

            {activeTab === 'search' && (
              <SearchView
                contents={contents}
                user={user}
                onSelectContent={handleSelectContent}
              />
            )}

            {activeTab === 'history' && (
              <HistoryView
                user={user}
                contents={contents}
                onSelectContent={handleSelectContent}
                onRefresh={refreshData}
              />
            )}

            {activeTab === 'profile' && (
              <ProfileView
                user={user}
                settings={settings}
                contents={contents}
                isAdmin={isAdmin}
                onOpenAdmin={() => setIsAdminPanelOpen(true)}
                onOpenVip={() => handleOpenPayment()}
                onOpenPayment={(content) => handleOpenPayment(content)}
                onOpenVerifyPhone={() => setIsPhoneModalOpen(true)}
                onOpenTelegramAuth={() => setIsTelegramAuthModalOpen(true)}
                onSelectContent={handleSelectContent}
                onRefreshUser={refreshData}
              />
            )}
          </>
        )}
      </main>

      {/* Bottom Navigation with smooth skeleton tab changes */}
      <BottomNav activeTab={activeTab} onChangeTab={handleTabChange} />

      {/* Content Details Modal */}
      <ContentDetailsModal
        isOpen={Boolean(detailsModalContent)}
        content={detailsModalContent}
        onClose={() => setDetailsModalContent(null)}
        onPlay={handleSelectContent}
      />

      {/* Video Player Modal */}
      <VideoPlayerModal
        isOpen={Boolean(activeVideoContent)}
        content={activeVideoContent}
        initialEpisodeId={activeEpisodeId}
        user={user}
        onClose={() => {
          setActiveVideoContent(null);
          setActiveEpisodeId(undefined);
          refreshData();
        }}
        onOpenPayment={(content, episode) => handleOpenPayment(content, episode)}
      />

      {/* Payment & VIP Modal */}
      <PaymentModal
        isOpen={isPaymentModalOpen}
        onClose={() => {
          setIsPaymentModalOpen(false);
          setPaymentTargetContent(null);
        }}
        user={user}
        settings={settings}
        plans={plans}
        targetContent={paymentTargetContent}
        availableContents={contents}
        onSuccess={refreshData}
      />

      {/* Telegram bot orqali hisobni tasdiqlash
        * (ilgari bu telefon raqami orqali tasdiqlash edi — qarang
        * TelegramVerificationModal ustidagi izoh) */}
      <TelegramVerificationModal
        user={user}
        isOpen={isPhoneModalOpen && !user.isPhoneVerified}
        onVerified={(updated) => {
          setUser(updated);
          setIsPhoneModalOpen(false);

          // MUHIM: shu yerda faqat `refreshData()` chaqirish YETARLI EMAS.
          // `refreshData` localStorage keshidan o'qiydi, adminlik holati esa
          // `syncEntitlementsFromServer()` ichida (server JWT `isAdmin`
          // claim'idan) belgilanadi. Ya'ni faqat `refreshData()` bo'lsa,
          // bot orqali tasdiqlangan admin panel paydo bo'lishini 60
          // sekundlik davriy sinxronizatsiyaga qadar kutishi kerak edi.
          //
          // Endi tasdiqlangandan keyin darhol sinxronlaymiz: entitlement,
          // adminlik va kontent ro'yxati bir zumda aktual bo'ladi.
          void syncEntitlementsFromServer().then(() => refreshData());
          void syncContentFromServer();
        }}
      />

      {/* Telegram Profile Verification Modal */}
      {isTelegramAuthModalOpen && (
        <TelegramAuthModal
          isOpen={isTelegramAuthModalOpen}
          onClose={() => setIsTelegramAuthModalOpen(false)}
          currentUser={user}
          settings={settings}
          onSuccess={(verifiedAdmin) => {
            refreshData();
            if (verifiedAdmin) {
              setIsAdminPanelOpen(true);
            }
          }}
        />
      )}

      {/* Admin Panel - strictly for authorized administrators */}
      {isAdmin && (
        <ErrorBoundary
          title="Admin panelida xatolik yuz berdi"
          onReset={() => setIsAdminPanelOpen(false)}
        >
          <AdminPanel
            isOpen={isAdminPanelOpen}
            onClose={() => setIsAdminPanelOpen(false)}
            currentUser={user}
            contents={contents}
            receipts={receipts}
            plans={plans}
            promoCodes={promoCodes}
            settings={settings}
            onRefreshData={refreshData}
          />
        </ErrorBoundary>
      )}

      {/* Real-time Payment & Subscription Status Toast */}
      {paymentToast && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[92%] max-w-md animate-in fade-in slide-in-from-top-4 duration-300 pointer-events-auto">
          <div
            className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-xl flex items-start gap-3.5 ${
              paymentToast.type === 'success'
                ? 'bg-zinc-950/95 border-emerald-500/50 text-white shadow-emerald-950/50'
                : 'bg-zinc-950/95 border-red-500/50 text-white shadow-red-950/50'
            }`}
          >
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${
                paymentToast.type === 'success'
                  ? 'bg-emerald-950/80 border border-emerald-800 text-emerald-400'
                  : 'bg-red-950/80 border border-red-800 text-red-400'
              }`}
            >
              {paymentToast.type === 'success' ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
              ) : (
                <XCircle className="w-5 h-5 text-red-400" />
              )}
            </div>

            <div className="flex-1 min-w-0 pr-1">
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-black tracking-wide text-white">
                  {paymentToast.title}
                </span>
                {paymentToast.type === 'success' && (
                  <Sparkles className="w-4 h-4 text-amber-400" />
                )}
              </div>
              <p className="text-xs text-zinc-300 mt-1 leading-relaxed">
                {paymentToast.message}
              </p>
            </div>

            <button
              onClick={() => setPaymentToast(null)}
              className="p-1 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-800/60 transition flex-shrink-0"
              title="Yopish"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Custom Dialog Modal - sayt ichidagi barcha dialog'lar */}
      {customDialog && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-zinc-900 rounded-2xl p-6 max-w-md w-full border border-zinc-800 shadow-2xl">
            <h3 className="text-lg font-bold text-white mb-3">{customDialog.title}</h3>
            <p className="text-sm text-zinc-300 mb-6 leading-relaxed">{customDialog.message}</p>

            {customDialog.type === 'prompt' && (
              <input
                type="text"
                defaultValue={customDialog.defaultValue}
                placeholder="Ma'lumot kiriting..."
                className="w-full px-4 py-2.5 rounded-xl bg-zinc-800 border border-zinc-700 text-white text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-600"
                id="custom-dialog-input"
              />
            )}

            <div className="flex gap-3">
              {customDialog.type !== 'alert' && (
                <button
                  onClick={() => {
                    customDialog.onCancel?.();
                    setCustomDialog(null);
                  }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-semibold text-sm transition"
                >
                  Yo'q
                </button>
              )}
              <button
                onClick={() => {
                  if (customDialog.type === 'prompt') {
                    const input = document.getElementById('custom-dialog-input') as HTMLInputElement;
                    customDialog.onConfirm?.(input?.value);
                  } else {
                    customDialog.onConfirm?.();
                  }
                  setCustomDialog(null);
                }}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-semibold text-sm transition"
              >
                {customDialog.type === 'alert' ? 'OK' : 'Ha'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
