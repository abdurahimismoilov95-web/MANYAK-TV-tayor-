# 💧 MANYK TV - Watermark Configuration

**Date:** 2026-09-11  
**Status:** ✅ Configured

---

## 🎯 CURRENT WATERMARK

```
┌────────────────────────────────┐
│                                │
│       MANYK TV                 │
│     (Static Text)              │
│                                │
└────────────────────────────────┘
```

---

## ⚙️ CONFIGURATION

### Current Settings:
```typescript
// VideoPlayerModal.tsx
watermarkText: 'MANYK TV'
```

### Display Properties:
- **Text:** `MANYK TV`
- **Opacity:** 8-15% (desktop), 15% (mobile)
- **Position:** Center-floating (animated)
- **Rotation:** -45 degrees
- **Font:** Monospace, Bold
- **Color:** White with shadow
- **Animation:** Roaming across screen

---

## 📱 PLATFORM DIFFERENCES

### Desktop:
```css
opacity: 0.08;
font-size: 2rem;
text-shadow: 0 1px 3px rgba(0,0,0,0.8);
```

### Mobile:
```css
opacity: 0.15;
font-size: 3rem;
text-shadow: 2px 2px 8px rgba(0,0,0,0.8);
```

Mobile watermark is MORE PROMINENT (better visibility in recordings)

---

## 🎨 VISUAL EXAMPLES

### Before Change:
```
MANYK TV • The Dark Knight
(Content name included - too long)
```

### After Change:
```
MANYK TV
(Short, clean, recognizable)
```

---

## ✅ BENEFITS

1. **Shorter Text** → Less intrusive for viewers
2. **Static Text** → Consistent branding
3. **More Subtle** → Better user experience
4. **Still Effective** → Platform identification remains
5. **Mobile Friendly** → Fits better on small screens

---

## 🔧 HOW TO CHANGE

### To Change Watermark Text:

**File:** `src/components/VideoPlayerModal.tsx`  
**Line:** ~195

```typescript
// Current:
watermarkText: 'MANYK TV'

// To change to your brand:
watermarkText: 'YOUR BRAND NAME'

// To add ID:
watermarkText: `MANYK TV • ${user.id}`

// To add content name again:
watermarkText: `MANYK TV • ${content.title}`
```

After change: `npm run build`

---

## 📊 EFFECTIVENESS

### Piracy Deterrent:
- Platform identification: ✅ YES
- Content traceability: ❌ NO (no content name)
- User identification: ✅ YES (User ID in separate watermark)
- Brand recognition: ✅ YES

### User Experience:
- Intrusiveness: ⭐⭐ (Low)
- Readability: ⭐⭐⭐⭐⭐ (Excellent)
- Mobile friendly: ⭐⭐⭐⭐⭐ (Excellent)

---

## 💡 RECOMMENDATIONS

### Current Setup (MANYK TV only):
✅ **Best for:** User experience priority  
✅ **Pros:** Clean, subtle, professional  
❌ **Cons:** Can't identify which content was pirated

### Alternative (MANYK TV + Content):
✅ **Best for:** Maximum piracy deterrent  
✅ **Pros:** Full traceability  
❌ **Cons:** Longer text, more intrusive

### Alternative (MANYK TV + User ID):
✅ **Best for:** User accountability  
✅ **Pros:** Can trace pirate by ID  
❌ **Cons:** Privacy concerns

---

## 🎯 CURRENT CONFIGURATION DETAILS

```typescript
// VideoPlayerModal.tsx (line ~190)
useEffect(() => {
  const videoElement = videoRef.current;
  if (!videoElement || !hasAccess) return;

  const cleanup = initAntiPiracy(videoElement, {
    enableScreenRecordingDetection: true,
    enableScreenshotPrevention: true,
    enableWatermark: true,
    enableDevToolsBlock: true,
    enableMobileProtection: true,
    watermarkText: 'MANYK TV', // ← CHANGED HERE
  });

  return cleanup;
}, [hasAccess, content?.title]);
```

---

## 📸 WATERMARK IN RECORDINGS

If pirated video is recorded, watermark will show:

```
┌─────────────────────────────────┐
│                                 │
│          MANYK TV               │
│     (Visible in recording)      │
│                                 │
│     ID: 123456789               │
│   (User ID watermark)           │
│                                 │
└─────────────────────────────────┘
```

Platform name + User ID = Full traceability ✅

---

## 🔄 UPDATE HISTORY

### 2026-09-11:
- **Before:** `MANYK TV • {content.title}`
- **After:** `MANYK TV`
- **Reason:** User experience improvement, shorter text

---

**CURRENT WATERMARK: `MANYK TV` (Static)** ✅  
**User ID Watermark: `ID: {user.id}` (Separate)** ✅

🎉 Clean, professional, effective!
