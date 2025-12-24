# server.py
import http.server
import socketserver
import mimetypes
import os

PORT = 8080

# Change to the SAD-WebSite directory
#os.chdir('SAD-WebSite')

# força .js como application/javascript
mimetypes.add_type('application/javascript', '.js')

class CustomHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        if self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript')
        super().end_headers()

Handler = CustomHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
