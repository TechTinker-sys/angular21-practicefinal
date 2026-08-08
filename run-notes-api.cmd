@echo off
REM Run this from the repo root or double-click this file.
cd /d "%~dp0"

echo Installing dependencies...
npm install
if errorlevel 1 pause & exit /b 1

echo Building the Angular project...
npm run build
if errorlevel 1 pause & exit /b 1

echo Starting the SSR server in a new window...
start "Notes API Server" cmd /k "npm run serve:ssr:angular21-practice"

echo.
echo The server is starting in a new window.
echo Once the server is running, open a second CMD window and run:
echo   test-notes-api.cmd
echo.
pause