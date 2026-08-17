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
//   2b. 反向：任何 noindex 頁都不得出現在 sitemap（矛盾訊號）
//   3. header.js 與各頁面引用路徑一致性（../header.js 在子目錄、header.js 在根）
//   4. 品牌常數一致性：LINE / LINE_OA_ID / GA4_ID / LEAD_API 唯一且正確
//   4d. 品牌綠 #06C755 全站單一，不得出現第二種綠
//   5. 全站 LINE 連結覆蓋率（根 HTML 每頁至少 1 處 LINE CTA）
//   6. 反個資：表單說明不得出現「此裝置」等暗示可收集個人訊息的詞彙；
//      個資由客戶在 LINE 內自行送出，站內表單只寫草稿
//   7. og-image.html 等工具頁維持 noindex 或不在 sitemap
//
// 撰寫規則：每條斷言的 ok() 訊息必須寫出實際掃描範圍與分母（幾個檔案／幾處），
// 不得只寫「完成」。2026-08-16 有三條斷言因為只讀單一檔案卻宣稱「全域」而漏判。
//
// 使用：node scripts/validate-site.mjs
import fs from 'node:fs';
import path from 'node:path';
const root = path.resolve(import.meta.dirname, '..');

let fail = 0;
const errors = [];
const report = (msg) => { errors.push(msg); fail++; console.error('✗ ' + msg); };
const ok = (msg) => console.log('✓ ' + msg);

// 實際頁面寫的是 content="noindex,follow"，早期版本用 content="noindex" 精確比對
// 抓不到帶 ,follow 的寫法，導致 noindex 判斷靜默失效。一律走這個容錯版本。
const isNoindex = (html) => /<meta[^>]+name=["']robots["'][^>]*content=["'][^"']*noindex/i.test(html);

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
// 排除工具頁與轉跳頁：不在 sitemap 但存在的特殊頁（工具頁必須標 noindex 才能豁免）
const SKIP_PAGES = new Set(['og-image.html', 'google00a268e494d7ca7a.html']);
for (const f of htmlFiles) {
  // Google 驗證檔必須保持單行純文字內容，不可加 noindex；僅豁免 sitemap 檢查
  if (f === 'google00a268e494d7ca7a.html') continue;
  const content = fs.readFileSync(path.join(root, f), 'utf8');
  if (SKIP_PAGES.has(f)) {
    if (!isNoindex(content)) {
      report(f + ' 是不收錄的工具頁但沒有 noindex 標記（會污染搜尋索引）');
    }
    continue;
  }
  if (f === 'index.html' && sitemapUrls.has('/')) continue;
  if (f !== 'index.html' && sitemapUrls.has('/' + f)) continue;
  // noindex 轉跳頁允許不在 sitemap
  if (isNoindex(content)) continue;
  report(f + ' 是正式頁面但不在 sitemap（或該頁應標 noindex）');
}

// ── 1b. 反向檢查：noindex 頁不得出現在 sitemap ────────────────
// 上面那圈只驗「檔案 → 有沒有進 sitemap」，驗不到「已經在 sitemap 裡的頁是不是 noindex」。
// 2026-08-15 的 update-sitemap.mjs 依「根目錄存在的 .html」列舉，把 10 個 noindex
// 轉跳頁一併收錄（26 → 36），而當時的斷言結構上看不見這個組合，所以全綠。
// sitemap 收錄 + noindex 是互相矛盾的訊號，且 noindex 會讓該頁的 canonical 永遠不被處理。
let noindexInSitemap = 0;
for (const f of htmlFiles) {
  const content = fs.readFileSync(path.join(root, f), 'utf8');
  if (!isNoindex(content)) continue;
  const p = f === 'index.html' ? '/' : '/' + f;
  if (sitemapUrls.has(p)) {
    report(f + ' 標了 noindex 卻仍列在 sitemap（矛盾訊號；且 Google 不會處理其 canonical）');
    noindexInSitemap++;
  }
}
if (noindexInSitemap === 0) ok('sitemap 未收錄任何 noindex 頁（雙向一致）');
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

// ── 4b. 全站減少動態偏好：使用者開啟 prefers-reduced-motion 時
// 所有頁面動畫必須被停用（header.js 動態注入 data-ld-reduced-motion 樣式）
const rmOk = /data-ld-reduced-motion/.test(headerJs) &&
  /animation:none/.test(headerJs) && /transition:none/.test(headerJs) &&
  /prefers-reduced-motion: reduce/.test(headerJs);
if (!rmOk) report('header.js 缺少全站 reduced-motion 停用規則（WCAG 2.3.3：內嵌動畫 109 處、keyframes 2 組，必須由 header.js 動態 style 統一覆蓋）');
else ok('全站 reduced-motion 規則存在（所有內嵌動畫統一覆蓋）');

// ── 4c. 無障礙防回歸：main landmark + 區塊可識別 ──────────────
let a11yFail = 0;
for (const f of htmlFiles) {
  if (SKIP_PAGES.has(f)) continue;
  const c = fs.readFileSync(path.join(root, f), 'utf8');
  if (!/<main\b/.test(c)) { report(f + ' 缺少 main landmark（WCAG 1.3.1：螢幕閱讀器需頁面主要內容起點）'); a11yFail++; }
  const missingA11y = (c.match(/<section(?![^>]*aria-label)(?![^>]*role=)[^>]*>/g) || []).length;
  if (missingA11y) { report(f + ' 有 ' + missingA11y + ' 個 section 缺 aria-label 與 role（WCAG 1.3.1 region）'); a11yFail++; }
}
if (a11yFail === 0) ok('無障礙結構：全部正式頁面 main landmark + section 皆可識別（region）');
// ── 4d. 品牌色單一來源：LINE 綠必須全站一致 ──────────────────
// 業主決定保留 LINE 官方品牌綠 #06C755（白字對比 2.26:1，未達 WCAG AA 1.4.3）。
// 這是明示的品牌取捨、不是疏漏，所以本斷言檢查的是「全站只有一種綠」，
// 而不是「對比達標」。
// 2026-08-16 曾把 header.js 的 5 處改成深綠 #047a36（5.47:1）但其餘 80 處未動，
// 造成同一頁出現兩種綠；當時的斷言只讀 header.js，看不到那 80 處。
// 若日後決定改用深綠，必須 29 個檔案一次改完，這條斷言才會轉綠。
const BRAND_GREEN = '#06C755';
const ALT_GREEN = '#047a36';
const styleFiles = fs.readdirSync(root, { recursive: true })
  .map(String)
  .filter((f) => /\.(html|css|js)$/i.test(f) && !f.startsWith('.git') && !f.startsWith('node_modules'));
const altHits = [];
let brandHits = 0;
for (const f of styleFiles) {
  let c;
  try { c = fs.readFileSync(path.join(root, f), 'utf8'); } catch { continue; }
  const alt = (c.match(new RegExp(ALT_GREEN, 'gi')) || []).length;
  if (alt) altHits.push(f + '×' + alt);
  brandHits += (c.match(new RegExp(BRAND_GREEN, 'gi')) || []).length;
}
if (altHits.length) {
  report('品牌綠不一致：' + ALT_GREEN + ' 殘留於 ' + altHits.join('、') + '（全站應統一為 ' + BRAND_GREEN + '）');
} else {
  ok('品牌綠全站單一：' + BRAND_GREEN + ' 共 ' + brandHits + ' 處（掃描 ' + styleFiles.length + ' 個 html/css/js），無 ' + ALT_GREEN + ' 殘留');
}

// ── 4e. 地區頁差異化：防止量產式重複內容（doorway pages）──────
// 2026-08-17 把 7 個地區頁從 noindex 放出來可被索引。它們是同一份模板，
// 差異在各市的行政區清單、到府時間、專屬 FAQ 與 LocalBusiness schema。
// Google 會處罰「只換城市名的量產落地頁」，所以差異度必須維持。
// 本斷言不追求某個「正確」的相似度，只做兩件事：
//   1. 每次都把實際最高相似度印出來，讓這個數字可被觀察、不會悄悄惡化
//   2. 相似度 ≥ CEILING 時擋下——那代表有人純複製貼上只改了地名
//
// 門檻用實測校準，不是憑感覺訂的（2026-08-17，本檔的行集合指標）：
//   現有 17 個可索引頁的最高相似度      64.6%（keelung vs taipei）
//   純複製 miaoli→changhua 只換地名     78.8%
//   → 門檻取 75%，夾在兩者之間，離現況留 10.4 個百分點餘裕
// ⚠️ 換了相似度算法就必須重新校準。初版憑另一種 token 指標的 85.9% 訂了
// 95% 門檻，結果純複製頁只有 78.8%，完全擋不下來——防假綠測試才抓到。
// ⚠️ 刻意不維護「哪些是地區頁」的清單。初版寫死了 7 個檔名，防假綠測試
// （複製 miaoli.html 成 changhua.html 只換地名）當場沒抓到——因為新頁不在
// 清單裡就完全逃過檢查。這正是本專案 2026-08-16 三次漏判的同一個形狀。
// 改為兩兩比對所有可索引頁面：任何位置的複製貼上都看得見，清單也不會過時。
const SIMILARITY_CEILING = 0.75;
const pageText = new Map();
for (const f of htmlFiles) {
  if (SKIP_PAGES.has(f)) continue;
  const content = fs.readFileSync(path.join(root, f), 'utf8');
  if (isNoindex(content)) continue; // 不可索引的頁不參與重複度判定
  const lines = content
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]*>/g, '\n')
    .split('\n').map((s) => s.trim()).filter(Boolean);
  pageText.set(f, new Set(lines));
}
let maxSim = 0;
let maxPair = '';
const pageList = [...pageText.keys()];
for (let i = 0; i < pageList.length; i++) {
  for (let j = i + 1; j < pageList.length; j++) {
    const a = pageText.get(pageList[i]);
    const b = pageText.get(pageList[j]);
    let shared = 0;
    for (const line of a) if (b.has(line)) shared++;
    const sim = shared / Math.max(a.size, b.size);
    if (sim > maxSim) { maxSim = sim; maxPair = pageList[i] + ' vs ' + pageList[j]; }
  }
}
const pairCount = (pageList.length * (pageList.length - 1)) / 2;
if (pageList.length < 2) {
  ok('頁面差異化：不足 2 頁可比對，本項未執行');
} else if (maxSim >= SIMILARITY_CEILING) {
  report('頁面重複度過高：' + maxPair + ' 相似 ' + (maxSim * 100).toFixed(1) + '%'
    + '（上限 ' + (SIMILARITY_CEILING * 100) + '%）。這是複製貼上只換了地名或服務名——'
    + 'Google 會判定為量產落地頁（doorway pages）並降權。'
    + '請補該頁專屬內容：實際案例、在地師傅、常見屋型；或該頁不應獨立存在。');
} else {
  ok('頁面差異化：' + pageList.length + ' 個可索引頁兩兩比對共 ' + pairCount
    + ' 組，最高相似度 ' + (maxSim * 100).toFixed(1) + '%（' + maxPair + '），上限 '
    + (SIMILARITY_CEILING * 100) + '%');
}

// ── 5. 表單個資保護文案 ───────────────────────────────────────
const formText = headerJs.slice(headerJs.indexOf('姓名'), headerJs.indexOf('姓名') + 20000) || '';
const leakyPhrases = ['此裝置', '裝置資料', '自動收集', '自動擷取', '裝置編號'];
const foundLeaky = leakyPhrases.filter((p) => formText.includes(p));
if (foundLeaky.length) report('表單出現可能誤導的收集用語：' + JSON.stringify(foundLeaky));
else ok('表單文案符合「客戶在 LINE 內送出個資」設計（無暗示站內收集的字樣）');

// ── 總結 ─────────────────────────────────────────────────────
console.log(fail === 0 ? '\n✅ 全部通過（' + htmlFiles.length + ' 個頁面、' + sitemapUrls.size + ' 個 sitemap 網址）' : '\n❌ ' + fail + ' 項失敗，請先修正再 push');
process.exitCode = fail ? 1 : 0;
