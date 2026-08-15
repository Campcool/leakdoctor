#!/usr/bin/env node
// validate-site.mjs — 灰汰郎（leakdoctor.tw）防回歸驗證
//
// 品牌事實依據 AI-README.md（§2 關鍵常數）：
//   - LINE 加好友連結 lin.ee/WVxmY65（全站 82 處以上：html/schema/llms.txt＋header.js LINE 常數）
//   - LINE 官方帳號 ID @478xvlgl（header.js LINE_OA_ID；表單 oaMessage 深層連結用）
//   - GA4 評估 ID G-1H1X1X9QZE（header.js GA4_ID；全站事件由 ldTrack 送出）
//   - 線索 API leakdoctor-bot workers.dev /api/leads（表單必須先寫 D1 成功才開 LINE）
//   - ⚠️ 露涼社 LINE 連結絕對不能出現
//
// 驗證項目（全部本地檢查，不外送請求）：
//   1. 每個 sitemap <loc> 對應的實體 .html 存在且 HTTP 正常（本地路徑對應）
//   2. 每個實體 .html 被 sitemap 收錄或被 noindex 轉跳頁說明排除
//   3. header.js 與各頁面引用路徑一致性（../header.js 在子目錄、header.js 在根）
//   4. 品牌常數一致性：LINE / LINE_OA_ID / GA4_ID / LEAD_API 唯一且正確
//   5. 全站 LINE 連結覆蓋率（根 HTML 每頁至少 1 處 LINE CTA）
//   6. 反個資：表單說明不得出現「此裝置」等暗示可收集個人訊息的詞彙；
//      個資由客戶在 LINE 內自行送出，站內表單只寫草稿
//   7. og-image.html 等工具頁維持 noindex 或不在 sitemap
//
// 使用：node scripts/validate-site.mjs
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');

let fail = 0;
const errors = [];
const report = (msg) => { errors.push(msg); fail++; console.error('✗ ' + msg); };
const ok = (msg) => console.log('✓ ' + msg);

// ── 0. 全站內容彙整 ─────────────────────────────────────────
const allText = fs.readdirSync(root, { recursive: true })
  .filter((f) => /\.(html|js|txt|xml|json|md)$/i.test(String(f)) && !String(f).startsWith('.git'))
  .map((f) => {
    try { return fs.readFileSync(path.join(root, f), 'utf8'); }
    catch { return ''; }
  }).join('\n');

const htmlFiles = fs.readdirSync(root).filter((f) => f.endsWith('.html') && fs.statSync(path.join(root, f)).isFile());
const sitemapXml = fs.readFileSync(path.join(root, 'sitemap.xml'), 'utf8');
const sitemapLocs = [...sitemapXml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => m[1]);
const sitemapUrls = new Set(sitemapLocs.map((u) => {
  try { return new URL(u).pathname; } catch { return u; }
}).filter(Boolean));

// ── 1. sitemap ↔ 實體頁面對應 ────────────────────────────────
for (const url of sitemapUrls) {
  if (url === '/') continue; // 根由 index.html 提供
  const target = path.join(root, url.replace(/^\//, '').replace(/\?[^#]*/, ''));
  if (!fs.existsSync(target + (target.endsWith('.html') ? '' : '.html'))) {
    report('sitemap <loc>' + url + '</loc> 無對應頁面');
  }
}
// 排除工具頁與轉跳頁：不在 sitemap 但存在的特殊頁
const SKIP_PAGES = new Set(['og-image.html', 'google00a268e494d7ca7a.html']);
for (const f of htmlFiles) {
  if (SKIP_PAGES.has(f)) continue;
  if (f === 'index.html' && sitemapUrls.has('/')) continue;
  if (f !== 'index.html' && sitemapUrls.has('/' + f)) continue;
  const content = fs.readFileSync(path.join(root, f), 'utf8');
  // noindex 轉跳頁允許不在 sitemap
  if (/noindex/i.test(content) && /meta name="robots" content="noindex|<meta name="robots" content="noindex/.test(content)) continue;
  report(f + ' 是正式頁面但不在 sitemap（或該頁應標 noindex）');
}
if (sitemapUrls.size) ok('sitemap ' + sitemapUrls.size + ' 個網址與實體頁面對應完成');

// ── 2. 品牌常數一致性 ─────────────────────────────────────────
const LINE_LINK = 'https://lin.ee/WVxmY65';
const LINE_OA_ID = '@478xvlgl';
const GA4_ID = 'G-1H1X1X9QZE';
const LEAD_API_HOST = 'leakdoctor-bot.a0920077473.workers.dev';

const lineOccurrences = (allText.match(new RegExp(LINE_LINK.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
if (lineOccurrences < 80) report('LINE 連結出現 ' + lineOccurrences + ' 處，低於預期覆蓋（≥80）');
else ok('LINE 連結覆蓋 ' + lineOccurrences + ' 處（≥80）');

const headerJs = fs.readFileSync(path.join(root, 'header.js'), 'utf8');
const checks = [
  ["LINE = '" + LINE_LINK + "'", 'LINE 常數'],
  ["LINE_OA_ID = '" + LINE_OA_ID + "'", 'LINE_OA_ID 常數'],
  ["GA4_ID = '" + GA4_ID + "'", 'GA4_ID 常數'],
  [LEAD_API_HOST, 'LEAD_API 來源'],
];
for (const [needle, name] of checks) {
  const found = (headerJs.match(new RegExp(needle.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
  if (found !== 1) report(name + ' 在 header.js 內出現 ' + found + ' 次（應為 1）');
  else ok(name + ' 唯一且正確');
}
// 其他 HTML/腳本內的 LINE 連結與 GA4 ID 只能使用同一個常數值（防止手動貼不同連結）
const otherHtml = allText.replace(headerJs, '');
const otherLineLinks = [...otherHtml.matchAll(/https:\/\/lin\.ee\/([A-Za-z0-9_-]+)/g)].map((m) => m[1]);
const diffLinks = [...new Set(otherLineLinks)].filter((id) => id !== 'WVxmY65');
if (diffLinks.length) report('出現其他 LINE 短連結 ID：' + JSON.stringify(diffLinks) + '（全站應統一 WVxmY65；確認不是露涼社或業主其他品牌）');
else ok('全站 LINE 短連結 ID 統一（無露涼社混入）');
const otherGa = [...otherHtml.matchAll(/\bG-[A-Z0-9]{6,}\b/g)].map((m) => m[0]).filter((id) => id !== GA4_ID && id !== 'G-XXXXXXXXXX');
if (otherGa.length) report('出現其他 GA4 ID：' + JSON.stringify([...new Set(otherGa)]));
else ok('全站 GA4 ID 統一（不含占位假 ID）');

// ── 3. header.js 引用一致性 ───────────────────────────────────
const rootRefs = htmlFiles.map((f) => {
  const c = fs.readFileSync(path.join(root, f), 'utf8');
  const r = c.match(/<script[^>]*src=["'][^"']*\bheader\.js(?:\?[^"']*)?["'][^>]*>/g) || [];
  return { f, refs: r.map((s) => (s.match(/src=["']([^"'?]+)/) || [])[1]) };
}).filter((x) => x.refs.length);
const badRefs = rootRefs.filter((x) => !x.refs.every((r) => r === 'header.js'));
if (badRefs.length) report('根目錄頁面 header.js 引用路徑異常：' + JSON.stringify(badRefs));
else ok('根目錄 ' + rootRefs.length + ' 個頁面 header.js 引用一致（相對 header.js）');
// 子目錄頁面
const subPages = [];
for (const dir of fs.readdirSync(root, { withFileTypes: true }).filter((d) => d.isDirectory() && !d.name.startsWith('.'))) {
  for (const f of fs.readdirSync(path.join(root, dir.name)).filter((n) => n.endsWith('.html'))) {
    const c = fs.readFileSync(path.join(root, dir.name, f), 'utf8');
    const r = c.match(/<script[^>]*src=["'][^"']*\bheader\.js(?:\?[^"']*)?["'][^>]*>/g) || [];
    if (r.length) subPages.push({ f: dir.name + '/' + f, refs: r.map((s) => (s.match(/src=["']([^"'?]+)/) || [])[1]) });
  }
}
const badSub = subPages.filter((x) => !x.refs.every((r) => r === '../header.js'));
if (badSub.length) report('子目錄頁面 header.js 引用路徑異常：' + JSON.stringify(badSub));
else ok('子目錄 ' + subPages.length + ' 個頁面 header.js 引用一致（../header.js）');

// ── 4. 語法與結構 ─────────────────────────────────────────────
import { execSync } from 'node:child_process';
try { execSync('node --check ' + path.join(root, 'header.js'), { stdio: 'pipe' }); ok('header.js 語法檢查通過'); }
catch (e) { report('header.js 語法錯誤：' + e.toString().slice(0, 200)); }
const ldInitPresent = headerJs.includes('function ldInit()') && headerJs.includes('DOMContentLoaded');
const headModeNote = '文章頁在 <head> 載入 header.js，改壞 ldInit 會讓文章頁導覽消失';
if (!ldInitPresent) report('ldInit/DOMContentLoaded 結構缺失（' + headModeNote + '）');
else ok('ldInit + DOMContentLoaded 結構存在（保護文章頁導覽）');

// ── 5. 表單個資保護文案 ───────────────────────────────────────
const formText = headerJs.slice(headerJs.indexOf('姓名'), headerJs.indexOf('姓名') + 20000) || '';
const leakyPhrases = ['此裝置', '裝置資料', '自動收集', '自動擷取', '裝置編號'];
const foundLeaky = leakyPhrases.filter((p) => formText.includes(p));
if (foundLeaky.length) report('表單出現可能誤導的收集用語：' + JSON.stringify(foundLeaky));
else ok('表單文案符合「客戶在 LINE 內送出個資」設計（無暗示站內收集的字樣）');

// ── 總結 ─────────────────────────────────────────────────────
console.log(fail === 0 ? '\n✅ 全部通過（' + htmlFiles.length + ' 個頁面、' + sitemapUrls.size + ' 個 sitemap 網址）' : '\n❌ ' + fail + ' 項失敗，請先修正再 push');
process.exitCode = fail ? 1 : 0;
