# server.py
import http.server
import socketserver
import mimetypes

PORT = 8000

# força .js como application/javascript
mimetypes.add_type('application/javascript', '.js')

Handler = http.server.SimpleHTTPRequestHandler
with socketserver.TCPServer(("", PORT), Handler) as httpd:
    print(f"Serving at port {PORT}")
    httpd.serve_forever()
