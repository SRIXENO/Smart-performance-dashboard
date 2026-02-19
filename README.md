# Smart Performance Dashboard

Smart Performance Dashboard is a full-stack student performance platform for academic operations, analytics, and institutional monitoring.

## Overview

The system combines:

- A Next.js frontend for role-based workflows and dashboards
- An Express.js API layer organized by domain
- MongoDB Atlas for persistent data storage

Supported roles:

- Admin
- Faculty
- Student

## Core Capabilities

- Authentication and role-based access control
- Student, subject, and performance management
- Academic workflows with SGPA/CGPA computations
- Dashboard analytics and trend views
- AI-oriented risk and insight endpoints
- Activity timeline and audit support

## Technology Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Chart.js
- Backend: Node.js, Express.js, Mongoose
- Database: MongoDB Atlas
- Security: JWT, bcrypt, cookie-based auth

## Project Structure

```text
PROJECT 1/
  src/                          Frontend source
  server/                       Backend source
  install_all.bat               Installs dependencies and runs seed
  start_project.bat             Starts backend + frontend in separate terminals
  README.md
  QUICK_START.md
  SETUP.md
  ARCHITECTURE.md
  DOCUMENTATION_INDEX.md
  ENTERPRISE_TRANSFORMATION.md
  TRANSFORMATION_SUMMARY.md
```

## Prerequisites

- Node.js 18+
- npm
- MongoDB connection string
- Windows PowerShell (for `.bat` workflow)

## Environment Setup

Create local environment files from templates:

```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
```

Then fill real values in:

- `.env`
- `server/.env`

Security note:

- Do not commit real secrets
- Commit only `.env.example` templates

If needed, untrack accidentally committed env files:

```powershell
git rm --cached --ignore-unmatch .env .env.local server/.env
```

## Quick Start (Windows)

### 1. Install dependencies and seed data

```powershell
.\install_all.bat
```

`install_all.bat` does the following:

- Installs frontend dependencies in root
- Installs backend dependencies in `server/`
- Runs backend seed command

### 2. Start backend and frontend

```powershell
.\start_project.bat
```

`start_project.bat` opens two terminals:

- Backend (`server/`): `npm run dev`
- Frontend (root): `npm run dev`

### 3. Access the app

- Frontend: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Backend API: `http://localhost:5000/api`
- Health endpoint: `http://localhost:5000/api/health`

## Manual Startup (Alternative)

Backend:

```bash
cd server
npm install
npm run seed
npm run dev
```

Frontend (separate terminal):

```bash
npm install
npm run dev
```

## API Domains

- `/api/auth`
- `/api/students`
- `/api/subjects`
- `/api/performance`
- `/api/academic`
- `/api/dashboard`
- `/api/ai-analytics`
- `/api/activities`

## Scripts

Frontend (root):

- `npm run dev`
- `npm run build`
- `npm run start`
- `npm run lint`

Backend (`server/`):

- `npm run dev`
- `npm run start`
- `npm run seed`

## Documentation Map

- `ARCHITECTURE.md`: system architecture, request/data flow, security, deployment notes
- `QUICK_START.md`: operational setup and troubleshooting
- `SETUP.md`: setup reference and validation checklist
- `ENTERPRISE_TRANSFORMATION.md`: transformation scope and technical impact
- `TRANSFORMATION_SUMMARY.md`: executive summary and next-stage priorities
- `DOCUMENTATION_INDEX.md`: reading paths for developers, reviewers, and QA
- `DEPLOYMENT.md`: complete guide for deploying online (MongoDB Atlas + Render + Vercel)
- `DEPLOYMENT_QUICK_REFERENCE.md`: quick deployment reference card
- `DEPLOYMENT_CHECKLIST.md`: step-by-step deployment checklist

## Deploy Online (FREE)

Deploy your app to the cloud and share it worldwide:

**Services Used (All Free):**
- MongoDB Atlas: Cloud database
- Render: Backend hosting
- Vercel: Frontend hosting

**Quick Steps:**
1. Set up MongoDB Atlas cluster and get connection string
2. Deploy backend on Render with environment variables
3. Deploy frontend on Vercel with API URL
4. Connect frontend URL back to backend
5. Share your public URL!

**Detailed Instructions:** See `DEPLOYMENT.md` for complete step-by-step guide

**Auto-Deploy:** Every `git push` automatically deploys both frontend and backend

## Troubleshooting

**Local Development:**
- Backend start issues: verify `server/.env`, DB connectivity, port `5000`
- Frontend start issues: verify dependencies, port `3000`, clear `.next`
- Seed failures: run `npm run seed` in `server/` and inspect output
- API errors: confirm backend availability and API base URL settings

**Production Deployment:**
- Backend not responding: check Render logs, verify MongoDB URI
- CORS errors: ensure FRONTEND_URL is set correctly on Render
- Database connection failed: verify MongoDB Atlas network access (0.0.0.0/0)
- Slow first load: normal on free tier (Render sleeps after 15 min inactivity)

## License

Intended for educational and internal demonstration use.
