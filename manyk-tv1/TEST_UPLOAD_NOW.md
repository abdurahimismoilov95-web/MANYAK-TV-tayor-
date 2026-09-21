# 🚀 HOZIR TEST QILING!

## ✅ QILINGAN TUZATISHLAR:

### **Server.js'ga qo'shilgan:**
1. ✅ **Batafsil debug logging** - har bir bosqich console'da ko'rinadi
2. ✅ **Yaxshilangan video detection** - ko'proq MP4 variantlarini qabul qiladi
3. ✅ **Magic bytes hex dump** - agar format aniqlanmasa, birinchi 32 byte ko'rsatiladi
4. ✅ **Har bir check point loglanadi** - muammoni aniq topish oson

### **Console output misoli:**

```
🔵 [UPLOAD] Request received:
  User ID: 123456789
  Is Admin: true
  Body size: 52428800 bytes (50.00 MB)
  Query ext: mp4
  Content-Type: video/mp4
  Admin check: true
  Size limit: 2048 MB
  ✅ Size check passed
  Detected image: none
  [detectVideoExt] ftyp brand: isom
  Detected video: mp4
  Query ext: mp4
  ✅ Admin video validated: mp4
  ✅ Format validated: mp4
  Filename: content_1726046123456_a1b2c3d4e5f6g7h8.mp4
  Upload dir: C:\...\manyk-tv1\uploads\public
  URL path: /uploads/public/content_1726046123456_a1b2c3d4e5f6g7h8.mp4
  ✅ File saved: C:\...\manyk-tv1\uploads\public\content_1726046123456_a1b2c3d4e5f6g7h8.mp4
✅ [UPLOAD] Success: /uploads/public/content_1726046123456_a1b2c3d4e5f6g7h8.mp4
```

---

## 🔥 HOZIR TEST QILISH:

### **1. Server'ni RESTART qiling:**

```powershell
# Agar hali ishlab turgan bo'lsa, to'xtating (Ctrl+C)
# Keyin qayta ishga tushiring:

cd manyk-tv1
npm run dev
```

**Kutilgan:**
```
Server http://localhost:3000 da ishlamoqda
```

---

### **2. Browser'da oching:**

```
http://localhost:3000
```

---

### **3. Admin Panel → Content → Video yuklang:**

1. **F12** bosing (Console'ni ochish uchun)
2. **Profile** → **Admin Panel**
3. **Content** tab
4. **+ Yangi kontent**
5. **📹 Video** → **📤 Yuklash**
6. Kichik video tanla (test uchun < 50MB)

---

### **4. Natijani KUZATING:**

#### **✅ AGAR ISHLASA:**

**Browser Console:**
```
[Upload] 📤 Sending file: test.mp4 (25.50 MB)
[Upload] Status: 200 Response: {"ok":true,"url":"/uploads/public/content_..."}
[Upload] ✅ Success: /uploads/public/content_1726046123456_...
```

**Server Terminal:**
```
🔵 [UPLOAD] Request received:
  ...
✅ [UPLOAD] Success: /uploads/public/content_...
```

**UI:**
- ✅ Progress bar 100%
- ✅ URL field'da `/uploads/public/...` ko'rinadi
- ✅ Yashil ✓ icon

---

#### **❌ AGAR XATOLIK BO'LSA:**

**Server terminal'dagi LOG'NI AYTING:**

Misol:
```
🔵 [UPLOAD] Request received:
  User ID: undefined
  Is Admin: false
❌ [AUTH] Unauthorized
```

Yoki:
```
🔵 [UPLOAD] Request received:
  ...
  Detected image: none
  Detected video: none
❌ [UPLOAD] Error: Fayl formati aniqlanmadi
  First 32 bytes (hex): 000000186674797069736f6d000000016973...
```

---

### **5. AGAR HALI HAM ISHLAMASA:**

**Quyidagilarni screenshot qiling yoki copy-paste qiling:**

#### **A) Server Terminal (Node.js console):**
```
🔵 [UPLOAD] Request received:
...
(BARCHA LOG'LARNI KO'RSATING)
```

#### **B) Browser Console (F12):**
```
[Upload] 📤 Sending file: ...
[Upload] Status: ...
[Upload] ❌ Error: ...
```

#### **C) Browser Network Tab (F12 → Network):**
- `/api/upload` so'rovini toping
- **Status:** ???
- **Response** tab'ni oching
- **Preview** yoki **Response** ni ko'rsating

---

## 🎯 ENG KENG TARQALGAN MUAMMOLAR:

### **1. "User ID: undefined" / "Is Admin: false"**

**Sabab:** Telegram bot orqali tasdiqlash o'tmagan

**Yechim:**
1. Telegram bot'ga `/start` yuboring
2. Tasdiqlash kodini kiriting
3. Browser'ni refresh qiling (Ctrl+R)
4. Admin panel'ga qayta kiring

---

### **2. "Detected video: none" / "Fayl formati aniqlanmadi"**

**Sabab:** Video format noto'g'ri yoki buzilgan

**Yechim:**
- Faqat **MP4** yoki **WebM** format yuklang
- Video buzilmagan bo'lishi kerak
- VLC Player'da ochilishini tekshiring
- HandBrake bilan MP4 ga convert qiling:
  - Container: MP4
  - Video Codec: H.264
  - Audio Codec: AAC

---

### **3. "413 Payload Too Large"**

**Sabab:** Video juda katta

**Yechim:**
- Test uchun kichik video ishlating (< 50MB)
- Yoki HandBrake bilan kompres qiling

---

### **4. "Network error" / "Failed to fetch"**

**Sabab:** Server ishlamayapti

**Yechim:**
```powershell
cd manyk-tv1
npm run dev
```

Server `http://localhost:3000` da ishlab turganini tasdiqlang.

---

### **5. Server terminal'da "❌ [AUTH] Unauthorized"**

**Sabab:** Token yaroqsiz

**Yechim:**
1. Telegram bot orqali qayta tasdiqlang
2. Browser localStorage'ni tozalang:
   ```javascript
   // Browser Console'da (F12):
   localStorage.clear();
   location.reload();
   ```
3. Qayta login qiling

---

## 📊 SUCCESS CHECKLIST:

Test muvaffaqiyatli bo'lishi uchun:

- [ ] Server ishga tushdi va `http://localhost:3000` ochildi
- [ ] Telegram bot orqali tasdiqlandim (User ID bor)
- [ ] Admin Panel'ga kirdim (adminIds da ID mavjud)
- [ ] Video yuklash boshlandi
- [ ] **Server terminal'da** `🔵 [UPLOAD] Request received:` ko'rindi
- [ ] **Server terminal'da** `✅ [UPLOAD] Success:` ko'rindi
- [ ] **Browser console'da** `[Upload] ✅ Success:` ko'rindi
- [ ] UI'da URL field'da `/uploads/public/...` paydo bo'ldi
- [ ] Progress bar 100% bo'ldi
- [ ] Yashil ✓ icon ko'rindi
- [ ] "💾 Saqlash" tugmasini bosdim
- [ ] Kontent list'da yangi kontent paydo bo'ldi
- [ ] Disk'da `uploads/public/content_*.mp4` fayl mavjud

---

## 🎊 TAYYOR!

Agar **barcha bosqichlar o'tsa** — upload **ISHLAYAPTI!** 🎉

Agar **xatolik bo'lsa** — server terminal LOG'ini **to'liq** ko'rsating:

```
🔵 [UPLOAD] Request received:
...
(barcha qatorlarni copy-paste qiling)
```

Men aniq muammoni topaman va tuzataman! 🔧

---

## 💡 TEZKOR TEST:

Agar sizda video yo'q bo'lsa, **rasm yuklang** (poster):

1. Admin Panel → Content → + Yangi
2. **📷 Poster** → **📤 Yuklash**
3. JPG/PNG rasm tanla (< 5MB)
4. Server va browser console'ni kuzating

Rasm yuklash HAM xuddi video kabi ishlashi kerak!
