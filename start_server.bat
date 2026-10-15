@echo off
title Mary's Sanctuary - Local Server (Port 8088)
cd /d "%~dp0"
echo =======================================================================
echo    Launching "for mary." - 3D Interactive Sanctuary Website
echo =======================================================================
echo.
echo   Local Address: http://localhost:8088
echo.
echo   * Automatically opening your web browser...
echo   * Press CTRL+C in this window anytime to stop the server.
echo.
echo =======================================================================
start http://localhost:8088
python -m http.server 8088
pause
