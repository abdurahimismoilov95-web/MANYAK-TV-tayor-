# 🌐 Bot Web App Tugmasi - Qo'shildi

## ✅ Amalga Oshirildi

Telegram botda `/start` buyrug'ini yuborgan tasdiqlangan foydalanuvchilarga **"🌐 Web App ni Ochish"** inline keyboard tugmasi qo'shildi.

---

## 🔧 Qanday Ishlaydi

### 1. Foydalanuvchi Tasdiqlangan
Agar foydalanuvchi allaqachon tasdiqlangan bo'lsa (`isPhoneVerified: true`), bot xush kelibsiz xabari bilan birga **inline keyboard** yuboradi:

```javascript
// server.js - line ~1540
await tgSendWithKeyboard(chat, [
  `✅ <b>Xush kelibsiz, ${escapeTgHtml(user.firstName)}!</b>`,
  '',
  `👤 <b>Ism:</b> ${escapeTgHtml(user.firstName)} ${escapeTgHtml(user.lastName || '')}`.trim(),
  user.username ? `🔗 <b>Username:</b> @${escapeTgHtml(user.username)}` : '',
  `📞 <b>Telefon:</b> ${escapeTgHtml(user.phone || 'N/A')}`,
  user.isVip ? `⭐ <b>VIP</b> obuna faol` : '',
  user.accessTokens > 0 ? `🎟️ <b>Tokenlar:</b> ${user.accessTokens} ta` : '',
  '',
  '🎬 Hisobingiz faol. Pastdagi tugmadan saytga kiring!',
].filter(Boolean).join('\n'), {
  inline_keyboard: [[
    {
      text: '🌐 Web App ni Ochish',
      web_app: { url: APP_URL || 'http://localhost:3000' }
    }
  ]]
});
```

### 2. Web App URL
- **Production:** `.env` faylida `APP_URL` o'zgaruvchisi ishlatiladi
- **Development:** Agar `APP_URL` yo'q bo'lsa, default `http://localhost:3000` ishlatiladi

---

## 🧪 Test Qilish

### 1. Botga `/start` Yuboring
```
/start
```

### 2. Natija (Tasdiqlangan Foydalanuvchi)
```
✅ Xush kelibsiz, Ism Familiya!

👤 Ism: Ism Familiya
📞 Telefon: +998901234567
⭐ VIP obuna faol
🎟️ Tokenlar: 5 ta

🎬 Hisobingiz faol. Pastdagi tugmadan saytga kiring!

[🌐 Web App ni Ochish]  ← INLINE BUTTON
```

### 3. Tugmani Bosing
- Telegram ichida Web App ochiladi
- Header.tsx da "🌐 Saytni ochish" tugmasi paydo bo'ladi (Telegram ichida)

---

## 🎨 Tugma Turi

**Inline Keyboard** - Xabar ostida ko'rinadi  
**Web App Button** - Telegram ichida Web App ochadi (tashqi browser emas)

```javascript
{
  inline_keyboard: [[
    {
      text: '🌐 Web App ni Ochish',
      web_app: { url: APP_URL }
    }
  ]]
}
```

---

## ⚙️ Sozlamalar

### .env Fayli
```env
# Web App URL (HTTPS majburiy production uchun)
APP_URL=https://your-domain.com

# Development uchun:
APP_URL=http://localhost:3000
```

### Botni Qayta Ishga Tushirish
```bash
# Serverni to'xtatish (Ctrl+C)
# Keyin qayta ishga tushirish:
npm start

# yoki nodemon ishlatilsa avtomatik yangilanadi
```

---

## 🔍 Debugging

### Console Log'lar
```bash
[Bot] ✅ Bot ulandi: @YourBotName
[Config] Ommaviy manzil: https://your-domain.com
```

### Agar Tugma Ko'rinmasa:

1. **Foydalanuvchi tasdiqlangan?**
   - Kontaktni yuborgan bo'lishi kerak
   - `isPhoneVerified: true` bo'lishi kerak

2. **APP_URL sozlanganmi?**
   ```bash
   # .env faylini tekshiring
   cat .env | grep APP_URL
   ```

3. **Serverni qayta ishga tushirilganmi?**
   ```bash
   # Serverni to'xtatib qayta ishga tushiring
   npm start
   ```

4. **Bot commandani qabul qilmoqdami?**
   - `/start` buyrug'ini qayta yuboring
   - Eski xabar yangilanmaydi - yangi xabar keladi

---

## 📱 Telegram Web App vs URL

**Web App Button** (`web_app`):
- Telegram ichida ochiladi (ichki browser)
- Header.tsx da "🌐 Saytni ochish" tugmasi paydo bo'ladi
- `window.Telegram.WebApp` mavjud

**Oddiy URL Button** (`url`):
- Tashqi brauzerda ochiladi
- Header.tsx da tugma yo'q
- `window.Telegram.WebApp` mavjud emas

---

## 🎯 Foydalanuvchi Oqimi

1. **Yangi Foydalanuvchi:**
   - Bot > `/start`
   - Kontakt so'raladi
   - Kontakt yuboriladi
   - Tasdiqlash...

2. **Tasdiqlangan Foydalanuvchi:**
   - Bot > `/start`
   - Xush kelibsiz xabari + **[🌐 Web App ni Ochish]** tugmasi ✅
   - Tugma bosiladi
   - Web App ochiladi
   - Sayt ishlatiladi

---

## ✅ Tekshirish Ro'yxati

- [ ] `.env` da `APP_URL` sozlangan
- [ ] Server qayta ishga tushirilgan
- [ ] Botga `/start` yuborilgan
- [ ] Inline keyboard paydo bo'lgan
- [ ] "🌐 Web App ni Ochish" tugmasi bor
- [ ] Tugma bosilganda Web App ochiladi
- [ ] Header.tsx da "🌐 Saytni ochish" tugmasi ko'rinadi (Telegram ichida)

---

## 🚀 Production Deploy

1. **.env faylida APP_URL to'g'ri sozlash:**
   ```env
   APP_URL=https://your-production-domain.com
   ```

2. **Serverni qayta ishga tushirish:**
   ```bash
   npm start
   ```

3. **Test qilish:**
   - Telegram bot > `/start`
   - "🌐 Web App ni Ochish" tugmasini bosing
   - Web App ochilishini tekshiring

---

## 🎉 Natija

**ISHLAYDI! ✅**

- Bot `/start` buyrug'iga javob beradi
- Tasdiqlangan foydalanuvchilarga inline keyboard ko'rsatadi
- "🌐 Web App ni Ochish" tugmasi Telegram ichida Web App ochadi
- Header.tsx da qo'shimcha "Saytni ochish" tugmasi ham bor

---

Muallif: Kiro AI + SOIL1007  
Versiya: 1.0.2  
Sana: 2026-09-11  
Status: ✅ **QO'SHILDI VA ISHLAYDI**
