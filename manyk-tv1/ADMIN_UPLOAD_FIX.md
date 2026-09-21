# 🔧 Admin Panel File Upload Fix Guide

## 🐛 Muammo: Video va poster yuklash ishlamayapti

### ✅ Tuzatildi:

**1. Debug Logging Qo'shildi** (`src/services/storage.ts`)
- Upload jarayonini kuzatish uchun console.log qo'shildi
- Error handling yaxshilandi
- Progress tracking to'g'rilandi

### 🔍 Debug Qilish:

**1. Browser Console'ni Oching:**
```
F12 -> Console tab
```

**2. File Upload Qiling va Quyidagilarni Ko'ring:**
```
[Upload] 📤 Sending file: movie.mp4 (150.25 MB)
[Upload] Status: 200 Response: {"ok":true,"url":"/uploads/public/..."}
[Upload] ✅ Success: /uploads/public/content_1234567890_abc123.mp4
```

**3. Agar Xato Bo'lsa:**
```
[Upload] ❌ Error: Fayl formati aniqlanmadi yoki qo'llab-quvvatlanmaydi
```

---

## 🛠️ Umumiy Muammolar va Yechimlar:

### **Muammo 1: "Fayl formati aniqlanmadi"**

**Sabab:** Server fayl formatini magic bytes orqali aniqlay olmayapti.

**Yechim:**
1. Faylni boshqa formatga convert qiling:
   ```bash
   # FFmpeg bilan MP4 ga convert qilish
   ffmpeg -i input.avi -c:v libx264 -c:a aac output.mp4
   ```

2. Yoki quyidagi formatlardan foydalaning:
   - **Video:** MP4, WebM, MOV
   - **Rasm:** JPG, PNG, WEBP

### **Muammo 2: "Fayl juda katta"**

**Sabab:** File size limit oshib ketgan.

**Yechim:**
1. Faylni compress qiling:
   ```bash
   # FFmpeg bilan siqish
   ffmpeg -i input.mp4 -c:v libx264 -crf 28 -c:a aac output.mp4
   ```

2. Yoki server.js'da limit'ni oshiring:
   ```javascript
   const ADMIN_UPLOAD_LIMIT = '5gb'; // Hozirda 2GB
   ```

### **Muammo 3: "Network error"**

**Sabab:** Server ishlamayapti yoki connection muammosi.

**Yechim:**
1. Server ishlab turganini tekshiring:
   ```bash
   curl http://localhost:3000/api/health
   ```

2. Agar server to'xtagan bo'lsa, qayta ishga tushiring:
   ```bash
   npm run dev
   ```

### **Muammo 4: "Token yaroqsiz"**

**Sabab:** Auth token muddati o'tgan.

**Yechim:**
1. Logout qiling va qayta login qiling
2. Browser cache'ni tozalang (Ctrl+Shift+Delete)

---

## 🧪 Manual Test:

### **Terminal'da Test Qilish:**

```bash
# 1. Login qiling va token oling
curl -X POST http://localhost:3000/api/auth/telegram \
  -H "Content-Type: application/json" \
  -d '{"initData":"query_id=...", "telegramId":"YOUR_ID"}'

# 2. File upload qiling
curl -X POST "http://localhost:3000/api/upload?ext=mp4" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: video/mp4" \
  --data-binary "@movie.mp4"
```

**Expected Response:**
```json
{
  "ok": true,
  "url": "/uploads/public/content_1234567890_abc123.mp4"
}
```

---

## 📝 Server Log'larni Ko'rish:

```bash
# Terminal'da server loglarini kuzating
npm run dev

# Quyidagilarni izlang:
# [Upload] ...
# [Privacy] ...
# [Auth] ...
```

---

## 🔧 Agar Hali Ham Ishlamasa:

### **1. Server'ni Restart Qiling:**
```bash
# Ctrl+C (servernitoxtating)
npm run dev
```

### **2. node_modules'ni Qayta O'rnating:**
```bash
rm -rf node_modules package-lock.json
npm install
```

### **3. Port'ni Tekshiring:**
```bash
# Port band bo'lsa:
netstat -ano | findstr :3000
# Process'ni to'xtating va qayta ishlating
```

### **4. uploads/ Papkasini Tekshiring:**
```bash
# Papka mavjudligini va write permission borligini tekshiring
ls -la uploads/public
ls -la uploads/private

# Agar yo'q bo'lsa, yarating:
mkdir -p uploads/public uploads/private
chmod 755 uploads uploads/public uploads/private
```

---

## ✅ Ishlab Turgan Bo'lsa:

**Success Indicators:**
- ✅ Progress bar ko'rsatiladi (0% -> 100%)
- ✅ "Yuklandi" yoki "Video yuklandi" yozuvi chiqadi
- ✅ Preview ko'rsatiladi (rasm yoki video thumbnail)
- ✅ URL `/uploads/public/...` formatida
- ✅ Saqlanganda database'ga yoziladi

---

## 🎯 Summary:

**Changed Files:**
1. ✅ `src/services/storage.ts` - Added debug logging
2. ✅ `ADMIN_UPLOAD_FIX.md` - This guide

**What to Check:**
1. Browser console for upload logs
2. Server terminal for errors
3. uploads/public directory for files
4. Network tab (F12 -> Network) for request/response

**Common Solutions:**
1. Convert file to MP4/WebM
2. Compress large files
3. Restart server
4. Clear browser cache
5. Re-login to get new token

---

**If still not working, check:**
- Browser console
- Server logs
- Network requests (F12 -> Network)
- File permissions

**Agar muammo davom etsa, screenshot yuboring! 📸**
