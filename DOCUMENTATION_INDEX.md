# Documentation Index

## Purpose

This index provides a clear entry point to the project documentation and recommended reading order for different audiences.

## Core Documents

### `README.md`

Use for initial project orientation.

- Platform overview
- Technology stack
- Local setup summary
- Batch script usage (`install_all.bat`, `start_project.bat`)

### `ARCHITECTURE.md`

Use for technical system understanding.

- Runtime topology
- Frontend/backend/data-layer boundaries
- API domain structure
- Request and data flows
- Security, reliability, and scalability notes

### `QUICK_START.md`

Use for operational setup and endpoint-level checks.

- Local startup steps
- Example API calls
- Verification and troubleshooting steps

### `SETUP.md`

Use for implementation context and setup reference.

- Feature implementation status
- Environment configuration notes
- Functional test checklist

### `ENTERPRISE_TRANSFORMATION.md`

Use for expanded feature documentation.

- SGPA/CGPA workflows
- AI analytics capabilities
- Dashboard enhancement scope
- Extended endpoint references

### `TRANSFORMATION_SUMMARY.md`

Use for high-level summary and status communication.

- Executive overview
- Scope summary
- Metrics and completion notes

## Recommended Reading Paths

### Developers

1. `README.md`
2. `ARCHITECTURE.md`
3. `QUICK_START.md`
4. `SETUP.md`
5. `ENTERPRISE_TRANSFORMATION.md`

### Reviewers and Leads

1. `TRANSFORMATION_SUMMARY.md`
2. `ARCHITECTURE.md`
3. `README.md`

### QA and Validation

1. `QUICK_START.md`
2. `SETUP.md`
3. `README.md`

## Local Run References

### Standard URLs

- Frontend: `http://localhost:3000`
- Dashboard: `http://localhost:3000/dashboard`
- Backend API: `http://localhost:5000/api`
- API Health: `http://localhost:5000/api/health`

### Windows Batch Workflow

- `install_all.bat`: installs frontend/backend dependencies and runs backend seed
- `start_project.bat`: launches backend and frontend dev servers in separate terminals

## Environment and Security Notes

- Real secrets must remain in local files only (`.env`, `.env.local`, `server/.env`)
- Commit only template files (`.env.example`, `server/.env.example`)
- If an env file was committed accidentally, remove it from tracking:

```powershell
git rm --cached --ignore-unmatch .env .env.local server/.env
```

## Maintenance Guidance

Update this index when:

- New documentation files are added
- Existing document scope changes
- Setup/run workflows change
- Primary API domains are expanded
