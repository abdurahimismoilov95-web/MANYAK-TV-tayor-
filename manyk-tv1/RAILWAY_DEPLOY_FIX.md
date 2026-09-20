# 🐛 Railway Deploy Fix - Duplicate Export Error

## ❌ MUAMMO

```
SyntaxError: Duplicate export of 'VerificationCodes'
file:///app/database.pg.js:1337
```

## 🔍 SABAB

`database.pg.js` faylida `VerificationCodes` ikki marta export qilingan edi:

1. **Line 1029:** `export const VerificationCodes = { ... }`  (Base version)
2. **Line 1337:** `export { VerificationCodesExtended as VerificationCodes };` (Extended version)

Node.js bir xil nom bilan ikki marta export qilishga ruxsat bermaydi.

## ✅ YECHIM

### O'zgartirildi:

**Before:**
```javascript
// Line 1029
export const VerificationCodes = {
  async create(code) { ... },
  async getByCode(code) { ... },
  // ...
};

// Line 1287
const VerificationCodesExtended = {
  ...VerificationCodes,  // ❌ Reference to exported const
  isExpired(row) { ... },
  // ...
};

// Line 1337
export { VerificationCodesExtended as VerificationCodes };  // ❌ Duplicate!
```

**After:**
```javascript
// Line 1029
const VerificationCodesBase = {  // ✅ Internal const (not exported)
  async create(code) { ... },
  async getByCode(code) { ... },
  // ...
};

// Line 1287
const VerificationCodesExtended = {
  ...VerificationCodesBase,  // ✅ Reference to internal const
  isExpired(row) { ... },
  // ...
};

// Line 1337
export { VerificationCodesExtended as VerificationCodes };  // ✅ Single export
```

### Tuzatilgan funksiyalar:

1. `VerificationCodes` → `VerificationCodesBase` (internal)
2. `...VerificationCodes` → `...VerificationCodesBase`
3. `VerificationCodes.updateStatus` → `VerificationCodesBase.updateStatus`
4. `VerificationCodes.cleanup` → `VerificationCodesBase.cleanup`

## 🚀 DEPLOY

```bash
# Commit qilindi:
git commit -m "🐛 Fix: Duplicate VerificationCodes export"

# Push (manual or automatic):
git push origin main
```

Railway avtomatik redeploy qiladi va xato tuzatiladi.

## ✅ VERIFICATION

Deploy'dan keyin:

```bash
# Health check
curl https://your-app.up.railway.app/api/health
# Expected: {"ok":true,"status":"online"}

# Check logs
railway logs
# Should see: [PostgreSQL] ✅ Schema initialized
# Should NOT see: SyntaxError: Duplicate export
```

## 📊 STATUS

- ✅ Duplicate export tuzatildi
- ✅ Syntax check passed locally
- ✅ Commit qilindi
- ⏳ Push/Deploy (manual if needed)

---

**Tuzatildi:** 2026-09-20  
**Commit:** bf46b9e  
**Status:** ✅ **READY FOR REDEPLOY**
