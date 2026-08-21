@echo off
setlocal

cd /d "%~dp0"

where node >nul 2>nul
if not %errorlevel%==0 (
  echo Node.js nao encontrado.
  echo Instale o Node.js LTS ou rode este script no computador onde o projeto ja roda.
  pause
  exit /b 1
)

node "%~dp0zebra_bridge.js"
pause
