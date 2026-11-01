@echo off
setlocal
cd /d "%~dp0"

echo ========================================================
echo   KLD School EMR - Local Development Launcher
echo ========================================================

if not exist "server\.env" (
  echo ERROR: server\.env is missing.
  echo Run setup-local.bat first, then configure the database and JWT settings.
  pause
  exit /b 1
)

if not exist "node_modules" (
  echo ERROR: Dependencies are not installed.
  echo Run setup-local.bat first.
  pause
  exit /b 1
)

echo Ensure MySQL is running in XAMPP and kld_school_emr has been imported.
echo Opening frontend at http://localhost:5173 after the servers start.
start "" /b cmd /c "timeout /t 4 /nobreak >nul && start http://localhost:5173"
call npm run dev
