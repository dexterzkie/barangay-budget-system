@echo off
echo Starting Barangay Budget System...

echo Starting Backend Server...
start "Backend Server" cmd /k "cd backend && npm run dev"

echo Starting Frontend Server...
start "Frontend Server" cmd /k "cd frontend && npm run dev"

exit
