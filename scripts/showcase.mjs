#!/usr/bin/env node
/**
 * Preview the showcase site locally, through the real worker.
 *
 * Runs the bundled worker (`dist/index.js`) in workerd with Miniflare and
 * stands in for Backblaze B2: every object key is read from `web/`. So
 * `/drawings/palette-card.svg?theme=riso&tm=dark` is themed by the same code
 * that runs in production, with no bucket or secrets needed.
 *
 * The worker's edge cache is switched off and responses are sent with
 * `Cache-Control: no-store`, so edits under `web/` show up on reload.
 * Theme edits need a restart, because they are bundled into the worker.
 *
 * Usage: npm run showcase   (builds first, then serves on http://localhost:8790)
 */
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, normalize, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { Miniflare, Response, convertV4MiniflareOptions } = require('miniflare');

const projectRoot = fileURLToPath(new URL('..', import.meta.url));
const webRoot = join(projectRoot, 'web');
const port = Number(process.env.PORT ?? 8790);

const CONTENT_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.json': 'application/json',
  '.excalidraw': 'application/json',
};

/** Answers the worker's B2 calls from the local `web/` folder. */
function fakeBackblaze(request) {
  const url = new URL(request.url);

  if (url.pathname.endsWith('/b2_authorize_account')) {
    return Response.json({ authorizationToken: 'local', downloadUrl: 'https://b2.local' });
  }

  const key = decodeURIComponent(url.pathname.replace(/^\/file\/[^/]+\//, ''));
  const file = normalize(join(webRoot, key));

  if (!file.startsWith(webRoot + sep) || !existsSync(file) || !statSync(file).isFile()) {
    return new Response('Not found', { status: 404 });
  }

  const body = readFileSync(file);
  return new Response(body, {
    headers: {
      'Content-Type': CONTENT_TYPES[extname(file)] ?? 'application/octet-stream',
      'x-bz-content-sha1': createHash('sha1').update(body).digest('hex'),
      'Last-Modified': statSync(file).mtime.toUTCString(),
    },
  });
}

const mf = new Miniflare(
  convertV4MiniflareOptions({
    modules: true,
    scriptPath: join(projectRoot, 'dist', 'index.js'),
    compatibilityDate: '2026-10-01',
    bindings: { B2_ACCOUNT_ID: 'local', B2_APPLICATION_KEY: 'local', B2_BUCKET_NAME: 'showcase' },
    outboundService: fakeBackblaze,
    cacheAPI: false,
  }),
);

const server = createServer(async (req, res) => {
  try {
    const response = await mf.dispatchFetch(new URL(req.url, `http://localhost:${port}`), {
      method: req.method,
      headers: { 'If-None-Match': req.headers['if-none-match'] ?? '' },
    });
    const headers = Object.fromEntries(response.headers);
    headers['cache-control'] = 'no-store';
    res.writeHead(response.status, headers);
    res.end(Buffer.from(await response.arrayBuffer()));
  } catch (error) {
    res.writeHead(500, { 'content-type': 'text/plain' });
    res.end(String(error));
  }
});

server.listen(port, () => {
  console.log(`\n  Tintflare showcase  http://localhost:${port}/\n  serving web/ through the worker · Ctrl+C to stop\n`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, async () => {
    server.close();
    await mf.dispose();
    process.exit(0);
  });
}
