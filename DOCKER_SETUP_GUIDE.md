# 🐳 DOCKER O'RNATISH VA v2 ISHGA TUSHIRISH

## 🎯 REJA:

1. ✅ Docker Desktop o'rnatish (10 daqiqa)
2. ✅ Docker ishga tushirish
3. ✅ v2 launch qilish (`docker-compose up`)
4. ✅ Test qilish

---

## 📥 1. DOCKER DESKTOP O'RNATISH

### **Download:**

**Official website:**
```
https://www.docker.com/products/docker-desktop/
```

**To'g'ridan-to'g'ri link (Windows):**
```
https://desktop.docker.com/win/main/amd64/Docker%20Desktop%20Installer.exe
```

**Fayl hajmi:** ~600 MB  
**O'rnatish vaqti:** 10-15 daqiqa

---

### **O'rnatish bosqichlari:**

1. **Download tugmasini bosing**
   - Windows uchun versiya avtomatik tanlanadi
   - Fayl: `Docker Desktop Installer.exe`

2. **Installer'ni ishga tushiring**
   - Right-click → "Run as Administrator"
   - "Use WSL 2 instead of Hyper-V" — ✅ belgilang (tavsiya)

3. **O'rnatishni kutasiz**
   - ~10 daqiqa
   - Automatic restart kerak bo'lishi mumkin

4. **Computer restart qiling**
   - O'rnatish tugagandan keyin
   - Majburiy!

5. **Docker Desktop ishga tushiring**
   - Start menu → "Docker Desktop"
   - Birinchi ishga tushishi 2-3 daqiqa davom etadi
   - Pastki panel'da Docker icon ko'rinadi

---

### **Docker ishlayotganini tekshirish:**

Terminal'da (PowerShell):
```powershell
docker --version
docker-compose --version
```

**Kutilgan natija:**
```
Docker version 24.0.x, build ...
Docker Compose version v2.x.x
```

✅ **Agar bu chiqdisa — Docker tayyor!**

---

## 🚀 2. v2'NI ISHGA TUSHIRISH

### **Oddiy 3 qadam:**

#### **1. Terminal oching:**
```powershell
cd manyak-tv-v2
```

#### **2. Docker Compose bilan ishga tushiring:**
```powershell
docker-compose up -d
```

**Bu qanday ishlaydi:**
- `-d` = detached mode (background'da ishlaydi)
- Barcha servislarni avtomatik yuklab oladi va ishga tushiradi
- Birinchi safar: ~5-10 daqiqa (images download)
- Keyingi safar: 30 sekund

**Kutilgan output:**
```
[+] Running 7/7
 ✔ Network manyak-tv-v2_default     Created
 ✔ Container postgres               Started
 ✔ Container redis                  Started
 ✔ Container manyak-tv-v2-api-1     Started
 ✔ Container manyak-tv-v2-web-1     Started
 ✔ Container manyak-tv-v2-bot-1     Started
 ✔ Container manyak-tv-v2-encoder-1 Started
```

#### **3. Status tekshirish:**
```powershell
docker-compose ps
```

**Kutilgan:**
```
NAME                       STATUS              PORTS
manyak-tv-v2-api-1         Up                  0.0.0.0:3000->3000/tcp
manyak-tv-v2-web-1         Up                  0.0.0.0:5173->5173/tcp
manyak-tv-v2-bot-1         Up
manyak-tv-v2-encoder-1     Up
postgres                   Up                  5432/tcp
redis                      Up                  6379/tcp
```

✅ **Barcha "Up" bo'lsa — tayyor!**

---

## 🌐 3. BROWSER'DA OCHISH

### **Services:**

| Service | URL | Tavsif |
|---------|-----|--------|
| **Web App** | `http://localhost:5173` | Asosiy sahifa (React) |
| **API** | `http://localhost:3000` | Backend (NestJS) |
| **API Docs** | `http://localhost:3000/api` | Swagger documentation |

### **Test qiling:**

1. **Web app oching:**
   ```
   http://localhost:5173
   ```

2. **Admin Panel:**
   ```
   Profile → Admin Panel
   ```

3. **Upload test:**
   ```
   Content → + Yangi → Fayl yuklang
   ```

---

## 📊 4. LOG'LARNI KO'RISH

### **Barcha servislar:**
```powershell
docker-compose logs -f
```

### **Bitta servis:**
```powershell
docker-compose logs -f api
docker-compose logs -f web
docker-compose logs -f bot
```

**Exit:** `Ctrl+C`

---

## 🔧 5. FOYDALI COMMANDLAR

### **To'xtatish:**
```powershell
docker-compose down
```

### **Qayta ishga tushirish:**
```powershell
docker-compose restart
```

### **Bitta servisni restart:**
```powershell
docker-compose restart api
docker-compose restart web
```

### **Barcha containerlarni o'chirish (full clean):**
```powershell
docker-compose down -v
```

### **Rebuild (code o'zgargandan keyin):**
```powershell
docker-compose up -d --build
```

---

## 🐛 6. TROUBLESHOOTING

### **Muammo: "docker: command not found"**

**Yechim:**
- Docker Desktop ishga tushganini tekshiring
- Terminal'ni yoping va qayta oching
- Computer restart qiling

---

### **Muammo: "Port already in use"**

**Sabab:** 3000 yoki 5173 port band

**Yechim 1 (tavsiya):**
```powershell
# Port band qilgan dasturni to'xtating
netstat -ano | findstr :3000
netstat -ano | findstr :5173
```

**Yechim 2:** `docker-compose.yml` da portni o'zgartiring

---

### **Muammo: Containers "Exited" holatida**

**Log'larni ko'ring:**
```powershell
docker-compose logs api
docker-compose logs web
```

**Sabab:** Ko'pincha .env faylida xato

**Yechim:**
```powershell
# .env faylini tekshiring
cat .env

# Qayta ishga tushiring
docker-compose down
docker-compose up -d
```

---

### **Muammo: Juda sekin ishlamoqda**

**Yechim:**
- Docker Desktop → Settings → Resources
- CPU: 4+ cores
- Memory: 4+ GB
- Apply & Restart

---

## ✅ 7. SUCCESS CHECKLIST

Test qiling:

- [ ] Docker Desktop o'rnatildi va ishlamoqda
- [ ] `docker --version` ishlaydi
- [ ] `docker-compose up -d` muvaffaqiyatli
- [ ] `docker-compose ps` — barcha "Up"
- [ ] `http://localhost:5173` ochiladi
- [ ] `http://localhost:3000/api` Swagger ko'rinadi
- [ ] Admin Panel'ga kirish mumkin
- [ ] Upload test qilish mumkin

---

## 🎊 8. TAYYOR!

**Agar barcha checklar ✅ bo'lsa:**

🎉 **v2 PROFESSIONAL TARZDA ISHLAMOQDA!**

**Access:**
- **Web:** http://localhost:5173
- **API Docs:** http://localhost:3000/api
- **Admin Panel:** Profile → Admin Panel

---

## 📝 KEYINGI QADAMLAR:

1. ✅ **Test qiling** — Upload, admin panel, etc.
2. ✅ **Data qo'shing** — Content, users, plans
3. ✅ **Deploy qiling** — Railway yoki boshqa hosting

---

## 💡 ESLATMA:

### **Har safar computer restart qilganda:**

Docker Desktop avtomatik ishga tushadi (default).

Agar yo'q bo'lsa:
```powershell
cd manyak-tv-v2
docker-compose up -d
```

### **Code o'zgarganda:**

```powershell
docker-compose up -d --build
```

---

## 🚀 HOZIR QILISH KERAK:

1. **Docker Desktop yuklab oling:**
   ```
   https://www.docker.com/products/docker-desktop/
   ```

2. **O'rnating va restart qiling**

3. **Terminal'da:**
   ```powershell
   cd manyak-tv-v2
   docker-compose up -d
   ```

4. **Browser'da:**
   ```
   http://localhost:5173
   ```

---

**Good luck!** 🐳✨
