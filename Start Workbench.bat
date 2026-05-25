@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if errorlevel 1 (
  echo Node.js is required to run Workbench.
  echo Install Node.js from https://nodejs.org/ and run this file again.
  pause
  exit /b 1
)

where npm.cmd >nul 2>nul
if errorlevel 1 (
  echo npm was not found. Please reinstall Node.js with npm enabled.
  pause
  exit /b 1
)

powershell -NoProfile -ExecutionPolicy Bypass -Command "try { Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:5050/api/tools' -TimeoutSec 2 | Out-Null; exit 0 } catch { exit 1 }" >nul 2>nul
if %errorlevel%==0 goto open_site

if not exist "node_modules\" (
  echo Installing dependencies. This can take a few minutes the first time...
  call npm.cmd install
  if errorlevel 1 (
    echo Dependency installation failed.
    pause
    exit /b 1
  )
)

if not exist "dist\index.html" (
  echo Building Workbench...
  call npm.cmd run build
  if errorlevel 1 (
    echo Build failed.
    pause
    exit /b 1
  )
)

echo Starting Workbench server...
start "Workbench Server" /D "%~dp0" cmd /k npm.cmd start

echo Waiting for server...
powershell -NoProfile -ExecutionPolicy Bypass -Command "$deadline=(Get-Date).AddSeconds(25); do { try { Invoke-WebRequest -UseBasicParsing 'http://127.0.0.1:5050/api/tools' -TimeoutSec 2 | Out-Null; exit 0 } catch { Start-Sleep -Milliseconds 700 } } while ((Get-Date) -lt $deadline); exit 1" >nul 2>nul
if errorlevel 1 (
  echo Workbench server did not start. Check the Workbench Server window.
  pause
  exit /b 1
)

:open_site
start "" "http://127.0.0.1:5050"
echo Workbench is open at http://127.0.0.1:5050
pause
