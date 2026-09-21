# 🔄 V1 → V2 MERGE PLAN

## 🎯 MAQSAD

v1'dagi barcha bug fix va tuzatishlarni v2 professional arxitekturasiga ko'chirish.

---

## ✅ V1'DAN OLINGAN TUZATISHLAR:

### **1. Admin Configuration** ⭐
```typescript
// v1: src/data/initialData.ts
adminTelegramIds: ['891846690']
```

**v2'ga qo'shish:**
```env
# .env
SUPER_ADMIN_ID=891846690
ADMIN_IDS=891846690
```

---

### **2. Upload System Improvements** ⭐

#### **A) Debug Logging:**
```typescript
// v1: src/services/storage.ts
console.log('[Upload] 📤 Sending file:', file.name);
console.log('[Upload] Status:', xhr.status);
console.log('[Upload] ✅ Success:', data.url);
```

**v2'ga qo'shish:**
- `apps/api/src/modules/upload/upload.service.ts`
- Har bir bosqichda debug log
- Magic bytes detection logging
- Error xabarlari batafsil

#### **B) Server-side Validation:**
```javascript
// v1: server.js /api/upload
🔵 [UPLOAD] Request received:
  User ID: ...
  Is Admin: ...
  Size limit: ...
✅ [UPLOAD] Success: ...
```

**v2'ga qo'shish:**
- `apps/api/src/modules/upload/upload.controller.ts`
- Request logging
- File type detection logging
- Admin check logging

---

### **3. Frontend Validation** ⭐

#### **A) Default URL'lar olib tashlandi:**
```typescript
// v1: src/components/AdminPanel.tsx
posterUrl: '', // Bo'sh — yuklash majbur
videoUrl: '', // Bo'sh — yuklash majbur
```

**v2'ga qo'shish:**
- `apps/web/src/components/admin/ContentForm.tsx`
- Bo'sh URL bilan boshlash
- Upload majburiy

#### **B) Strict Validation:**
```typescript
// v1: AdminPanel.tsx handleSaveContent
if (!editingContent.posterUrl?.trim()) {
  showNotification('❌ Poster rasmini yuklang!');
  return;
}
```

**v2'ga qo'shish:**
- `apps/web/src/components/admin/ContentForm.tsx`
- Poster required
- Video required (movies)
- Episode required (series)

---

### **4. Database Fixes** ⭐

#### **A) SQLite vs PostgreSQL:**
v2 PostgreSQL ishlatadi — bu to'g'ri! Lekin migration kerak.

#### **B) AuditLogs:**
```typescript
// v1: AuditLogs.add fixed
await AuditLogs.add({
  adminId: req.user.id,
  action: 'UPLOAD_FILE',
  targetId: filename,
  details: `${fileSize} KB`
});
```

**v2'da allaqachon bor:**
- `apps/api/src/modules/audit/audit.service.ts`
- ✅ To'g'ri implemented

---

## 🚀 IMPLEMENTATION QADAMLARI:

### **Step 1: Admin ID Configuration**
```bash
cd manyak-tv-v2
echo "SUPER_ADMIN_ID=891846690" >> .env
echo "ADMIN_IDS=891846690" >> .env
```

### **Step 2: Upload Logging (API)**
```typescript
// apps/api/src/modules/upload/upload.service.ts

async uploadFile(file: Express.Multer.File, userId: string) {
  this.logger.log(`🔵 [UPLOAD] Request received from user ${userId}`);
  this.logger.log(`  File: ${file.originalname} (${(file.size / 1024 / 1024).toFixed(2)} MB)`);
  
  // ... existing code ...
  
  this.logger.log(`✅ [UPLOAD] Success: ${savedPath}`);
  return { url: savedPath };
}
```

### **Step 3: Frontend Validation (Web)**
```typescript
// apps/web/src/components/admin/ContentForm.tsx

const handleSubmit = () => {
  if (!posterUrl?.trim()) {
    toast.error('❌ Poster rasmini yuklang yoki URL kiriting!');
    return;
  }
  
  if (type === 'movie' && !videoUrl?.trim()) {
    toast.error('❌ Video faylini yuklang yoki URL kiriting!');
    return;
  }
  
  // ... save ...
};
```

### **Step 4: Default Empty URLs**
```typescript
// apps/web/src/components/admin/ContentForm.tsx

const initialState = {
  posterUrl: '', // BO'SH — yuklash majbur
  videoUrl: '', // BO'SH — yuklash majbur
  // ... rest
};
```

---

## 📊 TAQQOSLASH:

| Feature | v1 (Fixed) | v2 (Original) | v2 (After Merge) |
|---------|------------|---------------|------------------|
| **Admin ID** | ✅ Set | ❌ Not set | ✅ Will set |
| **Upload Logging** | ✅ Detailed | ⚠️ Basic | ✅ Will add |
| **Frontend Validation** | ✅ Strict | ⚠️ Permissive | ✅ Will add |
| **Default URLs** | ✅ Empty | ❌ External | ✅ Will fix |
| **Database** | SQLite | PostgreSQL | PostgreSQL (better) |
| **Architecture** | Monolith | Microservices | Microservices ✅ |

---

## 🎊 NATIJA:

v2 ENDI:
- ✅ v1'ning barcha tuzatishlari
- ✅ Professional NestJS arxitektura
- ✅ Docker + PostgreSQL
- ✅ Microservices
- ✅ Complete documentation

---

## 📝 TODO:

- [ ] Copy `.env.example` → `.env` va Telegram ID qo'shish
- [ ] Upload service'ga debug logging qo'shish
- [ ] ContentForm'ga validation qo'shish
- [ ] Default URL'larni bo'sh qilish
- [ ] Test qilish

---

**Keyingi qadam:** Commit va test! 🚀
