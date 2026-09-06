import React from 'react';
import { Home, Compass, Film, History, User } from 'lucide-react';

export type NavTab = 'home' | 'shorts' | 'search' | 'history' | 'profile';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'home' as NavTab, label: 'Asosiy', icon: Home },
    { id: 'shorts' as NavTab, label: 'Shorts', icon: Film, badge: 'HOT' },
    { id: 'search' as NavTab, label: 'Qidirish', icon: Compass },
    { id: 'history' as NavTab, label: 'Tarix', icon: History },
    { id: 'profile' as NavTab, label: 'Profil', icon: User },
  ];

  return (
    <nav 
      className="fixed z-50 left-4 right-4 sm:left-1/2 sm:right-auto sm:-translate-x-1/2 sm:w-[380px] transition-all duration-300"
      style={{ bottom: 'calc(2rem + env(safe-area-inset-bottom))' }}
    >
      <div className="bg-[#121216]/60 backdrop-blur-2xl border border-white/10 rounded-full shadow-[0_8px_32px_rgba(0,0,0,0.5)] flex items-center justify-around px-1.5 py-1 sm:px-3 sm:py-1.5">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-1 px-2.5 transition-all ${
                isActive
                  ? 'text-red-500 font-bold'
                  : 'text-zinc-400 hover:text-zinc-200 font-medium'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'stroke-[2.5] scale-110' : 'stroke-[1.8]'}`} />
                {tab.badge && (
                  <span className="absolute -top-1.5 -right-3 text-[8px] font-black bg-red-600 text-white px-1 py-0.5 rounded-full ring-1 ring-black/50 animate-bounce">
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-3 h-0.5 bg-red-600 rounded-full mt-1 absolute -bottom-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
