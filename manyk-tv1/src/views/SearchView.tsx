import React, { useState } from 'react';
import { Search, X, Film, Filter } from 'lucide-react';
import { ContentItem, ContentType, UserProfile } from '../types';
import { ContentCard } from '../components/ContentCard';
import { checkHasAccess } from '../services/storage';

interface SearchViewProps {
  contents: ContentItem[];
  user: UserProfile;
  onSelectContent: (item: ContentItem) => void;
}

export const SearchView: React.FC<SearchViewProps> = ({
  contents,
  user,
  onSelectContent,
}) => {
  const [query, setQuery] = useState('');
  const [selectedType, setSelectedType] = useState<ContentType | 'all'>('all');
  const [onlyFree, setOnlyFree] = useState(false);

  const filtered = contents.filter((item) => {
    // Type filter
    if (selectedType !== 'all' && item.type !== selectedType) return false;

    // Free filter
    if (onlyFree && item.isPremium) return false;

    // Search query
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      item.title.toLowerCase().includes(q) ||
      (item.originalTitle && item.originalTitle.toLowerCase().includes(q)) ||
      item.description.toLowerCase().includes(q) ||
      item.genres.some((g) => g.toLowerCase().includes(q))
    );
  });

  return (
    <div className="p-4 pb-24 space-y-4 w-full mx-auto">
      {/* Search Input */}
      <div className="relative">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Kino, serial yoki drama qidirish..."
          className="w-full bg-zinc-900/90 border border-zinc-700/80 rounded-2xl pl-10 pr-10 py-3 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-red-500 shadow-lg transition"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 rounded-full bg-zinc-800 text-zinc-400 hover:text-white"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        <button
          onClick={() => setSelectedType('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedType === 'all'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Barchasi
        </button>

        <button
          onClick={() => setSelectedType('movie')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedType === 'movie'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Kinolar
        </button>

        <button
          onClick={() => setSelectedType('series')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedType === 'series'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Seriallar
        </button>

        <button
          onClick={() => setSelectedType('short_drama')}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
            selectedType === 'short_drama'
              ? 'bg-red-600 text-white shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          Short Dramalar
        </button>

        <button
          onClick={() => setOnlyFree(!onlyFree)}
          className={`px-3 py-1.5 rounded-xl text-xs font-bold transition whitespace-nowrap flex items-center gap-1 ${
            onlyFree
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'bg-zinc-900 text-zinc-400 hover:text-white border border-zinc-800'
          }`}
        >
          <Filter className="w-3 h-3" />
          <span>Faqat bepullar</span>
        </button>
      </div>

      {/* Results Count */}
      <div className="text-xs text-zinc-400 px-1">
        Natijalar: <span className="text-white font-bold">{filtered.length}</span> ta kontent
      </div>

      {/* Grid Results */}
      {filtered.length === 0 ? (
        <div className="py-16 text-center">
          <Film className="w-12 h-12 text-zinc-700 mx-auto mb-3" />
          <h4 className="text-sm font-bold text-zinc-300">Hech qanday film topilmadi</h4>
          <p className="text-xs text-zinc-500 mt-1">Boshqa so'z bilan qidirib ko'ring</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-7 2xl:grid-cols-8 gap-3">
          {filtered.map((item) => (
            <ContentCard
              key={item.id}
              item={item}
              hasAccess={checkHasAccess(user, item)}
              onClick={() => onSelectContent(item)}
            />
          ))}
        </div>
      )}
    </div>
  );
};
