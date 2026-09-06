import React from 'react';
import { Play } from 'lucide-react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-[100] bg-[#070709] flex flex-col items-center justify-center overflow-hidden selection:bg-transparent">
      {/* Background glow effects */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-red-600/10 blur-[80px] rounded-full pointer-events-none animate-pulse duration-1000" />
      
      <div className="relative flex flex-col items-center animate-in fade-in zoom-in-95 duration-700">
        {/* Animated Logo Box */}
        <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-br from-red-500 to-red-800 flex items-center justify-center shadow-[0_0_50px_rgba(220,38,38,0.3)] mb-6 animate-bounce" style={{ animationDuration: '2s' }}>
          <div className="absolute inset-0 bg-red-600/20 rounded-3xl animate-ping opacity-75" style={{ animationDuration: '2s' }} />
          <Play className="w-12 h-12 text-white ml-2 relative z-10 drop-shadow-lg" fill="currentColor" />
        </div>

        {/* Text */}
        <h1 className="text-4xl font-black text-white tracking-tighter flex items-center gap-1.5 drop-shadow-md">
          MANYK <span className="text-red-500">TV</span>
        </h1>
        <p className="text-zinc-500 text-xs mt-2 tracking-widest font-mono uppercase">Premium Entertainment</p>

        {/* Loading Dots */}
        <div className="mt-10 flex gap-1.5">
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '0ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '150ms' }} />
          <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  );
};
