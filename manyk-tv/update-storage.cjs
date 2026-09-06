const fs = require('fs');
let code = fs.readFileSync('src/services/storage.ts', 'utf-8');

if (!code.includes('manyak_tv_favorites_v1')) {
  code = code.replace(
    "HISTORY: 'manyak_tv_history_v1',",
    "HISTORY: 'manyak_tv_history_v1',\n  FAVORITES: 'manyak_tv_favorites_v1',"
  );

  const watchHistoryEnd = code.indexOf('// 7. AUDIT LOGS');
  
  if (watchHistoryEnd > -1) {
    const favoritesCode = `
// 6.5. FAVORITES
export interface FavoriteItem {
  contentId: string;
  addedAt: string;
}

export function getStoredFavorites(userId: string): FavoriteItem[] {
  const all = getItem<Record<string, FavoriteItem[]>>(KEYS.FAVORITES, {});
  return all[userId] || [];
}

export function isFavorite(userId: string, contentId: string): boolean {
  const userFavs = getStoredFavorites(userId);
  return userFavs.some(f => f.contentId === contentId);
}

export function toggleFavorite(userId: string, contentId: string): boolean {
  const all = getItem<Record<string, FavoriteItem[]>>(KEYS.FAVORITES, {});
  let userFavs = all[userId] || [];
  
  const existingIdx = userFavs.findIndex(f => f.contentId === contentId);
  let isAdded = false;
  
  if (existingIdx >= 0) {
    userFavs.splice(existingIdx, 1);
  } else {
    userFavs.unshift({ contentId, addedAt: new Date().toISOString() });
    isAdded = true;
  }
  
  all[userId] = userFavs;
  setItem(KEYS.FAVORITES, all);
  return isAdded;
}

`;
    code = code.substring(0, watchHistoryEnd) + favoritesCode + code.substring(watchHistoryEnd);
  }
  
  fs.writeFileSync('src/services/storage.ts', code);
  console.log('Added favorites logic to storage.ts');
} else {
  console.log('Favorites already present');
}
