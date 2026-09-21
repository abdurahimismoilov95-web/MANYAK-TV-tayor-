# 🧪 UPLOAD TEST - ANIQ MUAMMONI TOPISH

## 🎯 VAZIFA

Upload nima uchun ishlamayotganini **ANIQ** topish va ko'rsatish.

---

## 🚀 TEST QILISH (2 DAQIQA)

### **1. Server'ni ishga tushiring:**

```powershell
cd manyk-tv1
npm run dev
```

Kutilgan:
```
Server http://localhost:3000 da ishlamoqda
```

---

### **2. Test sahifasini oching:**

```
http://localhost:3000/test-upload-debug.html
```

---

### **3. Sahifa avtomatik tekshiradi:**

- ✅ Foydalanuvchi ma'lumotlari (User ID, isAdmin, Token)
- ✅ Server ulanishi
- ✅ JWT token mavjudligi va amal qilishi

---

### **4. "📂 Fayl Tanlang va Yuklang" tugmasini bosing**

- Kichik fayl tanlang (< 10MB)
- Rasm yoki video

---

### **5. Natijani ko'ring:**

#### **✅ AGAR ISHLASA:**

```
✅ MUVAFFAQIYAT! URL: /uploads/public/content_1726046123456_...
```

Alert chiqadi: "✅ Yuklash muvaffaqiyatli!"

---

#### **❌ AGAR ISHLAMASA:**

**Qizil "Xato Aniqlandi" quti** paydo bo'ladi va **ANIQ SABAB** ko'rsatadi:

**Mumkin bo'lgan xatolar:**

##### **1. LocalStorage'da foydalanuvchi ma'lumotlari yo'q**
```
❌ LocalStorage'da foydalanuvchi ma'lumotlari yo'q!
Telegram bot orqali tasdiqlang.
```

**Yechim:**
- Telegram bot'ga `/start` yuboring
- Tasdiqlash kodini kiriting
- Sahifani refresh qiling

---

##### **2. Siz admin emassiz**
```
❌ Siz admin emassiz!
initialData.ts'da adminTelegramIds ro'yxatiga Telegram ID'ngizni qo'shing.
```

**Yechim:**
1. Telegram ID'ni toping (@userinfobot)
2. `src/data/initialData.ts` oching
3. `adminTelegramIds: ['123456789'],` qo'shing
4. Server'ni restart qiling (Ctrl+C → `npm run dev`)
5. Sahifani refresh qiling

---

##### **3. JWT token yo'q yoki eskirgan**
```
⚠️ JWT token topilmadi. Telegram bot orqali qayta tasdiqlang.
```

**Yechim:**
- Browser console'da (F12):
  ```javascript
  localStorage.clear();
  location.reload();
  ```
- Qayta login qiling

---

##### **4. Server ishlamayapti**
```
❌ Server'ga ulanib bo'lmadi: Failed to fetch
Server ishga tushganini tekshiring: npm run dev
```

**Yechim:**
```powershell
cd manyk-tv1
npm run dev
```

---

##### **5. Server 401/403 qaytaradi**
```
❌ Server 403 javob qaytardi.
```

Debug log'da ko'rsatiladi:
```
📥 Server javobi: Status 403
📄 Response: {"ok":false,"error":"Admin huquqi kerak"}
```

**Yechim:**
- `isAdmin: false` bo'lsa → Telegram ID'ni qo'shing
- Token eskirgan bo'lsa → localStorage'ni tozalang

---

##### **6. Fayl formati qo'llab-quvvatlanmaydi**
```
❌ Server 400 javob qaytardi.
Response: {"ok":false,"error":"Fayl formati aniqlanmadi"}
```

**Yechim:**
- Faqat MP4, WebM, JPG, PNG, WEBP yuklang
- Fayl buzilmagan bo'lishi kerak

---

## 📊 TEST SAHIFASI NIMA KO'RSATADI

### **1. Foydalanuvchi Ma'lumotlari:**
```
👤 Foydalanuvchi Ma'lumotlari [✅ Admin]

User ID: 123456789
Telegram ID: 123456789
Is Admin: ✅ TRUE  ← Bu TRUE bo'lishi kerak!
Phone Verified: ✅ TRUE
JWT Token: ✅ Bor (amal qiladi)
```

---

### **2. Server Ulanish:**
```
🌐 Server Ulanish [✅ Ulandi]

Backend URL: http://localhost:3000
Server Holati: ✅ Ishlayapti
```

---

### **3. Upload Test:**
```
📤 Fayl Yuklash Test [✅ Muvaffaqiyatli]

[Fayl tanlang va yuklang tugmasi]
```

---

### **4. Debug Log:**
```
📋 Debug Log

[10:30:45] 🚀 Diagnostika boshlandi...
[10:30:45] 🔍 Foydalanuvchi ma'lumotlarini tekshirish...
[10:30:45] ✅ JWT token amal qilmoqda
[10:30:45] ✅ User: 123456789 (Admin: true)
[10:30:45] 🌐 Server ulanishini tekshirish...
[10:30:45] ✅ Server ishlayapti
[10:30:45] ✅ Diagnostika tugadi
[10:30:50] 📤 Fayl yuklash boshlandi: test.mp4 (25.50 MB)
[10:30:50] 🔐 JWT token olingan
[10:30:50] 📄 Fayl kengaytmasi: .mp4
[10:30:50] 📡 So'rov yuborilmoqda...
[10:30:52] ⏳ Progress: 50%
[10:30:54] ⏳ Progress: 100%
[10:30:54] 📥 Server javobi: Status 200
[10:30:54] 📄 Response: {"ok":true,"url":"/uploads/public/content_..."}
[10:30:54] ✅ MUVAFFAQIYAT! URL: /uploads/public/content_1726046123456_...
```

---

## 🎯 SCREENSHOT YUBORING

Agar test o'tkazgandan keyin hali ham ishlamasa:

1. **Test sahifasining FULL screenshot'ini** yuboring
2. **Debug Log qismini** ko'rsating
3. **Qizil xato qutisini** ko'rsating (agar bor bo'lsa)

Men aniq muammoni ko'raman va darhol tuzataman!

---

## 📞 TEST NATIJASI

Test o'tkazing va ayting:

- ✅ **Ishladi** - alert "✅ Yuklash muvaffaqiyatli!" chiqdi
- ❌ **Ishlamadi** - qanday xato ko'rsatildi?

---

## ⚡ TEZKOR TEST

```
1. Server: npm run dev
2. Browser: http://localhost:3000/test-upload-debug.html
3. Fayl yuklang
4. Natijani ko'ring
```

**2 DAQIQA!** ⏱️

Test o'tkazib, natijani ayting! 🚀
