# 📤 ADMIN PANEL FILE UPLOAD TEST GUIDE

## 🎯 HOZIRGI HOLAT

✅ **Debug logging qo'shildi** - `src/services/storage.ts` → `uploadFileToServer()` funksiyasida  
✅ **Server endpoint tayyor** - `server.js` → `/api/upload` (line ~920)  
✅ **Uploads directory mavjud** - `uploads/public/` va `uploads/private/`  
✅ **AdminPanel tayyor** - Video va poster upload UI bor

---

## 🔧 TEST QILISH BOSQICHLARI

### **1. Server'ni Ishga Tushiring**

```powershell
cd manyk-tv1
npm run dev
```

**Kutilgan output:**
```
Server http://localhost:3000 da ishlamoqda
Database initialized: data/manyktv.db
```

---

### **2. Browser Console'ni Oching**

1. **Google Chrome** yoki **Edge** browserda saytni oching: `http://localhost:3000`
2. **F12** bosing (yoki **Right-click → Inspect**)
3. **Console** tabni tanlang

---

### **3. Admin Panel'ga Kiring**

1. **Profile** (pastdagi nav bar'da)
2. **Admin Panel** tugmasini bosing
3. **Agar admin emas bo'lsangiz:**
   - Telegram bot orqali tasdiqlash kerak
   - Bot'ga `/start` yuboring
   - Tasdiqlash kodini kiriting
   - **settings.adminIds** ga o'z Telegram ID'ngizni qo'shing (`src/data/initialData.ts`)

---

### **4. Kontent Qo'shish/Tahrirlash**

1. Admin Panel → **Content** tab
2. **+ Yangi kontent** tugmasini bosing
3. **Poster yoki Video yuklang:**

#### **A) POSTER YUKLASH:**
```
📷 Poster → "📤 Yuklash" tugmasi → Rasm tanla (JPG/PNG/WEBP)
```

#### **B) VIDEO YUKLASH:**
```
📹 Video → "📤 Yuklash" tugmasi → Video tanla (MP4/WebM)
```

---

### **5. Console Log'larni Kuzating**

#### **✅ MUVAFFAQIYATLI UPLOAD:**

```javascript
[Upload] 📤 Sending file: movie.mp4 (125.50 MB)
[Upload] Status: 200 Response: {"ok":true,"url":"/uploads/public/content_1726045820123.mp4"}
[Upload] ✅ Success: /uploads/public/content_1726045820123.mp4
```

**Natija:**
- ✅ File serverga yuklandi
- ✅ URL adminning input field'ida ko'rinadi
- ✅ "Saqlash" tugmasi bilan kontent saqlanadi

---

#### **❌ XATOLIK BO'LSA:**

##### **1) Fayl formati noto'g'ri:**
```javascript
[Upload] Status: 400 Response: {"ok":false,"error":"Fayl formati aniqlanmadi"}
```
**Yechim:**
- Faqat **MP4/WebM** (video) yoki **JPG/PNG/WEBP** (rasm) yuklang
- Fayl buzilmagan bo'lishi kerak

---

##### **2) Fayl juda katta:**
```javascript
[Upload] Status: 413 Response: {"ok":false,"error":"Fayl juda katta. Maksimal 2GB"}
```
**Yechim:**
- Admin uchun: 2GB dan kichik
- Oddiy user uchun: 8MB dan kichik
- Videoni kompres qiling (HandBrake yoki FFmpeg bilan)

---

##### **3) Authentication xatosi:**
```javascript
[Upload] Status: 401 Response: {"ok":false,"error":"Token yaroqsiz"}
```
**Yechim:**
- Telegram bot orqali qayta tasdiqlang
- Server'ni qayta ishga tushiring
- Browser'ni refresh qiling (Ctrl+R)

---

##### **4) Network xatosi:**
```javascript
[Upload] ❌ Network error
```
**Yechim:**
- Server ishlab turganini tekshiring (`npm run dev`)
- `http://localhost:3000` to'g'ri ochilganini tasdiqlang
- Firewall/antivirus tekshiring

---

##### **5) Server file write xatosi:**
```javascript
[Upload] Status: 500 Response: {"ok":false,"error":"Faylni saqlashda xatolik"}
```
**Yechim:**
- `uploads/public/` papka mavjudligini tekshiring
- Papka ruxsatlarini tekshiring (Windows: Full Control kerak)
- Disk bo'sh joy borligini tekshiring

---

### **6. Yuklangan Faylni Tekshiring**

#### **A) Disk'da:**
```powershell
cd manyk-tv1/uploads/public
ls
```

**Kutilgan:**
```
content_1726045820123.mp4
content_1726045830456.jpg
```

#### **B) Browser'da:**
```
http://localhost:3000/uploads/public/content_1726045820123.mp4
```

**Natija:**
- ✅ Video playerda ochilishi kerak
- ✅ Rasm ko'rinishi kerak

---

### **7. Kontent Saqlash**

1. Barcha ma'lumotlarni to'ldiring:
   - Title
   - Description
   - Year, Rating, etc.
2. **"💾 Saqlash"** tugmasini bosing
3. Console'da:

```javascript
[Content] ✅ Kontent saqlandi: Example Movie
```

4. **Content list'da yangi kontent** paydo bo'lishi kerak

---

## 🐛 TROUBLESHOOTING

### **Upload Progress 0% da qolib ketsa:**

```javascript
[Upload] 📤 Sending file: ... (fayl yuborildi)
// Lekin response kelmaydi — 30 sekund+ kutiladi
```

**Sabab:**
- Server timeout (katta fayl uchun)
- Serverda xotira yetarli emas

**Yechim:**
```javascript
// server.js da timeout'ni oshiring (line ~10):
app.use(express.raw({ 
  type: '*/*', 
  limit: '2gb',
  timeout: 600000  // 10 minut
}));
```

---

### **"Fayl formati aniqlanmadi" (magic bytes):**

Server `server.js` (line ~950) da fayl boshidagi byte'larni tekshiradi:

```javascript
const magicBytes = buffer.subarray(0, 12).toString('hex');
```

**Qo'llab-quvvatlanadigan formatlar:**
- **MP4:** `00 00 00 xx 66 74 79 70` (ftyp)
- **WebM:** `1a 45 df a3`
- **JPEG:** `ff d8 ff`
- **PNG:** `89 50 4e 47`
- **WEBP:** `52 49 46 46`

**Agar format yo'q bo'lsa:**
- Faylni konvert qiling
- Yoki server.js'ga yangi magic bytes qo'shing

---

### **401 (Unauthorized) — Token Muammosi:**

#### **1. Telegram bot orqali qayta tasdiqlang:**
```
/start → Kod kiriting → Tasdiqlangan!
```

#### **2. localStorage'ni tekshiring:**
```javascript
// Browser Console'da:
localStorage.getItem('manyak_tv_current_user_v1')
```

**Kutilgan:**
```json
{
  "id": "123456789",
  "isPhoneVerified": true,
  "telegramId": "123456789"
}
```

#### **3. Server admin list'ni tekshiring:**
```javascript
// src/data/initialData.ts → adminIds
export const INITIAL_SETTINGS: SystemSettings = {
  adminIds: ['123456789'],  // O'z Telegram ID'ngiz
  ...
}
```

---

## 📊 SUCCESS CRITERIA

Upload **muvaffaqiyatli** bo'lganda:

### **✅ Console:**
```
[Upload] 📤 Sending file: test.mp4 (50.00 MB)
[Upload] Status: 200 Response: {"ok":true,"url":"/uploads/public/content_..."}
[Upload] ✅ Success: /uploads/public/content_1726045820123.mp4
```

### **✅ UI:**
- ✅ Progress bar 100% ga yetdi
- ✅ Input field'da `/uploads/public/...` URL ko'rinadi
- ✅ ✓ (yashil galochka) icon ko'rinadi

### **✅ Disk:**
```powershell
ls uploads/public/
# content_1726045820123.mp4 mavjud
```

### **✅ Database (optional):**
```sql
sqlite3 data/manyktv.db
SELECT * FROM uploads ORDER BY created_at DESC LIMIT 5;
```

---

## 🚨 KENG TARQALGAN XATOLAR

| Xato | Sabab | Yechim |
|------|-------|--------|
| **401 Unauthorized** | Token yo'q/yaroqsiz | Telegram bot orqali qayta tasdiqlang |
| **400 Bad Request** | Fayl formati noto'g'ri | Faqat MP4/WebM/JPG/PNG/WEBP yuklang |
| **413 Payload Too Large** | Fayl juda katta | 2GB dan kichik fayl yuklang |
| **500 Internal Server Error** | Server xatosi (disk ruxsati, xotira) | Server log'larni tekshiring |
| **Network Error** | Server ishlamayapti | `npm run dev` ishga tushiring |
| **Progress 0% stuck** | Timeout | `server.js` da timeout oshiring |

---

## 📞 KEYINGI QADAMLAR

### **Agar hali ham ishlamasa:**

1. **Console'dagi ANIQ xato xabarini ko'rsating:**
   ```
   [Upload] ❌ Error: ...
   ```

2. **Server terminal'dagi log'larni tekshiring:**
   ```
   [Upload] File received: ...
   [Upload] Magic bytes: ...
   [Upload] Error: ...
   ```

3. **Network tab'ni tekshiring (F12 → Network):**
   - Request URL: `/api/upload?ext=mp4`
   - Request Method: POST
   - Status Code: ???
   - Response: ???

4. **Screenshot oling va yuborib bering!**

---

## ✅ TEST CHECKLIST

- [ ] Server ishga tushdi (`npm run dev`)
- [ ] Browser Console ochiq (F12)
- [ ] Admin Panel'ga kirdim
- [ ] Poster yuklash test qilindi
- [ ] Video yuklash test qilindi
- [ ] Console'da `[Upload]` log'lar ko'rinadi
- [ ] Yuklangan fayl disk'da mavjud
- [ ] Kontent saqlandi va list'da ko'rinadi
- [ ] Browser'da `/uploads/public/...` ochiladi

---

## 🎊 TAYYOR!

Agar barcha bosqichlar muvaffaqiyatli bo'lsa — **upload ishlayapti!** 🎉

Agar xatolik bo'lsa — console log'ini ko'rsating, yordam beraman! 🔧
