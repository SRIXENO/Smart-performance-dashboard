# ✅ Deployment Checklist

Use this checklist to ensure your deployment is successful.

---

## Pre-Deployment

- [ ] Code is working locally (frontend + backend)
- [ ] All changes committed to Git
- [ ] Code pushed to GitHub
- [ ] GitHub repository is public or accessible

---

## MongoDB Atlas Setup

- [ ] Account created at mongodb.com/atlas
- [ ] M0 Free cluster created
- [ ] Region selected (Mumbai for India)
- [ ] Database user created
  - [ ] Username: `admin`
  - [ ] Strong password saved securely
  - [ ] Role: Atlas Admin
- [ ] Network Access configured
  - [ ] IP Address: 0.0.0.0/0 (Allow from anywhere)
- [ ] Connection string copied
- [ ] Password replaced in connection string
- [ ] Database name added: `spid_production`
- [ ] Connection string tested (optional: test locally first)

**Your Connection String:**
```
mongodb+srv://admin:________@cluster0._____.mongodb.net/spid_production?retryWrites=true&w=majority
```

---

## Render Backend Deployment

- [ ] Account created at render.com
- [ ] GitHub account connected
- [ ] New Web Service created
- [ ] Repository selected
- [ ] Service configured:
  - [ ] Name: `smart-dashboard-api`
  - [ ] Root Directory: `PROJECT 1/server`
  - [ ] Build Command: `npm install`
  - [ ] Start Command: `npm start`
  - [ ] Instance Type: Free
- [ ] Environment variables added:
  - [ ] NODE_ENV = `production`
  - [ ] PORT = `10000`
  - [ ] MONGODB_URI = [your Atlas connection string]
  - [ ] JWT_SECRET = [random long string]
  - [ ] JWT_EXPIRE = `7d`
  - [ ] COOKIE_EXPIRE = `7`
  - [ ] MAX_FILE_SIZE = `5242880`
  - [ ] FRONTEND_URL = [leave blank initially]
- [ ] Service deployed successfully
- [ ] Status shows "Live"
- [ ] Backend URL copied

**Your Backend URL:**
```
https://________________.onrender.com
```

- [ ] Health check tested: `https://[backend-url]/api/health`
- [ ] Response: `{"success":true,"message":"Server is running"}`

---

## Vercel Frontend Deployment

- [ ] Account created at vercel.com
- [ ] GitHub account connected
- [ ] New Project created
- [ ] Repository imported
- [ ] Project configured:
  - [ ] Framework: Next.js (auto-detected)
  - [ ] Root Directory: `PROJECT 1`
  - [ ] Build Command: `npm run build`
- [ ] Environment variables added:
  - [ ] NEXT_PUBLIC_API_URL = `https://[backend-url]/api`
  - [ ] NEXT_PUBLIC_APP_NAME = `Smart Performance Dashboard`
- [ ] Project deployed successfully
- [ ] Frontend URL copied

**Your Frontend URL:**
```
https://________________.vercel.app
```

- [ ] Frontend loads successfully
- [ ] No console errors in browser

---

## Connect Frontend to Backend

- [ ] Returned to Render dashboard
- [ ] Opened backend service
- [ ] Navigated to Environment tab
- [ ] Updated FRONTEND_URL = `https://[vercel-url]`
- [ ] Saved changes
- [ ] Service redeployed automatically
- [ ] Status shows "Live" again

---

## Database Seeding (Optional)

- [ ] Decided whether to seed production database
- [ ] If yes:
  - [ ] Updated local `server/.env` with production MongoDB URI
  - [ ] Ran `npm run seed` in server directory
  - [ ] Restored local `server/.env` to local MongoDB URI
- [ ] If no:
  - [ ] Plan to create data manually through frontend

---

## Final Testing

### Backend Tests
- [ ] Health endpoint works: `https://[backend-url]/api/health`
- [ ] Returns correct JSON response
- [ ] No errors in Render logs

### Frontend Tests
- [ ] Homepage loads: `https://[frontend-url]`
- [ ] Login page displays correctly
- [ ] No console errors in browser
- [ ] Can register new user
- [ ] Can login with credentials
- [ ] Dashboard loads after login
- [ ] Can navigate between pages
- [ ] Can create a student
- [ ] Can add performance data
- [ ] Charts render correctly
- [ ] Data persists after refresh

### Integration Tests
- [ ] Frontend successfully calls backend APIs
- [ ] No CORS errors
- [ ] Authentication works (login/logout)
- [ ] Data saves to MongoDB Atlas
- [ ] Data retrieves from MongoDB Atlas

---

## Performance Checks

- [ ] First load time acceptable (~30 sec for Render wake-up is normal)
- [ ] Subsequent loads are fast
- [ ] Images and assets load correctly
- [ ] Mobile responsive (test on phone)
- [ ] Works in different browsers (Chrome, Firefox, Safari)

---

## Security Verification

- [ ] Environment variables not exposed in frontend
- [ ] No sensitive data in browser console
- [ ] HTTPS enabled (automatic on Vercel/Render)
- [ ] Cookies working correctly
- [ ] JWT authentication functioning

---

## Documentation

- [ ] README.md updated with deployment info
- [ ] DEPLOYMENT.md reviewed
- [ ] Public URL documented
- [ ] Credentials saved securely (not in Git)

---

## Sharing

- [ ] Public URL tested from different device
- [ ] URL shared with intended users
- [ ] Instructions provided for first-time users
- [ ] Demo account created (optional)

**Share this URL:**
```
🌐 https://[your-vercel-url].vercel.app
```

---

## Monitoring Setup (Optional but Recommended)

- [ ] UptimeRobot configured to ping backend every 5 minutes
- [ ] MongoDB Atlas alerts configured
- [ ] Render email notifications enabled
- [ ] Vercel deployment notifications enabled

---

## Auto-Deploy Verification

- [ ] Made a small code change
- [ ] Committed and pushed to GitHub
- [ ] Verified Vercel auto-deployed
- [ ] Verified Render auto-deployed
- [ ] Changes reflected on live site

---

## Troubleshooting Completed

If you encountered issues, mark what you fixed:

- [ ] Fixed MongoDB connection issues
- [ ] Resolved CORS errors
- [ ] Fixed environment variable problems
- [ ] Resolved build errors
- [ ] Fixed authentication issues
- [ ] Other: ___________________

---

## Post-Deployment

- [ ] Tested all major features
- [ ] Verified data persistence
- [ ] Checked mobile responsiveness
- [ ] Tested from different locations/networks
- [ ] Collected feedback from test users
- [ ] Documented any known issues

---

## Future Enhancements Planned

- [ ] Custom domain setup
- [ ] Email notifications
- [ ] Analytics integration
- [ ] Performance monitoring
- [ ] Backup strategy
- [ ] Upgrade to paid tiers (if needed)

---

## Success Criteria

✅ **Deployment is successful when:**

1. Backend health check returns success
2. Frontend loads without errors
3. Users can register and login
4. Dashboard displays data correctly
5. CRUD operations work (create, read, update, delete)
6. Data persists in MongoDB Atlas
7. App is accessible from any device/location
8. No critical errors in logs

---

## Important URLs to Save

```
MongoDB Atlas Dashboard: https://cloud.mongodb.com
Render Dashboard: https://dashboard.render.com
Vercel Dashboard: https://vercel.com/dashboard

Backend URL: https://________________.onrender.com
Frontend URL: https://________________.vercel.app

GitHub Repo: https://github.com/[username]/[repo-name]
```

---

## Emergency Rollback

If something goes wrong:

1. **Vercel**: Go to Deployments → Select previous working deployment → Promote to Production
2. **Render**: Go to Events → Select previous deployment → Redeploy
3. **MongoDB**: Restore from backup (if configured)

---

## Support Resources

- Render Docs: https://render.com/docs
- Vercel Docs: https://vercel.com/docs
- MongoDB Atlas Docs: https://docs.atlas.mongodb.com
- Next.js Docs: https://nextjs.org/docs
- Express.js Docs: https://expressjs.com

---

**🎉 Congratulations! Your app is deployed and live!**

**Deployment Date:** _______________
**Deployed By:** _______________
**Version:** 1.0.0
