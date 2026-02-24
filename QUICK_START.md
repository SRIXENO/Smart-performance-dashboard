# Quick Start

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

## 1. Prerequisites
- Node.js 18+
- npm
- MongoDB Atlas URI

## 2. Create Environment Files
```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
```

## 3. Install + Seed
```powershell
.\install_all.bat
```

## 4. Start Frontend + Backend
```powershell
.\start_project.bat
```

## 5. Local URLs
- Frontend: `http://localhost:3000`
- API: `http://localhost:5000/api`
- Health: `http://localhost:5000/api/health`

## 6. Verify
1. Health endpoint returns success.
2. Login works.
3. Dashboard and Students pages load.

## Production URL
- `https://smart-performance-dashboard-git-main-srixenos-projects.vercel.app`

## Document Metadata
- Version: `2.0`
- Last Updated: `February 24, 2026`


