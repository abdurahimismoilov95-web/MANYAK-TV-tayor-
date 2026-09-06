const fs = require('fs');
let code = fs.readFileSync('src/components/VideoPlayerModal.tsx', 'utf-8');

// Replace the buggy useEffect for history
const bugStart = code.indexOf('  // Track history periodically\n  useEffect(() => {');
const bugEnd = code.indexOf('  }, [content, currentEpisode, currentTime, duration, user.id]);');

if (bugStart > -1 && bugEnd > -1) {
  const replacement = `  // Track history correctly without constantly resetting the interval
  const timeRef = useRef({ currentTime: 0, duration: 0 });
  
  useEffect(() => {
    timeRef.current = { currentTime, duration };
  }, [currentTime, duration]);

  useEffect(() => {
    if (!content) return;
    const interval = setInterval(() => {
      const { currentTime: t, duration: d } = timeRef.current;
      if (t > 0 && d > 0) {
        addWatchHistoryItem(user.id, {
          contentId: content.id,
          contentTitle: content.title,
          contentType: content.type,
          posterUrl: content.posterUrl,
          episodeId: currentEpisode?.id,
          episodeNumber: currentEpisode?.episodeNumber,
          progressSeconds: Math.floor(t),
          durationSeconds: Math.floor(d),
        });
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [content, currentEpisode, user.id]);`;
  
  code = code.substring(0, bugStart) + replacement + code.substring(bugEnd + '  }, [content, currentEpisode, currentTime, duration, user.id]);'.length);
  
  // also add useRef to imports if not there
  if (!code.includes('useRef')) {
    code = code.replace("import React, { useState, useEffect }", "import React, { useState, useEffect, useRef }");
    code = code.replace("import React, { useState, useEffect,", "import React, { useState, useEffect, useRef,");
  }
  
  fs.writeFileSync('src/components/VideoPlayerModal.tsx', code);
  console.log('Fixed VideoPlayerModal history tracking');
} else {
  console.log('Could not find history tracking useEffect');
}
