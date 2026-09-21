# ✅ DEPLOYMENT CHECKLIST

**Pre-deployment verification for MANYAK TV V2**

---

## 🔍 PRE-DEPLOYMENT CHECKS

### Code Quality ✅
- [x] All services build successfully
- [x] No TypeScript errors
- [x] No console errors in development
- [x] Database migrations created
- [x] Prisma schema validated

### Configuration ✅
- [x] `.env` files configured
- [x] `package.json` scripts ready
- [x] `railway.json` created
- [x] `nixpacks.toml` for FFmpeg
- [x] `.railwayignore` to exclude files

### Documentation ✅
- [x] `RAILWAY_DEPLOYMENT_GUIDE.md` - Full guide
- [x] `RAILWAY_QUICK_START.md` - 15-min guide
- [x] `V2_100_PERCENT_COMPLETE.md` - Status report
- [x] `README.md` exists

---

## 🚀 DEPLOYMENT STEPS

### GitHub
- [ ] Code committed to git
- [ ] Pushed to GitHub
- [ ] Repository is public or Railway has access
- [ ] Branch is `main` or `master`

### Railway Project
- [ ] Railway account created
- [ ] New project created
- [ ] GitHub repo connected
- [ ] Project name set: "MANYAK TV V2"

### Databases
- [ ] PostgreSQL added
- [ ] Redis added
- [ ] Database URLs noted
- [ ] Connection strings tested

### API Service
- [ ] Service created from GitHub
- [ ] Build command set: `npm run build:api`
- [ ] Start command set: `npm run start:api`
- [ ] Environment variables configured
- [ ] Domain generated
- [ ] Deployment successful
- [ ] Health check passes: `/health`

### Bot Service
- [ ] Service created from GitHub
- [ ] Build command set: `npm run build:bot`
- [ ] Start command set: `npm run start:bot`
- [ ] Environment variables configured
- [ ] Domain generated
- [ ] Deployment successful
- [ ] Health check passes

### Encoder Service
- [ ] Service created from GitHub
- [ ] Build command set: `npm run build:encoder`
- [ ] Start command set: `npm run start:encoder`
- [ ] FFmpeg available (nixpacks.toml)
- [ ] Environment variables configured
- [ ] Deployment successful

### Web Service
- [ ] Service created from GitHub
- [ ] Root directory set: `apps/web`
- [ ] Build command set
- [ ] Start command set
- [ ] Environment variables configured
- [ ] Domain generated
- [ ] Deployment successful
- [ ] Web app loads in browser

---

## 🔧 POST-DEPLOYMENT CHECKS

### Service Health
- [ ] API: `curl https://api-xxx.railway.app/health`
- [ ] Bot: `curl https://bot-xxx.railway.app/webhook/health`
- [ ] Encoder: Service is running (check logs)
- [ ] Web: Opens in browser

### Functionality Tests
- [ ] Web app loads
- [ ] Login works (Telegram)
- [ ] Home page shows content
- [ ] Video playback works
- [ ] Search works
- [ ] Favorites work
- [ ] Admin panel accessible
- [ ] Content upload works
- [ ] Video encoding works

### Telegram Bot
- [ ] Bot responds to `/start`
- [ ] Web App button appears
- [ ] Web App opens from Telegram
- [ ] Telegram WebApp API works
- [ ] User authentication works

### Database
- [ ] Migrations applied
- [ ] Tables created
- [ ] Sample data accessible
- [ ] Queries are fast
- [ ] No connection errors

---

## 🔒 SECURITY CHECKS

### Secrets
- [ ] `JWT_SECRET` changed from default
- [ ] Strong random values (64+ chars)
- [ ] Database password is strong
- [ ] No secrets in code/git

### Access Control
- [ ] `SUPER_ADMIN_ID` is correct
- [ ] `ADMIN_IDS` list is complete
- [ ] Non-admins can't access admin features
- [ ] Authentication works correctly

### CORS
- [ ] API accepts requests from Web domain
- [ ] API accepts requests from Telegram
- [ ] Other origins are blocked
- [ ] Preflight requests work

### Rate Limiting
- [ ] Rate limiting is enabled
- [ ] Limits are reasonable
- [ ] No false positives
- [ ] Excessive requests are blocked

---

## 📊 MONITORING SETUP

### Railway Dashboard
- [ ] All services show "Active"
- [ ] No deployment errors
- [ ] Logs are clean
- [ ] Metrics look normal

### External Monitoring (Optional)
- [ ] UptimeRobot configured
- [ ] Sentry error tracking setup
- [ ] Log aggregation (LogTail)
- [ ] Analytics (Google Analytics)

### Alerts
- [ ] Email notifications enabled
- [ ] Telegram alerts (optional)
- [ ] Discord webhooks (optional)

---

## 💰 COST VERIFICATION

### Railway Plan
- [ ] Free tier ($5 credit) or Pro ($20/month)
- [ ] Credit card added (for Pro)
- [ ] Billing alerts set

### Resource Usage
- [ ] Check estimated monthly cost
- [ ] Monitor CPU usage
- [ ] Monitor memory usage
- [ ] Monitor network usage

### Optimization
- [ ] Unused services removed
- [ ] Resource limits set appropriately
- [ ] Auto-scaling configured (if Pro)

---

## 📱 USER ACCEPTANCE

### Test Users
- [ ] Admin account works
- [ ] Regular user account works
- [ ] VIP user features work
- [ ] Guest browsing works

### Mobile Testing
- [ ] iPhone/iOS tested
- [ ] Android tested
- [ ] iPad/Tablet tested
- [ ] Responsive design works

### Browser Testing
- [ ] Chrome tested
- [ ] Safari tested
- [ ] Firefox tested
- [ ] Mobile browsers tested

---

## 🚨 ROLLBACK PLAN

### If Deployment Fails
1. Check Railway logs for errors
2. Verify environment variables
3. Test database connection
4. Check build commands
5. Redeploy if needed
6. Contact Railway support if stuck

### Emergency Contacts
- Railway Support: https://discord.gg/railway
- Team Members: [Add contact info]
- Backup Plan: Deploy to Render or Vercel

---

## 📝 FINAL SIGN-OFF

### Deployment Team
- [ ] Developer tested: ________________
- [ ] QA approved: ________________  
- [ ] Admin approved: ________________
- [ ] Users notified: ________________

### Deployment Date/Time
- Date: ______________
- Time: ______________
- Timezone: ______________
- Deployed by: ______________

### Domain URLs
- Web: ______________
- API: ______________
- Bot: ______________
- Encoder: ______________

---

## 🎉 GO LIVE!

**When all checks pass:**

1. ✅ Mark this checklist complete
2. ✅ Notify users via Telegram channel
3. ✅ Share web app link
4. ✅ Monitor for first 24 hours
5. ✅ Celebrate! 🎊

---

**Status:** 
- [ ] Not Started
- [ ] In Progress
- [ ] Testing
- [ ] **LIVE** ✅

---

**Notes:**
_Add any deployment notes, issues encountered, or special configurations here._
