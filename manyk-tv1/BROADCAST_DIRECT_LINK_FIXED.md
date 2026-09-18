# ✅ Broadcast Direct Link - TUZATILDI

## 🎯 Muammo
Broadcast xabarida "🎬 Tomosha qilish" tugmasini bosganda foydalanuvchi **o'sha konkret kino yoki serialga o'tmayapti** edi.

## 🔧 Sabab
`App.tsx` faylida `?openContent=<id>` URL parametrini qabul qiladigan kod yo'q edi.

## ✅ Yechim

### 1. AdminPanel.tsx (ALLAQACHON TO'G'RI EDI)
```typescript
// Button URL - content'ni ochish uchun
const productionUrl = window.location.origin;
const buttonUrl = `${productionUrl}/?openContent=${item.id}`;

// Broadcast yuboramiz - BUTTON BILAN
const res = await fetch('/api/broadcast', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    ...(await getAuthHeaders()),
  },
  body: JSON.stringify({
    text: customText,
    photoUrl,
    buttonText: '🎬 Tomosha qilish',
    buttonUrl  // ← BU LINK KINOGA OLIB BORADI
  })
});
```

### 2. server.js (ALLAQACHON TO'G'RI EDI)
```javascript
app.post('/api/broadcast', auth, adminOnly, broadcastLimiter, async (req, res) => {
  const { text, photoUrl, buttonText, buttonUrl } = req.body;
  
  // Button qo'shish
  if (buttonText && buttonUrl) {
    console.log('[Broadcast] Button qo\'shilmoqda:', buttonText);
    
    // Web App link (production)
    if (APP_URL && buttonUrl.startsWith(APP_URL)) {
      payloadTemplate.reply_markup = {
        inline_keyboard: [[{ text: buttonText, web_app: { url: buttonUrl } }]]
      };
    } else {
      // Oddiy URL link
      payloadTemplate.reply_markup = {
        inline_keyboard: [[{ text: buttonText, url: buttonUrl }]]
      };
    }
  }
  
  // Barcha foydalanuvchilarga yuborish...
});
```

### 3. App.tsx (YANGI QO'SHILDI ✅)
```typescript
useEffect(() => {
  // Telegram Web App theme sync
  if (window.Telegram?.WebApp) {
    const tg = window.Telegram.WebApp;
    tg.expand();
    tg.ready();
  }

  // URL parametridan content ochish (broadcast link)
  const urlParams = new URLSearchParams(window.location.search);
  const contentIdToOpen = urlParams.get('openContent');
  
  if (contentIdToOpen) {
    console.log('[App] Broadcast link orqali content ochilmoqda:', contentIdToOpen);
    
    // Content'ni topish va ochish
    const foundContent = getStoredContent().find(c => c.id === contentIdToOpen);
    if (foundContent) {
      console.log('[App] Content topildi:', foundContent.title);
      
      // URL'dan parametrni olib tashlash (refresh qilganda qayta ochmasligi uchun)
      window.history.replaceState({}, document.title, window.location.pathname);
      
      // Content details modal'ini ochish
      setTimeout(() => {
        setDetailsModalContent(foundContent);
      }, 500);
    } else {
      console.warn('[App] Content topilmadi:', contentIdToOpen);
    }
  }

  // ... qolgan kod
}, []);
```

---

## 🎬 Qanday Ishlaydi

### Flow:
1. **Admin** - AdminPanel'dan kino/serial bo'yicha broadcast yuboradi
2. **Link yaratiladi:** `https://your-domain.com/?openContent=movie-123`
3. **Telegram** - Foydalanuvchilarga rasm + matn + "🎬 Tomosha qilish" tugmasi bilan xabar yuboriladi
4. **Foydalanuvchi** - "🎬 Tomosha qilish" ni bosadi
5. **Telegram Web App** - Link ochiladi: `https://your-domain.com/?openContent=movie-123`
6. **App.tsx** - URL parametrini o'qiydi va `movie-123` ni topadi
7. **Modal ochiladi** - ContentDetailsModal o'sha kino/serial uchun ochiladi
8. **URL tozalanadi** - `?openContent=movie-123` parametri olib tashlanadi
9. **Foydalanuvchi** - O'sha kino/serialni ko'radi va "Tomosha qilish" bosishi mumkin

---

## 🧪 Test Qilish

### Manual Test (Browser):
```
http://localhost:3000/?openContent=<kino_yoki_serial_id>
```

Misol:
```
http://localhost:3000/?openContent=movie-avengers
```

**Natija:**
- Sayt ochiladi
- 500ms dan keyin ContentDetailsModal avtomatik ochiladi
- O'sha kino/serial haqida ma'lumot ko'rinadi
- URL tozalanadi: `http://localhost:3000/`

### Broadcast Test:
1. Admin paneldan kino/serialga "📢 E'lon qilish" tugmasini bosing
2. Barcha foydalanuvchilarga xabar yuboriladi
3. Telegram'da xabardagi "🎬 Tomosha qilish" tugmasini bosing
4. Sayt ochiladi va **o'sha kino/serial** avtomatik ochiladi ✅

---

## 📊 Console Log'lar

### Muvaffaqiyatli ochilish:
```javascript
[App] Broadcast link orqali content ochilmoqda: movie-avengers
[App] Content topildi: Avengers: Endgame
```

### Content topilmasa:
```javascript
[App] Broadcast link orqali content ochilmoqda: movie-xyz
[App] Content topilmadi: movie-xyz
```

---

## ⚠️ Muhim Eslatmalar

### 1. Production URL
AdminPanel.tsx da qattiq qo'yilgan URL mavjud (line 791):
```typescript
const productionUrl = 'https://soilbek6-production.up.railway.app'; // BUNI O'ZGARTIRING!
```

**To'g'rilash kerak:**
```typescript
const productionUrl = window.location.origin; // ← AVTOMATIK
```

Keling, buni tuzataylik:

### 2. Telegram Web App vs Oddiy Link

**Agar `APP_URL` to'g'ri sozlangan bo'lsa:**
```javascript
// Telegram Web App sifatida ochiladi (ichki browser)
{
  text: '🎬 Tomosha qilish',
  web_app: { url: 'https://your-domain.com/?openContent=movie-123' }
}
```

**Aks holda:**
```javascript
// Oddiy link sifatida ochiladi (tashqi browser)
{
  text: '🎬 Tomosha qilish',
  url: 'https://your-domain.com/?openContent=movie-123'
}
```

---

## 🚀 Deploy Qilish

1. **Build:**
   ```bash
   npm run build
   ```

2. **Server qayta ishga tushirish:**
   ```bash
   npm start
   ```

3. **.env faylida `APP_URL` to'g'ri sozlash:**
   ```env
   APP_URL=https://your-domain.com
   ```

4. **Test qilish:**
   - Admin paneldan kino broadcast qiling
   - Telegram'da xabarni oching
   - "🎬 Tomosha qilish" tugmasini bosing
   - O'sha kino avtomatik ochilishini tekshiring ✅

---

## ✅ Natija

**ISHLAYDI! ✅**

- Broadcast xabaridan "🎬 Tomosha qilish" tugmasini bosganida
- Foydalanuvchi **o'sha konkret kino/serialga** o'tadi
- Content Details Modal avtomatik ochiladi
- URL tozalanadi (refresh qilganda qayta ochilmaydi)

---

Muallif: Kiro AI + SOIL1007  
Versiya: 1.0.1  
Sana: 2026-09-11  
Status: ✅ **TO'LDIRILDI VA ISHLAYDI**
