@echo off
setlocal

cd /d "%~dp0"

echo Installing frontend dependencies...
call npm install
if errorlevel 1 (
  echo Frontend install failed.
  exit /b 1
)

echo Installing backend dependencies...
cd /d "%~dp0server"
call npm install
if errorlevel 1 (
  echo Backend install failed.
  exit /b 1
)

echo Running database seed...
call npm run seed
if errorlevel 1 (
  echo Seed failed.
  exit /b 1
)

echo.
echo All dependencies installed and seed completed successfully.
pause
