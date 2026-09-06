import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  X,
  Shield,
  BarChart3,
  Film,
  CheckSquare,
  CreditCard,
  Tag,
  Settings,
  Plus,
  Trash2,
  Edit,
  Upload,
  Check,
  AlertTriangle,
  FolderPlus,
  Eye,
  DollarSign,
  TrendingUp,
  FileVideo,
  Image as ImageIcon,
  Lock,
  Users,
  UserCheck,
  UserX,
  Smartphone,
  Search,
  Sparkles,
  Layers,
  Tv,
  Flame,
  ShieldOff,
  Laptop,
  CheckCircle,
  MonitorOff,
  ShieldAlert,
  ShieldCheck,
  Zap,
  ExternalLink,
  Edit3,
  SlidersHorizontal,
  FileText,
  Info,
  Save,
  Bot,
  Send,
  RefreshCw,
  CheckCircle2,
  Crown,
  UserPlus,
  Key,
  CheckCheck,
  XCircle,
  Gift,
  Megaphone,
  MessageSquare
} from 'lucide-react';
import {
  ContentItem,
  ContentType,
  Episode,
  PaymentReceipt,
  SubscriptionPlan,
  PromoCode,
  SystemSettings,
  UserProfile,
  CatalogCategory,
  AdminAuditLog,
  AppointedAdmin,
  AdminPermissions,
} from '../types';
import {
  saveStoredContent,
  deleteStoredContent,
  uploadFileToServer,
  reviewReceipt,
  saveStoredPlan,
  deleteStoredPlan,
  saveStoredPromoCode,
  deleteStoredPromoCode,
  updateStoredSettings,
  isUserAdmin,
  getStoredUsers,
  grantUserVip,
  revokeUserVip,
  toggleUserBan,
  toggleDeviceBan,
  getStoredCatalogs,
  saveStoredCatalog,
  deleteStoredCatalog,
  switchUserProfile,
  getStoredAuditLogs,
  addAuditLog,
  resetUserHWIDBindingInStorage,
  SUPER_ADMIN_ID,
  FULL_ADMIN_PERMISSIONS,
  DEFAULT_SUB_ADMIN_PERMISSIONS,
  isUserSuperAdmin,
  getUserAdminPermissions,
  getAppointedAdmins,
  saveAppointedAdmin,
  removeAppointedAdmin,
} from '../services/storage';
import { fetchAndProcessBotCommands } from '../services/telegramBot';
import { getAuthHeaders } from '../services/authToken';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  contents: ContentItem[];
  receipts: PaymentReceipt[];
  plans: SubscriptionPlan[];
  promoCodes: PromoCode[];
  settings: SystemSettings;
  onRefreshData: () => void;
}

type AdminTab =
  | 'stats'
  | 'content'
  | 'users'
  | 'catalogs'
  | 'receipts'
  | 'plans'
  | 'promos'
  | 'admins'
  | 'audit'
  | 'broadcast'
  | 'settings';

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  currentUser,
  contents,
  receipts,
  plans,
  promoCodes,
  settings,
  onRefreshData,
}) => {
  // --- 1. useState Hooks ---
  const [activeTab, setActiveTab] = useState<AdminTab>('stats');

  // Content edit state
  const [editingContent, setEditingContent] = useState<Partial<ContentItem> | null>(null);
  const [isContentModalOpen, setIsContentModalOpen] = useState(false);
  const [contentFilter, setContentFilter] = useState<'all' | 'movie' | 'series' | 'anime_series' | 'short_drama'>('all');

  // Episodes for series/short dramas in modal
  const [modalEpisodes, setModalEpisodes] = useState<Episode[]>([]);
  const [episodeUploadProgress, setEpisodeUploadProgress] = useState<Record<string, { progress: number; status: 'loading' | 'success' | 'error' }>>({});
  const [mainFileUploadProgress, setMainFileUploadProgress] = useState<Record<string, { progress: number; status: 'loading' | 'success' | 'error' }>>({});

  // New genre input
  const [newGenreInput, setNewGenreInput] = useState('');

  // Plan edit modal
  const [editingPlan, setEditingPlan] = useState<Partial<SubscriptionPlan> | null>(null);
  const [isPlanModalOpen, setIsPlanModalOpen] = useState(false);
  const [newPlanFeatureInput, setNewPlanFeatureInput] = useState('');

  // Promo edit modal
  const [editingPromo, setEditingPromo] = useState<Partial<PromoCode> | null>(null);
  const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);

  // Settings local state
  const [localSettings, setLocalSettings] = useState<SystemSettings>(settings);
  const [newAdminIdInput, setNewAdminIdInput] = useState('');

  // Appointed Admin management state
  const [isAppointModalOpen, setIsAppointModalOpen] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<{
    id: string;
    name: string;
    username: string;
    roleTitle: string;
    permissions: AdminPermissions;
    isNew: boolean;
  } | null>(null);
  const [adminSearchQuery, setAdminSearchQuery] = useState('');

  // Selected receipt preview modal
  const [selectedReceipt, setSelectedReceipt] = useState<PaymentReceipt | null>(null);

  // DEDICATED RECEIPT PAYMENTS & TELEGRAM BOT SYNC STATE
  const [paymentSubTab, setPaymentSubTab] = useState<'history' | 'bot_sync' | 'card_config'>('history');
  const [receiptFilter, setReceiptFilter] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [receiptSearch, setReceiptSearch] = useState('');
  const [isSyncingBot, setIsSyncingBot] = useState(false);
  const [botCommandInput, setBotCommandInput] = useState('');

  // USERS MANAGEMENT STATE
  const [usersList, setUsersList] = useState<UserProfile[]>([]);
  const [userSearchQuery, setUserSearchQuery] = useState('');
  const [manualTelegramId, setManualTelegramId] = useState('');
  const [manualVipDays, setManualVipDays] = useState<number>(30);
  const [actionNotification, setActionNotification] = useState<string | null>(null);

  // SCREEN CATALOGS STATE
  const [catalogsList, setCatalogsList] = useState<CatalogCategory[]>([]);
  const [editingCatalog, setEditingCatalog] = useState<Partial<CatalogCategory> | null>(null);
  const [isCatalogModalOpen, setIsCatalogModalOpen] = useState(false);

  // BROADCAST STATE
  const [broadcastMessage, setBroadcastMessage] = useState('');
  const [broadcastTargetContent, setBroadcastTargetContent] = useState<string>(''); // content id
  const [broadcastStatus, setBroadcastStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [broadcastStatusMessage, setBroadcastStatusMessage] = useState('');

  // AUDIT TRAIL STATE
  const [auditLogs, setAuditLogs] = useState<AdminAuditLog[]>([]);

  // SECONDARY VERIFICATION STATE FOR SENSITIVE ACTIONS
  interface PendingSensitiveAction {
    type:
      | 'DELETE_CONTENT'
      | 'DELETE_PLAN'
      | 'UPDATE_SETTINGS'
      | 'BAN_USER'
      | 'UNBAN_USER'
      | 'REVOKE_VIP';
    title: string;
    description: string;
    targetId?: string;
    targetTitle?: string;
    onConfirm: () => void;
  }
  const [pendingAction, setPendingAction] = useState<PendingSensitiveAction | null>(null);
  const [secondaryAuthInput, setSecondaryAuthInput] = useState('');
  const [secondaryAuthError, setSecondaryAuthError] = useState('');

  // --- 2. useMemo Hooks ---
  const userPermissions = useMemo(
    () => getUserAdminPermissions(currentUser.id) || DEFAULT_SUB_ADMIN_PERMISSIONS,
    [currentUser.id]
  );
  
  const isSuperAdmin = useMemo(
    () => isUserSuperAdmin(currentUser.id),
    [currentUser.id]
  );

  const pendingReceiptsCount = useMemo(
    () => receipts.filter((r) => r.status === 'pending').length,
    [receipts]
  );

  // Dynamic list of tabs accessible to this specific admin based on their RBAC permissions
  const allowedTabs = useMemo(() => {
    const list: {
      id: AdminTab;
      label: string;
      badge?: number | string;
      icon: React.ComponentType<{ className?: string }>;
    }[] = [];

    if (userPermissions.canViewStats) {
      list.push({ id: 'stats', label: 'Statistika & Daromad', icon: BarChart3 });
    }
    if (userPermissions.canAddContent || userPermissions.canEditContent || userPermissions.canDeleteContent) {
      list.push({ id: 'content', label: `Kino & Dramalar (${contents.length})`, icon: Film });
    }
    if (userPermissions.canManageUsers) {
      list.push({ id: 'users', label: `Foydalanuvchilar (${usersList.length})`, icon: Users });
    }
    if (userPermissions.canManageCatalogs) {
      list.push({ id: 'catalogs', label: `Ekran Kataloglari (${catalogsList.length})`, icon: Layers });
    }
    if (userPermissions.canManageReceipts) {
      list.push({
        id: 'receipts',
        label: "To'lovlar & UzCard Auto",
        badge: pendingReceiptsCount,
        icon: CreditCard,
      });
    }
    if (userPermissions.canManagePlans) {
      list.push({ id: 'plans', label: `Tariflar (${plans.length})`, icon: CreditCard });
    }
    if (userPermissions.canManagePromoCodes) {
      list.push({ id: 'promos', label: 'Promokodlar', icon: Gift });
    }
    if (userPermissions.canBroadcast) {
      list.push({ id: 'broadcast', label: 'Bot Xabarnoma', icon: Megaphone });
    }
    if (isSuperAdmin || userPermissions.canManageAdmins) {
      list.push({
        id: 'admins',
        label: `Adminlar & Huquqlar (${(localSettings.appointedAdmins || []).length})`,
        icon: Crown,
      });
    }
    if (isSuperAdmin || userPermissions.canViewStats) {
      list.push({ id: 'audit', label: `Audit Jurnali (${auditLogs.length})`, icon: Shield });
    }
    if (isSuperAdmin || userPermissions.canManageSettings) {
      list.push({ id: 'settings', label: 'Bot & Havolalar', icon: Settings });
    }
    return list;
  }, [
    userPermissions,
    isSuperAdmin,
    contents.length,
    usersList.length,
    catalogsList.length,
    pendingReceiptsCount,
    plans.length,
    localSettings.appointedAdmins,
    auditLogs.length,
  ]);

  // --- 3. useCallback Hooks ---
  const refreshAdminData = useCallback(() => {
    setUsersList(getStoredUsers());
    setCatalogsList(getStoredCatalogs());
    setAuditLogs(getStoredAuditLogs());
    setLocalSettings(settings);
  }, [settings]);

  const showNotification = useCallback((msg: string) => {
    setActionNotification(msg);
    setTimeout(() => {
      setActionNotification(null);
    }, 3500);
  }, []);

  // --- 4. useEffect Hooks ---
  useEffect(() => {
    if (isOpen) {
      refreshAdminData();
    }
  }, [isOpen, refreshAdminData]);

  // Keep active tab valid based on permissions
  useEffect(() => {
    if (allowedTabs.length > 0 && !allowedTabs.some((t) => t.id === activeTab)) {
      setActiveTab(allowedTabs[0].id);
    }
  }, [allowedTabs, activeTab]);

  if (!isOpen) return null;

  const isAdmin = isUserAdmin(currentUser.id);

  // If user is not an authorized admin, strictly block rendering
  if (!isAdmin) {
    return null;
  }

  // Calculate statistics
  const totalRevenue = contents.reduce((acc, c) => acc + (c.revenue || 0), 0) +
    receipts
      .filter((r) => r.status === 'approved' && r.type === 'vip_subscription')
      .reduce((acc, r) => acc + (r.amount || 0), 0);
  const totalViews = contents.reduce((acc, c) => acc + (c.viewsCount || 0), 0);

  const ROLE_PRESETS = [
    {
      name: '🎬 Kontent Moderatori',
      roleTitle: 'Kontent Moderatori',
      description: 'Faqat kinolar va seriallarni qo\'shish / tahrirlash',
      perms: {
        canAddContent: true,
        canEditContent: true,
        canDeleteContent: false,
        canManageUsers: false,
        canManageCatalogs: true,
        canManageReceipts: false,
        canManagePlans: false,
        canManagePromoCodes: false,
        canBroadcast: false,
        canViewStats: false,
        canManageSettings: false,
        canManageAdmins: false,
      },
    },
    {
      name: '💳 Kassir / To\'lovlar Menejeri',
      roleTitle: 'To\'lovlar Menejeri',
      description: 'To\'lov cheklarini tekshirish va tasdiqlash, daromad hisoboti',
      perms: {
        canAddContent: false,
        canEditContent: false,
        canDeleteContent: false,
        canManageUsers: false,
        canManageCatalogs: false,
        canManageReceipts: true,
        canManagePlans: false,
        canManagePromoCodes: false,
        canBroadcast: false,
        canViewStats: true,
        canManageSettings: false,
        canManageAdmins: false,
      },
    },
    {
      name: '👥 Foydalanuvchilar Menejeri',
      roleTitle: 'Foydalanuvchilar Menejeri',
      description: 'Foydalanuvchilarni ko\'rish, VIP berish va bot orqali xabarnoma',
      perms: {
        canAddContent: false,
        canEditContent: false,
        canDeleteContent: false,
        canManageUsers: true,
        canManageCatalogs: false,
        canManageReceipts: false,
        canManagePlans: false,
        canManagePromoCodes: true,
        canBroadcast: true,
        canViewStats: false,
        canManageSettings: false,
        canManageAdmins: false,
      },
    },
    {
      name: '🛠️ Katta Yordamchi Admin',
      roleTitle: 'Katta Admin',
      description: 'Kino, to\'lovlar, foydalanuvchilar va statistikani to\'liq boshqarish',
      perms: {
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
        canManageSettings: false,
        canManageAdmins: false,
      },
    },
  ];

  const handleOpenAppointModal = (existing?: AppointedAdmin) => {
    if (existing) {
      setEditingAdmin({
        id: existing.id,
        name: existing.name,
        username: existing.username || '',
        roleTitle: existing.roleTitle || 'Yordamchi Admin',
        permissions: { ...existing.permissions },
        isNew: false,
      });
    } else {
      setEditingAdmin({
        id: '',
        name: '',
        username: '',
        roleTitle: 'Kontent Moderatori',
        permissions: { ...DEFAULT_SUB_ADMIN_PERMISSIONS },
        isNew: true,
      });
    }
    setIsAppointModalOpen(true);
  };

  const handleSaveAppointedAdmin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAdmin || !editingAdmin.id.trim()) {
      alert("Telegram ID kiritilishi shart!");
      return;
    }
    const res = saveAppointedAdmin(
      {
        id: editingAdmin.id,
        name: editingAdmin.name,
        username: editingAdmin.username,
        roleTitle: editingAdmin.roleTitle,
        permissions: editingAdmin.permissions,
      },
      currentUser.id
    );

    if (res.success) {
      showNotification(res.message);
      setIsAppointModalOpen(false);
      setEditingAdmin(null);
      refreshAdminData();
      onRefreshData();
    } else {
      alert(res.message);
    }
  };

  const handleRemoveAppointedAdmin = (adminId: string, adminName: string) => {
    if (adminId === SUPER_ADMIN_ID) {
      alert("Bosh Admin (891846690) ni o'chirib bo'lmaydi!");
      return;
    }
    if (
      confirm(
        `"${adminName}" (ID: ${adminId}) ni adminlikdan olib tashlamoqchimisiz?\n\nUning adminlik huquqlari darhol bekor qilinadi va u oddiy foydalanuvchiga aylanadi.`
      )
    ) {
      const res = removeAppointedAdmin(adminId, currentUser.id);
      if (res.success) {
        showNotification(res.message);
        refreshAdminData();
        onRefreshData();
      } else {
        alert(res.message);
      }
    }
  };

  // Handler: Review receipt
  const handleReviewReceipt = (receiptId: string, decision: 'approved' | 'rejected') => {
    reviewReceipt(receiptId, currentUser.id, decision);
    onRefreshData();
    if (selectedReceipt?.id === receiptId) {
      setSelectedReceipt(null);
    }
    if (decision === 'approved') {
      showNotification(
        "✅ To'lov cheki tasdiqlandi! Ham Telegram botga, ham ilovaga obunani tasdiqlash buyrug'i yetkazildi!"
      );
    } else {
      showNotification("To'lov cheki rad etildi va foydalanuvchiga bildirishnoma yuborildi.");
    }
  };

  // Handler: Sync confirmation commands from Telegram Bot
  const handleSyncBotCommands = async () => {
    setIsSyncingBot(true);
    try {
      const count = await fetchAndProcessBotCommands(
        localSettings,
        (receiptId) => {
          handleReviewReceipt(receiptId, 'approved');
        },
        (receiptId) => {
          handleReviewReceipt(receiptId, 'rejected');
        }
      );
      if (count > 0) {
        showNotification(`Botdan ${count} ta yangi tasdiqlash buyrug'i qabul qilindi va obuna ochildi!`);
        onRefreshData();
      } else {
        showNotification("Telegram Bot tekshirildi: yangi tasdiqlash buyruqlari topilmadi.");
      }
    } catch (e) {
      showNotification("Bot bilan bog'lanishda xatolik. Bot tokenini sozlamalardan tekshiring.");
    } finally {
      setIsSyncingBot(false);
    }
  };

  // Handler: Execute Bot Command manually from admin interface
  const handleExecuteBotCommand = (e: React.FormEvent) => {
    e.preventDefault();
    const cmd = botCommandInput.trim();
    if (!cmd) return;

    if (cmd.startsWith('/approve_') || cmd.startsWith('approve_')) {
      const id = cmd.replace('/approve_', '').replace('approve_', '').trim();
      handleReviewReceipt(id, 'approved');
      setBotCommandInput('');
    } else if (cmd.startsWith('/reject_') || cmd.startsWith('reject_')) {
      const id = cmd.replace('/reject_', '').replace('reject_', '').trim();
      handleReviewReceipt(id, 'rejected');
      setBotCommandInput('');
    } else {
      showNotification("Buyruq formati: /approve_rcpt_123 yoki /reject_rcpt_123");
    }
  };

  // Handler: Toggle Payment Method
  const handleTogglePaymentMethod = (method: 'checkUpload' | 'clickPayme') => {
    const currentMethods = localSettings.enabledPaymentMethods || {
      checkUpload: true,
      clickPayme: false,
    };
    const nextVal = !currentMethods[method];
    const updatedMethods = {
      ...currentMethods,
      [method]: nextVal,
    };
    const updatedSettings: SystemSettings = {
      ...localSettings,
      enabledPaymentMethods: updatedMethods,
    };
    setLocalSettings(updatedSettings);
    updateStoredSettings(updatedSettings);
    onRefreshData();
    showNotification(nextVal ? "To'lov usuli faollashtirildi!" : "To'lov usuli o'chirildi!");
  };

  // Handler: Open content editor
  const handleOpenContentEditor = (content?: ContentItem) => {
    if (content) {
      setEditingContent({ ...content });
      setModalEpisodes(content.episodes ? [...content.episodes] : []);
    } else {
      setEditingContent({
        id: `content_${Date.now()}`,
        title: '',
        type: 'movie',
        posterUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600&auto=format&fit=crop&q=80',
        videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        description: '',
        year: new Date().getFullYear(),
        duration: '1h 30m',
        rating: 8.0,
        quality: '1080p',
        genres: ['Jangari'],
        isPremium: true,
        isVipIncluded: true,
        isSinglePurchase: true,
        isFeaturedStore: false,
        price: 15000,
        individualPrice: 15000,
        revenue: 0,
        viewsCount: 0,
        likesCount: 0,
        isTrending: false,
        createdAt: new Date().toISOString(),
      });
      setModalEpisodes([]);
    }
    setIsContentModalOpen(true);
  };

  // Handler: Save content
  const handleSaveContent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingContent || !editingContent.title) return;

    const fullItem: ContentItem = {
      id: editingContent.id || `content_${Date.now()}`,
      title: editingContent.title,
      originalTitle: editingContent.originalTitle || '',
      type: (editingContent.type as ContentType) || 'movie',
      catalogId: editingContent.catalogId || undefined,
      posterUrl: editingContent.posterUrl || 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=600',
      bannerUrl: editingContent.bannerUrl || editingContent.posterUrl,
      videoUrl: editingContent.videoUrl || '',
      episodes: modalEpisodes.length > 0 ? modalEpisodes : undefined,
      description: editingContent.description || '',
      year: Number(editingContent.year) || 2024,
      duration: editingContent.duration || '1h 30m',
      rating: Number(editingContent.rating) || 7.5,
      quality: editingContent.quality || '1080p',
      genres: editingContent.genres || ['Barchasi'],
      isPremium: Boolean(editingContent.isPremium),
      isVipIncluded: editingContent.isVipIncluded !== undefined ? Boolean(editingContent.isVipIncluded) : true,
      isSinglePurchase: Boolean(editingContent.isSinglePurchase),
      isFeaturedStore: Boolean(editingContent.isFeaturedStore),
      price: Number(editingContent.price) || 0,
      individualPrice: Number(editingContent.individualPrice ?? editingContent.price) || 0,
      revenue: Number(editingContent.revenue) || 0,
      viewsCount: Number(editingContent.viewsCount) || 0,
      likesCount: Number(editingContent.likesCount) || 0,
      isTrending: Boolean(editingContent.isTrending),
      createdAt: editingContent.createdAt || new Date().toISOString(),
    };

    saveStoredContent(fullItem);
    setIsContentModalOpen(false);
    showNotification(`"${fullItem.title}" muvaffaqiyatli saqlandi!`);
    onRefreshData();
  };

  // Direct content delete with confirmation & audit log
  const handleDeleteContentDirectly = (item: ContentItem) => {
    const isConfirmed = window.confirm(
      `"${item.title}" kontentini rostdan ham o'chirmoqchimisiz?\n\nUshbu kino/serial va uning barcha epizodlari butunlay o'chiriladi!`
    );
    if (!isConfirmed) return;

    deleteStoredContent(item.id);
    addAuditLog({
      adminId: currentUser.id,
      adminName: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() || `Admin #${currentUser.id}`,
      action: 'DELETE_CONTENT',
      targetType: 'ContentItem',
      targetId: item.id,
      targetTitle: item.title,
      details: `"${item.title}" (${item.type}) admin tomonidan o'chirildi.`,
      secondaryAuthPassed: true,
    });
    setAuditLogs(getStoredAuditLogs());
    onRefreshData();
    showNotification(`"${item.title}" muvaffaqiyatli o'chirildi!`);
  };

  // Device file upload helper for poster & video
  // ESKI KOD: progress soxta setInterval bilan simulyatsiya qilinar,
  // fayl esa URL.createObjectURL(file) ("blob:" URL, faqat joriy sahifa
  // sessiyasida yashaydi) yoki base64 (faqat shu qurilma localStorage'ida)
  // sifatida saqlanardi. Natijada sayt yangilanganda ("blob:" manzillar
  // avtomatik yaroqsiz bo'lib qoladi) yuklangan kino/rasm ochilmay qolardi.
  // Endi fayl haqiqatan ham serverga yuklanadi va doimiy "/uploads/..."
  // manzili qaytariladi — bu manzil sahifa yangilangandan keyin ham,
  // boshqa foydalanuvchi qurilmasida ham ishlayveradi.
  const handleDeviceFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    targetField: 'posterUrl' | 'videoUrl'
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setMainFileUploadProgress(prev => ({ ...prev, [targetField]: { progress: 0, status: 'loading' } }));

    uploadFileToServer(file, (percent) => {
      setMainFileUploadProgress(prev => ({ ...prev, [targetField]: { progress: percent, status: 'loading' } }));
    })
      .then((url) => {
        setMainFileUploadProgress(prev => ({ ...prev, [targetField]: { progress: 100, status: 'success' } }));
        setEditingContent((prev) => ({ ...prev, [targetField]: url }));
        setTimeout(() => {
          setMainFileUploadProgress(p => {
            const newP = { ...p };
            delete newP[targetField];
            return newP;
          });
        }, 1500);
      })
      .catch((err) => {
        console.error('Fayl yuklashda xatolik:', err);
        setMainFileUploadProgress(prev => ({ ...prev, [targetField]: { progress: 100, status: 'error' } }));
        showNotification(`Faylni yuklab bo'lmadi: ${err.message || 'noma\'lum xatolik'}`);
        setTimeout(() => {
          setMainFileUploadProgress(p => {
            const newP = { ...p };
            delete newP[targetField];
            return newP;
          });
        }, 2500);
      });
  };

  // Add episode in modal
  const handleAddEpisode = () => {
    const nextNum = modalEpisodes.length + 1;
    const newEp: Episode = {
      id: `ep_${Date.now()}_${nextNum}`,
      episodeNumber: nextNum,
      title: `${nextNum}-qism`,
      videoUrl: '', // Start empty so it shows as not uploaded (red X) initially
      duration: '0m',
      isFree: nextNum === 1, // 1st episode free by default
      viewsCount: 0,
    };
    setModalEpisodes([...modalEpisodes, newEp]);
  };

  // ESKI KOD: bu yerda videoUrl doim URL.createObjectURL(file) ("blob:"
  // URL) ga tenglashtirilardi. "blob:" manzillar faqat joriy brauzer
  // sahifasi ochiq turgan sessiyada ishlaydi — sayt yangilanishi yoki
  // qayta ochilishi bilanoq bu manzillar yaroqsiz bo'lib, qism (epizod)
  // videosi ochilmay qolardi. Endi fayl haqiqiy serverga yuklanadi va
  // doimiy manzil qaytariladi.
  const handleEpisodeFileUpload = (
    e: React.ChangeEvent<HTMLInputElement>,
    epIndex: number
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Fallback if modalEpisodes doesn't have the epIndex
    if (!modalEpisodes[epIndex]) return;
    const epId = modalEpisodes[epIndex].id;

    setEpisodeUploadProgress(prev => ({ ...prev, [epId]: { progress: 0, status: 'loading' } }));

    uploadFileToServer(file, (percent) => {
      setEpisodeUploadProgress(prev => ({ ...prev, [epId]: { progress: percent, status: 'loading' } }));
    })
      .then((url) => {
        setEpisodeUploadProgress(prev => ({ ...prev, [epId]: { progress: 100, status: 'success' } }));

        setModalEpisodes(prev => {
          const updated = [...prev];
          if (updated[epIndex]) {
            updated[epIndex].videoUrl = url;
          }
          return updated;
        });

        setTimeout(() => {
          setEpisodeUploadProgress(p => {
            const newP = { ...p };
            delete newP[epId];
            return newP;
          });
        }, 1500);
      })
      .catch((err) => {
        console.error('Epizod video yuklashda xatolik:', err);
        setEpisodeUploadProgress(prev => ({ ...prev, [epId]: { progress: 100, status: 'error' } }));
        showNotification(`Video yuklab bo'lmadi: ${err.message || 'noma\'lum xatolik'}`);
        setTimeout(() => {
          setEpisodeUploadProgress(p => {
            const newP = { ...p };
            delete newP[epId];
            return newP;
          });
        }, 2500);
      });
  };

  // Secondary verification submit handler for sensitive actions
  const handleConfirmSecondaryAuth = (e: React.FormEvent) => {
    e.preventDefault();
    setSecondaryAuthError('');
    if (!pendingAction) return;

    const masterPass = localSettings.secondaryAdminPassword || '8918';
    const cleanInput = secondaryAuthInput.trim();

    // Check if input matches secondary master password OR any admin Telegram ID OR current user ID
    const isMasterPassword = cleanInput === masterPass;
    const isAdminId =
      (localSettings.adminTelegramIds || []).includes(cleanInput) ||
      cleanInput === currentUser.id;

    if (!isMasterPassword && !isAdminId) {
      setSecondaryAuthError(
        "Xavfsizlik paroli yoki Telegram ID noto'g'ri! Iltimos, ikkinchi parolni (8918) yoki admin Telegram ID raqamingizni kiriting."
      );
      return;
    }

    // Execute the sensitive action safely
    try {
      pendingAction.onConfirm();
      // Record to hidden audit trail
      addAuditLog({
        adminId: currentUser.id,
        adminName: `${currentUser.firstName} ${currentUser.lastName || ''}`.trim() || `Admin #${currentUser.id}`,
        action: pendingAction.type,
        targetType: pendingAction.type.includes('CONTENT')
          ? 'ContentItem'
          : pendingAction.type.includes('PLAN')
          ? 'SubscriptionPlan'
          : pendingAction.type.includes('USER')
          ? 'UserProfile'
          : 'SystemSettings',
        targetId: pendingAction.targetId,
        targetTitle: pendingAction.targetTitle,
        details: pendingAction.description,
        secondaryAuthPassed: true,
      });
      setAuditLogs(getStoredAuditLogs());
      showNotification(`Harakat muvaffaqiyatli bajarildi va Audit Jurnaliga yozildi!`);
      setPendingAction(null);
      setSecondaryAuthInput('');
      onRefreshData();
    } catch (err) {
      setSecondaryAuthError(`Xatolik: ${String(err)}`);
    }
  };

  // Save settings with secondary confirmation
  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    setPendingAction({
      type: 'UPDATE_SETTINGS',
      title: 'Global Tizim Sozlamalarini Yangilash',
      description: 'Bot tokeni, to\'lov kartalari, 4800 avto-to\'lov va taqiqlangan ro\'yxatlar yangilanadi.',
      onConfirm: () => {
        updateStoredSettings(localSettings);
        onRefreshData();
      },
    });
  };

  const handleSendBroadcast = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!broadcastMessage) return;

    setPendingAction({
      type: 'UPDATE_SETTINGS', // Reusing type for auth
      title: "Ommaviy Xabar Yuborish",
      description: "Barcha foydalanuvchilarga ushbu xabar bot orqali jo'natiladi. Davom etamizmi?",
      onConfirm: async () => {
        try {
          setBroadcastStatus('sending');
          let photoUrl = '';
          let buttonUrl = '';
          let buttonText = "🎬 Tomosha qilish";

          if (broadcastTargetContent) {
            const c = contents.find(c => c.id === broadcastTargetContent);
            if (c) {
              photoUrl = c.posterUrl;
              // Web app link to content - Telegram dislikes localhost, so we use a dummy domain for local testing
              const origin = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' 
                ? 'https://t.me/Manyaktvbot' 
                : window.location.origin;
              
              buttonUrl = origin === 'https://t.me/Manyaktvbot' 
                ? 'https://t.me/Manyaktvbot' 
                : `${origin}?content=${c.id}`;
            }
          }

          const res = await fetch('/api/broadcast', {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              ...(await getAuthHeaders()),
            },
            body: JSON.stringify({
              text: broadcastMessage,
              photoUrl,
              buttonText: broadcastTargetContent ? buttonText : undefined,
              buttonUrl: broadcastTargetContent ? buttonUrl : undefined
            })
          });
          const data = await res.json();
          if (data.ok) {
            setBroadcastStatus('success');
            setBroadcastStatusMessage(data.message || 'Yuborish boshlandi!');
            setTimeout(() => setBroadcastStatus('idle'), 3000);
            setBroadcastMessage('');
            setBroadcastTargetContent('');
          } else {
            throw new Error(data.error || 'Noma`lum xato');
          }
        } catch (err) {
          setBroadcastStatus('error');
          setBroadcastStatusMessage(String(err));
        }
      }
    });
  };

  // USERS MANAGEMENT ACTIONS
  const handleGrantVipToUser = (userId: string, days: number) => {
    grantUserVip(userId, days);
    showNotification(`Telegram ID #${userId} ga ${days} kunlik VIP berildi!`);
    refreshAdminData();
    onRefreshData();
  };

  const handleRevokeVipFromUser = (userId: string) => {
    revokeUserVip(userId);
    showNotification(`Telegram ID #${userId} ning VIP obunasi bekor qilindi.`);
    refreshAdminData();
    onRefreshData();
  };

  const handleToggleUserBanAction = (userId: string, ban: boolean) => {
    toggleUserBan(userId, ban);
    showNotification(
      ban
        ? `Telegram ID #${userId} bloklandi! U tizimga kira olmaydi.`
        : `Telegram ID #${userId} blokdan chiqarildi.`
    );
    refreshAdminData();
    onRefreshData();
  };

  const handleToggleDeviceBanAction = (deviceToken: string, ban: boolean) => {
    toggleDeviceBan(deviceToken, ban);
    showNotification(
      ban
        ? `QURILMA BUTUNLAY BLOKLANDI! Ushbu telefondan boshqa Telegram ochsayam tizimga kiritilmaydi.`
        : `Qurilma xavfsizlik blokidan chiqarildi.`
    );
    refreshAdminData();
    onRefreshData();
  };

  const handleResetUserHwidAction = (userId: string, userName: string) => {
    if (
      confirm(
        `${userName} (#${userId}) foydalanuvchining HWID qurilma bog'lanishini tiklamoqchimisiz?\n\nBu orqali foydalanuvchi yangi telefon yoki qurilmasidan bemalol akkauntiga kira oladi.`
      )
    ) {
      resetUserHWIDBindingInStorage(userId);
      showNotification(`${userName} uchun HWID bog'lanishi muvaffaqiyatli tiklandi!`);
      refreshAdminData();
      onRefreshData();
    }
  };

  const handleManualVipGrant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualTelegramId.trim()) return;
    const cleanId = manualTelegramId.trim();
    grantUserVip(cleanId, manualVipDays);
    showNotification(`Telegram ID #${cleanId} ga ${manualVipDays} kun VIP berildi!`);
    setManualTelegramId('');
    refreshAdminData();
    onRefreshData();
  };

  // SCREEN CATALOGS ACTIONS
  const handleOpenCatalogModal = (catalog?: CatalogCategory) => {
    if (catalog) {
      setEditingCatalog({ ...catalog });
    } else {
      setEditingCatalog({
        id: `cat_${Date.now()}`,
        name: '',
        format: 'horizontal_16_9',
        badge: 'YANGI',
        description: '',
        isVisible: true,
        order: catalogsList.length + 1,
      });
    }
    setIsCatalogModalOpen(true);
  };

  const handleSaveCatalogAction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCatalog || !editingCatalog.name) return;

    const fullCat: CatalogCategory = {
      id: editingCatalog.id || `cat_${Date.now()}`,
      name: editingCatalog.name,
      format: editingCatalog.format || 'horizontal_16_9',
      badge: editingCatalog.badge || undefined,
      description: editingCatalog.description || undefined,
      isVisible: editingCatalog.isVisible !== false,
      order: Number(editingCatalog.order) || catalogsList.length + 1,
    };

    saveStoredCatalog(fullCat);
    setIsCatalogModalOpen(false);
    showNotification(`"${fullCat.name}" katalogi ekranga qo'shildi / yangilandi!`);
    refreshAdminData();
    onRefreshData();
  };

  const handleDeleteCatalogAction = (id: string, name?: string) => {
    const isConfirmed = window.confirm(`"${name || 'Katalog'}"ni rostdan ham o'chirmoqchimisiz?`);
    if (!isConfirmed) return;
    deleteStoredCatalog(id);
    showNotification(`"${name || 'Katalog'}" muvaffaqiyatli o'chirildi.`);
    refreshAdminData();
    onRefreshData();
  };

  const handleToggleCatalogVisibility = (catalog: CatalogCategory) => {
    const updated = { ...catalog, isVisible: !catalog.isVisible };
    saveStoredCatalog(updated);
    showNotification(
      updated.isVisible
        ? `"${catalog.name}" endi ekranda ko'rinadi.`
        : `"${catalog.name}" ekrandan yashirildi.`
    );
    refreshAdminData();
    onRefreshData();
  };

  // Add new genre / catalog
  const handleAddGenre = () => {
    if (!newGenreInput.trim()) return;
    const clean = newGenreInput.trim();
    if (!localSettings.availableGenres.includes(clean)) {
      const updated = [...localSettings.availableGenres, clean];
      const newS = { ...localSettings, availableGenres: updated };
      setLocalSettings(newS);
      updateStoredSettings(newS);
      setNewGenreInput('');
      onRefreshData();
    }
  };

  const handleRemoveGenre = (genre: string) => {
    if (genre === 'Barchasi') return;
    const updated = localSettings.availableGenres.filter((g) => g !== genre);
    const newS = { ...localSettings, availableGenres: updated };
    setLocalSettings(newS);
    updateStoredSettings(newS);
    onRefreshData();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-lg flex flex-col overflow-hidden select-none">
      {/* Admin Top Header */}
      <div className="bg-[#121216] border-b border-zinc-800 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 rounded-xl bg-red-600 text-white shadow-md">
            {isSuperAdmin ? <Crown className="w-5 h-5 text-amber-300" /> : <Shield className="w-5 h-5 text-white" />}
          </div>
          <div>
            <h2 className="text-sm sm:text-base font-extrabold text-white flex items-center gap-2">
              <span>MANYK TV • Boshqaruv</span>
              {isSuperAdmin ? (
                <span className="text-[10px] bg-gradient-to-r from-amber-500/20 to-yellow-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3 text-amber-400" />
                  <span>Bosh Admin (891846690)</span>
                </span>
              ) : (
                <span className="text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2 py-0.5 rounded-full font-bold flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-blue-400" />
                  <span>
                    {(localSettings.appointedAdmins || []).find((a) => a.id === currentUser.id)?.roleTitle || 'Tayinlangan Admin'}
                  </span>
                </span>
              )}
              <span className="text-[10px] text-zinc-500 font-mono">
                ID: {currentUser.id}
              </span>
            </h2>
            <p className="text-[11px] text-zinc-400">
              {isSuperAdmin
                ? "👑 Bosh Admin: To'liq boshqaruv huquqi (Hech qanday cheklovlarsiz)"
                : "🛡️ Bosh Admin tomonidan belgilangan ruxsatnomalar doirasida ishlamoqdasiz"}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Dynamic RBAC Tabs Bar - Only shows tabs permitted for this admin */}
      <div className="bg-[#0e0e11] border-b border-zinc-800/80 px-4 flex items-center gap-1 overflow-x-auto py-2">
        {allowedTabs.map((tab) => {
          const IconComp = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                isActive
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800'
              }`}
            >
              <IconComp className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
              {typeof tab.badge === 'number' && tab.badge > 0 && (
                <span className="bg-amber-500 text-zinc-950 font-black text-[10px] px-1.5 py-0.2 rounded-full animate-pulse">
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* Action Notification Banner */}
      {actionNotification && (
        <div className="mx-4 mt-2 p-2.5 rounded-xl bg-emerald-950/90 border border-emerald-700 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400 flex-shrink-0" />
            <span>{actionNotification}</span>
          </div>
          <button onClick={() => setActionNotification(null)} className="text-emerald-400 hover:text-white">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Tab View Area */}
      <div className="flex-1 overflow-y-auto p-4 max-w-6xl w-full mx-auto">
        {/* 1. STATS & REVENUE TAB */}
        {activeTab === 'stats' && (
          <div className="space-y-6">
            {/* Metric KPI cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Jami Daromad</span>
                  <DollarSign className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-lg sm:text-2xl font-black text-emerald-400">
                  {totalRevenue.toLocaleString()} <span className="text-xs">so'm</span>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">Obuna va drama xaridlari</div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Jami Tomoshalar</span>
                  <Eye className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-lg sm:text-2xl font-black text-white">
                  {totalViews.toLocaleString()}
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">Barcha filmlar bo'yicha</div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Kutilayotgan Cheklar</span>
                  <CheckSquare className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-lg sm:text-2xl font-black text-amber-400">
                  {pendingReceiptsCount}
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">Tasdiqlanishi kerak</div>
              </div>

              <div className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800">
                <div className="flex items-center justify-between text-zinc-400 text-xs mb-1">
                  <span>Jami Kontentlar</span>
                  <Film className="w-4 h-4 text-red-400" />
                </div>
                <div className="text-lg sm:text-2xl font-black text-white">
                  {contents.length}
                </div>
                <div className="text-[10px] text-zinc-500 mt-1">Kino, serial, shorts</div>
              </div>
            </div>

            {/* Content Revenue Breakdown Table (Requested by user) */}
            <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden">
              <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-red-500" />
                    <span>Har bir kino/drama keltirgan daromad statistikasi</span>
                  </h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Foydalanuvchilar tomonidan sotib olingan va ko'rilgan kontentlar hisoboti
                  </p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-zinc-950/70 text-zinc-400 font-semibold border-b border-zinc-800">
                    <tr>
                      <th className="p-3">Film / Drama nomi</th>
                      <th className="p-3">Turi</th>
                      <th className="p-3">Dona narxi</th>
                      <th className="p-3">Tomoshalar</th>
                      <th className="p-3">Keltirgan daromadi</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-800/60">
                    {contents.map((item) => (
                      <tr key={item.id} className="hover:bg-zinc-800/40 transition">
                        <td className="p-3">
                          <div className="flex items-center gap-2.5">
                            <img
                              src={item.posterUrl}
                              alt={item.title}
                              className="w-8 h-10 object-cover rounded"
                            />
                            <div>
                              <div className="font-bold text-white">{item.title}</div>
                              <div className="text-[10px] text-zinc-400">{item.year}</div>
                            </div>
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="capitalize px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-medium text-[10px]">
                            {item.type === 'short_drama'
                              ? 'Short Drama'
                              : item.type === 'series'
                              ? 'Serial'
                              : item.type === 'anime_series'
                              ? 'Anime Serial'
                              : 'Kino'}
                          </span>
                        </td>
                        <td className="p-3 font-semibold text-zinc-300">
                          {item.price > 0 ? `${item.price.toLocaleString()} so'm` : 'Bepul'}
                        </td>
                        <td className="p-3 text-zinc-300">
                          {(item.viewsCount || 0).toLocaleString()}
                        </td>
                        <td className="p-3 font-extrabold text-emerald-400">
                          {(item.revenue || 0).toLocaleString()} so'm
                        </td>
                        <td className="p-3">
                          {item.isPremium ? (
                            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/60 border border-amber-800/60 px-2 py-0.5 rounded">
                              PREMIUM
                            </span>
                          ) : (
                            <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded">
                              BEPUL
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* 2. CONTENT MANAGER TAB */}
        {activeTab === 'content' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white">Kino va Dramalar Katalogi</h3>
                <p className="text-xs text-zinc-400">Yangi kino qo'shing yoki video yuklang</p>
              </div>
              {userPermissions.canAddContent && (
                <button
                  onClick={() => handleOpenContentEditor()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-xs text-white shadow-lg shadow-red-600/30 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Yangi Qo'shish</span>
                </button>
              )}
            </div>

            {/* Content Filters */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2">
              <button
                onClick={() => setContentFilter('all')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  contentFilter === 'all' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Barchasi
              </button>
              <button
                onClick={() => setContentFilter('movie')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  contentFilter === 'movie' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Kinolar
              </button>
              <button
                onClick={() => setContentFilter('series')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  contentFilter === 'series' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Seriallar
              </button>
              <button
                onClick={() => setContentFilter('anime_series')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  contentFilter === 'anime_series' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Animelar
              </button>
              <button
                onClick={() => setContentFilter('short_drama')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-colors ${
                  contentFilter === 'short_drama' ? 'bg-white text-black' : 'bg-zinc-800 text-zinc-400 hover:bg-zinc-700'
                }`}
              >
                Mini Dramalar
              </button>
            </div>

            {/* Content List */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {contents.filter(item => contentFilter === 'all' ? true : item.type === contentFilter).map((item) => (
                <div
                  key={item.id}
                  className="p-3 rounded-xl bg-zinc-900/90 border border-zinc-800 flex gap-3 group"
                >
                  <img
                    src={item.posterUrl}
                    alt={item.title}
                    className="w-16 h-22 object-cover rounded-lg flex-shrink-0 bg-zinc-950"
                  />
                  <div className="flex-1 min-w-0 flex flex-col justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white line-clamp-2 leading-tight">{item.title}</h4>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="text-[10px] text-zinc-400">{item.year}</span>
                        <span className="text-[10px] text-zinc-400">•</span>
                        <span className="text-[10px] text-red-400 font-bold uppercase">
                          {item.type}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1">
                        <span className="text-[11px] font-extrabold text-emerald-400">
                          {item.price > 0 ? `${item.price.toLocaleString()} so'm` : 'Bepul'}
                        </span>
                        {item.isVipIncluded === false ? (
                          <span className="text-[9px] bg-amber-950/80 text-amber-300 border border-amber-800/80 px-1.5 py-0.2 rounded font-bold">
                            VIP emas • Buy Now
                          </span>
                        ) : (
                          <span className="text-[9px] bg-zinc-800 text-zinc-300 border border-zinc-700 px-1.5 py-0.2 rounded font-medium">
                            VIP rejasida
                          </span>
                        )}
                      </div>
                      {item.episodes && (
                        <div className="text-[10px] text-amber-400">
                          {item.episodes.length} ta epizod
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 pt-2 border-t border-zinc-800/80 justify-end">
                      {userPermissions.canEditContent && (
                        <button
                          onClick={() => handleOpenContentEditor(item)}
                          title="Tahrirlash"
                          className="p-1.5 rounded bg-zinc-800 hover:bg-emerald-500/10 text-zinc-400 hover:text-emerald-400 border border-zinc-700/50 hover:border-emerald-500/30 transition-colors flex items-center justify-center"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {userPermissions.canDeleteContent && (
                        <button
                          onClick={() => handleDeleteContentDirectly(item)}
                          title="O'chirish"
                          className="p-1.5 rounded bg-zinc-800 hover:bg-red-500/10 text-zinc-400 hover:text-red-400 border border-zinc-700/50 hover:border-red-500/30 transition-colors flex items-center justify-center"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 2.5 USERS & DEVICE SECURITY TAB */}
        {activeTab === 'users' && (
          <div className="space-y-5">
            {/* Header & Description */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Users className="w-5 h-5 text-red-500" />
                  <span>Foydalanuvchilar va Xavfsizlik Nazorati</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Telegram ID orqali qidirish, VIP obuna berish, Telegram hisobini bloklash va qurilmani butunlay cheklash (Hardware Ban)
                </p>
              </div>

              <button
                onClick={refreshAdminData}
                className="self-start sm:self-auto flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-semibold transition border border-zinc-700"
              >
                <span>Ro'yxatni yangilash</span>
              </button>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800">
                <div className="text-[10px] uppercase font-bold text-zinc-400 mb-1">
                  Jami Foydalanuvchilar
                </div>
                <div className="text-xl font-black text-white font-mono">{usersList.length}</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-amber-900/40">
                <div className="text-[10px] uppercase font-bold text-amber-400 mb-1">
                  Faol VIP A'zolar
                </div>
                <div className="text-xl font-black text-amber-400 font-mono">
                  {usersList.filter((u) => u.isVip).length}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-red-900/40">
                <div className="text-[10px] uppercase font-bold text-red-400 mb-1">
                  Bloklangan IDlar
                </div>
                <div className="text-xl font-black text-red-400 font-mono">
                  {localSettings.bannedUserIds?.length || 0}
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-red-800/70 bg-red-950/20">
                <div className="text-[10px] uppercase font-bold text-red-300 mb-1">
                  Bloklangan Qurilmalar (HWID)
                </div>
                <div className="text-xl font-black text-red-300 font-mono">
                  {localSettings.bannedDeviceTokens?.length || 0}
                </div>
              </div>
            </div>

            {/* Quick Grant VIP to ANY Telegram ID */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-zinc-900 to-zinc-900/90 border border-zinc-800 shadow-lg">
              <h4 className="text-xs font-bold text-white mb-2 flex items-center gap-1.5 text-amber-400">
                <Sparkles className="w-4 h-4 text-amber-400" />
                <span>Telegram ID orqali To'g'ridan-to'g'ri VIP Berish:</span>
              </h4>
              <form onSubmit={handleManualVipGrant} className="flex flex-wrap items-center gap-2">
                <div className="flex-1 min-w-[180px]">
                  <input
                    type="text"
                    required
                    value={manualTelegramId}
                    onChange={(e) => setManualTelegramId(e.target.value)}
                    placeholder="Telegram ID raqami (masalan: 891846690)"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-amber-500"
                  />
                </div>

                <div className="w-40">
                  <select
                    value={manualVipDays}
                    onChange={(e) => setManualVipDays(Number(e.target.value))}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  >
                    <option value={7}>7 kun</option>
                    <option value={30}>30 kun (1 oy)</option>
                    <option value={90}>90 kun (3 oy)</option>
                    <option value={180}>180 kun (6 oy)</option>
                    <option value={365}>365 kun (1 yil)</option>
                    <option value={3650}>Cheksiz VIP</option>
                  </select>
                </div>

                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-bold text-xs shadow-md transition whitespace-nowrap"
                >
                  VIP Obuna Berish
                </button>
              </form>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={userSearchQuery}
                onChange={(e) => setUserSearchQuery(e.target.value)}
                placeholder="Telegram ID, ism, username yoki qurilma tokeni (HWID) bo'yicha qidirish..."
                className="w-full pl-10 pr-4 py-2.5 bg-zinc-900/90 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 outline-none focus:border-red-500"
              />
              {userSearchQuery && (
                <button
                  onClick={() => setUserSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-white text-xs"
                >
                  Tozalash
                </button>
              )}
            </div>

            {/* Users List Cards */}
            <div className="space-y-3">
              {usersList
                .filter((u) => {
                  if (!userSearchQuery.trim()) return true;
                  const q = userSearchQuery.toLowerCase();
                  return (
                    u.id.toLowerCase().includes(q) ||
                    u.name.toLowerCase().includes(q) ||
                    (u.username && u.username.toLowerCase().includes(q)) ||
                    (u.deviceToken && u.deviceToken.toLowerCase().includes(q))
                  );
                })
                .map((u) => {
                  const isTelegramBanned =
                    u.isBanned || localSettings.bannedUserIds?.includes(u.id);
                  const isDeviceBanned =
                    u.isDeviceBanned ||
                    (u.deviceToken && localSettings.bannedDeviceTokens?.includes(u.deviceToken));

                  return (
                    <div
                      key={u.id}
                      className={`p-4 rounded-2xl border transition ${
                        isDeviceBanned
                          ? 'bg-red-950/30 border-red-800/80 shadow-lg'
                          : isTelegramBanned
                          ? 'bg-red-950/20 border-red-900/60'
                          : u.isVip
                          ? 'bg-zinc-900/90 border-amber-900/40'
                          : 'bg-zinc-900/80 border-zinc-800'
                      }`}
                    >
                      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        {/* User Identity & Details */}
                        <div className="space-y-1.5 flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className="font-mono font-black text-sm text-white flex items-center gap-1.5">
                              <span>ID: {u.id}</span>
                              {u.id === '891846690' && (
                                <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.2 rounded font-bold uppercase">
                                  Bosh Admin
                                </span>
                              )}
                            </span>

                            {u.isVip ? (
                              <span className="bg-amber-500/20 text-amber-300 border border-amber-500/40 text-[10px] font-extrabold px-2 py-0.5 rounded-full flex items-center gap-1">
                                <Sparkles className="w-3 h-3" />
                                <span>VIP OBUNA</span>
                              </span>
                            ) : (
                              <span className="bg-zinc-800 text-zinc-400 text-[10px] font-bold px-2 py-0.5 rounded-full">
                                Oddiy
                              </span>
                            )}

                            {isTelegramBanned && (
                              <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1">
                                <UserX className="w-3 h-3" />
                                <span>TELEGRAM BLOK</span>
                              </span>
                            )}

                            {isDeviceBanned && (
                              <span className="bg-red-900 text-red-200 border border-red-700 text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                                <MonitorOff className="w-3 h-3" />
                                <span>QURILMA BLOKLANGAN (HWID)</span>
                              </span>
                            )}
                          </div>

                          <div className="text-xs text-zinc-300 flex flex-wrap gap-x-4 gap-y-1">
                            <span className="font-semibold text-white">
                              {u.firstName || ''} {u.lastName || ''} {u.username ? `(@${u.username})` : ''}
                            </span>
                            {u.phone && (
                              <span className="text-zinc-400">Tel: {u.phone}</span>
                            )}
                            {u.isVip && u.vipExpiresAt && (
                              <span className="text-amber-400 font-medium">
                                VIP muddati: {new Date(u.vipExpiresAt).toLocaleDateString()} gacha
                              </span>
                            )}
                          </div>

                          {/* Hardware Device Token & HWID Binding Information */}
                          <div className="pt-1 text-[11px] font-mono text-zinc-400 flex flex-col gap-1">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="flex items-center gap-1 text-zinc-500">
                                <Smartphone className="w-3.5 h-3.5" />
                                <span>Qurilma Tokeni (HWID):</span>
                              </span>
                              <span className="bg-zinc-950 px-2 py-0.5 rounded border border-zinc-800 text-zinc-300">
                                {u.deviceToken || 'Noma\'lum qurilma'}
                              </span>
                            </div>

                            {u.hwidBinding && (
                              <div className="flex flex-wrap items-center gap-2 text-emerald-400">
                                <span className="flex items-center gap-1 text-emerald-500">
                                  <ShieldCheck className="w-3.5 h-3.5" />
                                  <span>Biriktirilgan Qurilma:</span>
                                </span>
                                <span className="bg-emerald-950/40 px-2 py-0.5 rounded border border-emerald-800/60 text-emerald-300 text-[10px]">
                                  {u.hwidBinding.deviceSummary}
                                </span>
                                <span className="text-[10px] text-zinc-500">
                                  ({u.hwidBinding.loginCount || 1} marta kirilgan)
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Control Actions */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-2 md:pt-0 border-t md:border-t-0 border-zinc-800">
                          {/* VIP Grant Quick Buttons */}
                          <div className="flex items-center gap-1 bg-zinc-950 p-1 rounded-xl border border-zinc-800">
                            <button
                              onClick={() => handleGrantVipToUser(u.id, 7)}
                              className="px-1.5 py-1 rounded-lg bg-zinc-900 hover:bg-amber-600 hover:text-black text-[10px] font-bold text-zinc-300 transition"
                              title="7 kunlik VIP berish"
                            >
                              +7K
                            </button>
                            <button
                              onClick={() => handleGrantVipToUser(u.id, 30)}
                              className="px-1.5 py-1 rounded-lg bg-zinc-900 hover:bg-amber-600 hover:text-black text-[10px] font-bold text-zinc-300 transition"
                              title="30 kunlik VIP berish"
                            >
                              +30K
                            </button>
                            <button
                              onClick={() => handleGrantVipToUser(u.id, 365)}
                              className="px-1.5 py-1 rounded-lg bg-zinc-900 hover:bg-amber-600 hover:text-black text-[10px] font-bold text-amber-400 transition"
                              title="1 yillik VIP berish"
                            >
                              +1Y
                            </button>
                            {u.isVip && (
                              <button
                                onClick={() => handleRevokeVipFromUser(u.id)}
                                className="px-1.5 py-1 rounded-lg bg-red-950/60 hover:bg-red-900 text-red-300 text-[10px] font-bold transition ml-1"
                                title="VIP obunani bekor qilish"
                              >
                                -VIP
                              </button>
                            )}
                          </div>

                          {/* HWID Reset Action */}
                          {(u.hwidBinding || u.deviceToken) && (
                            <button
                              onClick={() =>
                                handleResetUserHwidAction(u.id, u.firstName || u.username || u.id)
                              }
                              className="p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center bg-zinc-900 hover:bg-amber-950/50 text-zinc-300 hover:text-amber-300 border border-zinc-800 hover:border-amber-700/60"
                              title="Foydalanuvchi yangi telefon olganda HWID bog'lanishini tozalash (HWID Reset)"
                            >
                              <RefreshCw className="w-4 h-4" />
                            </button>
                          )}

                          {/* Telegram Account Ban Toggle */}
                          <button
                            onClick={() => handleToggleUserBanAction(u.id, !isTelegramBanned)}
                            className={`p-1.5 rounded-lg text-xs font-bold transition flex items-center justify-center ${
                              isTelegramBanned
                                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                                : 'bg-zinc-800 hover:bg-red-900/60 text-zinc-300 hover:text-red-300'
                            }`}
                            title={isTelegramBanned ? 'ID Blokdan Chiqarish' : 'ID Bloklash'}
                          >
                            <UserX className="w-4 h-4" />
                          </button>

                          {/* HARDWARE DEVICE BAN (BOSHQA TELEGRAM OCHSAYAM KIRA OLMASIN) */}
                          {u.deviceToken && (
                            <button
                              onClick={() =>
                                handleToggleDeviceBanAction(u.deviceToken!, !isDeviceBanned)
                              }
                              className={`p-1.5 rounded-lg text-xs font-black transition flex items-center justify-center shadow-md ${
                                isDeviceBanned
                                  ? 'bg-zinc-800 hover:bg-zinc-700 text-zinc-200 border border-zinc-700'
                                  : 'bg-red-600 hover:bg-red-700 text-white'
                              }`}
                              title={isDeviceBanned ? "Qurilmani blokdan chiqarish" : "Ushbu qurilmani butunlay bloklash: boshqa Telegram akkaunt ochsa ham kira olmaydi!"}
                            >
                              <MonitorOff className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}

              {usersList.length === 0 && (
                <div className="p-8 text-center bg-zinc-900/50 rounded-2xl border border-zinc-800">
                  <p className="text-zinc-400 text-xs">Foydalanuvchilar mavjud emas</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* 3. DEDICATED PAYMENTS & TELEGRAM BOT SYNC TAB */}
        {activeTab === 'receipts' && (
          <div className="space-y-5">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-5 h-5 text-red-500" />
                  <span>To'lov Cheklari & Telegram Bot Sinxronlash</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Chek orqali to'lovlar. Tasdiqlash kelganda ham Telegram botga, ham ilovaga obunani tasdiqlash buyrug'i yetkaziladi
                </p>
              </div>

              {/* Sub-tab Navigation */}
              <div className="inline-flex bg-zinc-900 p-1 rounded-xl border border-zinc-800 self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setPaymentSubTab('history')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    paymentSubTab === 'history'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>To'lov cheklari</span>
                  {pendingReceiptsCount > 0 && (
                    <span className="bg-amber-500 text-zinc-950 text-[10px] font-black px-1.5 py-0.2 rounded-full">
                      {pendingReceiptsCount}
                    </span>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentSubTab('bot_sync')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    paymentSubTab === 'bot_sync'
                      ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800/60 shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <Bot className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Telegram Bot & Sinxron</span>
                </button>
                <button
                  type="button"
                  onClick={() => setPaymentSubTab('card_config')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                    paymentSubTab === 'card_config'
                      ? 'bg-zinc-800 text-white shadow-sm'
                      : 'text-zinc-400 hover:text-white'
                  }`}
                >
                  <SlidersHorizontal className="w-3.5 h-3.5" />
                  <span>Karta Rekvizitlari</span>
                </button>
              </div>
            </div>

            {/* SUBTAB 1: TO'LOV CHEKLARI (PRIMARY RECEIPT VERIFICATION) */}
            {paymentSubTab === 'history' && (
              <div className="space-y-4">
                {/* Search & Status Filter Bar */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between">
                  <div className="relative w-full sm:w-80">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-zinc-500" />
                    <input
                      type="text"
                      value={receiptSearch}
                      onChange={(e) => setReceiptSearch(e.target.value)}
                      placeholder="Foydalanuvchi, ID yoki telefon..."
                      className="w-full pl-9 pr-4 py-2 bg-zinc-900 border border-zinc-700 rounded-xl text-xs text-white placeholder:text-zinc-500 outline-none focus:border-red-500"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      type="button"
                      onClick={handleSyncBotCommands}
                      disabled={isSyncingBot}
                      className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-bold flex items-center gap-1.5 transition border border-zinc-700 disabled:opacity-50"
                      title="Telegram botdan yangi tasdiq xabarlarini tekshirish"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 text-emerald-400 ${isSyncingBot ? 'animate-spin' : ''}`} />
                      <span>{isSyncingBot ? "Tekshirilmoqda..." : "Botdan tekshirish"}</span>
                    </button>

                    <div className="flex items-center gap-1 bg-zinc-900 p-1 rounded-xl border border-zinc-800 overflow-x-auto">
                      {(['all', 'pending', 'approved', 'rejected'] as const).map((filterVal) => (
                        <button
                          key={filterVal}
                          type="button"
                          onClick={() => setReceiptFilter(filterVal)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap ${
                            receiptFilter === filterVal
                              ? 'bg-zinc-800 text-white shadow-sm'
                              : 'text-zinc-400 hover:text-white'
                          }`}
                        >
                          {filterVal === 'all' && "Barchasi"}
                          {filterVal === 'pending' && `Kutilmoqda (${pendingReceiptsCount})`}
                          {filterVal === 'approved' && "Tasdiqlangan"}
                          {filterVal === 'rejected' && "Rad etilgan"}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Quick Bot command runner bar */}
                <form
                  onSubmit={handleExecuteBotCommand}
                  className="p-3 bg-zinc-900/70 border border-zinc-800 rounded-xl flex flex-col sm:flex-row items-center gap-2"
                >
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 flex-shrink-0">
                    <Bot className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-zinc-300">Bot Buyrug'i:</span>
                  </div>
                  <input
                    type="text"
                    value={botCommandInput}
                    onChange={(e) => setBotCommandInput(e.target.value)}
                    placeholder="Masalan: /approve_rcpt_123 yoki /reject_rcpt_123"
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-lg px-3 py-1.5 text-xs text-white font-mono placeholder:text-zinc-600 outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-lg shadow transition flex items-center justify-center gap-1.5 flex-shrink-0"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Buyruqni Bajarish</span>
                  </button>
                </form>

                {/* Filtered Receipts List */}
                {(() => {
                  const filtered = receipts.filter((rcpt) => {
                    const matchesFilter =
                      receiptFilter === 'all' ? true : rcpt.status === receiptFilter;
                    const matchesSearch =
                      !receiptSearch.trim() ||
                      rcpt.userName?.toLowerCase().includes(receiptSearch.toLowerCase()) ||
                      rcpt.userId?.toString().includes(receiptSearch) ||
                      rcpt.userPhone?.toLowerCase().includes(receiptSearch.toLowerCase()) ||
                      rcpt.contentTitle?.toLowerCase().includes(receiptSearch.toLowerCase()) ||
                      rcpt.planName?.toLowerCase().includes(receiptSearch.toLowerCase());
                    return matchesFilter && matchesSearch;
                  });

                  if (filtered.length === 0) {
                    return (
                      <div className="p-10 text-center bg-zinc-900/40 rounded-2xl border border-zinc-800">
                        <CreditCard className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                        <p className="text-zinc-400 text-xs font-semibold">
                          To'lov cheklari topilmadi
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-3">
                      {filtered.map((rcpt) => (
                        <div
                          key={rcpt.id}
                          className={`p-4 rounded-xl border transition flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
                            rcpt.status === 'pending'
                              ? 'bg-amber-950/20 border-amber-700/60'
                              : rcpt.status === 'approved'
                              ? 'bg-zinc-900/80 border-emerald-800/50'
                              : 'bg-zinc-900/60 border-zinc-800 opacity-60'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            {/* Zoomable receipt thumbnail */}
                            <img
                              src={rcpt.receiptImageUrl}
                              alt="Chek"
                              onClick={() => setSelectedReceipt(rcpt)}
                              className="w-14 h-14 object-cover rounded-lg border border-zinc-700 cursor-pointer hover:scale-105 transition flex-shrink-0"
                            />
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold text-sm text-white">{rcpt.userName}</span>
                                <span className="text-[11px] font-mono text-zinc-400">
                                  ID: {rcpt.userId}
                                </span>
                              </div>
                              <div className="text-xs text-zinc-300 mt-0.5">
                                {rcpt.type === 'vip_subscription'
                                  ? `VIP Obuna: ${rcpt.planName || ''}`
                                  : `Serial/Kino: ${rcpt.contentTitle || ''}`}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-xs font-black text-emerald-400">
                                  {rcpt.amount.toLocaleString()} so'm
                                </span>
                                {rcpt.userPhone && (
                                  <span className="text-[10px] text-zinc-400 font-mono">
                                    {rcpt.userPhone}
                                  </span>
                                )}
                              </div>
                              {rcpt.notes && (
                                <div className="text-[11px] text-zinc-400 italic mt-0.5">
                                  "{rcpt.notes}"
                                </div>
                              )}
                              {/* Telegram bot command helper */}
                              <div className="mt-1.5 flex items-center gap-2">
                                <button
                                  type="button"
                                  onClick={() => {
                                    navigator.clipboard.writeText(`/approve_${rcpt.id}`);
                                    showNotification(`Bot buyrug'i nusxalandi: /approve_${rcpt.id}`);
                                  }}
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-zinc-800 hover:bg-zinc-750 text-[10px] font-mono text-emerald-400 border border-zinc-700 transition"
                                >
                                  <Bot className="w-3 h-3 text-emerald-400" />
                                  <span>/approve_{rcpt.id.slice(-6)}</span>
                                </button>
                              </div>
                            </div>
                          </div>

                          {/* Status / Action buttons */}
                          <div className="flex items-center gap-2 self-end sm:self-center">
                            {rcpt.status === 'pending' ? (
                              <>
                                <button
                                  onClick={() => handleReviewReceipt(rcpt.id, 'approved')}
                                  title="Tasdiqlash (Bot + Ilova)"
                                  className="p-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white shadow-md transition active:scale-95 flex items-center justify-center"
                                >
                                  <CheckCircle2 className="w-5 h-5" />
                                </button>
                                <button
                                  onClick={() => handleReviewReceipt(rcpt.id, 'rejected')}
                                  title="Rad etish"
                                  className="p-2 rounded-xl bg-zinc-800 hover:bg-red-900/60 text-zinc-300 hover:text-red-400 transition flex items-center justify-center"
                                >
                                  <X className="w-5 h-5" />
                                </button>
                              </>
                            ) : (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className={`text-xs font-bold uppercase px-3 py-1.5 rounded-full flex items-center gap-1.5 ${
                                    rcpt.status === 'approved'
                                      ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                                      : 'bg-red-950 text-red-400 border border-red-800'
                                  }`}
                                >
                                  {rcpt.status === 'approved' ? (
                                    <>
                                      <CheckCircle2 className="w-3.5 h-3.5" />
                                      <span>Tasdiqlangan (Bot + Ilova)</span>
                                    </>
                                  ) : (
                                    <span>Rad etilgan</span>
                                  )}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </div>
            )}

            {/* SUBTAB 2: TELEGRAM BOT VA BUYRUQLAR SINXRONLASH */}
            {paymentSubTab === 'bot_sync' && (
              <div className="space-y-4 max-w-2xl mx-auto">
                {/* Bot Status Card */}
                <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-emerald-950/80 border border-emerald-800/60 flex items-center justify-center text-emerald-400">
                        <Bot className="w-5 h-5" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold text-white">Telegram Bot Sinxronizatsiyasi</h4>
                        <p className="text-xs text-zinc-400">
                          To'lov tasdiqlanganda ham botga, ham ilovaga bir vaqtda signal keladi
                        </p>
                      </div>
                    </div>
                    <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                      FAOL
                    </span>
                  </div>

                  {/* Flow description */}
                  <div className="p-4 rounded-xl bg-zinc-950 border border-zinc-800/80 space-y-3 text-xs text-zinc-300">
                    <div className="font-bold text-white flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-amber-400" />
                      <span>Qanday ishlaydi:</span>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          1
                        </span>
                        <p>
                          Foydalanuvchi kartaga pul o'tkazib, ilova orqali chek rasmini yuklaydi.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          2
                        </span>
                        <p>
                          Telegram botga darhol yangi chek xabari va <code className="text-emerald-400 font-mono">/approve_rcpt_id</code> buyrug'i keladi.
                        </p>
                      </div>
                      <div className="flex items-start gap-2">
                        <span className="w-5 h-5 rounded-full bg-zinc-800 text-zinc-300 font-bold text-[10px] flex items-center justify-center flex-shrink-0 mt-0.5">
                          3
                        </span>
                        <p>
                          Admin chekni ko'rib tasdiqlashi bilan:
                          <b className="text-white block mt-1">• Botga: "✅ Sizning to'lovingiz tasdiqlandi! VIP obunangiz ochildi" xabari ketadi.</b>
                          <b className="text-white block">• Ilovaga: Real-vaqtda obunani tasdiqlash buyrug'i kelib, barcha serial va filmlar ochiladi!</b>
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Sync Button */}
                  <div className="pt-2">
                    <button
                      type="button"
                      onClick={handleSyncBotCommands}
                      disabled={isSyncingBot}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/30 transition"
                    >
                      <RefreshCw className={`w-4 h-4 ${isSyncingBot ? 'animate-spin' : ''}`} />
                      <span>{isSyncingBot ? "Bot buyruqlari tekshirilmoqda..." : "Telegram Botdan Tasdiqlash Buyruqlarini Tekshirish"}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* SUBTAB 3: KARTA REKVIZITLARI SOZLAMALARI */}
            {paymentSubTab === 'card_config' && (
              <div className="space-y-4 max-w-xl mx-auto">
                <div className="p-5 rounded-2xl bg-zinc-900/90 border border-zinc-800 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-white">Qabul qiluvchi karta rekvizitlari</h4>
                    <p className="text-xs text-zinc-400 mt-0.5">
                      Foydalanuvchilar to'lov oynasida ko'radigan karta raqami va bank ma'lumotlari
                    </p>
                  </div>

                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Karta raqami:
                      </label>
                      <input
                        type="text"
                        value={localSettings.cardPayment.cardNumber}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            cardPayment: {
                              ...localSettings.cardPayment,
                              cardNumber: e.target.value,
                            },
                          })
                        }
                        className="w-full font-mono bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Karta egasi ismi:
                      </label>
                      <input
                        type="text"
                        value={localSettings.cardPayment.cardHolder}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            cardPayment: {
                              ...localSettings.cardPayment,
                              cardHolder: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Bank / To'lov tizimi nomi:
                      </label>
                      <input
                        type="text"
                        value={localSettings.cardPayment.bankName}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            cardPayment: {
                              ...localSettings.cardPayment,
                              bankName: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-zinc-300 mb-1">
                        Ko'rsatma matni:
                      </label>
                      <textarea
                        rows={2}
                        value={localSettings.cardPayment.instructions}
                        onChange={(e) =>
                          setLocalSettings({
                            ...localSettings,
                            cardPayment: {
                              ...localSettings.cardPayment,
                              instructions: e.target.value,
                            },
                          })
                        }
                        className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white outline-none focus:border-red-500"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      updateStoredSettings(localSettings);
                      showNotification("Karta rekvizitlari muvaffaqiyatli saqlandi!");
                      onRefreshData();
                    }}
                    className="w-full py-3 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-xs text-white shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-1.5"
                  >
                    <Save className="w-4 h-4" />
                    <span>Rekvizitlarni Saqlash</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. PLANS TAB */}
        {activeTab === 'plans' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">VIP Tariflar Boshqaruvi</h3>
                <p className="text-xs text-zinc-400">
                  Tarif narxlari, muddatlari va imtiyozlarini sozlang
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingPlan({
                    id: `plan_${Date.now()}`,
                    name: 'Yangi VIP Tarif',
                    durationDays: 30,
                    price: 45000,
                    badge: '',
                    description: 'VIP obuna ta\'rifi',
                    features: ['Barcha filmlar ochiq', 'Reklamasiz'],
                    isActive: true,
                  });
                  setIsPlanModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-xs text-white shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Tarif Qo'shish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {plans.map((plan) => (
                <div
                  key={plan.id}
                  className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 relative flex flex-col justify-between"
                >
                  <div>
                    {plan.badge && (
                      <span className="text-[9px] font-black bg-red-600 text-white px-2 py-0.5 rounded-full absolute -top-2 right-3">
                        {plan.badge}
                      </span>
                    )}
                    <h4 className="font-bold text-white text-sm">{plan.name}</h4>
                    <div className="text-xs text-zinc-400 mt-0.5">{plan.durationDays} kun</div>
                    <div className="text-lg font-black text-red-500 mt-2">
                      {plan.price.toLocaleString()} so'm
                    </div>
                    <p className="text-xs text-zinc-400 mt-2">{plan.description}</p>
                    <ul className="mt-3 space-y-1">
                      {plan.features.map((f, i) => (
                        <li key={i} className="text-[11px] text-zinc-300 flex items-center gap-1.5">
                          <Check className="w-3 h-3 text-emerald-400 flex-shrink-0" />
                          <span>{f}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-zinc-800 justify-end">
                    <button
                      onClick={() => {
                        setEditingPlan({ ...plan, features: [...(plan.features || [])] });
                        setNewPlanFeatureInput('');
                        setIsPlanModalOpen(true);
                      }}
                      title="Tahrirlash"
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 transition flex items-center justify-center"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => {
                        setPendingAction({
                          type: 'DELETE_PLAN',
                          title: `"${plan.name}" tarifini o'chirish`,
                          description: `"${plan.name}" obuna tarifi o'chiriladi. Davom etish uchun admin paroli yoki Telegram ID ni kiriting.`,
                          targetId: plan.id,
                          targetTitle: plan.name,
                          onConfirm: () => {
                            deleteStoredPlan(plan.id);
                            onRefreshData();
                            showNotification(`"${plan.name}" tarifi muvaffaqiyatli o'chirildi!`);
                          },
                        });
                      }}
                      title="Tarifni butunlay o'chirish"
                      className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-900/80 text-zinc-400 hover:text-red-300 transition flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. PROMOS TAB */}
        {activeTab === 'promos' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">Chegirma Promokodlari</h3>
                <p className="text-xs text-zinc-400">
                  Foydalanuvchilarga chegirma berish uchun kodlar yarating
                </p>
              </div>
              <button
                onClick={() => {
                  setEditingPromo({
                    id: `promo_${Date.now()}`,
                    code: 'CHEGIRMA20',
                    discountPercent: 20,
                    maxUses: 100,
                    usedCount: 0,
                    expiresAt: '2026-12-31T23:59:59Z',
                    isActive: true,
                  });
                  setIsPromoModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-xs text-white shadow-md transition"
              >
                <Plus className="w-4 h-4" />
                <span>Promokod Qo'shish</span>
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {promoCodes.map((pr) => (
                <div
                  key={pr.id}
                  className="p-4 rounded-xl bg-zinc-900/90 border border-zinc-800 flex items-center justify-between"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-black text-sm text-red-400">{pr.code}</span>
                      <span className="text-[10px] font-bold bg-red-950 text-red-300 border border-red-800 px-1.5 py-0.5 rounded">
                        -{pr.discountPercent}%
                      </span>
                    </div>
                    <div className="text-xs text-zinc-400 mt-1">
                      Ishlatilgan: {pr.usedCount} / {pr.maxUses}
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      deleteStoredPromoCode(pr.id);
                      onRefreshData();
                    }}
                    className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-900/60 text-zinc-400 hover:text-red-400"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 6. SCREEN CATALOGS TAB */}
        {activeTab === 'catalogs' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Layers className="w-5 h-5 text-red-500" />
                  <span>Ekranda Chiqadigan Kataloglar Boshqaruvi</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Bosh sahifada chiqadigan maxsus kataloglar (Kino, Mini Drama 9:16, Drama, Anime va boshqalar)
                </p>
              </div>

              <button
                type="button"
                onClick={() => handleOpenCatalogModal()}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-xs text-white shadow-lg shadow-red-600/30 transition self-start sm:self-auto"
              >
                <Plus className="w-4 h-4" />
                <span>Yangi Ekran Kataloqi Qo'shish</span>
              </button>
            </div>

            {/* Explanatory Banner */}
            <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 text-xs text-zinc-300 flex items-center gap-3">
              <div className="w-8 h-8 rounded-lg bg-red-950 border border-red-800 flex items-center justify-center text-red-400 flex-shrink-0">
                <Tv className="w-4 h-4" />
              </div>
              <p>
                Bu yerdagi har bir katalog to'g'ridan-to'g'ri foydalanuvchi ilovasi bosh sahifasida alohida bo'lim bo'lib chiqadi.
                <strong className="text-white ml-1">Mini Drama</strong> katalogidagi videolar avtomatik ravishda <strong className="text-red-400">9:16 vertikal (Tik-Tok)</strong> formatda ochiladi.
              </p>
            </div>

            {/* Catalogs List Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {catalogsList.map((cat) => {
                const assignedCount = contents.filter(
                  (c) =>
                    c.catalogId === cat.id ||
                    c.genres?.includes(cat.name) ||
                    (cat.format === 'vertical_9_16' && c.type === 'short_drama')
                ).length;

                return (
                  <div
                    key={cat.id}
                    className="p-4 rounded-2xl bg-zinc-900/90 border border-zinc-800 flex flex-col justify-between gap-4 hover:border-zinc-700 transition"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-black text-white">{cat.name}</h4>
                          {cat.badge && (
                            <span className="text-[10px] font-extrabold px-2 py-0.5 rounded bg-red-950 text-red-400 border border-red-800 uppercase">
                              {cat.badge}
                            </span>
                          )}
                        </div>

                        {/* Visibility toggle switch */}
                        <button
                          type="button"
                          onClick={() => handleToggleCatalogVisibility(cat)}
                          className={`text-[11px] font-bold px-2.5 py-1 rounded-lg transition border ${
                            cat.isVisible !== false
                              ? 'bg-emerald-950/60 border-emerald-700 text-emerald-300'
                              : 'bg-zinc-800 border-zinc-700 text-zinc-400'
                          }`}
                        >
                          {cat.isVisible !== false ? 'Ekranda Faol' : 'Yashirilgan'}
                        </button>
                      </div>

                      {/* Format Badge */}
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        {cat.format === 'vertical_9_16' ? (
                          <span className="flex items-center gap-1.5 text-[11px] font-black text-pink-400 bg-pink-950/40 border border-pink-800/60 px-2.5 py-1 rounded-lg">
                            <Smartphone className="w-3.5 h-3.5 text-pink-400" />
                            <span>9:16 Vertikal Farmat (Mini Drama / Tik-Tok)</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-zinc-300 bg-zinc-800/80 border border-zinc-700 px-2.5 py-1 rounded-lg">
                            <Film className="w-3.5 h-3.5 text-zinc-400" />
                            <span>16:9 Gorizontal Standart (Kino / Serial)</span>
                          </span>
                        )}

                        <span className="text-xs text-zinc-400 font-mono">
                          Biriktirilgan filmlar: <strong className="text-white">{assignedCount}</strong> ta
                        </span>
                      </div>

                      {cat.description && (
                        <p className="text-xs text-zinc-400 line-clamp-2">{cat.description}</p>
                      )}
                    </div>

                    <div className="flex items-center justify-end gap-1.5 pt-2 border-t border-zinc-800">
                      <button
                        type="button"
                        onClick={() => handleOpenCatalogModal(cat)}
                        title="Tahrirlash"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-emerald-400 transition flex items-center justify-center"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDeleteCatalogAction(cat.id, cat.name)}
                        title="O'chirish"
                        className="p-1.5 rounded-lg bg-zinc-800 hover:bg-red-900/60 text-zinc-400 hover:text-red-400 transition flex items-center justify-center"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* 7. SETTINGS & BOT TAB */}
        {activeTab === 'settings' && (
          <div className="space-y-4 max-w-2xl">
            <div>
              <h3 className="text-base font-bold text-white">Tizim va Bot Sozlamalari</h3>
              <p className="text-xs text-zinc-400">
                Telegram bot tokeni, kanal manzili va to'lov karta rekvizitlari
              </p>
            </div>

            <form onSubmit={handleSaveSettings} className="space-y-4">
              {/* Bot Token */}
              <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-red-400">
                  Telegram Bot Rekvizitlari
                </h4>
                <div>
                  <label className="block text-xs text-zinc-300 mb-1">
                    Bot Token (Asosiy):
                  </label>
                  <input
                    type="text"
                    value={localSettings.botToken}
                    onChange={(e) =>
                      setLocalSettings({ ...localSettings, botToken: e.target.value })
                    }
                    className="w-full font-mono bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                  />
                  <span className="text-[10px] text-zinc-500 mt-1 block">
                    Bot tokenini @BotFather dan oling va .env faylga TELEGRAM_BOT_TOKEN sifatida saqlang
                  </span>
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1">
                    Tasdiqlovchi Telegram Bot Username:
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400 font-mono">@</span>
                    <input
                      type="text"
                      value={(localSettings.botUsername || localSettings.telegramBotUsername || 'Manyaktvbot').replace('@', '')}
                      onChange={(e) => {
                        const val = e.target.value.replace('@', '').trim();
                        setLocalSettings({
                          ...localSettings,
                          botUsername: val,
                          telegramBotUsername: val,
                        });
                      }}
                      placeholder="Manyaktvbot"
                      className="w-full pl-7 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500 font-mono"
                    />
                  </div>
                  <span className="text-[10px] text-zinc-400 mt-1 block">
                    Tasdiqlash va bildirishnomalar boti: <a href={`https://t.me/${(localSettings.botUsername || 'Manyaktvbot').replace('@', '')}`} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline">t.me/{(localSettings.botUsername || 'Manyaktvbot').replace('@', '')}</a>
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1">
                      Telegram Kanal Havolasi:
                    </label>
                    <input
                      type="text"
                      value={localSettings.telegramChannelUrl}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          telegramChannelUrl: e.target.value,
                        })
                      }
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-300 mb-1">
                      Adminga Murojaat Havolasi:
                    </label>
                    <input
                      type="text"
                      value={localSettings.adminContactUrl}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          adminContactUrl: e.target.value,
                        })
                      }
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                    />
                  </div>
                </div>
              </div>

              {/* Payment Card Settings */}
              <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-3">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-red-400">
                  To'lov Karta Rekvizitlari
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1">
                      Karta Raqami:
                    </label>
                    <input
                      type="text"
                      value={localSettings.cardPayment.cardNumber}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          cardPayment: {
                            ...localSettings.cardPayment,
                            cardNumber: e.target.value,
                          },
                        })
                      }
                      className="w-full font-mono bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-300 mb-1">
                      Karta Egasi Ismi:
                    </label>
                    <input
                      type="text"
                      value={localSettings.cardPayment.cardHolder}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          cardPayment: {
                            ...localSettings.cardPayment,
                            cardHolder: e.target.value,
                          },
                        })
                      }
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1">
                    Bank Nomi:
                  </label>
                  <input
                    type="text"
                    value={localSettings.cardPayment.bankName}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        cardPayment: {
                          ...localSettings.cardPayment,
                          bankName: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs text-zinc-300 mb-1">
                    To'lov Bo'yicha Ko'rsatma:
                  </label>
                  <textarea
                    rows={2}
                    value={localSettings.cardPayment.instructions}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        cardPayment: {
                          ...localSettings.cardPayment,
                          instructions: e.target.value,
                        },
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              {/* Secondary Security Password (Requested by user for sensitive actions) */}
              <div className="p-4 bg-zinc-900/90 border border-amber-900/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5" />
                    <span>Ikkinchi Darajali Xavfsizlik Paroli (Master PIN)</span>
                  </h4>
                  <span className="text-[10px] bg-amber-950 text-amber-300 border border-amber-800/80 px-2 py-0.5 rounded font-mono">
                    Standart: 8918
                  </span>
                </div>
                <p className="text-[11px] text-zinc-400">
                  Kontentni o'chirish, global sozlamalarni saqlash va tariflarni o'chirish kabi xavfli amallarda talab qilinadigan ikkinchi xavfsizlik kaliti yoki paroli.
                </p>
                <div>
                  <label className="block text-xs text-zinc-300 mb-1">
                    Master Xavfsizlik Paroli:
                  </label>
                  <input
                    type="text"
                    value={localSettings.secondaryAdminPassword || '8918'}
                    onChange={(e) =>
                      setLocalSettings({
                        ...localSettings,
                        secondaryAdminPassword: e.target.value,
                      })
                    }
                    placeholder="Masalan: 8918"
                    className="w-full font-mono bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-amber-300 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Telegram Bot & Obuna Sinxronlash Sozlamalari */}
              <div className="p-4 bg-zinc-900/90 border border-emerald-900/40 rounded-2xl space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Bot className="w-3.5 h-3.5" />
                    <span>Telegram Bot & Obuna Sinxronlash Tizimi</span>
                  </h4>
                  <span className="text-[10px] bg-emerald-950 text-emerald-400 border border-emerald-800 px-2 py-0.5 rounded font-mono font-bold">
                    FAOL
                  </span>
                </div>

                <p className="text-[11px] text-zinc-300 leading-relaxed">
                  Foydalanuvchi chek yuklaganda botga bildirishnoma boradi. Chek tasdiqlanganda esa <strong>ham Telegram botga, ham ilovaga</strong> obunani tasdiqlash buyrug'i bir vaqtda yetib boradi va foydalanuvchiga barcha yopiq qismlar ochiladi.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs text-zinc-300 mb-1">
                      Telegram Bot Token:
                    </label>
                    <input
                      type="text"
                      value={localSettings.telegramBotToken || '8554246830:AAHTg1Qx_E2jQ1j1_example'}
                      onChange={(e) =>
                        setLocalSettings({
                          ...localSettings,
                          telegramBotToken: e.target.value,
                        })
                      }
                      placeholder="123456:ABC-DEF1234ghIkl-zyx57W2v1u123ew11"
                      className="w-full font-mono bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-emerald-400 outline-none focus:border-emerald-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs text-zinc-300 mb-1">
                      Bot Havolasi / Username:
                    </label>
                    <input
                      type="text"
                      value={localSettings.telegramBotUsername || localSettings.botUsername || 'Manyaktvbot'}
                      onChange={(e) => {
                        const val = e.target.value.replace('@', '').trim();
                        setLocalSettings({
                          ...localSettings,
                          telegramBotUsername: val,
                          botUsername: val,
                        });
                      }}
                      placeholder="Manyaktvbot"
                      className="w-full font-mono bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-emerald-500"
                    />
                  </div>
                </div>
              </div>

              {/* Admin Telegram IDs */}
              <div className="p-4 bg-zinc-900/90 border border-zinc-800 rounded-2xl space-y-2">
                <h4 className="text-xs font-bold text-white uppercase tracking-wider text-red-400">
                  Tasdiqlangan Admin Telegram ID lari
                </h4>
                <div className="flex flex-wrap gap-2 mb-2">
                  {localSettings.adminTelegramIds.map((id) => (
                    <div
                      key={id}
                      className="bg-zinc-800 border border-zinc-700 px-2.5 py-1 rounded-lg text-xs font-mono text-zinc-200 flex items-center gap-1.5"
                    >
                      <span>{id}</span>
                      {id !== '891846690' && (
                        <button
                          type="button"
                          onClick={() => {
                            setLocalSettings({
                              ...localSettings,
                              adminTelegramIds: localSettings.adminTelegramIds.filter(
                                (x) => x !== id
                              ),
                            });
                          }}
                          className="text-zinc-400 hover:text-red-400"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newAdminIdInput}
                    onChange={(e) => setNewAdminIdInput(e.target.value)}
                    placeholder="Yangi admin Telegram ID si"
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white font-mono outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (!newAdminIdInput.trim()) return;
                      const id = newAdminIdInput.trim();
                      if (!localSettings.adminTelegramIds.includes(id)) {
                        setLocalSettings({
                          ...localSettings,
                          adminTelegramIds: [...localSettings.adminTelegramIds, id],
                        });
                        setNewAdminIdInput('');
                      }
                    }}
                    className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl border border-zinc-700"
                  >
                    Qo'shish
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-sm text-white shadow-lg shadow-red-600/30 transition"
              >
                Barcha Sozlamalarni Saqlash (Xavfsizlik Tasdiqlash Bilan)
              </button>
            </form>
          </div>
        )}

        {/* 8. AUDIT TRAIL LOGS TAB (Requested by user) */}
        {activeTab === 'audit' && (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Shield className="w-5 h-5 text-amber-500" />
                  <span>Xavfsizlik Audit Jurnali (Audit Trail)</span>
                </h3>
                <p className="text-xs text-zinc-400">
                  Admin tomonidan qilingan barcha nozik amallar, o'chirishlar va sozlama o'zgarishlari to'liq qayd etiladi
                </p>
              </div>

              <button
                onClick={() => setAuditLogs(getStoredAuditLogs())}
                className="self-start sm:self-auto px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-semibold text-zinc-300 border border-zinc-700 transition"
              >
                Jurnalni yangilash
              </button>
            </div>

            {auditLogs.length === 0 ? (
              <div className="p-8 text-center rounded-2xl bg-zinc-900/60 border border-zinc-800">
                <Shield className="w-10 h-10 text-zinc-600 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-zinc-300">Audit yozuvlari hali yo'q</h4>
                <p className="text-xs text-zinc-500 mt-1">
                  Kontent o'chirilganda yoki tizim sozlamalari yangilanganda bu yerda avtomatik saqlanadi.
                </p>
              </div>
            ) : (
              <div className="bg-zinc-900/90 border border-zinc-800 rounded-2xl overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-zinc-950 text-zinc-400 font-semibold border-b border-zinc-800">
                      <tr>
                        <th className="p-3">Sana & Vaqt</th>
                        <th className="p-3">Harakat (Action)</th>
                        <th className="p-3">Admin</th>
                        <th className="p-3">Ob'ekt / Tafsilot</th>
                        <th className="p-3">Xavfsizlik</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/60">
                      {auditLogs.map((log) => (
                        <tr key={log.id} className="hover:bg-zinc-800/40 transition">
                          <td className="p-3 whitespace-nowrap text-zinc-400 font-mono text-[11px]">
                            {new Date(log.timestamp).toLocaleString('uz-UZ', {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                              second: '2-digit',
                            })}
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span
                              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                                log.action.includes('DELETE')
                                  ? 'bg-red-950 text-red-400 border border-red-800'
                                  : log.action.includes('UPDATE')
                                  ? 'bg-amber-950 text-amber-400 border border-amber-800'
                                  : 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                              }`}
                            >
                              {log.action}
                            </span>
                          </td>
                          <td className="p-3">
                            <div className="font-bold text-white text-xs">{log.adminName}</div>
                            <div className="text-[10px] text-zinc-500 font-mono">
                              ID: {log.adminId}
                            </div>
                          </td>
                          <td className="p-3 max-w-xs">
                            {log.targetTitle && (
                              <div className="font-semibold text-zinc-200 truncate">
                                {log.targetTitle}
                              </div>
                            )}
                            <div className="text-[11px] text-zinc-400 line-clamp-2">
                              {log.details}
                            </div>
                          </td>
                          <td className="p-3 whitespace-nowrap">
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950/60 border border-emerald-800/60 px-2 py-0.5 rounded-full">
                              <ShieldCheck className="w-3 h-3" />
                              <span>PIN Tasdiqlangan</span>
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        )}

        {/* 9. ADMINS & PERMISSIONS (RBAC) TAB */}
        {activeTab === 'admins' && (
          <div className="space-y-5">
            {/* Header / Intro */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" />
                  <span>Adminlar & Huquqlar Boshqaruvi (RBAC)</span>
                </h3>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Bosh Admin (891846690) xohlagan foydalanuvchiga cheklangan adminlik huquqini bera oladi va nazorat qiladi
                </p>
              </div>

              {isSuperAdmin && (
                <button
                  onClick={() => handleOpenAppointModal()}
                  className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 font-bold text-xs text-zinc-950 shadow-lg shadow-amber-500/20 transition"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>+ Yangi Admin Tayinlash</span>
                </button>
              )}
            </div>

            {/* Super Admin Ownership Banner */}
            <div className="p-4 rounded-2xl bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-zinc-900 border border-amber-500/30 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xl">
              <div className="flex items-center gap-3.5">
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-600 to-yellow-400 text-zinc-950 flex items-center justify-center font-black text-xl shadow-lg shadow-amber-500/30 flex-shrink-0">
                  <Crown className="w-6 h-6" />
                </div>
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-extrabold text-white text-sm sm:text-base">
                      Bosh Admin (Tizim Egasi)
                    </span>
                    <span className="text-[11px] font-mono bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2 py-0.5 rounded-full font-bold">
                      ID: {SUPER_ADMIN_ID}
                    </span>
                    <span className="text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800 px-2 py-0.5 rounded-full font-bold">
                      100% To'liq Huquq
                    </span>
                  </div>
                  <p className="text-xs text-zinc-300 mt-1 max-w-2xl leading-relaxed">
                    Ushbu ID egasi platformaning mutlaq xo'jayini hisoblanadi. Hech kim uning adminligini o'chira yoki cheklay olmaydi. Boshqa barcha tayinlangan adminlar faqat uning ruxsati bilan o'zlariga berilgan modullarda ishlay oladi.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
                <span className="text-[11px] font-bold text-amber-400 bg-amber-950/80 border border-amber-700/50 px-3 py-1.5 rounded-xl flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4" />
                  <span>Mutlaq Himoyalangan</span>
                </span>
              </div>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="text-zinc-400 text-xs font-semibold">Jami Adminlar</div>
                <div className="text-xl font-black text-white mt-1">
                  {(localSettings.appointedAdmins || []).length} ta
                </div>
                <div className="text-[10px] text-zinc-500 mt-0.5">Tizimda faoliyat yurituvchi</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="text-zinc-400 text-xs font-semibold">Bosh Admin</div>
                <div className="text-xl font-black text-amber-400 mt-1">1 ta</div>
                <div className="text-[10px] text-amber-400/80 mt-0.5">Cheklovlarsiz (891846690)</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="text-zinc-400 text-xs font-semibold">Tayinlangan Yordamchilar</div>
                <div className="text-xl font-black text-blue-400 mt-1">
                  {Math.max(0, (localSettings.appointedAdmins || []).length - 1)} ta
                </div>
                <div className="text-[10px] text-blue-400/80 mt-0.5">Vakolatlari cheklangan</div>
              </div>

              <div className="p-3.5 rounded-xl bg-zinc-900/80 border border-zinc-800">
                <div className="text-zinc-400 text-xs font-semibold">Kassir / Moliya Huquqi</div>
                <div className="text-xl font-black text-emerald-400 mt-1">
                  {(localSettings.appointedAdmins || []).filter((a) => a.permissions.canManageReceipts).length} ta
                </div>
                <div className="text-[10px] text-emerald-400/80 mt-0.5">Cheklarni tekshiruvchilar</div>
              </div>
            </div>

            {/* Appointed Admins List Section */}
            <div className="bg-zinc-900/60 border border-zinc-800 rounded-2xl p-4 sm:p-5 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                  <h4 className="text-sm font-bold text-white flex items-center gap-2">
                    <Shield className="w-4 h-4 text-red-500" />
                    <span>Tayinlangan Adminlar Ro'yxati</span>
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Har bir admin faqat o'ziga ruxsat berilgan oynalarni ko'radi
                  </p>
                </div>

                <div className="relative w-full sm:w-64">
                  <Search className="w-4 h-4 text-zinc-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Ism, ID yoki username..."
                    value={adminSearchQuery}
                    onChange={(e) => setAdminSearchQuery(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-zinc-500 outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                {(localSettings.appointedAdmins || [])
                  .filter((admin) => {
                    if (!adminSearchQuery.trim()) return true;
                    const q = adminSearchQuery.toLowerCase();
                    return (
                      admin.name.toLowerCase().includes(q) ||
                      admin.id.includes(q) ||
                      (admin.username && admin.username.toLowerCase().includes(q)) ||
                      (admin.roleTitle && admin.roleTitle.toLowerCase().includes(q))
                    );
                  })
                  .map((admin) => {
                    const isTargetSuper = admin.id === SUPER_ADMIN_ID;
                    const perms = admin.permissions || DEFAULT_SUB_ADMIN_PERMISSIONS;

                    return (
                      <div
                        key={admin.id}
                        className={`p-4 rounded-2xl border transition flex flex-col justify-between ${
                          isTargetSuper
                            ? 'bg-gradient-to-br from-amber-950/20 via-zinc-900 to-zinc-950 border-amber-500/50 shadow-lg'
                            : 'bg-zinc-900/90 border-zinc-800 hover:border-zinc-700'
                        }`}
                      >
                        <div>
                          {/* Card Top */}
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex items-center gap-3">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm flex-shrink-0 ${
                                  isTargetSuper
                                    ? 'bg-amber-500 text-zinc-950 shadow-md shadow-amber-500/20'
                                    : 'bg-zinc-800 text-zinc-200 border border-zinc-700'
                                }`}
                              >
                                {isTargetSuper ? <Crown className="w-5 h-5" /> : admin.name.charAt(0).toUpperCase()}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <h5 className="font-extrabold text-white text-xs sm:text-sm truncate">
                                    {admin.name}
                                  </h5>
                                  {isTargetSuper ? (
                                    <span className="text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-1.5 py-0.2 rounded-full">
                                      Bosh Admin
                                    </span>
                                  ) : (
                                    <span className="text-[10px] font-semibold bg-blue-950 text-blue-300 border border-blue-800 px-1.5 py-0.2 rounded-full">
                                      {admin.roleTitle || 'Yordamchi Admin'}
                                    </span>
                                  )}
                                </div>
                                <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                                  <span className="font-mono text-zinc-300">ID: {admin.id}</span>
                                  {admin.username && (
                                    <span className="text-zinc-500">@{admin.username}</span>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Status Indicator */}
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-950 text-emerald-400 border border-emerald-800/80">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                              <span>Faol</span>
                            </span>
                          </div>

                          {/* Permissions Badges */}
                          <div className="mt-3.5 pt-3 border-t border-zinc-800/70">
                            <div className="text-[11px] font-bold text-zinc-400 mb-2 flex items-center justify-between">
                              <span>Berilgan Huquqlar (Ruxsatlar):</span>
                              {isTargetSuper && (
                                <span className="text-[10px] text-amber-400 font-bold">Hammasi Ochiq</span>
                              )}
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {perms.canAddContent && (
                                <span className="text-[10px] bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Kino qo'shish</span>
                                </span>
                              )}
                              {perms.canEditContent && (
                                <span className="text-[10px] bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Kino tahrirlash</span>
                                </span>
                              )}
                              {perms.canDeleteContent && (
                                <span className="text-[10px] bg-red-950/40 text-red-300 border border-red-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3 text-red-400" />
                                  <span>Kino o'chirish</span>
                                </span>
                              )}
                              {perms.canManageReceipts && (
                                <span className="text-[10px] bg-emerald-950/40 text-emerald-300 border border-emerald-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>To'lovlarni tasdiqlash</span>
                                </span>
                              )}
                              {perms.canManageUsers && (
                                <span className="text-[10px] bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Foydalanuvchilar & VIP</span>
                                </span>
                              )}
                              {perms.canManageCatalogs && (
                                <span className="text-[10px] bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Kataloglar</span>
                                </span>
                              )}
                              {perms.canManagePlans && (
                                <span className="text-[10px] bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Tarif narxlari</span>
                                </span>
                              )}
                              {perms.canManagePromoCodes && (
                                <span className="text-[10px] bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Promokodlar</span>
                                </span>
                              )}
                              {perms.canBroadcast && (
                                <span className="text-[10px] bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Bot xabarnoma</span>
                                </span>
                              )}
                              {perms.canViewStats && (
                                <span className="text-[10px] bg-zinc-800/80 text-zinc-300 border border-zinc-700/60 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3 text-emerald-400" />
                                  <span>Statistika</span>
                                </span>
                              )}
                              {perms.canManageSettings && (
                                <span className="text-[10px] bg-amber-950/40 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Check className="w-3 h-3 text-amber-400" />
                                  <span>Tizim sozlamalari</span>
                                </span>
                              )}
                              {perms.canManageAdmins && (
                                <span className="text-[10px] bg-amber-950/40 text-amber-300 border border-amber-800/40 px-2 py-0.5 rounded-md flex items-center gap-1">
                                  <Crown className="w-3 h-3 text-amber-400" />
                                  <span>Admin tayinlash</span>
                                </span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Card Bottom Actions */}
                        <div className="mt-4 pt-3 border-t border-zinc-800 flex items-center justify-between gap-2">
                          <div className="text-[10px] text-zinc-500">
                            {admin.appointedAt ? new Date(admin.appointedAt).toLocaleDateString() : 'Boshidan mavjud'}
                          </div>

                          <div className="flex items-center gap-2">
                            {isTargetSuper ? (
                              <span className="text-[11px] font-bold text-zinc-500 italic">
                                Bosh Admin (Daxlsiz)
                              </span>
                            ) : (
                              <>
                                {isSuperAdmin && (
                                  <>
                                    <button
                                      onClick={() => handleOpenAppointModal(admin)}
                                      className="px-2.5 py-1 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-semibold flex items-center gap-1 transition"
                                    >
                                      <Edit className="w-3 h-3 text-amber-400" />
                                      <span>Huquqlarni Sozlash</span>
                                    </button>
                                    <button
                                      onClick={() => handleRemoveAppointedAdmin(admin.id, admin.name)}
                                      title="Adminlikdan olish"
                                      className="p-1 rounded-lg bg-zinc-800 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 border border-transparent hover:border-red-800/50 transition"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* MODAL: ADD/EDIT CONTENT */}
      {isContentModalOpen && editingContent && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#121216] border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl my-auto max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsContentModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="text-lg font-black text-white mb-4">
              {editingContent.id ? 'Kontentni Tahrirlash' : 'Yangi Kino / Drama Qo\'shish'}
            </h3>

            <form onSubmit={handleSaveContent} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nomi:
                  </label>
                  <input
                    type="text"
                    required
                    value={editingContent.title || ''}
                    onChange={(e) =>
                      setEditingContent({ ...editingContent, title: e.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Turi:
                  </label>
                  <select
                    value={editingContent.type || 'movie'}
                    onChange={(e) =>
                      setEditingContent({
                        ...editingContent,
                        type: e.target.value as ContentType,
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                  >
                    <option value="movie">Kino (To'liq Film)</option>
                    <option value="series">Serial (16:9)</option>
                    <option value="anime_series">Anime Serial (16:9)</option>
                    <option value="short_drama">Vertikal Short Drama (9:16)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Ekrandagi Katalog (Bo'lim):
                  </label>
                  <select
                    value={editingContent.catalogId || ''}
                    onChange={(e) => {
                      const selectedCatId = e.target.value;
                      const matchedCat = catalogsList.find((c) => c.id === selectedCatId);
                      setEditingContent({
                        ...editingContent,
                        catalogId: selectedCatId,
                        type:
                          matchedCat?.format === 'vertical_9_16'
                            ? 'short_drama'
                            : editingContent.type || 'movie',
                      });
                    }}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                  >
                    <option value="">-- Katalog tanlang --</option>
                    {catalogsList.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name} {cat.format === 'vertical_9_16' ? '(9:16 Vertikal)' : '(16:9 Gorizontal)'}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* POSTER & VIDEO UPLOAD FROM DEVICE */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Poster upload */}
                <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-red-400" />
                      <span>Poster (Rasm)</span>
                    </label>
                  </div>
                  
                  <label className="relative flex-1 flex flex-col items-center justify-center gap-2 py-6 px-3 min-h-[120px] rounded-lg bg-zinc-950 border-2 border-dashed border-zinc-700 hover:border-red-500/50 cursor-pointer text-xs font-bold text-zinc-400 transition overflow-hidden group mb-2">
                    {editingContent.posterUrl && mainFileUploadProgress['posterUrl'] === undefined && (
                      <div className="absolute inset-0 z-0">
                        <img 
                          src={editingContent.posterUrl} 
                          alt="Poster Preview" 
                          className="w-full h-full object-cover opacity-30 group-hover:opacity-20 transition"
                        />
                      </div>
                    )}
                    {mainFileUploadProgress['posterUrl'] !== undefined && (
                      <div className="absolute inset-0 z-0 bg-zinc-900 flex flex-col justify-end">
                        <div className={`h-full w-full absolute top-0 left-0 transition-colors duration-300 ${mainFileUploadProgress['posterUrl'].status === 'success' ? 'bg-emerald-600/20' : 'bg-red-600/20'}`} style={{ height: `${100 - mainFileUploadProgress['posterUrl'].progress}%` }} />
                        <div className={`h-1 transition-all duration-300 ${mainFileUploadProgress['posterUrl'].status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${mainFileUploadProgress['posterUrl'].progress}%` }} />
                      </div>
                    )}
                    <div className="relative z-10 flex flex-col items-center gap-2">
                      {mainFileUploadProgress['posterUrl'] !== undefined ? (
                         <>
                           {mainFileUploadProgress['posterUrl'].status === 'success' ? (
                             <CheckCircle2 className="w-8 h-8 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                           ) : (
                             <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                           )}
                           <span className="text-white font-bold">{mainFileUploadProgress['posterUrl'].status === 'success' ? 'Yuklandi' : `Yuklanmoqda... ${Math.round(mainFileUploadProgress['posterUrl'].progress)}%`}</span>
                         </>
                      ) : editingContent.posterUrl ? (
                         <>
                           <CheckCircle className="w-6 h-6 text-emerald-500 drop-shadow-lg" />
                           <span className="text-emerald-400 text-center">Tayyor! (Boshqa tanlash)</span>
                         </>
                      ) : (
                         <>
                           <Upload className="w-6 h-6 text-red-500 drop-shadow-lg" />
                           <span className="text-center">Rasmni shu yerga tashlang yoki tanlang</span>
                         </>
                      )}
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => handleDeviceFileUpload(e, 'posterUrl')}
                      className="hidden"
                      disabled={mainFileUploadProgress['posterUrl'] !== undefined}
                    />
                  </label>
                  
                  <input
                    type="text"
                    value={editingContent.posterUrl || ''}
                    onChange={(e) =>
                      setEditingContent({ ...editingContent, posterUrl: e.target.value })
                    }
                    placeholder="yoki rasm URL havolasi"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>

                {/* Video upload (for movie) */}
                {editingContent.type === 'movie' && (
                  <div className="p-3 bg-zinc-900 rounded-xl border border-zinc-800 flex flex-col">
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                        <FileVideo className="w-3.5 h-3.5 text-red-400" />
                        <span>Video Fayl (Kino)</span>
                      </label>
                    </div>
                    
                    <label className="relative flex-1 flex flex-col items-center justify-center gap-2 py-6 px-3 min-h-[120px] rounded-lg bg-zinc-950 border-2 border-dashed border-zinc-700 hover:border-red-500/50 cursor-pointer text-xs font-bold text-zinc-400 transition overflow-hidden group mb-2">
                      {editingContent.videoUrl && mainFileUploadProgress['videoUrl'] === undefined && (
                        <div className="absolute inset-0 z-0 bg-black">
                           <video 
                             src={editingContent.videoUrl} 
                             className="w-full h-full object-cover opacity-40 group-hover:opacity-20 transition"
                             muted
                             playsInline
                           />
                        </div>
                      )}
                      {mainFileUploadProgress['videoUrl'] !== undefined && (
                        <div className="absolute inset-0 z-0 bg-zinc-900 flex flex-col justify-end">
                          <div className={`h-full w-full absolute top-0 left-0 transition-colors duration-300 ${mainFileUploadProgress['videoUrl'].status === 'success' ? 'bg-emerald-600/20' : 'bg-red-600/20'}`} style={{ height: `${100 - mainFileUploadProgress['videoUrl'].progress}%` }} />
                          <div className={`h-1 transition-all duration-300 ${mainFileUploadProgress['videoUrl'].status === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`} style={{ width: `${mainFileUploadProgress['videoUrl'].progress}%` }} />
                        </div>
                      )}
                      <div className="relative z-10 flex flex-col items-center gap-2">
                        {mainFileUploadProgress['videoUrl'] !== undefined ? (
                           <>
                             {mainFileUploadProgress['videoUrl'].status === 'success' ? (
                               <CheckCircle2 className="w-8 h-8 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                             ) : (
                               <div className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                             )}
                             <span className="text-white font-bold">{mainFileUploadProgress['videoUrl'].status === 'success' ? 'Video yuklandi' : `Video yuklanmoqda... ${Math.round(mainFileUploadProgress['videoUrl'].progress)}%`}</span>
                           </>
                        ) : editingContent.videoUrl ? (
                           <>
                             <CheckCircle className="w-6 h-6 text-emerald-500 drop-shadow-lg" />
                             <span className="text-emerald-400 text-center">Video Tayyor! (Boshqa tanlash)</span>
                           </>
                        ) : (
                           <>
                             <Upload className="w-6 h-6 text-red-500 drop-shadow-lg" />
                             <span className="text-center">Videoni shu yerga tashlang yoki tanlang</span>
                           </>
                        )}
                      </div>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={(e) => handleDeviceFileUpload(e, 'videoUrl')}
                        className="hidden"
                        disabled={mainFileUploadProgress['videoUrl'] !== undefined}
                      />
                    </label>

                    <input
                      type="text"
                      value={editingContent.videoUrl || ''}
                      onChange={(e) =>
                        setEditingContent({ ...editingContent, videoUrl: e.target.value })
                      }
                      placeholder="yoki video URL havolasi"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-red-500"
                    />
                  </div>
                )}
              </div>

              {/* Price & Premium Toggle */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Dona narxi (UZS):
                  </label>
                  <input
                    type="number"
                    value={editingContent.price ?? 15000}
                    onChange={(e) =>
                      setEditingContent({
                        ...editingContent,
                        price: Number(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500 font-bold text-red-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Yili:
                  </label>
                  <input
                    type="number"
                    value={editingContent.year || 2024}
                    onChange={(e) =>
                      setEditingContent({
                        ...editingContent,
                        year: Number(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Reyting:
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={editingContent.rating || 8.0}
                    onChange={(e) =>
                      setEditingContent({
                        ...editingContent,
                        rating: Number(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Sifat:
                  </label>
                  <select
                    value={editingContent.quality || '1080p'}
                    onChange={(e) =>
                      setEditingContent({
                        ...editingContent,
                        quality: e.target.value as '1080p' | '4K' | '720p',
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  >
                    <option value="1080p">1080p Full HD</option>
                    <option value="4K">4K Ultra HD</option>
                    <option value="720p">720p HD</option>
                  </select>
                </div>
              </div>

              {/* Premium, Single Purchase & Featured Storefront Settings */}
              <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-3">
                <div className="text-xs font-bold text-white flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-red-500" />
                  <span>Monetizatsiya va Sotuv Sozlamalari</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-zinc-200 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                    <input
                      type="checkbox"
                      checked={editingContent.isVipIncluded !== false}
                      onChange={(e) =>
                        setEditingContent({ ...editingContent, isVipIncluded: e.target.checked })
                      }
                      className="w-4 h-4 mt-0.5 accent-amber-500 rounded"
                    />
                    <div>
                      <span className="block text-white font-bold">VIP Tarifiga Kiritilgan (VIP Plan)</span>
                      <span className="text-[10px] text-zinc-400 font-normal">
                        {editingContent.isVipIncluded !== false
                          ? 'Faol: VIP obuna a\'zolari ushbu filmni bepul tomosha qila oladi.'
                          : 'O\'chiq: Film VIP tarifiga kirmaydi! Barcha foydalanuvchilar "Buy Now" orqali alohida sotib oladi.'}
                      </span>
                    </div>
                  </label>

                  <label className="flex items-start gap-2.5 cursor-pointer text-xs font-semibold text-zinc-200 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                    <input
                      type="checkbox"
                      checked={editingContent.isSinglePurchase ?? true}
                      onChange={(e) =>
                        setEditingContent({ ...editingContent, isSinglePurchase: e.target.checked })
                      }
                      className="w-4 h-4 mt-0.5 accent-red-600 rounded"
                    />
                    <div>
                      <span className="block text-white font-bold">Alohida Sotuvda ('Buy Now' Faol)</span>
                      <span className="text-[10px] text-zinc-400 font-normal">
                        Foydalanuvchi ushbu kinoni alohida narxi bo'yicha sotib olishi mumkin.
                      </span>
                    </div>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-amber-400 bg-zinc-950/80 p-2.5 rounded-xl border border-amber-900/50">
                    <input
                      type="checkbox"
                      checked={editingContent.isFeaturedStore ?? false}
                      onChange={(e) =>
                        setEditingContent({ ...editingContent, isFeaturedStore: e.target.checked })
                      }
                      className="w-4 h-4 accent-amber-500 rounded"
                    />
                    <span>⭐ Yangi Premyera (1-o'rinda chiqsin)</span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-200 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800">
                    <input
                      type="checkbox"
                      checked={editingContent.isPremium ?? true}
                      onChange={(e) =>
                        setEditingContent({ ...editingContent, isPremium: e.target.checked })
                      }
                      className="w-4 h-4 accent-red-600 rounded"
                    />
                    <span>Pullik / Himoyalangan Kontent</span>
                  </label>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <label className="block text-xs font-medium text-zinc-300 mb-1">
                      Alohida 'Buy Now' Sotib Olish Narxi (UZS):
                    </label>
                    <input
                      type="number"
                      value={editingContent.price ?? 15000}
                      onChange={(e) => {
                        const val = Number(e.target.value);
                        setEditingContent({
                          ...editingContent,
                          price: val,
                          individualPrice: val,
                        });
                      }}
                      placeholder="Masalan: 15000"
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs font-bold text-red-400 outline-none focus:border-red-500"
                    />
                    <span className="text-[10px] text-zinc-400 mt-1 block">
                      {editingContent.isVipIncluded === false
                        ? '⭐ Ushbu film VIP tarifiga kirmagani uchun pleyerda aynan shu narx bilan "Buy Now" tugmasi chiqadi.'
                        : 'VIP bo\'lmagan foydalanuvchilar filmni to\'g\'ridan-to\'g\'ri shu narxga sotib olishi mumkin.'}
                    </span>
                  </div>

                  <div className="flex flex-col justify-center">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-zinc-200 bg-zinc-950/80 p-2.5 rounded-xl border border-zinc-800 mt-2">
                      <input
                        type="checkbox"
                        checked={editingContent.isTrending ?? false}
                        onChange={(e) =>
                          setEditingContent({ ...editingContent, isTrending: e.target.checked })
                        }
                        className="w-4 h-4 accent-red-600 rounded"
                      />
                      <span>🔥 Trenddagi film (Bosh sahifa vitrinasida)</span>
                    </label>
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tavsif:
                </label>
                <textarea
                  rows={3}
                  value={editingContent.description || ''}
                  onChange={(e) =>
                    setEditingContent({ ...editingContent, description: e.target.value })
                  }
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                />
              </div>

              {/* EPISODES BUILDER FOR SERIES, ANIME & SHORT DRAMAS */}
              {(editingContent.type === 'series' || editingContent.type === 'anime_series' || editingContent.type === 'short_drama') && (
                <div className="p-4 bg-zinc-900 rounded-xl border border-zinc-800 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider text-red-400">
                        Qismlar Boshqaruvi (Epizodlar)
                      </h4>
                      <p className="text-[10px] text-zinc-400">
                        Har bir qism videosini qurilmadan yuklang, bepul yoki pullik ekanini belgilang
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddEpisode}
                      className="px-3 py-1.5 bg-red-600 hover:bg-red-500 text-white font-bold text-xs rounded-lg flex items-center gap-1"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Qism qo'shish</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                    {modalEpisodes.map((ep, idx) => (
                      <div key={ep.id} className="relative flex p-1.5 rounded-lg bg-zinc-950/80 border border-zinc-800/80 hover:border-zinc-700/80 transition-colors group">
                        
                        {/* Thumbnail Area */}
                        <div className="relative w-16 h-20 rounded-md overflow-hidden bg-zinc-900 shrink-0">
                          <img 
                            src={editingContent?.posterUrl || ''} 
                            alt="Ep Thumbnail" 
                            className="w-full h-full object-cover opacity-60 group-hover:opacity-80 transition-opacity" 
                          />
                          {/* Upload Progress Overlay */}
                          {episodeUploadProgress[ep.id] !== undefined && (
                            <div className="absolute inset-0 bg-black/70 flex flex-col items-center justify-center p-1">
                               <div className="text-[9px] font-bold text-white mb-1 drop-shadow-md">
                                 {episodeUploadProgress[ep.id].status === 'success' ? '100%' : `${Math.round(episodeUploadProgress[ep.id].progress)}%`}
                               </div>
                               <div className="w-full h-1 bg-zinc-800 rounded-full overflow-hidden">
                                 <div 
                                   className={`h-full ${episodeUploadProgress[ep.id].status === 'success' ? 'bg-emerald-500' : 'bg-red-500'} transition-all`}
                                   style={{ width: `${episodeUploadProgress[ep.id].progress}%` }}
                                 />
                               </div>
                            </div>
                          )}
                        </div>

                        {/* Info Area */}
                        <div className="flex-1 flex flex-col pl-2 min-w-0">
                          <div className="flex items-start justify-between gap-1 mb-1">
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-[9px] font-bold text-zinc-500 tracking-wider">
                                 {ep.episodeNumber}-QISM
                              </span>
                              <input
                                type="text"
                                value={ep.title}
                                onChange={(e) => {
                                  const updated = [...modalEpisodes];
                                  updated[idx].title = e.target.value;
                                  setModalEpisodes(updated);
                                }}
                                className="bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-red-500 text-xs font-bold text-white outline-none w-full truncate pb-0.5 transition-colors placeholder:text-zinc-600"
                                placeholder="Qism nomi"
                              />
                            </div>
                            
                            {/* Status Indicator */}
                            <div className="flex items-center justify-center w-5 h-5 bg-zinc-900 rounded-full shrink-0 border border-zinc-800/80 shadow-inner">
                              {episodeUploadProgress[ep.id] !== undefined ? (
                                episodeUploadProgress[ep.id].status === 'success' ? (
                                  <CheckCircle2 className="w-3 h-3 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                                ) : (
                                  <div className="w-2.5 h-2.5 border-[1.5px] border-red-500 border-t-transparent rounded-full animate-spin" />
                                )
                              ) : ep.videoUrl ? (
                                <CheckCircle2 className="w-3 h-3 text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                              ) : (
                                <XCircle className="w-3 h-3 text-red-500/50" />
                              )}
                            </div>
                          </div>

                          {/* Controls Area at the bottom */}
                          <div className="mt-auto flex items-center justify-between gap-1">
                             {/* Free/Paid Toggle */}
                             <button
                               type="button"
                               onClick={() => {
                                 const updated = [...modalEpisodes];
                                 updated[idx].isFree = !ep.isFree;
                                 setModalEpisodes(updated);
                               }}
                               className={`px-1.5 py-0.5 text-[9px] font-extrabold rounded flex-1 text-center transition-colors ${
                                 ep.isFree ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                               }`}
                             >
                               {ep.isFree ? 'BEPUL' : 'PULLIK'}
                             </button>
                             
                             <label className="flex items-center justify-center w-6 h-6 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded cursor-pointer transition-colors shrink-0">
                                <Upload className="w-3 h-3" />
                                <input
                                  type="file"
                                  accept="video/*"
                                  onChange={(e) => handleEpisodeFileUpload(e, idx)}
                                  className="hidden"
                                  disabled={episodeUploadProgress[ep.id] !== undefined}
                                />
                             </label>
                             <button
                               type="button"
                               onClick={() => {
                                 setModalEpisodes(modalEpisodes.filter((_, i) => i !== idx));
                               }}
                               className="flex items-center justify-center w-6 h-6 bg-zinc-800 hover:bg-red-500/20 text-zinc-500 hover:text-red-400 rounded transition-colors shrink-0"
                             >
                                <Trash2 className="w-3 h-3" />
                             </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-3 px-4 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-sm text-white shadow-lg shadow-red-600/30 transition"
              >
                Saqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: RECEIPT FULL PREVIEW */}
      {selectedReceipt && (
        <div className="fixed inset-0 z-70 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-[#121216] border border-zinc-800 rounded-2xl p-5">
            <button
              onClick={() => setSelectedReceipt(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <h4 className="text-sm font-bold text-white mb-2">
              To'lov Cheki: {selectedReceipt.userName}
            </h4>

            <div className="max-h-[60vh] overflow-hidden rounded-xl border border-zinc-700 mb-4 bg-black flex items-center justify-center">
              <img
                src={selectedReceipt.receiptImageUrl}
                alt="Chek rasmi"
                className="max-h-[55vh] w-auto object-contain"
              />
            </div>

            <div className="flex items-center justify-between mb-4 text-xs">
              <span className="text-zinc-400">Summa:</span>
              <span className="font-extrabold text-emerald-400 text-base">
                {selectedReceipt.amount.toLocaleString()} so'm
              </span>
            </div>

            {selectedReceipt.status === 'pending' && (
              <div className="flex gap-2">
                <button
                  onClick={() => handleReviewReceipt(selectedReceipt.id, 'approved')}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs rounded-xl shadow transition"
                >
                  Tasdiqlash va Faollashtirish
                </button>
                <button
                  onClick={() => handleReviewReceipt(selectedReceipt.id, 'rejected')}
                  className="px-4 py-2.5 bg-zinc-800 hover:bg-red-900/60 text-zinc-300 hover:text-red-400 font-semibold text-xs rounded-xl transition"
                >
                  Rad etish
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: PLAN EDIT */}
      {isPlanModalOpen && editingPlan && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-[#121216] border border-zinc-800 rounded-2xl p-5 max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsPlanModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-bold text-white mb-3 flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-red-500" />
              <span>Tarifni Boshqarish & Ichidagi Imtiyozlar</span>
            </h4>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingPlan.name) return;
                const fullPlan: SubscriptionPlan = {
                  id: editingPlan.id || `plan_${Date.now()}`,
                  name: editingPlan.name,
                  durationDays: Number(editingPlan.durationDays) || 30,
                  price: Number(editingPlan.price) || 0,
                  originalPrice: editingPlan.originalPrice ? Number(editingPlan.originalPrice) : undefined,
                  badge: editingPlan.badge || '',
                  description: editingPlan.description || '',
                  features: Array.isArray(editingPlan.features) ? editingPlan.features : [],
                  isActive: editingPlan.isActive ?? true,
                };
                saveStoredPlan(fullPlan);
                setIsPlanModalOpen(false);
                onRefreshData();
                showNotification(`"${fullPlan.name}" tarifi saqlandi!`);
              }}
              className="space-y-3.5"
            >
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Tarif nomi:
                </label>
                <input
                  type="text"
                  required
                  value={editingPlan.name || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, name: e.target.value })}
                  placeholder="Masalan: VIP Oylik yoki Standart"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Amal qilish muddati (Kun):
                  </label>
                  <input
                    type="number"
                    value={editingPlan.durationDays || 30}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        durationDays: Number(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Narx (UZS):
                  </label>
                  <input
                    type="number"
                    value={editingPlan.price || 39000}
                    onChange={(e) =>
                      setEditingPlan({ ...editingPlan, price: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none font-bold text-red-400"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Asl Narxi (Chegirma uchun UZS):
                  </label>
                  <input
                    type="number"
                    value={editingPlan.originalPrice || ''}
                    onChange={(e) =>
                      setEditingPlan({
                        ...editingPlan,
                        originalPrice: e.target.value ? Number(e.target.value) : undefined,
                      })
                    }
                    placeholder="Masalan: 60000"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-zinc-400 line-through outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Yorliq (Badge):
                  </label>
                  <input
                    type="text"
                    value={editingPlan.badge || ''}
                    onChange={(e) => setEditingPlan({ ...editingPlan, badge: e.target.value })}
                    placeholder="Masalan: Eng ommabop, 50% Chegirma"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Qisqa Ta'rif:
                </label>
                <input
                  type="text"
                  value={editingPlan.description || ''}
                  onChange={(e) => setEditingPlan({ ...editingPlan, description: e.target.value })}
                  placeholder="Masalan: 1 oy davomida barcha premyeralardan cheksiz bahramand bo'ling"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              {/* FEATURES MANAGEMENT - ICHIDAGI IMTIYOZLARNI O'CHIRISH VA QO'SHISH */}
              <div className="p-3.5 bg-zinc-900/90 rounded-xl border border-zinc-800 space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-white flex items-center gap-1.5">
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tarif Ichidagi Imtiyozlar Ro'yxati:</span>
                  </label>
                  <span className="text-[10px] text-zinc-400 font-mono">
                    {(editingPlan.features || []).length} ta imtiyoz
                  </span>
                </div>

                {/* List of features with delete buttons */}
                <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                  {(editingPlan.features || []).map((feat, idx) => (
                    <div
                      key={idx}
                      className="flex items-center justify-between gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800 text-xs text-zinc-200"
                    >
                      <div className="flex items-center gap-2 overflow-hidden">
                        <Check className="w-3.5 h-3.5 text-emerald-400 flex-shrink-0" />
                        <span className="truncate">{feat}</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const updated = (editingPlan.features || []).filter((_, i) => i !== idx);
                          setEditingPlan({ ...editingPlan, features: updated });
                        }}
                        title="Ushbu bandni o'chirish"
                        className="p-1 rounded bg-zinc-800 hover:bg-red-900/80 text-zinc-400 hover:text-red-300 transition flex-shrink-0"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}

                  {(!editingPlan.features || editingPlan.features.length === 0) && (
                    <div className="text-center py-2 text-[11px] text-zinc-500 italic">
                      Hozircha imtiyozlar kiritilmagan. Quyida yangisini qo'shing.
                    </div>
                  )}
                </div>

                {/* Add new feature input */}
                <div className="flex gap-2 pt-1">
                  <input
                    type="text"
                    value={newPlanFeatureInput}
                    onChange={(e) => setNewPlanFeatureInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        if (newPlanFeatureInput.trim()) {
                          const currentFeats = editingPlan.features || [];
                          setEditingPlan({
                            ...editingPlan,
                            features: [...currentFeats, newPlanFeatureInput.trim()],
                          });
                          setNewPlanFeatureInput('');
                        }
                      }
                    }}
                    placeholder="Yangi imtiyoz yozing (Masalan: 4K Ultra HD format)..."
                    className="flex-1 bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-red-500"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      if (newPlanFeatureInput.trim()) {
                        const currentFeats = editingPlan.features || [];
                        setEditingPlan({
                          ...editingPlan,
                          features: [...currentFeats, newPlanFeatureInput.trim()],
                        });
                        setNewPlanFeatureInput('');
                      }
                    }}
                    className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold transition flex-shrink-0"
                  >
                    + Qo'shish
                  </button>
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 font-bold text-xs text-white rounded-xl shadow-lg shadow-red-600/30 transition"
                >
                  Tarifni Saqlash
                </button>
                {editingPlan.id && (
                  <button
                    type="button"
                    onClick={() => {
                      deleteStoredPlan(editingPlan.id as string);
                      setIsPlanModalOpen(false);
                      onRefreshData();
                      showNotification('Tarif o\'chirildi!');
                    }}
                    className="px-4 py-2.5 bg-zinc-800 hover:bg-red-950 hover:text-red-400 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-700 transition"
                  >
                    O'chirish
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: PROMO EDIT */}
      {isPromoModalOpen && editingPromo && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-md w-full bg-[#121216] border border-zinc-800 rounded-2xl p-5">
            <button
              onClick={() => setIsPromoModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-bold text-white mb-3">Promokodni Sozlash</h4>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!editingPromo.code) return;
                saveStoredPromoCode(editingPromo as PromoCode);
                setIsPromoModalOpen(false);
                onRefreshData();
              }}
              className="space-y-3"
            >
              <div>
                <label className="block text-xs font-medium text-zinc-300 mb-1">
                  Promokod kodi:
                </label>
                <input
                  type="text"
                  required
                  value={editingPromo.code || ''}
                  onChange={(e) =>
                    setEditingPromo({ ...editingPromo, code: e.target.value.toUpperCase() })
                  }
                  className="w-full uppercase font-mono bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Chegirma (%):
                  </label>
                  <input
                    type="number"
                    max={100}
                    min={1}
                    value={editingPromo.discountPercent || 20}
                    onChange={(e) =>
                      setEditingPromo({
                        ...editingPromo,
                        discountPercent: Number(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-zinc-300 mb-1">
                    Foydalanish limiti:
                  </label>
                  <input
                    type="number"
                    value={editingPromo.maxUses || 100}
                    onChange={(e) =>
                      setEditingPromo({ ...editingPromo, maxUses: Number(e.target.value) })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 font-bold text-xs text-white rounded-xl shadow transition mt-2"
              >
                Saqlash
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD/EDIT SCREEN CATALOG */}
      {isCatalogModalOpen && editingCatalog && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative max-w-lg w-full bg-[#121216] border border-zinc-800 rounded-2xl p-5 shadow-2xl">
            <button
              onClick={() => setIsCatalogModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>
            <h4 className="text-base font-bold text-white mb-1 flex items-center gap-2">
              <Layers className="w-4 h-4 text-red-500" />
              <span>
                {editingCatalog.id && catalogsList.some((c) => c.id === editingCatalog.id)
                  ? 'Katalogni Tahrirlash'
                  : 'Yangi Ekran Kataloqi Qo\'shish'}
              </span>
            </h4>
            <p className="text-xs text-zinc-400 mb-4">
              Ushbu katalog ilova bosh sahifasida alohida bo'lim bo'lib chiqadi.
            </p>

            <form onSubmit={handleSaveCatalogAction} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Katalog Nomi (Masalan: Kino, Mini Drama, Anime, Drama):
                </label>
                <input
                  type="text"
                  required
                  value={editingCatalog.name || ''}
                  onChange={(e) =>
                    setEditingCatalog({ ...editingCatalog, name: e.target.value })
                  }
                  placeholder="Katalog nomi"
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                />
              </div>

              {/* Format Selection (9:16 or 16:9) */}
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Video ochilish formati:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      editingCatalog.format === 'vertical_9_16'
                        ? 'bg-pink-950/30 border-pink-600/70 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="catalogFormat"
                      value="vertical_9_16"
                      checked={editingCatalog.format === 'vertical_9_16'}
                      onChange={() =>
                        setEditingCatalog({
                          ...editingCatalog,
                          format: 'vertical_9_16',
                          badge: editingCatalog.badge || '9:16 VERTICAL',
                        })
                      }
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-pink-400 flex items-center gap-1">
                        <Smartphone className="w-3.5 h-3.5" />
                        <span>9:16 Vertikal Farmat</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Mini Drama & Tik-Tok uslubi: to'liq ekran 9:16 da ochiladi
                      </div>
                    </div>
                  </label>

                  <label
                    className={`p-3 rounded-xl border cursor-pointer transition flex items-start gap-2.5 ${
                      editingCatalog.format !== 'vertical_9_16'
                        ? 'bg-zinc-800/80 border-red-600/70 text-white'
                        : 'bg-zinc-900/60 border-zinc-800 text-zinc-400 hover:border-zinc-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="catalogFormat"
                      value="horizontal_16_9"
                      checked={editingCatalog.format !== 'vertical_9_16'}
                      onChange={() =>
                        setEditingCatalog({
                          ...editingCatalog,
                          format: 'horizontal_16_9',
                        })
                      }
                      className="mt-0.5"
                    />
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1">
                        <Film className="w-3.5 h-3.5 text-red-500" />
                        <span>16:9 Gorizontal Standart</span>
                      </div>
                      <div className="text-[11px] text-zinc-400 mt-0.5">
                        Kino va Standart seriallar formati
                      </div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Nishon (Badge):
                  </label>
                  <input
                    type="text"
                    value={editingCatalog.badge || ''}
                    onChange={(e) =>
                      setEditingCatalog({ ...editingCatalog, badge: e.target.value })
                    }
                    placeholder="Masalan: YANGI, 9:16 VERTICAL, TOP"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Tartib raqami:
                  </label>
                  <input
                    type="number"
                    value={editingCatalog.order || 1}
                    onChange={(e) =>
                      setEditingCatalog({
                        ...editingCatalog,
                        order: Number(e.target.value),
                      })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Tavsif (Ixtiyoriy):
                </label>
                <textarea
                  rows={2}
                  value={editingCatalog.description || ''}
                  onChange={(e) =>
                    setEditingCatalog({ ...editingCatalog, description: e.target.value })
                  }
                  placeholder="Katalog haqida qisqacha ma'lumot..."
                  className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="catalogIsVisible"
                  checked={editingCatalog.isVisible !== false}
                  onChange={(e) =>
                    setEditingCatalog({ ...editingCatalog, isVisible: e.target.checked })
                  }
                  className="w-4 h-4 accent-red-600 rounded"
                />
                <label htmlFor="catalogIsVisible" className="text-xs text-zinc-200 cursor-pointer">
                  Ekranda darhol faol ko'rinsin
                </label>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-500 font-bold text-xs text-white rounded-xl shadow-lg shadow-red-600/30 transition mt-3"
              >
                Katalogni Saqlash
              </button>
            </form>
          </div>
        </div>
      )}
      {/* ========================================================
          BROADCAST TAB
          ======================================================== */}
      {activeTab === 'broadcast' && (
        <div className="p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Megaphone className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-black text-white">Bot Xabarnoma (Broadcast)</h2>
              <p className="text-xs text-zinc-400">Barcha obunachilarga post, kino posteri va tugma jo'natish</p>
            </div>
          </div>

          <div className="max-w-2xl bg-zinc-900/80 border border-zinc-800/80 rounded-3xl p-5 sm:p-6">
            <form onSubmit={handleSendBroadcast} className="space-y-5">
              
              {/* Kino tanlash */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <Film className="w-4 h-4 text-zinc-400" />
                  Kino yoki Serialni tanlang (ixtiyoriy)
                </label>
                <select
                  value={broadcastTargetContent}
                  onChange={(e) => setBroadcastTargetContent(e.target.value)}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition"
                >
                  <option value="">-- Faqat matnli xabar --</option>
                  {contents.map(c => (
                    <option key={c.id} value={c.id}>{c.title} ({c.type === 'movie' ? 'Kino' : 'Serial'})</option>
                  ))}
                </select>
                <p className="text-[10px] text-zinc-500 mt-1.5">
                  Agar kino tanlasangiz, uning rasmi (posteri) va "🎬 Tomosha qilish" tugmasi xabarga avtomatik qo'shiladi.
                </p>
              </div>

              {/* Matn */}
              <div>
                <label className="block text-xs font-bold text-zinc-300 mb-1.5 flex items-center gap-1.5">
                  <MessageSquare className="w-4 h-4 text-zinc-400" />
                  Xabar matni (HTML ruxsat etilgan)
                </label>
                <textarea
                  value={broadcastMessage}
                  onChange={(e) => setBroadcastMessage(e.target.value)}
                  placeholder="Yangi ajoyib serial chiqdi! O'tkazib yubormang..."
                  rows={6}
                  className="w-full bg-zinc-950 border border-zinc-700/80 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-indigo-500 transition resize-y"
                  required
                />
              </div>

              {/* Jo'natish tugmasi */}
              <div className="pt-2">
                <button
                  type="submit"
                  disabled={!broadcastMessage || broadcastStatus === 'sending'}
                  className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 disabled:opacity-50 transition"
                >
                  <Send className="w-5 h-5" />
                  {broadcastStatus === 'sending' ? 'Yuborilmoqda...' : 'Barcha obunachilarga jo\'natish!'}
                </button>
                {broadcastStatus === 'success' && (
                  <p className="text-emerald-500 text-xs text-center font-bold mt-3 animate-pulse">{broadcastStatusMessage}</p>
                )}
                {broadcastStatus === 'error' && (
                  <p className="text-red-500 text-xs text-center font-bold mt-3">{broadcastStatusMessage}</p>
                )}
              </div>
            </form>

            {broadcastTargetContent && (
              <div className="mt-8 p-4 rounded-2xl bg-zinc-950 border border-zinc-800">
                <p className="text-[10px] text-zinc-500 uppercase font-bold mb-3">Xabar qanday ko'rinadi (Prevyu):</p>
                <div className="max-w-xs mx-auto bg-[#18222d] rounded-2xl overflow-hidden shadow-2xl relative border border-zinc-800">
                  <img 
                    src={contents.find(c => c.id === broadcastTargetContent)?.posterUrl} 
                    alt="poster" 
                    className="w-full aspect-[4/5] object-cover"
                  />
                  <div className="p-3">
                    <p className="text-sm text-white whitespace-pre-wrap">{broadcastMessage || "Xabar matni..."}</p>
                  </div>
                  <div className="px-3 pb-3">
                    <div className="w-full py-2.5 rounded-lg bg-[#2b5278] text-white text-center text-sm font-semibold">
                      🎬 Tomosha qilish
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* SECONDARY VERIFICATION MODAL FOR SENSITIVE ADMIN ACTIONS */}
      {pendingAction && (
        <div className="fixed inset-0 z-70 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="relative w-full max-w-md bg-[#121216] border border-amber-500/50 rounded-2xl p-6 shadow-2xl shadow-amber-500/10">
            <button
              onClick={() => {
                setPendingAction(null);
                setSecondaryAuthInput('');
                setSecondaryAuthError('');
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 mx-auto mb-3">
              <ShieldAlert className="w-6 h-6" />
            </div>

            <h3 className="text-base font-black text-white text-center mb-1">
              Ikkinchi Darajali Xavfsizlik Tasdiqlash
            </h3>
            <div className="text-xs text-amber-400 font-bold text-center mb-2">
              {pendingAction.title}
            </div>
            <p className="text-xs text-zinc-400 text-center mb-4 leading-relaxed">
              {pendingAction.description}
            </p>

            <form onSubmit={handleConfirmSecondaryAuth} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-zinc-300 mb-1">
                  Admin Xavfsizlik Paroli yoki Telegram ID:
                </label>
                <div className="relative">
                  <input
                    type="password"
                    autoFocus
                    required
                    value={secondaryAuthInput}
                    onChange={(e) => {
                      setSecondaryAuthInput(e.target.value);
                      setSecondaryAuthError('');
                    }}
                    placeholder="Master PIN (8918) yoki Admin Telegram ID"
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3.5 py-2.5 text-xs text-white font-mono outline-none focus:border-amber-500"
                  />
                  <div className="absolute right-3 top-2.5 text-zinc-500">
                    <Lock className="w-4 h-4" />
                  </div>
                </div>
                <div className="text-[10px] text-zinc-500 mt-1 flex items-center justify-between">
                  <span>Standart master PIN: 8918</span>
                  <span>yoki ID: {currentUser.id}</span>
                </div>
              </div>

              {secondaryAuthError && (
                <div className="p-2.5 rounded-xl bg-red-950/80 border border-red-800 text-red-300 text-xs font-semibold flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" />
                  <span>{secondaryAuthError}</span>
                </div>
              )}

              <div className="flex items-center gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setPendingAction(null);
                    setSecondaryAuthInput('');
                    setSecondaryAuthError('');
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-zinc-950 font-black text-xs shadow-lg shadow-amber-500/20 transition flex items-center justify-center gap-1.5"
                >
                  <ShieldCheck className="w-4 h-4" />
                  <span>Tasdiqlash & Bajarish</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPOINT / EDIT ADMIN (RBAC) */}
      {isAppointModalOpen && editingAdmin && (
        <div className="fixed inset-0 z-60 bg-black/90 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div className="relative w-full max-w-2xl bg-[#121216] border border-zinc-800 rounded-2xl p-5 sm:p-6 shadow-2xl my-auto max-h-[92vh] overflow-y-auto">
            <button
              onClick={() => {
                setIsAppointModalOpen(false);
                setEditingAdmin(null);
              }}
              className="absolute top-4 right-4 p-1.5 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white transition"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
                <Crown className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base sm:text-lg font-black text-white">
                  {editingAdmin.isNew ? 'Yangi Admin Tayinlash' : 'Admin Huquqlarini Tahrirlash'}
                </h3>
                <p className="text-xs text-zinc-400">
                  Foydalanuvchiga faqat kerakli bo'lgan bo'limlar bo'yicha ruxsat bering
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveAppointedAdmin} className="space-y-4">
              {/* Row 1: Telegram ID & Quick User Select */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Telegram ID <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    disabled={!editingAdmin.isNew}
                    placeholder="Masalan: 123456789"
                    value={editingAdmin.id}
                    onChange={(e) =>
                      setEditingAdmin({ ...editingAdmin, id: e.target.value.trim() })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500 font-mono disabled:opacity-50"
                  />
                  {editingAdmin.isNew && (
                    <div className="mt-1">
                      <select
                        onChange={(e) => {
                          const selected = usersList.find((u) => u.id === e.target.value);
                          if (selected) {
                            setEditingAdmin({
                              ...editingAdmin,
                              id: selected.id,
                              name: selected.firstName || 'Foydalanuvchi',
                              username: selected.username || '',
                            });
                          }
                        }}
                        className="w-full bg-zinc-900 border border-zinc-800 rounded-lg px-2 py-1 text-[11px] text-zinc-300 outline-none"
                      >
                        <option value="">-- Mavjud foydalanuvchilardan tanlash --</option>
                        {usersList
                          .filter((u) => u.id !== SUPER_ADMIN_ID)
                          .map((u) => (
                            <option key={u.id} value={u.id}>
                              {u.firstName} {u.lastName || ''} (ID: {u.id})
                            </option>
                          ))}
                      </select>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Admin Ismi / Taxallusi <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Alisher (Moderator)"
                    value={editingAdmin.name}
                    onChange={(e) => setEditingAdmin({ ...editingAdmin, name: e.target.value })}
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Row 2: Telegram Username & Role Title */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Telegram Username (ixtiyoriy)
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500 text-xs">@</span>
                    <input
                      type="text"
                      placeholder="username"
                      value={editingAdmin.username}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          username: e.target.value.replace(/^@/, ''),
                        })
                      }
                      className="w-full bg-zinc-950 border border-zinc-700 rounded-xl pl-7 pr-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">
                    Lavozim / Rol Nomi
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Masalan: Kontent Moderatori"
                    value={editingAdmin.roleTitle}
                    onChange={(e) =>
                      setEditingAdmin({ ...editingAdmin, roleTitle: e.target.value })
                    }
                    className="w-full bg-zinc-950 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-amber-500"
                  />
                </div>
              </div>

              {/* Quick Presets (Tezkor Andozalar) */}
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-2">
                <div className="text-xs font-bold text-amber-400 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5" />
                  <span>⚡ Tezkor Andozalar (1 bosishda ruxsatlarni sozlash):</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ROLE_PRESETS.map((preset, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => {
                        setEditingAdmin({
                          ...editingAdmin,
                          roleTitle: preset.roleTitle,
                          permissions: { ...preset.perms },
                        });
                      }}
                      className="p-2.5 rounded-lg bg-zinc-950 hover:bg-zinc-850 border border-zinc-800 hover:border-amber-500/50 text-left transition flex flex-col justify-between"
                    >
                      <div className="font-bold text-xs text-zinc-200">{preset.name}</div>
                      <div className="text-[10px] text-zinc-400 mt-0.5 leading-tight">
                        {preset.description}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Granular Permissions Checkboxes */}
              <div className="p-3.5 rounded-xl bg-zinc-900/90 border border-zinc-800 space-y-3">
                <div className="text-xs font-bold text-white flex items-center justify-between">
                  <span>Aniq Ruxsatnomalar va Cheklovlar (RBAC):</span>
                  <span className="text-[10px] text-zinc-400">Kerakli bo'limlarni belgilang</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Content permissions */}
                  <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canAddContent}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canAddContent: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-red-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-white">🎬 Kino qo'shish</div>
                      <div className="text-[10px] text-zinc-400">Yangi filmlar va seriallar yuklash</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canEditContent}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canEditContent: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-red-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-white">✏️ Kino tahrirlash</div>
                      <div className="text-[10px] text-zinc-400">Ma'lumotlar va videolarni o'zgartirish</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canDeleteContent}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canDeleteContent: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-red-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-red-400">🗑️ Kino o'chirish</div>
                      <div className="text-[10px] text-zinc-400">Filmlarni butunlay o'chirish huquqi</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canManageReceipts}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canManageReceipts: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-red-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-emerald-400">💳 To'lov cheklarini tekshirish</div>
                      <div className="text-[10px] text-zinc-400">Cheklarni tasdiqlash va rad etish</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canManageUsers}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canManageUsers: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-red-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-white">👥 Foydalanuvchilarni boshqarish</div>
                      <div className="text-[10px] text-zinc-400">Foydalanuvchilar va VIP berish</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canManageCatalogs}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canManageCatalogs: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-red-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-white">📁 Ekran kataloglari</div>
                      <div className="text-[10px] text-zinc-400">Bosh sahifa janrlari va bo'limlari</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canManagePlans}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canManagePlans: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-red-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-white">💎 VIP Tariflar</div>
                      <div className="text-[10px] text-zinc-400">Tarif narxlari va tavsiflarini boshqarish</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canManagePromoCodes}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canManagePromoCodes: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-red-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-white">🏷️ Promokodlar</div>
                      <div className="text-[10px] text-zinc-400">Chegirma va bonus kodlarini yaratish</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canBroadcast}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canBroadcast: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-red-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-white">📢 Bot Xabarnoma</div>
                      <div className="text-[10px] text-zinc-400">Telegram bot orqali xabar yuborish</div>
                    </div>
                  </label>

                  <label className="flex items-center gap-2 p-2 rounded-lg bg-zinc-950 border border-zinc-800/80 cursor-pointer hover:bg-zinc-900 transition">
                    <input
                      type="checkbox"
                      checked={editingAdmin.permissions.canViewStats}
                      onChange={(e) =>
                        setEditingAdmin({
                          ...editingAdmin,
                          permissions: {
                            ...editingAdmin.permissions,
                            canViewStats: e.target.checked,
                          },
                        })
                      }
                      className="rounded accent-red-600 w-4 h-4"
                    />
                    <div>
                      <div className="font-bold text-white">📊 Statistika & Daromad</div>
                      <div className="text-[10px] text-zinc-400">Moliya va tomoshalar hisoboti</div>
                    </div>
                  </label>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAppointModalOpen(false);
                    setEditingAdmin(null);
                  }}
                  className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs font-bold text-zinc-300 transition"
                >
                  Bekor qilish
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-xs font-black text-zinc-950 shadow-lg shadow-amber-500/20 transition flex items-center gap-1.5"
                >
                  <Save className="w-4 h-4" />
                  <span>Adminni Saqlash</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
