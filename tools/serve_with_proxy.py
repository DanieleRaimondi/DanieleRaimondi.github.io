#!/usr/bin/env python3
"""Local preview server for the site — the ONLY way the chatbot works on localhost.

The AI Twin backend allows CORS only from https://danieleraimondi.github.io, so a
plain static server can show the pages but every chat fetch gets blocked by the
browser. This server closes that gap without touching any file on disk:

- serves the repo root as static files;
- proxies POST /api/* to the backend server-side (no browser CORS involved),
  forwarding the SSE stream line by line so tokens render in real time
  (never switch to fixed-size reads: they batch ~1KB and the chat looks frozen);
- serves js/chatbot.js with API_URL rewritten to the local /api/chat on the fly.

Usage: python3 tools/serve_with_proxy.py   →  http://localhost:8000/
"""
import http.server
import json
import os
import urllib.error
import urllib.request

BACKEND = "https://ai-twin-backend.vercel.app"
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PORT = 8000


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def log_message(self, fmt, *args):
        pass

    def do_GET(self):
        # Patch the chatbot's API_URL only in what we serve, never on disk
        if self.path.split("?")[0] == "/js/chatbot.js":
            with open(os.path.join(ROOT, "js", "chatbot.js"), encoding="utf-8") as f:
                src = f.read()
            patched = src.replace(
                "const API_URL = 'https://ai-twin-backend.vercel.app/api/chat';",
                "const API_URL = '/api/chat'; // localhost preview: proxied server-side",
            )
            body = patched.encode("utf-8")
            self.send_response(200)
            self.send_header("Content-Type", "application/javascript; charset=utf-8")
            self.send_header("Content-Length", str(len(body)))
            self.send_header("Cache-Control", "no-store")
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def do_POST(self):
        if not self.path.startswith("/api/"):
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", 0))
        body = self.rfile.read(length) if length else b""
        req = urllib.request.Request(
            BACKEND + self.path,
            data=body,
            headers={"Content-Type": "application/json"},
            method="POST",
        )
        try:
            with urllib.request.urlopen(req, timeout=180) as resp:
                self.send_response(resp.status)
                for key in ("Content-Type", "Cache-Control", "X-Session-ID", "X-Model-Used"):
                    val = resp.headers.get(key)
                    if val:
                        self.send_header(key, val)
                self.end_headers()
                # SSE is newline-delimited: hand over each line the moment it
                # completes, so the first token paints instantly
                while True:
                    line = resp.readline()
                    if not line:
                        break
                    self.wfile.write(line)
                    self.wfile.flush()
        except urllib.error.HTTPError as e:
            payload = e.read()
            self.send_response(e.code)
            self.send_header("Content-Type", e.headers.get("Content-Type", "application/json"))
            self.end_headers()
            self.wfile.write(payload)
        except BrokenPipeError:
            pass  # browser navigated away mid-stream
        except Exception as e:
            try:
                self.send_response(502)
                self.send_header("Content-Type", "application/json")
                self.end_headers()
                self.wfile.write(json.dumps({"error": str(e)}).encode())
            except BrokenPipeError:
                pass


if __name__ == "__main__":
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    print(f"Serving {ROOT} on http://localhost:{PORT} (proxying /api/* → {BACKEND})")
    server.serve_forever()
