import React from 'react';
import { Film } from 'lucide-react';

/**
 * MANYAK TV Branded Logo Watermark / Emblem for Skeleton states
 */
export const ManyakTvLogoWatermark: React.FC<{
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  className?: string;
}> = ({ size = 'md', showSubtitle = true, className = '' }) => {
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-6 h-6' : 'w-4 h-4';
  const boxSize = size === 'sm' ? 'w-6 h-6 rounded-lg' : size === 'lg' ? 'w-12 h-12 rounded-2xl' : 'w-8 h-8 rounded-xl';
  const textSize = size === 'sm' ? 'text-xs' : size === 'lg' ? 'text-xl' : 'text-sm';

  return (
    <div className={`inline-flex items-center gap-2 select-none ${className}`}>
      {/* Glowing Brand Icon */}
      <div
        className={`${boxSize} bg-gradient-to-br from-red-600 via-rose-600 to-red-800 flex items-center justify-center shadow-lg shadow-red-600/30 animate-pulse`}
      >
        <Film className={`${iconSize} text-white`} />
      </div>

      <div className="flex flex-col">
        <div className="flex items-center gap-1.5">
          <span
            className={`font-black tracking-wider ${textSize} bg-gradient-to-r from-red-500 via-rose-400 to-red-600 bg-clip-text text-transparent`}
          >
            MANYAK TV
          </span>
          {showSubtitle && size !== 'sm' && (
            <span className="text-[9px] uppercase tracking-widest text-zinc-400 font-bold px-1 py-0.2 rounded bg-zinc-800/80 border border-zinc-700/50">
              HD
            </span>
          )}
        </div>
        {showSubtitle && size === 'lg' && (
          <span className="text-[11px] text-zinc-500 font-medium tracking-wide">
            Yuklanmoqda...
          </span>
        )}
      </div>
    </div>
  );
};

/**
 * Single Content Card Skeleton with MANYAK TV watermark
 */
export const ContentCardSkeleton: React.FC<{ index?: number }> = ({ index = 0 }) => {
  return (
    <div
      id={`skeleton-card-${index}`}
      className="group relative flex flex-shrink-0 w-32 sm:w-36 md:w-44 aspect-[2/3] flex-col rounded-xl bg-zinc-950 border border-zinc-800/60 overflow-hidden animate-shimmer animate-breathe shadow-md"
    >
      {/* Subtle MANYAK TV Logo Watermark in poster center */}
      <div className="absolute inset-0 flex flex-col items-center justify-center opacity-35">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-zinc-700 to-zinc-800 border border-zinc-700/50 flex items-center justify-center shadow-md">
          <Film className="w-5 h-5 text-red-500/80" />
        </div>
        <span className="mt-1.5 text-[10px] font-extrabold tracking-widest text-zinc-400">
          MANYAK TV
        </span>
      </div>

      {/* Top badges shimmer */}
      <div className="absolute top-2 left-2 right-2 flex justify-between items-center pointer-events-none z-10">
        <div className="h-4 w-12 rounded-md bg-zinc-700/50" />
        <div className="h-4 w-10 rounded-md bg-zinc-700/50" />
      </div>

      {/* Bottom gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 pointer-events-none" />

      {/* Card Info Body */}
      <div className="absolute bottom-0 inset-x-0 p-2 sm:p-2.5 flex flex-col justify-end z-10">
        {/* Rating Line */}
        <div className="flex items-center gap-1 mb-1.5">
          <div className="h-3 w-3 rounded-full bg-amber-400/40" />
          <div className="h-3 w-6 rounded bg-zinc-700/60" />
        </div>
        {/* Title lines (2) */}
        <div className="h-3.5 w-[90%] rounded-md bg-zinc-700/80 mb-1" />
        <div className="h-3.5 w-3/5 rounded-md bg-zinc-700/80 mb-2" />
        {/* Year and Price line */}
        <div className="flex items-center justify-between">
          <div className="h-3 w-10 rounded bg-zinc-800/80" />
          <div className="h-3 w-16 rounded bg-zinc-700/60" />
        </div>
      </div>
    </div>
  );
};

/**
 * Home View Skeleton (Hero banner + categories + grid)
 */
export const HomeViewSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 pb-24 animate-in fade-in duration-300">
      {/* 1. Hero Banner Skeleton */}
      <div className="px-4 pt-2">
        <div className="relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl bg-zinc-900/70 border border-zinc-800/70 overflow-hidden animate-shimmer animate-breathe flex items-end p-4 sm:p-6">
          {/* Central Branded Watermark */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="flex flex-col items-center text-center opacity-30 animate-pulse">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-xl shadow-red-600/40">
                <Film className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
              </div>
              <span className="mt-2 text-sm sm:text-base font-black tracking-widest text-zinc-300">
                MANYAK TV
              </span>
              <span className="text-[10px] text-zinc-500 font-semibold tracking-wider uppercase mt-0.5">
                HD Kinoteatr
              </span>
            </div>
          </div>

          {/* Bottom Banner Content Placeholder */}
          <div className="relative z-10 w-full max-w-lg space-y-2.5">
            <div className="flex items-center gap-2">
              <div className="h-4 w-20 rounded-md bg-red-600/40" />
              <div className="h-4 w-12 rounded-md bg-zinc-700/50" />
            </div>
            <div className="h-6 sm:h-8 w-3/4 rounded-lg bg-zinc-700/60" />
            <div className="h-3 w-1/2 rounded bg-zinc-800/60" />

            {/* Action buttons shimmer */}
            <div className="flex items-center gap-2.5 pt-2">
              <div className="h-9 w-28 rounded-xl bg-red-600/40" />
              <div className="h-9 w-24 rounded-xl bg-zinc-800/70" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Category Filter Pills Skeleton */}
      <div className="px-4">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-1">
          {[
            { w: 'w-20' },
            { w: 'w-24' },
            { w: 'w-28' },
            { w: 'w-24' },
            { w: 'w-20' },
            { w: 'w-24' },
          ].map((item, idx) => (
            <div
              key={idx}
              className={`h-8 ${item.w} shrink-0 rounded-xl bg-zinc-900/70 border border-zinc-800/60 animate-shimmer animate-breathe`}
            />
          ))}
        </div>
      </div>

      {/* 3. Section Header Skeleton */}
      <div className="px-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-2 h-5 rounded-full bg-red-600/60" />
          <div className="h-5 w-36 rounded-md bg-zinc-800/80 animate-shimmer animate-breathe" />
        </div>
        <div className="h-4 w-16 rounded-md bg-zinc-800/50 animate-shimmer animate-breathe" />
      </div>

      {/* 4. Movie Grid Cards Skeleton */}
      <div className="px-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {Array.from({ length: 10 }).map((_, i) => (
            <ContentCardSkeleton key={i} index={i} />
          ))}
        </div>
      </div>
    </div>
  );
};

/**
 * Shorts / Vertical Drama Skeleton
 */
export const ShortsViewSkeleton: React.FC = () => {
  return (
    <div className="relative w-full h-[calc(100vh-68px)] max-w-md mx-auto rounded-2xl bg-zinc-950 border border-zinc-800/80 overflow-hidden flex flex-col justify-between p-6 animate-shimmer animate-breathe">
      {/* Centered pulsing watermark */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-600 to-rose-700 flex items-center justify-center shadow-xl shadow-red-600/30 animate-bounce">
          <Film className="w-8 h-8 text-white" />
        </div>
        <span className="mt-3 text-lg font-black tracking-widest text-zinc-300">
          MANYAK TV
        </span>
        <span className="text-xs text-zinc-500 font-semibold tracking-wider uppercase">
          Shorts & Mini Dramalar
        </span>
      </div>

      {/* Top Bar Shimmer */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div className="h-6 w-28 rounded-lg bg-zinc-800/70" />
        <div className="h-6 w-16 rounded-lg bg-zinc-800/70" />
      </div>

      {/* Right-side Action Floating Icons Shimmer */}
      <div className="relative z-10 self-end space-y-4 flex flex-col items-center">
        <div className="w-11 h-11 rounded-full bg-zinc-800/70" />
        <div className="w-11 h-11 rounded-full bg-zinc-800/70" />
        <div className="w-11 h-11 rounded-full bg-zinc-800/70" />
        <div className="w-11 h-11 rounded-full bg-zinc-800/70" />
      </div>

      {/* Bottom info banner shimmer */}
      <div className="relative z-10 space-y-2.5 max-w-[75%]">
        <div className="h-4 w-40 rounded bg-red-600/40" />
        <div className="h-5 w-48 rounded bg-zinc-700/60" />
        <div className="h-3 w-64 rounded bg-zinc-800/60" />
      </div>
    </div>
  );
};

/**
 * Search View Skeleton
 */
export const SearchViewSkeleton: React.FC = () => {
  return (
    <div className="p-4 pb-24 space-y-4 max-w-4xl mx-auto animate-in fade-in duration-300">
      {/* Branded Watermark Header */}
      <div className="flex items-center justify-between pb-1">
        <ManyakTvLogoWatermark size="sm" />
        <div className="h-3 w-28 rounded bg-zinc-800/60 animate-shimmer animate-breathe" />
      </div>

      {/* Search Input Shimmer */}
      <div className="h-12 w-full rounded-2xl bg-zinc-900/80 border border-zinc-800/80 animate-shimmer animate-breathe" />

      {/* Filter tabs Shimmer */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
        {['w-20', 'w-24', 'w-24', 'w-28', 'w-20'].map((w, idx) => (
          <div
            key={idx}
            className={`h-8 ${w} shrink-0 rounded-xl bg-zinc-900/70 border border-zinc-800/60 animate-shimmer animate-breathe`}
          />
        ))}
      </div>

      {/* Search Grid Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3.5 pt-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <ContentCardSkeleton key={i} index={i} />
        ))}
      </div>
    </div>
  );
};

/**
 * History View Skeleton
 */
export const HistoryViewSkeleton: React.FC = () => {
  return (
    <div className="p-4 pb-24 space-y-4 max-w-3xl mx-auto animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ManyakTvLogoWatermark size="sm" />
          <div className="h-5 w-32 rounded bg-zinc-800/70 animate-shimmer animate-breathe" />
        </div>
        <div className="h-7 w-20 rounded-lg bg-zinc-800/60 animate-shimmer animate-breathe" />
      </div>

      {/* History Items List */}
      <div className="space-y-3 pt-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3.5 p-3 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 animate-shimmer animate-breathe"
          >
            {/* Thumbnail shimmer */}
            <div className="w-24 h-16 rounded-xl bg-zinc-800/70 shrink-0 flex items-center justify-center">
              <Film className="w-5 h-5 text-zinc-600" />
            </div>
            {/* Details shimmer */}
            <div className="flex-1 space-y-2">
              <div className="h-4 w-3/4 rounded bg-zinc-700/60" />
              <div className="h-3 w-1/3 rounded bg-zinc-800/60" />
              <div className="h-1.5 w-full rounded-full bg-zinc-800" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/**
 * Profile View Skeleton
 */
export const ProfileViewSkeleton: React.FC = () => {
  return (
    <div className="p-4 pb-24 space-y-4 max-w-2xl mx-auto animate-in fade-in duration-300">
      {/* Profile Card Shimmer with MANYAK TV logo */}
      <div className="p-5 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 space-y-4 animate-shimmer animate-breathe">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-600 to-rose-800 flex items-center justify-center shadow-lg shadow-red-600/20">
              <Film className="w-7 h-7 text-white" />
            </div>
            <div className="space-y-1.5">
              <div className="h-5 w-32 rounded bg-zinc-700/70" />
              <div className="h-3 w-24 rounded bg-zinc-800/60" />
            </div>
          </div>
          <div className="h-7 w-20 rounded-full bg-zinc-800/60" />
        </div>

        {/* VIP Status Card inside Profile */}
        <div className="p-4 rounded-xl bg-zinc-950/60 border border-zinc-800/60 flex items-center justify-between">
          <div className="space-y-1.5">
            <div className="h-4 w-28 rounded bg-amber-500/30" />
            <div className="h-3 w-36 rounded bg-zinc-800/60" />
          </div>
          <div className="h-8 w-24 rounded-lg bg-red-600/40" />
        </div>
      </div>

      {/* Quick Action Grid Shimmer */}
      <div className="grid grid-cols-2 gap-3">
        <div className="h-20 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 animate-shimmer animate-breathe" />
        <div className="h-20 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 animate-shimmer animate-breathe" />
      </div>

      {/* Promo Code Box Shimmer */}
      <div className="h-14 rounded-2xl bg-zinc-900/60 border border-zinc-800/60 animate-shimmer animate-breathe" />
    </div>
  );
};
