@echo off
setlocal

cd /d "%~dp0"

echo Instalando a ponte MyKids Zebra...
echo Nao e necessario instalar Node.js ou Python.
echo.

set "INSTALLDIR=%LOCALAPPDATA%\MyKidsZebra"
if not exist "%INSTALLDIR%" mkdir "%INSTALLDIR%"
copy /Y "%~dp0zebra_bridge.ps1" "%INSTALLDIR%\zebra_bridge.ps1" >nul
copy /Y "%~dp0send_zpl.ps1" "%INSTALLDIR%\send_zpl.ps1" >nul
copy /Y "%~dp0start_zebra_bridge.bat" "%INSTALLDIR%\start_zebra_bridge.bat" >nul

set /p "BRIDGETOKEN=Cole o codigo de pareamento mostrado no MyKids: "
if "%BRIDGETOKEN%"=="" (
  echo O codigo de pareamento e obrigatorio.
  pause
  exit /b 1
)
>"%INSTALLDIR%\bridge_token.txt" echo %BRIDGETOKEN%

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%STARTUP%\MyKids Zebra Bridge.lnk');$s.TargetPath='%INSTALLDIR%\start_zebra_bridge.bat';$s.WorkingDirectory='%INSTALLDIR%';$s.Save()"

echo Ponte configurada para iniciar automaticamente com o Windows.
echo Iniciando a ponte agora...
start "MyKids Zebra Bridge" "%INSTALLDIR%\start_zebra_bridge.bat"

echo.
echo Se o Windows pedir permissao de rede/firewall, permita na rede atual.
pause
