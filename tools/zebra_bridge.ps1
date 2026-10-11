$ErrorActionPreference = "Stop"
[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12

$port = 9123
$bridgeVersion = "2.0.0"
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiBase = "https://api.helenaramazzotte.online/api/public/mykids/print-jobs"
$tokenPath = Join-Path $scriptDir "bridge_token.txt"
$printerPath = Join-Path $scriptDir "current_printer.txt"
$printedJobsPath = Join-Path $scriptDir "printed_jobs.txt"
$logPath = Join-Path $scriptDir "bridge.log"
$script:printerState = $null
$script:printerStateAt = [DateTime]::MinValue
$script:printerStatePreference = ""
$script:printerFingerprint = ""
$script:lastCloudContactAt = $null
$script:lastCloudError = $null
$script:cloudPauseUntil = [DateTime]::MinValue

$createdNew = $false
$mutex = [Threading.Mutex]::new($true, "Local\MyKidsZebraBridge", [ref]$createdNew)
if (-not $createdNew) {
  $mutex.Dispose()
  exit 10
}

function Write-BridgeLog([string]$message) {
  try {
    $line = "{0} {1}" -f (Get-Date).ToString("yyyy-MM-dd HH:mm:ss"), $message
    Add-Content -Path $logPath -Value $line -Encoding UTF8
  } catch {}
}

function Set-CloudError([string]$message) {
  if ($script:lastCloudError -ne $message) {
    if ($message) { Write-BridgeLog "API: $message" }
    elseif ($script:lastCloudError) { Write-BridgeLog "API conectada novamente." }
  }
  $script:lastCloudError = $message
}

function Get-SavedPrinterName {
  try {
    if (Test-Path $printerPath) {
      return [string](Get-Content $printerPath -Raw).Trim()
    }
  } catch {}
  return ""
}

function Save-PrinterName([string]$printerName) {
  if ([string]::IsNullOrWhiteSpace($printerName)) { return }
  try {
    [IO.File]::WriteAllText($printerPath, $printerName, [Text.UTF8Encoding]::new($false))
  } catch {}
}

function New-PrinterState($printer) {
  $name = [string]$printer.Name
  $portName = [string]$printer.PortName
  $errorMessage = $null
  $printerStatus = [int]$printer.PrinterStatus
  $extendedStatus = [int]$printer.ExtendedPrinterStatus
  $detectedError = [int]$printer.DetectedErrorState

  if ([bool]$printer.WorkOffline) {
    $errorMessage = "A fila da Zebra esta offline no Windows"
  } elseif ($printerStatus -eq 7 -or $extendedStatus -eq 7) {
    $errorMessage = "A Zebra esta desconectada ou desligada"
  } elseif ($printerStatus -eq 6 -or (@(6, 8, 9, 11, 19, 21) -contains $extendedStatus)) {
    $errorMessage = "A Zebra nao esta pronta para imprimir"
  } elseif (@(4, 7, 8, 9, 10, 11) -contains $detectedError) {
    $errorMessage = "A Zebra informou um erro de papel, tampa ou conexao"
  }

  $connection = if ($portName -match "^USB") {
    "USB"
  } elseif ($portName -match "^(WSD|IP_|TCP)") {
    "Rede"
  } else {
    $portName
  }

  return [pscustomobject]@{
    Name = $name
    PortName = $portName
    Connection = $connection
    IsOnline = -not [bool]$errorMessage
    Error = $errorMessage
  }
}

function Get-ZebraPrinterState([string]$preferredName = "", [switch]$force) {
  if (-not $preferredName) { $preferredName = Get-SavedPrinterName }
  $cacheAge = ((Get-Date) - $script:printerStateAt).TotalSeconds
  if (-not $force -and $script:printerState -and $cacheAge -lt 2 -and $script:printerStatePreference -eq $preferredName) {
    return $script:printerState
  }

  try {
    $allPrinters = @(Get-CimInstance -ClassName Win32_Printer -ErrorAction Stop)
    $candidates = @()
    $seen = @{}

    if ($preferredName) {
      $preferred = $allPrinters | Where-Object { [string]$_.Name -eq $preferredName } | Select-Object -First 1
      if ($preferred) {
        $candidates += $preferred
        $seen[[string]$preferred.Name] = $true
      }
    }

    foreach ($printer in $allPrinters) {
      $description = "{0} {1}" -f [string]$printer.Name, [string]$printer.DriverName
      if ($description -match "Zebra|ZDesigner|\bZD\d+|ZPL") {
        $name = [string]$printer.Name
        if (-not $seen.ContainsKey($name)) {
          $candidates += $printer
          $seen[$name] = $true
        }
      }
    }

    if (-not $candidates.Count) {
      $state = [pscustomobject]@{
        Name = $null
        PortName = $null
        Connection = $null
        IsOnline = $false
        Error = "Nenhuma impressora Zebra instalada foi encontrada no Windows"
      }
    } else {
      $states = @($candidates | ForEach-Object { New-PrinterState $_ })
      $state = $states | Where-Object { $_.IsOnline -and $_.Name -eq $preferredName } | Select-Object -First 1
      if (-not $state) { $state = $states | Where-Object { $_.IsOnline } | Select-Object -First 1 }
      if (-not $state) { $state = $states | Where-Object { $_.Name -eq $preferredName } | Select-Object -First 1 }
      if (-not $state) { $state = $states | Select-Object -First 1 }
      if ($state.Name) { Save-PrinterName $state.Name }
    }
  } catch {
    $state = [pscustomobject]@{
      Name = $null
      PortName = $null
      Connection = $null
      IsOnline = $false
      Error = "Nao foi possivel consultar as impressoras do Windows: $($_.Exception.Message)"
    }
  }

  $fingerprint = "{0}|{1}|{2}|{3}" -f $state.Name, $state.IsOnline, $state.PortName, $state.Error
  if ($fingerprint -ne $script:printerFingerprint) {
    if ($state.IsOnline) {
      Write-BridgeLog "Zebra detectada: $($state.Name) na porta $($state.PortName)."
    } else {
      Write-BridgeLog "Zebra indisponivel: $($state.Error)."
    }
    $script:printerFingerprint = $fingerprint
  }

  $script:printerState = $state
  $script:printerStateAt = Get-Date
  $script:printerStatePreference = $preferredName
  return $state
}

function Test-Paired {
  try {
    return ((Test-Path $tokenPath) -and -not [string]::IsNullOrWhiteSpace((Get-Content $tokenPath -Raw)))
  } catch {
    return $false
  }
}

function Get-HealthPayload([switch]$force) {
  $state = Get-ZebraPrinterState -force:$force
  $cloudOnline = $false
  if ($script:lastCloudContactAt) {
    $cloudOnline = (((Get-Date) - $script:lastCloudContactAt).TotalSeconds -lt 90)
  }
  return @{
    ok = $true
    service = "mykids-zebra-bridge"
    bridgeVersion = $bridgeVersion
    paired = Test-Paired
    cloudOnline = $cloudOnline
    cloudError = $script:lastCloudError
    printerOnline = [bool]$state.IsOnline
    printerName = $state.Name
    portName = $state.PortName
    connection = $state.Connection
    error = $state.Error
    printUrl = "http://127.0.0.1:$port/print"
  }
}

function Send-Response($stream, [int]$status, $body) {
  $json = if ($status -eq 204) { "" } else { $body | ConvertTo-Json -Compress -Depth 6 }
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $reason = switch ($status) {
    200 { "OK" }
    204 { "No Content" }
    400 { "Bad Request" }
    404 { "Not Found" }
    default { "Internal Server Error" }
  }
  $headers = "HTTP/1.1 $status $reason`r`nContent-Type: application/json; charset=utf-8`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nAccess-Control-Allow-Headers: Content-Type`r`nAccess-Control-Allow-Methods: GET, POST, OPTIONS`r`nAccess-Control-Allow-Private-Network: true`r`nCache-Control: no-store`r`nConnection: close`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($headers)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($bytes.Length) { $stream.Write($bytes, 0, $bytes.Length) }
}

function Send-ZplToPrinter([string]$zpl, [string]$requestedPrinter) {
  if ([string]::IsNullOrWhiteSpace($zpl)) { throw "Campo zpl vazio" }
  $zplFile = Join-Path $env:TEMP ("mykids-" + [guid]::NewGuid().ToString() + ".zpl")
  [IO.File]::WriteAllText($zplFile, $zpl, [Text.UTF8Encoding]::new($false))
  $lastError = $null
  try {
    for ($attempt = 1; $attempt -le 3; $attempt++) {
      $state = Get-ZebraPrinterState $requestedPrinter -force
      if (-not $state.Name) { throw $state.Error }
      if (-not $state.IsOnline) { throw $state.Error }
      try {
        & (Join-Path $scriptDir "send_zpl.ps1") -PrinterName $state.Name -ZplPath $zplFile
        Write-BridgeLog "ZPL enviado para $($state.Name)."
        return $state
      } catch {
        $lastError = $_.Exception.Message
        $script:printerStateAt = [DateTime]::MinValue
        if ($attempt -lt 3) { Start-Sleep -Milliseconds 900 }
      }
    }
    throw "Falha ao enviar para a Zebra: $lastError"
  } finally {
    Remove-Item $zplFile -Force -ErrorAction SilentlyContinue
  }
}

function Test-JobPrintedLocally([long]$jobId) {
  try {
    if (-not (Test-Path $printedJobsPath)) { return $false }
    return @((Get-Content $printedJobsPath) | ForEach-Object { $_.Trim() }) -contains [string]$jobId
  } catch {
    return $false
  }
}

function Remember-PrintedJob([long]$jobId) {
  try {
    $ids = @()
    if (Test-Path $printedJobsPath) { $ids = @(Get-Content $printedJobsPath | Where-Object { $_ -match "^\d+$" }) }
    if ($ids -notcontains [string]$jobId) { $ids += [string]$jobId }
    if ($ids.Count -gt 300) { $ids = @($ids | Select-Object -Last 300) }
    [IO.File]::WriteAllLines($printedJobsPath, [string[]]$ids, [Text.UTF8Encoding]::new($false))
  } catch {}
}

function Receive-CloudPrintJob {
  if ((Get-Date) -lt $script:cloudPauseUntil) { return }
  if (-not (Test-Paired)) {
    Set-CloudError "Codigo de pareamento nao configurado"
    return
  }

  $token = (Get-Content $tokenPath -Raw).Trim()
  $headers = @{ "X-Bridge-Token" = $token; "Origin" = "https://app.helenaramazzotte.online" }
  $printerState = Get-ZebraPrinterState
  $claimBody = @{
    printer_online = [bool]$printerState.IsOnline
    printer_name = $printerState.Name
    printer_error = $printerState.Error
    bridge_version = $bridgeVersion
  } | ConvertTo-Json -Compress

  try {
    $response = Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$apiBase/claim" -Headers $headers -ContentType "application/json" -Body $claimBody -TimeoutSec 5
    $script:lastCloudContactAt = Get-Date
    Set-CloudError $null
    if ($response.StatusCode -eq 204 -or -not $response.Content) { return }

    $job = $response.Content | ConvertFrom-Json
    $result = $null
    if (Test-JobPrintedLocally ([long]$job.id)) {
      $result = @{ ok = $true; printer_name = $printerState.Name }
      Write-BridgeLog "Trabalho $($job.id) ja impresso; reenviando somente a confirmacao."
    } else {
      try {
        $usedPrinter = Send-ZplToPrinter ([string]$job.zpl) ([string]$job.printer_name)
        Remember-PrintedJob ([long]$job.id)
        $result = @{ ok = $true; printer_name = $usedPrinter.Name }
      } catch {
        $errorMessage = $_.Exception.Message
        $latestState = Get-ZebraPrinterState -force
        $result = @{
          ok = $false
          retry = $true
          error = $errorMessage
          printer_name = $latestState.Name
        }
        $script:cloudPauseUntil = (Get-Date).AddSeconds(5)
        Write-BridgeLog "Trabalho $($job.id) aguardara reconexao: $errorMessage"
      }
    }

    $resultJson = $result | ConvertTo-Json -Compress
    Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$apiBase/$($job.id)/complete" -Headers $headers -ContentType "application/json" -Body $resultJson -TimeoutSec 5 | Out-Null
    $script:lastCloudContactAt = Get-Date
  } catch {
    Set-CloudError $_.Exception.Message
    Start-Sleep -Seconds 2
  }
}

$listener = $null
try {
  try {
    if ((Test-Path $logPath) -and (Get-Item $logPath).Length -gt 1048576) {
      Move-Item $logPath "$logPath.old" -Force
    }
  } catch {}
  Write-BridgeLog "Ponte MyKids Zebra $bridgeVersion iniciada."

  $listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $port)
  $listener.Start()

  while ($true) {
    if (-not $listener.Pending()) {
      Receive-CloudPrintJob
      Start-Sleep -Milliseconds 1200
      continue
    }

    $client = $listener.AcceptTcpClient()
    $client.ReceiveTimeout = 7000
    $client.SendTimeout = 7000
    $stream = $null
    try {
      $stream = $client.GetStream()
      $reader = [IO.StreamReader]::new($stream, [Text.Encoding]::UTF8, $false, 4096, $true)
      $requestLine = $reader.ReadLine()
      if (-not $requestLine) { continue }
      $parts = $requestLine.Split(" ")
      $method = $parts[0]
      $path = $parts[1].Split("?")[0]
      $contentLength = 0
      while ($true) {
        $line = $reader.ReadLine()
        if ([string]::IsNullOrEmpty($line)) { break }
        if ($line -match "^Content-Length:\s*(\d+)") { $contentLength = [int]$Matches[1] }
      }

      if ($method -eq "OPTIONS") {
        Send-Response $stream 204 @{ ok = $true }
      } elseif ($method -eq "GET" -and ($path -eq "/" -or $path -eq "/health")) {
        Send-Response $stream 200 (Get-HealthPayload)
      } elseif ($method -eq "POST" -and $path -eq "/reconnect") {
        $script:printerStateAt = [DateTime]::MinValue
        Send-Response $stream 200 (Get-HealthPayload -force)
      } elseif ($method -eq "POST" -and $path -eq "/print") {
        try {
          $chars = New-Object char[] $contentLength
          $read = 0
          while ($read -lt $contentLength) {
            $currentRead = $reader.Read($chars, $read, $contentLength - $read)
            if ($currentRead -le 0) { break }
            $read += $currentRead
          }
          $payloadText = if ($read -gt 0) { -join $chars[0..($read - 1)] } else { "" }
          $payload = $payloadText | ConvertFrom-Json
          $usedPrinter = Send-ZplToPrinter ([string]$payload.zpl) ([string]$payload.printerName)
          Send-Response $stream 200 @{ ok = $true; printerOnline = $true; printerName = $usedPrinter.Name }
        } catch {
          Send-Response $stream 500 @{ ok = $false; printerOnline = $false; error = $_.Exception.Message }
        }
      } else {
        Send-Response $stream 404 @{ ok = $false; error = "Nao encontrado" }
      }
    } catch {
      if ($stream) {
        try { Send-Response $stream 500 @{ ok = $false; error = $_.Exception.Message } } catch {}
      }
    } finally {
      $client.Close()
    }
  }
} finally {
  if ($listener) { try { $listener.Stop() } catch {} }
  Write-BridgeLog "Ponte encerrada."
  try { $mutex.ReleaseMutex() } catch {}
  $mutex.Dispose()
}
