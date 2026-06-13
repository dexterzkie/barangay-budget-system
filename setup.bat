@echo off
echo ==========================================
echo    Barangay Budget System Setup Script
echo ==========================================
echo.

echo [1/3] Installing Frontend Dependencies...
cd frontend
call npm install
cd ..
echo.

echo [2/3] Installing Backend Dependencies...
cd backend
call npm install
echo.

echo [3/3] Generating Database Client...
call npx prisma generate
cd ..
echo.

echo ==========================================
echo    SETUP COMPLETE! 
echo ==========================================
echo You only need to run this setup file once.
echo To start the system, double-click "start.bat"
echo.
pause
