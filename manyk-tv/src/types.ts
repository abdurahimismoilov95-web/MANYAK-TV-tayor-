export type ContentType = 'movie' | 'series' | 'short_drama' | 'anime_series';

export interface CatalogCategory {
  id: string;
  name: string; // e.g. "Kino", "Anime", "Drama", "Mini Drama"
  description?: string;
  format: 'standard' | 'vertical_9_16' | 'horizontal_16_9';
  order: number;
  isVisible: boolean;
  badge?: string;
}

export interface Episode {
  id: string;
  episodeNumber: number;
  title: string;
  videoUrl: string;
  duration?: string;
  isFree: boolean; // if false, requires VIP or Drama Purchase
  viewsCount?: number;
}

export interface ContentItem {
  id: string;
  title: string;
  originalTitle?: string;
  type: ContentType;
  catalogId?: string; // Links to CatalogCategory (e.g. "kino", "anime", "drama", "mini_drama")
  posterUrl: string;
  bannerUrl?: string;
  videoUrl?: string; // For standalone movies
  episodes?: Episode[]; // For series and short dramas
  description: string;
  year: number;
  duration?: string; // e.g. "1h 42m" or "24 qism"
  rating: number; // e.g. 5.3, 8.4
  quality: '1080p' | '4K' | '720p';
  genres: string[];
  isPremium: boolean; // if true, requires VIP or drama purchase
  price: number; // in UZS (e.g. 15000) for individual purchase, 0 if free
  individualPrice?: number; // Specific individual price defined in admin settings
  isSinglePurchase?: boolean; // Available for individual purchase (Pay-per-view)
  isVipIncluded?: boolean; // If true (or undefined), included in VIP plans. If false, this movie is NOT part of a VIP plan and requires individual purchase
  isFeaturedStore?: boolean; // Pinned 1st in the store / premier purchase section
  revenue: number; // Total revenue generated from this content
  viewsCount: number;
  likesCount: number;
  isTrending?: boolean;
  createdAt: string;
}

export interface DailyCheckInReward {
  day: number;
  title: string;
  type: 'tokens' | 'bonus' | 'vip_hours' | 'vip_discount';
  amount: number;
  description: string;
}

export interface DailyCheckInState {
  lastCheckInDate?: string; // YYYY-MM-DD
  streak: number; // consecutive days
  totalClaims: number;
  lastRewardTitle?: string;
}

export interface DeviceCharacteristics {
  userAgent: string;
  platform: string;
  osFamily: 'iOS' | 'Android' | 'Windows' | 'macOS' | 'Linux' | 'Other';
  isMobile: boolean;
  screenResolution: string; // e.g. "390x844"
  colorDepth: number;
  pixelRatio: number;
  hardwareConcurrency: number;
  deviceMemory?: number;
  maxTouchPoints: number;
  timeZone: string;
  language: string;
  languages: string[];
  canvasHash: string;
  webglVendor: string;
  webglRenderer: string;
  audioSampleRate?: number;
}

export interface HWIDBindingRecord {
  hwid: string;
  boundAt: string;
  lastVerifiedAt: string;
  characteristics: DeviceCharacteristics;
  deviceSummary: string; // e.g. "iPhone (iOS, Apple GPU, 390x844)"
  loginCount: number;
}

export interface UserProfile {
  id: string; // Telegram ID as string, e.g. "891846690"
  username?: string;
  firstName: string;
  lastName?: string;
  name?: string;
  avatarUrl?: string; // Base64 or URL for profile picture
  phone?: string;
  isPhoneVerified: boolean;
  isVip: boolean;
  vipExpiresAt?: string; // ISO date string
  purchasedContentIds: string[]; // Content IDs bought individually
  favorites: string[]; // Content IDs
  deviceToken?: string; // Hardware/Device fingerprint ID
  hwidBinding?: HWIDBindingRecord; // Authoritative Hardware ID binding
  isBanned?: boolean; // User ID ban
  isDeviceBanned?: boolean; // Hardware Device Ban
  banReason?: string;
  lastLoginAt?: string;
  createdAt: string;
  // Daily Check-in & Rewards
  dailyCheckIn?: DailyCheckInState;
  accessTokens?: number; // Free content access tokens (spend 1 to unlock 1 specific episode or movie)
  unlockedEpisodeIds?: string[]; // ContentId:EpisodeId or EpisodeId unlocked via tokens
  vipDiscountPercent?: number; // VIP subscription discount percent (e.g. 10 for 7-day streak)
  bonusBalance?: number; // In UZS
}

export interface WatchHistoryItem {
  id: string;
  contentId: string;
  contentTitle: string;
  contentType: ContentType;
  posterUrl: string;
  episodeId?: string;
  episodeNumber?: number;
  progressSeconds: number;
  durationSeconds: number;
  watchedAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  durationDays: number;
  price: number; // in UZS, e.g. 39000
  originalPrice?: number;
  badge?: string; // e.g. "Eng ommabop", "Chegirma"
  description: string;
  features: string[];
  isActive: boolean;
}

export interface PaymentReceipt {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  type: 'vip_subscription' | 'single_content';
  planId?: string;
  planName?: string;
  contentId?: string;
  contentTitle?: string;
  amount: number; // UZS
  discountApplied?: number;
  promoCodeUsed?: string;
  receiptImageUrl: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
}

export interface PromoCode {
  id: string;
  code: string;
  discountPercent: number; // e.g. 20 for 20%
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
}

export interface AdminAuditLog {
  id: string;
  adminId: string;
  adminName: string;
  action:
    | 'DELETE_CONTENT'
    | 'CREATE_CONTENT'
    | 'UPDATE_CONTENT'
    | 'UPDATE_SETTINGS'
    | 'DELETE_PLAN'
    | 'CREATE_PLAN'
    | 'UPDATE_PLAN'
    | 'APPROVE_RECEIPT'
    | 'REJECT_RECEIPT'
    | 'BAN_USER'
    | 'UNBAN_USER'
    | 'GRANT_VIP'
    | 'REVOKE_VIP'
    | 'APPOINT_ADMIN'
    | 'UPDATE_ADMIN_PERMISSIONS'
    | 'REMOVE_ADMIN';
  targetType: string;
  targetId?: string;
  targetTitle?: string;
  details: string;
  timestamp: string;
  secondaryAuthPassed: boolean;
}

export interface AdminPermissions {
  canAddContent: boolean; // Kino va seriallar qo'shish
  canEditContent: boolean; // Kinolarni tahrirlash
  canDeleteContent: boolean; // Kinolarni o'chirish (o'ta mas'uliyatli)
  canManageUsers: boolean; // Foydalanuvchilarni ko'rish, VIP berish va bloklash
  canManageCatalogs: boolean; // Bo'limlar va kataloglarni boshqarish
  canManageReceipts: boolean; // To'lov cheklari va buyurtmalarni tekshirish
  canManagePlans: boolean; // Tariflar va narxlarni boshqarish
  canManagePromoCodes: boolean; // Promokodlarni yaratish va o'chirish
  canBroadcast: boolean; // Telegram bot orqali xabarnoma yuborish
  canViewStats: boolean; // Statistika va moliyaviy hisobotlarni ko'rish
  canManageSettings: boolean; // Tizim sozlamalari, to'lov kartalari (Faqat Bosh admin)
  canManageAdmins: boolean; // Adminlarni tayinlash va ularning huquqlarini belgilash (Faqat Bosh admin)
}

export interface AppointedAdmin {
  id: string; // Telegram ID
  name: string;
  username?: string;
  roleTitle: string; // e.g. "Bosh Admin", "Kontent Moderatori", "Kassir"
  isSuperAdmin: boolean; // true faqat Bosh Admin (891846690) uchun - 100% cheklovlarsiz
  permissions: AdminPermissions;
  appointedAt: string;
  appointedBy?: string;
}

export interface SystemSettings {
  botToken: string;
  botUsername?: string; // e.g. 'Manyaktvbot'
  telegramBotUsername?: string; // e.g. 'Manyaktvbot'
  telegramBotToken?: string;
  telegramChannelUrl: string;
  adminContactUrl: string;
  adminTelegramIds: string[]; // default includes "891846690"
  appointedAdmins?: AppointedAdmin[]; // Role-based Access Control (RBAC)
  secondaryAdminPassword?: string; // Secondary master PIN or password for dangerous actions (default: '8918')
  cardPayment: {
    cardNumber: string;
    cardHolder: string;
    bankName: string;
    instructions: string;
  };
  enabledPaymentMethods?: {
    checkUpload: boolean;
    clickPayme?: boolean;
  };
  availableGenres: string[];
  catalogs: CatalogCategory[]; // Dynamic screen catalogs (Kino, Anime, Drama, Mini Drama, etc.)
  bannedUserIds: string[]; // Banned Telegram IDs
  bannedDeviceTokens: string[]; // Banned Hardware/Device Tokens (Blocks all accounts on this device)
}
