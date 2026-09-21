import { create } from 'zustand';
import { api } from '../lib/api';

interface Content {
  id: string;
  title: string;
  description: string;
  type: 'MOVIE' | 'SERIES';
  thumbnailUrl?: string;
  videoUrl?: string;
  duration?: number;
  releaseYear?: number;
  rating?: number;
  isFree: boolean;
  isPremium: boolean;
}

interface ContentState {
  contents: Content[];
  featured: Content[];
  loading: boolean;
  fetchContents: () => Promise<void>;
  fetchFeatured: () => Promise<void>;
  searchContents: (query: string) => Promise<Content[]>;
}

export const useContentStore = create<ContentState>((set) => ({
  contents: [],
  featured: [],
  loading: false,

  fetchContents: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/content');
      set({ contents: response.data.contents, loading: false });
    } catch (error) {
      console.error('Fetch contents failed:', error);
      set({ loading: false });
    }
  },

  fetchFeatured: async () => {
    try {
      const response = await api.get('/content?featured=true&limit=5');
      set({ featured: response.data.contents });
    } catch (error) {
      console.error('Fetch featured failed:', error);
    }
  },

  searchContents: async (query: string) => {
    try {
      const response = await api.get(`/content/search?q=${query}`);
      return response.data.contents;
    } catch (error) {
      console.error('Search failed:', error);
      return [];
    }
  },
}));
