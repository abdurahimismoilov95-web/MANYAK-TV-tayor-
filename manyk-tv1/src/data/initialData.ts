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

export const INITIAL_CONTENT: ContentItem[] = [
  // ═══ FILMS ═══
  {
    id: 'content_demo_1',
    title: 'Бесстрашный герой',
    description: 'Чемпион единоборств сталкивается с опасной преступной группировкой',
    type: 'movie',
    genres: ['Боевик', 'Триллер'],
    releaseYear: 2024,
    duration: '1:54:00',
    rating: 8.2,
    posterUrl: 'https://via.placeholder.com/300x450/0ea5e9/white?text=Demo+Film+1',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    cast: ['Актёр 1', 'Актёр 2'],
    director: 'Режиссёр',
    isTrending: true,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'content_demo_2',
    title: 'Любовь и судьба',
    description: 'Романтическая история двух людей из разных миров',
    type: 'movie',
    genres: ['Романтика', 'Драма'],
    releaseYear: 2024,
    duration: '2:10:00',
    rating: 7.8,
    posterUrl: 'https://via.placeholder.com/300x450/8b5cf6/white?text=Demo+Film+2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    cast: ['Актёр 3', 'Актёр 4'],
    director: 'Режиссёр 2',
    isFeaturedStore: true,
    createdAt: new Date().toISOString(),
  },
  
  // ═══ SERIES ═══
  {
    id: 'content_demo_series_1',
    title: 'Возрождение героя',
    description: 'Эпическая история о силе, предательстве и мести',
    type: 'series',
    genres: ['Фантастика', 'Приключения'],
    releaseYear: 2024,
    rating: 8.5,
    posterUrl: 'https://via.placeholder.com/300x450/10b981/white?text=Series+1',
    cast: ['Актёр 5', 'Актёр 6'],
    director: 'Режиссёр 3',
    isTrending: true,
    totalEpisodes: 24,
    episodes: Array.from({ length: 24 }, (_, i) => ({
      id: `ep_series1_${i + 1}`,
      episodeNumber: i + 1,
      title: `Эпизод ${i + 1}`,
      duration: '45:00',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: `https://via.placeholder.com/640x360/10b981/white?text=Episode+${i + 1}`,
    })),
    createdAt: new Date().toISOString(),
  },
  
  // ═══ ANIME ═══
  {
    id: 'content_demo_anime_1',
    title: 'Легенда о воине',
    description: 'Молодой воин отправляется в путешествие, чтобы спасти свой мир',
    type: 'anime_series',
    genres: ['Anime', 'Фантастика', 'Боевик'],
    releaseYear: 2024,
    rating: 9.1,
    posterUrl: 'https://via.placeholder.com/300x450/f59e0b/white?text=Anime+1',
    cast: [],
    director: 'Studio A',
    isTrending: true,
    totalEpisodes: 12,
    episodes: Array.from({ length: 12 }, (_, i) => ({
      id: `ep_anime1_${i + 1}`,
      episodeNumber: i + 1,
      title: `Серия ${i + 1}`,
      duration: '24:00',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnailUrl: `https://via.placeholder.com/640x360/f59e0b/white?text=Anime+Ep+${i + 1}`,
    })),
    createdAt: new Date().toISOString(),
  },
  
  // ═══ SHORT DRAMAS ═══
  {
    id: 'content_demo_short_1',
    title: 'Миллиардер и я',
    description: 'Короткая драма о неожиданной любви',
    type: 'short_drama',
    genres: ['Романтика', 'Драма'],
    releaseYear: 2024,
    rating: 7.5,
    posterUrl: 'https://via.placeholder.com/300x450/ec4899/white?text=Short+Drama',
    cast: [],
    director: 'Режиссёр 4',
    totalEpisodes: 30,
    episodes: Array.from({ length: 30 }, (_, i) => ({
      id: `ep_short1_${i + 1}`,
      episodeNumber: i + 1,
      title: `Часть ${i + 1}`,
      duration: '3:00',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnailUrl: `https://via.placeholder.com/270x480/ec4899/white?text=Part+${i + 1}`,
    })),
    createdAt: new Date().toISOString(),
  },
];

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
  botUsername: 'ManyakTvBot',
  telegramBotUsername: '@ManyakTvBot',
  telegramChannelUrl: 'https://t.me/Manyak_tv',
  adminContactUrl: 'https://t.me/ManyakTvBot',
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
