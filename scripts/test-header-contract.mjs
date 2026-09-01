import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import {parseCss, resolve as resolveCss} from './css-cascade.mjs';

const root = new URL('../', import.meta.url);
const header = readFileSync(new URL('header.js', root), 'utf8');
const polish = readFileSync(new URL('assets/uiux-polish.css', root), 'utf8');
const expected = ['aircon', 'washer', 'homeclean', 'water-tank', 'pipe-cleaning', 'leak-repair'];
const faviconAssets = [
  ['favicon-16.png', 'favicon-16.png', 16],
  ['favicon-32.png', 'favicon-32.png', 32],
  ['apple-touch-icon.png', 'apple-touch-icon-180.png', 180],
  ['android-chrome-192.png', 'android-chrome-192.png', 192],
  ['favicon-source-512.png', 'favicon-source-512.png', 512],
  ['favicon.ico', 'favicon.ico'],
];
function checkBrandAsset(bytes, source) {
  assert.deepEqual(bytes, readFileSync(new URL('logo/avatars-icons/' + source, root)));
}
function checkFaviconLinks(html) {
  for (const file of ['favicon-16.png', 'favicon-32.png', 'favicon.ico', 'apple-touch-icon.png']) {
    assert.ok(html.includes('/' + file + '?v=20260831-brand'), file + ' must use current brand cache key');
  }
  assert.doesNotMatch(html, /favicon\.svg|20260720e/);
}
test('favicon assets reuse the existing brand emblem at every published size', () => {
  for (const [file, source, size] of faviconAssets) {
    const bytes = readFileSync(new URL(file, root));
    checkBrandAsset(bytes, source);
    if (size) {
      assert.equal(bytes.readUInt32BE(16), size);
      assert.equal(bytes.readUInt32BE(20), size);
    } else {
      assert.equal(bytes.readUInt16LE(2), 1, 'valid ICO fallback');
      assert.ok(bytes.readUInt16LE(4) > 0);
    }
  }
  assert.equal(existsSync(new URL('favicon.svg', root)), false, 'obsolete hand-drawn brush is retired');
});
test('all public HTML favicon declarations use the current brand version', () => {
  let checked = 0;
  for (const dir of ['', 'articles/']) {
    for (const file of readdirSync(new URL(dir, root)).filter(f => f.endsWith('.html'))) {
      const html = readFileSync(new URL(dir + file, root), 'utf8');
      if (!html.includes('favicon')) continue;
      checkFaviconLinks(html);
      checked++;
    }
  }
  assert.equal(checked, 37, 'all existing pages plus the partner application page must be checked');
});
test('mutation: non-brand icon bytes and a stale favicon cache key are rejected', () => {
  assert.throws(() => checkBrandAsset(Buffer.from('old brush'), 'favicon-32.png'));
  const html = readFileSync(new URL('index.html', root), 'utf8');
  assert.throws(() => checkFaviconLinks(html.replaceAll('20260831-brand', '20260720e')));
});
function checkNavigation(source) {
  const start = source.indexOf('  const activeNavId =');
  const end = source.indexOf('  const SERVICE_CHOICE_ICONS', start);
  assert.ok(start >= 0 && end > start);
  for (const activePage of expected) {
    const context = { activePage, NAV_ICONS: {} };
    runInNewContext(source.slice(start, end) + ';result={ids:tabs.map(t=>t.id),html:tabsHTML};', context);
    assert.deepEqual(Array.from(context.result.ids), expected);
    assert.equal((context.result.html.match(/aria-current="page"/g) || []).length, 1);
    assert.match(context.result.html, new RegExp('ld-tab--' + activePage + ' ld-active'));
  }
}
function checkBottomSpace(source) {
  assert.match(source, /body\s*\{padding-bottom:var\(--ld-bottom-space,/);
  const fn = source.match(/function setBottomSpace\(\)\{[\s\S]*?\n  \}/)?.[0];
  assert.ok(fn, 'shared bottom-space measurement must exist');
  for (const height of [0, 69, 103, 151]) {
    const properties = {};
    const context = { document: {
      getElementById: () => ({ offsetHeight: height }),
      documentElement: { style: { setProperty: (k, v) => { properties[k] = v; } } },
    }};
    runInNewContext(fn + ';setBottomSpace();', context);
    assert.equal(properties['--ld-bottom-space'], height + 'px');
  }
  assert.match(source, /bottomObserver\.observe\(stickyBar\)/);
}
test('all six services have an independent active navigation entry', () => checkNavigation(header));
test('service knowledge cards reserve a separate label and number row', () => {
  assert.match(header, /body\.service-page \.knowledge-rail \.knowledge-card\{[^}]*padding:4rem 1\.15rem 1\.15rem!important/);
  assert.match(header, /\.knowledge-rail \.knowledge-card small\{[^}]*right:68px/);
  assert.match(header, /\.knowledge-rail \.knowledge-card h3\{[^}]*margin-top:0/);
});
test('bottom content space follows actual CTA height, including safe area', () => checkBottomSpace(header));
test('official LINE PNG is used once, without hand-drawn or duplicate lettering', () => {
  assert.match(header, /<img id="ld-float-icon" src="\/assets\/brand\/line-brand-icon\.png"/);
  assert.doesNotMatch(header, /const LINE_ICON|const LINE_FLOAT_ICON|id="ld-float-text"/);
  const image = readFileSync(new URL('assets/brand/line-brand-icon.png', root));
  assert.equal(createHash('sha256').update(image).digest('hex'), readFileSync(new URL('scripts/line-brand.sha256', root), 'utf8').trim());
});
test('mutation: removing water-tank is rejected', () => {
  assert.throws(() => checkNavigation(header.replace(/\s*\{id:'water-tank'[^\n]+\n/, '\n')));
});
test('mutation: marking leak-repair active on water pages is rejected', () => {
  assert.throws(() => checkNavigation(header.replace('const activeNavId = activePage;', "const activeNavId = ['water-tank','pipe-cleaning'].includes(activePage) ? 'leak-repair' : activePage;")));
});
test('mutation: restoring 66px reservation is rejected', () => {
  assert.throws(() => checkBottomSpace(header.replace(/body\{padding-bottom:var\(--ld-bottom-space,[^\n]+/, 'body{padding-bottom:66px}')));
});
test('mutation: a hard-coded bar height is rejected', () => {
  assert.throws(() => checkBottomSpace(header.replace('stickyBar.offsetHeight', '66')));
});
function checkPriceFocus(css) {
  assert.match(css, /\.home-price-active #ld-float\{display:none!important\}/);
}
test('price mode keeps floating LINE away from quantity controls', () => checkPriceFocus(polish));
test('mutation: removing price-mode float protection is rejected', () => {
  assert.throws(() => checkPriceFocus(polish.replace('.home-price-active #ld-float{display:none!important}', '')));
});

function checkMobileFloat(css) {
  const base = header.match(/const css = `([\s\S]*?)`;/)?.[1];
  assert.ok(base, 'include the injected header CSS before the polish layer');
  const rules = parseCss(base + '\n' + css);
  for (const priceMode of [false, true]) {
    const el = {tag:'a', id:'ld-float', classes:[], attrs:{}, states:[], ancestors:priceMode?['home-price-active']:[]};
    for (const width of [320,360,375,390,720,721,768,1023,1024,1440]) {
      const expected = width <= 720 || (priceMode && width <= 1023) ? 'none' : 'flex';
      assert.equal(resolveCss(rules,el,'display',width).value,expected,`float width=${width}, priceMode=${priceMode}`);
    }
  }
  assert.match(header,/LINE 直接問/);
  assert.match(header,/填單估價/);
}
test('mobile copy is not covered by a duplicate LINE float; desktop and CTA remain',()=>checkMobileFloat(polish));
test('mutation: removing the mobile override is rejected despite header fallback',()=>{
  assert.throws(()=>checkMobileFloat(polish.replace('#ld-float{display:none!important}','')));
});
test('mutation: a later important rule reviving the float is rejected',()=>{
  assert.throws(()=>checkMobileFloat(polish+'\n#ld-float{display:flex!important}'));
});

// ── 浮動聯絡區（2026-08-31 修版）─────────────────────────
// 改版前是「白卡片裡包白方塊再包深藍鈕」——三層圓角、兩個實色互相競爭，
// 違反 DESIGN.md §3「單一畫面最多一個主 CTA 色」與 §6「同一區塊最多一層卡片嵌套」。
function checkContactIsland(js, css){
  // 標記：估價鈕在前、LINE 在後，DOM 順序＝視覺順序＝Tab 順序
  const island = js.match(/<div id="ld-contact-island"[\s\S]*?<\/div>/);
  assert.ok(island, '浮動聯絡區必須存在');
  const order = [...island[0].matchAll(/id="(ld-float-quote|ld-float)"/g)].map(m => m[1]);
  assert.deepEqual(order, ['ld-float-quote', 'ld-float'], 'DOM 順序必須是估價鈕在前、LINE 在後');

  // 副標移到 aria-label，畫面不留第二行文字
  assert.match(island[0], /id="ld-float-quote"[^>]*aria-label="[^"]{8,}"/, '估價鈕需有描述性 aria-label');
  // 2026-08-31 業主指定拆成「填單／估價」兩行，所以 span 本身是允許的；
  // 要守的是不得再把「先填需求」這類副標塞回畫面（它應該只存在於 aria-label）。
  const quoteBtn = island[0].match(/<button id="ld-float-quote"[\s\S]*?<\/button>/);
  assert.ok(quoteBtn, '估價鈕必須存在');
  const visibleText = quoteBtn[0].replace(/<[^>]*>/g, '');
  assert.equal(visibleText, '填單估價', '畫面文字只能是「填單估價」兩行，不得夾帶副標');
  assert.match(quoteBtn[0], /<span>填單<\/span><span>估價<\/span>/, '必須拆成兩行 span');

  // 官方 LINE 素材不得另疊文字（DESIGN.md §6）
  assert.match(island[0], /src="\/assets\/brand\/line-brand-icon\.png"/);
  assert.doesNotMatch(island[0], /id="ld-float"[\s\S]{0,200}?>LINE</, 'LINE 官方素材旁不得另加 LINE 字樣');

  // 外層容器不得再是卡片（無底色、無邊框、無陰影）
  const wrap = css.match(/#ld-contact-island\{([^}]*)\}/);
  assert.ok(wrap, '#ld-contact-island 需有樣式');
  assert.match(wrap[1], /background:none/, '外層容器不得有底色，否則又變成卡片包卡片');
  assert.match(wrap[1], /border:0/, '外層容器不得有邊框');
  assert.match(wrap[1], /box-shadow:none/, '外層容器不得有陰影');

  // LINE 按鈕本身不得再套白底（官方 PNG 已是綠底圓角方形，套白底會出現雙框）
  const lineRule = css.match(/#ld-contact-island #ld-float\{([^}]*)\}/);
  assert.ok(lineRule, '#ld-float 需有樣式');
  assert.match(lineRule[1], /background:none/, 'LINE 按鈕不得套白底，否則綠框外再多一層白框');

  // 次操作維持白底細框，不得再用第二個實色與 LINE 綠競爭
  const quoteRule = css.match(/#ld-float-quote\{([^}]*)\}/);
  assert.ok(quoteRule, '#ld-float-quote 需有樣式');
  assert.match(quoteRule[1], /background:#fff/, '次操作應為白底，不得填第二個品牌實色');
  const mh = quoteRule[1].match(/min-height:(\d+)px/);
  assert.ok(mh && Number(mh[1]) >= 44, `觸控目標至少 44px（目前 ${mh ? mh[1] : '未設定'}）`);
  assert.match(quoteRule[1], /white-space:nowrap/, '每行文字不得自行斷字');

  // 與 LINE 鈕視覺對齊：同寬、同高、同圓角，否則會變成藥丸配方塊
  const qw = quoteRule[1].match(/width:(\d+)px/), qh = quoteRule[1].match(/height:(\d+)px/);
  const qr = quoteRule[1].match(/border-radius:(\d+)px/);
  const lw = lineRule[1].match(/width:(\d+)px/), lh = lineRule[1].match(/height:(\d+)px/);
  const lr = lineRule[1].match(/border-radius:(\d+)px/);
  assert.ok(qw && lw && qw[1] === lw[1], `估價鈕與 LINE 鈕寬度須一致（${qw?.[1]} vs ${lw?.[1]}）`);
  assert.ok(qh && lh && qh[1] === lh[1], `估價鈕與 LINE 鈕高度須一致（${qh?.[1]} vs ${lh?.[1]}）`);
  assert.ok(qr && lr && qr[1] === lr[1], `估價鈕與 LINE 鈕圓角須一致（${qr?.[1]} vs ${lr?.[1]}）`);
}
test('浮動聯絡區：單一實色、無卡片嵌套、順序與觸控達標', () => checkContactIsland(header, polish));
test('mutation: 外層容器加回白底卡片會被拒絕', () => {
  assert.throws(() => checkContactIsland(header, polish.replace('background:none;border:0;padding:0;box-shadow:none', 'background:#fff;border:1px solid #dce4e7;padding:6px')));
});
test('mutation: 次操作改回深藍實色會被拒絕', () => {
  assert.throws(() => checkContactIsland(header, polish.replace(/(#ld-float-quote\{[^}]*)background:#fff/, '$1background:#17324d')));
});
test('mutation: 估價鈕加回副標會被拒絕', () => {
  assert.throws(() => checkContactIsland(
    header.replace('<span>填單</span><span>估價</span>', '<span>填單</span><span>估價</span><span>先填需求</span>'), polish));
});
test('mutation: 估價鈕與 LINE 鈕尺寸不一致會被拒絕', () => {
  assert.throws(() => checkContactIsland(header,
    polish.replace(/(#ld-float-quote\{[^}]*?)width:60px/, '$1width:94px')));
});
test('mutation: 估價鈕圓角與 LINE 鈕不一致會被拒絕', () => {
  assert.throws(() => checkContactIsland(header,
    polish.replace(/(#ld-float-quote\{[^}]*?)border-radius:18px/, '$1border-radius:999px')));
});

// ── 廠商招募入口（DESIGN.md §6，2026-08-31 業主確認取代「公開前台不顯示」）──
// 只能在最後一個轉換 CTA 之後、footer 正上方；不得做成主 CTA、不得上移到內容區。
function checkPartnerEntry(js, css){
  assert.match(js, /id="ld-partner-entry"/, '廠商招募入口必須存在');
  // 必須插在 footer 之前，而不是塞進內容區或 header
  assert.match(js, /footer\.insertAdjacentHTML\('beforebegin',\s*entry\)/,
    '招募入口只能插在 <footer> 正上方');
  assert.doesNotMatch(js, /insertAdjacentHTML\('afterbegin',\s*entry\)/,
    '招募入口不得插到頁首');
  // 指向獨立的申請頁，不得直接掛在主要轉換動作上
  assert.match(js, /id="ld-partner-entry"[\s\S]{0,200}?href="\/join\.html"/);
  assert.doesNotMatch(js, /id="ld-partner-entry"[\s\S]{0,300}?ldOpenQuote\(/,
    '招募入口不得共用客戶估價的觸發');
  // 樣式不得是主 CTA 按鈕：不得套用品牌橘或 .page-btn
  const rule = css.match(/#ld-partner-entry\{([^}]*)\}/);
  assert.ok(rule, '#ld-partner-entry 需有樣式');
  assert.doesNotMatch(rule[1], /--orange|#f28c28|#d96f0d/i,
    '招募入口不得使用主 CTA 品牌橘');
  assert.doesNotMatch(js, /id="ld-partner-entry"[\s\S]{0,300}?class="[^"]*page-btn/,
    '招募入口不得做成主 CTA 按鈕');
}
test('廠商招募入口只在 footer 上方，且不是主 CTA', () => checkPartnerEntry(header, polish));
test('mutation: 招募入口改插到頁首會被拒絕', () => {
  assert.throws(() => checkPartnerEntry(
    header.replace("footer.insertAdjacentHTML('beforebegin', entry)", "document.body.insertAdjacentHTML('afterbegin', entry)"), polish));
});
test('mutation: 招募入口套上主 CTA 品牌橘會被拒絕', () => {
  assert.throws(() => checkPartnerEntry(header,
    polish.replace(/#ld-partner-entry\{([^}]*)\}/, '#ld-partner-entry{$1;background:#f28c28}')));
});

// DESIGN.md 與實作必須同步：規則改了，文件要跟著改（這批就是因為沒改才對不起來）
test('DESIGN.md 已記錄招募入口與浮動區的現行規則', () => {
  const design = readFileSync(new URL('DESIGN.md', root), 'utf8');
  assert.doesNotMatch(design, /公開前台不顯示「加入我們」合作招募入口，主要浮動操作只保留 LINE。/,
    '舊條文與現行實作牴觸，必須移除');
  assert.match(design, /廠商招募入口/, 'DESIGN.md 需說明招募入口的位置規則');
  assert.match(design, /footer.{0,6}正上方/, 'DESIGN.md 需寫明只能放在 footer 正上方');
  assert.match(design, /LINE 主、填單估價次|LINE 主.{0,10}填單估價次/, 'DESIGN.md 需說明浮動區的主次關係');
  assert.match(design, /只保留 LINE 綠一個實色/, 'DESIGN.md 需寫明單一實色規則');
});
