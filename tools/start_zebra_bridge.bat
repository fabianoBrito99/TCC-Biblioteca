@echo off
setlocal
cd /d "%~dp0"

:restart
powershell.exe -NoProfile -ExecutionPolicy Bypass -WindowStyle Hidden -File "%~dp0zebra_bridge.ps1" >>"%~dp0bridge-console.log" 2>&1
set "BRIDGE_EXIT=%ERRORLEVEL%"
if "%BRIDGE_EXIT%"=="10" exit /b 0
timeout /t 5 /nobreak >nul
goto restart
