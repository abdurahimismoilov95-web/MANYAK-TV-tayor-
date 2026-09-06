/**
 * ⚠️  VAQTINCHALIK PLACEHOLDER FAYL — ASL FAYL YO'QOLGAN!
 * ============================================================
 * `src/data/initialData.ts` yuklangan zip faylida UMUMAN YO'Q EDI.
 * Sababi: loyihaning `.gitignore` faylida `data/` qoidasi (boshida "/"
 * belgisisiz) yozilgan edi. Git'da bunday qoida papka nomini HAR QANDAY
 * chuqurlikda topsa e'tiborsiz qoldiradi — demak u nafaqat backend'ning
 * `data/manyktv.db` papkasini, balki `src/data/` (shu fayl turgan joy)ni
 * ham butunlay Git tashqarisida qoldirgan. Natijada bu fayl repo'ga hech
 * qachon commit qilinmagan va zip eksport qilinganda tushib qolgan.
 *
 * `.gitignore` ENDI TUZATILDI (`/data/` — faqat ildizdagi papka e'tiborsiz
 * qoldiriladi), lekin bu sizning ASL CONTENT/TARIF/SOZLAMALAR
 * MA'LUMOTLARINGIZNI (kinolar ro'yxati, VIP tariflar narxi, karta raqami
 * va h.k.) TIKLAB BERMAYDI — men bunday ma'lumotni o'ylab topa olmayman.
 *
 * NIMA QILISH KERAK:
 *   1. Agar loyihani ilgari biror joyda (o'z kompyuteringiz, boshqa Git
 *      remote, avvalgi commit tarixi) saqlagan bo'lsangiz — o'sha yerdan
 *      haqiqiy `src/data/initialData.ts` faylini toping va shu faylni
 *      almashtiring.
 *   2. Agar haqiqatan ham butunlay yo'qolgan bo'lsa — quyidagi bo'sh
 *      "skelet" loyiha kamida QURILISHI (build) uchun yetarli, lekin
 *      kontent, tariflar va to'lov karta ma'lumotlarini Admin panel orqali
 *      qaytadan qo'lda kiritishingiz kerak bo'ladi.
 *
 * Quyidagi qiymatlar FAQAT bo'sh/xavfsiz standartlar — haqiqiy ma'lumot
 * EMAS (masalan, botToken bo'sh qoldirilgan, uni .env / Admin panelga
 * qo'lda kiriting, hech qachon shu faylga yozmang).
 */

import {
  ContentItem,
  SubscriptionPlan,
  PromoCode,
  SystemSettings,
} from '../types';

export const INITIAL_CONTENT: ContentItem[] = [];

export const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan_1_month',
    name: '1 Oylik VIP',
    durationDays: 30,
    price: 39000,
    description: 'Barcha kinolar va seriallarga 1 oylik kirish',
    features: ['Reklamasiz tomosha', 'HD/4K sifat', 'Barcha yangi qismlar'],
    isActive: true,
  },
  {
    id: 'plan_3_month',
    name: '3 Oylik VIP',
    durationDays: 90,
    price: 99000,
    description: 'Barcha kinolar va seriallarga 3 oylik kirish',
    features: ['Reklamasiz tomosha', 'HD/4K sifat', 'Barcha yangi qismlar'],
    isActive: true,
  },
  {
    id: 'plan_1_year',
    name: '1 Yillik VIP',
    durationDays: 365,
    price: 299000,
    description: 'Barcha kinolar va seriallarga 1 yillik kirish',
    features: ['Reklamasiz tomosha', 'HD/4K sifat', 'Barcha yangi qismlar'],
    isActive: true,
  },
];

export const INITIAL_PROMO_CODES: PromoCode[] = [];

export const INITIAL_SETTINGS: SystemSettings = {
  // XAVFSIZLIK: bu yerga HECH QACHON haqiqiy bot tokenini yozmang!
  // Uni faqat serverdagi .env faylga (TELEGRAM_BOT_TOKEN) qo'ying.
  botToken: '',
  botUsername: '',
  telegramBotUsername: '',
  telegramChannelUrl: '',
  adminContactUrl: '',
  adminTelegramIds: [],
  appointedAdmins: [],
  secondaryAdminPassword: '',
  cardPayment: {
    cardNumber: '',
    cardHolder: '',
    bankName: '',
    instructions: '',
  },
  enabledPaymentMethods: {
    checkUpload: true,
    clickPayme: false,
  },
  availableGenres: [
    'Jangari', 'Drama', 'Komediya', 'Fantastika', 'Triller',
    'Romantik', 'Detektiv', 'Sarguzasht', 'Anime', 'Short Drama',
  ],

  // ═══ BO'SH BOSH EKRAN MUAMMOSI TUZATILDI ═══
  //
  // ESKI QIYMAT: `catalogs: []`
  //
  // HomeView bosh sahifadagi BARCHA bo'limlarni aynan `settings.catalogs`
  // dan yasaydi (`activeCatalogs.map(...)`). Katalog ro'yxati bo'sh bo'lsa —
  // kontent bazada BOR bo'lsa ham — bosh sahifa BUTUNLAY BO'SH ko'rinardi.
  // Yangi o'rnatishda yoki brauzer keshi tozalangandan keyin foydalanuvchi
  // hech narsa ko'rmasdi va ilovani tashlab ketardi.
  //
  // Bu quyidagi ID'lar HomeView dagi `isContentInCatalog()` funksiyasida
  // allaqachon qattiq yozilgan — ya'ni asl loyihada aynan shu 4 ta katalog
  // bo'lgan (fayl `.gitignore` xatosi tufayli yo'qolgan, yuqoridagi izohga
  // qarang). Shuning uchun ularni standart qiymat sifatida tiklaymiz.
  // Admin panelda ularni tahrirlash/o'chirish mumkin.
  catalogs: [
    {
      id: 'cat_kino',
      name: 'Kinolar',
      description: 'Jahon va milliy premyera filmlar',
      format: 'standard',
      order: 1,
      isVisible: true,
    },
    {
      id: 'cat_mini_drama',
      name: 'Mini Dramalar',
      description: 'Vertikal formatdagi qisqa dramalar',
      format: 'vertical_9_16',
      order: 2,
      isVisible: true,
      badge: 'YANGI',
    },
    {
      id: 'cat_drama',
      name: 'Seriallar',
      description: 'Ko\'p qismli seriallar va dramalar',
      format: 'standard',
      order: 3,
      isVisible: true,
    },
    {
      id: 'cat_anime',
      name: 'Anime',
      description: 'Anime seriallar va filmlar',
      format: 'standard',
      order: 4,
      isVisible: true,
    },
  ],
  bannedUserIds: [],
  bannedDeviceTokens: [],
};
