# 🚀 Quick Deployment Reference

## Essential URLs
- MongoDB Atlas: https://mongodb.com/atlas
- Render: https://render.com
- Vercel: https://vercel.com

---

## MongoDB Atlas Setup (5 minutes)

```
1. Create M0 Free Cluster (Mumbai region)
2. Database Access → Add User
   - Username: admin
   - Password: [your-password]
   - Role: Atlas Admin
3. Network Access → Add IP → 0.0.0.0/0
4. Connect → Drivers → Copy connection string
```

**Connection String Format:**
```
mongodb+srv://admin:PASSWORD@cluster0.xxxxx.mongodb.net/spid_production?retryWrites=true&w=majority
```

---

## Render Backend Setup (10 minutes)

**Service Configuration:**
```
Name: smart-dashboard-api
Root Directory: PROJECT 1/server
Build Command: npm install
Start Command: npm start
Instance Type: Free
```

**Environment Variables:**
```
NODE_ENV=production
PORT=10000
MONGODB_URI=[your-atlas-connection-string]
JWT_SECRET=[random-long-string]
JWT_EXPIRE=7d
COOKIE_EXPIRE=7
MAX_FILE_SIZE=5242880
FRONTEND_URL=[leave-blank-initially]
```

**Your Backend URL:**
```
https://smart-dashboard-api.onrender.com
```

---

## Vercel Frontend Setup (5 minutes)

**Project Configuration:**
```
Framework: Next.js (auto-detected)
Root Directory: PROJECT 1
Build Command: npm run build (auto)
```

**Environment Variables:**
```
NEXT_PUBLIC_API_URL=https://[your-render-url].onrender.com/api
NEXT_PUBLIC_APP_NAME=Smart Performance Dashboard
```

**Your Frontend URL:**
```
https://smart-performance-dashboard.vercel.app
```

---

## Final Step: Connect Frontend to Backend

1. Go to Render Dashboard
2. Environment tab
3. Update `FRONTEND_URL` = `https://[your-vercel-url].vercel.app`
4. Save (auto-redeploys)

---

## Test Your Deployment

**Backend Health:**
```
https://[your-render-url].onrender.com/api/health
```

**Frontend:**
```
https://[your-vercel-url].vercel.app
```

---

## Quick Troubleshooting

| Problem | Solution |
|---------|----------|
| Backend not responding | Check Render logs, verify MONGODB_URI |
| CORS errors | Verify FRONTEND_URL on Render |
| Database connection failed | Check MongoDB Network Access (0.0.0.0/0) |
| Slow first load | Normal! Free tier sleeps after 15 min |

---

## Auto-Deploy

```bash
git add .
git commit -m "Update"
git push origin main
```

Both Render and Vercel auto-deploy on push! ✅

---

## Share Your App

```
🌐 Public URL: https://your-app.vercel.app
📱 Works on any device, anywhere in the world!
```

---

**Total Setup Time: ~20 minutes**
**Cost: $0 (100% Free)**
