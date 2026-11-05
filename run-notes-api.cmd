@echo off
REM Run this from the repo root or double-click this file.
cd /d "%~dp0"

echo Installing backend dependencies...
npm install --prefix backend
if errorlevel 1 pause & exit /b 1

echo Building the Angular project...
npm run build
if errorlevel 1 pause & exit /b 1

echo Running backend migrations...
npm --prefix backend run db:migrate
if errorlevel 1 pause & exit /b 1

echo Starting the backend API in a new window...
start "Notes API Backend" cmd /k "npm --prefix backend run dev"

echo Starting the Angular SSR server in a new window...
start "Angular SSR" cmd /k "npm run serve:ssr:angular21-practice"

echo.
echo The server is starting in a new window.
echo Once the server is running, open a second CMD window and run:
echo   test-notes-api.cmd
echo.
pause