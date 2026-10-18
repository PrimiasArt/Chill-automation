@echo off
chcp 65001 >nul
title Cai Dat & Khoi Dong Chill Automation Studio Tren May Moi
echo ================================================================
echo   CHILL AUTOMATION STUDIO 3.0 - CAI DAT TREN MAY TINH MOI
echo ================================================================
echo.

cd /d "%~dp0"

where node >nul 2>nul
if %errorlevel% neq 0 (
  echo [!] May tinh nay chua cai Node.js!
  echo Vui long tai va cai Node.js LTS tai: https://nodejs.org/
  pause
  exit /b 1
)

if not exist "node_modules\" (
  echo [1/2] Dang tu dong cai dat 30 thu vien Video 2D/3D & Am thanh...
  call npm.cmd install --legacy-peer-deps
) else (
  echo [1/2] Da co san thu muc node_modules.
)

echo.
echo [2/2] Dang khoi dong Ban Lam Viec Video AI tai http://localhost:4000 ...
start "" "http://localhost:4000"
node studio-server.mjs
pause
