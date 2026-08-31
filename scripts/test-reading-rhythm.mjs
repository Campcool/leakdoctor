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

// R2：桌機 ≥1024px 不顯示底部固定列，中段原本有 39–80% 完全沒有 CTA。
test('R2 每頁中段都有 CTA，不是只有頭尾',()=>{
  for(const f of ALL){
    const n = (read(f).match(/class="section-cta"/g) || []).length;
    assert.ok(n >= 2,`${f} 中段 CTA 只有 ${n} 個，桌機會出現長段空窗`);
  }
});

test('R2 中段 CTA 沿用既有元件與觸發，不自創新的下單路徑',()=>{
  for(const f of SERVICE_PAGES){
    const s = read(f);
    const blocks = s.match(/<div class="section-cta">[\s\S]{0,400}?<\/div>/g) || [];
    assert.ok(blocks.length > 0,`${f} 沒有 section-cta`);
    for(const b of blocks){
      assert.ok(/ldOpenQuote\(|href="#price-overview"/.test(b),`${f} 的 CTA 未沿用既有觸發`);
      assert.match(b,/class="page-btn"/,`${f} 的 CTA 未沿用既有按鈕樣式`);
    }
  }
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

test('mutation: 中段 CTA 減到一個會被抓到',()=>{
  const s = read('water-tank.html');
  const mutated = s.replace(/<div class="section-cta">[\s\S]{0,400}?<\/div>\r?\n/g,'');
  assert.ok(((mutated.match(/class="section-cta"/g)||[]).length) < 2);
  assert.throws(()=>assert.ok(((mutated.match(/class="section-cta"/g)||[]).length) >= 2));
});

test('mutation: 第一題 FAQ 換回衛教題會被抓到',()=>{
  assert.throws(()=>assert.match('水塔清洗多久做一次？',OBJECTION));
});

test('mutation: FAQ 出現「保證」會被抓到',()=>{
  assert.throws(()=>assert.ok(!/保證/.test('保證不會再漏')));
});
