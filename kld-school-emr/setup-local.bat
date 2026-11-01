@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo   KLD School EMR - First-Time Dependency Setup
echo ========================================================

echo.
where node >nul 2>nul
if errorlevel 1 (
  echo ERROR: Node.js is not installed or is not in PATH.
  echo Install Node.js 20 LTS or newer, reopen this window, and run again.
  pause
  exit /b 1
)

if not exist "server\.env" (
  copy /y "server\.env.example" "server\.env" >nul
  echo Created server\.env from the example file.
  echo IMPORTANT: Open server\.env and replace JWT_SECRET before real use.
)

if not exist "client\.env" (
  copy /y "client\.env.example" "client\.env" >nul
  echo Created client\.env from the example file.
)

echo.
echo Installing root, backend, and frontend dependencies...
call npm run install:all
if errorlevel 1 (
  echo.
  echo ERROR: Dependency installation failed.
  echo Check your internet connection and npm configuration, then run this file again.
  pause
  exit /b 1
)

echo.
echo Running source validation...
call npm run verify:source
if errorlevel 1 (
  echo ERROR: Source validation failed. Review the messages above.
  pause
  exit /b 1
)

echo.
echo Setup completed.
echo Next: import database\schema.sql and database\seed.sql, then run start-local.bat.
pause
