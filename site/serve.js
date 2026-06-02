// Minimal Node static server for the University site
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const PORT = Number(process.env.PORT) || 5176;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  if (urlPath.endsWith('/')) urlPath += 'index.html';
  let filePath = path.join(ROOT, urlPath);

  // Try /path/ → /path/index.html
  if (!fs.existsSync(filePath)) {
    const alt = path.join(ROOT, urlPath, 'index.html');
    if (fs.existsSync(alt)) filePath = alt;
  }

  if (!fs.existsSync(filePath) || !fs.statSync(filePath).isFile()) {
    res.statusCode = 404;
    const notFound = path.join(ROOT, '404.html');
    if (fs.existsSync(notFound)) {
      res.setHeader('Content-Type', 'text/html; charset=utf-8');
      fs.createReadStream(notFound).pipe(res);
    } else {
      res.end('404');
    }
    return;
  }

  const ext = path.extname(filePath);
  res.setHeader('Content-Type', MIME[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
}).listen(PORT, '127.0.0.1', () => {
  console.log(`University preview at http://127.0.0.1:${PORT}/`);
});
