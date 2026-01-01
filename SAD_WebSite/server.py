# server.py
import http.server
import socketserver
import mimetypes
import os

PORT = 8080

# Change to the SAD-WebSite directory
os.chdir('SAD-WebSite')

# força .js como application/javascript
mimetypes.add_type('application/javascript', '.js')

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript')
        super().end_headers()

    def log_message(self, format, *args):
        # Suppress log messages to reduce noise
        pass

    def translate_path(self, path):
        # Strip the /SAD-WebSite prefix if present
        if path.startswith('/SAD-WebSite/'):
            path = path[len('/SAD-WebSite/')-1:]  # Remove /SAD-WebSite, keep the leading /
        return super().translate_path(path)

    def do_GET(self):
        try:
            super().do_GET()
        except ConnectionAbortedError:
            # Handle client disconnection gracefully
            pass
        except Exception as e:
            self.send_error(500, f"Internal server error: {str(e)}")

Handler = CustomHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
