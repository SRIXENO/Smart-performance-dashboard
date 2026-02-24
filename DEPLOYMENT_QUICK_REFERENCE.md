# Deployment Quick Reference

## Production URLs
- App: `https://smart-performance-dashboard-git-main-srixenos-projects.vercel.app`
- Transformation Summary: `https://github.com/SRIXENO/Smart-performance-dashboard/blob/main/PROJECT%201/TRANSFORMATION_SUMMARY.md`

## Backend (Render)
- Root directory: `PROJECT 1/server`
- Build command: `npm install`
- Start command: `npm start`
- Required env:
  - `NODE_ENV=production`
  - `PORT=10000`
  - `MONGODB_URI=...`
  - `JWT_SECRET=...`
  - `JWT_EXPIRE=3h`
  - `COOKIE_EXPIRE=0.125`
  - `FRONTEND_URL=https://<your-vercel-domain>.vercel.app`

Health check:
- `https://<render-service>.onrender.com/api/health`

## Frontend (Vercel)
- Root directory: `PROJECT 1`
- Required env:
  - `NEXT_PUBLIC_API_URL=https://<render-service>.onrender.com/api`
  - `NEXT_PUBLIC_APP_NAME=Smart Performance Dashboard`

## Fast Verification
1. Open app URL.
2. Login.
3. Confirm dashboard data loads.
4. Confirm no CORS/auth errors in browser console.

## Fast Debug
- Stuck loading: verify backend health and API URL.
- CORS: verify `FRONTEND_URL` and redeploy backend.
- Auth issues: verify JWT and cookie env values.
