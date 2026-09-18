# 💳 To'lov Cheki - Telegram Bot Xabarnomasi

To'lov cheki yuborilganda admin botga avtomatik xabar va rasm keladi.

## 📱 Qanday Ishlaydi

### 1️⃣ Foydalanuvchi to'lov qiladi:
```
Frontend → Backend: POST /api/receipts
{
  userId: "891846690",
  userName: "John Doe",
  userPhone: "+998901234567",
  type: "vip_subscription",
  planName: "1 Oylik VIP",
  amount: 39000,
  receiptImageUrl: "/uploads/receipt-123.jpg"
}
```

### 2️⃣ Server chekni saqlaydi va botga yuboradi:
```javascript
// Database'ga saqlash
const receipt = Receipts.submit({ ...data });

// Telegram botga xabar yuborish (RASM BILAN!)
for (const adminId of botAdminIds()) {
  await tgApi('sendPhoto', {
    chat_id: adminId,
    photo: receiptImageUrl,  // ← Chek rasimi
    caption: message,        // ← To'liq ma'lumot
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Tasdiqlash', callback_data: 'approve:rcpt_123' },
        { text: '❌ Rad etish', callback_data: 'reject:rcpt_123' }
      ]]
    }
  });
}
```

### 3️⃣ Admin botda ko'radi:

```
🔔 YANGI TO'LOV CHEKI!

👤 Foydalanuvchi: John Doe
📞 Telefon: +998901234567
🆔 ID: 891846690

📦 VIP Obuna: 1 Oylik VIP
💰 Summa: 39,000 UZS

⏰ Vaqt: 11.09.2026, 15:30
🔗 Chek ID: rcpt_1726058400_abc123

[Chek rasimi ko'rsatiladi]

[✅ Tasdiqlash]  [❌ Rad etish]
```

## 🔐 Xavfsizlik

### Admin IDlarni aniqlash:
```javascript
function botAdminIds() {
  const admins = Admins.getAll();
  const ids = new Set();
  
  // 1. Super Admin (.env dan)
  ids.add(SUPER_ADMIN_ID);
  
  // 2. ENV_ADMIN_IDS (.env ADMIN_IDS)
  ENV_ADMIN_IDS.forEach(id => ids.add(id));
  
  // 3. Database admins
  admins.forEach(a => ids.add(a.id));
  
  return [...ids];
}
```

### Faqat adminlar ko'radi:
- ✅ Bot faqat admin IDlarga yuboradi
- ✅ Oddiy foydalanuvchilar ko'rmaydi
- ✅ Chek egasi ham ko'rmaydi (faqat natijani)

## 📊 Xabar Formati

### VIP Obuna cheki:
```
🔔 YANGI TO'LOV CHEKI!

👤 Foydalanuvchi: John Doe
📞 Telefon: +998901234567
🆔 ID: 891846690

📦 VIP Obuna: 3 Oylik VIP
💰 Summa: 99,000 UZS
🎫 Chegirma: -10,000 UZS
🏷️ Promokod: SUMMER2026

⏰ Vaqt: 11.09.2026, 15:30
🔗 Chek ID: rcpt_1726058400_abc123
```

### Alohida Kontent cheki:
```
🔔 YANGI TO'LOV CHEKI!

👤 Foydalanuvchi: Jane Smith
📞 Telefon: +998905551234
🆔 ID: 123456789

🎬 Kontent: "Оппенгеймер" (2023)
💰 Summa: 15,000 UZS
📝 Izoh: Click orqali o'tkazdim

⏰ Vaqt: 11.09.2026, 15:45
🔗 Chek ID: rcpt_1726058700_xyz789
```

## 🖼️ Chek Rasimi

### Rasm yuboriladi agar:
```javascript
if (photoUrl && photoUrl.startsWith('http')) {
  // ✅ To'liq URL: https://example.com/uploads/receipt.jpg
  // ✅ Server URL: https://yourapp.com/uploads/receipt.jpg
  await tgApi('sendPhoto', { photo: photoUrl });
}
```

### Rasm yuborilmaydi agar:
```javascript
if (!photoUrl || !photoUrl.startsWith('http')) {
  // ❌ Base64: data:image/jpeg;base64,...
  // ❌ Relative path: /uploads/receipt.jpg
  // Faqat matn yuboriladi
  await tgSend(chatId, message);
}
```

### To'g'ri URL yaratish:
```javascript
// Frontend: PaymentModal.tsx
const uploadedUrl = await uploadFileToServer(file);
// → "/uploads/1726058400_abc123.jpg"

// Server: /api/receipts
const fullUrl = APP_URL 
  ? `${APP_URL}${receiptImageUrl}`
  : receiptImageUrl;
// → "https://yourapp.com/uploads/1726058400_abc123.jpg"
```

## 🎯 Inline Tugmalar

### Tasdiqlash/Rad etish:
```javascript
inline_keyboard: [[
  { 
    text: '✅ Tasdiqlash', 
    callback_data: `approve:${receipt.id}` 
  },
  { 
    text: '❌ Rad etish', 
    callback_data: `reject:${receipt.id}` 
  }
]]
```

### Bot tugma bosilganda:
```javascript
// Callback query handler
if (data.startsWith('approve:')) {
  const receiptId = data.replace('approve:', '');
  await processCmd(receiptId, 'approved', from, chat, cbId);
}
```

### Database'da qayta ishlash:
```javascript
const result = Receipts.review(receiptId, adminId, 'approved');
// → VIP beriladi yoki kontent ochiladi
// → Foydalanuvchiga SSE orqali xabar
// → Bot orqali tasdiqlash xabari
```

## 🔄 To'liq Jarayon

```
┌─────────────────────────────────────┐
│ 1. User uploads receipt photo       │
│    PaymentModal → uploadFileToServer│
│    → /uploads/receipt-123.jpg       │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 2. Frontend submits payment receipt │
│    POST /api/receipts               │
│    { receiptImageUrl: "/uploads..." }
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 3. Server saves to database         │
│    Receipts.submit()                │
│    → rcpt_1726058400_abc123         │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 4. Server notifies admins via bot   │
│    tgApi('sendPhoto', {             │
│      photo: fullImageUrl,           │
│      caption: details,              │
│      reply_markup: buttons          │
│    })                               │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 5. Admin sees in Telegram:          │
│    📷 [Receipt Photo]               │
│    📝 User details + amount         │
│    [✅ Approve] [❌ Reject]         │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 6. Admin clicks button              │
│    callback_data: approve:rcpt_123  │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 7. Server grants VIP/Content        │
│    Receipts.review()                │
│    Users.grantVip() / addPurchase() │
└────────────┬────────────────────────┘
             ↓
┌─────────────────────────────────────┐
│ 8. User receives notification       │
│    SSE → payment_decision           │
│    Frontend shows success toast     │
└─────────────────────────────────────┘
```

## 🛠️ Test Qilish

### 1. Lokal test (rasm yo'q):
```bash
# Terminal 1: Server
npm run server

# Terminal 2: Test POST
curl -X POST http://localhost:3001/api/receipts \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_JWT" \
  -d '{
    "userId": "891846690",
    "userName": "Test User",
    "type": "vip_subscription",
    "planName": "1 Oylik",
    "amount": 39000,
    "receiptImageUrl": null
  }'

# Bot'da ko'ring: faqat matn (rasm yo'q)
```

### 2. Production test (rasm bilan):
```bash
# 1. Frontend'dan rasm yuklash
# PaymentModal → Upload receipt image
# → Server: /api/upload
# → Returns: /uploads/receipt-123.jpg

# 2. Submit receipt
# → receiptImageUrl: "https://yourapp.com/uploads/receipt-123.jpg"

# 3. Bot'da ko'ring: rasm + matn + tugmalar ✅
```

## ⚠️ Muammolarni Bartaraf Qilish

### Bot xabar yubormayapti?
```bash
# 1. Bot token tekshiring
echo $TELEGRAM_BOT_TOKEN

# 2. Admin IDlarni tekshiring
node -e "console.log(process.env.SUPER_ADMIN_ID)"
node -e "console.log(process.env.ADMIN_IDS)"

# 3. Bot log'ini ko'ring
npm run server | grep "Receipt Notify"
```

### Rasm ko'rinmayapti?
```bash
# 1. URL formatini tekshiring
# ✅ To'g'ri: https://yourapp.com/uploads/receipt.jpg
# ❌ Xato: /uploads/receipt.jpg
# ❌ Xato: data:image/jpeg;base64,...

# 2. Rasm ochiq ekanligini tekshiring
curl -I https://yourapp.com/uploads/receipt-123.jpg
# → 200 OK bo'lishi kerak

# 3. Telegram'da rasmni tekshiring
# https://api.telegram.org/bot<TOKEN>/sendPhoto
```

### Tugmalar ishlamayapti?
```javascript
// 1. Callback query handler'ni tekshiring
if (update.callback_query) {
  const data = update.callback_query.data;
  console.log('[Callback]', data); // ← Log qo'shing
  
  if (data.startsWith('approve:')) {
    // ✅ Ishlab turganini ko'ring
  }
}
```

## 📈 Monitoring

### Server log'ida:
```
[Receipt Notify] Telegram xabar yuborilmoqda...
[Receipt Notify] Admin 891846690 ga yuborildi ✅
[Receipt Notify] Admin 123456789 ga yuborildi ✅
```

### Xato bo'lsa:
```
[Receipt Notify] Admin 999999999 ga yuborilmadi: Bad Request: chat not found
```

---

**Savol-javob:** Issues'da yozing yoki @your_support_bot
