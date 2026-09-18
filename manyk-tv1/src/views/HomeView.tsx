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
  // ✅ YANGI: "Yangi kinolar" filtrini qo'shish
  const [showNewOnly, setShowNewOnly] = useState(false);
  // ✅ YANGI: Sotuv vitrinasi modal ($ knopka bosilganda)
  const [isStoreModalOpen, setIsStoreModalOpen] = useState(false);

  // Trend films for hero slider
  const trendingFilms = contents.filter((c) => c.isTrending || c.rating >= 7.5);

  // ✅ TAKOMILLASHTIRILDI: Yangi qo'shilgan kinolarni topish (oxirgi 30 kun)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  const newContents = contents.filter((c) => {
    const createdDate = new Date(c.createdAt);
    return createdDate >= thirtyDaysAgo;
  }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

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
  let singleCatalogContents = selectedCatalog
    ? contents.filter((item) => isContentInCatalog(item, selectedCatalog))
    : contents;
  
  // ✅ YANGI: Agar "Yangi kinolar" filtri yoqilgan bo'lsa
  if (showNewOnly) {
    singleCatalogContents = singleCatalogContents.filter((item) => {
      const createdDate = new Date(item.createdAt);
      return createdDate >= thirtyDaysAgo;
    });
  }

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
            onClick={() => {
              setSelectedCatalogId('all');
              setShowNewOnly(false);
            }}
            className={`px-3 py-1 rounded-full text-[13px] font-semibold transition whitespace-nowrap ${
              selectedCatalogId === 'all' && !showNewOnly
                ? 'bg-white text-black shadow-md'
                : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800'
            }`}
          >
            Barchasi
          </button>

          {/* ✅ YANGI: Yangi kinolar filtri */}
          {newContents.length > 0 && (
            <button
              onClick={() => {
                setSelectedCatalogId('new');
                setShowNewOnly(true);
              }}
              className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-[13px] font-semibold transition whitespace-nowrap ${
                showNewOnly
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-md'
                  : 'bg-zinc-900/80 text-zinc-400 hover:text-white border border-zinc-800 hover:bg-zinc-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>Yangi kinolar ({newContents.length})</span>
            </button>
          )}

          {activeCatalogs.map((cat) => {
            const isSelected = selectedCatalogId === cat.id && !showNewOnly;
            return (
              <button
                key={cat.id}
                onClick={() => {
                  setSelectedCatalogId(cat.id);
                  setShowNewOnly(false);
                }}
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
                    MANYAK TV VIP Obuna
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
        <>
          {/* Dumaloq knopka - o'ng tomonda */}
          <button
            onClick={() => setIsStoreModalOpen(true)}
            className="fixed right-4 top-1/2 -translate-y-1/2 z-40 w-12 h-12 rounded-full bg-gradient-to-br from-amber-600 to-amber-500 shadow-2xl shadow-amber-600/50 flex items-center justify-center text-white hover:scale-110 active:scale-95 transition-all duration-300 border-2 border-amber-400/30"
          >
            <span className="text-xl font-black animate-pulse-scale">$</span>
          </button>

          {/* Sotuv vitrinasi modal */}
          {isStoreModalOpen && (
            <div 
              className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn"
              onClick={() => setIsStoreModalOpen(false)}
            >
              <div 
                className="relative w-full max-w-5xl max-h-[80vh] bg-gradient-to-b from-zinc-900/95 to-zinc-950/95 rounded-2xl shadow-2xl overflow-hidden border border-amber-600/30 animate-slideUp"
                onClick={(e) => e.stopPropagation()}
              >
                {/* Header */}
                <div className="sticky top-0 z-10 bg-gradient-to-r from-amber-600 to-amber-500 px-4 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-white animate-pulse" />
                    <h3 className="text-base font-black text-white">Sotuv Vitrinasi</h3>
                  </div>
                  <button
                    onClick={() => setIsStoreModalOpen(false)}
                    className="w-8 h-8 rounded-lg bg-amber-950/30 hover:bg-amber-950/50 flex items-center justify-center text-white transition"
                  >
                    <span className="text-xl">×</span>
                  </button>
                </div>

                {/* Content - Horizontal scroll */}
                <div className="p-4 overflow-y-auto max-h-[calc(80vh-60px)] custom-scrollbar">
                  <div className="flex gap-3 overflow-x-auto pb-2 custom-scrollbar snap-x snap-mandatory">
              {featuredStoreItems.map((item) => {
              const hasAccess = checkHasAccess(user, item);
              return (
                <div
                  key={item.id}
                  className="relative flex-shrink-0 w-[220px] p-2 rounded-xl bg-gradient-to-br from-zinc-900 via-zinc-900 to-amber-950/30 border border-amber-600/40 flex gap-2 group shadow-lg snap-start"
                >
                  <div
                    onClick={() => {
                      setIsStoreModalOpen(false);
                      onSelectContent(item);
                    }}
                    className="w-14 h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer relative"
                  >
                    <img
                      src={item.posterUrl}
                      alt={item.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {item.isFeaturedStore && (
                      <span className="absolute top-0.5 left-0.5 bg-amber-500 text-zinc-950 text-[7px] font-black px-1 py-0.5 rounded shadow">
                        #1
                      </span>
                    )}
                  </div>

                  <div className="flex-1 flex flex-col justify-between min-w-0">
                    <div>
                      <div className="flex items-center gap-1 mb-0.5">
                        <span className="text-[8px] font-bold text-amber-400 uppercase tracking-wider">
                          {(item.type === 'series' || item.type === 'anime_series') ? 'Serial' : 'Film'}
                        </span>
                        <span className="text-[8px] text-zinc-500">• {item.year}</span>
                      </div>
                      <h4
                        onClick={() => {
                          setIsStoreModalOpen(false);
                          onSelectContent(item);
                        }}
                        className="text-[11px] font-bold text-white line-clamp-2 cursor-pointer hover:text-red-400 transition"
                      >
                        {item.title}
                      </h4>
                    </div>

                    <div className="flex items-center justify-between mt-1.5 pt-1 border-t border-zinc-800/80">
                      <div>
                        <div className="text-[7px] text-zinc-500 font-medium">Narxi:</div>
                        <div className="text-[11px] font-black text-amber-400">
                          {(item.price || 15000).toLocaleString()} <span className="text-[8px]">UZS</span>
                        </div>
                      </div>

                      {hasAccess ? (
                        <button
                          type="button"
                          onClick={() => {
                            setIsStoreModalOpen(false);
                            onSelectContent(item);
                          }}
                          className="py-0.5 px-1.5 rounded-md bg-emerald-600 hover:bg-emerald-500 text-white text-[9px] font-bold transition"
                        >
                          Tomosha
                        </button>
                      ) : (
                        <div className="flex items-center gap-1">
                          {/* Token tugmasi - faqat seriallar uchun */}
                          {user.accessTokens && user.accessTokens > 0 && 
                           (item.type === 'series' || item.type === 'anime_series' || item.type === 'short_drama') && 
                           item.episodes && item.episodes.length >= 10 ? (
                            <button
                              type="button"
                              onClick={() => {
                                setIsStoreModalOpen(false);
                                onSelectContent(item);
                              }}
                              className="py-0.5 px-1 rounded-md bg-amber-600 hover:bg-amber-500 text-white text-[8px] font-bold shadow-sm shadow-amber-600/20 transition flex items-center gap-0.5"
                              title={`Token bilan qism ochish (har 10 qismga 1 ta)`}
                            >
                              <Ticket className="w-2 h-2" />
                            </button>
                          ) : null}

                          <button
                            type="button"
                            onClick={() => {
                              setIsStoreModalOpen(false);
                              if (onOpenPayment) {
                                onOpenPayment(item);
                              } else {
                                onSelectContent(item);
                              }
                            }}
                            className="relative overflow-hidden py-0.5 px-1.5 rounded-md bg-gradient-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white text-[9px] font-bold shadow-sm shadow-red-600/30 transition-all duration-300 hover:scale-105 active:scale-95 group/btn"
                          >
                            <span className="relative z-10">Sotib ol</span>
                            <span className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-700"></span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      )}

      {/* VIEW 1: Single Catalog Filtered View or New Content View */}
      {(selectedCatalogId !== 'all' || showNewOnly) && (
        <section className="px-4 space-y-3">
          <div className="flex items-center justify-between border-b border-zinc-800/80 pb-3">
            <div>
              <h3 className="text-lg font-black text-white flex items-center gap-2">
                {showNewOnly ? (
                  <>
                    <Sparkles className="w-5 h-5 text-emerald-400 animate-pulse" />
                    <span>Yangi qo'shilgan kinolar</span>
                  </>
                ) : selectedCatalog ? (
                  <>
                    {getCatalogIcon(selectedCatalog)}
                    <span>{selectedCatalog.name}</span>
                    {selectedCatalog.badge && (
                      <span className="text-[10px] bg-red-600 text-white font-extrabold px-2 py-0.5 rounded">
                        {selectedCatalog.badge}
                      </span>
                    )}
                  </>
                ) : null}
              </h3>
              {!showNewOnly && selectedCatalog?.description && (
                <p className="text-xs text-zinc-400 mt-0.5">{selectedCatalog.description}</p>
              )}
              {showNewOnly && (
                <p className="text-xs text-zinc-400 mt-0.5">Oxirgi 30 kun ichida qo'shilgan barcha kontent</p>
              )}
            </div>
            <span className="text-xs font-bold text-zinc-500">
              {singleCatalogContents.length} ta kontent
            </span>
          </div>

          {singleCatalogContents.length === 0 ? (
            <div className="text-center py-12 text-zinc-500 text-xs">
              {showNewOnly ? 'Yangi kontent hozircha qo\'shilmagan.' : 'Ushbu katalogda hozircha kontent mavjud emas.'}
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
