# Setup Guide

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

## Environment Requirements
- Node.js 18+
- npm 9+
- MongoDB Atlas

## Initial Setup
```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
```

Configure frontend env (`.env.local`):
- `NEXT_PUBLIC_API_URL`
- `NEXT_PUBLIC_APP_NAME`

Configure backend env (`server/.env`):
- `NODE_ENV`, `PORT`, `MONGODB_URI`
- `JWT_SECRET`, `JWT_EXPIRE`, `COOKIE_EXPIRE`
- `FRONTEND_URL`
- OAuth values if Google login is enabled

## Install Dependencies
Automated:
```powershell
.\install_all.bat
```

Manual:
```bash
npm install
cd server
npm install
npm run seed
```

## Run Development Servers
Automated:
```powershell
.\start_project.bat
```

Manual:
```bash
cd server && npm run dev
# new terminal
npm run dev
```

## Validation Checklist
- [ ] `http://localhost:5000/api/health` works
- [ ] Login/logout works
- [ ] Dashboard data loads
- [ ] Role-based actions behave correctly
- [ ] Mobile/split-screen views are usable

## Common Mistakes
- Missing `/api` in `NEXT_PUBLIC_API_URL`
- Wrong Render `FRONTEND_URL`
- OAuth callback URL mismatch
- Expired or invalid MongoDB credentials

## Document Metadata
- Version: `2.0`
- Last Updated: `February 24, 2026`


