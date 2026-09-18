# 🎨 EPISODE UI DISPLAY - VISUAL EXAMPLES

## Admin Panel - Episode Management

### When Adding Episodes (Qism qo'shish):

```
┌─────────────────────────────────────────────────────────────┐
│  📺 KONTENT BOSHQARUVI                                      │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  Qismlar Boshqaruvi (Epizodlar)                            │
│  Har bir qism videosini yuklang...                          │
│                                                              │
│  [+ Qism qo'shish]                                          │
│                                                              │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                 │
│  │          │  │          │  │          │                  │
│  │  VIDEO   │  │  VIDEO   │  │  VIDEO   │                 │
│  │  PREVIEW │  │  PREVIEW │  │  PREVIEW │                 │
│  │          │  │          │  │          │                  │
│  │ 1-qism ✅│  │ 2-qism ✅│  │ 3-qism ✅│  ← Badge        │
│  └──────────┘  └──────────┘  └──────────┘                 │
│   1-qism       2-qism       3-qism       ← Title Input     │
│   [BEPUL]      [PULLIK]     [PULLIK]     ← Free/Paid       │
│   [📤] [🗑]    [📤] [🗑]    [📤] [🗑]    ← Upload/Delete  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Detailed Episode Card View:

### Episode 1 (First - Free by default):
```
┌─────────────────────┐
│                     │
│   [VIDEO PREVIEW]   │
│                     │
│  ╔═══════════════╗  │
│  ║   1-qism   ✅ ║  ← Episode number badge (bottom)
│  ╚═══════════════╝  │
│         ✅          │  ← Upload status (top right)
└─────────────────────┘
┌─────────────────────┐
│     1-qism          │  ← Title input (editable)
├─────────────────────┤
│     [BEPUL]         │  ← Free/Paid toggle (green)
├─────────────────────┤
│   [📤]    [🗑️]     │  ← Upload & Delete buttons
└─────────────────────┘
```

### Episode 2 (Paid):
```
┌─────────────────────┐
│                     │
│   [VIDEO PREVIEW]   │
│                     │
│  ╔═══════════════╗  │
│  ║   2-qism   ✅ ║  ← Episode number badge
│  ╚═══════════════╝  │
│         ✅          │  ← Upload status
└─────────────────────┘
┌─────────────────────┐
│     2-qism          │  ← Title input (editable)
├─────────────────────┤
│     [PULLIK]        │  ← Paid toggle (amber)
├─────────────────────┤
│   [📤]    [🗑️]     │
└─────────────────────┘
```

### Episode 3 (Paid):
```
┌─────────────────────┐
│                     │
│   [VIDEO PREVIEW]   │
│                     │
│  ╔═══════════════╗  │
│  ║   3-qism   ✅ ║  ← Episode number badge
│  ╚═══════════════╝  │
│         ✅          │  ← Upload status
└─────────────────────┘
┌─────────────────────┐
│     3-qism          │  ← Title input (editable)
├─────────────────────┤
│     [PULLIK]        │  ← Paid toggle
├─────────────────────┤
│   [📤]    [🗑️]     │
└─────────────────────┘
```

---

## Upload Status Indicators:

### Not Uploaded (Red X):
```
┌─────────────────────┐
│         ❌          │  ← Red X icon (not uploaded)
│                     │
│   [VIDEO PREVIEW]   │
│   (placeholder)     │
│                     │
│  ╔═══════════════╗  │
│  ║   1-qism      ║  │
│  ╚═══════════════╝  │
└─────────────────────┘
```

### Uploading (Loading):
```
┌─────────────────────┐
│         ⏳          │  ← Loading spinner
│                     │
│   [VIDEO PREVIEW]   │
│   Uploading 45%     │
│   [████████░░░░]    │  ← Progress bar
│                     │
│  ╔═══════════════╗  │
│  ║   1-qism      ║  │
│  ╚═══════════════╝  │
└─────────────────────┘
```

### Uploaded Successfully (Green Check):
```
┌─────────────────────┐
│         ✅          │  ← Green check (success)
│                     │
│   [VIDEO PREVIEW]   │
│   (actual poster)   │
│                     │
│  ╔═══════════════╗  │
│  ║   1-qism   ✅ ║  │
│  ╚═══════════════╝  │
└─────────────────────┘
```

---

## Episode Title Editing:

### Default State (Auto-generated):
```
┌─────────────────────────────┐
│  1-qism                     │  ← Auto-filled title
│  ────────────────────────   │  ← Input underline (hover)
└─────────────────────────────┘
```

### Focused State:
```
┌─────────────────────────────┐
│  1-qism|                    │  ← Cursor active
│  ══════════════════════════  │  ← Red underline (focus)
└─────────────────────────────┘
```

### Custom Title:
```
┌─────────────────────────────┐
│  Birinchi uchrashuv         │  ← Admin typed custom title
│  ────────────────────────   │
└─────────────────────────────┘
```

---

## Free/Paid Toggle Button:

### Free (Green):
```
┌─────────────────────┐
│                     │
│  ╔═════════════╗   │
│  ║   BEPUL     ║   │  ← Green background
│  ╚═════════════╝   │
│                     │
└─────────────────────┘
```

### Paid (Amber):
```
┌─────────────────────┐
│                     │
│  ╔═════════════╗   │
│  ║   PULLIK    ║   │  ← Amber background
│  ╚═════════════╝   │
│                     │
└─────────────────────┘
```

---

## Action Buttons:

### Upload Button:
```
┌──────┐
│  📤  │  ← Upload icon (file picker)
└──────┘
Hover: Gray → Lighter gray
Click: Opens file picker
```

### Delete Button:
```
┌──────┐
│  🗑️  │  ← Trash icon
└──────┘
Hover: Gray → Red tint
Click: Removes episode
```

---

## Full Admin Panel Episode Section:

```
╔════════════════════════════════════════════════════════════╗
║  📺 KONTENT TAHRIRLASH                                     ║
╠════════════════════════════════════════════════════════════╣
║                                                             ║
║  Film/Serial Nomi: [Sirli Voqealar                    ]   ║
║  Kategoriya: [Drama                                    ]   ║
║  Tavsif: [...                                          ]   ║
║                                                             ║
║  ┌──────────────────────────────────────────────────────┐ ║
║  │ QISMLAR BOSHQARUVI (EPIZODLAR)                      │ ║
║  │ Har bir qism videosini qurilmadan yuklang...        │ ║
║  │                                                       │ ║
║  │ [+ Qism qo'shish] ← Click to add                    │ ║
║  │                                                       │ ║
║  │ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐ │ ║
║  │ │       │ │       │ │       │ │       │ │       │ │ ║
║  │ │ VIDEO │ │ VIDEO │ │ VIDEO │ │ VIDEO │ │ VIDEO │ │ ║
║  │ │       │ │       │ │       │ │       │ │       │ │ ║
║  │ │1-qism✅│2-qism✅│3-qism✅│4-qism✅│5-qism✅│ │ ║
║  │ └───────┘ └───────┘ └───────┘ └───────┘ └───────┘ │ ║
║  │  1-qism   2-qism   3-qism   4-qism   5-qism       │ ║
║  │  [BEPUL]  [PULLIK] [PULLIK] [PULLIK] [PULLIK]     │ ║
║  │  [📤][🗑] [📤][🗑] [📤][🗑] [📤][🗑] [📤][🗑]     │ ║
║  └──────────────────────────────────────────────────────┘ ║
║                                                             ║
║  [Bekor qilish]                      [Saqlash]             ║
║                                                             ║
╚════════════════════════════════════════════════════════════╝
```

---

## User-Facing Display (VideoPlayerModal):

### Episode Selector Button:
```
┌─────────────────────────┐
│  📚  1-qism / 10        │  ← Shows current episode
└─────────────────────────┘
Click to open episode list
```

### Episode List Modal:
```
╔═══════════════════════════════════════╗
║  QISMLAR RO'YXATI                     ║
╠═══════════════════════════════════════╣
║                                        ║
║  ┌──────────────────────────────────┐ ║
║  │ ✅  1-qism        [BEPUL]   ▶   │ ║ ← Free, unlocked
║  └──────────────────────────────────┘ ║
║                                        ║
║  ┌──────────────────────────────────┐ ║
║  │ ✅  2-qism        [TOKEN]   ▶   │ ║ ← Unlocked with token
║  └──────────────────────────────────┘ ║
║                                        ║
║  ┌──────────────────────────────────┐ ║
║  │ 🔒  3-qism        [PULLIK]  🔒  │ ║ ← Locked (needs payment)
║  └──────────────────────────────────┘ ║
║                                        ║
║  ┌──────────────────────────────────┐ ║
║  │ 🔒  4-qism        [PULLIK]  🔒  │ ║
║  └──────────────────────────────────┘ ║
║                                        ║
║  ┌──────────────────────────────────┐ ║
║  │ 🔒  5-qism        [PULLIK]  🔒  │ ║
║  └──────────────────────────────────┘ ║
║                                        ║
╚═══════════════════════════════════════╝
```

---

## Color Coding:

| Element | Color | Meaning |
|---------|-------|---------|
| **Episode Badge** | Black bg, White text | Episode number |
| **✅ Green Check** | Emerald-500 | Successfully uploaded |
| **❌ Red X** | Red-500/50 | Not uploaded yet |
| **⏳ Loading** | Red-500 | Uploading in progress |
| **[BEPUL]** | Emerald-500/20 bg | Free episode |
| **[PULLIK]** | Amber-500/20 bg | Paid episode |
| **Upload Button** | Gray → Lighter on hover | Action button |
| **Delete Button** | Gray → Red tint on hover | Destructive action |

---

## Responsive Behavior:

### Desktop View (4 episodes per row):
```
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│1-qism│2-qism│3-qism│4-qism│
└─────┘ └─────┘ └─────┘ └─────┘
┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐
│5-qism│6-qism│7-qism│8-qism│
└─────┘ └─────┘ └─────┘ └─────┘
```

### Tablet View (3 episodes per row):
```
┌─────┐ ┌─────┐ ┌─────┐
│1-qism│2-qism│3-qism│
└─────┘ └─────┘ └─────┘
┌─────┐ ┌─────┐ ┌─────┐
│4-qism│5-qism│6-qism│
└─────┘ └─────┘ └─────┘
```

### Mobile View (2 episodes per row):
```
┌─────────┐ ┌─────────┐
│ 1-qism  │ │ 2-qism  │
└─────────┘ └─────────┘
┌─────────┐ ┌─────────┐
│ 3-qism  │ │ 4-qism  │
└─────────┘ └─────────┘
```

---

## Animation States:

### Upload Progress:
```
Frame 1:  [░░░░░░░░░░░░] 0%
Frame 2:  [██░░░░░░░░░░] 15%
Frame 3:  [████░░░░░░░░] 30%
Frame 4:  [██████░░░░░░] 45%
Frame 5:  [████████░░░░] 60%
Frame 6:  [██████████░░] 75%
Frame 7:  [████████████] 100% ✅
```

### Add Episode Animation:
```
1. Click [+ Qism qo'shish]
2. New card slides in from right
3. Fade in (0.3s ease-out)
4. Ready for video upload
```

### Delete Episode Animation:
```
1. Click [🗑️] button
2. Card shrinks and fades out
3. Other cards slide to fill gap
4. Duration: 0.2s ease-in
```

---

## 🎯 Summary

**Episode Display Format:**
- ✅ Badge: `"1-qism"`, `"2-qism"`, `"3-qism"`
- ✅ Title: `"1-qism"` (editable)
- ✅ Placeholder: `"1-qism"` (if empty)

**Visual Hierarchy:**
1. Upload status (top right) - Most important
2. Episode number badge (bottom center) - Identity
3. Title input (below card) - Editable name
4. Free/Paid toggle - Pricing
5. Action buttons - Upload/Delete

**Color System:**
- 🟢 Green = Free, Success, Unlocked
- 🟡 Amber = Paid
- 🔴 Red = Error, Delete, Locked
- ⚫ Gray = Neutral, Inactive

**Interaction Flow:**
1. Admin clicks "Qism qo'shish"
2. New card appears with "N-qism" badge
3. Admin uploads video file
4. Progress bar shows upload status
5. Green checkmark on success
6. Admin can edit title if needed
7. Toggle Free/Paid
8. Save content

**Result:** Clean, intuitive, fast episode management! ✅
