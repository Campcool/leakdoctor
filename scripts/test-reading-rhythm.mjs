import assert from 'node:assert/strict';
import {test} from 'node:test';
import {readFileSync} from 'node:fs';

const read = (f) => readFileSync(new URL('../' + f, import.meta.url), 'utf8');
const SERVICE_PAGES = ['aircon.html','washer.html','homeclean.html','water-tank.html','pipe-cleaning.html','leak-repair.html'];
const ALL = ['index.html', ...SERVICE_PAGES];

// R1：首屏就要看得到價格。原本七頁首屏零數字，而價格透明是本站最強的差異化。
test('R1 首頁第一屏帶起價錨點',()=>{
  const s = read('index.html');
  assert.match(s,/class="hero-price-anchor"/);
  const m = s.match(/class="hero-price-anchor">([^<]+)</);
  assert.ok(m,'hero-price-anchor 必須有文字');
  assert.match(m[1],/\$[\d,]{3,}/,'起價錨點必須包含實際金額');
});

test('R1 六個服務頁的 hero 都帶價格資訊',()=>{
  for(const f of SERVICE_PAGES){
    const s = read(f);
    assert.match(s,/class="page-desc-price"/,`${f} 缺少 hero 價格錨點`);
    const m = s.match(/class="page-desc-price">([^<]+)</);
    assert.ok(m && m[1].length > 8,`${f} 價格錨點內容過短`);
    // 漏水頁沒有固定牌價，用免費初判＋車馬費口徑，不得編造金額
    if(f === 'leak-repair.html') assert.match(m[1],/免費初判|車馬費/,'漏水頁不得編造固定牌價');
    else assert.match(m[1],/\$[\d,]{3,}/,`${f} 起價錨點必須包含實際金額`);
  }
});

// 2026-08-31 owner decision: one persistent island instead of repeated content buttons.
function checkQuoteIsland(header){
  assert.match(header, /id="ld-contact-island"/);
  assert.match(header, /id="ld-float-quote"[^>]*onclick="ldOpenQuote\(\)"/);
  assert.match(header, /class="ld-sticky-btn ld-sticky-btn--form" onclick="ldOpenQuote\(\)"/);
}
test('R2 persistent desktop and mobile quote entries reuse the established form',()=>checkQuoteIsland(read('header.js')));
test('R2 repeated service-section quote buttons are removed',()=>{
  for(const f of SERVICE_PAGES)assert.doesNotMatch(read(f),/<button\b[^>]*onclick="ldOpenQuote\(/,f);
});

// R3：FAQ 的本質是異議處理，不是衛教。原本只有漏水頁做對。
const OBJECTION = /加價|會不會變|才變|追加|在場|怎麼辦|沒效果|停水|隱藏費用|不能施工|不能清洗|弄壞|做不完|不含|收費|車馬費|貴重|直接報價|還會再/;
test('R3 每個服務頁的第一題 FAQ 是異議處理，不是衛教',()=>{
  for(const f of SERVICE_PAGES){
    const s = read(f);
    const m = s.match(/<div class="faq-item">[\s\S]{0,200}?<button class="faq-q"[^>]*>(?:<span>)?([^<]+)/);
    assert.ok(m,`${f} 找不到第一題 FAQ`);
    assert.match(m[1],OBJECTION,`${f} 第一題「${m[1]}」不是異議處理型`);
  }
});

test('R3 每個服務頁至少三題異議處理',()=>{
  for(const f of SERVICE_PAGES){
    const qs = [...read(f).matchAll(/<button class="faq-q"[^>]*>(?:<span>)?([^<]+)/g)].map(m=>m[1]);
    const hit = qs.filter(q=>OBJECTION.test(q)).length;
    assert.ok(hit >= 3,`${f} 只有 ${hit} 題異議處理（共 ${qs.length} 題）`);
  }
});

test('R3 FAQ 答案不得出現無證據宣稱',()=>{
  const BANNED = /保證|絕對|百分之百|100%有效|最低價|全台第一|永不/;
  for(const f of ALL){
    for(const m of read(f).matchAll(/<div class="faq-a">([\s\S]{0,600}?)<\/div>/g)){
      assert.ok(!BANNED.test(m[1]),`${f} FAQ 出現無證據宣稱：${m[1].slice(0,40)}`);
    }
  }
});

// R5：痛點對號入座。原本居家清潔頁完全沒有痛點語言。
test('R5 居家清潔頁有痛點開場',()=>{
  const s = read('homeclean.html');
  assert.match(s,/class="pain-list"/);
  const items = (s.match(/<li>[^<]+<\/li>/g) || []).length;
  assert.ok(items >= 4,'痛點至少列四種常見情況');
});

// 成本不得對客公開（新增水男孩後金額級距變大，這條更重要）
// 註：曾寫過「掃描頁面上的數字是否等於供應商成本」的檢查，實測後移除——
// 3,500／28,000／50,000 都同時是 leak-repair.html 上真實的客戶案例金額
// （$3,500 打針嵌縫、$28,000 敲磚重做），比對數字只會製造假警報。
// 成本外洩真正的機制是「把待報價品項掛上固定牌價」，那條守在
// test-home-service-hub.mjs 的「供應商成本不得外洩成對客牌價」。

// ── 突變：刻意改壞要會紅 ──
test('mutation: 拿掉 hero 價格錨點會被抓到',()=>{
  const mutated = read('aircon.html').replace(/class="page-desc-price"/,'class="page-desc-plain"');
  assert.throws(()=>assert.match(mutated,/class="page-desc-price"/));
});

test('mutation: losing the persistent quote entry is rejected',()=>{
  assert.throws(()=>checkQuoteIsland(read('header.js').replace('id="ld-float-quote"','id="missing-quote"')));
});

test('mutation: 第一題 FAQ 換回衛教題會被抓到',()=>{
  assert.throws(()=>assert.match('水塔清洗多久做一次？',OBJECTION));
});

test('mutation: FAQ 出現「保證」會被抓到',()=>{
  assert.throws(()=>assert.ok(!/保證/.test('保證不會再漏')));
});

// ══ 2026-08-31 客戶端閱讀節奏（借鏡 SimplyCarbs /business）══
const SVC = SERVICE_PAGES;

// 業主 2026-08-31 明確指示：48／72 小時一定要附但書
// （旺季擠不出來、客戶可能要求夜間配合），不得寫成保證。
test('凡是出現 48H／72 小時的頁面，同一頁一定要有但書',()=>{
  for(const f of [...SVC,'index.html']){
    const s = read(f);
    const hasClaim = /48\s?H|48\s?小時|72\s?小時/.test(s);
    if(!hasClaim) continue;
    assert.match(s,/不是保證|非保證/,`${f} 出現 48／72 小時卻沒有「非保證」字樣`);
    assert.match(s,/旺季/,`${f} 但書缺少旺季情況`);
    assert.match(s,/夜間|特定時段/,`${f} 但書缺少夜間／特定時段需另行確認`);
  }
});

test('48H／72H 不得寫成保證或承諾',()=>{
  const BANNED = /保證\s?48|48\s?小時保證|一定[在於]?\s?48|必定 ?48|保證到府|準時保證/;
  for(const f of [...SVC,'index.html','about.html','areas.html']){
    assert.ok(!BANNED.test(read(f)),`${f} 把 48／72 小時寫成保證`);
  }
});

test('六個服務頁都有 Key Impact 三個數字',()=>{
  for(const f of SVC){
    const s = read(f);
    assert.match(s,/class="key-impact"/,`${f} 缺少 Key Impact`);
    const cells = (s.match(/class="ki-cell"/g)||[]).length;
    assert.equal(cells,3,`${f} Key Impact 應為 3 格，實際 ${cells}`);
    assert.match(s,/class="ki-note"/,`${f} Key Impact 缺少但書註記`);
  }
});

test('證據列用真實案例照片，不得用示意圖或 OG 圖充數',()=>{
  for(const f of SVC){
    const s = read(f);
    assert.match(s,/class="evidence-strip"/,`${f} 缺少證據列`);
    const strip = s.match(/<section class="evidence-strip"[\s\S]*?<\/section>/);
    assert.ok(strip,`${f} 證據列結構不完整`);
    const imgs = [...strip[0].matchAll(/<img src="([^"]+)"/g)].map(m=>m[1]);
    assert.ok(imgs.length>=2,`${f} 證據列至少要兩張，實際 ${imgs.length}`);
    for(const src of imgs){
      assert.match(src,/^\/cases(-clean)?\//,`${f} 證據列用了非案例圖：${src}`);
      assert.ok(!/service-photos|\/og\/|illustration/.test(src),`${f} 證據列不得用示意圖：${src}`);
    }
    assert.match(strip[0],/去識別/,`${f} 證據列必須保留去識別聲明`);
  }
});

test('證據列的錨點指向該頁真正的案例區',()=>{
  const targets = {'aircon.html':'aircon-cases','washer.html':'washer-cases','homeclean.html':'homeclean-cases',
    'water-tank.html':'water-tank-cases','pipe-cleaning.html':'pipe-cases','leak-repair.html':'cases-carousel'};
  for(const [f,id] of Object.entries(targets)){
    const s = read(f);
    assert.match(s,new RegExp(`class="ev-link" href="#${id}"`),`${f} 證據列錨點應指向 #${id}`);
    assert.match(s,new RegExp(`id="${id}"`),`${f} 找不到案例區 #${id}`);
  }
});

test('客戶時程軸四步，且第三步就是 48H／72H 的安排時間',()=>{
  for(const f of SVC){
    const s = read(f);
    assert.match(s,/class="customer-timeline"/,`${f} 缺少客戶時程軸`);
    const steps = (s.match(/class="ct-step"/g)||[]).length;
    assert.equal(steps,4,`${f} 時程軸應為 4 步，實際 ${steps}`);
    assert.match(s,/大台北約 48H，其他地區約 72H/,`${f} 時程軸缺少安排時間`);
    assert.match(s,/class="ct-caveat"/,`${f} 時程軸缺少完整但書`);
  }
});

test('FAQ 標題點名居住情境，不是泛泛的「常見問題」',()=>{
  for(const f of SVC){
    const s = read(f);
    const i = s.indexOf('<div class="faq-item">');
    assert.ok(i>0,`${f} 找不到 FAQ`);
    const before = s.slice(0,i);
    const h2s = [...before.matchAll(/<h2[^>]*>([^<]{2,44})<\/h2>/g)];
    const title = h2s[h2s.length-1][1].trim();
    assert.notEqual(title,'常見問題',`${f} FAQ 標題仍是泛泛的「常見問題」`);
    assert.match(title,/屋主|租屋|房東|管委會|鄰居/,`${f} FAQ 標題「${title}」未點名居住情境`);
  }
});

// ── 突變 ──
test('mutation: 拿掉但書會被抓到',()=>{
  // 兩處都要拿掉才算真的移除：ki-note 的短但書用「非保證」，ct-caveat 的完整但書用「不是保證」
  const mutated = read('aircon.html').replace(/不是保證/g,'').replace(/非保證/g,'');
  assert.throws(()=>assert.match(mutated,/不是保證|非保證/));
  // 只拿掉其中一處仍應留有另一處——確認兩層但書不是同一份複製
  const half = read('aircon.html').replace(/不是保證/g,'');
  assert.match(half,/非保證/,'短但書與完整但書必須各自存在');
});
test('mutation: 拿掉旺季或夜間字樣會被抓到',()=>{
  for(const word of ['旺季','夜間']){
    const mutated = read('aircon.html').split(word).join('');
    assert.throws(()=>assert.match(mutated,new RegExp(word)));
  }
});
test('mutation: Key Impact 少一格會被抓到',()=>{
  const mutated = read('aircon.html').replace('class="ki-cell"','class="ki-x"');
  assert.throws(()=>assert.equal((mutated.match(/class="ki-cell"/g)||[]).length,3));
});
test('mutation: 證據列改用示意圖會被抓到',()=>{
  const src='/assets/service-photos/aircon-cleaning-landscape-1200x628.jpg';
  assert.throws(()=>assert.match(src,/^\/cases(-clean)?\//));
});
test('mutation: 時程軸砍成三步會被抓到',()=>{
  const mutated = read('aircon.html').replace('class="ct-step"','class="ct-x"');
  assert.throws(()=>assert.equal((mutated.match(/class="ct-step"/g)||[]).length,4));
});
test('mutation: 把 48 小時寫成保證會被抓到',()=>{
  assert.throws(()=>assert.ok(!/保證\s?48/.test('保證 48 小時到府')));
});
