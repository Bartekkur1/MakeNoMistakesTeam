import http from 'node:http';
import fs from 'node:fs/promises';
import path from 'node:path';

const fixtures = path.resolve(import.meta.dirname, 'fixtures');
http.createServer(async (req, res) => {
  let pathname;
  try { pathname = decodeURIComponent((req.url ?? '/').split('?')[0]); }
  catch { res.writeHead(403).end(); return; }
  const file = path.resolve(fixtures, '.' + (pathname === '/' ? '/chat-like.html' : pathname));
  if (!file.startsWith(fixtures + path.sep)) { res.writeHead(403).end(); return; }
  try {
    const content = await fs.readFile(file);
    if (path.extname(file) === '.html') res.setHeader('Content-Type', 'text/html; charset=utf-8');
    res.end(content);
  } catch { res.writeHead(404).end(); }
}).listen(process.env.PORT ?? 4173, '127.0.0.1');
