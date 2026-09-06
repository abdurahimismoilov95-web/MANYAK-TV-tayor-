import React, { useState } from 'react';
import { Star, Play, Lock, Film } from 'lucide-react';
import { ContentItem } from '../types';

interface ContentCardProps {
  item: ContentItem;
  hasAccess: boolean;
  onClick: () => void;
}

export const ContentCard: React.FC<ContentCardProps> = ({
  item,
  hasAccess,
  onClick,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <div
      onClick={onClick}
      className="relative flex-shrink-0 w-32 sm:w-36 md:w-44 aspect-[2/3] rounded-xl overflow-hidden cursor-pointer group bg-zinc-950 border border-zinc-800/80 transition-all duration-300 hover:scale-[1.03] hover:border-zinc-700 shadow-md"
    >
      {/* MANYAK TV Image Skeleton Placeholder while loading */}
      {!imageLoaded && (
        <div className="absolute inset-0 bg-zinc-900 animate-shimmer flex flex-col items-center justify-center pointer-events-none z-0">
          <div className="w-8 h-8 rounded-lg bg-zinc-800 flex items-center justify-center opacity-40">
            <Film className="w-4 h-4 text-red-500" />
          </div>
          <span className="text-[9px] font-bold text-zinc-500 mt-1 opacity-60 tracking-wider">
            MANYAK TV
          </span>
        </div>
      )}

      {/* Poster Image */}
      <img
        src={item.posterUrl}
        alt={item.title}
        onLoad={() => setImageLoaded(true)}
        className={`absolute inset-0 w-full h-full object-cover object-center transition-all duration-500 group-hover:scale-105 ${
          imageLoaded ? 'opacity-100' : 'opacity-0'
        }`}
        loading="lazy"
      />

      {/* Gradient shadow for text visibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent opacity-90 pointer-events-none" />

      {/* PREMIUM Badge */}
      {item.isPremium && (
        <div className="absolute top-2 right-2 bg-gradient-to-r from-amber-500 to-amber-600 text-zinc-950 text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded shadow-md z-10">
          PREMIUM
        </div>
      )}

      {/* Type / Quality indicator on top left */}
      <div className="absolute top-2 left-2 flex flex-col gap-1 items-start z-10">
        {item.type === 'short_drama' && (
          <span className="bg-red-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            SHORTS
          </span>
        )}
        {item.type === 'series' && (
          <span className="bg-purple-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            SERIAL
          </span>
        )}
        {item.type === 'anime_series' && (
          <span className="bg-blue-600/90 text-white text-[9px] font-bold px-1.5 py-0.5 rounded shadow-sm">
            ANIME
          </span>
        )}
      </div>

      {/* Lock or Play Icon overlay */}
      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40 z-10">
        <div className="w-10 h-10 rounded-full bg-red-600/90 flex items-center justify-center text-white shadow-lg transform scale-90 group-hover:scale-100 transition-transform">
          {!hasAccess && item.isPremium ? (
            <Lock className="w-5 h-5 text-amber-300" />
          ) : (
            <Play className="w-5 h-5 fill-white ml-0.5" />
          )}
        </div>
      </div>

      {/* Card Footer with Title, Rating and Price positioned at the bottom */}
      <div className="absolute bottom-0 inset-x-0 p-2 sm:p-2.5 flex flex-col justify-end z-10">
        <div className="flex items-center gap-1 mb-1">
          <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
          <span className="text-[10px] font-semibold text-amber-400 drop-shadow-md">
            {item.rating.toFixed(1)}
          </span>
        </div>
        
        <h4 className="text-xs sm:text-sm font-bold text-white line-clamp-2 leading-tight group-hover:text-red-400 transition-colors drop-shadow-lg mb-1.5">
          {item.title}
        </h4>
        
        <div className="flex items-center justify-between text-[10px] text-zinc-300 drop-shadow-md font-medium">
          <span>{item.year}</span>
          {item.price > 0 ? (
            <span className="text-red-400 font-bold">
              {item.price.toLocaleString()} so'm
            </span>
          ) : (
            <span className="text-emerald-400 font-bold">Bepul</span>
          )}
        </div>
      </div>
    </div>
  );
};
