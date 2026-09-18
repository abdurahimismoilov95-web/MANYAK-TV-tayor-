# 🌐 Telegram Web App Tugmasi - Test Yo'riqnomasi

## ✅ Amalga Oshirildi

Telegram ichida web app ochilganida Header.tsx da **"🌐 Saytni ochish"** tugmasi avtomatik ko'rinadi.

---

## 🔧 Qanday Ishlaydi

### 1. Telegram Web App SDK
`index.html` faylida SDK qo'shilgan:
```html
<script src="https://telegram.org/js/telegram-web-app.js"></script>
```

### 2. Header.tsx Komponenti
```typescript
// Telegram Web App aniqlash
useEffect(() => {
  if (typeof window !== 'undefined' && window.Telegram?.WebApp) {
    console.log('[Header] Telegram Web App aniqlandi!');
    setIsTelegramWebApp(true);
    
    // Telegram Web App ni tayyorlash
    window.Telegram.WebApp.ready();
    window.Telegram.WebApp.expand();
  } else {
    console.log('[Header] Oddiy brauzer rejimi');
    setIsTelegramWebApp(false);
  }
}, []);
```

### 3. Tugma Shartli Ko'rinadi
```typescript
{isTelegramWebApp && (
  <button
    onClick={() => {
      const appUrl = window.location.origin;
      console.log('[Header] Brauzerda ochish:', appUrl);
      window.open(appUrl, '_blank');
    }}
    className="... bg-blue-950/80 ..."
    title="Brauzerda ochish"
  >
    <ExternalLink className="w-4 h-4 text-blue-400" />
    <span className="hidden sm:inline">Saytni ochish</span>
  </button>
)}
```

---

## 🧪 Test Qilish

### VARIANT 1: Telegram Desktop/Mobile
1. Botingizni ochib `/start` buyrug'ini yuboring
2. Bot web app linkini yuborsin (yoki inline keyboard bilan)
3. Web app ochilganda Header da **ko'k tugma** paydo bo'lishi kerak
4. Tugmani bosing - yangi tabda/brauzerda ochiladi

### VARIANT 2: Telegram Bot Orqali (Inline Mode)
Bot kodiga quyidagicha link qo'shing:

```javascript
// server.js da
bot.onText(/\/start/, async (msg) => {
  const chatId = msg.chat.id;
  
  await bot.sendMessage(chatId, 
    '🎬 MANYAK TV ga xush kelibsiz!', 
    {
      reply_markup: {
        inline_keyboard: [[
          {
            text: '🌐 Web App ni Ochish',
            web_app: { url: 'https://your-domain.com' }
          }
        ]]
      }
    }
  );
});
```

### VARIANT 3: BotFather Menu Button
1. BotFather ga `/mybots` yuboring
2. Botingizni tanlang
3. **"Menu Button"** ni tanlang
4. **"Edit Menu Button URL"** ni bosing
5. URL kiriting: `https://your-domain.com`
6. Botda Menu tugmasi (≡) bosilganda web app ochiladi

---

## 🔍 Debug / Troubleshooting

### Console Log'larni Tekshirish
Browser DevTools (F12) ni ochib Console tabiga o'ting:

**Telegram ichida:**
```
[Header] Telegram Web App aniqlandi!
```

**Oddiy brauzerda:**
```
[Header] Oddiy brauzer rejimi
```

### Tugma Ko'rinmasa:

1. **Telegram Web App SDK yuklanganmi?**
   ```javascript
   console.log(window.Telegram?.WebApp);
   // undefined bo'lsa SDK yuklanmagan
   ```

2. **State o'zgarganmi?**
   ```javascript
   // Header.tsx da qo'shib test qiling:
   console.log('[Header] isTelegramWebApp:', isTelegramWebApp);
   ```

3. **Build yangilanganmi?**
   ```bash
   npm run build
   # yoki dev rejimda:
   npm run dev
   ```

---

## 🎨 Tugma Ko'rinishi

**Ko'k background** - Telegram Web App ichida bo'lganini ko'rsatish uchun
**ExternalLink icon** - Tashqi linkga o'tishni bildiradi
**"Saytni ochish"** - Desktop/Tablet uchun
**Faqat icon** - Mobil telefon uchun (responsive)

```css
bg-blue-950/80        /* Qorong'i ko'k */
hover:bg-blue-900/80  /* Hover - ochroq */
text-blue-300         /* Matn rangi */
border-blue-700/50    /* Chegara rangi */
```

---

## 📱 Telegram Bot Setup

### 1. Botni BotFather da sozlash
```
/setmenubutton
@your_bot_username
URL: https://your-domain.com
Text: 🎬 MANYAK TV
```

### 2. Web App Domain qo'shish (BotFather)
```
/setdomain
@your_bot_username
Domain: your-domain.com
```

### 3. Bot commandalarini sozlash
```
/setcommands
@your_bot_username

start - Web App ni ochish
help - Yordam
```

---

## ✅ Final Checklist

- [ ] `index.html` da Telegram SDK scripti bor
- [ ] Header.tsx da `useEffect` Telegram aniqlaydi
- [ ] Console da log chiqmoqda
- [ ] Tugma Telegram ichida ko'rinmoqda
- [ ] Tugmani bosganda yangi tab ochilmoqda
- [ ] Oddiy brauzerda tugma YO'Q (to'g'ri ishlayapti)

---

## 🚀 Production Deploy

1. **Build qiling:**
   ```bash
   npm run build
   ```

2. **Serverni ishga tushiring:**
   ```bash
   npm start
   ```

3. **Telegram botga URL qo'shing:**
   - BotFather > /setmenubutton
   - Yoki inline keyboard bilan

4. **Test qiling:**
   - Telegram bot > Menu tugmasi
   - Web App ochiladi
   - Header da "🌐 Saytni ochish" ko'rinadi

---

## 📞 Yordam Kerakmi?

Agar tugma hali ham ko'rinmasa:

1. Browser console'ni tekshiring (F12)
2. `window.Telegram` mavjudligini tekshiring
3. Network tab'da `telegram-web-app.js` yuklanganini tekshiring
4. Build yangilanganini tasdiqlang

**Debug Mode Yoqish:**
```typescript
// Header.tsx ga qo'shing (useEffect ichida):
console.log('[DEBUG] window.Telegram:', window.Telegram);
console.log('[DEBUG] window.Telegram?.WebApp:', window.Telegram?.WebApp);
console.log('[DEBUG] isTelegramWebApp:', isTelegramWebApp);
```

---

Muallif: Kiro AI + SOIL1007  
Versiya: 1.0.0  
Sana: 2026-09-11
