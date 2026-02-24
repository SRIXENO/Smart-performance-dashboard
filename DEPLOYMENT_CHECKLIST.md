# Deployment Checklist

Use this checklist before sharing the production URL publicly.

## 1. Repository and Local Readiness
- [ ] Project builds locally (`npm run build`)
- [ ] Backend runs locally (`server/npm run dev`)
- [ ] Changes are committed and pushed to GitHub
- [ ] No real secrets committed

## 2. MongoDB Atlas
- [ ] Cluster created
- [ ] Database user created
- [ ] Network access configured
- [ ] Connection string verified

## 3. Render Backend
- [ ] Service created from correct repository
- [ ] Root directory set to `PROJECT 1/server`
- [ ] Required env variables configured
- [ ] Health endpoint returns `200`
- [ ] Logs show successful startup

## 4. Vercel Frontend
- [ ] Project imported successfully
- [ ] Root directory set to `PROJECT 1`
- [ ] `NEXT_PUBLIC_API_URL` configured
- [ ] Deploy build passes
- [ ] Login page opens without errors

## 5. Frontend-Backend Connection
- [ ] Render `FRONTEND_URL` set to Vercel production URL
- [ ] Backend redeployed after CORS env update
- [ ] Browser shows no CORS errors

## 6. Functional Testing
- [ ] Login/logout works
- [ ] Dashboard loads data
- [ ] Students page loads
- [ ] Role permissions match expected behavior
- [ ] Admin-only pages restricted correctly

## 7. Final Production Info
- [ ] App URL verified:
  - `https://smart-performance-dashboard-git-main-srixenos-projects.vercel.app`
- [ ] Transformation summary URL documented:
  - `https://github.com/SRIXENO/Smart-performance-dashboard/blob/main/PROJECT%201/TRANSFORMATION_SUMMARY.md`

## 8. Post-Deployment Monitoring
- [ ] Render logs reviewed
- [ ] Vercel logs reviewed
- [ ] MongoDB connection stable
- [ ] Known issues documented
