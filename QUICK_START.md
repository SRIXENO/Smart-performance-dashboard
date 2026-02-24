# Quick Start

Use this guide to run the project locally in the shortest path.

## 1. Prerequisites
- Node.js 18+
- npm
- MongoDB Atlas URI

## 2. Configure Environment Files
From root (`PROJECT 1`):
```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
```

Fill `server/.env` at minimum with:
- `MONGODB_URI`
- `JWT_SECRET`
- `PORT`

## 3. Install and Seed
```powershell
.\install_all.bat
```

## 4. Start Project
```powershell
.\start_project.bat
```

## 5. Open URLs
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- Health: `http://localhost:5000/api/health`

## 6. Validate in 2 Minutes
1. Open health URL and confirm success JSON.
2. Open app and sign in.
3. Open dashboard and verify data loads.
4. Open students page and verify records render.

## 7. Production URL
- `https://smart-performance-dashboard-git-main-srixenos-projects.vercel.app`

## 8. If It Fails
- Backend down: check `server` terminal logs.
- Stuck loading: verify `NEXT_PUBLIC_API_URL` and backend health.
- CORS blocked: set Render `FRONTEND_URL` to exact Vercel domain and redeploy.
