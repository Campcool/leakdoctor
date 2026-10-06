import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
const current = readFileSync(resolve(root, 'assets/process-images.css'), 'utf8');
// Reconstruct the former embedded payload from byte-identical originals for visual comparison.
const baseline = current.replace('original WebP files, externalized without re-encoding', 'optimized WebP data URIs')
  .replace(/process-media\/(aircon|washer|leak)\.webp/g, (_, name) => 'data:image/webp;base64,' + readFileSync(resolve(root, `assets/process-media/${name}.webp`)).toString('base64'));
let useBaseline = false;
const types = { '.html':'text/html', '.js':'text/javascript', '.css':'text/css', '.webp':'image/webp', '.jpg':'image/jpeg', '.png':'image/png', '.svg':'image/svg+xml', '.json':'application/json' };
const server = createServer((req, res) => {
  const pathname = new URL(req.url, 'http://localhost').pathname;
  const file = resolve(root, '.' + (pathname === '/' ? '/index.html' : pathname));
  if (!file.startsWith(resolve(root) + sep) || !existsSync(file)) { res.writeHead(404); res.end(); return; }
  const body = pathname === '/assets/process-images.css' && useBaseline ? Buffer.from(baseline) : readFileSync(file);
  res.writeHead(200, { 'Content-Type':types[extname(file)] || 'application/octet-stream', 'Content-Length':body.length }); res.end(body);
});
await new Promise(done => server.listen(0, '127.0.0.1', done));
const base = `http://127.0.0.1:${server.address().port}`;
const output = process.env.EVIDENCE_DIR || resolve(root, '../process-media-evidence');
mkdirSync(output, { recursive:true });
const engines = await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const results = [];
try {
  for (const name of (process.env.BROWSERS || 'chromium,firefox,webkit').split(',')) {
    const browser = await engines[name].launch();
    try {
      for (const width of [375, 1440]) for (const path of ['/', '/leak-repair.html']) {
        const snapshots = [];
        for (const before of [true, false]) {
          useBaseline = before;
          const context = await browser.newContext({ viewport:{ width, height:950 }, reducedMotion:'reduce' });
          const page = await context.newPage();
          const errors = [], failures = [], requested = [];
          page.on('pageerror', e => errors.push(e.message));
          page.on('response', r => { if (r.url().startsWith(base) && r.status() >= 400) failures.push(r.url()); });
          page.on('request', r => requested.push(r.url()));
          await context.route('**/*', route => route.request().url().startsWith(base) ? route.continue() : route.fulfill({ status:200, contentType:'application/json', body:'{}' }));
          await page.goto(base + path);
          await page.locator('.process-photo').first().scrollIntoViewIfNeeded();
          await page.waitForFunction(() => [...document.images].filter(i => i.loading !== 'lazy' || i.getBoundingClientRect().top < innerHeight).every(i => i.complete));
          await page.waitForTimeout(500);
          const visuals = await page.locator('.process-photo').evaluateAll(nodes => nodes.map(n => ({ background:getComputedStyle(n).backgroundImage, width:n.clientWidth, height:n.clientHeight })));
          for (const visual of visuals) assert(visual.background.includes('/assets/service-photos/'));
          assert.deepEqual(errors, []); assert.deepEqual(failures, []);
          assert(!requested.some(url => url.includes('/assets/process-media/')), 'Overridden legacy backgrounds must not download');
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
          const image = await page.screenshot();
          snapshots.push({ visuals, image });
          if (!before) writeFileSync(resolve(output, `${name}-${width}-${path === '/' ? 'home' : 'leak'}-process.png`), image);
          await context.close();
        }
        assert.deepEqual(snapshots[0].visuals, snapshots[1].visuals);
        assert.deepEqual(snapshots[0].image, snapshots[1].image, 'Externalizing CSS must retain the rendered viewport exactly');
        results.push({ browser:name, version:browser.version(), width, path, beforeCssBytes:Buffer.byteLength(baseline), afterCssBytes:Buffer.byteLength(current), identicalScreenshot:true, unusedBackgroundRequests:0 });
        console.log(`${name}/${width}/${path}: identical visual; CSS ${Buffer.byteLength(baseline)} -> ${Buffer.byteLength(current)}`);
      }
    } finally { await browser.close(); }
  }
  writeFileSync(resolve(output, 'results.json'), JSON.stringify({ testedAt:new Date().toISOString(), externalRequests:'mocked, no actual analytics or orders', results }, null, 2));
} finally { await new Promise(done => server.close(done)); }
