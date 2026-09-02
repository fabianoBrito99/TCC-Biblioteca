$ErrorActionPreference = "Stop"
$port = 9123
$scriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
$apiBase = "https://api.helenaramazzotte.online/api/public/mykids/print-jobs"
$tokenPath = Join-Path $scriptDir "bridge_token.txt"

function Get-ZebraPrinter {
  $printers = @(Get-CimInstance Win32_Printer | Select-Object -ExpandProperty Name)
  $zebra = $printers | Where-Object { $_ -match "Zebra|ZDesigner|ZD\d+|ZPL" } | Select-Object -First 1
  if (-not $zebra) { $zebra = (Get-CimInstance Win32_Printer | Where-Object Default | Select-Object -ExpandProperty Name -First 1) }
  if (-not $zebra) { throw "Nenhuma impressora instalada foi encontrada" }
  return [string]$zebra
}

function Send-Response($stream, [int]$status, $body) {
  $json = $body | ConvertTo-Json -Compress -Depth 5
  $bytes = [Text.Encoding]::UTF8.GetBytes($json)
  $reason = if ($status -eq 200) { "OK" } elseif ($status -eq 204) { "No Content" } elseif ($status -eq 404) { "Not Found" } else { "Internal Server Error" }
  $headers = "HTTP/1.1 $status $reason`r`nContent-Type: application/json; charset=utf-8`r`nContent-Length: $($bytes.Length)`r`nAccess-Control-Allow-Origin: *`r`nAccess-Control-Allow-Headers: Content-Type`r`nAccess-Control-Allow-Methods: GET, POST, OPTIONS`r`nAccess-Control-Allow-Private-Network: true`r`nConnection: close`r`n`r`n"
  $headerBytes = [Text.Encoding]::ASCII.GetBytes($headers)
  $stream.Write($headerBytes, 0, $headerBytes.Length)
  if ($status -ne 204) { $stream.Write($bytes, 0, $bytes.Length) }
}

function Send-ZplToPrinter([string]$zpl, [string]$requestedPrinter) {
  if ([string]::IsNullOrWhiteSpace($zpl)) { throw "Campo zpl vazio" }
  $printer = if ($requestedPrinter) { $requestedPrinter } else { Get-ZebraPrinter }
  $zplFile = Join-Path $env:TEMP ("mykids-" + [guid]::NewGuid().ToString() + ".zpl")
  [IO.File]::WriteAllText($zplFile, $zpl, [Text.Encoding]::UTF8)
  try { & (Join-Path $scriptDir "send_zpl.ps1") -PrinterName $printer -ZplPath $zplFile } finally { Remove-Item $zplFile -Force -ErrorAction SilentlyContinue }
  return $printer
}

function Receive-CloudPrintJob {
  if (-not (Test-Path $tokenPath)) { return }
  $token = (Get-Content $tokenPath -Raw).Trim()
  if (-not $token) { return }
  $headers = @{ "X-Bridge-Token" = $token; "Origin" = "https://app.helenaramazzotte.online" }
  try {
    $response = Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$apiBase/claim" -Headers $headers -ContentType "application/json" -Body "{}" -TimeoutSec 10
    if ($response.StatusCode -eq 204 -or -not $response.Content) { return }
    $job = $response.Content | ConvertFrom-Json
    try {
      Send-ZplToPrinter ([string]$job.zpl) ([string]$job.printer_name) | Out-Null
      $result = @{ ok = $true } | ConvertTo-Json -Compress
    } catch {
      $result = @{ ok = $false; error = $_.Exception.Message } | ConvertTo-Json -Compress
    }
    Invoke-WebRequest -UseBasicParsing -Method Post -Uri "$apiBase/$($job.id)/complete" -Headers $headers -ContentType "application/json" -Body $result -TimeoutSec 10 | Out-Null
  } catch {
    Start-Sleep -Seconds 2
  }
}

$listener = [Net.Sockets.TcpListener]::new([Net.IPAddress]::Loopback, $port)
$listener.Start()

while ($true) {
  if (-not $listener.Pending()) {
    Receive-CloudPrintJob
    Start-Sleep -Milliseconds 700
    continue
  }
  $client = $listener.AcceptTcpClient()
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
      try {
        $printer = Get-ZebraPrinter
        Send-Response $stream 200 @{ ok = $true; service = "mykids-zebra-bridge"; printerName = $printer; printUrl = "http://127.0.0.1:$port/print" }
      } catch {
        Send-Response $stream 200 @{ ok = $false; service = "mykids-zebra-bridge"; error = $_.Exception.Message }
      }
    } elseif ($method -eq "POST" -and $path -eq "/print") {
      try {
        $chars = New-Object char[] $contentLength
        $read = 0
        while ($read -lt $contentLength) { $read += $reader.Read($chars, $read, $contentLength - $read) }
        $payload = (-join $chars) | ConvertFrom-Json
        $printer = Send-ZplToPrinter ([string]$payload.zpl) ([string]$payload.printerName)
        Send-Response $stream 200 @{ ok = $true; printerName = $printer }
      } catch {
        Send-Response $stream 500 @{ ok = $false; error = $_.Exception.Message }
      }
    } else {
      Send-Response $stream 404 @{ ok = $false; error = "Nao encontrado" }
    }
  } catch {
    try { Send-Response $stream 500 @{ ok = $false; error = $_.Exception.Message } } catch {}
  } finally {
    $client.Close()
  }
}
