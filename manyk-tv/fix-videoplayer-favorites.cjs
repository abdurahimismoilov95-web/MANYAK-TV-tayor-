const fs = require('fs');
let code = fs.readFileSync('src/components/VideoPlayerModal.tsx', 'utf-8');

if (!code.includes('isFavorite') && !code.includes('toggleFavorite')) {
  // Add imports
  code = code.replace(
    "import { checkHasAccess, addWatchHistoryItem, } from '../services/storage';",
    "import { checkHasAccess, addWatchHistoryItem, isFavorite, toggleFavorite } from '../services/storage';"
  );
  code = code.replace(
    "import { X, Play, Pause, Maximize, RotateCcw, Volume2, VolumeX, SkipBack, SkipForward, ArrowLeft, MoreVertical, List, AlertCircle, Eye, Settings, Share2, Unlock } from 'lucide-react';",
    "import { X, Play, Pause, Maximize, RotateCcw, Volume2, VolumeX, SkipBack, SkipForward, ArrowLeft, MoreVertical, List, AlertCircle, Eye, Settings, Share2, Unlock, Heart } from 'lucide-react';"
  );
  
  // Replace the action buttons under the title
  const target = '<button className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-white transition backdrop-blur-md">';
  if (code.includes(target)) {
    const replacement = `
                    <button 
                      onClick={() => {
                        toggleFavorite(user.id, content.id);
                        // Force a re-render of this component to reflect the favorite status
                        setForceRender(prev => !prev);
                      }}
                      className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-white transition backdrop-blur-md"
                    >
                      <Heart className={\`w-5 h-5 \${isFavorite(user.id, content.id) ? 'fill-red-500 text-red-500' : ''}\`} />
                    </button>
                    <button className="p-2.5 rounded-xl bg-zinc-900/80 hover:bg-zinc-800 text-white transition backdrop-blur-md">`;
    code = code.replace(target, replacement);
    
    // Add forceRender state
    code = code.replace(
      "const [showSettings, setShowSettings] = useState(false);",
      "const [showSettings, setShowSettings] = useState(false);\n  const [, setForceRender] = useState(false);"
    );
    
    fs.writeFileSync('src/components/VideoPlayerModal.tsx', code);
    console.log('Added favorites button to VideoPlayerModal');
  } else {
    console.log('Could not find target button');
  }
} else {
  console.log('Favorites already present in VideoPlayerModal');
}
