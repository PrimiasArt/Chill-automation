@echo off
chcp 65001 >nul
title Chill Automation Studio - Giao Dien Lam Video AI (Port 4000)
cd /d "%~dp0"
echo ===============================================================
echo   DANG KHOI DONG CHILL AUTOMATION STUDIO (TIENG VIET)...
echo   Giao dien se tu dong mo tai: http://localhost:4000
echo ===============================================================
start "" "http://localhost:4000"
node studio-server.mjs
pause
