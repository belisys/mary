@echo off
setlocal enabledelayedexpansion

echo ===================================================
echo     ✦ SANCTUARY OF MARY - SEAMLESS GITHUB SYNC ✦
echo ===================================================
echo.

cd /d "%~dp0"

echo [1/3] Staging changes...
git add .

set /p msg="Enter change description (or press Enter for auto-date): "
if "%msg%"=="" (
    for /f "tokens=2 delims==" %%I in ('wmic os get localdatetime /value') do set dt=%%I
    set msg=update !dt:~0,4!-!dt:~4,2!-!dt:~6,2!_!dt:~8,2!:!dt:~10,2!
)

echo [2/3] Committing changes...
git commit -m "%msg%"

echo [3/3] Pushing to GitHub Pages...
git push origin main

echo.
echo ===================================================
echo  SUCCESS! Changes pushed to GitHub!
echo  Live URL: https://belisys.github.io/mary/
echo  (GitHub Pages updates in ~30 seconds)
echo ===================================================
echo.
pause
