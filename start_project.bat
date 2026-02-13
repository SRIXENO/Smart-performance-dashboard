@echo off
setlocal

cd /d "%~dp0"

start "Backend Server" cmd /k "cd /d ""%~dp0server"" && npm run dev"
start "Frontend App" cmd /k "cd /d ""%~dp0"" && npm run dev"

echo Started backend and frontend in separate windows.
echo Backend: http://localhost:5000
echo Frontend: http://localhost:3000
pause
