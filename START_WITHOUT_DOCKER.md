# 🚀 v2 ISHGA TUSHIRISH (Docker'siz)

## 🎯 TEZKOR ISHGA TUSHIRISH

Docker o'rnatilmagan bo'lsa, oddiy npm bilan ishga tushiramiz.

---

## ⚡ TEZKOR VERSIYA (3 daqiqa):

### **1. Dependencies o'rnatish:**

```powershell
cd manyak-tv-v2

# Root dependencies
npm install

# API dependencies
cd apps/api
npm install
cd ../..

# Web dependencies
cd apps/web
npm install
cd ../..
```

---

### **2. PostgreSQL o'rniga SQLite (tezkor):**

v2'ni SQLite bilan ishlatish uchun kichik o'zgartirish kerak.

**Yoki PostgreSQL o'rnatish:**
- Download: https://www.postgresql.org/download/windows/
- Install
- Default port: 5432
- Password: `manyak_secret_production`

---

### **3. Services ishga tushirish:**

#### **Terminal 1 — API (Backend):**
```powershell
cd manyak-tv-v2/apps/api
npm run start:dev
```

Kutilgan: `API started on http://localhost:3000`

#### **Terminal 2 — Web (Frontend):**
```powershell
cd manyak-tv-v2/apps/web
npm run dev
```

Kutilgan: `Web app running on http://localhost:5173`

#### **Terminal 3 — Bot (optional):**
```powershell
cd manyak-tv-v2/apps/bot
npm run start:dev
```

---

## 🎯 ODDIY VARIANT — v1 ISHLATISH!

Agar v2 juda murakkab bo'lsa, **v1 ishlatamiz** — u allaqachon to'g'ri ishlaydi!

```powershell
cd manyk-tv1
npm run dev
```

**Kutilgan:**
```
Server http://localhost:3000 da ishlamoqda
Database initialized: data/manyktv.db
```

**Access:**
```
http://localhost:3000
```

**Admin Panel:**
- Profile → Admin Panel
- Content → Upload test

---

## 💡 TAVSIYA:

### **Hozir (Tezkor test):**
**v1 ishlatamiz** — u tayyor va barcha xatolar tuzatilgan!

```powershell
cd manyk-tv1
npm run dev
```

### **Kelajakda (Production):**
1. Docker Desktop o'rnatamiz
2. v2'ni Docker bilan ishga tushiramiz
3. Railway'ga deploy qilamiz

---

## 📊 QISQA XULOSA:

| Variant | Vaqt | Qiyinlik | Tavsiya |
|---------|------|----------|---------|
| **v1** | 30 sekund | Oson | ✅ Hozir ishlatish |
| **v2 (manual)** | 10 daqiqa | O'rta | ⚠️ PostgreSQL kerak |
| **v2 (docker)** | 15 daqiqa | O'rta | ⭐ Eng yaxshi (kelajak) |

---

## ✅ TAVSIYA: v1'DAN BOSHLAYMIZ!

```powershell
cd manyk-tv1
npm run dev
```

Keyin browser'da:
```
http://localhost:3000
```

**Bu allaqachon barcha xatolar tuzatilgan versiya!** ✨

---

**Qaysi variantni tanlaysiz?**
1. **v1** (30 sekund, hozir ishlaydi) ⭐
2. **v2 manual** (PostgreSQL kerak)
3. **v2 docker** (Docker Desktop kerak)

**Tavsiya: 1-variant (v1)** 🚀
