// inspect-header.mjs — 快速檢視 header.js 結構（只讀，不改檔案）
import fs from 'node:fs';
const s = fs.readFileSync('header.js', 'utf8');
console.log('total bytes:', s.length, 'lines:', s.split('\n').length);

// 找頂層 function/const 定義
const defs = s.matchAll(/^\s*(function|const|let|var)\s+(\w+)[({ ]/gm);
const list = [];
for (const m of defs) list.push({ line: s.slice(0, m.index).split('\n').length, name: m[2], kind: m[1] });
const groups = {};
for (const d of list) (groups[d.kind] = groups[d.kind] || []).push(d.name);
console.log(JSON.stringify(groups, null, 1));

// SERVICE_STORIES 前後
const st = s.indexOf('SERVICE_STORIES');
if (st >= 0) console.log('SERVICE_STORIES 塊起:', st, '下一行:');
console.log(s.slice(st, st + 300).split('\n').slice(0, 6).join('\n'));

// ldInit 結束位置（最後一個 });）
const lastBrace = s.lastIndexOf('}');
console.log('file tail:');
console.log(s.slice(lastBrace - 80));
