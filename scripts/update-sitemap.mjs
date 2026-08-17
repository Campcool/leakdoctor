// update-sitemap.mjs — 依實體 .html 更新 sitemap.xml
// 規則（與 AI-README 一致）：
//   - 正式版：根目錄 + articles/ 下所有頁面（含本地語言）
//   - 排除：SKIP_PAGES（工具頁）＋標了 noindex 的頁＋無 index.html 的目錄
//   - lastmod = 該檔案 git 最後修改日期（UTC YYYY-MM-DD）
// 使用：node scripts/update-sitemap.mjs   （會直接改寫 sitemap.xml）
//
// ⚠️ 收錄數量不是越多越好。2026-08-15 這支腳本只依「檔案存在」列舉，
// 把 10 個 noindex,follow 的轉跳頁一起收錄（26 → 36），對 Google 同時送出
// 「請收錄」與「不要收錄」兩個矛盾訊號，且 noindex 會讓那些頁的 canonical
// 永遠不被處理。因此改為主動讀取每頁的 robots meta 並排除 noindex。
import fs from 'node:fs';
import path from 'node:path';
import { execSync } from 'node:child_process';
const root = path.resolve(import.meta.dirname, '..');
const BASE = 'https://leakdoctor.tw';

const SKIP = new Set(['og-image.html', 'google00a268e494d7ca7a.html']);
// 與 validate-site.mjs 的 isNoindex 同一套容錯寫法：實際頁面是 content="noindex,follow"
const isNoindex = (html) => /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);
const excluded = [];
const files = [];
const consider = (rel) => {
  const html = fs.readFileSync(path.join(root, rel), 'utf8');
  if (isNoindex(html)) { excluded.push(rel); return; }
  files.push(rel);
};
for (const f of fs.readdirSync(root)) {
  if (f.endsWith('.html') && !SKIP.has(f) && fs.statSync(path.join(root, f)).isFile()) consider(f);
}
const articlesDir = path.join(root, 'articles');
if (fs.existsSync(articlesDir)) {
  for (const f of fs.readdirSync(articlesDir).filter((n) => n.endsWith('.html'))) {
    consider('articles/' + f);
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
console.log('sitemap.xml 更新：' + entries.length + ' 個可索引網址');
console.log('排除 noindex 頁 ' + excluded.length + ' 個：' + (excluded.join('、') || '（無）'));
console.log('排除工具頁 ' + SKIP.size + ' 個：' + [...SKIP].join('、'));
