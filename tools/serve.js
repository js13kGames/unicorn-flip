// Minimal static server for local testing: `node tools/serve.js` -> http://localhost:8791
// Serves the built game so it runs over http (the same conditions as js13k and itch.io),
// which is worth doing because file:// can block localStorage in some browsers.
const http = require('http'), fs = require('fs'), path = require('path');

const ROOT = path.join(__dirname, '..', 'build');
const SHOTS = path.join(__dirname, '..', 'shots');
const PORT = process.env.PORT || 8791;

const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css',
  '.png': 'image/png', '.zip': 'application/zip', '.json': 'application/json'
};

function send(res, file) {
  fs.readFile(file, (err, data) => {
    if (err) { res.writeHead(404); res.end('404'); return; }
    res.writeHead(200, {
      'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
      'Cache-Control': 'no-store'
    });
    res.end(data);
  });
}

http.createServer((req, res) => {
  let p = decodeURIComponent(req.url.split('?')[0]);
  if (p === '/') p = '/index.html';
  if (p.indexOf('..') !== -1) { res.writeHead(400); res.end('bad path'); return; }
  if (p.indexOf('/shots/') === 0) return send(res, path.join(SHOTS, p.slice(7)));
  send(res, path.join(ROOT, p));
}).listen(PORT, () => {
  console.log('UNICORN FLIP -> http://localhost:' + PORT);
  console.log('serving ' + ROOT);
});
