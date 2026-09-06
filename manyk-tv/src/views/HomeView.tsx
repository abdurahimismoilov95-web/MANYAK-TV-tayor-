import React, { useState } from 'react';
import { Sparkles, ChevronRight, Film, Tv, Flame, Clapperboard, FolderHeart, Ticket } from 'lucide-react';
import { ContentItem, UserProfile, SystemSettings, CatalogCategory } from '../types';
import { HeroSlider } from '../components/HeroSlider';
import { ContentCard } from '../components/ContentCard';
import { DailyCheckInWidget } from '../components/DailyCheckInWidget';
import { checkHasAccess, spendTokenToUnlock } from '../services/storage';

interface HomeViewProps {
  contents: ContentItem[];
  user: UserProfile;
  settings: SystemSettings;
  onSelectContent: (item: ContentItem) => void;
  onOpenDetails: (item: ContentItem) => void;
  onOpenShorts: () => void;
  onOpenVip: () => void;
  onOpenPayment?: (content?: ContentItem) => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  contents,
  user,
  settings,
  onSelectContent,
  onOpenDetails,
  onOpenShorts,
  onOpenVip,
  onOpenPayment,
}) => {
  const [selectedCatalogId, setSelectedCatalogId] = useState<string>('all');

  // Trend films for hero slider
  const trendingFilms = contents.filter((c) => c.isTrending || c.rating >= 7.5);

  // Single purchase premiere items (Featured store items #1 first)
  const featuredStoreItems = contents
    .filter((c) => c.isSinglePurchase || c.isFeaturedStore)
    .sort((a, b) => {
      if (a.isFeaturedStore && !b.isFeaturedStore) return -1;
      if (!a.isFeaturedStore && b.isFeaturedStore) return 1;
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  // Screen catalogs from settings (ordered and visible)
  const activeCatalogs = (settings.catalogs || [])
    .filter((c) => c.isVisible !== false)
    .sort((a, b) => a.order - b.order);

  // Helper to match content to a catalog
  const isContentInCatalog = (item: ContentItem, catalog: CatalogCategory): boolean => {
    if (item.catalogId === catalog.id) return true;
    if (catalog.id === 'cat_kino' && item.type === 'movie') return true;
    if (catalog.id === 'cat_mini_drama' && item.type === 'short_drama') return true;
    if (catalog.id === 'cat_anime' && (item.type === 'anime_series' || item.genres.includes('Anime') || item.title.toLowerCase().includes('anime'))) return true;
    if (catalog.id === 'cat_drama' && (item.type === 'series' || item.genres.includes('Drama'))) return true;
    // By name matching
    const catNameLower = catalog.name.toLowerCase();
    if (item.genres.some((g) => g.toLowerCase() === catNameLower)) return true;
    if (item.type === 'short_drama' && (catNameLower.includes('mini') || catNameLower.includes('short'))) return true;
    return false;
  };

  // Filtered contents if a single catalog tab is selected
  const selectedCatalog = activeCatalogs.find((c) => c.id === selectedCatalogId);
  const singleCatalogContents = selectedCatalog
    ? contents.filter((item) => isContentInCatalog(item, selectedCatalog))
    : contents;

  // Hech bir KO'RINADIGAN katalogga tushmagan kontent.
  // Katalog ro'yxati bo'sh bo'lsa — bu BARCHA kontent bo'ladi, ya'ni
  // bosh sahifa baribir to'la ko'rinadi (pastdagi "kafolat" blokiga qarang).
  const uncategorizedContents = contents.filter(
    (item) => !activeCatalogs.some((catalog) => isContentInCatalog(item, catalog))
  );

  // Render appropriate category icon
  const getCatalogIcon = (catalog: CatalogCategory) => {
    if (catalog.format === 'vertical_9_16' || catalog.id === 'cat_mini_drama') {
      return <Flame className="w-4 h-4 text-red-500 fill-red-500 animate-pulse" />;
    }
    if (catalog.id === 'cat_kino') {
      return <Film className="w-4 h-4 text-red-500" />;
    }
    if (catalog.id === 'cat_anime') {
      return <Clapperboard className="w-4 h-4 text-amber-400" />;
    }
    if (catalog.id === 'cat_drama') {
      return <Tv className="w-4 h-4 text-purple-400" />;
    }
    return <FolderHeart className="w-4 h-4 text-red-400" />;
  };

  return (
    <div className="pb-24 space-y-6">
      {/* Hero Featured Slider */}
      <div className="-mx-4 sm:mx-0">
        <HeroSlider
          items={trendingFilms.slice(0, 5)}
          onSelectContent={onSelectContent}
          onOpenDetails={onOpenDetails}
        />
      </div>

      <div className="px-4">
        {/* Daily Check-in Bonus System */}
        <DailyCheckInWidget user={user} onOpenVip={onOpenVip} />
      </div>

      {/* Screen Catalogs Bar (Exact screen categories configured by admin) */}
      <div className="px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-1.5 scrollbar-none">
          <button
            onClick={() => setSelectedCatalogId('all')}
            className={`px-3 py-1 rounded-full text-[13px] font-semibold transition whitespace-nowrap ${
              selectedCatalogId === 'all'
                ? 'bg-white text-black shadow-md'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            Barchasi
          </button>

          {activeCatalogs.map((cat) => {
            const isSelected = selectedCatalogId === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setSelectedCatalogId(cat.id)}
                className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold transition whitespace-nowrap ${
                  isSelected
                    ? 'bg-white text-black shadow-md'
                    : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800'
                }`}
              >
                <span>{cat.name}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* VIP Promotion Banner if user is not VIP */}
      {!user.isVip && (
        <div className="px-4">
          <div
            onClick={onOpenVip}
            className="relative overflow-hidden p-4 rounded-2xl bg-gradient-to-r from-red-950/80 via-zinc-900 to-zinc-900 border border-red-800/60 cursor-pointer group shadow-lg"
          >
            <div className="flex items-center justify-between relative z-10">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-red-600 flex items-center justify-center text-white shadow-lg shadow-red-600/30">
                  <Sparkles className="w-5 h-5 text-amber-300 animate-pulse" />
                </div>
                <div>
                  <h4 className="text-sm font-black text-white group-hover:text-red-400 transition">
                    MANYK TV VIP Obuna
                  </h4>
                  <p className="text-xs text-zinc-400">
                    Barcha kino, serial va vertikal mini dramalarni cheksiz tomosha qiling
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-red-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </div>
        </div>
      )}

      {/* FEATURED STORE PREMIERE (Yangi serial premyerasi vitrinada 1-bo'lib turadi) */}
      {featuredStoreItems.length > 0 && (
        <section className="px-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-pulse" />
              <h3 className="text-base font-black text-white tracking-tight">
                Premyera Seriallar — Alohida Xarid
              </h3>
            </div>
            <span className="text-[10px] font-bold text-amber-400 bg-amber-950/80 border border-amber-800/80 px-2 py-0.5 rounded-full">
              Sotuv Vitrinasi
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {featuredStoreItems.slice(0, 2).map((item) => {
              const hasAccess = checkHasAccess(user, item);
              return (
                <div
                  key={item.id}
                  className="relative p-3.5 rounded-2xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/30 border border-amber-600/40 flex gap-3.5 group shadow-lg"
                >
                  <div
                    onClick={() => onSelectContent(item)}
                    className="w-24 h-32 rounded-xl overflow-hidden flex-shrink-0 cursor-pointer relative"
                  >
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.isFeaturedStore && (
                      <span className="absolute top-1 left-1 bg-amber-500 text-zinc-950 text-[9px] font-black px-1.5 py-0.5 rounded shadow">
                        #1 Vitrina
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider">
                          {(item.type === 'series' || item.type === 'anime_series') ? 'Yangi Serial' : 'Premyera Film'}
                        </span>
                        <span className="text-[10px] text-zinc-500">• {item.year}</span>
                      </div>
                      <h4
                        onClick={() => onSelectContent(item)}
                        className="text-sm font-bold text-white truncate cursor-pointer hover:text-red-400 transition"
                      >
                        {item.title}
                      </h4>
                      <p className="text-xs text-zinc-400 line-clamp-2 mt-1">
                        {item.description || 'Yangi serial premyerasi. VIP siz ham alohida xarid qilib ko\'rishingiz mumkin.'}
                      </p>
                    </div>

                    <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-800/80">
                      <div>
                        <div className="text-[10px] text-zinc-500 font-medium">Belgilangan narxi:</div>
                        <div className="text-sm font-black text-amber-400">
                          {(item.price || 15000).toLocaleString()} UZS
                        </div>
                      </div>

                      {hasAccess ? (
                        <button
                          type="button"
                          onClick={() => onSelectContent(item)}
                          className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1"
                        >
                          Tomosha qilish
                        </button>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          {user.accessTokens && user.accessTokens > 0 ? (
                            <button
                              type="button"
                              onClick={() => {
                                if ((item.type === 'series' || item.type === 'anime_series') && item.episodes && item.episodes.length > 0) {
                                  // Serial bo'lsa, foydalanuvchi qaysi qismni ochishni o'zi tanlashi uchun pleyer ochiladi
                                  onSelectContent(item);
                                } else {
                                  // Token sarflash endi SERVER tomonida (async).
                                  // ESKI KOD natijani e'tiborsiz qoldirardi:
                                  // token tugagan bo'lsa tugma hech nima
                                  // qilmasdi va foydalanuvchi sababini
                                  // bilmasdi. Endi xato xabari ko'rsatiladi.
                                  void spendTokenToUnlock(user.id, item.id, item.title).then((res) => {
                                    if (res.success) {
                                      onSelectContent(item);
                                    } else {
                                      alert(res.message);
                                    }
                                  });
                                }
                              }}
                              className="py-1.5 px-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold shadow-md shadow-amber-600/20 transition flex items-center gap-1"
                              title={(item.type === 'series' || item.type === 'anime_series') ? "1 ta qismni token bilan ochish" : "1 ta Token bilan ochish"}
                            >
                              <Ticket className="w-3.5 h-3.5" />
                              <span>Token ({user.accessTokens})</span>
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => {
                              if (onOpenPayment) {
                                onOpenPayment(item);
                              } else {
                                onSelectContent(item);
                              }
                            }}
                            className="py-1.5 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/30 transition flex items-center gap-1"
                          >
                            Sotib Olish
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* VIEW 1: Single Catalog Filtered View */}
      {selectedCatalogId !== 'all' && selectedCatalog && (
        <section className="px-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                {getCatalogIcon(selectedCatalog)}
                <span>{selectedCatalog.name}</span>
                {selectedCatalog.badge && (
                  <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded">
                    {selectedCatalog.badge}
                  </span>
                )}
              </h3>
              {selectedCatalog.description && (
                <p className="text-xs text-zinc-400 mt-0.5">{selectedCatalog.description}</p>
              )}
            </div>
            <span className="text-xs font-bold text-zinc-500">
              {singleCatalogContents.length} ta kontent
            </span>
          </div>

          {singleCatalogContents.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              Ushbu katalogda hozircha kontent mavjud emas.
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
              {singleCatalogContents.map((item) => (
                <ContentCard
                  key={item.id}
                  item={item}
                  hasAccess={checkHasAccess(user, item)}
                  onClick={() => onSelectContent(item)}
                />
              ))}
            </div>
          )}
        </section>
      )}

      {/* VIEW 2: All Catalogs Sections (Exact catalogs visible on screen) */}
      {selectedCatalogId === 'all' && (
        <div className="space-y-7">
          {activeCatalogs.map((catalog) => {
            const catItems = contents.filter((item) => isContentInCatalog(item, catalog));
            if (catItems.length === 0) return null;


            const isMiniDrama = catalog.format === 'vertical_9_16' || catalog.id === 'cat_mini_drama';

            return (
              <section key={catalog.id} className="px-4">
                <div className="flex items-center justify-between mb-3">
                  <div>
                    <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                      {getCatalogIcon(catalog)}
                      <span>{catalog.name}</span>
                    </h3>
                    <div className="w-8 h-0.5 bg-red-600 rounded-full mt-0.5" />
                  </div>

                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setSelectedCatalogId(catalog.id)}
                      className="text-xs text-zinc-400 hover:text-white font-medium flex items-center gap-0.5"
                    >
                      <span>Barchasi ({catItems.length})</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-none">
                  {catItems.map((item) => (
                    <ContentCard
                      key={item.id}
                      item={item}
                      hasAccess={checkHasAccess(user, item)}
                      onClick={() => onSelectContent(item)}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          {/* ═══════════════════════════════════════════════════════════════
            *  KAFOLAT: KONTENT HECH QACHON KO'RINMAY QOLMASLIGI KERAK
            * ═══════════════════════════════════════════════════════════════
            *
            * MUAMMO: yuqoridagi ro'yxat bosh sahifani FAQAT
            * `settings.catalogs` dan yasaydi. Agar:
            *   - katalog ro'yxati bo'sh bo'lsa (yangi o'rnatish yoki kesh
            *     tozalangan holat — aynan shu bug edi),
            *   - admin barcha kataloglarni o'chirsa yoki `isVisible: false`
            *     qilsa,
            *   - yoki kontent hech bir katalog shartiga mos kelmasa
            *     (masalan admin yangi tur qo'shsa),
            * bosh sahifa BUTUNLAY BO'SH ko'rinardi — kontent bazada bor
            * bo'lsa ham. Foydalanuvchi uchun bu "ilova ishlamayapti" degani.
            *
            * Pastdagi blok shu holatlarni qoplaydi: hech bir katalogga
            * tushmagan kontentni alohida bo'limda ko'rsatadi.
            */}
          {uncategorizedContents.length > 0 && (
            <section className="px-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-base sm:text-lg font-bold text-white tracking-tight flex items-center gap-2">
                    <FolderHeart className="w-4 h-4 text-zinc-400" />
                    <span>
                      {activeCatalogs.length === 0 ? 'Barcha kontentlar' : 'Boshqa kontentlar'}
                    </span>
                  </h3>
                  <div className="w-8 h-0.5 bg-red-600 rounded-full mt-0.5" />
                </div>
                <span className="text-xs font-bold text-zinc-500">
                  {uncategorizedContents.length} ta
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-3">
                {uncategorizedContents.map((item) => (
                  <ContentCard
                    key={item.id}
                    item={item}
                    hasAccess={checkHasAccess(user, item)}
                    onClick={() => onSelectContent(item)}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Haqiqatan kontent yo'q bo'lsa — bo'sh ekran o'rniga tushunarli
            * xabar. Ilgari bu holat ham shunchaki bo'sh sahifa edi. */}
          {contents.length === 0 && (
            <section className="px-4">
              <div className="flex flex-col items-center justify-center text-center py-14 px-6 rounded-2xl bg-zinc-950/80 border border-zinc-800">
                <div className="w-14 h-14 rounded-2xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-500 mb-3">
                  <Film className="w-7 h-7" />
                </div>
                <h3 className="text-sm font-bold text-white mb-1">Hozircha kontent yo'q</h3>
                <p className="text-xs text-zinc-400 max-w-xs leading-relaxed">
                  Kinolar va seriallar hali qo'shilmagan. Internet aloqasini
                  tekshirib, sahifani yangilab ko'ring.
                </p>
              </div>
            </section>
          )}
        </div>
      )}
    </div>
  );
};
