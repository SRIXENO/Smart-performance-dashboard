# Deployment Quick Reference

## Production Stack
- Frontend: Vercel
- Backend: Render
- Database: MongoDB Atlas

## Backend (Render)
- Root: `PROJECT 1/server`
- Build: `npm install`
- Start: `npm start`

Required env:
- `NODE_ENV=production`
- `PORT=10000`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRE=3h`
- `COOKIE_EXPIRE=0.125`
- `FRONTEND_URL=https://<vercel-domain>`

Health:
- `https://<render-service>.onrender.com/api/health`

## Frontend (Vercel)
- Root: `PROJECT 1`

Required env:
- `NEXT_PUBLIC_API_URL=https://<render-service>.onrender.com/api`
- `NEXT_PUBLIC_APP_NAME=Smart Performance Intelligence Dashboard`

## Immediate Debug Commands
- Root build: `npm run build`
- Backend local dev: `cd server && npm run dev`
- Frontend local dev: `npm run dev`

## Fast Failure Checks
- Loading issue: check `/api/health` and `/auth/me`
- CORS issue: verify `FRONTEND_URL`
- Auth issue: verify JWT + Google callback envs

## Document Metadata
- Last Updated: February 25, 2026
- Status: Active
