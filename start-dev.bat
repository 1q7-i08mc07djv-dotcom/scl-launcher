@echo off
echo Starting SCL Launcher Development Environment...
echo.

:: Start backend
echo [1/2] Starting Backend (Spring Boot on port 8765)...
start "SCL Backend" cmd /k "cd /d %~dp0backend && ..\gradlew.bat bootRun"

:: Wait a bit for backend to start
timeout /t 15 /nobreak > nul

:: Start frontend
echo [2/2] Starting Frontend (Vite on port 5173)...
cd /d %~dp0frontend
call npm run dev

pause
