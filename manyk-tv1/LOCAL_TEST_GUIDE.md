# 🧪 MANYAK TV — Lokal Test Qo'llanmasi

## ✅ Serverlar Ishga Tushirildi!

### 🌐 Frontend (Vite Dev Server)
- **URL:** http://localhost:3000
- **Xolat:** ✅ Ishlamoqda
- **Terminal:** `npm run dev`

### 🔧 Backend (Express + SQLite)
- **URL:** http://localhost:3001
- **Xolat:** ✅ Ishlamoqda
- **Database:** `data/manyktv.db`
- **Terminal:** `npm run server`

---

## 🔍 Test Qilish Bosqichlari

### 1. Brauzerni Ochish

**Google Chrome yoki Microsoft Edge'ni oching va quyidagi manzilga kiring:**

```
http://localhost:3000
```

---

### 2. Asosiy Funksiyalarni Tekshirish

#### ✅ Bosh Sahifa (HomeView)
- [ ] **Yangi kinolar filtri** ko'rinadi (oxirgi 30 kun)
- [ ] **VIP banner** ko'rinadi (foydalanuvchi VIP bo'lmasa)
- [ ] **Katalog filtrlari** ishlaydi (Barchasi, Yangi kinolar, Kino, Serial, Anime)
- [ ] **Premyera seriallar** bo'limi ko'rinadi
- [ ] **Kontent kartlari** to'g'ri ko'rinadi

#### ✅ Admin Panel (AdminPanel)
**DIQQAT:** Admin panelni ochish uchun Telegram autentifikatsiyasi kerak. Lokal testda bu ishlamaydi, lekin UI elementlarini ko'rish mumkin:

1. Browser DevTools ochish: `F12`
2. Console'da quyidagi kodni yozing:
   ```javascript
   // Test uchun fake user yaratish
   const testUser = {
     id: "123456789",
     firstName: "Test",
     lastName: "Admin",
     isVip: false,
     isPhoneVerified: true,
     purchasedContentIds: [],
     favorites: [],
     createdAt: new Date().toISOString()
   };
   localStorage.setItem('manyak_tv_current_user_v1', JSON.stringify(testUser));
   location.reload();
   ```

3. Sahifa yangilanganidan keyin foydalanuvchi sifatida tizimga kirilgan bo'ladi

#### ✅ Broadcast Funksiyasi Tekshiruvi
1. Admin panelga kiring (yuqoridagi usul bilan)
2. **"Bot Xabarnoma (Broadcast)"** tabini oching
3. Quyidagi elementlar borligini tekshiring:
   - [ ] Kino tanlash dropdown
   - [ ] Xabar matni textarea
   - [ ] "Barcha obunachilarga jo'natish!" tugmasi
   - [ ] Preview (ko'rinish) bo'limi

**Preview'da:**
   - [ ] Tanlangan kinoning poster rasmi ko'rinadi
   - [ ] Xabar matni ko'rinadi
   - [ ] "🎬 Tomosha qilish" tugmasi ko'rinadi

---

### 3. Yangi Funksiyalarni Tekshirish

#### 🎬 Video Thumbnail Avtomatik Yuklash
**Test:**
1. Admin Panel → Broadcast
2. Kino tanlash dropdown'dan biror kino tanla
3. **Natija:** Preview'da poster avtomatik ko'rinishi kerak

**Tekshirish:**
- [ ] Poster rasmi to'g'ri ko'rinadi
- [ ] URL `/uploads/` yoki `https://` bilan boshlanadi
- [ ] Rasm yuklangan holda ko'rinadi (404 xatosi yo'q)

---

#### 🔘 Knopkalarni Ixchamlashtirish
**Test:**
1. Admin Panel → Foydalanuvchilar
2. Foydalanuvchilar ro'yxatini ko'ring

**Tekshirish:**
- [ ] VIP berish tugmalari (+7K, +30K, +1Y) bir qatorda
- [ ] Icon-only tugmalar (HWID reset, ban/unban) ixcham
- [ ] Har bir foydalanuvchi kartasi toza va tushunarli

---

#### ✨ Yangi Kinolar Filtri
**Test:**
1. Bosh sahifaga kiring
2. Katalog filtrlari bo'limida "Yangi kinolar" tugmasini bosing

**Tekshirish:**
- [ ] "Yangi kinolar" filtri ko'rinadi
- [ ] Yangi kinolar soni badge'da ko'rsatiladi (masalan: "5")
- [ ] Faqat oxirgi 30 kun qo'shilgan kinolar ko'rinadi
- [ ] Kinolar sana bo'yicha tartiblangan (eng yangilari birinchi)

---

#### 📱 Web App Link Formatini Tekshirish
**Test:**
1. Admin Panel → Broadcast
2. Kino tanlab, xabar yozing
3. Preview'ni ko'ring

**Tekshirish:**
- [ ] "🎬 Tomosha qilish" tugmasi ko'rinadi
- [ ] Tugma bosilganda yangi tab ochilishi kerak
- [ ] URL formati: `http://localhost:3000/?openContent=<content_id>`

**DIQQAT:** Lokal testda bu oddiy link bo'ladi. Production'da esa Telegram Mini App sifatida ochiladi (`web_app: { url }`).

---

#### 👑 VIP Banner va Mini-Drama Bo'limi
**Test:**
1. Bosh sahifaga kiring (VIP bo'lmagan foydalanuvchi sifatida)

**Tekshirish:**
- [ ] VIP promotion banner ko'rinadi
- [ ] Banner gradient effekt bilan chiroyli
- [ ] Banner bosilganda payment modal ochiladi
- [ ] "Premyera Seriallar — Alohida Xarid" bo'limi ko'rinadi
- [ ] Serial kartlari ichida:
  - [ ] Poster rasmi
  - [ ] Serial nomi
  - [ ] Narxi (masalan: "15,000 UZS")
  - [ ] "Sotib Olish" yoki "Tomosha qilish" tugmasi

---

### 4. Console Xatolarini Tekshirish

Browser DevTools Console'ni ochib, quyidagi xatolar YO'QLIGINI tekshiring:

```
F12 → Console tab
```

**Kutilgan xatolar (normal):**
- ⚠️ `SSE ulanish yo'q` — Lokal testda SSE (Server-Sent Events) ishlamaydi, bu normal
- ⚠️ `Token yo'q — real-time kanal o'chirilgan` — Telegram autentifikatsiyasi yo'q

**Xavfli xatolar (bo'lmasligi kerak):**
- ❌ `Failed to fetch` — Server ishlamayapti
- ❌ `404 Not Found` — Fayl topilmadi
- ❌ `500 Internal Server Error` — Server xatosi
- ❌ `Uncaught TypeError` — JavaScript xatosi

---

### 5. Network Trafikni Tekshirish

Browser DevTools Network tab'ini ochib, quyidagi so'rovlar to'g'ri ishlashini tekshiring:

```
F12 → Network tab
```

**Kutilgan so'rovlar:**
- ✅ `GET /api/contents` — Kontent ro'yxati
- ✅ `GET /api/settings` — Tizim sozlamalari
- ✅ `GET /api/plans` — Tarif rejalari
- ✅ `POST /api/auth/verify` — Autentifikatsiya (Telegram orqali)

**Har bir so'rov uchun:**
- [ ] Status Code: `200 OK` yoki `401 Unauthorized` (token yo'q bo'lsa)
- [ ] Response: JSON formatida ma'lumot

---

## 🐛 Muammolarni Hal Qilish

### Muammo 1: Sahifa Ochilmaydi
**Sabab:** Frontend server ishlamayapti
**Yechim:**
```bash
# Terminal 1
npm run dev
```

### Muammo 2: API So'rovlar Ishlamaydi
**Sabab:** Backend server ishlamayapti
**Yechim:**
```bash
# Terminal 2
npm run server
```

### Muammo 3: "Network Error" Xatosi
**Sabab:** Frontend backend'ga ulanolmayapti
**Yechim:**
1. Backend server ishlab turganligini tekshiring: http://localhost:3001/api/health
2. CORS sozlamalari to'g'ri ekanligini tekshiring (`server.js`)

### Muammo 4: Rasmlar Ko'rinmaydi
**Sabab:** `/uploads/` papkasi bo'sh yoki mavjud emas
**Yechim:**
```bash
# Uploads papkasini yaratish
mkdir c:\Users\SOIL1007\Documents\GIT\MANYAK-TV-tayor-\manyk-tv\uploads
```

### Muammo 5: Admin Panel Ochilmaydi
**Sabab:** Telegram autentifikatsiyasi kerak
**Yechim:**
Yuqoridagi "Admin Panel" bo'limidagi test kodini ishlating (localStorage'ga fake user qo'shish)

---

## 🎯 Test Natijalari

Test tugagach, quyidagi checklistni to'ldiring:

### Asosiy Funksiyalar
- [ ] Bosh sahifa to'g'ri ko'rinadi
- [ ] Katalog filtrlari ishlaydi
- [ ] Kontent kartlari clickable
- [ ] VIP banner ko'rinadi

### Yangi Funksiyalar
- [ ] Video thumbnail avtomatik yuklash ✅
- [ ] Knopkalar ixcham ✅
- [ ] Yangi kinolar filtri ✅
- [ ] Web App link format ✅
- [ ] VIP banner va mini-drama ✅

### Performance
- [ ] Sahifa tez yuklanadi (<3 sekund)
- [ ] API so'rovlar tez javob beradi (<1 sekund)
- [ ] Console'da fatal xatolar yo'q

---

## 📊 Keyingi Qadamlar

Test muvaffaqiyatli bo'lgandan keyin:

1. **Production Build:**
   ```bash
   npm run build
   ```

2. **Production Deploy:**
   - Railway, Render, yoki boshqa platformaga
   - `.env` faylida production sozlamalarini kiriting
   - Telegram webhook sozlang

3. **Telegram Bot Sozlash:**
   - `.env` fayliga `TELEGRAM_BOT_TOKEN` kiriting
   - `APP_URL` ni production URL'ga o'zgartiring
   - Admin Panel → Bot & Havolalar → "Qayta ulanish"

---

## 🆘 Yordam

Muammo yuzaga kelsa:

1. Console xatolarini o'qing (`F12 → Console`)
2. Network trafikni tekshiring (`F12 → Network`)
3. Server loglarini ko'ring (Terminal output)
4. `NOTIFICATION_IMPROVEMENTS.md` faylini o'qing

---

**Omad! 🚀**
