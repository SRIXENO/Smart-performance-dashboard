# Complete Deployment Guide

This guide explains how to deploy Smart Performance Dashboard to production using free-tier services.

## 1. Deployment Target
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## 2. Required Accounts
- GitHub
- MongoDB Atlas
- Render
- Vercel

## 3. Step-by-Step Deployment

### Step 1: Prepare MongoDB Atlas
1. Create an Atlas free cluster (M0).
2. Add a database user with a strong password.
3. Allow network access (`0.0.0.0/0`) for deployment simplicity.
4. Copy your connection string and set a DB name.

Example:
```text
mongodb+srv://<user>:<password>@<cluster>/<db_name>?retryWrites=true&w=majority
```

### Step 2: Deploy Backend on Render
1. Create new Web Service from GitHub repository.
2. Set root directory to `PROJECT 1/server`.
3. Build command: `npm install`
4. Start command: `npm start`
5. Set environment variables:
   - `NODE_ENV=production`
   - `PORT=10000`
   - `MONGODB_URI=<atlas-connection-string>`
   - `JWT_SECRET=<strong-random-secret>`
   - `JWT_EXPIRE=3h`
   - `COOKIE_EXPIRE=0.125`
   - `FRONTEND_URL=<set-after-vercel-deploy>`
   - `GOOGLE_CLIENT_ID=<optional>`
   - `GOOGLE_CLIENT_SECRET=<optional>`
   - `GOOGLE_CALLBACK_URL=<optional>`
6. Deploy and verify backend health endpoint:
```text
https://<your-render-service>.onrender.com/api/health
```

### Step 3: Deploy Frontend on Vercel
1. Import project from GitHub.
2. Set root directory to `PROJECT 1`.
3. Add environment variables:
   - `NEXT_PUBLIC_API_URL=https://<your-render-service>.onrender.com/api`
   - `NEXT_PUBLIC_APP_NAME=Smart Performance Dashboard`
4. Deploy and open app URL.

### Step 4: Final CORS Connection
1. Copy your Vercel production URL.
2. Set backend env variable on Render:
   - `FRONTEND_URL=https://<your-vercel-url>.vercel.app`
3. Redeploy backend.

### Step 5: Verify End-to-End
- Login works
- Dashboard loads
- Student APIs return data
- No CORS errors in browser console

## 4. Production URLs
Current app URL:
- `https://smart-performance-dashboard-git-main-srixenos-projects.vercel.app`

Transformation summary document:
- `https://github.com/SRIXENO/Smart-performance-dashboard/blob/main/PROJECT%201/TRANSFORMATION_SUMMARY.md`

## 5. Common Issues and Fixes
### Slow first load
- Render free instances sleep; first request can be delayed.

### App stuck on loading
- Check `/api/health` on backend.
- Verify `NEXT_PUBLIC_API_URL` has `/api` suffix.
- Verify backend is reachable from frontend domain.

### CORS blocked
- Ensure `FRONTEND_URL` exactly matches deployed Vercel domain.
- Redeploy backend after env change.

### Login/auth errors
- Check `JWT_SECRET`, token expiry variables, and cookie settings.
- Verify Google OAuth callback URL if using Google login.

## 6. Update Flow (CI/CD)
Any push to `main` triggers:
- Vercel redeploy (frontend)
- Render redeploy (backend)

Recommended command flow:
```bash
git add .
git commit -m "Update production"
git push origin main
```

## 7. Security Checklist
- Do not commit real env files.
- Use strong secrets.
- Rotate secrets periodically.
- Restrict database access in production where possible.
- Keep OAuth callback URLs exact and HTTPS-based.
