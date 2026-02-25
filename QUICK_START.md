# Quick Start

Use this if you want to run SPID locally in minutes.

## 1) Prepare env files
```powershell
Copy-Item .env.example .env
Copy-Item server/.env.example server/.env
```

## 2) Install dependencies
```powershell
.\install_all.bat
```

## 3) Start backend + frontend
```powershell
.\start_project.bat
```

## 4) Open
- `http://localhost:3000`

## 5) Health check
- `http://localhost:5000/api/health`

## 6) If something fails
- Full setup guide: [SETUP.md](SETUP.md)
- Deployment guide: [DEPLOYMENT.md](DEPLOYMENT.md)

## Document Metadata
- Last Updated: February 25, 2026
- Status: Active
