const fs = require('fs');
let code = fs.readFileSync('src/components/ContentInfoModal.tsx', 'utf-8');

if (!code.includes('toggleFavorite')) {
  // Add imports
  code = code.replace(
    "import { checkHasAccess, addWatchHistoryItem, } from '../services/storage';",
    "import { checkHasAccess, addWatchHistoryItem, isFavorite, toggleFavorite } from '../services/storage';"
  );
  if (!code.includes('isFavorite, toggleFavorite')) { // Fallback if import is different
      code = code.replace(
          "import { getStoredCurrentUser } from '../services/storage';",
          "import { getStoredCurrentUser, isFavorite, toggleFavorite } from '../services/storage';"
      );
  }

  code = code.replace(
    "import { X, Play, Info, CheckCircle2, Lock, Star, ChevronDown, ChevronUp } from 'lucide-react';",
    "import { X, Play, Info, CheckCircle2, Lock, Star, ChevronDown, ChevronUp, Heart } from 'lucide-react';"
  );
  
  const target = '<button onClick={onClose} className="p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-colors">';
  if (code.includes(target)) {
    const replacement = `
            <button 
              onClick={(e) => {
                e.stopPropagation();
                toggleFavorite(user.id, content.id);
                setForceRender(prev => !prev);
              }}
              className="p-2 mr-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-colors"
            >
              <Heart className={\`w-5 h-5 \${isFavorite(user.id, content.id) ? 'fill-red-500 text-red-500' : 'text-zinc-300'}\`} />
            </button>
            <button onClick={onClose} className="p-2 bg-black/50 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-colors">`;
    code = code.replace(target, replacement);
    
    // Add forceRender state
    code = code.replace(
      "const [selectedSeason, setSelectedSeason] = useState(1);",
      "const [selectedSeason, setSelectedSeason] = useState(1);\n  const [, setForceRender] = useState(false);"
    );
    
    fs.writeFileSync('src/components/ContentInfoModal.tsx', code);
    console.log('Added favorites button to ContentInfoModal');
  } else {
    console.log('Could not find target button area in ContentInfoModal');
  }
} else {
  console.log('Favorites already present in ContentInfoModal');
}
