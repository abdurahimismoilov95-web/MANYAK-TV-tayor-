import React, { useState, useRef, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize2,
  RotateCcw,
  RotateCw,
  Lock,
  Sparkles,
  ListVideo,
  Layers,
  Ticket,
  ShoppingCart,
  ArrowLeft,
  ChevronUp,
  ChevronDown,
  Settings,
  Heart,
} from 'lucide-react';
import { ContentItem, Episode, UserProfile } from '../types';
import {
  checkHasAccess,
  addWatchHistoryItem,
  isFavorite,
  toggleFavorite,
  recordViewCount,
  spendTokenToUnlock,
  isUserSuperAdmin,
} from '../services/storage';
import { useNetworkQuality, VideoQuality } from '../hooks/useNetworkQuality';
import { initAntiPiracy } from '../utils/antiPiracy';
import { showAlert } from '../utils/customDialogs';

interface VideoPlayerModalProps {
  isOpen: boolean;
  content: ContentItem | null;
  initialEpisodeId?: string;
  user: UserProfile;
  onClose: () => void;
  onOpenPayment: (content: ContentItem, episode?: Episode) => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  isOpen,
  content,
  initialEpisodeId,
  user,
  onClose,
  onOpenPayment,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentEpisode, setCurrentEpisode] = useState<Episode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [showControls, setShowControls] = useState(true);
  const [controlsTimeout, setControlsTimeout] = useState<NodeJS.Timeout | null>(null);
  const [showEpisodeSheet, setShowEpisodeSheet] = useState(false);
  const [swipeNotice, setSwipeNotice] = useState<string | null>(null);
  const [selectedQuality, setSelectedQuality] = useState<'Auto' | VideoQuality>('Auto');
  // Token bilan qism ochilgandan keyin video elementi DOM'da paydo bo'lishini
  // kutib, so'ng avtomatik o'ynatish uchun belgi.
  const [autoPlayAfterUnlock, setAutoPlayAfterUnlock] = useState(false);
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [, setForceRender] = useState(false);
  const autoQuality = useNetworkQuality();

  const activeQuality = selectedQuality === 'Auto' ? autoQuality : selectedQuality;

  // React to network quality changes when set to Auto
  useEffect(() => {
    if (selectedQuality === 'Auto' && videoRef.current) {
      const currTime = videoRef.current.currentTime;
      const isVidPlaying = !videoRef.current.paused;
      
      // Simulate switching stream quality seamlessly
      videoRef.current.pause();
      
      // Add a small delay simulating manifest/buffer reloading
      const reloadDelay = setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.currentTime = currTime;
          if (isVidPlaying) videoRef.current.play().catch(() => {});
        }
      }, 300);
      
      return () => clearTimeout(reloadDelay);
    }
  }, [autoQuality, selectedQuality]);

  // Touch and mouse drag coordinates for swipe gesture
  const touchStartY = useRef<number | null>(null);
  const touchStartX = useRef<number | null>(null);
  const mouseStartY = useRef<number | null>(null);

  // Telegram WebApp Back Button integration
  useEffect(() => {
    if (!isOpen) return;
    const tg = (window as any).Telegram?.WebApp;
    // Faqat versiya 6.1 yoki undan yuqori bo'lsa BackButton dan foydalanamiz (Xatolikni oldini olish uchun)
    if (tg?.isVersionAtLeast?.('6.1') && tg?.BackButton) {
      tg.BackButton.show();
      const handleTgBack = () => {
        if (showEpisodeSheet) {
          setShowEpisodeSheet(false);
        } else {
          onClose();
        }
      };
      tg.BackButton.onClick(handleTgBack);
      return () => {
        tg.BackButton.offClick(handleTgBack);
        tg.BackButton.hide();
      };
    }
  }, [isOpen, showEpisodeSheet, onClose]);

  // Set episode or movie on open
  useEffect(() => {
    if (!content) return;

    if (content.episodes && content.episodes.length > 0) {
      const match = initialEpisodeId
        ? content.episodes.find((e) => e.id === initialEpisodeId)
        : content.episodes[0];
      setCurrentEpisode(match || content.episodes[0]);
    } else {
      setCurrentEpisode(null);
    }

    recordViewCount(content.id, initialEpisodeId);
  }, [content, initialEpisodeId]);

  // Video source
  const activeVideoUrl = currentEpisode?.videoUrl || content?.videoUrl || '';
  const hasAccess = content
    ? checkHasAccess(user, content, currentEpisode || undefined)
    : false;

  // Token bilan ochilgandan keyin: video elementi DOM'ga chiqishi bilan
  // avtomatik o'ynatamiz. `hasAccess` false bo'lganda `<video>` render
  // qilinmaydi, shuning uchun `onClick` ichida play() chaqirish ishlamaydi.
  useEffect(() => {
    if (!autoPlayAfterUnlock || !hasAccess) return;
    const el = videoRef.current;
    if (!el) return;
    el.play().catch(() => {
      // Brauzer avtomatik o'ynatishni bloklasa — foydalanuvchi o'zi bosadi
      setIsPlaying(false);
    });
    setAutoPlayAfterUnlock(false);
  }, [autoPlayAfterUnlock, hasAccess]);

  // Track history correctly without constantly resetting the interval
  const timeRef = useRef({ currentTime: 0, duration: 0 });
  
  useEffect(() => {
    timeRef.current = { currentTime, duration };
  }, [currentTime, duration]);

  useEffect(() => {
    if (!content) return;
    const interval = setInterval(() => {
      const { currentTime: t, duration: d } = timeRef.current;
      if (t > 0 && d > 0) {
        addWatchHistoryItem(user.id, {
          contentId: content.id,
          contentTitle: content.title,
          contentType: content.type,
          posterUrl: content.posterUrl,
          episodeId: currentEpisode?.id,
          episodeNumber: currentEpisode?.episodeNumber,
          progressSeconds: Math.floor(t),
          durationSeconds: Math.floor(d),
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [content, currentEpisode, user.id]);

  // ═══════════════════════════════════════════════════════════════════════════
  //  ANTI-PIRACY PROTECTION — Screen Recording & Screenshot Prevention
  // ═══════════════════════════════════════════════════════════════════════════
  useEffect(() => {
    const videoElement = videoRef.current;
    const container = containerRef.current;
    if (!videoElement || !hasAccess || !container) return;

    console.log('[Anti-Piracy] Initializing MAXIMUM protection...');
    
    // Initialize full anti-piracy protection
    const cleanup = initAntiPiracy(videoElement, {
      enableScreenRecordingDetection: true,
      enableScreenshotPrevention: true,
      enableWatermark: false, // Watermark o'chirildi - faqat ID watermark qoladi
      enableDevToolsBlock: true,
      enableMobileProtection: true, // iOS & Android
      watermarkText: 'MANYAK TV',
    });

    // ═══════════════════════════════════════════════════════════════════════
    // MOBILE SPECIFIC PROTECTION - MAXIMUM SECURITY
    // ═══════════════════════════════════════════════════════════════════════
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (isMobile) {
      console.log('[Anti-Piracy] 📱 MOBILE MODE - Enhanced protection');
      
      // 1. Prevent all context menu (long press screenshot)
      const preventContext = (e: Event) => {
        e.preventDefault();
        e.stopPropagation();
        return false;
      };
      
      container.addEventListener('contextmenu', preventContext, { capture: true });
      videoElement.addEventListener('contextmenu', preventContext, { capture: true });
      
      // 2. Detect screen recording via MediaRecorder API
      const detectMediaRecorder = () => {
        const origGetUserMedia = navigator.mediaDevices?.getUserMedia;
        if (origGetUserMedia) {
          navigator.mediaDevices.getUserMedia = function(...args) {
            console.warn('[Anti-Piracy] ⚠️ SCREEN RECORDING ATTEMPT DETECTED!');
            videoElement.pause();
            showAlert('Xatolik', '❌ Ekran yozib olish taqiqlangan!');
            return Promise.reject(new Error('Screen recording blocked'));
          };
        }
      };
      detectMediaRecorder();
      
      // 3. iOS Screen Recording Detection (visual indicator check)
      let screenRecordingCheckInterval: NodeJS.Timeout | null = null;
      if (/iPhone|iPad|iPod/i.test(navigator.userAgent)) {
        console.log('[Anti-Piracy] 🍎 iOS Screen Recording Detection Active');
        
        screenRecordingCheckInterval = setInterval(() => {
          // iOS shows red bar when recording - check window height change
          const heightChanged = window.innerHeight !== window.screen.height;
          if (heightChanged && isPlaying) {
            console.warn('[Anti-Piracy] ⚠️ iOS SCREEN RECORDING DETECTED!');
            videoElement.pause();
            setIsPlaying(false);
            showAlert('Xatolik', '❌ iOS qurilmasida ekran yozib olish taqiqlangan!');
          }
        }, 1000);
      }
      
      // 4. Android Screen Recording Detection (capture flag)
      if (/Android/i.test(navigator.userAgent)) {
        console.log('[Anti-Piracy] 🤖 Android Screen Capture Protection Active');
        
        // Set FLAG_SECURE equivalent (CSS based)
        container.style.setProperty('-webkit-user-select', 'none');
        container.style.setProperty('user-select', 'none');
        videoElement.style.setProperty('pointer-events', 'auto');
      }
      
      // 5. Detect visibility change (screen recording apps minimize)
      const handleVisibilityChange = () => {
        if (document.hidden) {
          console.log('[Anti-Piracy] 📱 App backgrounded - pausing for security');
          videoElement.pause();
          setIsPlaying(false);
        }
      };
      document.addEventListener('visibilitychange', handleVisibilityChange);
      
      // 6. Detect Page Visibility API abuse
      const handleBlur = () => {
        console.log('[Anti-Piracy] 📱 Window blur detected - security pause');
        videoElement.pause();
        setIsPlaying(false);
      };
      window.addEventListener('blur', handleBlur);
      
      // 7. Canvas poisoning for screenshot protection
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (ctx) {
        canvas.width = videoElement.videoWidth || 1920;
        canvas.height = videoElement.videoHeight || 1080;
        
        const renderLoop = setInterval(() => {
          if (videoElement.paused) return;
          ctx.drawImage(videoElement, 0, 0, canvas.width, canvas.height);
          // Add noise to prevent clean screenshots
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          for (let i = 0; i < imageData.data.length; i += 4) {
            if (Math.random() > 0.95) {
              imageData.data[i] = Math.random() * 255;
              imageData.data[i + 1] = Math.random() * 255;
              imageData.data[i + 2] = Math.random() * 255;
            }
          }
          ctx.putImageData(imageData, 0, 0);
        }, 100);
        
        return () => clearInterval(renderLoop);
      }
      
      // Cleanup mobile protections
      return () => {
        container.removeEventListener('contextmenu', preventContext, { capture: true });
        videoElement.removeEventListener('contextmenu', preventContext, { capture: true });
        document.removeEventListener('visibilitychange', handleVisibilityChange);
        window.removeEventListener('blur', handleBlur);
        if (screenRecordingCheckInterval) clearInterval(screenRecordingCheckInterval);
        cleanup();
      };
    }

    console.log('[Anti-Piracy] ✅ Protection active (Desktop + Mobile)');

    return () => {
      console.log('[Anti-Piracy] Cleanup');
      cleanup();
    };
  }, [hasAccess, content?.title, isPlaying]);

  if (!isOpen || !content) return null;

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (isPlaying) {
      videoRef.current.pause();
      setIsPlaying(false);
    } else {
      videoRef.current.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      setCurrentTime(videoRef.current.currentTime);
      setDuration(videoRef.current.duration || 0);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleToggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
      setIsMuted(!isMuted);
    }
  };

  const handleFullscreen = () => {
    if (!containerRef.current) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else {
      containerRef.current.requestFullscreen().catch(() => {});
    }
  };

  const handleSkip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(
        0,
        Math.min(duration, videoRef.current.currentTime + seconds)
      );
    }
  };

  const handleUserActivity = () => {
    setShowControls(true);
    if (controlsTimeout) clearTimeout(controlsTimeout);
    const t = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3500);
    setControlsTimeout(t);
  };

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const selectEpisode = (ep: Episode, autoPlay: boolean = true) => {
    setCurrentEpisode(ep);
    setCurrentTime(0);
    recordViewCount(content.id, ep.id);
    if (autoPlay) {
      setIsPlaying(true);
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.play().catch(() => {});
        }
      }, 150);
    } else {
      setIsPlaying(false);
    }
  };

  const isVerticalDrama =
    content.type === 'short_drama' ||
    content.catalogId === 'cat_mini_drama' ||
    content.genres.includes('Short Drama');

  const currentIndex = content.episodes && currentEpisode
    ? content.episodes.findIndex((e) => e.id === currentEpisode.id)
    : -1;

  const triggerNextEpisode = (hint?: string) => {
    if (content.episodes && currentIndex >= 0 && currentIndex < content.episodes.length - 1) {
      const nextEp = content.episodes[currentIndex + 1];
      selectEpisode(nextEp, true);
      setSwipeNotice(hint || `Keyingi ${nextEp.episodeNumber || currentIndex + 2}-qism ⏩`);
      setTimeout(() => setSwipeNotice(null), 1600);
    }
  };

  const triggerPrevEpisode = (hint?: string) => {
    if (content.episodes && currentIndex > 0) {
      const prevEp = content.episodes[currentIndex - 1];
      selectEpisode(prevEp, true);
      setSwipeNotice(hint || `Oldingi ${prevEp.episodeNumber || currentIndex}-qism ⏪`);
      setTimeout(() => setSwipeNotice(null), 1600);
    }
  };

  // Touch Swipe Handlers for mobile gesture navigation
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartX.current = e.touches[0].clientX;
    handleUserActivity();
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartY.current === null || touchStartX.current === null) return;
    const deltaY = touchStartY.current - e.changedTouches[0].clientY;
    const deltaX = touchStartX.current - e.changedTouches[0].clientX;
    touchStartY.current = null;
    touchStartX.current = null;

    const minDistance = 45;
    if (content.episodes && content.episodes.length > 1) {
      if (Math.abs(deltaY) > Math.abs(deltaX) && Math.abs(deltaY) > minDistance) {
        if (deltaY > 0) {
          // Yuqoriga surish -> Keyingi qism
          triggerNextEpisode('Keyingi qism ⏩');
        } else {
          // Pastga surish -> Oldingi qism
          triggerPrevEpisode('Oldingi qism ⏪');
        }
      } else if (Math.abs(deltaX) > minDistance) {
        if (deltaX > 0) {
          // Chapga surish -> Keyingi qism
          triggerNextEpisode('Keyingi qism ⏩');
        } else {
          // O'ngga surish -> Oldingi qism
          triggerPrevEpisode('Oldingi qism ⏪');
        }
      }
    }
  };

  // Mouse Drag Handlers for desktop preview
  const handleMouseDown = (e: React.MouseEvent) => {
    mouseStartY.current = e.clientY;
  };

  const handleMouseUp = (e: React.MouseEvent) => {
    if (mouseStartY.current === null) return;
    const deltaY = mouseStartY.current - e.clientY;
    mouseStartY.current = null;
    if (Math.abs(deltaY) > 50 && content.episodes && content.episodes.length > 1) {
      if (deltaY > 0) {
        triggerNextEpisode('Keyingi qism ⏩');
      } else {
        triggerPrevEpisode('Oldingi qism ⏪');
      }
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseMove={handleUserActivity}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onMouseDown={handleMouseDown}
      onMouseUp={handleMouseUp}
      onClick={() => setShowQualityMenu(false)}
      style={{
        WebkitUserSelect: 'none',
        userSelect: 'none',
        WebkitTouchCallout: 'none',
        touchAction: 'pan-y pinch-zoom',
      }}
      className="fixed inset-0 z-50 bg-black/95 backdrop-blur-xl flex items-center justify-center select-none overflow-hidden p-0 sm:p-4"
    >
      {/* Dynamic Container: 9:16 format for mini dramas, standard 16:9 for movies */}
      <div
        className={`relative w-full h-full overflow-hidden bg-black flex flex-col justify-between transition-all duration-300 ${
          isVerticalDrama
            ? 'sm:max-w-[420px] sm:h-[94vh] sm:aspect-[9/16] sm:rounded-3xl sm:border sm:border-zinc-800 shadow-2xl shadow-red-950/40'
            : 'max-w-6xl w-full h-full sm:h-auto sm:aspect-video sm:rounded-2xl sm:border sm:border-zinc-800 shadow-2xl'
        }`}
      >
        {/* Top Bar / Header with explicit Back Button */}
        <div
          className={`absolute top-0 left-0 right-0 z-30 p-3 sm:p-4 bg-gradient-to-b from-black/80 via-black/40 to-transparent flex items-center justify-between transition-opacity duration-300 ${
            showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
        >
          <div className="flex items-center gap-2 min-w-0 pr-2">
            {/* Pleyerdagi Orqaga qaytaruvchi aniq knopka */}
            <button
              id="btn-video-player-back"
              onClick={onClose}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-md shadow-lg transition flex-shrink-0 group active:scale-95"
              title="Orqaga qaytish"
            >
              <ArrowLeft className="w-3.5 h-3.5 text-zinc-300 group-hover:-translate-x-0.5 transition-transform" />
              <span className="text-[11px] font-bold">Orqaga</span>
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="text-xs font-bold text-white truncate drop-shadow-md">
                  {content.title}
                </h3>
              </div>
            </div>
          </div>

          {/* Qismlarni ochish tugmasi pleyerning ichida */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(user.id, content.id);
                setForceRender(prev => !prev);
              }}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-colors"
            >
              <Heart className={`w-4 h-4 ${isFavorite(user.id, content.id) ? 'fill-red-500 text-red-500' : 'text-zinc-300'}`} />
            </button>
          </div>
        </div>

        {/* Telegram ID suv belgisi - faqat oddiy foydalanuvchilar uchun */}
        {!isUserSuperAdmin(user.id) && (
          <div
            id="video-player-tg-watermark"
            className={`z-20 pointer-events-none select-none text-[11px] sm:text-xs font-mono font-bold text-white/50 drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] ${
              isVerticalDrama ? 'animate-roam-vertical' : 'animate-roam-wide'
            }`}
          >
            ID: {user.id}
          </div>
        )}

        {/* Swipe or Auto-next notice overlay pill */}
        {swipeNotice && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center justify-center gap-3 animate-in fade-in zoom-in-75 slide-in-from-bottom-2 duration-300 animate-out fade-out zoom-out-90 duration-200">
            <div className="w-14 h-14 rounded-full bg-black/60 backdrop-blur-xl border border-white/10 flex items-center justify-center shadow-[0_0_30px_rgba(220,38,38,0.3)] relative">
               <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-red-500 border-l-red-500 animate-[spin_0.8s_linear_infinite]" />
               {swipeNotice.includes('Oldingi') ? (
                 <RotateCcw className="w-6 h-6 text-white" />
               ) : (
                 <RotateCw className="w-6 h-6 text-white" />
               )}
            </div>
            <span className="bg-black/60 backdrop-blur-xl px-4 py-1.5 rounded-full text-white text-xs sm:text-sm font-bold shadow-lg border border-white/10 tracking-wide">
               {swipeNotice.replace(/⏪|⏩/g, '').trim()}
            </span>
          </div>
        )}

        {/* Main Video Area or Locked Overlay */}
        <div className="relative w-full h-full flex items-center justify-center bg-black overflow-hidden">
          {hasAccess ? (
            <>
              <video
                ref={videoRef}
                src={activeVideoUrl}
                onPlay={() => setIsPlaying(true)}
                onPause={() => setIsPlaying(false)}
                onTimeUpdate={handleTimeUpdate}
                onEnded={() => {
                  // Qism nihoyasiga yetsa avtomatik keyingi qismga o'tish
                  if (content.episodes && currentIndex >= 0 && currentIndex < content.episodes.length - 1) {
                    triggerNextEpisode('Avtomatik keyingi qism boshlandi ⏩');
                  } else {
                    setIsPlaying(false);
                  }
                }}
                onClick={handlePlayPause}
                playsInline
                autoPlay
                controlsList="nodownload nofullscreen noremoteplayback"
                disablePictureInPicture
                disableRemotePlayback
                style={{
                  WebkitUserSelect: 'none',
                  userSelect: 'none',
                  WebkitTouchCallout: 'none',
                  pointerEvents: 'auto',
                  contentVisibility: 'auto',
                }}
                className={`w-full h-full cursor-pointer ${
                  isVerticalDrama ? 'object-cover' : 'object-contain'
                }`}
              />

              {/* Big Center Play Button Overlay when paused */}
              {!isPlaying && (
                <div
                  onClick={handlePlayPause}
                  className="absolute inset-0 flex items-center justify-center cursor-pointer z-10 bg-black/35 backdrop-blur-[1px] group"
                >
                  <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center shadow-2xl shadow-red-600/50 transform group-hover:scale-110 transition">
                    <Play className="w-8 h-8 sm:w-10 sm:h-10 fill-white ml-1" />
                  </div>
                </div>
              )}

              {/* Vertical Mini Drama: Quick Swipe Up / Down Hint Controls */}
              {isVerticalDrama && content.episodes && content.episodes.length > 1 && (
                <div
                  className={`absolute right-3 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-2.5 transition-opacity duration-300 ${
                    showControls ? 'opacity-100' : 'opacity-30 hover:opacity-100'
                  }`}
                >
                  <button
                    onClick={() => triggerPrevEpisode()}
                    disabled={currentIndex <= 0}
                    className="p-2.5 rounded-full bg-black/80 hover:bg-zinc-800 disabled:opacity-20 text-white border border-zinc-700/60 backdrop-blur-md shadow-lg transition active:scale-95"
                    title="Oldingi qism (pastga suring)"
                  >
                    <ChevronUp className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => triggerNextEpisode()}
                    disabled={currentIndex >= content.episodes.length - 1}
                    className="p-2.5 rounded-full bg-red-600 hover:bg-red-500 disabled:opacity-20 text-white shadow-xl shadow-red-600/40 backdrop-blur-md transition active:scale-95"
                    title="Keyingi qism (yuqoriga suring)"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Locked Content Screen */
            <div className="relative w-full h-full flex flex-col items-center justify-center p-6 text-center bg-zinc-950">
              <img
                src={content.posterUrl}
                alt={content.title}
                className="absolute inset-0 w-full h-full object-cover opacity-20 blur-md"
              />
              <div className="relative z-10 max-w-sm p-6 rounded-2xl bg-zinc-900/95 border border-zinc-800 backdrop-blur-xl shadow-2xl">
                <div className="w-12 h-12 rounded-2xl bg-red-950/80 border border-red-800 flex items-center justify-center text-red-400 mx-auto mb-3">
                  <Lock className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-extrabold text-white mb-1">
                  Ushbu kontent himoyalangan!
                </h3>
                <p className="text-xs text-zinc-400 mb-4">
                  {content.isVipIncluded === false
                    ? `"${content.title}" VIP tarifiga kiritilmagan alohida premyera hisoblanadi. Tomosha qilish uchun filmni xarid qiling.`
                    : currentEpisode
                    ? `"${currentEpisode.title}" faqat VIP foydalanuvchilar yoki ushbu kontentni xarid qilganlar uchun ochiq.`
                    : `"${content.title}" ni ko'rish uchun VIP obuna oling yoki alohida xarid qiling.`}
                </p>

                {(() => {
                  const isVipPlanIncluded = content.isVipIncluded !== false;
                  const individualPrice = content.individualPrice || content.price || 15000;

                  return (
                    <div className="space-y-2.5">
                      {/* Token Unlock Option: Har 10 qismga 1 ta qism ochish (faqat 10+ qismli seriallar) */}
                      {user.accessTokens && user.accessTokens > 0 && 
                       content.episodes && content.episodes.length >= 10 && (
                        <button
                          type="button"
                          onClick={() => {
                            const totalEpisodes = content.episodes?.length || 0;
                            const maxUnlockable = Math.floor(totalEpisodes / 10);
                            const alreadyUnlocked = (user.unlockedEpisodeIds || []).filter(
                              k => k.startsWith(`${content.id}:`)
                            ).length;
                            
                            if (alreadyUnlocked >= maxUnlockable) {
                              showAlert(
                                'Limit to\'ldi',
                                `Bu serialda maksimal ${maxUnlockable} ta qism ochish mumkin. Siz allaqachon ${alreadyUnlocked} ta ochdingiz.`
                              );
                              return;
                            }
                            
                            // Token sarflash endi SERVER tomonida (async).
                            void spendTokenToUnlock(
                              user.id,
                              content.id,
                              content.title,
                              currentEpisode?.id,
                              currentEpisode?.title
                            ).then((res) => {
                              if (!res.success) {
                                showAlert('Xatolik', res.message);
                                return;
                              }
                              setIsPlaying(true);
                              setAutoPlayAfterUnlock(true);
                            });
                          }}
                          className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 font-extrabold text-xs text-zinc-950 shadow-lg shadow-amber-600/30 transition flex items-center justify-center gap-2"
                        >
                          <Ticket className="w-4 h-4 text-zinc-950" />
                          <span>
                            {(() => {
                              const totalEpisodes = content.episodes?.length || 0;
                              const maxUnlockable = Math.floor(totalEpisodes / 10);
                              const alreadyUnlocked = (user.unlockedEpisodeIds || []).filter(
                                k => k.startsWith(`${content.id}:`)
                              ).length;
                              return `1 Token (${alreadyUnlocked}/${maxUnlockable} ochilgan, ${user.accessTokens} ta bor)`;
                            })()}
                          </span>
                        </button>
                      )}

                      {!isVipPlanIncluded ? (
                        /* Movie is NOT part of a VIP plan: Display prominent 'Buy Now' button */
                        <div className="space-y-2">
                          <button
                            id="btn-buy-now-individual"
                            onClick={() => onOpenPayment(content, currentEpisode || undefined)}
                            className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-red-600 via-rose-600 to-amber-600 hover:from-red-500 hover:via-rose-500 hover:to-amber-500 font-black text-sm text-white shadow-xl shadow-red-600/40 transition flex items-center justify-center gap-2 group transform active:scale-98"
                          >
                            <ShoppingCart className="w-4 h-4 text-amber-300 group-hover:scale-110 transition" />
                            <span>Buy Now — {individualPrice.toLocaleString()} UZS</span>
                          </button>

                          <div className="p-2.5 rounded-xl bg-amber-950/40 border border-amber-800/40 text-[11px] text-amber-300 text-center leading-tight">
                            ⭐ Ushbu film VIP tarifiga kiritilmagan. Alohida premyera sifatida xarid qilinadi.
                          </div>
                        </div>
                      ) : (
                        /* Movie IS part of VIP plan */
                        <div className="space-y-2">
                          <button
                            id="btn-buy-vip-plan"
                            onClick={() => onOpenPayment(content, currentEpisode || undefined)}
                            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 font-bold text-xs text-white shadow-lg shadow-red-600/30 transition flex items-center justify-center gap-2"
                          >
                            <Sparkles className="w-4 h-4 text-amber-300" />
                            <span>VIP Obuna Olish (39,000 so'm)</span>
                          </button>

                          {(content.price > 0 || content.isSinglePurchase) && (
                            <button
                              id="btn-buy-now-alternative"
                              onClick={() => onOpenPayment(content, currentEpisode || undefined)}
                              className="w-full py-2.5 px-4 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-100 font-bold text-xs border border-zinc-700 transition flex items-center justify-center gap-2"
                            >
                              <ShoppingCart className="w-3.5 h-3.5 text-amber-400" />
                              <span>Buy Now — Alohida xarid ({individualPrice.toLocaleString()} UZS)</span>
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
          )}
        </div>

        {/* Bottom Controls Bar */}
        {hasAccess && (
          <div
            className={`absolute bottom-0 left-0 right-0 z-30 p-3 sm:p-4 bg-gradient-to-t from-black via-black/80 to-transparent transition-opacity duration-300 ${
              showControls ? 'opacity-100' : 'opacity-0 pointer-events-none'
            }`}
          >
            {/* Progress Bar Slider */}
            <div className="flex items-center gap-2 mb-2 sm:mb-3">
              <span className="text-[10px] font-mono text-zinc-300">
                {formatTime(currentTime)}
              </span>
              <input
                type="range"
                min={0}
                max={duration || 100}
                value={currentTime}
                onChange={handleSeek}
                className="flex-1 h-[3px] bg-zinc-800 accent-red-600 rounded-full cursor-pointer hover:h-[4px] transition-all"
              />
              <span className="text-[10px] font-mono text-zinc-300">
                {formatTime(duration)}
              </span>
            </div>

            {/* Controls row */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleSkip(-10)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-200 transition"
                  title="10 soniya orqaga"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handlePlayPause}
                  className="w-9 h-9 rounded-full bg-red-600/90 hover:bg-red-500 text-white flex items-center justify-center backdrop-blur-md shadow-md transition transform active:scale-95"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
                </button>

                <button
                  onClick={() => handleSkip(10)}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-200 transition"
                  title="10 soniya oldinga"
                >
                  <RotateCw className="w-3.5 h-3.5" />
                </button>

                <button
                  onClick={handleToggleMute}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-200 transition ml-1"
                >
                  {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                </button>
              </div>

              <div className="flex items-center gap-1.5 relative">
                {/* Quality Selector */}
                <div className="relative">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowQualityMenu(!showQualityMenu);
                    }}
                    className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-white/10 text-zinc-300 transition cursor-pointer font-bold text-[9px]"
                  >
                    <Settings className="w-3 h-3" />
                    <span>{selectedQuality === 'Auto' ? `Auto (${autoQuality})` : selectedQuality}</span>
                  </button>

                  {/* Quality Menu Dropdown */}
                  {showQualityMenu && (
                    <div className="absolute bottom-full right-0 mb-2 w-28 bg-zinc-900/95 backdrop-blur border border-zinc-800 rounded-lg shadow-xl overflow-hidden z-50 flex flex-col">
                      {['Auto', '1080p', '720p', '480p'].map((q) => (
                        <button
                          key={q}
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedQuality(q as any);
                            setShowQualityMenu(false);
                            // Simulating quality change by a brief loading/pause state handled by useEffect
                          }}
                          className={`text-left px-3 py-2 text-[10px] font-bold transition ${
                            selectedQuality === q ? 'text-red-400 bg-red-400/10' : 'text-zinc-300 hover:bg-zinc-800'
                          }`}
                        >
                          {q === 'Auto' ? 'Auto' : q}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Episodes button (re-added as requested, compact style) */}
                {content.episodes && content.episodes.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowEpisodeSheet(true);
                    }}
                    className="flex items-center gap-1 px-1.5 py-1 rounded hover:bg-white/10 text-zinc-300 transition cursor-pointer font-bold text-[9px]"
                    title="Qismlarni ochish"
                  >
                    <Layers className="w-3 h-3 text-red-400" />
                    <span>{currentEpisode?.episodeNumber || (currentIndex + 1)}/{content.episodes.length}</span>
                  </button>
                )}

                <span className="text-[9px] font-bold text-zinc-300 bg-white/10 backdrop-blur-sm px-1.5 py-0.5 rounded ml-1 hidden sm:block">
                  {content.quality}
                </span>

                <button
                  onClick={handleFullscreen}
                  className="p-1.5 rounded-full hover:bg-white/10 text-zinc-200 transition ml-1"
                  title="To'liq ekran"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* SHORT DRAMALAR VA SERIALARDA QISMLARNI TANLASH:
          Pastdan tepaga chiqib EKRANNING 40 FOIZINI EGALLAYDI! */}
      {showEpisodeSheet && content.episodes && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/40 backdrop-blur-[2px]">
          {/* Yuqori 60% bo'shliq: bosilganda drawer yopiladi */}
          <div
            className="flex-1 w-full"
            onClick={() => setShowEpisodeSheet(false)}
          />

          {/* Pastdan tepaga chiqib EKRANNING 40 FOIZINI egallovchi Drawer Sheet */}
          <div className="relative w-full sm:max-w-[480px] sm:mx-auto h-[40%] bg-zinc-950 border-t border-zinc-700/80 rounded-t-3xl p-3.5 sm:p-4 flex flex-col shadow-2xl animate-in slide-in-from-bottom duration-300 overflow-hidden">
            {/* Background image overlay */}
            <img
              src={content.posterUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-20 blur-xl scale-110 pointer-events-none"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/80 to-zinc-950/40 pointer-events-none" />

            <div className="relative z-10 flex flex-col h-full">
              {/* Tutqich (Drag handle) */}
              <div
                onClick={() => setShowEpisodeSheet(false)}
                className="w-12 h-1.5 bg-zinc-700 rounded-full mx-auto mb-2.5 shrink-0 cursor-pointer hover:bg-zinc-600 transition"
              />

              {/* Sarlavha va Orqaga/Yopish tugmasi */}
              <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800/80 shrink-0">
                <div className="flex items-center gap-2 text-white font-extrabold text-xs sm:text-sm">
                  <Layers className="w-4 h-4 text-red-500" />
                  <span>Qismlar ro'yxati ({content.episodes.length} ta)</span>
                </div>
                <button
                  onClick={() => setShowEpisodeSheet(false)}
                  className="p-1.5 rounded-full bg-white/5 hover:bg-white/10 text-zinc-400 hover:text-white transition"
                  title="Yopish"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Qismlar grid ko'rinishi - 4 ustunli vertikal kartochkalar */}
              <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
                <div className="grid grid-cols-4 gap-2">
                  {content.episodes.map((ep) => {
                    const isSelected = currentEpisode?.id === ep.id;
                    const epAccessible = checkHasAccess(user, content, ep);
                    return (
                      <button
                        key={ep.id}
                        type="button"
                        onClick={() => {
                          selectEpisode(ep, true);
                          setShowEpisodeSheet(false);
                        }}
                        className={`group relative rounded-lg border transition overflow-hidden flex flex-col ${
                          isSelected
                            ? 'bg-red-500/20 border-red-500/50 shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                            : 'bg-zinc-900 border-zinc-800 hover:border-red-500/30'
                        }`}
                      >
                        {/* Poster/Thumbnail - Full Size */}
                        <div className="relative w-full aspect-[2/3] bg-zinc-950 overflow-hidden rounded-lg">
                          {content.posterUrl ? (
                            <img
                              src={content.posterUrl}
                              alt={ep.title}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-zinc-800 to-zinc-900">
                              <ListVideo className="w-6 h-6 text-zinc-600" />
                            </div>
                          )}
                          
                          {/* Subtle overlay for readability */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />

                          {/* Episode number text - bottom center (background olib tashlandi) */}
                          <div className="absolute bottom-1 left-1 right-1 px-1.5 py-1 text-center">
                            <span className="text-white font-black text-[9px] block truncate drop-shadow-[0_1px_3px_rgba(0,0,0,0.8)]">
                              {ep.title || `${ep.episodeNumber}-qism`}
                            </span>
                          </div>

                          {/* Status badge - top right */}
                          <div className="absolute top-1.5 right-1.5">
                            {ep.isFree ? (
                              <span className="text-[8px] font-black text-emerald-400 bg-emerald-500/30 backdrop-blur-sm px-1.5 py-0.5 rounded border border-emerald-500/40 shadow-lg">
                                BEPUL
                              </span>
                            ) : epAccessible ? (
                              <span className="text-[8px] font-black text-amber-400 bg-amber-500/30 backdrop-blur-sm px-1.5 py-0.5 rounded border border-amber-500/40 shadow-lg">
                                OCHIQ
                              </span>
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-black/60 backdrop-blur-sm flex items-center justify-center shadow-lg">
                                <Lock className="w-3.5 h-3.5 text-white/70" />
                              </div>
                            )}
                          </div>

                          {/* Play icon overlay - selected episode */}
                          {isSelected && (
                            <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                              <div className="w-12 h-12 rounded-full bg-red-600/95 flex items-center justify-center animate-pulse shadow-2xl shadow-red-600/50">
                                <Play className="w-6 h-6 text-white fill-white ml-0.5" />
                              </div>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

