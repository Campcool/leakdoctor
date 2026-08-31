import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'scripts/og-manifest.json'),'utf8'));
function jpegSize(b){
 assert.equal(b.readUInt16BE(0),0xffd8,'Not JPEG');let i=2;
 while(i<b.length){if(b[i++]!==0xff)continue;while(b[i]===0xff)i++;const marker=b[i++];if(marker===0xd9||marker===0xda)break;if(marker===0x01||(marker>=0xd0&&marker<=0xd7))continue;const size=b.readUInt16BE(i);if([0xc0,0xc1,0xc2,0xc3,0xc5,0xc6,0xc7,0xc9,0xca,0xcb,0xcd,0xce,0xcf].includes(marker))return {width:b.readUInt16BE(i+5),height:b.readUInt16BE(i+3)};i+=size;}
 throw new Error('JPEG dimensions not found');
}
const attrs=t=>Object.fromEntries([...t.matchAll(/([\w:-]+)\s*=\s*(["'])(.*?)\2/g)].map(m=>[m[1].toLowerCase(),m[3]]));
// The OG authoring tool and Google's ownership token are not shareable content pages.
const auxiliaryPages=new Set(['og-image.html','google00a268e494d7ca7a.html']);
const actualPages=['','articles'].flatMap(dir=>fs.readdirSync(path.join(root,dir)).filter(f=>f.endsWith('.html')&&!(dir===''&&auxiliaryPages.has(f))).map(f=>dir?`${dir}/${f}`:f)).sort();
assert.deepEqual(manifest.map(x=>x.page).sort(),actualPages,'Every public page needs one OG mapping');
const uniqueImages=new Set();
for(const item of manifest){
 const html=fs.readFileSync(path.join(root,item.page),'utf8');const head=html.slice(0,html.indexOf('</head>'));
 const meta=[...head.matchAll(/<meta\b[^>]*>/gi)].map(m=>attrs(m[0]));
 const get=k=>{const vals=meta.filter(m=>(m.property||m.name)===k);assert.equal(vals.length,1,`${item.page}: ${k} must occur exactly once in initial HTML`);assert.ok(vals[0].content,`${item.page}: ${k} empty`);return vals[0].content;};
 for(const k of ['og:type','og:title','og:description','og:locale','og:site_name','og:image:alt','twitter:title','twitter:description','twitter:image:alt'])get(k);
 const url='https://leakdoctor.tw/'+item.image;
 assert.equal(get('og:image'),url);assert.equal(get('twitter:image'),url);
 assert.equal(get('og:url'),'https://leakdoctor.tw/'+(item.page==='index.html'?'':item.page));
 assert.equal(get('twitter:card'),'summary_large_image');assert.equal(get('og:image:type'),'image/jpeg');
 assert.ok(!uniqueImages.has(url),`${item.page}: shares a generic image with another page`);uniqueImages.add(url);
 assert.ok(!item.image.includes('..')&&item.image.startsWith('assets/og/'),'Only public assets/og images');
 const bytes=fs.readFileSync(path.join(root,item.image));const dim=jpegSize(bytes);
 assert.equal(Number(get('og:image:width')),dim.width,`${item.page}: incorrect width`);
 assert.equal(Number(get('og:image:height')),dim.height,`${item.page}: incorrect height`);
 assert.ok(dim.width>=200&&dim.height>=200,`${item.page}: image too small`);
 assert.ok(bytes.length<=600000,`${item.page}: image exceeds 600 KB budget`);
 if(item.kind==='generated')assert.match(get('og:image:alt'),/AI/);
}
const join=manifest.find(x=>x.page==='join.html');assert.equal(join.image,'assets/og/join-business-handshake-a-20260831.jpg','Keep approved join A');
for(const page of ['cases.html','team.html'])assert.equal(manifest.find(x=>x.page===page).kind,'existing','Do not generate case or staff evidence');
console.log(`OG contract OK: ${manifest.length} pages, unique public JPEGs, real dimensions, alt and Twitter metadata; join A and existing evidence preserved.`);
