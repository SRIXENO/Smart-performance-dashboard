# Smart Performance Dashboard

Smart Performance Dashboard is a full-stack web application for tracking student academic performance, attendance, and institutional insights. It combines a Next.js frontend with an Express and MongoDB backend, with role-based access and analytics features for administrators, faculty, and students.

## Core Capabilities

- Secure authentication with role-based access control
- Student record management (create, read, update, delete)
- Attendance and marks tracking
- Dashboard analytics with interactive charts
- SGPA and CGPA tracking workflows
- AI-assisted risk and trend insights
- Bulk CSV import support

## Technology Stack

- Frontend: Next.js, React, TypeScript, Tailwind CSS, Chart.js
- Backend: Node.js, Express.js, Mongoose
- Database: MongoDB Atlas
- Auth and Security: JWT, bcrypt, cookie-based sessions

## Project Structure

```text
PROJECT 1/
  src/                    Frontend source (Next.js)
  server/                 Backend source (Express)
  install_all.bat         One-click dependency install + seed
  start_project.bat       One-click local startup (frontend + backend)
  README.md
```

## Prerequisites

- Node.js 18 or newer
- npm
- MongoDB connection configured in environment files

## Quick Start (Recommended)

### 1) Install everything and seed data

Double-click `install_all.bat`.

This script will:
- Install frontend dependencies in the project root
- Install backend dependencies inside `server/`
- Run backend seed script (`npm run seed`)

### 2) Start the full project

Double-click `start_project.bat`.

This script opens two terminal windows:
- Backend API: `http://localhost:5000`
- Frontend app: `http://localhost:3000`

## Manual Setup (Optional)

If you prefer terminal commands:

```bash
# frontend
npm install

# backend
cd server
npm install
npm run seed
npm run dev
```

In a separate terminal from the project root:

```bash
npm run dev
```

## Available Scripts

### Frontend (project root)

- `npm run dev` - start Next.js development server
- `npm run build` - production build
- `npm run start` - run production build
- `npm run lint` - run ESLint

### Backend (`server/`)

- `npm run dev` - start backend with nodemon
- `npm run start` - start backend in production mode
- `npm run seed` - populate database with seed data

## Environment Notes

- Frontend environment values are read from `.env.local`
- Backend environment values are read from `server/.env`
- Verify database URI and JWT-related settings before first run

## Troubleshooting

- If seeding fails, verify database connectivity and backend environment values.
- If ports are busy, stop existing processes on `3000` or `5000` and restart.
- If dependencies fail to install, update Node.js to the latest LTS release.

## License

This project is intended for educational and internal demonstration use.
