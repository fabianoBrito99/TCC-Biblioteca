@echo off
setlocal EnableExtensions EnableDelayedExpansion

cd /d "%~dp0"

echo Instalando a ponte MyKids Zebra...
echo Nao e necessario instalar Node.js ou Python.
echo.

set "INSTALLDIR=%LOCALAPPDATA%\MyKidsZebra"
if not exist "%INSTALLDIR%" mkdir "%INSTALLDIR%"
if not exist "%INSTALLDIR%" goto :install_error

echo Encerrando versoes antigas da ponte...
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$dir='%INSTALLDIR%'; Get-CimInstance Win32_Process | Where-Object { $_.ProcessId -ne $PID -and $_.CommandLine -like ('*' + $dir + '*') -and (@('cmd.exe','powershell.exe','wscript.exe') -contains $_.Name) } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }" >nul 2>&1

copy /Y "%~dp0zebra_bridge.ps1" "%INSTALLDIR%\zebra_bridge.ps1" >nul || goto :copy_error
copy /Y "%~dp0send_zpl.ps1" "%INSTALLDIR%\send_zpl.ps1" >nul || goto :copy_error
copy /Y "%~dp0start_zebra_bridge.bat" "%INSTALLDIR%\start_zebra_bridge.bat" >nul || goto :copy_error
copy /Y "%~dp0run_zebra_bridge.vbs" "%INSTALLDIR%\run_zebra_bridge.vbs" >nul || goto :copy_error

set "BRIDGETOKEN="
if exist "%INSTALLDIR%\bridge_token.txt" (
  echo Pareamento existente encontrado.
  set /p "BRIDGETOKEN=Cole um novo codigo ou pressione ENTER para manter o atual: "
  if not "!BRIDGETOKEN!"=="" >"%INSTALLDIR%\bridge_token.txt" echo(!BRIDGETOKEN!
) else (
  set /p "BRIDGETOKEN=Cole o codigo de pareamento mostrado no MyKids: "
  if "!BRIDGETOKEN!"=="" (
    echo O codigo de pareamento e obrigatorio.
    pause
    exit /b 1
  )
  >"%INSTALLDIR%\bridge_token.txt" echo(!BRIDGETOKEN!
)

set "STARTUP=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup"
powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('%STARTUP%\MyKids Zebra Bridge.lnk');$s.TargetPath=(Join-Path $env:SystemRoot 'System32\wscript.exe');$s.Arguments=[char]34 + '%INSTALLDIR%\run_zebra_bridge.vbs' + [char]34;$s.WorkingDirectory='%INSTALLDIR%';$s.Save()" >nul 2>&1

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$run='HKCU:\Software\Microsoft\Windows\CurrentVersion\Run';$wscript=Join-Path $env:SystemRoot 'System32\wscript.exe';$command=[char]34+$wscript+[char]34+' '+[char]34+'%INSTALLDIR%\run_zebra_bridge.vbs'+[char]34;New-Item -Path $run -Force | Out-Null;New-ItemProperty -Path $run -Name 'MyKidsZebraBridge' -Value $command -PropertyType String -Force | Out-Null" >nul 2>&1

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "$protocol='HKCU:\Software\Classes\mykids-zebra';$commandKey=$protocol+'\shell\open\command';$wscript=Join-Path $env:SystemRoot 'System32\wscript.exe';$command=[char]34+$wscript+[char]34+' '+[char]34+'%INSTALLDIR%\run_zebra_bridge.vbs'+[char]34;New-Item -Path $commandKey -Force | Out-Null;Set-Item -Path $protocol -Value 'URL:MyKids Zebra Bridge';New-ItemProperty -Path $protocol -Name 'URL Protocol' -Value '' -PropertyType String -Force | Out-Null;Set-Item -Path $commandKey -Value $command" >nul 2>&1

echo Ponte configurada para iniciar automaticamente com o Windows.
echo Iniciando e procurando a Zebra USB agora...
start "" wscript.exe "%INSTALLDIR%\run_zebra_bridge.vbs"
timeout /t 3 /nobreak >nul

powershell.exe -NoProfile -ExecutionPolicy Bypass -Command "try{$h=Invoke-RestMethod -UseBasicParsing -Uri 'http://127.0.0.1:9123/reconnect' -Method Post -TimeoutSec 8;if($h.printerOnline){Write-Host ('Zebra conectada automaticamente: '+$h.printerName+' ['+$h.connection+']') -ForegroundColor Green}else{Write-Host ('A ponte esta ativa, mas a Zebra ainda nao foi encontrada: '+$h.error) -ForegroundColor Yellow}}catch{Write-Host ('A ponte nao respondeu: '+$_.Exception.Message) -ForegroundColor Red}"

echo.
echo A ponte permanecera em segundo plano e recuperara a conexao sem precisar de F5.
echo Ao clicar em Zebra no MyKids, ela tambem tenta iniciar e redetectar a impressora.
echo Se a impressora nao aparecer, confirme se o driver Zebra esta instalado e o cabo USB esta conectado.
pause
exit /b 0

:copy_error
echo Nao foi possivel atualizar os arquivos da ponte. Feche programas que estejam usando a pasta e tente novamente.
pause
exit /b 1

:install_error
echo Nao foi possivel criar a pasta de instalacao %INSTALLDIR%.
pause
exit /b 1
