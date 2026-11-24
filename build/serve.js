// שרת מקומי פשוט לצפייה באתר: node build/serve.js  (ברירת מחדל: התיקייה new-site, פורט 5175)
// מגיש תמיד את הגרסה העדכנית (בלי שמירת עותקים בדפדפן).
const http = require('http'), fs = require('fs'), path = require('path');
const root = path.resolve(process.argv[2] || path.join(__dirname, '..'));
const port = Number(process.argv[3] || 5175);
const types = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.png': 'image/png', '.webp': 'image/webp',
  '.gif': 'image/gif', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
};
const server = http.createServer((req, res) => {
  let p;
  try { p = decodeURIComponent(req.url.split('?')[0]); } catch { res.writeHead(400); return res.end(); }
  if (p === '/' || p === '') p = '/index.html';
  const f = path.join(root, path.normalize(p));
  if (!f.startsWith(root)) { res.writeHead(403); return res.end(); }
  fs.readFile(f, (e, d) => {
    if (e) { res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }); return res.end('הדף לא נמצא'); }
    res.writeHead(200, { 'Content-Type': types[path.extname(f).toLowerCase()] || 'application/octet-stream', 'Cache-Control': 'no-store' });
    res.end(d);
  });
});
server.on('error', (e) => {
  if (e.code === 'EADDRINUSE') { console.log(`האתר כבר פועל: http://localhost:${port}/`); process.exit(0); }
  throw e;
});
server.listen(port, '127.0.0.1', () => console.log(`האתר פועל: http://localhost:${port}/  (לסגירה: סגרו את החלון הזה)`));
