@echo off
setlocal

cd /d "%~dp0"

echo A ponte Zebra agora usa Node.js e PowerShell do Windows.
echo Nao precisa instalar Python nem pywin32.
echo.
echo Para iniciar a ponte, rode:
echo start_zebra_bridge.bat

echo.
echo Se o Windows pedir permissao de rede/firewall, permita na rede atual.
pause
