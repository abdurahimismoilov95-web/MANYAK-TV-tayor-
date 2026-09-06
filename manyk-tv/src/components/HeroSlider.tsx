import React, { useState, useEffect } from 'react';
import { Star, Clock, Play, Info } from 'lucide-react';
import { ContentItem } from '../types';

interface HeroSliderProps {
  items: ContentItem[];
  onSelectContent: (item: ContentItem) => void;
  onOpenDetails: (item: ContentItem) => void;
}

export const HeroSlider: React.FC<HeroSliderProps> = ({
  items,
  onSelectContent,
  onOpenDetails,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % items.length);
    }, 4500); // Faster slide interval
    return () => clearInterval(timer);
  }, [items.length]);

  if (!items || items.length === 0) return null;
  const current = items[currentIndex];

  return (
    <section className="relative w-full px-3 sm:px-4 pt-1 pb-4">
      {/* Main Hero Card */}
      <div className="relative w-full aspect-video rounded-2xl overflow-hidden shadow-2xl bg-zinc-900 border border-zinc-800/80 group">
        {/* Background Image with smoother crossfade transition */}
        {items.map((item, index) => (
          <img
            key={item.id}
            src={item.bannerUrl || item.posterUrl}
            alt={item.title}
            className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-1000 ease-in-out ${
              index === currentIndex ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
            }`}
          />
        ))}

        {/* Cinematic Vignette Gradients */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#09090b] via-[#09090b]/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#09090b]/80 via-transparent to-transparent" />

        {/* Premium badge on top right */}
        {current.isPremium && (
          <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded shadow-lg shadow-amber-500/20">
            PREMIUM
          </div>
        )}

        {/* Content Info overlay at bottom */}
        <div className="absolute bottom-0 left-0 right-0 p-3 sm:p-5 flex flex-col justify-end">
          <h3 className="text-xl sm:text-2xl font-black text-white drop-shadow-md tracking-tight mb-1.5 line-clamp-1">
            {current.title}
          </h3>

          {/* Action buttons (Extremely Compacted) */}
          <div className="flex items-center gap-1.5 mt-0.5">
            <button
              onClick={() => onSelectContent(current)}
              className="flex items-center justify-center gap-1 bg-red-600 hover:bg-red-500 text-white font-bold text-[11px] px-2.5 py-1.5 rounded uppercase tracking-wider shadow-sm transition transform active:scale-95"
            >
              <Play className="w-3 h-3 fill-white" />
              <span>Tomosha qilish</span>
            </button>

            <button
              onClick={() => onOpenDetails(current)}
              className="flex items-center justify-center w-7 h-7 bg-zinc-800/90 hover:bg-zinc-700 text-zinc-200 rounded border border-zinc-700/80 backdrop-blur-md transition"
              title="Batafsil ma'lumot"
            >
              <Info className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Carousel Dots indicator matching screenshot */}
      <div className="flex items-center justify-center gap-2 mt-3.5">
        {items.map((_, idx) => (
          <button
            key={idx}
            onClick={() => setCurrentIndex(idx)}
            className={`transition-all duration-300 rounded-full ${
              idx === currentIndex
                ? 'w-6 h-2 bg-red-600'
                : 'w-2 h-2 bg-zinc-700 hover:bg-zinc-500'
            }`}
            aria-label={`Slide ${idx + 1}`}
          />
        ))}
      </div>
    </section>
  );
};
