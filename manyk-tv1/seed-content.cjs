// Quick seed script to add demo content
const { Contents } = require('./database.js');

const demoContent = [
  {
    id: 'content_demo_1',
    title: 'Бесстрашный герой',
    description: 'Чемпион единоборств сталкивается с опасной преступной группировкой',
    type: 'movie',
    genres: JSON.stringify(['Боевик', 'Триллер']),
    releaseYear: 2024,
    duration: '1:54:00',
    rating: 8.2,
    posterUrl: 'https://via.placeholder.com/300x450/0ea5e9/white?text=Demo+Film+1',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
    cast: JSON.stringify(['Актёр 1', 'Актёр 2']),
    director: 'Режиссёр',
    isTrending: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'content_demo_2',
    title: 'Любовь и судьба',
    description: 'Романтическая история двух людей из разных миров',
    type: 'movie',
    genres: JSON.stringify(['Романтика', 'Драма']),
    releaseYear: 2024,
    duration: '2:10:00',
    rating: 7.8,
    posterUrl: 'https://via.placeholder.com/300x450/8b5cf6/white?text=Demo+Film+2',
    videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    trailerUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ElephantsDream.mp4',
    cast: JSON.stringify(['Актёр 3', 'Актёр 4']),
    director: 'Режиссёр 2',
    isFeaturedStore: 1,
    createdAt: new Date().toISOString(),
  },
  {
    id: 'content_demo_series_1',
    title: 'Возрождение героя',
    description: 'Эпическая история о силе, предательстве и мести',
    type: 'series',
    genres: JSON.stringify(['Фантастика', 'Приключения']),
    releaseYear: 2024,
    rating: 8.5,
    posterUrl: 'https://via.placeholder.com/300x450/10b981/white?text=Series+1',
    cast: JSON.stringify(['Актёр 5', 'Актёр 6']),
    director: 'Режиссёр 3',
    isTrending: 1,
    totalEpisodes: 24,
    episodes: JSON.stringify(Array.from({ length: 24 }, (_, i) => ({
      id: `ep_series1_${i + 1}`,
      episodeNumber: i + 1,
      title: `Эпизод ${i + 1}`,
      duration: '45:00',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerBlazes.mp4',
      thumbnailUrl: `https://via.placeholder.com/640x360/10b981/white?text=Episode+${i + 1}`,
    }))),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'content_demo_anime_1',
    title: 'Легенда о воине',
    description: 'Молодой воин отправляется в путешествие, чтобы спасти свой мир',
    type: 'anime_series',
    genres: JSON.stringify(['Anime', 'Фантастика', 'Боевик']),
    releaseYear: 2024,
    rating: 9.1,
    posterUrl: 'https://via.placeholder.com/300x450/f59e0b/white?text=Anime+1',
    cast: JSON.stringify([]),
    director: 'Studio A',
    isTrending: 1,
    totalEpisodes: 12,
    episodes: JSON.stringify(Array.from({ length: 12 }, (_, i) => ({
      id: `ep_anime1_${i + 1}`,
      episodeNumber: i + 1,
      title: `Серия ${i + 1}`,
      duration: '24:00',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerEscapes.mp4',
      thumbnailUrl: `https://via.placeholder.com/640x360/f59e0b/white?text=Anime+Ep+${i + 1}`,
    }))),
    createdAt: new Date().toISOString(),
  },
  {
    id: 'content_demo_short_1',
    title: 'Миллиардер и я',
    description: 'Короткая драма о неожиданной любви',
    type: 'short_drama',
    genres: JSON.stringify(['Романтика', 'Драма']),
    releaseYear: 2024,
    rating: 7.5,
    posterUrl: 'https://via.placeholder.com/300x450/ec4899/white?text=Short+Drama',
    cast: JSON.stringify([]),
    director: 'Режиссёр 4',
    totalEpisodes: 30,
    episodes: JSON.stringify(Array.from({ length: 30 }, (_, i) => ({
      id: `ep_short1_${i + 1}`,
      episodeNumber: i + 1,
      title: `Часть ${i + 1}`,
      duration: '3:00',
      videoUrl: 'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/ForBiggerFun.mp4',
      thumbnailUrl: `https://via.placeholder.com/270x480/ec4899/white?text=Part+${i + 1}`,
    }))),
    createdAt: new Date().toISOString(),
  },
];

console.log('[Seed] Adding demo content...');
demoContent.forEach((content) => {
  try {
    Contents.upsert(content);
    console.log(`[Seed] ✅ Added: ${content.title}`);
  } catch (err) {
    console.error(`[Seed] ❌ Error adding ${content.title}:`, err.message);
  }
});

console.log(`[Seed] ✅ Done! Total contents: ${Contents.count()}`);
