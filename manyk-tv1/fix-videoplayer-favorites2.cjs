const fs = require('fs');
let code = fs.readFileSync('src/components/VideoPlayerModal.tsx', 'utf-8');

if (!code.includes('toggleFavorite')) {
  // Add imports
  code = code.replace(
    "import { checkHasAccess, addWatchHistoryItem } from '../services/storage';",
    "import { checkHasAccess, addWatchHistoryItem, isFavorite, toggleFavorite } from '../services/storage';"
  );
  code = code.replace(
    "import { X, Play, Pause, Maximize, RotateCcw, Volume2, VolumeX, SkipBack, SkipForward, ArrowLeft, RotateCw } from 'lucide-react';",
    "import { X, Play, Pause, Maximize, RotateCcw, Volume2, VolumeX, SkipBack, SkipForward, ArrowLeft, RotateCw, Heart } from 'lucide-react';"
  );
  
  const target = '<div className="flex items-center gap-2 flex-shrink-0">';
  if (code.includes(target)) {
    const replacement = `<div className="flex items-center gap-2 flex-shrink-0">
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(user.id, content.id);
                setForceRender(prev => !prev);
              }}
              className="p-1.5 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-md transition-colors"
            >
              <Heart className={\`w-4 h-4 \${isFavorite(user.id, content.id) ? 'fill-red-500 text-red-500' : 'text-zinc-300'}\`} />
            </button>`;
    code = code.replace(target, replacement);
    
    // Add forceRender state
    code = code.replace(
      "const [showEpisodes, setShowEpisodes] = useState(false);",
      "const [showEpisodes, setShowEpisodes] = useState(false);\n  const [, setForceRender] = useState(false);"
    );
    
    fs.writeFileSync('src/components/VideoPlayerModal.tsx', code);
    console.log('Added favorites button to VideoPlayerModal');
  } else {
    console.log('Could not find target button area');
  }
} else {
  console.log('Favorites already present in VideoPlayerModal');
}
