# ⚡ Tezkor HTTPS Tunnel Sozlash

## Sizga 3 ta oson usul:

---

## 🥇 USUL 1: Ngrok (Eng yaxshi va barqaror)

### O'rnatish:
1. **Yuklab oling:** https://ngrok.com/download
2. ZIP'ni oching va `ngrok.exe`ni `Downloads` papkasiga qo'ying

### Ishga tushirish:
```powershell
# Yangi PowerShell terminal ochib:
C:\Users\SOIL1007\Downloads\ngrok.exe http 3001
```

### Natija:
```
Forwarding  https://abc123.ngrok-free.app -> http://localhost:3001
```

### .env'ni yangilash:
```env
APP_URL="https://abc123.ngrok-free.app"
```

### Serverni qayta ishga tushirish:
```powershell
npm run server
```

✅ **Webhook o'rnatiladi va bot ishlaydi!**

---

## 🥈 USUL 2: LocalTunnel (NPM orqali)

### O'rnatish kerak emas, darhol ishlatish:

```powershell
# Yangi terminal:
npx -y localtunnel --port 3001
```

### Natija:
```
your url is: https://xyz-123-45.loca.lt
```

### .env'ni yangilash:
```env
APP_URL="https://xyz-123-45.loca.lt"
```

### Serverni qayta ishga tushirish:
```powershell
npm run server
```

✅ **Webhook o'rnatiladi!**

**DIQQAT:** Birinchi marta ochganda brauzerda parol sahifasi chiqadi. 
Telegram bot uchun bu muammo emas.

---

## 🥉 USUL 3: Cloudflare Tunnel (Professional)

### O'rnatish:
1. **Yuklab oling:** https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/
2. Yoki Chocolatey bilan:
   ```powershell
   choco install cloudflared
   ```

### Ishga tushirish:
```powershell
cloudflared tunnel --url http://localhost:3001
```

### Natija:
```
https://xyz.trycloudflare.com
```

### .env'ni yangilash:
```env
APP_URL="https://xyz.trycloudflare.com"
```

### Serverni qayta ishga tushirish:
```powershell
npm run server
```

✅ **Eng barqaror va tezkor variant!**

---

## 📋 Umumiy Qadamlar (Har bir usul uchun):

### 1. Tunnel'ni ishga tushiring
   - Yuqoridagi usullardan birini tanlang
   - Yangi terminal oching
   - Buyruqni yozing

### 2. HTTPS URL'ni oling
   - Terminal'da ko'rsatilgan URL'ni nusxalang
   - Masalan: `https://abc123.ngrok-free.app`

### 3. .env faylini yangilang
   ```env
   APP_URL="https://sizning-url.ngrok-free.app"
   ```

### 4. Backend serverni qayta ishga tushiring
   - Eski terminal'da `Ctrl+C`
   - Keyin: `npm run server`

### 5. Loglarni tekshiring
   ```
   [Bot] ✅ Webhook o'rnatildi: https://sizning-url/webhook
   ```

### 6. Botni test qiling
   - Telegram'da: https://t.me/Animanyaktvuzbot
   - `/start` yuboring
   - ✅ Javob kelishi kerak!

---

## 🧪 Test Qilish

### Bot'ga xabar yuboring:
```
/start
```

### Kutilgan javob:
```
👋 MANYAK TV ga xush kelibsiz!

Hisobingizni tasdiqlash uchun pastdagi «📱 Kontaktni yuborish» tugmasini bosing.

🔒 Kontakt faqat hisobingizni tasdiqlash uchun ishlatiladi.
```

✅ **Agar javob kelsa — HAMMASI ISHLAYAPTI!**

---

## 🎯 Qaysi Usulni Tanlash?

| Usul | Afzallik | Kamchilik | Tavsiya |
|------|----------|-----------|---------|
| **Ngrok** | Barqaror, tez, ko'p imkoniyat | Yuklab olish kerak | ⭐⭐⭐⭐⭐ |
| **LocalTunnel** | Darhol ishlatish | Ba'zan sekin | ⭐⭐⭐⭐ |
| **Cloudflare** | Eng tez, professional | O'rnatish kerak | ⭐⭐⭐⭐⭐ |

---

## ⚠️ Muhim Eslatmalar

1. **URL har safar o'zgaradi**
   - Tunnel qayta ishga tushirilsa
   - .env'ni yangilash kerak
   - Serverni qayta ishga tushirish kerak

2. **2 ta terminal kerak**
   - Terminal 1: Backend server (`npm run server`)
   - Terminal 2: Tunnel (ngrok/localtunnel/cloudflared)

3. **Frontend'ni o'zgartirmang**
   - Frontend hamon `http://localhost:3000`'da
   - Faqat backend uchun tunnel

---

## 🔧 Tezkor Diagnostika

### Bot javob bermasa:

1. **Webhook statusini tekshiring:**
   ```powershell
   Invoke-RestMethod "https://api.telegram.org/bot6680993256:AAH14MeHY8NWb9zlO9DF6rB1d8ASiXi6RKE/getWebhookInfo"
   ```

2. **Kutilgan javob:**
   ```json
   {
     "url": "https://sizning-url/webhook",
     "pending_update_count": 0,
     "last_error_date": 0
   }
   ```

3. **Agar `url` bo'sh bo'lsa:**
   - .env'ni tekshiring
   - Serverni qayta ishga tushiring

---

## 🚀 Eng Tez Usul (LocalTunnel):

**Bir buyruqda:**

```powershell
# Terminal 1 (tunnel):
npx -y localtunnel --port 3001

# URL'ni nusxalang, .env'ga yozing

# Terminal 2 (server):
npm run server

# Bot'ni test qiling:
# https://t.me/Animanyaktvuzbot
```

---

**Qaysi usulni tanlagan bo'lsangiz ham, natija bir xil: ✅ Bot to'liq ishlaydi!** 🎉
