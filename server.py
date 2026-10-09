"""Local Paste Inn preview. No dependencies; no content or credentials on disk."""
import argparse
import functools
import http.client
import ipaddress
import json
from html.parser import HTMLParser
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import socket
import ssl
import threading
import time
from urllib.parse import parse_qs, urljoin, urlsplit, urlunsplit

MAX_HTML = 1024 * 1024
SLOTS = threading.BoundedSemaphore(4)


def public_target(url):
    """Resolve once, reject non-public addresses, and return a pinned destination."""
    if len(url) > 4096 or any(ord(c) < 33 or ord(c) == 127 for c in url):
        raise ValueError('Invalid URL')
    p = urlsplit(url)
    if p.scheme not in ('http', 'https') or not p.hostname or p.username is not None or p.password is not None:
        raise ValueError('Public HTTP(S) URLs only')
    host = p.hostname.encode('idna').decode('ascii')
    port = p.port or (443 if p.scheme == 'https' else 80)
    if port != (443 if p.scheme == 'https' else 80):
        raise ValueError('Default ports only')
    addresses = socket.getaddrinfo(host, port, type=socket.SOCK_STREAM)
    if not addresses or any(not ipaddress.ip_address(a[4][0]).is_global for a in addresses):
        raise ValueError('Non-public destination')
    return p, host, port, addresses[0][4][0]


class PinnedConnection(http.client.HTTPConnection):
    def __init__(self, host, port, address, secure):
        super().__init__(host, port, timeout=6)
        self.address, self.secure = address, secure

    def connect(self):
        self.sock = socket.create_connection((self.address, self.port), self.timeout)
        if self.secure:
            self.sock = ssl.create_default_context().wrap_socket(self.sock, server_hostname=self.host)


class Metadata(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.meta, self.title, self.in_title = {}, '', False

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == 'title':
            self.in_title = True
        if tag == 'meta':
            key = (a.get('property') or a.get('name') or '').lower()
            if key and a.get('content') and key not in self.meta:
                self.meta[key] = a['content']

    def handle_endtag(self, tag):
        if tag == 'title':
            self.in_title = False

    def handle_data(self, data):
        if self.in_title:
            self.title += data


def clean(text, length):
    return ' '.join(text.split())[:length]


def preview(url):
    deadline = time.monotonic() + 15
    for _ in range(4):
        p, host, port, address = public_target(url)
        conn = PinnedConnection(host, port, address, p.scheme == 'https')
        try:
            path = urlunsplit(('', '', p.path or '/', p.query, ''))
            conn.request('GET', path, headers={'User-Agent': 'PasteInnPreview/0.1', 'Accept': 'text/html,application/xhtml+xml', 'Accept-Encoding': 'identity'})
            res = conn.getresponse()
            if res.status in (301, 302, 303, 307, 308):
                url = urljoin(url, res.getheader('Location') or '')
                if time.monotonic() > deadline:
                    raise ValueError('Preview timed out')
                continue
            if res.status != 200 or res.headers.get_content_type() not in ('text/html', 'application/xhtml+xml'):
                raise ValueError('No public page preview')
            chunks, size = [], 0
            while size < MAX_HTML:
                chunk = res.read1(min(16384, MAX_HTML - size))
                if not chunk:
                    break
                chunks.append(chunk)
                size += len(chunk)
                if time.monotonic() > deadline:
                    raise ValueError('Preview timed out')
                if b'</head>' in chunk.lower():
                    break
            parser = Metadata()
            charset = res.headers.get_content_charset() or 'utf-8'
            try:
                html = b''.join(chunks).decode(charset, errors='replace')
            except LookupError:
                html = b''.join(chunks).decode('utf-8', errors='replace')
            parser.feed(html)
            m = parser.meta
            image = urljoin(url, m.get('og:image:secure_url') or m.get('og:image') or m.get('twitter:image') or '')
            if image == url:
                image = ''
            if image:
                try:
                    public_target(image)
                except (ValueError, OSError, UnicodeError):
                    image = ''
            return {'title': clean(m.get('og:title') or m.get('twitter:title') or parser.title or host, 200),
                    'description': clean(m.get('og:description') or m.get('description') or m.get('twitter:description') or '', 300),
                    'image': image, 'site': clean(m.get('og:site_name') or host, 100)}
        finally:
            conn.close()
    raise ValueError('Too many redirects')


class Handler(SimpleHTTPRequestHandler):
    def do_GET(self):
        path = urlsplit(self.path)
        if path.path != '/api/preview':
            return super().do_GET()
        # A custom request header prevents cross-site forms/no-cors reads. No CORS allowed.
        allowed_hosts = (f'127.0.0.1:{self.server.server_port}', f'localhost:{self.server.server_port}')
        host = self.headers.get('Host', '')
        origin = self.headers.get('Origin')
        if host not in allowed_hosts or self.headers.get('X-Paste-Inn') != 'preview' or (origin and origin != 'http://' + host) or self.headers.get('Sec-Fetch-Site') == 'cross-site':
            return self.reply(403, {'error': 'Same-origin preview requests only'})
        if not SLOTS.acquire(blocking=False):
            return self.reply(429, {'error': 'Try again shortly'})
        try:
            url = parse_qs(path.query).get('url', [''])[0]
            self.reply(200, preview(url))
        except Exception:
            self.reply(422, {'error': 'Preview unavailable'})
        finally:
            SLOTS.release()

    def reply(self, status, value):
        data = json.dumps(value).encode()
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(data)))
        self.send_header('Cache-Control', 'no-store')
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.end_headers()
        self.wfile.write(data)

    def log_message(self, fmt, *args):
        # Do not log private URLs from the query string.
        if urlsplit(self.path).path != '/api/preview':
            super().log_message(fmt, *args)


if __name__ == '__main__':
    args = argparse.ArgumentParser()
    args.add_argument('--port', type=int, default=4174)
    config = args.parse_args()
    root = Path(__file__).resolve().parent / 'dist'
    server = ThreadingHTTPServer(('127.0.0.1', config.port), functools.partial(Handler, directory=str(root)))
    print(f'Paste Inn: http://127.0.0.1:{config.port}/concept.html', flush=True)
    server.serve_forever()
