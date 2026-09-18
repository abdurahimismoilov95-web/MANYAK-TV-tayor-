# MANYAK TV — serverga joylashtirish (Railway)

## Nega build ishlamadi

Railpack xatosi shuni ko'rsatdi:

```
✖ Railpack could not determine how to build the app.
The app contents that Railpack analyzed contains:
./
└── manyk-tv/
```

Railpack repo **ildizida** `package.json` izlaydi. Bu loyihada esa u
`manyk-tv/package.json` da — ya'ni bir papka ichida. Railpack ildizda faqat
`manyk-tv/` papkasini ko'rdi va "bu qanday loyiha?" degan savolga javob
topa olmadi.

Kodda xato yo'q — bu faqat **papka joylashuvi** masalasi.

---

## 1-QADAM: Root Directory ni ko'rsatish (majburiy)

Railway'da service sozlamalarida ilova qaysi papkada turganini aytish kerak:

1. Railway loyihasini ochib, **service** ni tanlang
2. **Settings** yorlig'iga o'ting
3. **Root Directory** maydoniga yozing:

```
manyk-tv
```

4. Saqlang va **Redeploy** qiling

Shundan keyin Railpack `manyk-tv/package.json` ni ko'radi va Node loyihasi
sifatida to'g'ri quradi.

> Repoga `manyk-tv/railpack.json` fayli qo'shildi — u Node 22 versiyasini
> qotiradi va ishga tushirish buyrug'ini aniq belgilaydi:
> `node --experimental-sqlite server.js`
> (`node:sqlite` moduli Node 22 da shu flag bilan ishlaydi.)

---

## 2-QADAM: Doimiy disk (Volume) — MA'LUMOTNI SAQLASH UCHUN

⚠️ **Bu qadamni o'tkazib yubormang.** Railway konteyner fayl tizimi
**vaqtinchalik**: har `git push` yoki qayta ishga tushirishda u tozalanadi.

Bu qadamsiz nima yo'qoladi:

| Nima | Qayerda saqlanadi |
|---|---|
| Barcha foydalanuvchilar, VIP obunalar | SQLite bazasi |
| To'lov cheklari | SQLite bazasi |
| Kontent ro'yxati (kinolar, seriallar) | SQLite bazasi |
| Yuklangan **videolar** va chek rasmlari | `uploads/` papkasi |

Ya'ni har deploy'dan keyin sayt **bo'sh** holatga qaytadi.

### Qanday sozlash

1. Railway'da service ustiga → **Variables** yonidagi **+ New** → **Volume**
2. **Mount path** ni `/data` qilib belgilang
3. Quyidagi ikki o'zgaruvchini qo'shing (3-qadamga qarang):

```
DATA_DIR=/data
UPLOADS_DIR=/data/uploads
```

Kod bu o'zgaruvchilarni qo'llab-quvvatlaydi va papkalarni o'zi yaratadi.
O'zgaruvchilar berilmasa, eski (vaqtinchalik) joylar ishlatiladi.

---

## 3-QADAM: Muhit o'zgaruvchilari (Variables)

Railway → service → **Variables** bo'limiga quyidagilarni qo'shing:

```env
NODE_ENV=production

# Doimiy disk (2-qadam)
DATA_DIR=/data
UPLOADS_DIR=/data/uploads

# Telegram bot
TELEGRAM_BOT_TOKEN=<@BotFather dan olingan token>

# Adminlar
SUPER_ADMIN_ID=<sizning Telegram ID>
ADMIN_IDS=<qo'shimcha ID lar, vergul bilan>

# Maxfiy kalitlar — har biri uchun ALOHIDA tasodifiy qiymat
JWT_SECRET=<openssl rand -hex 32>
WEBHOOK_SECRET=<openssl rand -hex 32>
```

### `PORT` haqida

Qo'lda qo'yish **kerak emas** — Railway uni o'zi beradi, server esa
`process.env.PORT` ni o'qiydi.

### `APP_URL` haqida

Qo'lda qo'yish **kerak emas**. Server Railway bergan domenni
(`RAILWAY_PUBLIC_DOMAIN`) avtomatik aniqlaydi va Telegram webhook'ni shu
manzilga o'rnatadi. Agar o'z domeningiz bo'lsa, uni aniq ko'rsatishingiz
mumkin:

```env
APP_URL=https://sizning-domeningiz.com
```

### `NODE_ENV=production` nega muhim

Server maxfiy kalitlar borligini **faqat** `NODE_ENV=production` bo'lganda
majburiy tekshiradi. Bu o'zgaruvchisiz server kalitlar bo'lmasa ham ishga
tushadi va kod ichidagi standart (git'da ochiq yotgan) qiymatlarni
ishlatadi — bunday holatda istalgan odam o'ziga admin tokeni yasab olishi
mumkin.

---

## 4-QADAM: Deploy va tekshirish

Deploy tugagach loglarda quyidagilarni ko'rishingiz kerak:

```
[DB] Baza joylashuvi: /data/manyktv.db
[Config] Ommaviy manzil: https://<sizning-domen>
[Bot] ✅ Bot ulandi: @SizningBot (MANYAK TV)
[Bot] ✅ Webhook o'rnatildi: https://<sizning-domen>/webhook
🚀 MANYK TV SQLite Backend v2.0
```

Agar `[Bot]` qatorlari o'rniga ogohlantirish chiqsa, u **nima
yetishmayotganini aniq aytadi** — masalan token yaroqsiz yoki domen
aniqlanmadi.

### Tez tekshiruvlar

| Tekshiruv | Kutilgan natija |
|---|---|
| `https://<domen>/api/health` | `{"status":"ok",...}` |
| Botga `/start` yuborish | "Kontaktni yuborish" tugmasi chiqadi |
| Kontaktni yuborish | "Hisobingiz tasdiqlandi" |
| Admin panel → **Bot Ulanishini Tekshirish** | `✅ Bot ishlayapti … webhook faol` |

### Telegram Mini App sifatida ochish (ixtiyoriy)

@BotFather → botingiz → **Bot Settings** → **Menu Button** → saytning
manzilini (`https://<domen>`) kiritsangiz, foydalanuvchilar ilovani
to'g'ridan-to'g'ri Telegram ichida ochadi.

---

## Xatolarni bartaraf etish

| Xato | Sabab va yechim |
|---|---|
| `could not determine how to build` | Root Directory `manyk-tv` qilib belgilanmagan (1-qadam) |
| `Frontend build topilmadi (dist/index.html)` | Build bosqichi `npm run build` ni bajarmagan. Service Settings → **Build Command** ga `npm run build` yozib qo'ying |
| `[FATAL] Production rejimida JWT_SECRET va WEBHOOK_SECRET .env da MAJBURIY` | 3-qadamdagi kalitlar qo'shilmagan |
| Bot jim, `[Bot] ⚠️ Ommaviy HTTPS manzil aniqlanmadi` | Service'ga ommaviy domen berilmagan (Settings → Networking → **Generate Domain**) yoki `APP_URL` noto'g'ri |
| `SQLITE_CANTOPEN` | `DATA_DIR` ko'rsatilgan, lekin volume o'sha mount path ga ulanmagan |
| Deploy'dan keyin hamma narsa yo'qoldi | Volume ulanmagan (2-qadam) |
| Video ochilmaydi, rasm 404 | `UPLOADS_DIR` volume ichida emas (2-qadam) |

---

## Muqobil variant: papkani ildizga ko'chirish

Agar Root Directory sozlamasi bilan ishlashni istamasangiz, `manyk-tv/`
ichidagi hamma narsani repo ildiziga ko'chirish mumkin — repo ildizida
boshqa hech narsa yo'q, shuning uchun bu xavfsiz:

```bash
git mv manyk-tv/* manyk-tv/.* . 2>/dev/null
git commit -m "chore: ilovani repo ildiziga ko'chirish"
```

Shundan keyin Railway (va boshqa har qanday platforma) hech qanday
qo'shimcha sozlashsiz ishlaydi. Lekin bu barcha fayl yo'llarini
o'zgartiradi — shuning uchun yuqoridagi Root Directory varianti
oddiyroq va xavfsizroq.
