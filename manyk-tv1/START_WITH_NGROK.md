# Ngrok bilan Local Test Qilish

## Muammo
Telegram bot webhook **haqiqiy HTTPS URL** talab qiladi.
`localhost:3001` ishlamaydi!

## Yechim: Ngrok

### 1. Ngrok'ni yuklab oling
```
https://ngrok.com/download
```

Yoki Chocolatey orqali (Windows):
```powershell
choco install ngrok
```

### 2. Ngrok account yarating (bepul)
```
https://dashboard.ngrok.com/signup
```

### 3. Auth token olish
```
https://dashboard.ngrok.com/get-started/your-authtoken
```

Terminal'da:
```powershell
ngrok config add-authtoken YOUR_TOKEN_HERE
```

### 4. Ngrok'ni ishga tushiring
```powershell
ngrok http 3001
```

### 5. URL'ni ko'chirib oling
Ngrok sizga HTTPS URL beradi:
```
https://abc123.ngrok-free.app
```

### 6. .env'ga URL'ni qo'shing
```.env
APP_URL="https://abc123.ngrok-free.app"
VITE_API_BASE_URL="https://abc123.ngrok-free.app/api"
```

### 7. Server'ni restart qiling
```powershell
# Eski server'ni to'xtatish (Ctrl+C)
# Yangi server'ni ishga tushirish
node server.js
```

### 8. Bot'ni test qiling
- Telegram'da: @Animanyaktvuzbot
- /start bosing
- Endi webhook ishlaydi!

---

## DIQQAT: Ngrok URL o'zgaradi!

Ngrok'ni to'xtatsangiz yoki qayta ishga tushirsangiz, yangi URL beriladi.

Har safar:
1. Ngrok'dan yangi URL oling
2. `.env`'da `APP_URL` ni yangilang
3. Server'ni restart qiling

---

## Yaxshiroq Yechim: Railway Deploy

Ngrok faqat test uchun yaxshi.
Production uchun Railway deploy qiling:
- URL doimiy bo'ladi
- Restart kerak emas
- Volume bilan ma'lumotlar saqlanadi

Railway'ga deploy qilish: **DEPLOY.md** faylini o'qing.
