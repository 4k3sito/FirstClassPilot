"""Dev server with caching disabled, so a reload always shows the latest CSS/JS (python's http.server lets browsers cache)."""
import http.server
import sys


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self) -> None:
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    # Loopback only: the server serves the whole repo (.git, docs), so never expose it to the LAN.
    http.server.ThreadingHTTPServer(("127.0.0.1", port), NoCacheHandler).serve_forever()
