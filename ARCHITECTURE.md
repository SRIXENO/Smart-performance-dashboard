# Smart Performance Dashboard Architecture

## 1. Purpose

This document describes the technical architecture of the Smart Performance Dashboard, including system boundaries, runtime components, data flow, and operational characteristics.

## 2. System Context

The platform is a web-based student performance system with:

- Next.js frontend for user-facing workflows and dashboards
- Express.js backend for REST APIs and business logic
- MongoDB Atlas for persistent storage

Primary user roles:

- Admin
- Faculty
- Student

## 3. Runtime Topology

Development runtime:

- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:5000` (`/api/*`)
- Database: MongoDB Atlas cluster

Backend bootstrapping is handled in `server/src/server.js`:

- Environment loading (`dotenv`)
- Database connection (`connectDB()`)
- Middleware initialization (CORS, JSON parsing, cookies, logging, passport)
- Route registration
- Health endpoint and error handling

## 4. High-Level Architecture

### Frontend Layer (Next.js)

Key responsibilities:

- Authentication-aware navigation and protected routes
- Dashboard visualizations and analytics pages
- Student, subject, performance, and import workflows
- API integration through a centralized client layer (`src/lib/api.ts`)

Representative structure:

- `src/app/dashboard/*`
- `src/app/students/*`
- `src/app/subjects/*`
- `src/app/performance/*`
- `src/components/dashboard/*`
- `src/context/AuthContext.tsx`

### Backend Layer (Express)

Key responsibilities:

- Domain APIs grouped by business area
- Authentication and authorization
- Academic and analytics business logic
- Data persistence via Mongoose models

Main route groups:

- `/api/auth`
- `/api/students`
- `/api/dashboard`
- `/api/performance`
- `/api/subjects`
- `/api/academic`
- `/api/ai-analytics`
- `/api/activities`

### Data Layer (MongoDB + Mongoose)

Core entities:

- `User`
- `Student`
- `Subject`
- `SubjectGroup`
- `Performance`
- `AcademicRecord`
- `AIAnalytics`
- `ActivityLog`
- `Counter` (ID generation support)

## 5. API and Domain Boundaries

### Authentication Domain

- Registration/login/logout and profile retrieval
- JWT-based session handling
- Google OAuth integration (passport-based flow)

### Student and Subject Domain

- Student CRUD and profile views
- Subject and grouping management
- Operational data used by dashboard and academic modules

### Academic Domain

- Semester-level academic updates
- SGPA/CGPA calculations
- Historical academic progression per student

### Analytics Domain

- Dashboard summary metrics and trends
- AI/risk-oriented analysis endpoints
- Activity timeline and recent event retrieval

## 6. Request Lifecycle

Typical request lifecycle:

1. Frontend sends HTTP request through `src/lib/api.ts`
2. Express route maps request to controller
3. Controller validates input and applies business logic
4. Mongoose queries/updates MongoDB
5. Controller returns normalized JSON response
6. Frontend updates UI state and components

Cross-cutting concerns:

- Cookie parsing and auth token extraction
- Role checks in middleware for protected resources
- Request logging via `morgan`
- Centralized error fallback (500 handler)

## 7. Data and Computation Flows

### Academic Computation Flow

- Semester data submitted via academic endpoints
- Grade/credit logic applied in controller/model workflow
- SGPA and CGPA recalculated based on stored records
- Student summary fields updated for quick read paths
- Activity records captured for traceability

### Dashboard Flow

- Dashboard UI issues multiple API calls (often in parallel)
- Backend returns aggregated metrics and distribution datasets
- Frontend renders KPI cards, charts, and tables

### AI Analytics Flow

- Student/performance signals are aggregated
- Risk and trend outputs are computed and stored/retrieved
- Resulting insights are exposed through `/api/ai-analytics/*`

## 8. Security Architecture

Current security controls:

- JWT-based authentication
- Cookie-based session transport
- Role-based authorization middleware
- Environment-variable-based secret/config loading
- Password hashing with bcrypt

Operational note:

- Current CORS configuration in development allows broad origins (`origin: true`).
- Production deployment should restrict origins to trusted frontend hosts.

## 9. Reliability and Error Handling

- Health endpoint: `GET /api/health`
- Unknown routes return 404 JSON response
- Unhandled server errors return 500 JSON response
- Startup logs indicate binding host/port and runtime status

## 10. Performance and Scalability Considerations

Implemented patterns:

- Domain-specific route/controller separation for maintainability
- Aggregation-style analytics endpoints to reduce frontend joins
- Frontend parallel data fetching for dashboard responsiveness

Scalability path:

- Horizontal scaling of stateless API tier
- MongoDB index tuning for high-frequency queries
- Optional caching layer (future) for expensive analytics reads

## 11. Deployment View

### Development

- Frontend and backend started independently
- Database hosted in MongoDB Atlas

### Production (recommended baseline)

- Frontend hosted on SSR-capable Next.js platform
- Backend hosted as managed Node.js service
- MongoDB Atlas with production network and credential controls
- Strict CORS, secure cookie settings, and rotated secrets

## 12. Operations and Local Runbook

### Automated Windows workflow

- `install_all.bat`
  - Installs root dependencies
  - Installs `server/` dependencies
  - Runs backend seed command

- `start_project.bat`
  - Opens backend dev server window (`npm run dev` in `server/`)
  - Opens frontend dev server window (`npm run dev` in root)

### Environment handling

- Real secrets must remain in local env files only
- Template files (`.env.example`, `server/.env.example`) are committed for team onboarding

## 13. Source References

- Entry point: `server/src/server.js`
- Database init: `server/src/config/database.js`
- Auth middleware: `server/src/middleware/authMiddleware.js`
- API client: `src/lib/api.ts`
- Frontend auth context: `src/context/AuthContext.tsx`
- Detailed setup: `SETUP.md`
- Operational guide: `QUICK_START.md`
