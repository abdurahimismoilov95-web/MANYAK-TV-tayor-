# 🚀 MANYAK TV - HOZIR DEPLOY QILING!

## ✅ TAYYOR!

Sayt to'liq tekshirildi va ishga tushirishga tayyor:

- ✅ Build muvaffaqiyatli
- ✅ Bot token ulangan
- ✅ Kanal sozlangan (@Manyak_tv)
- ✅ Admin panel tayyor
- ✅ Broadcast funksiyasi tayyor
- ✅ Tasdiqlash dialoglari qo'shildi
- ✅ Xavfsizlik sozlamalari to'g'ri

---

## 🎯 HOZIR QILISH KERAK (5 DAQIQA!)

### 1️⃣ Railway'ga kiring
```
https://railway.app
```

### 2️⃣ New Project
- **Deploy from GitHub repo**
- Repository'ni tanlang: `MANYAK-TV-tayor-/manyk-tv1`
- **Deploy Now** bosing

### 3️⃣ Environment Variables qo'shing
**Settings** → **Variables** → **Raw Editor** → Paste qiling:

```env
NODE_ENV=production
TELEGRAM_BOT_TOKEN=6680993256:AAH14MeHY8NWb9zlO9DF6rB1d8ASiXi6RKE
TELEGRAM_CHANNEL_ID=@Manyak_tv
SUPER_ADMIN_ID=891846690
ADMIN_IDS=891846690
WEBHOOK_SECRET=83913760abebc02506c968efc02bd6f1b91fea7a744dba9228c70fc636731ed3
JWT_SECRET=13be87714bc758c2b730b4fdb6426632e373a82d2ba2b6872b599040679c0896
PORT=3001
```

**Save** bosing.

### 4️⃣ Domain olish
- **Settings** → **Networking** → **Generate Domain**
- URL paydo bo'ladi (masalan: `manyak-tv1-production.up.railway.app`)
- **Bu URL'ni yozib oling!**

### 5️⃣ APP_URL qo'shish
**Settings** → **Variables** → Yangi qo'shing:

```env
APP_URL=https://SIZNING-RAILWAY-URL.railway.app
VITE_API_BASE_URL=https://SIZNING-RAILWAY-URL.railway.app/api
```

**⚠️ DIQQAT:** `SIZNING-RAILWAY-URL` ni 4-qadamda olgan URL bilan almashtiring!

**Redeploy** bosing.

### 6️⃣ Volume qo'shing (MUHIM!)
**Settings** → **Volumes** → **+ New Volume**

**3 ta volume yaratish:**

1. **Database:**
   - Name: `manyak-tv-database`
   - Mount Path: `/app/data`

2. **Uploads:**
   - Name: `manyak-tv-uploads`
   - Mount Path: `/app/uploads`

3. **Backups:**
   - Name: `manyak-tv-backups`
   - Mount Path: `/app/backups`

Har birida **Save** bosing.

**Redeploy** bosing.

---

## ✅ TEST QILISH

### 1. Health Check
Railway URL'ga `/api/health` qo'shing:
```
https://SIZNING-URL.railway.app/api/health
```

Javob: `{"ok":true,"message":"MANYAK TV API is running"}`

### 2. Bot Test
1. Telegram'da: `@Animanyaktvuzbot`
2. `/start` bosing
3. Mini app ochilishi kerak! 🎉

### 3. Admin Panel
- Profile → Admin Panel
- Barcha funksiyalar ishlamasa - loglarni tekshiring

---

## 📚 BATAFSIL KO'RSATMALAR

- **PRODUCTION_CHECKLIST.md** - To'liq checklist
- **RAILWAY_VOLUME_SETUP.md** - Volume sozlash
- **RAILWAY_PERSISTENT_STORAGE.md** - Ma'lumotlar saqlash

---

## 🆘 YORDAM KERAKMI?

### Loglarni tekshirish
Railway: **Deployments** → **View Logs**

### Umumiy muammolar:
1. **Bot javob bermayapti** → `APP_URL` to'g'ri ekanligini tekshiring
2. **Ma'lumotlar yo'qolyapti** → Volume qo'shing
3. **Broadcast ishlamayapti** → Botda `/start` bosing

---

## 🎉 OMAD!

5 daqiqadan keyin MANYAK TV production'da bo'ladi!

**URL:** https://SIZNING-RAILWAY-URL.railway.app
**Bot:** @Animanyaktvuzbot
**Kanal:** @Manyak_tv

Deploy qilgandan keyin menga URL yuboring, men tekshirib beraman! 🚀
