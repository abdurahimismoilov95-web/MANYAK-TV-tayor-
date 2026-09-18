const fs = require('fs');
let code = fs.readFileSync('src/views/HistoryView.tsx', 'utf-8');

// Replace imports
code = code.replace(
  "import { getStoredHistory, clearWatchHistory } from '../services/storage';",
  "import { getStoredHistory, clearWatchHistory, getStoredFavorites, toggleFavorite } from '../services/storage';\nimport { useState } from 'react';"
);
code = code.replace(
  "import { History, Play, Trash2, Clock, Film } from 'lucide-react';",
  "import { History, Play, Trash2, Clock, Film, Heart } from 'lucide-react';"
);

// Add state for active tab inside HistoryView
code = code.replace(
  "export const HistoryView: React.FC<HistoryViewProps> = ({",
  "export const HistoryView: React.FC<HistoryViewProps> = ({\n"
);
code = code.replace(
  "  const historyList = getStoredHistory(user.id);",
  "  const [activeTab, setActiveTab] = useState<'history' | 'favorites'>('history');\n  const historyList = getStoredHistory(user.id);\n  const favoritesList = getStoredFavorites(user.id);"
);

const headerStart = code.indexOf('{/* Header */}');
const headerEnd = code.indexOf('{/* History List */}');

if (headerStart > -1 && headerEnd > -1) {
  const newHeader = `{/* Tabs */}
      <div className="flex items-center gap-4 border-b border-zinc-800/80 pb-2">
        <button
          onClick={() => setActiveTab('history')}
          className={\`flex items-center gap-2 pb-2 border-b-2 transition-colors \${
            activeTab === 'history' ? 'border-red-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }\`}
        >
          <History className="w-5 h-5" />
          <h2 className="text-lg font-bold tracking-tight">Ko'rish Tarixi</h2>
          <span className="text-xs">({historyList.length})</span>
        </button>
        <button
          onClick={() => setActiveTab('favorites')}
          className={\`flex items-center gap-2 pb-2 border-b-2 transition-colors \${
            activeTab === 'favorites' ? 'border-red-500 text-white' : 'border-transparent text-zinc-400 hover:text-zinc-200'
          }\`}
        >
          <Heart className="w-5 h-5" />
          <h2 className="text-lg font-bold tracking-tight">Yoqtirganlarim</h2>
          <span className="text-xs">({favoritesList.length})</span>
        </button>
      </div>

      <div className="flex justify-end">
        {activeTab === 'history' && historyList.length > 0 && (
          <button
            onClick={handleClear}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-zinc-900 hover:bg-red-950/80 text-zinc-400 hover:text-red-400 text-xs font-semibold border border-zinc-800 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Tozalash</span>
          </button>
        )}
      </div>\n\n      `;
      
  code = code.substring(0, headerStart) + newHeader + code.substring(headerEnd);
}

const listStart = code.indexOf('{/* History List */}');
if (listStart > -1) {
  const replacementList = `{/* Content List */}
      {activeTab === 'history' ? (
        historyList.length === 0 ? (
          <div className="py-20 text-center">
            <Film className="w-14 h-14 text-zinc-700 mx-auto mb-3" />
            <h4 className="text-base font-bold text-zinc-300">Tarix bo'sh</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              Siz tomosha qilgan kino, serial va short dramalar shu sahifada saqlanib boriladi.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {historyList.map((entry) => {
              const progressPercent =
                entry.durationSeconds > 0
                  ? Math.min(
                      100,
                      Math.round((entry.progressSeconds / entry.durationSeconds) * 100)
                    )
                  : 0;
              return (
                <div
                  key={entry.id}
                  className="p-3 rounded-2xl bg-zinc-900/80 border border-zinc-800/80 hover:border-zinc-700 transition flex items-center justify-between gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1 cursor-pointer" onClick={() => handleResume(entry)}>
                    <div className="relative w-16 h-20 rounded-xl overflow-hidden bg-zinc-950 flex-shrink-0">
                      <img
                        src={entry.posterUrl}
                        alt={entry.contentTitle}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                      {/* Progress bar line */}
                      {progressPercent > 0 && (
                        <div className="absolute bottom-0 inset-x-0 h-1 bg-zinc-800">
                          <div
                            className="h-full bg-red-600"
                            style={{ width: \`\${progressPercent}%\` }}
                          />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-bold text-white truncate group-hover:text-red-400 transition">
                        {entry.contentTitle}
                      </h4>
                      {entry.episodeNumber && (
                        <div className="text-xs text-red-400 font-semibold mt-0.5">
                          {entry.episodeNumber}-qism
                        </div>
                      )}
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-zinc-400">
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatDate(entry.watchedAt)}</span>
                        </div>
                        {progressPercent > 0 && (
                          <span>• {progressPercent}% ko'rildi</span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleResume(entry)}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold shadow-md shadow-red-600/20 transition flex-shrink-0"
                  >
                    <Play className="w-3.5 h-3.5 fill-white" />
                    <span className="hidden xs:inline">Davom etish</span>
                  </button>
                </div>
              );
            })}
          </div>
        )
      ) : (
        favoritesList.length === 0 ? (
          <div className="py-20 text-center">
            <Heart className="w-14 h-14 text-zinc-700 mx-auto mb-3" />
            <h4 className="text-base font-bold text-zinc-300">Sevimli kontent yo'q</h4>
            <p className="text-xs text-zinc-500 mt-1 max-w-xs mx-auto">
              Siz hali hech qanday kino yoki serialni yoqtirganlar ro'yxatiga qo'shmadingiz.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {favoritesList.map((entry) => {
              const matchedContent = contents.find((c) => c.id === entry.contentId);
              if (!matchedContent) return null;
              return (
                <div
                  key={entry.contentId}
                  onClick={() => onSelectContent(matchedContent)}
                  className="group relative rounded-2xl overflow-hidden bg-zinc-900 cursor-pointer"
                >
                  <div className="aspect-[2/3] relative">
                    <img
                      src={matchedContent.posterUrl}
                      alt={matchedContent.title}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                    <div className="absolute top-2 right-2">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite(user.id, entry.contentId);
                          onRefresh();
                        }}
                        className="p-1.5 rounded-full bg-black/50 backdrop-blur-md text-red-500 hover:bg-red-500 hover:text-white transition"
                      >
                        <Heart className="w-4 h-4 fill-current" />
                      </button>
                    </div>
                  </div>
                  <div className="absolute bottom-0 inset-x-0 p-3">
                    <h3 className="text-sm font-bold text-white truncate drop-shadow-md">
                      {matchedContent.title}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="text-[10px] text-zinc-400">{matchedContent.year}</span>
                      <span className="text-[10px] text-zinc-400">•</span>
                      <span className="text-[10px] text-red-400 font-bold uppercase">
                        {matchedContent.type}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )
      )}
    </div>
  );
};
`;

  code = code.substring(0, listStart) + replacementList;
}

fs.writeFileSync('src/views/HistoryView.tsx', code);
console.log('Fixed HistoryView');
