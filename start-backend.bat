@echo off
title AI-DMS Backend Server
echo.
echo  ╔══════════════════════════════════════════╗
echo  ║         AI - DMS Backend Server          ║
echo  ║    Starting on http://localhost:3001      ║
echo  ╚══════════════════════════════════════════╝
echo.
cd /d "%~dp0backend"
node server.js
pause
