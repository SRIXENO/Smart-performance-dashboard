# 🚀 Deployment Guide - Smart Performance Dashboard

Deploy your application online for **FREE** and share it with anyone worldwide!

## 🌐 Deployment Stack (All Free)

| Service | Purpose | URL |
|---------|---------|-----|
| **MongoDB Atlas** | Cloud Database | [mongodb.com/atlas](https://mongodb.com/atlas) |
| **Render** | Backend Hosting | [render.com](https://render.com) |
| **Vercel** | Frontend Hosting | [vercel.com](https://vercel.com) |
| **GitHub** | Code Repository | [github.com](https://github.com) |

---

## 📋 Pre-Deployment Checklist

- [ ] GitHub account created
- [ ] Code pushed to GitHub repository
- [ ] MongoDB Atlas account ready
- [ ] Render account ready
- [ ] Vercel account ready

---

## STEP 1: Set Up MongoDB Atlas (Cloud Database)

### Why MongoDB Atlas?
Your local MongoDB won't be accessible online. Atlas provides a free cloud database accessible from anywhere.

### Setup Instructions

1. **Create Account**
   - Go to [mongodb.com/atlas](https://mongodb.com/atlas)
   - Sign up for free (use Google/GitHub for quick signup)

2. **Create Free Cluster**
   - Click "Build a Database"
   - Select **M0 FREE** tier (512MB storage, free forever)
   - Choose region: **Mumbai** (for India) or closest to your location
   - Cluster name: `smart-dashboard-cluster` (or any name)
   - Click "Create"

3. **Create Database User**
   - Go to **Database Access** (left sidebar)
   - Click "Add New Database User"
   - Authentication Method: **Password**
   - Username: `admin`
   - Password: Create a strong password (save it securely!)
   - Database User Privileges: **Atlas Admin**
   - Click "Add User"

4. **Configure Network Access**
   - Go to **Network Access** (left sidebar)
   - Click "Add IP Address"
   - Select **"Allow Access from Anywhere"** (0.0.0.0/0)
   - Click "Confirm"
   
   > ⚠️ This allows connections from any IP. For production, you can restrict to specific IPs later.

5. **Get Connection String**
   - Go to **Database** → **Clusters**
   - Click "Connect" on your cluster
   - Select "Drivers"
   - Copy the connection string (looks like this):
   ```
   mongodb+srv://admin:<password>@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
   ```
   - Replace `<password>` with your actual password
   - Add database name before the `?`:
   ```
   mongodb+srv://admin:YourPassword@cluster0.xxxxx.mongodb.net/spid_production?retryWrites=true&w=majority
   ```

**Save this connection string** - you'll need it for Render!

---

## STEP 2: Deploy Backend on Render

### Setup Instructions

1. **Create Render Account**
   - Go to [render.com](https://render.com)
   - Sign up with GitHub (recommended for auto-deploy)

2. **Create New Web Service**
   - Click "New +" → "Web Service"
   - Connect your GitHub account if not already connected
   - Select your repository: `Smart-performance-dashboard`
   - Click "Connect"

3. **Configure Web Service**

   Fill in these settings:

   | Field | Value |
   |-------|-------|
   | **Name** | `smart-dashboard-api` |
   | **Region** | Singapore (closest to India) |
   | **Branch** | `main` (or your default branch) |
   | **Root Directory** | `PROJECT 1/server` |
   | **Runtime** | `Node` |
   | **Build Command** | `npm install` |
   | **Start Command** | `npm start` |
   | **Instance Type** | `Free` |

4. **Add Environment Variables**

   Click "Advanced" → "Add Environment Variable"
   
   Add these variables one by one:

   | Key | Value | Example |
   |-----|-------|---------|
   | `NODE_ENV` | `production` | production |
   | `PORT` | `10000` | 10000 |
   | `MONGODB_URI` | Your Atlas connection string | mongodb+srv://admin:pass@... |
   | `JWT_SECRET` | Random long string | mySecretKey123456789abc |
   | `JWT_EXPIRE` | `7d` | 7d |
   | `COOKIE_EXPIRE` | `7` | 7 |
   | `MAX_FILE_SIZE` | `5242880` | 5242880 |
   | `FRONTEND_URL` | Leave blank for now | (fill after Step 3) |
   | `GOOGLE_CLIENT_ID` | Your Google Client ID | (optional) |
   | `GOOGLE_CLIENT_SECRET` | Your Google Secret | (optional) |
   | `GOOGLE_CALLBACK_URL` | Your callback URL | (optional) |

   > 💡 **JWT_SECRET**: Generate a random string like `openssl rand -base64 32` or use any long random text

5. **Deploy**
   - Click "Create Web Service"
   - Render will start building and deploying (takes 2-3 minutes)
   - Wait for "Live" status

6. **Copy Your Backend URL**
   - Once deployed, copy the URL (top of the page)
   - Format: `https://smart-dashboard-api.onrender.com`
   - **Save this URL** - you'll need it for Vercel!

7. **Test Backend**
   - Open: `https://your-backend-url.onrender.com/api/health`
   - Should return: `{"success":true,"message":"Server is running"}`

> ⚠️ **Important**: Free Render services sleep after 15 minutes of inactivity. First request takes ~30 seconds to wake up. This is normal!

---

## STEP 3: Deploy Frontend on Vercel

### Setup Instructions

1. **Create Vercel Account**
   - Go to [vercel.com](https://vercel.com)
   - Sign up with GitHub (recommended)

2. **Import Project**
   - Click "Add New..." → "Project"
   - Select your GitHub repository
   - Click "Import"

3. **Configure Project**

   Vercel auto-detects Next.js ✅

   | Field | Value |
   |-------|-------|
   | **Framework Preset** | Next.js (auto-detected) |
   | **Root Directory** | `PROJECT 1` |
   | **Build Command** | `npm run build` (auto) |
   | **Output Directory** | `.next` (auto) |
   | **Install Command** | `npm install` (auto) |

4. **Add Environment Variables**

   Click "Environment Variables" section:

   | Key | Value |
   |-----|-------|
   | `NEXT_PUBLIC_API_URL` | `https://your-backend-url.onrender.com/api` |
   | `NEXT_PUBLIC_APP_NAME` | `Smart Performance Dashboard` |

   > ⚠️ Replace `your-backend-url` with your actual Render URL from Step 2!

5. **Deploy**
   - Click "Deploy"
   - Vercel will build and deploy (takes 1-2 minutes)
   - Wait for "Congratulations!" message

6. **Copy Your Frontend URL**
   - Click "Visit" or copy the URL
   - Format: `https://smart-performance-dashboard.vercel.app`
   - **This is your public URL!** 🎉

---

## STEP 4: Connect Frontend URL to Backend

Now we need to tell the backend which frontend URL to allow (CORS).

1. **Go to Render Dashboard**
   - Open [dashboard.render.com](https://dashboard.render.com)
   - Click on your `smart-dashboard-api` service

2. **Update Environment Variables**
   - Go to "Environment" tab (left sidebar)
   - Find `FRONTEND_URL` variable
   - Update value to: `https://your-vercel-url.vercel.app`
   - Click "Save Changes"

3. **Wait for Auto-Redeploy**
   - Render will automatically redeploy (takes 1-2 minutes)
   - Wait for "Live" status

---

## STEP 5: Seed Production Database (Optional)

If you want sample data in production:

1. **Update Local Environment**
   - Temporarily update `server/.env` with production MongoDB URI
   
2. **Run Seed Command**
   ```bash
   cd "PROJECT 1/server"
   npm run seed
   ```

3. **Restore Local Environment**
   - Change `server/.env` back to local MongoDB URI

> 💡 Alternatively, manually create users and data through your deployed frontend!

---

## STEP 6: Test Your Deployment

### Backend Health Check
```
https://your-backend-url.onrender.com/api/health
```
Expected: `{"success":true,"message":"Server is running"}`

### Frontend Access
```
https://your-vercel-url.vercel.app
```
Expected: Login page loads successfully

### Full Flow Test
1. Open your Vercel URL
2. Try registering a new user
3. Login with credentials
4. Navigate to dashboard
5. Create a student
6. Add performance data
7. Check analytics

---

## 🎉 Share Your App

Your app is now live! Share this URL with anyone:

```
https://your-vercel-url.vercel.app
```

Anyone in the world can access it from:
- 🌍 Any country
- 📱 Any device (mobile, tablet, desktop)
- 🕐 24/7 availability

---

## 🔄 Auto-Deploy Setup

Once configured, any `git push` to GitHub will:
- ✅ Auto-deploy frontend on Vercel
- ✅ Auto-deploy backend on Render

### How to Update Your App

```bash
# Make changes to your code
git add .
git commit -m "Your update message"
git push origin main
```

Both Render and Vercel will automatically detect changes and redeploy!

---

## ⚠️ Common Issues & Solutions

### Issue: Backend Not Responding

**Symptoms**: Frontend can't connect to backend, API errors

**Solutions**:
1. Check Render logs: Dashboard → Logs tab
2. Verify `MONGODB_URI` is correct in Render environment variables
3. Ensure MongoDB Atlas allows 0.0.0.0/0 in Network Access
4. Check if backend is "Live" (not sleeping)

### Issue: CORS Errors

**Symptoms**: "CORS policy" errors in browser console

**Solutions**:
1. Verify `FRONTEND_URL` is set correctly on Render
2. Ensure it matches your Vercel URL exactly (no trailing slash)
3. Check Render logs for CORS-related errors
4. Redeploy backend after changing `FRONTEND_URL`

### Issue: Database Connection Failed

**Symptoms**: "Cannot connect to database" errors

**Solutions**:
1. Verify MongoDB Atlas connection string is correct
2. Check password doesn't contain special characters (or URL-encode them)
3. Ensure Network Access allows 0.0.0.0/0
4. Test connection string locally first
5. Check MongoDB Atlas cluster is running (not paused)

### Issue: Slow First Load

**Symptoms**: First request takes 30+ seconds

**Solution**: This is normal! Free Render services sleep after 15 minutes of inactivity. Subsequent requests will be fast.

**Workaround**: Use a service like [UptimeRobot](https://uptimerobot.com) to ping your backend every 5 minutes to keep it awake.

### Issue: Build Failed on Vercel

**Symptoms**: Deployment fails during build

**Solutions**:
1. Check build logs on Vercel
2. Verify `Root Directory` is set to `PROJECT 1`
3. Ensure all dependencies are in `package.json`
4. Check for TypeScript errors locally: `npm run build`
5. Verify Node.js version compatibility

### Issue: Environment Variables Not Working

**Symptoms**: App behaves differently than local

**Solutions**:
1. Verify all environment variables are set correctly
2. Check for typos in variable names
3. Ensure `NEXT_PUBLIC_` prefix for frontend variables
4. Redeploy after changing environment variables
5. Check browser console for undefined variables

### Issue: Login Not Working

**Symptoms**: Can't login or register users

**Solutions**:
1. Check if backend is running (health check endpoint)
2. Verify `NEXT_PUBLIC_API_URL` includes `/api` at the end
3. Check browser console for API errors
4. Verify JWT_SECRET is set on Render
5. Check cookies are enabled in browser

---

## 📊 Monitoring Your App

### Render Dashboard
- View logs: Real-time backend logs
- Monitor usage: CPU, memory, bandwidth
- Check uptime: Service status and history

### Vercel Dashboard
- View deployments: Build history and logs
- Monitor analytics: Page views, performance
- Check errors: Runtime errors and warnings

### MongoDB Atlas
- Monitor database: Connections, operations
- View metrics: Storage, queries, performance
- Check alerts: Set up email notifications

---

## 💰 Free Tier Limits

### MongoDB Atlas (M0 Free)
- ✅ 512 MB storage
- ✅ Shared RAM
- ✅ No credit card required
- ⚠️ Clusters pause after 60 days of inactivity

### Render (Free)
- ✅ 750 hours/month (enough for 1 service 24/7)
- ✅ 512 MB RAM
- ✅ Shared CPU
- ⚠️ Services sleep after 15 minutes of inactivity
- ⚠️ 100 GB bandwidth/month

### Vercel (Hobby - Free)
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Automatic HTTPS
- ✅ Global CDN
- ⚠️ 100 GB-hours serverless function execution

---

## 🚀 Upgrade Options (When You Need More)

### When to Upgrade?

**Render** ($7/month):
- No sleep time
- More RAM and CPU
- Better performance

**MongoDB Atlas** ($9/month):
- More storage (2-5 GB)
- Dedicated RAM
- Better performance

**Vercel** ($20/month):
- More bandwidth
- Team collaboration
- Advanced analytics

---

## 📝 Deployment Checklist

- [ ] MongoDB Atlas cluster created
- [ ] Database user created with password
- [ ] Network access configured (0.0.0.0/0)
- [ ] Connection string copied
- [ ] Backend deployed on Render
- [ ] All environment variables set on Render
- [ ] Backend health check passes
- [ ] Frontend deployed on Vercel
- [ ] Frontend environment variables set
- [ ] FRONTEND_URL updated on Render
- [ ] Full app tested (register, login, dashboard)
- [ ] Public URL shared with friends

---

## 🎓 Next Steps

1. **Custom Domain** (Optional)
   - Buy a domain (e.g., from Namecheap, GoDaddy)
   - Connect to Vercel: Settings → Domains
   - Update `FRONTEND_URL` on Render

2. **Email Notifications** (Future)
   - Integrate SendGrid or Mailgun
   - Send alerts and reports

3. **Analytics** (Optional)
   - Add Google Analytics
   - Track user behavior

4. **Monitoring** (Recommended)
   - Set up UptimeRobot to prevent sleep
   - Configure MongoDB Atlas alerts

---

## 🆘 Need Help?

- **Render Docs**: [render.com/docs](https://render.com/docs)
- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **MongoDB Atlas Docs**: [docs.atlas.mongodb.com](https://docs.atlas.mongodb.com)

---

**🎊 Congratulations! Your app is now live and accessible worldwide!**

Share your URL: `https://your-app.vercel.app`
