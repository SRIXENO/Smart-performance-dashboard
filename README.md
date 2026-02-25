# Smart Performance Intelligence Dashboard (SPID)

A production-ready full-stack academic intelligence platform for managing students, faculty, subjects, performance records, and admin governance workflows.

## Why SPID
SPID combines operational management and analytics in one system:
- Centralized student and faculty lifecycle management
- Role-based access control with strict backend enforcement
- Interactive analytics dashboards for student intelligence
- Admin-only governance features (login history, account approvals)
- Deployment-ready architecture (Vercel + Render + MongoDB Atlas)

## Current Highlights
- New user onboarding approval flow (`viewer` -> admin approve/reject)
- Admin and faculty student access controls (block/unblock)
- Transaction-safe cascade deletion for students and faculty
- Student credential reset from edit flow (admin/faculty)
- Faculty account/password management restricted to admin
- Accessible custom dropdown with keyboard and ARIA support

## Live URLs
- Frontend (Vercel): `https://smart-performance-dashboard-git-main-srixenos-projects.vercel.app`
- Backend health (Render): `https://<your-render-service>.onrender.com/api/health`

## Technology Stack
- Frontend: Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS, Chart.js
- Backend: Node.js, Express, Mongoose, JWT, Passport Google OAuth
- Database: MongoDB Atlas
- Hosting: Vercel (frontend), Render (backend)

## Monorepo Structure
```text
PROJECT 1/
  src/                       Next.js frontend
    app/                     Routes/pages
    components/              Reusable UI (dashboard, forms, modal, dropdown)
    context/                 Auth context
    lib/                     API client layer
  server/                    Express API
    src/
      config/                DB + passport
      controllers/           Business logic
      middleware/            auth + role middleware
      models/                Mongo schemas
      routes/                API routes
  README.md
  FEATURES.md
  SETUP.md
  DEPLOYMENT.md
```

## Role and Access Model
| Role | Access |
|---|---|
| `admin` | Full management access, approvals, login history, faculty CRUD/password |
| `faculty` | Student view/edit, student document upload, student block/unblock |
| `student` | Student-scoped views and allowed modules |
| `viewer` | Pending users created via register/google until admin approval |

## Core Functional Modules
- Authentication (`local + Google OAuth`)
- Pending account approvals (admin)
- Students (create/edit/delete, documents, status controls)
- Faculty (admin-managed lifecycle)
- Subjects (department/year assignment)
- Performance + academic analytics
- Activity and login history audit

Detailed list: see [FEATURES.md](FEATURES.md).

## Local Development
### Prerequisites
- Node.js 18+
- npm 9+
- MongoDB Atlas connection string

### Quick Run
```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
.\install_all.bat
.\start_project.bat
```

### Manual Run
```bash
# terminal 1
cd server
npm install
npm run seed
npm run dev

# terminal 2 (project root)
npm install
npm run dev
```

### Local URLs
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000/api`
- Health: `http://localhost:5000/api/health`

## Environment Variables
### Frontend (`.env.local`)
- `NEXT_PUBLIC_API_URL` (example: `https://<render-service>.onrender.com/api`)
- `NEXT_PUBLIC_APP_NAME`

### Backend (`server/.env`)
- `PORT`
- `NODE_ENV`
- `MONGODB_URI`
- `JWT_SECRET`
- `JWT_EXPIRE`
- `COOKIE_EXPIRE`
- `FRONTEND_URL`
- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_CALLBACK_URL`

## NPM Scripts
### Root
- `npm run dev` - start Next.js frontend
- `npm run build` - production build
- `npm run start` - start production frontend

### Server (`server/`)
- `npm run dev` - start API with nodemon
- `npm run start` - start API
- `npm run seed` - seed base data

## API Surface (High Level)
- `/api/auth`
- `/api/students`
- `/api/faculty`
- `/api/subjects`
- `/api/performance`
- `/api/dashboard`
- `/api/academic`
- `/api/ai-analytics`
- `/api/activities`

## Deployment
- Full deployment + checklist + quick troubleshooting: [DEPLOYMENT.md](DEPLOYMENT.md)

## Documentation Files (Reduced)
- [README.md](README.md)
- [FEATURES.md](FEATURES.md)
- [SETUP.md](SETUP.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)

## License
Academic and portfolio usage.

## Document Metadata
- Last Updated: February 25, 2026
- Status: Active
