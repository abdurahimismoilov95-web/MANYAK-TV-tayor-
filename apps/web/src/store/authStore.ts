import { create } from 'zustand';
import { api } from '../lib/api';

interface User {
  id: string;
  telegramId: string;
  username?: string;
  firstName?: string;
  isVip: boolean;
  vipExpiresAt?: Date;
  isAdmin: boolean;
}

interface AuthState {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  initAuth: () => Promise<void>;
  logout: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isLoading: true,

  initAuth: async () => {
    try {
      const tg = window.Telegram?.WebApp;
      if (!tg?.initData) {
        set({ isLoading: false });
        return;
      }

      const response = await api.post('/auth/telegram', {
        initData: tg.initData,
      });

      const { token, user } = response.data;

      set({ user, token, isLoading: false });
      localStorage.setItem('token', token);
    } catch (error) {
      console.error('Auth failed:', error);
      set({ isLoading: false });
    }
  },

  logout: () => {
    set({ user: null, token: null });
    localStorage.removeItem('token');
  },
}));
