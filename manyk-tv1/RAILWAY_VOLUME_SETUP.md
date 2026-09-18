# Railway Volume - Bosqichma-bosqich Qo'llanma

## 1. Railway Dashboard'ga kiring

```
https://railway.app
```

Login qiling va project'ingizni tanlang.

---

## 2. Volume qo'shish

### A. Service'ni tanlang
- Project'da **manyak-tv** service'ni bosing
- Yoki qaysi service database/uploads ishlatayotgan bo'lsa, uni tanlang

### B. Settings → Volumes
1. **Settings** tab'ni bosing
2. **Volumes** bo'limiga scroll qiling
3. **+ New Volume** tugmasini bosing

---

## 3. Database Volume yaratish

**Volume Settings:**
```
Name: manyak-tv-database
Mount Path: /app/data
```

**Tushuntirish:**
- `Mount Path: /app/data` - bu server.js'dagi `./data/manyktv.db` manzili
- Railway containerda `/app/` papkada ishlaydi
- `/app/data/manyktv.db` = `./data/manyktv.db` (server.js'da)

**Save** bosing.

---

## 4. Uploads Volume yaratish

**Volume Settings:**
```
Name: manyak-tv-uploads
Mount Path: /app/uploads
```

**Save** bosing.

---

## 5. Backups Volume yaratish (ixtiyoriy)

**Volume Settings:**
```
Name: manyak-tv-backups
Mount Path: /app/backups
```

**Save** bosing.

---

## 6. Redeploy

Volume qo'shilgandan keyin:
1. **Deployments** tabga o'ting
2. **Redeploy** tugmasini bosing yoki
3. Git'ga yangi commit push qiling

---

## 7. Tekshirish

### Railway Logs'da qidiring:
```
[DB] Baza joylashuvi: /app/data/manyktv.db
```

Agar ko'rsatilsa - Volume ishlayapti! ✅

---

## 8. Eski Ma'lumotlarni Ko'chirish

Agar ilgari ma'lumotlar bor bo'lsa (lekin ephemeral'da):

### A. Railway Shell'ga kiring
```bash
railway shell
```

### B. Ma'lumotlarni tekshiring
```bash
ls -lah /app/data/
ls -lah /app/uploads/
```

### C. Agar ma'lumotlar yo'q bo'lsa
Volume yangi bo'lsa, bo'sh bo'ladi. Serveringiz yangi database yaratadi.

**Eski database bor edi, lekin yo'qolgan bo'lsa:**
- Afsuski, ephemeral filesystem'dagi ma'lumotlar tiklanmaydi
- Yangi ma'lumotlar to'plashga to'g'ri keladi
- Shuning uchun **Volume darhol qo'shish kerak edi!**

---

## 9. Volume Hajmini Kengaytirish

Agar joy yetmasa:
1. **Settings** → **Volumes**
2. Volume'ni tanlang
3. **Resize** tugmasini bosing
4. Yangi hajmni kiriting (masalan: 10GB)

---

## 10. Volume O'chirish (Ehtiyot bo'ling!)

⚠️ **DIQQAT:** Volume o'chirilsa, barcha ma'lumotlar yo'qoladi!

1. Avval backup oling
2. **Settings** → **Volumes**
3. Volume'ni tanlang
4. **Delete Volume** → Tasdiqlang

---

## Xulosa

✅ Volume qo'shilgandan keyin:
- Database saqlanadi (/app/data/)
- Videolar saqlanadi (/app/uploads/)
- Backuplar saqlanadi (/app/backups/)
- Server restart bo'lsa ham ma'lumotlar yo'qolmaydi!

---

## Qo'shimcha: Volume bilan server.js

`server.js`'da hech narsani o'zgartirish shart emas!

```javascript
// Bu kod avtomatik ishlaydi
const DB_PATH = process.env.DATABASE_URL || './data/manyktv.db';
// Railway'da: /app/data/manyktv.db (Volume'da)
```

**Faqat Volume mount path'ini to'g'ri yozish kerak:**
- Mount Path: `/app/data` ✅
- Mount Path: `/data` ❌ (noto'g'ri)

---

## Muammo Yuzaga Kelsa

### Volume ko'rinmayapti?
```bash
railway shell
ls -lah /app/
```

Agar `/app/data/` yo'q bo'lsa - Volume mount path noto'g'ri.

### Ma'lumotlar saqlanmayapdi?
```bash
railway shell
ls -lah /app/data/
cat /app/data/manyktv.db
```

Agar fayl yo'q bo'lsa - server hali database yaratmagan.

### Railway CLI yordami:
```bash
# Volume list
railway volumes

# Volume inspect
railway volumes inspect manyak-tv-database
```

---

## Support

Railway docs: https://docs.railway.app/reference/volumes
