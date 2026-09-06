import React from 'react';
import { X, Play, Star, Clock, Calendar, Film, CheckCircle2 } from 'lucide-react';
import { ContentItem } from '../types';

interface ContentDetailsModalProps {
  isOpen: boolean;
  content: ContentItem | null;
  onClose: () => void;
  onPlay: (content: ContentItem) => void;
}

export const ContentDetailsModal: React.FC<ContentDetailsModalProps> = ({
  isOpen,
  content,
  onClose,
  onPlay,
}) => {
  if (!isOpen || !content) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in duration-200">
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
        onClick={onClose}
      />
      
      <div className="relative w-full sm:w-[550px] max-h-[90vh] sm:max-h-[85vh] bg-zinc-950 sm:rounded-3xl shadow-2xl flex flex-col animate-in slide-in-from-bottom-8 sm:slide-in-from-bottom-4 duration-300 border-t border-zinc-800 sm:border-zinc-800 overflow-hidden rounded-t-3xl">
        
        {/* Header / Banner */}
        <div className="relative h-48 sm:h-64 flex-shrink-0 bg-zinc-900">
          <img 
            src={content.bannerUrl || content.posterUrl} 
            alt={content.title}
            className="w-full h-full object-cover opacity-60"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent" />
          
          <button
            onClick={onClose}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-black/50 text-white rounded-full hover:bg-zinc-800 transition backdrop-blur-md"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="absolute bottom-4 left-4 right-4 flex items-end gap-4">
            <div className="w-24 h-36 rounded-lg overflow-hidden shadow-lg border border-zinc-800 flex-shrink-0 hidden sm:block">
              <img src={content.posterUrl} alt={content.title} className="w-full h-full object-cover" />
            </div>
            <div>
              <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-md tracking-tight leading-tight">
                {content.title}
              </h2>
              {content.originalTitle && (
                <p className="text-zinc-400 text-sm mt-1 font-medium">{content.originalTitle}</p>
              )}
            </div>
          </div>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 custom-scrollbar">
          {/* Metadata Badges */}
          <div className="flex flex-wrap items-center gap-2 mb-6">
            <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg text-xs font-bold text-amber-400 border border-zinc-800">
              <Star className="w-3.5 h-3.5 fill-amber-400" />
              <span>{content.rating.toFixed(1)}</span>
            </div>
            
            <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-300 border border-zinc-800">
              <Calendar className="w-3.5 h-3.5 text-zinc-400" />
              <span>{content.year}</span>
            </div>

            {content.duration && (
              <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-300 border border-zinc-800">
                <Clock className="w-3.5 h-3.5 text-zinc-400" />
                <span>{content.duration}</span>
              </div>
            )}

            <div className="flex items-center gap-1.5 bg-zinc-900 px-2.5 py-1 rounded-lg text-xs font-semibold text-zinc-300 border border-zinc-800 uppercase tracking-wider">
              <Film className="w-3.5 h-3.5 text-zinc-400" />
              <span>{content.quality}</span>
            </div>
            
            {content.isPremium && (
               <div className="flex items-center gap-1.5 bg-amber-500/10 px-2.5 py-1 rounded-lg text-xs font-black text-amber-500 border border-amber-500/20 uppercase tracking-wider">
                 VIP
               </div>
            )}
          </div>

          {/* Action Button */}
          <button
            onClick={() => {
              onPlay(content);
              onClose();
            }}
            className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-black text-sm py-3.5 rounded-xl shadow-lg shadow-red-600/20 transition transform active:scale-[0.98] mb-6"
          >
            <Play className="w-5 h-5 fill-white" />
            <span>Tomosha qilish</span>
          </button>

          {/* Description */}
          <div className="mb-6">
            <h4 className="text-sm font-bold text-zinc-200 mb-2">Tavsif</h4>
            <p className="text-sm text-zinc-400 leading-relaxed">
              {content.description || "Ushbu kontent haqida to'liq ma'lumot kiritilmagan."}
            </p>
          </div>

          {/* Genres */}
          <div className="mb-2">
             <h4 className="text-sm font-bold text-zinc-200 mb-2">Janrlar</h4>
             <div className="flex flex-wrap gap-2">
               {content.genres.map(genre => (
                 <span key={genre} className="text-xs font-semibold px-2.5 py-1 rounded-md bg-zinc-800/80 text-zinc-300 border border-zinc-700/50">
                   {genre}
                 </span>
               ))}
             </div>
          </div>
        </div>
      </div>
    </div>
  );
};
