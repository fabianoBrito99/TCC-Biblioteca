import json
import socket
from http.server import BaseHTTPRequestHandler, HTTPServer

try:
    import win32print
except ImportError:
    win32print = None


HOST = "0.0.0.0"
PORT = 9123
DEFAULT_PRINTER = "ZD220-203dpi ZPL"


def get_local_ip() -> str:
    try:
        with socket.socket(socket.AF_INET, socket.SOCK_DGRAM) as sock:
            sock.connect(("8.8.8.8", 80))
            return sock.getsockname()[0]
    except OSError:
        return "IP_DO_NOTEBOOK"


def send_raw_zpl(printer_name: str, zpl: str) -> None:
    if win32print is None:
        raise RuntimeError("Instale o pywin32: pip install pywin32")

    handle = win32print.OpenPrinter(printer_name)
    try:
        job = win32print.StartDocPrinter(handle, 1, ("MyKids etiqueta", None, "RAW"))
        try:
            win32print.StartPagePrinter(handle)
            win32print.WritePrinter(handle, zpl.encode("utf-8"))
            win32print.EndPagePrinter(handle)
        finally:
            win32print.EndDocPrinter(handle)
    finally:
        win32print.ClosePrinter(handle)


class ZebraBridgeHandler(BaseHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Methods", "POST, OPTIONS")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_GET(self):
        if self.path not in ("/", "/health"):
            self.send_response(404)
            self.end_headers()
            return

        self.send_response(200)
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(
            json.dumps(
                {
                    "ok": True,
                    "service": "mykids-zebra-bridge",
                    "printerName": DEFAULT_PRINTER,
                    "printUrl": f"http://{get_local_ip()}:{PORT}/print",
                }
            ).encode("utf-8")
        )

    def do_POST(self):
        if self.path != "/print":
            self.send_response(404)
            self.end_headers()
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length).decode("utf-8"))
            zpl = str(payload.get("zpl", ""))
            printer_name = str(payload.get("printerName") or DEFAULT_PRINTER)

            if not zpl.strip():
                raise ValueError("Campo zpl vazio")

            send_raw_zpl(printer_name, zpl)
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": True}).encode("utf-8"))
        except Exception as exc:
            self.send_response(500)
            self.send_header("Content-Type", "application/json")
            self.end_headers()
            self.wfile.write(json.dumps({"ok": False, "error": str(exc)}).encode("utf-8"))


if __name__ == "__main__":
    server = HTTPServer((HOST, PORT), ZebraBridgeHandler)
    local_ip = get_local_ip()
    print(f"MyKids Zebra bridge rodando no notebook em http://127.0.0.1:{PORT}/print")
    print(f"Para usar pelo celular na mesma rede, configure no site: http://{local_ip}:{PORT}/print")
    print(f"Teste no navegador do celular: http://{local_ip}:{PORT}/health")
    print(f"Impressora padrao: {DEFAULT_PRINTER}")
    server.serve_forever()
