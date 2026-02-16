# Setup Reference

## 1. Purpose

This document provides implementation-oriented setup guidance for local development and validation.

## 2. Current Implementation Scope

The project includes:

- Authentication and role-based access control
- Student and subject management flows
- Performance tracking workflows
- Academic record logic (SGPA/CGPA)
- Analytics endpoints and dashboard views
- Activity logging and timeline retrieval

## 3. Prerequisites

- Node.js 18+
- npm
- MongoDB Atlas connection string (or compatible MongoDB instance)
- Windows PowerShell (for batch-script workflow)

## 4. Environment Configuration

Create local env files from templates:

```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
```

Populate values in:

- `.env`
- `server/.env`

Required backend keys are documented in `server/.env.example` (for example: `MONGODB_URI`, `JWT_SECRET`, OAuth-related keys).

Security policy:

- Real env files remain local only
- Only template env files are committed

If needed, untrack accidentally committed env files:

```powershell
git rm --cached --ignore-unmatch .env .env.local server/.env
```

## 5. Installation

### Recommended (Windows batch)

```powershell
.\install_all.bat
```

This script:

- Installs frontend dependencies in root
- Installs backend dependencies in `server/`
- Seeds initial backend data

### Manual installation

```bash
npm install
cd server
npm install
npm run seed
```

## 6. Startup

### Recommended (Windows batch)

```powershell
.\start_project.bat
```

This starts:

- Backend dev server in one terminal (`server/`)
- Frontend dev server in another terminal (project root)

### Manual startup

Backend terminal:

```bash
cd server
npm run dev
```

Frontend terminal:

```bash
npm run dev
```

## 7. Local Endpoints

- Frontend: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Backend API: `http://localhost:5000/api`
- Health endpoint: `http://localhost:5000/api/health`

## 8. Validation Checklist

After startup, verify:

1. Health endpoint returns success
2. Authentication flow works (login/session)
3. Dashboard renders with API-backed data
4. Student workflows (list/create/update/delete) function
5. Academic endpoints respond for SGPA/CGPA workflows
6. Activity endpoints return data

## 9. Script Reference

### Frontend (root)

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

### Backend (`server/`)

- `npm run dev`
- `npm run start`
- `npm run seed`

## 10. Common Issues

### Backend startup failure

- Check `server/.env` values
- Verify MongoDB connectivity and network allowlist
- Confirm port `5000` availability

### Frontend startup failure

- Confirm port `3000` availability
- Reinstall root dependencies
- Clear `.next` cache and restart

### Seed failure

- Re-check DB credentials and permissions
- Run `npm run seed` directly in `server/` for full error output

### API/CORS errors

- Ensure backend is running
- Verify frontend API base URL configuration
- Check backend logs for route or middleware errors

## 11. Related Documents

- `README.md`
- `QUICK_START.md`
- `ARCHITECTURE.md`
- `ENTERPRISE_TRANSFORMATION.md`
- `DOCUMENTATION_INDEX.md`
