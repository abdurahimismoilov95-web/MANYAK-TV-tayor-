# Broadcast Yangilanishi ✅

## Qo'shilgan Funksiyalar:

### 1. 📤 Rasm Yuklash
- **File Upload**: Adminlar kompyuterdan rasm yuklashlari mumkin
- **Optimizatsiya**: Sharp bilan avtomatik siqiladi (max 1200px, 85% quality)
- **Limit**: Max 5MB, faqat JPG/PNG/GIF/WEBP
- **Preview**: Yuklangandan keyin ko'rinadi

### 2. 🔘 "Veb Appka Kirish" Tugmasi
- **Tugma matni**: Customizable (default: "Veb appka kirish")
- **URL**: Mini App yoki oddiy web link
- **Inline button**: Xabar ostida Telegram tugmasi sifatida ko'rinadi

### 3. 🛡️ Xavfsizlik
- **Auth**: Faqat adminlar yuklashlari mumkin
- **Rate Limiting**: 50 rasm/soat, 5 broadcast/soat
- **File validation**: Faqat rasm MIME type'lari

## Server Endpoints:

### POST `/api/upload-image`
- **Auth**: Bearer token (admin only)
- **Body**: FormData with `image` field
- **Response**: 
  ```json
  {
    "ok": true,
    "url": "/uploads/1234567890_12345_optimized.jpg",
    "fullUrl": "http://localhost:3001/uploads/1234567890_12345_optimized.jpg"
  }
  ```

### POST `/api/broadcast`
- **Auth**: Bearer token (admin only)
- **Body**:
  ```json
  {
    "text": "<b>Sarlavha</b>\n\nXabar matni",
    "photoUrl": "https://example.com/image.jpg",
    "buttonText": "Veb appka kirish",
    "buttonUrl": "https://t.me/yourbot/app"
  }
  ```

## Frontend Interface:

### AdminPanel → Broadcast Tab:

1. **Sarlavha** (majburiy)
2. **Xabar matni** (majburiy)
3. **Rasm yuklash** (ixtiyoriy):
   - File upload button
   - Yoki URL paste
   - Preview
4. **Tugma** (ixtiyoriy):
   - Tugma matni
   - Tugma URL
5. **Preview** - Xabarning ko'rinishi
6. **Yuborish** tugmasi

## Test Qilish:

```bash
# 1. Server ishga tushiring
npm run server

# 2. Frontend (development)
npm run dev

# 3. Admin panel -> Broadcast tab
# 4. Rasm yuklang yoki URL kiriting
# 5. Tugma URL kiriting (masalan: https://t.me/yourbot/app)
# 6. "Barcha Foydalanuvchilarga Yuborish" bosing
```

## Fayllar O'zgartirildi:

### Backend:
- ✅ `server.js`
  - `multer` import
  - File upload konfiguratsiyasi
  - `/api/upload-image` endpoint
  - `/uploads` static folder
  - Broadcast endpoint'da `buttonText` va `buttonUrl` support

### Frontend:
- ✅ `src/components/AdminPanel.tsx`
  - State: `broadcastButtonText`, `broadcastButtonUrl`, `isUploadingImage`
  - File upload UI
  - Button input fields
  - Submit handler yangilandi

### Dependencies:
- ✅ `package.json`
  - `multer` qo'shildi

## Build:
```
✅ dist/assets/index-BDUU0B2x.js: 1,146.45 kB │ gzip: 230.60 kB
✅ 0 xato, 0 ogohlantirish
```

## Database:
- Yangi table kerak emas
- Faqat `uploads/` papkasi yaratiladi

## Production Deploy:

1. `.env` da `APP_URL` to'g'ri sozlang
2. `uploads/` papkasi server'da mavjud bo'lishi kerak
3. File permissions: write access kerak

---

**Tayyorlandi**: 2026-09-11
**Status**: ✅ Tayyor
