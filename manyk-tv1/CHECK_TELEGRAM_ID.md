# 🔑 TELEGRAM ID'NGIZNI TEKSHIRING

## ⚠️ MUAMMO TOPILDI!

**`src/data/initialData.ts`** faylda:
```typescript
adminTelegramIds: [],  // ❌ BO'SH!
```

Shuning uchun **admin panel ishlamayapti**! 

Sizning Telegram ID'ngiz admin list'da yo'q, shuning uchun:
- ❌ Upload endpoint 403 (Forbidden) qaytaradi
- ❌ `req.user.isAdmin = false` bo'ladi
- ❌ Video/poster yuklash rad etiladi

---

## 🔍 TELEGRAM ID'NI QANDAY TOPISH KERAK:

### **Usul 1: Bot orqali (ENG OSON)**

1. **Telegram'da bot'ingizga boring:** [@Animanyaktvuzbot](https://t.me/Animanyaktvuzbot)

2. **/start** yuboring

3. Bot sizga javob beradi:
   ```
   👋 Salom!
   
   Sizning Telegram ID: 123456789
   ```

4. **O'sha raqamni nusxa oling** (masalan: `123456789`)

---

### **Usul 2: @userinfobot orqali**

1. Telegram'da **@userinfobot**'ni toping
2. `/start` yoki istalgan xabar yuboring
3. Bot sizga ID'ngizni ko'rsatadi:
   ```
   Id: 123456789
   First name: Your Name
   ...
   ```

---

### **Usul 3: Web Inspector (agar bot'ga kirolmaysiz)**

1. Telegram Web'da oching: https://web.telegram.org
2. **F12** → **Console** tab
3. Quyidagi kodni kiriting:
   ```javascript
   webview.getTelegramUser().then(user => console.log(user.id))
   ```
4. Console'da raqam chiqadi

---

## ✅ ID'NI QANDAY QO'SHISH KERAK:

### **1. Faylni oching:**
```
src/data/initialData.ts
```

### **2. Quyidagi qatorni toping:**
```typescript
adminTelegramIds: [],
```

### **3. O'z ID'ngizni qo'shing:**
```typescript
adminTelegramIds: ['123456789'],  // O'z raqamingizni kiriting!
```

**MUHIM:**
- ✅ ID **string** (qo'shtirnoqda) bo'lishi kerak: `'123456789'`
- ✅ Vergul qo'yishni unutmang: `['123456789'],`
- ❌ Raqam formatida EMAS: ~~`[123456789]`~~ (NOTO'G'RI!)

### **4. Faylni saqlang** (Ctrl+S)

### **5. Server'ni RESTART qiling:**
```powershell
# Ctrl+C (to'xtatish)
npm run dev
```

### **6. Browser'ni refresh qiling:**
```
http://localhost:3000
Ctrl+R
```

---

## 🔐 BIR NECHTA ADMIN QO'SHISH:

Agar bir nechta odam admin bo'lishi kerak bo'lsa:

```typescript
adminTelegramIds: [
  '123456789',  // Siz
  '987654321',  // Boshqa admin
  '555666777',  // Yana biri
],
```

---

## 🎯 KEYINGI QADAMLAR:

1. ✅ **ID'ni toping** (bot orqali yoki @userinfobot)
2. ✅ **initialData.ts'ga qo'shing**
3. ✅ **Server'ni restart qiling**
4. ✅ **Browser'ni refresh qiling**
5. ✅ **Qayta test qiling** — upload ishlashi kerak!

---

## 🐛 TEST QILISH:

### **A) Browser Console'da:**
```javascript
// F12 → Console
const user = JSON.parse(localStorage.getItem('manyak_tv_current_user_v1'));
console.log('User ID:', user?.id);
console.log('Telegram ID:', user?.telegramId);
console.log('Is Admin:', user?.isAdmin);
```

**Kutilgan:**
```
User ID: 123456789
Telegram ID: 123456789
Is Admin: true  ← Bu TRUE bo'lishi kerak!
```

### **B) Admin Panel'ga kirish:**
```
Profile → Admin Panel
```

Agar `isAdmin: false` bo'lsa, Admin Panel tugmasi ko'rinmaydi yoki ochilmaydi.

---

## ✅ ID QO'SHILGANDAN KEYIN:

Upload **avtomatik ishlashi** kerak:

```
🔵 [UPLOAD] Request received:
  User ID: 123456789
  Is Admin: true  ← Bu TRUE bo'ldi!
  ...
✅ [UPLOAD] Success: /uploads/public/content_...
```

---

## 📞 AGAR HALI HAM ISHLAMASA:

ID qo'shganingizdan keyin:

1. **Server'ni to'xtatdingizmi?** (Ctrl+C)
2. **Qayta ishga tushirdingizmi?** (`npm run dev`)
3. **Browser'ni refresh qildingizmi?** (Ctrl+R)
4. **localStorage'da isAdmin: true bo'ldimi?** (yuqoridagi test code)

Agar hammasi TRUE bo'lsa, lekin upload hali ham ishlamasa:
- **Server terminal log'ini ko'rsating**
- **Browser console log'ini ko'rsating**

Men aniq sababni topaman! 🔧
