import React, { useState, useRef, useEffect } from 'react';
import {
  Heart,
  MessageCircle,
  Lock,
  Layers,
  Sparkles,
  ChevronUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Play,
  ArrowLeft,
  X,
} from 'lucide-react';
import { ContentItem, Episode, UserProfile } from '../types';
import {
  checkHasAccess,
  recordViewCount,
  addWatchHistoryItem,
} from '../services/storage';

interface ShortsFeedProps {
  shortDramas: ContentItem[];
  user: UserProfile;
  onOpenPayment: (content: ContentItem, episode?: Episode) => void;
  onBack?: () => void;
}

export const ShortsFeed: React.FC<ShortsFeedProps> = ({
  shortDramas,
  user,
  onOpenPayment,
  onBack,
}) => {
  const [dramaIndex, setDramaIndex] = useState(0);
  const [episodeIndex, setEpisodeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const [showEpisodeSheet, setShowEpisodeSheet] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [comments, setComments] = useState<string[]>([
    'Zo\'r drama ekan, keyingi qismini kutaman!',
    'Bosh qahramonning qasosi juda qiziq bo\'lyapti 🔥',
    'Sifati juda tiniq, rahmat MANYAK TV!',
  ]);
  const [commentInput, setCommentInput] = useState('');

  const videoRef = useRef<HTMLVideoElement>(null);

  const currentDrama = shortDramas[dramaIndex] || shortDramas[0];
  const episodes = currentDrama?.episodes || [];
  const currentEpisode: Episode | undefined = episodes[episodeIndex];

  const hasAccess = currentDrama && currentEpisode
    ? checkHasAccess(user, currentDrama, currentEpisode)
    : false;

  useEffect(() => {
    if (currentDrama && currentEpisode) {
      recordViewCount(currentDrama.id, currentEpisode.id);
      addWatchHistoryItem(user.id, {
        contentId: currentDrama.id,
        contentTitle: currentDrama.title,
        contentType: 'short_drama',
        posterUrl: currentDrama.posterUrl,
        episodeId: currentEpisode.id,
        episodeNumber: currentEpisode.episodeNumber,
        progressSeconds: 0,
        durationSeconds: 120,
      });
    }
  }, [currentDrama, currentEpisode, user.id]);

  if (!shortDramas || shortDramas.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[70vh] text-center p-6">
        <p className="text-zinc-400 text-sm">Hozircha vertikal short dramalar mavjud emas.</p>
        {onBack && (
          <button
            onClick={onBack}
            className="mt-4 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl text-xs font-bold"
          >
            Bosh sahifaga qaytish
          </button>
        )}
      </div>
    );
  }

  const handleNextEpisode = () => {
    if (episodeIndex < episodes.length - 1) {
      setEpisodeIndex(episodeIndex + 1);
      setIsPlaying(true);
      setTimeout(() => videoRef.current?.play().catch(() => {}), 100);
    } else if (dramaIndex < shortDramas.length - 1) {
      setDramaIndex(dramaIndex + 1);
      setEpisodeIndex(0);
      setIsPlaying(true);
      setTimeout(() => videoRef.current?.play().catch(() => {}), 100);
    }
  };

  const handlePrevEpisode = () => {
    if (episodeIndex > 0) {
      setEpisodeIndex(episodeIndex - 1);
      setIsPlaying(true);
      setTimeout(() => videoRef.current?.play().catch(() => {}), 100);
    } else if (dramaIndex > 0) {
      setDramaIndex(dramaIndex - 1);
      const prevEpisodes = shortDramas[dramaIndex - 1]?.episodes || [];
      setEpisodeIndex(Math.max(0, prevEpisodes.length - 1));
      setIsPlaying(true);
      setTimeout(() => videoRef.current?.play().catch(() => {}), 100);
    }
  };

  const toggleLike = () => {
    const key = `${currentDrama.id}_${currentEpisode?.id}`;
    setLiked((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const handleAddComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentInput.trim()) return;
    setComments([commentInput.trim(), ...comments]);
    setCommentInput('');
  };

  const isLiked = Boolean(liked[`${currentDrama.id}_${currentEpisode?.id}`]);

  // Touch tracking variables for swiping
  const touchStartY = useRef<number | null>(null);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    touchStartY.current = null;
    
    // Y aksida kamida 50px surilsa va chap/o'ng qilinmasa deb faraz qilamiz
    if (Math.abs(deltaY) > 50) {
      if (deltaY > 0) {
        // Yuqoriga surish -> Keyingi qism
        handleNextEpisode();
      } else {
        // Pastga surish -> Oldingi qism
        handlePrevEpisode();
      }
    }
  };

  return (
    <div 
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="relative w-full h-[calc(100vh-120px)] max-w-md mx-auto bg-black rounded-2xl overflow-hidden border border-zinc-800 shadow-2xl flex items-center justify-center select-none"
    >
      {/* Video Content */}
      <div className="relative w-full h-full bg-zinc-950 flex items-center justify-center overflow-hidden">
        {hasAccess ? (
          <>
            <video
              ref={videoRef}
              src={currentEpisode?.videoUrl || currentDrama.videoUrl}
              autoPlay
              playsInline
              muted={isMuted}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={handleNextEpisode}
              onClick={() => {
                if (videoRef.current) {
                  if (isPlaying) {
                    videoRef.current.pause();
                    setIsPlaying(false);
                  } else {
                    videoRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
                }
              }}
              className="w-full h-full object-cover cursor-pointer"
            />

            {/* Play/Pause indicator button */}
            {!isPlaying && (
              <div
                onClick={() => {
                  if (videoRef.current) {
                    videoRef.current.play().catch(() => {});
                    setIsPlaying(true);
                  }
                }}
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20 z-10 group"
              >
                <div className="w-12 h-12 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md flex items-center justify-center text-white transform group-hover:scale-110 transition">
                  <Play className="w-5 h-5 fill-white ml-0.5" />
                </div>
              </div>
            )}

            {/* Telegram ID suv belgisi - vertikal ekran bo'ylab suzib yuradi */}
            <div
              className="z-20 pointer-events-none select-none text-[11px] font-mono font-bold text-white/50 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] animate-roam-vertical"
            >
              ID: {user.id}
            </div>
          </>
        ) : (
          /* Locked Short Episode Screen */
          <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950">
            <img
              src={currentDrama.posterUrl}
              alt={currentDrama.title}
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md"
            />
            <div className="relative z-10 p-5 rounded-2xl bg-zinc-900/95 border border-zinc-800 backdrop-blur-xl">
              <div className="w-12 h-12 rounded-2xl bg-red-950/90 border border-red-800 flex items-center justify-center text-red-400 mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h4 className="text-base font-black text-white mb-1">
                {currentEpisode?.title || 'Pullik Qism'}
              </h4>
              <p className="text-xs text-zinc-400 mb-4 max-w-xs">
                Ushbu epizod faqat VIP a'zolar yoki butun dramani sotib olganlar uchun ochiq.
              </p>

              <div className="space-y-2">
                <button
                  onClick={() => onOpenPayment(currentDrama, currentEpisode)}
                  className="w-full py-2.5 px-4 rounded-xl bg-red-600 hover:bg-red-500 font-bold text-xs text-white shadow-lg shadow-red-600/30 flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="w-4 h-4 text-amber-300" />
                  <span>VIP Obuna Olish (39,000 so'm)</span>
                </button>
                <button
                  onClick={() => onOpenPayment(currentDrama, currentEpisode)}
                  className="w-full py-2 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 font-semibold text-xs text-zinc-300 border border-zinc-700"
                >
                  Dramani to'liq ochish ({currentDrama.price.toLocaleString()} so'm)
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Gradient shadow for text visibility */}
        <div className="absolute inset-x-0 bottom-0 h-48 bg-gradient-to-t from-black/90 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-x-0 top-0 h-24 bg-gradient-to-b from-black/80 to-transparent pointer-events-none" />

        {/* Top bar info with Orqaga Back button */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {onBack && (
              <button
                onClick={onBack}
                className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/40 hover:bg-black/60 text-white text-[11px] font-bold border border-transparent backdrop-blur-md shadow-lg transition active:scale-95"
                title="Orqaga qaytish"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Orqaga</span>
              </button>
            )}
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white truncate drop-shadow-md">
                {currentDrama.title}
              </h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className="p-2 rounded-full bg-black/60 backdrop-blur-md text-white border border-white/10"
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Right side interaction buttons (TikTok Style) */}
        <div className="absolute right-3 bottom-24 z-20 flex flex-col items-center gap-3.5">
          {/* Like Button */}
          <button
            onClick={toggleLike}
            className="flex flex-col items-center gap-1 text-white group"
          >
            <div className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md shadow-lg transition transform active:scale-90 ${
              isLiked ? 'bg-red-600 text-white shadow-red-600/30' : 'bg-black/40 text-white hover:bg-black/60'
            }`}>
              <Heart className={`w-4 h-4 ${isLiked ? 'fill-white' : ''}`} />
            </div>
            <span className="text-[10px] font-bold drop-shadow-md">
              {((currentDrama.likesCount || 0) + (isLiked ? 1 : 0)).toLocaleString()}
            </span>
          </button>

          {/* Episode Selector Button */}
          <button
            onClick={() => setShowEpisodeSheet(true)}
            className="flex flex-col items-center gap-1 text-white group"
          >
            <div className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md shadow-lg flex items-center justify-center text-white transition transform active:scale-90">
              <Layers className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-bold drop-shadow-md">Qismlar</span>
          </button>

          {/* Comments Button */}
          <button
            onClick={() => setShowComments(true)}
            className="flex flex-col items-center gap-1 text-white group"
          >
            <div className="w-9 h-9 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md shadow-lg flex items-center justify-center text-white transition transform active:scale-90">
              <MessageCircle className="w-4 h-4 text-white" />
            </div>
            <span className="text-[10px] font-bold drop-shadow-md">{comments.length}</span>
          </button>
        </div>

        {/* Bottom Info: Title, Episode, Description */}
        <div className="absolute left-4 right-16 bottom-6 z-20 text-left">
          <h3 className="text-sm font-bold text-white line-clamp-1 drop-shadow-md">
            {currentDrama.title}
          </h3>
          <div className="flex items-center gap-2 mt-1">
            <span className="bg-white/20 backdrop-blur-md text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
              {currentEpisode ? `${currentEpisode.episodeNumber}/${episodes.length} Qism` : '1-Qism'}
            </span>
            <span className="text-[11px] text-zinc-200 font-medium drop-shadow-md">
              {currentEpisode?.title}
            </span>
          </div>
          <p className="text-[11px] text-zinc-300 line-clamp-2 mt-1 drop-shadow-md leading-snug">
            {currentDrama.description}
          </p>
        </div>

        {/* Up / Down Navigation Floaters */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5">
          <button
            onClick={handlePrevEpisode}
            disabled={episodeIndex === 0 && dramaIndex === 0}
            className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 disabled:opacity-30 text-white backdrop-blur-md transition shadow-md"
            title="Oldingi qism"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
          <button
            onClick={handleNextEpisode}
            className="p-1.5 rounded-full bg-black/30 hover:bg-black/50 text-white backdrop-blur-md transition shadow-md"
            title="Keyingi qism"
          >
            <ChevronDown className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Episodes Sheet Modal: Ekranning 40% ini egallaydi */}
      {showEpisodeSheet && (
        <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-[2px] flex flex-col justify-end">
          <div className="flex-1 w-full" onClick={() => setShowEpisodeSheet(false)} />
          <div className="relative bg-[#121216] border-t border-zinc-700/80 rounded-t-3xl p-4 h-[40%] flex flex-col animate-in slide-in-from-bottom duration-200 shadow-2xl overflow-hidden">
            <img
              src={currentDrama.posterUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-110 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#121216] via-[#121216]/80 to-[#121216]/40 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
              <div className="w-12 h-1 bg-zinc-700 rounded-full mx-auto mb-2 shrink-0 cursor-pointer" onClick={() => setShowEpisodeSheet(false)} />
              <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2 shrink-0">
                <div>
                  <h4 className="text-xs font-bold text-white">{currentDrama.title}</h4>
                  <p className="text-[10px] text-zinc-400">Jami: {episodes.length} ta epizod</p>
                </div>
                <button
                  onClick={() => setShowEpisodeSheet(false)}
                  className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-4 sm:grid-cols-5 gap-2 overflow-y-auto py-1 flex-1 custom-scrollbar">
                {episodes.map((ep, idx) => {
                  const isSelected = idx === episodeIndex;
                  const epAccessible = checkHasAccess(user, currentDrama, ep);
                  return (
                    <button
                      key={ep.id}
                      onClick={() => {
                        setEpisodeIndex(idx);
                        setShowEpisodeSheet(false);
                        setIsPlaying(true);
                        setTimeout(() => videoRef.current?.play().catch(() => {}), 100);
                      }}
                      className={`relative py-2.5 px-1.5 rounded-xl flex flex-col items-center justify-center font-bold text-[12px] border transition ${
                        isSelected
                          ? 'bg-red-500/20 border-red-500/50 text-white shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                          : 'bg-white/5 border-white/5 text-zinc-300 hover:bg-white/10'
                      }`}
                    >
                      <span>{ep.episodeNumber || idx + 1}</span>
                      {!ep.isFree && !epAccessible && (
                        <Lock className="w-2.5 h-2.5 text-white/40 absolute top-1.5 right-1.5" />
                      )}
                      {ep.isFree && (
                        <span className="text-[7px] font-black text-emerald-400 bg-emerald-400/10 px-1 py-0.5 rounded mt-1">BEPUL</span>
                      )}
                      {!ep.isFree && epAccessible && (
                        <span className="text-[7px] font-black text-amber-400 bg-amber-400/10 px-1 py-0.5 rounded mt-1">OCHIQ</span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Comments Drawer Modal */}
      {showComments && (
        <div className="absolute inset-0 z-30 bg-black/70 backdrop-blur-[2px] flex flex-col justify-end">
          <div className="flex-1 w-full" onClick={() => setShowComments(false)} />
          <div className="bg-[#121216] border-t border-zinc-700 rounded-t-3xl p-4 h-[40%] flex flex-col animate-in slide-in-from-bottom duration-200">
            <div className="flex items-center justify-between pb-2 border-b border-zinc-800 mb-2 shrink-0">
              <h4 className="text-xs font-bold text-white">Fikrlar ({comments.length})</h4>
              <button
                onClick={() => setShowComments(false)}
                className="p-1 rounded-lg bg-zinc-800 text-zinc-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 mb-2 pr-1 custom-scrollbar">
              {comments.map((c, i) => (
                <div key={i} className="p-2 rounded-xl bg-zinc-900 border border-zinc-800/80">
                  <div className="flex items-center gap-1.5 text-[11px] text-red-400 font-bold mb-0.5">
                    <span>Foydalanuvchi</span>
                  </div>
                  <p className="text-xs text-zinc-300">{c}</p>
                </div>
              ))}
            </div>

            <form onSubmit={handleAddComment} className="flex gap-2 shrink-0">
              <input
                type="text"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                placeholder="Fikr bildiring..."
                className="flex-1 bg-zinc-900 border border-zinc-700 rounded-xl px-3 py-2 text-xs text-white outline-none focus:border-red-500"
              />
              <button
                type="submit"
                className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white text-xs font-bold rounded-xl transition"
              >
                Yozish
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
