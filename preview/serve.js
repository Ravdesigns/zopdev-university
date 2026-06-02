// Static-file server for the University preview.
// Serves preview/ first, falls through to ../site/ for any path that doesn't
// exist locally — so links from the prototype homepage (e.g. /foundations/,
// /glossary/, /certifications/) hit the real production-built pages on the
// same origin, no port jump.

const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const SITE_ROOT = path.resolve(ROOT, '..', 'site');
const PORT = Number(process.env.PORT) || 5174;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
};

function serve(res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream' });
  fs.createReadStream(filePath).pipe(res);
}

function tryFile(root, urlPath) {
  // Resolve a URL path against `root`. Handles trailing-slash directory
  // indexes (e.g. /foundations/ → /foundations/index.html). Returns the
  // absolute file path if it exists, else null.
  let candidate = path.join(root, urlPath);
  if (!candidate.startsWith(root)) return null;
  try {
    if (fs.existsSync(candidate)) {
      const stat = fs.statSync(candidate);
      if (stat.isFile()) return candidate;
      if (stat.isDirectory()) {
        const idx = path.join(candidate, 'index.html');
        if (fs.existsSync(idx) && fs.statSync(idx).isFile()) return idx;
      }
    }
    // Try /foo → /foo/index.html or /foo.html
    if (!urlPath.endsWith('/')) {
      const htmlCandidate = candidate + '.html';
      if (fs.existsSync(htmlCandidate) && fs.statSync(htmlCandidate).isFile()) return htmlCandidate;
      const dirIdx = path.join(candidate, 'index.html');
      if (fs.existsSync(dirIdx) && fs.statSync(dirIdx).isFile()) return dirIdx;
    }
  } catch (e) { /* fall through */ }
  return null;
}

const server = http.createServer((req, res) => {
  try {
    let urlPath = decodeURIComponent(req.url.split('?')[0]);
    if (urlPath === '' || urlPath === '/') urlPath = '/index.html';

    // 1. Try preview/ first (so the prototype home + assets win).
    let filePath = tryFile(ROOT, urlPath);
    if (filePath) return serve(res, filePath);

    // 2. Fall through to site/ for any unknown path. This is what makes the
    // homepage's links to /foundations/, /glossary/, etc. actually load the
    // real, build-generated pages without changing hosts.
    filePath = tryFile(SITE_ROOT, urlPath);
    if (filePath) return serve(res, filePath);

    // 3. Not found anywhere — show the site/ 404 if it exists.
    const notFound = path.join(SITE_ROOT, '404.html');
    if (fs.existsSync(notFound)) {
      res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
      return fs.createReadStream(notFound).pipe(res);
    }
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not found');
  } catch (e) {
    res.writeHead(500); res.end('Server error');
  }
});

server.listen(PORT, () => {
  console.log(`ZopDev University preview running on http://localhost:${PORT}`);
  console.log(`  preview/ root: ${ROOT}`);
  console.log(`  site/ fallback: ${SITE_ROOT}`);
});
