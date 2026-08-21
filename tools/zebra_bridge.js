const crypto = require("crypto");
const fs = require("fs");
const http = require("http");
const os = require("os");
const path = require("path");
const { execFile } = require("child_process");

const HOST = "0.0.0.0";
const PORT = 9123;
const ZEBRA_HINTS = ["zebra", "zd", "zdesigner", "zpl"];

function runPowerShell(args) {
  return new Promise((resolve, reject) => {
    execFile("powershell.exe", ["-NoProfile", "-ExecutionPolicy", "Bypass", ...args], {
      windowsHide: true,
      timeout: 15000,
    }, (error, stdout, stderr) => {
      if (error) {
        reject(new Error((stderr || error.message || "Falha no PowerShell").trim()));
        return;
      }
      resolve(stdout);
    });
  });
}

async function listPrinters() {
  const stdout = await runPowerShell([
    "-Command",
    "Add-Type -AssemblyName System.Drawing; $default = (New-Object System.Drawing.Printing.PrinterSettings).PrinterName; [System.Drawing.Printing.PrinterSettings]::InstalledPrinters | ForEach-Object { [pscustomobject]@{ Name = [string]$_; Default = ([string]$_ -eq $default) } } | ConvertTo-Json -Compress",
  ]);
  if (!stdout.trim()) return [];
  const parsed = JSON.parse(stdout);
  return (Array.isArray(parsed) ? parsed : [parsed]).filter((printer) => printer && printer.Name);
}

async function detectPrinter() {
  const printers = await listPrinters();
  const hinted = printers.find((printer) => {
    const name = String(printer.Name).toLowerCase();
    return ZEBRA_HINTS.some((hint) => name.includes(hint));
  });
  if (hinted) return hinted.Name;

  const defaultPrinter = printers.find((printer) => printer.Default);
  if (defaultPrinter) return defaultPrinter.Name;

  throw new Error("Nenhuma impressora instalada foi encontrada");
}

function getLocalIp() {
  const interfaces = os.networkInterfaces();
  for (const entries of Object.values(interfaces)) {
    for (const entry of entries || []) {
      if (entry.family === "IPv4" && !entry.internal) return entry.address;
    }
  }
  return "127.0.0.1";
}

function sendJson(response, statusCode, body) {
  response.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Private-Network": "true",
  });
  response.end(JSON.stringify(body));
}

function readJson(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        request.destroy();
        reject(new Error("Payload muito grande"));
      }
    });
    request.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("JSON invalido"));
      }
    });
    request.on("error", reject);
  });
}

async function printZpl(printerName, zpl) {
  const resolvedPrinter = printerName || await detectPrinter();
  const zplPath = path.join(os.tmpdir(), `mykids-zpl-${crypto.randomUUID()}.zpl`);
  fs.writeFileSync(zplPath, zpl, "utf8");
  try {
    await runPowerShell([
      "-File",
      path.join(__dirname, "send_zpl.ps1"),
      "-PrinterName",
      resolvedPrinter,
      "-ZplPath",
      zplPath,
    ]);
  } finally {
    fs.rmSync(zplPath, { force: true });
  }
  return resolvedPrinter;
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://${HOST}:${PORT}`);

  if (request.method === "OPTIONS") {
    sendJson(response, 204, { ok: true });
    return;
  }

  if (request.method === "GET" && (url.pathname === "/" || url.pathname === "/health")) {
    try {
      const printers = await listPrinters();
      const printerName = await detectPrinter();
      sendJson(response, 200, {
        ok: true,
        service: "mykids-zebra-bridge",
        printerName,
        printers: printers.map((printer) => printer.Name),
        printUrl: `http://${getLocalIp()}:${PORT}/print`,
        error: null,
      });
    } catch (error) {
      sendJson(response, 200, {
        ok: false,
        service: "mykids-zebra-bridge",
        printerName: null,
        printers: [],
        printUrl: `http://${getLocalIp()}:${PORT}/print`,
        error: error.message,
      });
    }
    return;
  }

  if (request.method === "POST" && url.pathname === "/print") {
    try {
      const payload = await readJson(request);
      const zpl = String(payload.zpl || "");
      if (!zpl.trim()) throw new Error("Campo zpl vazio");
      const printerName = await printZpl(payload.printerName ? String(payload.printerName) : "", zpl);
      sendJson(response, 200, { ok: true, printerName });
    } catch (error) {
      sendJson(response, 500, { ok: false, error: error.message });
    }
    return;
  }

  sendJson(response, 404, { ok: false, error: "Nao encontrado" });
});

server.listen(PORT, HOST, () => {
  console.log(`MyKids Zebra bridge rodando em http://127.0.0.1:${PORT}/print`);
  console.log(`Teste: http://127.0.0.1:${PORT}/health`);
  console.log(`Rede local: http://${getLocalIp()}:${PORT}/print`);
});
