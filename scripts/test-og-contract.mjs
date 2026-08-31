import {test,after} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {spawnSync} from 'node:child_process';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const tempBase=fs.realpathSync(os.tmpdir());
const fixture=fs.mkdtempSync(path.join(tempBase,'leakdoctor-og-contract-'));
const manifest=JSON.parse(fs.readFileSync(path.join(root,'scripts/og-manifest.json'),'utf8'));
for(const rel of ['scripts/check-og.mjs','scripts/og-manifest.json',...manifest.flatMap(m=>[m.page,m.image])]){
 const dest=path.join(fixture,rel);fs.mkdirSync(path.dirname(dest),{recursive:true});fs.copyFileSync(path.join(root,rel),dest);
}
const check=()=>spawnSync(process.execPath,[path.join(fixture,'scripts/check-og.mjs')],{encoding:'utf8',timeout:15000});
function mutate(rel,change){const f=path.join(fixture,rel),before=fs.readFileSync(f,'utf8');try{fs.writeFileSync(f,change(before));const r=check();assert.notEqual(r.status,0,'broken published state should fail');}finally{fs.writeFileSync(f,before);}}
after(()=>{const resolved=fs.realpathSync(fixture);assert.equal(path.dirname(resolved),tempBase);assert.ok(path.basename(resolved).startsWith('leakdoctor-og-contract-'));fs.rmSync(resolved,{recursive:true,force:true});});
test('all actual public pages and selected images pass the OG contract',()=>{const r=check();assert.equal(r.status,0,r.stderr||r.stdout);});
test('mutation: missing initial-HTML image is rejected',()=>mutate('join.html',s=>s.replace(/<meta property="og:image"[^>]*>/,'')));
test('mutation: stale image dimensions are rejected',()=>mutate('aircon.html',s=>s.replace(/(property="og:image:width" content=")\d+/, '$199')));
test('mutation: Twitter falling back to the generic logo is rejected',()=>mutate('washer.html',s=>s.replace(/(name="twitter:image" content=")[^"]+/, '$1https://leakdoctor.tw/og-image.jpg')));
test('mutation: duplicate competing OG images are rejected',()=>mutate('join.html',s=>s.replace('</head>','<meta property="og:image" content="https://leakdoctor.tw/og-image.jpg"></head>')));
test('mutation: an unlisted public page is rejected',()=>{const f=path.join(fixture,'forgotten-page.html');try{fs.writeFileSync(f,'<!doctype html><title>Missing OG</title>');assert.notEqual(check().status,0);}finally{fs.unlinkSync(f);}});
