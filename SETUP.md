# Setup Guide

This document provides complete setup guidance for developers and maintainers.

## 1. Environment Requirements
- Node.js 18+
- npm 9+
- MongoDB Atlas account
- Windows PowerShell or compatible shell

## 2. Initial Setup
### Clone and open project
```bash
git clone <repository-url>
cd "PROJECT 1"
```

### Create env files
```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
```

### Configure frontend env
In root `.env.local` (or Vercel env):
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_NAME`

### Configure backend env
In `server/.env`:
- `NODE_ENV`
- `PORT`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `COOKIE_EXPIRE`
- `FRONTEND_URL`
- Google OAuth keys (if enabled)

## 3. Install Dependencies
### Automated
```powershell
.\install_all.bat
```

### Manual
```bash
npm install
cd server
npm install
npm run seed
```

## 4. Run Development Servers
### Automated
```powershell
.\start_project.bat
```

### Manual
Backend:
```bash
cd server
npm run dev
```

Frontend:
```bash
npm run dev
```

## 5. Verification Checklist
- [ ] Backend health returns success
- [ ] Login works
- [ ] Dashboard loads
- [ ] Student list loads
- [ ] Role restrictions work as expected
- [ ] Dark/light mode toggles correctly

## 6. Common Configuration Mistakes
- Missing `/api` in `NEXT_PUBLIC_API_URL`
- Wrong Vercel URL in Render `FRONTEND_URL`
- Expired/invalid MongoDB credentials
- OAuth callback URL mismatch

## 7. Build and Release Checks
Frontend build:
```bash
npm run build
```

Recommended before push:
1. Run local build.
2. Confirm no TypeScript errors.
3. Validate critical user flows.
4. Push and verify Vercel/Render deployments.

## 8. Security Practices
- Keep secrets out of Git
- Use `.env.example` only for templates
- Rotate JWT and OAuth secrets periodically
- Restrict DB and CORS settings for hardened production

## 9. Core URLs
- Local frontend: `http://localhost:3000`
- Local API: `http://localhost:5000/api`
- Production frontend: `https://smart-performance-dashboard-git-main-srixenos-projects.vercel.app`
- Transformation summary: `https://github.com/SRIXENO/Smart-performance-dashboard/blob/main/PROJECT%201/TRANSFORMATION_SUMMARY.md`
