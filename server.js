const http = require('http');
const fs = require('fs');
const path = require('path');

const host = '127.0.0.1';
const port = 4173;
const root = __dirname;

const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
};

function send(res, statusCode, body, contentType) {
  res.writeHead(statusCode, {
    'Content-Type': contentType,
    'Cache-Control': 'no-store',
  });
  res.end(body);
}

http
  .createServer((req, res) => {
    const requestPath = req.url === '/' ? '/index.html' : req.url.split('?')[0];
    const safePath = path.normalize(requestPath).replace(/^(\.\.[/\\])+/, '');
    const filePath = path.join(root, safePath);

    if (!filePath.startsWith(root)) {
      send(res, 403, 'Forbidden', 'text/plain; charset=utf-8');
      return;
    }

    fs.readFile(filePath, (error, contents) => {
      if (error) {
        if (error.code === 'ENOENT') {
          send(res, 404, 'Not found', 'text/plain; charset=utf-8');
          return;
        }
        send(res, 500, 'Server error', 'text/plain; charset=utf-8');
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      send(res, 200, contents, mimeTypes[ext] || 'application/octet-stream');
    });
  })
  .listen(port, host, () => {
    console.log(`Tree of Life running at http://${host}:${port}`);
  });
