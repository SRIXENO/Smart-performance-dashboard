# Deployment Quick Reference

## Documentation Hub
- Main Overview: [`README.md`](README.md)
- Architecture: [`ARCHITECTURE.md`](ARCHITECTURE.md)
- Setup: [`SETUP.md`](SETUP.md)
- Quick Start: [`QUICK_START.md`](QUICK_START.md)
- Deployment Guide: [`DEPLOYMENT.md`](DEPLOYMENT.md)
- Deployment Checklist: [`DEPLOYMENT_CHECKLIST.md`](DEPLOYMENT_CHECKLIST.md)
- Deployment Quick Reference: [`DEPLOYMENT_QUICK_REFERENCE.md`](DEPLOYMENT_QUICK_REFERENCE.md)
- Documentation Index: [`DOCUMENTATION_INDEX.md`](DOCUMENTATION_INDEX.md)
- Enterprise Report: [`ENTERPRISE_TRANSFORMATION.md`](ENTERPRISE_TRANSFORMATION.md)
- Executive Summary: [`TRANSFORMATION_SUMMARY.md`](TRANSFORMATION_SUMMARY.md)

## Production Links
- App: `https://smart-performance-dashboard-git-main-srixenos-projects.vercel.app`
- Summary doc: `https://github.com/SRIXENO/Smart-performance-dashboard/blob/main/PROJECT%201/TRANSFORMATION_SUMMARY.md`

## Backend (Render)
- Root directory: `PROJECT 1/server`
- Build: `npm install`
- Start: `npm start`

Required env:
- `NODE_ENV=production`
- `PORT=10000`
- `MONGODB_URI=...`
- `JWT_SECRET=...`
- `JWT_EXPIRE=3h`
- `COOKIE_EXPIRE=0.125`
- `FRONTEND_URL=https://<vercel-domain>.vercel.app`

Health:
- `https://<render-service>.onrender.com/api/health`

## Frontend (Vercel)
Required env:
- `NEXT_PUBLIC_API_URL=https://<render-service>.onrender.com/api`
- `NEXT_PUBLIC_APP_NAME=Smart Performance Dashboard`

## Fast Debug
- Loading stuck: backend health + API URL + `/auth/me`
- CORS: fix `FRONTEND_URL` and redeploy backend
- Login: verify JWT/cookie vars and OAuth callback URL

## Document Metadata
- Version: `2.0`
- Last Updated: `February 24, 2026`


