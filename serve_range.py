import http.server, os, re, socketserver, sys

class H(http.server.SimpleHTTPRequestHandler):
    def send_head(self):
        path = self.translate_path(self.path)
        if os.path.isdir(path):
            return super().send_head()
        try:
            f = open(path, 'rb')
        except OSError:
            self.send_error(404)
            return None
        size = os.fstat(f.fileno()).st_size
        rng = self.headers.get('Range')
        ctype = self.guess_type(path)
        if rng:
            m = re.match(r'bytes=(\d*)-(\d*)', rng)
            start = int(m.group(1)) if m.group(1) else 0
            end = int(m.group(2)) if m.group(2) else size - 1
            end = min(end, size - 1)
            if start > end:
                f.close()
                self.send_error(416)
                return None
            self.send_response(206)
            self.send_header('Content-Type', ctype)
            self.send_header('Accept-Ranges', 'bytes')
            self.send_header('Content-Range', f'bytes {start}-{end}/{size}')
            self.send_header('Content-Length', str(end - start + 1))
            self.end_headers()
            f.seek(start)
            return _Limited(f, end - start + 1)
        self.send_response(200)
        self.send_header('Content-Type', ctype)
        self.send_header('Accept-Ranges', 'bytes')
        self.send_header('Content-Length', str(size))
        self.end_headers()
        return f

class _Limited:
    def __init__(self, f, n):
        self.f = f; self.n = n
    def read(self, k=-1):
        if self.n <= 0: return b''
        if k is None or k < 0: k = self.n
        k = min(k, self.n)
        self.n -= k
        return self.f.read(k)
    def close(self):
        self.f.close()

port = int(sys.argv[1]) if len(sys.argv) > 1 else 8731
socketserver.TCPServer.allow_reuse_address = True
try:
    httpd = socketserver.TCPServer(('127.0.0.1', port), H)
except OSError:
    print(f'port {port} is already in use, try another one: python3 serve_range.py 8080')
    sys.exit(1)
print(f'serving {os.getcwd()} at http://127.0.0.1:{port}/  (ctrl+c to stop)')
try:
    httpd.serve_forever()
except KeyboardInterrupt:
    print('\nstopped')
