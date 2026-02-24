# Architecture Guide

## 1. System Overview
Smart Performance Dashboard is a three-tier web application:
- Presentation layer: Next.js frontend
- Service layer: Express API backend
- Data layer: MongoDB Atlas

The system is designed for college operations with role-aware access and analytics-focused workflows.

## 2. High-Level Topology
```text
Browser (Vercel)
  -> Next.js frontend
    -> REST API calls (/api/*)
      -> Express backend (Render)
        -> MongoDB Atlas
```

## 3. Runtime Components
### Frontend
- Framework: Next.js App Router
- Main responsibilities:
  - Routing and UI composition
  - Authentication state handling
  - Role-based UI rendering
  - Analytics dashboard visualization

Important frontend modules:
- `src/context/AuthContext.tsx`
- `src/lib/api.ts`
- `src/components/dashboard/*`
- `src/app/*`

### Backend
- Framework: Express
- Main responsibilities:
  - Authentication and authorization
  - Domain APIs for students/faculty/subjects/performance
  - Dashboard aggregation and analytics services
  - Activity logging and audit-oriented endpoints

Important backend modules:
- `server/src/server.js`
- `server/src/routes/*`
- `server/src/controllers/*`
- `server/src/middleware/authMiddleware.js`
- `server/src/models/*`

### Database
- MongoDB Atlas with Mongoose models
- Main entities:
  - `User`
  - `Student`
  - `Subject`
  - `Performance`
  - `AcademicRecord`
  - `ActivityLog`

## 4. Request Lifecycle
1. User action triggers a frontend event.
2. Frontend calls API via Axios client (`src/lib/api.ts`).
3. Backend route resolves to controller.
4. Auth middleware validates token and role.
5. Controller executes business logic and DB operations.
6. Response returns JSON payload.
7. Frontend updates state and UI.

## 5. Security Model
- JWT token based authentication
- Cookie + bearer-token support
- Role-based authorization middleware
- CORS with allowed origin checks
- Password hashing with bcrypt

## 6. Role Access Strategy
- Admin:
  - Full write access (create/update/delete)
  - Access to operational monitoring
- Faculty:
  - View access across most modules
  - Limited write access where policy allows
- Student:
  - Read-only or scoped access

## 7. API Domains
- `/api/auth`: login, register, me, logout, OAuth callbacks
- `/api/students`: student CRUD and profile operations
- `/api/faculty`: faculty CRUD and listing
- `/api/subjects`: subject mapping and management
- `/api/performance`: marks/attendance and performance records
- `/api/dashboard`: aggregated dashboard metrics
- `/api/academic`: SGPA/CGPA and academic progression
- `/api/ai-analytics`: risk and insight endpoints
- `/api/activities`: login/activity history

## 8. Frontend Architecture Patterns
- Centralized API client with interceptors
- Auth provider for global user session state
- Route-level page components under `app/`
- Reusable dashboard and table components
- Mobile-first responsive behavior for split-screen and phone usage

## 9. Backend Architecture Patterns
- Route-controller-model separation
- Middleware chain for auth and permissions
- Shared error handling and JSON response style
- Health endpoint for deployment diagnostics (`/api/health`)

## 10. Deployment Architecture
- Frontend hosted on Vercel
- Backend hosted on Render
- Database hosted on MongoDB Atlas

Production URL:
- `https://smart-performance-dashboard-git-main-srixenos-projects.vercel.app`

## 11. Reliability and Observability
- Health endpoint for API liveness checks
- Render logs for backend diagnostics
- Vercel deployment logs for frontend build/runtime checks
- Activity history for admin-level traceability

## 12. Future Improvements
- Add integration and end-to-end tests
- Add caching for heavy analytics endpoints
- Add centralized structured logging
- Add rate limiting and stricter production hardening
