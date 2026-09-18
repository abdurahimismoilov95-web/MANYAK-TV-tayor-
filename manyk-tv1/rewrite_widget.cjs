const fs = require('fs');
let code = fs.readFileSync('src/components/DailyCheckInWidget.tsx', 'utf-8');

// 1. Add motion import
code = code.replace("import React, { useState } from 'react';", "import React, { useState } from 'react';\nimport { motion, AnimatePresence } from 'motion/react';");

// 2. Add isOpen state
code = code.replace(
  "const [showInfoModal, setShowInfoModal] = useState(false);",
  "const [showInfoModal, setShowInfoModal] = useState(false);\n  const [isOpen, setIsOpen] = useState(false);"
);

// 3. Wrap main return JSX
const returnStart = code.indexOf('return (\n    <div className="px-4">');
const modalStart = code.indexOf('{/* REWARD CELEBRATION MODAL */}');

if (returnStart > -1 && modalStart > -1) {
  let mainContent = code.substring(returnStart, modalStart);
  let restContent = code.substring(modalStart);
  
  // Replace the mainContent wrapper with our new FAB and Modal
  const newReturn = `return (
    <>
      {/* DRAGGABLE FAB */}
      {!isOpen && (
        <motion.div
          drag
          dragConstraints={{ left: -window.innerWidth + 80, right: 0, top: -window.innerHeight + 80, bottom: 0 }}
          dragElastic={0.1}
          dragMomentum={false}
          onClick={() => setIsOpen(true)}
          className="fixed right-4 bottom-24 z-[40] w-14 h-14 rounded-full bg-gradient-to-tr from-red-600 to-amber-600 shadow-xl shadow-red-600/40 flex items-center justify-center cursor-pointer border-2 border-zinc-900"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Gift className="w-6 h-6 text-white" />
          {!status.isClaimedToday && (
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-zinc-900 rounded-full animate-pulse" />
          )}
        </motion.div>
      )}

      {/* WIDGET MODAL OVERLAY */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto scrollbar-none rounded-3xl"
            >
              {/* Close Button */}
              <button 
                onClick={() => setIsOpen(false)}
                className="absolute top-2 right-2 z-10 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-zinc-300 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="w-full">
                <div id="daily-checkin-card" className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-zinc-900 via-zinc-900 to-[#121217] border border-zinc-800 shadow-2xl p-4 sm:p-5">
`;

  // We need to extract the inner content of the original card
  const innerStartMatch = mainContent.match(/<div\s+id="daily-checkin-card"[^>]*>/);
  if (innerStartMatch) {
    const innerStartIdx = innerStartMatch.index + innerStartMatch[0].length;
    let innerContent = mainContent.substring(innerStartIdx);
    
    // Remove the two closing divs at the end of innerContent
    innerContent = innerContent.replace(/<\/div>\s*<\/div>\s*$/m, "");
    
    const finalCode = code.substring(0, returnStart) + newReturn + innerContent + "\n                </div>\n              </div>\n            </motion.div>\n          </motion.div>\n        )}\n      </AnimatePresence>\n\n      " + restContent;
    
    // Replace the last closing div of the original return component with Fragment
    const updatedFinalCode = finalCode.replace(/<\/div>\s*\);\s*};\s*$/m, "    </>\n  );\n};");
    
    fs.writeFileSync('src/components/DailyCheckInWidget.tsx', updatedFinalCode);
    console.log("Successfully replaced.");
  } else {
    console.log("Could not find daily-checkin-card");
  }
} else {
  console.log("Could not find returnStart or modalStart");
}
