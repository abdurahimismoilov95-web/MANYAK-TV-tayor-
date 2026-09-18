# 🌐 Ngrok O'rnatish va Ishga Tushirish Qo'llanmasi

## 📥 1. Ngrok Yuklab Olish

### Windows uchun:

1. **Ngrok saytiga kiring:**
   ```
   https://ngrok.com/download
   ```

2. **Windows versiyasini yuklab oling:**
   - Windows (64-bit) tugmasini bosing
   - `ngrok-v3-stable-windows-amd64.zip` yuklanadi

3. **ZIP faylni ochish:**
   - Yuklab olingan ZIP faylni oching
   - `ngrok.exe` faylini chiqarib oling
   - Quyidagi papkaga ko'chiring:
     ```
     C:\Users\SOIL1007\Downloads\ngrok.exe
     ```

---

## 🔑 2. Ngrok Ro'yxatdan O'tish (Ixtiyoriy lekin Tavsiya Etiladi)

1. **Ngrok saytida akkaunt yaratish:**
   ```
   https://dashboard.ngrok.com/signup
   ```

2. **Authtoken olish:**
   - Login qiling
   - Dashboard → "Your Authtoken"
   - Tokenni nusxalab oling

3. **Tokenni o'rnatish:**
   ```powershell
   C:\Users\SOIL1007\Downloads\ngrok.exe authtoken YOUR_AUTH_TOKEN
   ```

**Afzalliklari:**
- ✅ Tunnel uzoqroq ishlaydi
- ✅ Custom domenlar
- ✅ Ko'proq bir vaqtning o'zida tunnel

---

## 🚀 3. Ngrok'ni Ishga Tushirish

### Oddiy Usul (PowerShell):

```powershell
# Ngrok'ni ishga tushirish
C:\Users\SOIL1007\Downloads\ngrok.exe http 3001
```

### Yoki Terminaldan:

1. **Yangi PowerShell terminalni ochish**
2. **Quyidagi buyruqni yozish:**
   ```powershell
   cd C:\Users\SOIL1007\Downloads
   .\ngrok.exe http 3001
   ```

**Natija:**
```
ngrok                                                                           

Session Status                online
Account                       Your Name (Plan: Free)
Version                       3.x.x
Region                        us (United States)
Latency                       50ms
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:3001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

---

## 📝 4. APP_URL'ni Yangilash

### Ngrok'dan HTTPS URL'ni nusxalang:

Masalan:
```
https://abc123def456.ngrok-free.app
```

### .env faylini yangilang:

Quyidagi qatorni o'zgartiring:
```env
# ESKI:
APP_URL="http://localhost:3001"

# YANGI (ngrok URL):
APP_URL="https://abc123def456.ngrok-free.app"
```

**DIQQAT:** Har safar ngrok qayta ishga tushirilganda yangi URL beriladi!

---

## 🔄 5. Serverni Qayta Ishga Tushirish

Backend serverni to'xtatib, qayta ishga tushiring:

```powershell
# Terminal'da Ctrl+C
# Keyin:
npm run server
```

**Kutilgan natija:**
```
[Bot] ✅ Webhook o'rnatildi: https://abc123def456.ngrok-free.app/webhook
[Bot] ✅ Bot ishlayapti: @Animanyaktvuzbot
🚀 MANYK TV SQLite Backend v2.0
   http://localhost:3001
   Webhook:    https://abc123def456.ngrok-free.app/webhook
```

---

## 🧪 6. Bot Testlash

### Telegram'da botni oching:
```
https://t.me/Animanyaktvuzbot
```

### Test buyruqlar:

1. **/start** yuborib, botdan javob kutib turing
   - ✅ Salom xabari kelishi kerak
   - ✅ "📱 Kontaktni yuborish" tugmasi paydo bo'lishi kerak

2. **"📱 Kontaktni yuborish"** tugmasini bosing
   - ✅ Kontakt yuboriladi
   - ✅ Bot tasdiqlash xabarini yuboradi
   - ✅ "✅ Hisobingiz tasdiqlandi!" xabari keladi

3. **/stats** (Admin uchun)
   - ✅ Statistika chiqishi kerak

---

## 🎯 7. To'liq Funksiyalarni Tekshirish

### ✅ Webhook Ishlaydi:
- Bot xabarlariga javob beradi
- Buyruqlar real-time ishlaydi

### ✅ Kontakt Tasdiqlash:
- Foydalanuvchi kontakt yuboradi
- Server uni tasdiqlaydi
- Database'ga yoziladi

### ✅ To'lov Cheklari:
- Admin paneldan chek yuklash
- Bot adminga xabar yuboradi
- Tasdiqlash/rad etish tugmalari ishlaydi

### ✅ Broadcast:
- Admin xabarnoma yuboradi
- Bot barcha foydalanuvchilarga yetkazadi
- Rasm va tugma bilan birga

---

## 🛑 8. Ngrok'ni To'xtatish

Terminal'da:
```
Ctrl+C
```

---

## ⚠️ Muhim Eslatmalar

### 1. Ngrok URL O'zgaradi
- Har safar qayta ishga tushirilganda yangi URL
- `.env` faylini har safar yangilash kerak
- Serverni qayta ishga tushirish kerak

### 2. Free Plan Chegaralari
- 1 ta tunnel (yetarli)
- 40 so'rov/daqiqa (test uchun yetarli)
- 2 soat timeout (qayta ishga tushirish kerak)

### 3. Ngrok Web Interface
```
http://127.0.0.1:4040
```
- Barcha so'rovlarni ko'rish
- Debug qilish uchun foydali

---

## 🔧 Muammolar va Yechimlar

### Muammo 1: "ngrok.exe topilmadi"
**Yechim:**
```powershell
# To'liq yo'l bilan ishga tushiring
C:\Users\SOIL1007\Downloads\ngrok.exe http 3001
```

### Muammo 2: "Webhook xatosi"
**Yechim:**
1. Ngrok ishlab turganini tekshiring
2. APP_URL to'g'ri yozilganini tekshiring
3. Serverni qayta ishga tushiring

### Muammo 3: "Bot javob bermaydi"
**Yechim:**
1. Ngrok URL'ni tekshiring (http://127.0.0.1:4040)
2. Server loglarini ko'ring
3. Webhook statusini tekshiring:
   ```powershell
   Invoke-RestMethod "https://api.telegram.org/bot6680993256:AAH14MeHY8NWb9zlO9DF6rB1d8ASiXi6RKE/getWebhookInfo"
   ```

---

## 📊 Ngrok Muqobillari

Agar Ngrok ishlamasa:

### 1. Cloudflare Tunnel (cloudflared)
```powershell
cloudflared tunnel --url http://localhost:3001
```

### 2. LocalTunnel
```powershell
npx localtunnel --port 3001
```

### 3. serveo.net
```powershell
ssh -R 80:localhost:3001 serveo.net
```

---

## 🚀 Tezkor Start

**Bir buyruqda hammasi:**

```powershell
# 1. Ngrok ishga tushirish (yangi terminal)
C:\Users\SOIL1007\Downloads\ngrok.exe http 3001

# 2. URL'ni nusxalab, .env'ga yozish

# 3. Server'ni qayta ishga tushirish
npm run server

# 4. Bot'ni test qilish
# https://t.me/Animanyaktvuzbot
```

---

**Omad! Ngrok bilan to'liq bot funksiyasini test qilishingiz mumkin! 🎉**
