# 📢 Telegram Kanal Broadcast Setup

## ✅ QO'SHILDI:

Broadcast admin paneldan yuborilganda:
1. ✅ Telegram kanal: `@Manyak_tv` ga yuboriladi
2. ✅ Barcha foydalanuvchilarga yuboriladi

---

## 🔧 SETUP (Birinchi marta):

### 1. Botni Kanalga Qo'shish

Telegram'da:
1. `@Manyak_tv` kanalingizni oching
2. **Channel Settings** → **Administrators** → **Add Administrator**
3. `@Animanyaktvuzbot` ni qidiring
4. Qo'shish va quyidagi ruxsatlarni bering:
   - ✅ **Post Messages** (Xabar yuborish)
   - ✅ **Edit Messages** (Tahrirlash - optional)
   - ❌ Other permissions (kerak emas)

### 2. Test Qilish

Admin paneldan broadcast yuboring:
- Sarlavha: "Test"
- Matn: "Kanal test xabari"
- Yuborish

**Natija:**
- ✅ Kanal: `@Manyak_tv` da post paydo bo'ladi
- ✅ Barcha foydalanuvchilarga xabar keladi

---

## 📝 CONSOLE LOG:

```
[Broadcast] Boshlandi: { users: 2, hasPhoto: false, hasButton: true }
[Broadcast] Kanalga yuborilmoqda: @Manyak_tv
[Broadcast] ✅ Kanal yuborish muvaffaqiyatli: @Manyak_tv
[Broadcast] User 891846690 ga yuborilmoqda...
[Broadcast] ✅ User 891846690 - Muvaffaqiyatli
[Broadcast] Tugadi: 1 muvaffaqiyatli, 0 bloklagan, Jami: 2
```

---

## 🎯 ISHLATISH:

### Admin Panel → Broadcast Tab:

1. **Sarlavha**: Yangi seriallar!
2. **Xabar matni**: Bugun 10 ta yangi qism qo'shildi
3. **Rasm yuklash**: (optional)
4. **Tugma**: "Veb appka kirish"
5. **Yuborish tugmasi** → "Barcha Foydalanuvchilarga Yuborish"

**Natija:**
```
1️⃣ Kanalga post (public)
2️⃣ Barcha userlarga xabar (private)
```

---

## 🔍 XATO BARTARAF QILISH:

### Xato: "bot is not a member of the channel"

**Sabab:** Bot kanalda admin emas

**Yechim:**
1. `@Manyak_tv` → Settings → Administrators
2. `@Animanyaktvuzbot` ni admin qiling
3. "Post Messages" ruxsatini bering

### Xato: "chat not found"

**Sabab:** Kanal nomi noto'g'ri yoki private

**Yechim:**
1. `.env` da `TELEGRAM_CHANNEL_ID="@Manyak_tv"` to'g'ri ekanligini tekshiring
2. Kanal public bo'lishi kerak (@username bilan)
3. Yoki channel ID ishlatish: `TELEGRAM_CHANNEL_ID="-1001234567890"`

### Channel ID Topish:

Agar `@username` ishlamasa, raqamli ID kerak:

1. Kanalga biror xabar yuboring
2. Forward to `@userinfobot`
3. Bot sizga channel ID beradi: `-1001234567890`
4. `.env` ga kiriting:
   ```env
   TELEGRAM_CHANNEL_ID="-1001234567890"
   ```

---

## 📊 STATISTICS:

Broadcast logda:
```
[Broadcast] ✅ Kanal yuborish muvaffaqiyatli: @Manyak_tv
[Broadcast] Tugadi: 15 muvaffaqiyatli, 2 bloklagan, Jami: 17
```

- Kanal: 1 ta post
- Users: 15 ta message (2 ta bloklagan)

---

## 🎨 KANAL POST FORMATI:

### With Image:
```
[Image]

**Yangi seriallar qo'shildi!**

Bugun 10 ta yangi qism mavjud.

[🎬 Veb appka kirish]
```

### Without Image:
```
**Yangi seriallar qo'shildi!**

Bugun 10 ta yangi qism mavjud.

[🎬 Veb appka kirish]
```

---

## ✅ READY!

**Status:**
- ✅ Code qo'shildi
- ✅ `.env` sozlandi
- ⏳ Botni kanalga admin qilish kerak

**Next:**
1. Botni `@Manyak_tv` ga admin qiling
2. Admin paneldan broadcast test qiling
3. Kanal va userlar xabar olishi kerak

---

**Channel:** https://t.me/Manyak_tv  
**Bot:** @Animanyaktvuzbot
