# Deployment Guide (Vercel + Render + Atlas)

## 1. Target Topology
- Frontend: Vercel (`PROJECT 1`)
- Backend: Render Web Service (`PROJECT 1/server`)
- Database: MongoDB Atlas

## 2. Deploy Database (Atlas)
1. Create cluster (M0 or higher).
2. Create DB user.
3. Add network access (start with `0.0.0.0/0`, then restrict later).
4. Copy connection string for `MONGODB_URI`.

## 3. Deploy Backend (Render)
### Service settings
- Root directory: `PROJECT 1/server`
- Build command: `npm install`
- Start command: `npm start`

### Required env vars
- `NODE_ENV=production`
- `PORT=10000`
- `MONGODB_URI=<atlas-uri>`
- `JWT_SECRET=<strong-secret>`
- `JWT_EXPIRE=3h`
- `COOKIE_EXPIRE=0.125`
- `FRONTEND_URL=<vercel-url>`
- `GOOGLE_CLIENT_ID=<optional>`
- `GOOGLE_CLIENT_SECRET=<optional>`
- `GOOGLE_CALLBACK_URL=<optional>`

### Verify backend
- Open `https://<render-service>.onrender.com/api/health`
- Expect `{"success":true,...}`

## 4. Deploy Frontend (Vercel)
### Project settings
- Root directory: `PROJECT 1`

### Required env vars
- `NEXT_PUBLIC_API_URL=https://<render-service>.onrender.com/api`
- `NEXT_PUBLIC_APP_NAME=Smart Performance Intelligence Dashboard`

## 5. Final Integration
1. Copy Vercel production URL.
2. Set backend `FRONTEND_URL` to exact Vercel URL.
3. Redeploy backend.
4. Test login and protected pages.

## 6. Production Validation
- [ ] Login works (local auth)
- [ ] Google login works (if enabled)
- [ ] Approvals page accessible for admin
- [ ] Student/faculty CRUD flows working
- [ ] No CORS errors in browser console

## 7. Troubleshooting
### Frontend stuck on loading
- Check backend health endpoint
- Confirm `NEXT_PUBLIC_API_URL` includes `/api`
- Confirm `/auth/me` returns valid response

### CORS blocked
- Ensure backend `FRONTEND_URL` is exact (protocol + domain)
- Redeploy backend after env changes

### Google auth failure
- Verify callback URL matches deployed backend auth callback
- Verify client ID/secret on Render

## Document Metadata
- Last Updated: February 25, 2026
- Status: Active
