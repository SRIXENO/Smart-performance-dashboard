# Quick Start Guide

## Purpose

This guide gets the application running locally and provides a minimal validation checklist.

## Prerequisites

- Node.js 18+
- npm
- MongoDB Atlas connection string (or compatible MongoDB instance)
- Windows PowerShell (for `.bat` workflow)

## 1. Configure Environment Files

From project root:

```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
```

Populate real values in:

- `.env`
- `server/.env`

Security rule:

- Do not commit real secrets.
- Commit only template env files.

## 2. Install Dependencies and Seed Data

### Recommended (Windows)

```powershell
.\install_all.bat
```

This script:

- Installs frontend dependencies in project root
- Installs backend dependencies in `server/`
- Runs backend seed command

### Manual Alternative

```bash
npm install
cd server
npm install
npm run seed
```

## 3. Start the Application

### Recommended (Windows)

```powershell
.\start_project.bat
```

This script opens two terminals:

- Backend (`server/`): `npm run dev`
- Frontend (root): `npm run dev`

### Manual Alternative

Backend terminal:

```bash
cd server
npm run dev
```

Frontend terminal:

```bash
npm run dev
```

## 4. Access URLs

- Frontend: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Backend API base: `http://localhost:5000/api`
- Health check: `http://localhost:5000/api/health`

## 5. Verify Core Functionality

Minimum checks after startup:

1. `GET /api/health` returns success response
2. Login flow works
3. Dashboard page loads without API failures
4. Student list endpoint returns data
5. At least one chart/KPI renders on dashboard

## 6. Key API Areas

- Authentication: `/api/auth/*`
- Students: `/api/students/*`
- Dashboard: `/api/dashboard/*`
- Performance: `/api/performance/*`
- Subjects: `/api/subjects/*`
- Academic: `/api/academic/*`
- AI Analytics: `/api/ai-analytics/*`
- Activities: `/api/activities/*`

## 7. Troubleshooting

### Backend does not start

- Verify `server/.env` values (especially `MONGODB_URI`, `JWT_SECRET`)
- Confirm MongoDB Atlas IP/network access
- Ensure port `5000` is available

### Frontend does not start

- Ensure port `3000` is available
- Reinstall dependencies in root
- Clear `.next` and restart

### API errors in UI

- Confirm backend is running and reachable
- Verify API URL in frontend env configuration
- Check backend terminal logs for route/controller errors

### Seed command fails

- Check database credentials and permissions
- Re-run `npm install` in `server/`
- Run `npm run seed` directly to inspect error output

## 8. Useful Commands

Project root:

```bash
npm run dev
npm run build
npm run lint
```

Backend (`server/`):

```bash
npm run dev
npm run start
npm run seed
```

## 9. Related Documentation

- `README.md`
- `ARCHITECTURE.md`
- `SETUP.md`
- `ENTERPRISE_TRANSFORMATION.md`
- `DOCUMENTATION_INDEX.md`
