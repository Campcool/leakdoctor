// update-sitemap.mjs — 依實體 .html 更新 sitemap.xml
// 規則（與 AI-README 一致）：
//   - 正式版：根目錄 + articles/ 下所有頁面（含本地語言）
//   - 排除：SKIP_PAGES（工具頁）＋無 index.html 的目錄
//   - lastmod = 該檔案 git 最後修改日期（UTC YYYY-MM-DD）
// 使用：node scripts/update-sitemap.mjs   （會直接改寫 sitemap.xml）
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const BASE = 'https://leakdoctor.tw';

const SKIP = new Set(['og-image.html', 'google00a268e494d7ca7a.html']);
const files = [];
for (const f of fs.readdirSync(root)) {
  if (f.endsWith('.html') && !SKIP.has(f) && fs.statSync(path.join(root, f)).isFile()) files.push(f);
}
const articlesDir = path.join(root, 'articles');
if (fs.existsSync(articlesDir)) {
  for (const f of fs.readdirSync(articlesDir).filter((n) => n.endsWith('.html'))) {
    files.push('articles/' + f);
  }
}

const lastmod = (rel) => {
  try {
    const d = execSync('git log -1 --format=%cd --date=format:%Y-%m-%d -- ' + JSON.stringify(rel), { cwd: root }).toString().trim();
    return d || new Date().toISOString().slice(0, 10);
  } catch { return new Date().toISOString().slice(0, 10); }
};

const entries = files.map((rel) => {
  const loc = rel === 'index.html' ? BASE + '/' : BASE + '/' + rel;
  const locEsc = loc.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  return '  <url>\n    <loc>' + locEsc + '</loc>\n    <lastmod>' + lastmod(rel) + '</lastmod>\n  </url>';
});

entries.sort();
const xml = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + entries.join('\n') + '\n</urlset>\n';
fs.writeFileSync(path.join(root, 'sitemap.xml'), xml);
console.log('sitemap.xml 更新：' + entries.length + ' 個網址');
console.log('補收錄（相對之前 26 個）：' + (entries.length - 26));
