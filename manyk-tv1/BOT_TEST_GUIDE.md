# 🤖 Telegram Bot Test Qo'llanmasi

## ✅ Bot Ma'lumotlari

**Bot Token Ulandi!**

- 🤖 **Bot Username:** @Animanyaktvuzbot
- 📛 **Bot Name:** Animanyakbot
- 🆔 **Bot ID:** 6680993256
- ✅ **Status:** Ishlamoqda

---

## 🔗 Bot Havolalari

### Bot Ochish:
```
https://t.me/Animanyaktvuzbot
```

### Telegram'da Ochish:
```
tg://resolve?domain=Animanyaktvuzbot
```

---

## 🧪 Bot Testlari

### 1. Bot Ishlashini Tekshirish

**Telegram'da botni ochib, quyidagi buyruqlarni sinab ko'ring:**

#### `/start` Buyruq'i
```
/start
```
**Kutilgan javob:**
- Salom xabari
- Kontakt yuborish tugmasi (📱 Kontaktni yuborish)
- Botning asosiy menyusi

#### Bot Ma'lumotini Olish (Admin uchun)
```
/stats
```
**Kutilgan javob:**
- Foydalanuvchilar soni
- VIP foydalanuvchilar
- Kontentlar soni
- To'lov kutilayotgan cheklar
- Umumiy daromad

---

### 2. Lokal Test Chegaralari

**DIQQAT:** Lokal testda webhook ishlamaydi, chunki:
- Telegram webhook uchun HTTPS kerak
- `http://localhost:3001` HTTPS emas
- Webhook `https://` manzilga o'rnatiladi

**Ishlaydi:**
- ✅ Bot API so'rovlari (getMe, sendMessage)
- ✅ Frontend va backend o'rtasidagi aloqa
- ✅ Admin panel funksiyalari
- ✅ Database operatsiyalari

**Ishlamaydi:**
- ❌ `/start` botga yuborilsa — javob kelmaydi
- ❌ Kontakt yuborish — tasdiqlash ishlamaydi
- ❌ To'lov cheklari tasdiqlanishi — bot orqali xabar kelmaydi

---

### 3. Ngrok Bilan To'liq Test

Agar to'liq bot funksiyasini test qilmoqchi bo'lsangiz, ngrok ishlatishingiz kerak:

#### 3.1. Ngrok O'rnatish
```bash
# Windows uchun
# https://ngrok.com/download dan yuklab oling
```

#### 3.2. Ngrok Ishga Tushirish
```bash
ngrok http 3001
```

**Natija:**
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3001
```

#### 3.3. .env Faylini Yangilash
`.env` faylida:
```env
APP_URL="https://abc123.ngrok-free.app"
```

#### 3.4. Serverni Qayta Ishga Tushirish
```bash
# Backend serverni to'xtatish va qayta ishga tushirish
npm run server
```

**Natija:**
```
[Bot] ✅ Webhook o'rnatildi: https://abc123.ngrok-free.app/webhook
```

#### 3.5. Bot Testlari (To'liq)
Endi botga `/start` yuborib, to'liq test qilishingiz mumkin:
- ✅ `/start` javob beradi
- ✅ Kontakt yuborish ishlaydi
- ✅ Admin buyruqlar ishlaydi
- ✅ To'lov cheklari bot orqali keladi

---

## 📱 Frontend'dan Bot Bilan Aloqa

### Admin Panel → Broadcast Test

1. **Brauzerda admin panelga kiring:**
   ```
   http://localhost:3000
   ```

2. **DevTools ochib, test user yarating:**
   ```javascript
   const testUser = {
     id: "6680993256", // Bot ID'ni admin ID sifatida
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

3. **Admin Panel → Bot Xabarnoma:**
   - Kino tanlang
   - Xabar yozing
   - "Barcha obunachilarga jo'natish!" tugmasini bosing

4. **Kutilgan natija:**
   - ⚠️ Lokal testda yuborilmaydi (foydalanuvchilar bazada yo'q)
   - ✅ Ngrok bilan ishlaganda botga xabar keladi

---

## 🔧 Bot Sozlamalari (Production uchun)

### Bot Commands Sozlash

Telegram'da @BotFather ga:
```
/setcommands
```

**Buyruqlar ro'yxati:**
```
start - Botni ishga tushirish
stats - Statistika (Admin)
help - Yordam (Admin)
```

### Bot Description
```
/setdescription
```
**Tavsif:**
```
MANYAK TV — O'zbek tilidagi kinolar, seriallar va animalar platformasi. VIP obuna oling va barcha kontentlarga cheksiz kirish huquqiga ega bo'ling!
```

### Bot About
```
/setabouttext
```
**Haqida:**
```
MANYAK TV rasmiy Telegram boti. Kontentlarni tomosha qilish, VIP obuna olish va yangiliklar uchun.
```

---

## 🎯 Test Natijalari Ro'yxati

### Bot API Testlari
- [x] Bot token to'g'ri ulandi
- [x] getMe API ishlaydi
- [x] Bot username: @Animanyaktvuzbot
- [ ] Webhook o'rnatildi (ngrok kerak)
- [ ] `/start` javob beradi (ngrok kerak)

### Frontend Testlari
- [x] Frontend ishga tushdi (localhost:3000)
- [x] Admin panel ochiladi
- [x] Broadcast preview ko'rinadi
- [x] Thumbnail avtomatik yuklash
- [x] VIP banner ko'rinadi
- [x] Yangi kinolar filtri ishlaydi

### Backend Testlari
- [x] Backend ishga tushdi (localhost:3001)
- [x] Database yaratildi (manyktv.db)
- [x] API endpoints ishlaydi
- [x] Bot token tanildi
- [ ] Webhook ishlaydi (ngrok kerak)

---

## 🆘 Muammolar va Yechimlar

### Muammo 1: Bot javob bermaydi
**Sabab:** Webhook o'rnatilmagan (HTTPS kerak)
**Yechim:** Ngrok ishlatib, webhook o'rnating (yuqoriga qarang)

### Muammo 2: "Token invalid" xatosi
**Sabab:** Bot token noto'g'ri yoki eskirgan
**Yechim:** @BotFather dan yangi token oling

### Muammo 3: Broadcast yuborilmaydi
**Sabab:** Bazada foydalanuvchilar yo'q
**Yechim:** 
1. Botga `/start` yuboring
2. Yoki ngrok bilan webhook o'rnating

---

## 📊 Keyingi Qadamlar

### Lokal Test Tugagandan Keyin:

1. **Production Deploy:**
   - Railway / Render / Fly.io
   - Avtomatik HTTPS manzil olasiz
   - Webhook avtomatik o'rnatiladi

2. **Bot Tokenni Almashtirish:**
   - Production uchun yangi token yarating
   - `.env` faylda almashtiring
   - GIT'ga commit qilmang!

3. **Xavfsizlik:**
   - Bot tokenni hech qachon ochiq qilmang
   - `.env` faylni `.gitignore`ga qo'shing
   - Production'da environment variables ishlatiladi

---

## 🔐 Xavfsizlik Eslatmalari

⚠️ **MUHIM:**

1. **Bot tokenni hech qachon:**
   - GIT'ga commit qilmang
   - Screenshot'da ko'rsatmang
   - Boshqa odamlarga bermang

2. **Token oshkor bo'lsa:**
   - @BotFather → /revoke
   - Yangi token oling
   - Barcha joylarda almashtiring

3. **Production'da:**
   - Environment variables ishlatiladi
   - Token faqat serverda saqlanadi
   - Frontend'da HECH QACHON ko'rinmaydi

---

**Omad! Test qilishni boshlang! 🚀**

**Telegram Botni Ochish:** https://t.me/Animanyaktvuzbot
