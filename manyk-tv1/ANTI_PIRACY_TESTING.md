# 🧪 MANYK TV - Anti-Piracy Testing & Verification

**Date:** 2026-09-11  
**Status:** ✅ Ready for Testing

---

## ✅ QUICK VERIFICATION

### Step 1: Open Browser Console
```
1. Press F12 (Chrome/Edge/Firefox)
2. Go to Console tab
3. Keep it open while testing
```

### Step 2: Play Video
```
1. Login to MANYK TV
2. Open any video (VIP or unlocked content)
3. Video should start playing
```

### Step 3: Check Console Logs
```javascript
// You should see:
[Anti-Piracy] Initializing protection...
[Anti-Piracy] ✅ Protection active (Desktop + Mobile)

// On mobile:
[Mobile Protection] Detected: iOS
// or
[Mobile Protection] Detected: Android
```

---

## 🖥️ DESKTOP TESTS

### Test 1: Right-Click Block
**Action:** Right-click on video  
**Expected:** No context menu appears  
**Status:** ❓ (test and mark ✅ or ❌)

---

### Test 2: Screenshot Prevention (Windows)
**Action:** Press `Print Screen` while video plays  
**Expected:** Alert appears: "⚠️ Screenshot taqiqlangan!"  
**Status:** ❓

**Action:** Press `Win + Shift + S` (Snipping Tool)  
**Expected:** Alert appears or screenshot blocked  
**Status:** ❓

---

### Test 3: Screenshot Prevention (Mac)
**Action:** Press `Cmd + Shift + 4`  
**Expected:** Alert or screenshot blocked  
**Status:** ❓

**Action:** Press `Cmd + Shift + 5` (Screenshot toolbar)  
**Expected:** Alert shown  
**Status:** ❓

---

### Test 4: DevTools Detection
**Action:** Press F12 to open DevTools  
**Expected:**  
- Video pauses automatically  
- Console shows: `[Anti-Piracy] DevTools detected - pausing video`  
**Status:** ❓

---

### Test 5: Screen Recording Detection
**Action:** Start OBS Studio or Windows Game Bar recording  
**Expected:**  
- Detection alert shown  
- Or `MediaRecorder` override message  
**Status:** ❓

---

### Test 6: Download Button
**Action:** Look for download button in video controls  
**Expected:** No download button visible  
**Status:** ❓

---

### Test 7: Watermark Visibility
**Action:** Play video and look at center of screen  
**Expected:**  
- Faint watermark visible: `MANYK TV • {content title}`  
- Opacity ~8-15%, rotated -45deg  
- Should NOT be intrusive  
**Status:** ❓

---

### Test 8: Tab Visibility
**Action:** Switch to another browser tab while video plays  
**Expected:** Video pauses when tab is hidden  
**Status:** ❓

---

## 📱 MOBILE TESTS (iOS)

### Test 1: Screenshot (iPhone/iPad)
**Action:** Press `Power + Volume Up` during video  
**Expected:**  
- Alert shown: "⚠️ Screenshot iOS qurilmasida taqiqlangan!"  
- Or suspicious pause detected  
**Status:** ❓

---

### Test 2: Control Center Recording
**Action:**  
1. Swipe down Control Center  
2. Start screen recording  
3. Play video  
**Expected:**  
- Video pauses when Control Center opens  
- Or detection alert  
**Status:** ❓

---

### Test 3: Long-Press
**Action:** Long-press on video  
**Expected:** No callout menu (copy/save/share)  
**Status:** ❓

---

### Test 4: AirPlay
**Action:** Try to cast video to Apple TV  
**Expected:** AirPlay disabled/blocked  
**Status:** ❓

---

### Test 5: Mobile Watermark
**Action:** Check video center  
**Expected:**  
- Mobile watermark more prominent than desktop  
- Font size: 3rem  
- Opacity: 15%  
**Status:** ❓

---

## 📱 MOBILE TESTS (Android)

### Test 1: Screenshot
**Action:** Press `Power + Volume Down` during video  
**Expected:**  
- Alert: "⚠️ Screenshot Android qurilmasida taqiqlangan!"  
- Or detection message  
**Status:** ❓

---

### Test 2: Recording Apps Detection
**Action:**  
1. Install screen recorder (AZ Recorder, Mobizen, XRecorder)  
2. Start recording  
3. Play video  
**Expected:**  
- Alert: "⚠️ Ekran yozib olish dasturi aniqlandi!"  
- Video pauses  
**Status:** ❓

---

### Test 3: Recent Apps
**Action:** Open recent apps (multitasking) during video  
**Expected:** Video pauses  
**Status:** ❓

---

### Test 4: Long-Press
**Action:** Long-press on video  
**Expected:** No context menu  
**Status:** ❓

---

### Test 5: Mobile Watermark
**Action:** Check video display  
**Expected:** Enhanced mobile watermark visible  
**Status:** ❓

---

## 🔬 ADVANCED TESTS

### Test 1: Browser Extensions
**Action:** Try screen recording extensions (Loom, Screencastify)  
**Expected:** Detection or MediaRecorder override  
**Status:** ❓

---

### Test 2: Network Tab
**Action:**  
1. Open DevTools → Network tab  
2. Try to find video URL  
**Expected:**  
- Video pauses (DevTools detection)  
- URL not easily accessible  
**Status:** ❓

---

### Test 3: Console Manipulation
**Action:** Try `document.querySelector('video').src` in console  
**Expected:** DevTools detection pauses video  
**Status:** ❓

---

## 📊 TEST RESULTS SUMMARY

Fill this after testing:

```
┌─────────────────────────────────────────┐
│     ANTI-PIRACY TEST RESULTS            │
├─────────────────────────────────────────┤
│                                         │
│  Desktop Tests:            _ / 8 ✅     │
│    - Right-click:          ❓           │
│    - Screenshot:           ❓           │
│    - DevTools:             ❓           │
│    - Recording:            ❓           │
│    - Download:             ❓           │
│    - Watermark:            ❓           │
│    - Tab visibility:       ❓           │
│                                         │
│  iOS Tests:                _ / 5 ✅     │
│    - Screenshot:           ❓           │
│    - Recording:            ❓           │
│    - Long-press:           ❓           │
│    - AirPlay:              ❓           │
│    - Watermark:            ❓           │
│                                         │
│  Android Tests:            _ / 5 ✅     │
│    - Screenshot:           ❓           │
│    - Recording apps:       ❓           │
│    - Recent apps:          ❓           │
│    - Long-press:           ❓           │
│    - Watermark:            ❓           │
│                                         │
│  OVERALL:                  _ / 18 ✅    │
│  Pass Rate:                __ %         │
└─────────────────────────────────────────┘
```

---

## 🐛 TROUBLESHOOTING

### Problem: No console logs
**Solution:**  
- Rebuild: `npm run build`  
- Clear cache: Ctrl+Shift+R  
- Check antiPiracy.ts imported in VideoPlayerModal

---

### Problem: Alerts not showing
**Check:**
- Browser console for errors
- VideoPlayerModal.tsx has `initAntiPiracy` call
- `hasAccess = true` (protection only works on accessible content)

---

### Problem: Mobile detection not working
**Check:**
- Test on real device (not emulator)
- Check User-Agent in console
- Verify `enableMobileProtection: true`

---

### Problem: Watermark not visible
**Check:**
- Video is playing (not paused/locked)
- Check CSS opacity (should be 0.08-0.15)
- Inspect element for watermark div

---

## 📝 EXPECTED CONSOLE OUTPUT

### On Video Load:
```
[Anti-Piracy] Initializing protection...
[Anti-Piracy] ✅ Protection active (Desktop + Mobile)
```

### On Mobile:
```
[Mobile Protection] Detected: iOS
```

### On Screenshot Attempt:
```
[Anti-Piracy] Screenshot attempt detected!
⚠️ Screenshot taqiqlangan!
```

### On Recording Attempt:
```
[Anti-Piracy] Screen recording detected!
⚠️ Ekran yozib olish taqiqlangan!
```

### On DevTools Open:
```
[Anti-Piracy] DevTools detected - pausing video
```

---

## ✅ SUCCESS CRITERIA

Protection considered successful if:

- ✅ 80%+ desktop tests pass
- ✅ 70%+ mobile tests pass  
- ✅ Console logs appear correctly
- ✅ Watermark visible but not intrusive
- ✅ No false positives (normal viewing not affected)

---

## 🎯 NEXT STEPS

After testing:

1. **If all tests pass:** Deploy to production ✅
2. **If some fail:** Check implementation, debug, retest
3. **If mobile fails:** May need native app for 100% protection
4. **Document results:** Update this file with actual results

---

**Testing Checklist:** 18 tests total  
**Target Pass Rate:** 85%+  
**Ready for Production:** After verification

🧪🔬✅