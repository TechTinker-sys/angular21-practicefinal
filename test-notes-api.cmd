@echo off
REM Run this file from the repo root after the server is already running.
cd /d "%~dp0"
powershell -NoProfile -ExecutionPolicy Bypass -File "%~dp0test-notes-api.ps1"
pause