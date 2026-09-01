import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const {services,categories,categoryRows,clampQuantity,calculate,detailLines,formatMessage,routeForHash,renderServiceRow} = require('../assets/home-service-hub.js');
const cart = (...entries) => new Map(entries);
test('summary anchor remains inside price route, knowledge and initial route stay separate',()=>{
  assert.equal(routeForHash('#home-order-summary'),'price');
  assert.equal(routeForHash('#price-overview'),'price');
  assert.equal(routeForHash('#knowledge-overview'),'knowledge');
  assert.equal(routeForHash(''),'knowledge');
});

test('29 unique public services, no dehumidifier / internal supplier costs',()=>{
  assert.equal(services.length,29);
  assert.equal(new Set(services.map(s=>s.id)).size,29);
  // 2026-08-31：水泥水塔已開賣（水男孩企業社可承接），concrete 不再是禁字；
  // 但「不得對客顯示供應商成本」與「-1 不得當成價格」仍然是紅線。
  assert.ok(services.every(s=>!s.id.includes('dehumidifier') && s.price !== -1));
  assert.ok(services.every(s=>s.quote || Number.isInteger(s.price) && s.price > 0));
});
test('窗型冷氣明確限制一次三台以上才承接',()=>{
  const item = services.find(s=>s.id==='window_aircon');
  assert.ok(item);
  assert.equal(item.priceLabel,'一次 3 台以上才承接');
  assert.match(item.note,/兩人搬抬/);
});
test('all 15 fixed retail prices match the approved catalog snapshot',()=>{
  const prices = {wall_mounted_split:1599,ceiling_concealed:2799,transformer_split_aircon:2500,blower_wheel_removal:800,ceiling_concealed_extra_blower:500,aircon_outdoor_unit:500,top_load_washer:1599,front_load_drum_washer:3599,home_cleaning_4h:2500,rooftop_tank:1599,concrete_tank_small:4499,concrete_tank_medium:5999,concrete_tank_large:9999,water_pipe_cleaning:3599,water_pipe_cleaning_house:4999};
  assert.deepEqual(Object.fromEntries(services.filter(s=>!s.quote).map(s=>[s.id,s.price])),prices);
});
test('供應商成本不得外洩成對客牌價',()=>{
  // 水男孩簽約成本：水塔 2,000／水管 4,000／透天 5,300／水泥 3,500・5,000・9,000／
  // 給水測漏 6,000・補漏 28,000／排水測漏 10,000・補漏 50,000。
  // 任何一個數字出現在對客價格就是成本外洩。
  const supplierCosts = new Set([1000,1200,1300,1800,2000,2500,3500,4000,5000,5300,6000,9000,10000,28000,50000]);
  const retail = services.filter(s=>!s.quote).map(s=>s.price);
  for(const price of retail){
    assert.ok(!supplierCosts.has(price) || [2500,3500].includes(price),
      `對客牌價 ${price} 與供應商成本相同，疑似成本外洩`);
  }
  // 漏水施工四項金額級距高，一律不得掛固定牌價
  for(const id of ['supply_pipe_leak_test','supply_pipe_leak_repair','drain_pipe_leak_test','drain_pipe_leak_repair','concrete_upper_tank']){
    const item = services.find(s=>s.id===id);
    assert.ok(item,`${id} 應存在於前台清單`);
    assert.equal(item.quote,true,`${id} 必須是待報價`);
    assert.equal(item.price,undefined,`${id} 不得有固定牌價`);
  }
});
test('numeric input is finite integer 0–20',()=>{
  for(const [input,expected] of [[-1,0],[0,0],['2',2],[3.9,3],[999,20],['',0],['x',0],[Infinity,0],[NaN,0]]) assert.equal(clampQuantity(input),expected);
});
test('two indoor units + one outdoor unit = 3698',()=>{
  assert.equal(calculate(cart(['wall_mounted_split',2],['aircon_outdoor_unit',1])).amount,3698);
});
test('multi-category quantities, clear and unknown IDs',()=>{
  const selection = cart(['wall_mounted_split',2],['top_load_washer',1],['unknown',20]);
  assert.equal(calculate(selection).amount,4797);
  assert.equal(calculate(selection).items.length,2);
  selection.clear();assert.equal(calculate(selection).items.length,0);
});
test('mixed fixed + quoted work never implies quote is free',()=>{
  const result = calculate(cart(['top_load_washer',1],['leak_inspection',1]));
  assert.equal(result.amount,1599);assert.equal(result.quoted.length,1);
  const message = formatMessage(cart(['top_load_washer',1],['leak_inspection',1]),{});
  assert.match(message,/已定價項目小計：NT\$ 1,599/);assert.match(message,/待報價項目/);
});
test('quote-only message has no NT$0 claim',()=>{
  const message = formatMessage(cart(['deep_cleaning',1]),{});
  assert.ok(!message.includes('小計：NT$ 0'));
  assert.match(message,/需專員確認報價/);
});
test('blank contact fields omitted, populated fields sanitised, lead ID retained',()=>{
  const selection = cart(['wall_mounted_split',2]);
  const blank = formatMessage(selection,{});
  assert.ok(!blank.includes('姓名：') && !blank.includes('待補'));
  const full = formatMessage(selection,{name:'測試\n名稱',phone:'0912345678',address:'測試地址',time:'週六上午'},'HTL-L-TEST');
  assert.match(full,/姓名：測試 名稱/);assert.match(full,/線索編號：HTL-L-TEST/);assert.match(full,/希望時段：週六上午/);
});
test('every detail roundtrips label and integer quantity and fits API 180-char limit',()=>{
  for(const service of services){
    const lines = detailLines(calculate(cart([service.id,20])).items);
    assert.ok(lines[0].length <= 180);
    const match = lines[0].match(/^(.+?)\s*[×xX*]\s*(\d+)/);
    assert.equal(match[1].trim(),service.label);assert.equal(Number(match[2]),20);
  }
});

function bridgeHarness(response){
  const source = readFileSync(new URL('../header.js',import.meta.url),'utf8');
  const start = source.indexOf('window.ldCreatePriceInquiry = async function');
  const end = source.indexOf('\n  const SVC_PAGES',start);
  assert.ok(start > 0 && end > start);
  const events = [], requests = [];
  const context = {window:{},leadAttribution:()=>({utm_source:'test'}),gaValue:async()=>'',cookieGaClientId:()=>'',landingPage:()=> 'https://leakdoctor.tw/',location:{pathname:'/'},document:{referrer:''},AbortController,setTimeout,clearTimeout,LEAD_API:'https://test.invalid/api/leads',LINE_OA_ID:'@478xvlgl',ldTrack:(...args)=>events.push(args),fetch:async(url,options)=>{requests.push({url,options});if(response instanceof Error) throw response;return response;}};
  vm.runInNewContext(source.slice(start,end),context);
  return {run:context.window.ldCreatePriceInquiry,events,requests};
}
test('lead capture success keeps all details + attribution and returns the official LINE base',async()=>{
  const h = bridgeHarness({ok:true,json:async()=>({leadId:'HTL-L-TEST'})});
  const details = detailLines(calculate(cart(['wall_mounted_split',2],['top_load_washer',1])).items);
  const result = await h.run({name:'測試',phone:'0912345678',service:'冷氣清洗',details});
  assert.equal(result.leadId,'HTL-L-TEST');assert.match(result.lineBase,/oaMessage\/@478xvlgl\/\?$/);
  const payload = JSON.parse(h.requests[0].options.body);
  assert.deepEqual(payload.details,details);assert.equal(payload.attribution.utm_source,'test');
  assert.equal(h.events.filter(([name])=>name==='generate_lead').length,1);
});
test('HTTP failure / missing lead ID / network failure never emits conversion',async()=>{
  for(const response of [{ok:false,json:async()=>({})},{ok:true,json:async()=>({})},new Error('offline')]){
    const h = bridgeHarness(response);await assert.rejects(h.run({}));assert.equal(h.events.length,0);
  }
});

// —— 2026-08-30 Claude 審查後補強 ——

test('待報價項目一律排在固定價之後（bot 用第一行推訂單主服務）',()=>{
  // window_aircon 在 services 陣列比 top_load_washer 早，若照陣列順序輸出，
  // 訂單標題會變成需報價的窗型，即使客戶主要買的是直立式洗衣機。
  const items = calculate(cart(['window_aircon',2],['top_load_washer',1])).items;
  assert.equal(items[0].id,'top_load_washer');
  assert.equal(items[1].id,'window_aircon');
  const lines = formatMessage(cart(['window_aircon',2],['top_load_washer',1]),{}).split('\n').filter(l=>l.startsWith('服務內容：'));
  assert.match(lines[0],/直立式洗衣機清洗/);
});

test('冷氣主機說明必須講清楚售價只含室內機',()=>{
  for(const id of ['wall_mounted_split','ceiling_concealed']){
    const item = services.find(s=>s.id===id);
    assert.match(item.note,/只含室內機/,`${id} 的說明要講明只含室內機`);
    assert.doesNotMatch(item.label,/室內外機|含室外機/,`${id} 的標籤不可宣稱含室外機`);
  }
  assert.match(services.find(s=>s.id==='aircon_outdoor_unit').note,/壁掛與吊隱都需另加購/);
});

test('希望時段欄位名與畫面標籤一致',()=>{
  const msg = formatMessage(cart(['wall_mounted_split',1]),{time:'週六上午'});
  assert.match(msg,/希望時段：週六上午/);
  assert.doesNotMatch(msg,/希望日期/);
});

test('純待報價仍不得出現 NT$0 總額',()=>{
  const r = calculate(cart(['deep_cleaning',1],['window_aircon',2]));
  assert.equal(r.amount,0);
  assert.equal(r.priced.length,0);
  assert.equal(r.quoted.length,2);
});

const homeHtml = readFileSync(new URL('../index.html',import.meta.url),'utf8');
const homeCss = readFileSync(new URL('../assets/home-service-hub.css',import.meta.url),'utf8');
function checkEntry(html){
  const entry = html.indexOf('id="home-route-nav"'), hero = html.indexOf('<section id="hero"');
  assert.ok(entry > 0 && entry < hero,'mode choice precedes the story');
  assert.equal((html.match(/role="tablist"/g)||[]).length,1);
  for(const route of ['price','knowledge']){
    assert.match(html,new RegExp('aria-controls="'+route+'-overview"'));
    assert.match(html,new RegExp('id="'+route+'-overview"[^>]*role="tabpanel"'));
  }
  for(const phrase of ['居家問題','先看懂','找對方法','才有用'])assert.ok(html.includes('<span class="home-phrase">'+phrase+'</span>'));
}
function checkCompactRow(html,item,quantity){
  const controls=html.split('<div class="price-item-controls">')[1]?.split('<div class="price-item-note">')[0];
  assert.ok(controls && controls.includes('class="price-item-price"') && controls.includes('class="qty-stepper"'),'price and quantity share a controls row');
  assert.ok(html.includes(item.label) && html.includes(item.note),'all original terms remain');
  assert.ok(html.includes('value="'+quantity+'"'));
  assert.match(html,/data-service="(?:aircon|washer|homeclean|water-tank|pipe-cleaning|leak-repair)"/);
  assert.match(html,/type="number" inputmode="numeric" min="0" max="20"/);
}
test('first-screen modes and intact desktop heading phrases',()=>checkEntry(homeHtml));
test('all 21 compact price rows retain labels, conditions and accessible quantity inputs',()=>services.forEach(item=>checkCompactRow(renderServiceRow(item,2),item,2)));
test('price themes distinguish tank, pipes and leak without changing their catalog groups',()=>{
  for(const [id,theme] of [['rooftop_tank','water-tank'],['water_pipe_cleaning','pipe-cleaning'],['leak_inspection','leak-repair']])assert.ok(renderServiceRow(services.find(s=>s.id===id),0).includes('data-service="'+theme+'"'));
});
test('homepage evidence uses labelled real assets, separate from disclosed illustrations',()=>{
  const cases=homeHtml.split('id="home-real-cases"')[1].split('</section>')[0];
  for(const service of ['aircon','washer'])for(const state of ['before','after'])assert.ok(cases.includes('/cases/'+service+'/case01-'+state+'.webp'));
  assert.equal((cases.match(/<figcaption>清洗前<\/figcaption>/g)||[]).length,2);
  assert.equal((cases.match(/<figcaption>清洗後<\/figcaption>/g)||[]).length,2);
});
test('mutation: burying modes behind the hero is rejected',()=>assert.throws(()=>checkEntry(homeHtml.replace('id="home-route-nav"','id="removed-route-nav"'))));
test('mutation: quantity outside the compact controls row is rejected',()=>{
  const item=services[0];assert.throws(()=>checkCompactRow(renderServiceRow(item,2).replace('class="qty-stepper"','class="detached-stepper"'),item,2));
});
test('mutation: splitting a protected heading phrase is rejected',()=>assert.throws(()=>checkEntry(homeHtml.replace('class="home-phrase">居家問題','class="home-phrase">居家問</span><span>題'))));
test('six themes and adjacent surface contrast are explicit',()=>{
  for(const service of ['aircon','washer','homeclean','water-tank','pipe-cleaning','leak-repair'])assert.ok(homeCss.includes('[data-service="'+service+'"]{--service-accent:'));
  assert.match(homeCss,/\.price-item:nth-of-type\(even\)\{background:color-mix/);
  assert.match(homeCss,/\.qty-btn\{[^}]*width:44px;height:44px/);
});

// ── 品項抽屜（2026-08-31 業主指定）─────────────────────────
// 大項六個；細項預設只露出一項最常見的，其餘按＋才展開。
test('六個大項，順序固定：冷氣→洗衣機→居家→水塔→水管→補漏',()=>{
  assert.deepEqual(categories.map(c=>c.id),['aircon','washer','homeclean','tank','pipe','leak']);
  assert.deepEqual(categories.map(c=>c.label),['冷氣清洗','洗衣機清洗','居家清潔','水塔清洗','水管清洗','漏水補漏']);
});

test('預設展開的細項：冷氣＝壁掛室內機、洗衣機＝直立式；水塔／水管／補漏不展開',()=>{
  const byId = Object.fromEntries(categories.map(c=>[c.id,c.defaultId]));
  assert.equal(byId.aircon,'wall_mounted_split');
  assert.equal(byId.washer,'top_load_washer');
  assert.equal(byId.homeclean,'home_cleaning_4h');
  assert.equal(byId.tank,null);
  assert.equal(byId.pipe,null);
  assert.equal(byId.leak,null);
});

test('預設細項一定排在該大項第一個',()=>{
  for(const cat of categories){
    const rows = categoryRows(cat.id);
    assert.ok(rows.length > 0,`${cat.label} 不可為空`);
    if(cat.defaultId) assert.equal(rows[0].id,cat.defaultId,`${cat.label} 第一項應為 ${cat.defaultId}`);
  }
});

test('每個服務都屬於且只屬於一個大項，沒有孤兒',()=>{
  const ids = new Set(categories.map(c=>c.id));
  for(const item of services) assert.ok(ids.has(item.cat),`${item.id} 的 cat「${item.cat}」不在大項清單`);
  const covered = categories.flatMap(c=>categoryRows(c.id).map(r=>r.id));
  assert.equal(covered.length,services.length);
  assert.equal(new Set(covered).size,services.length);
});

test('cat 是畫面分類，不可污染 Bot 用的 group（水塔／水管／抓漏後端同屬 water）',()=>{
  for(const id of ['rooftop_tank','concrete_tank_small','water_pipe_cleaning','leak_inspection','drain_pipe_leak_repair']){
    assert.equal(services.find(s=>s.id===id).group,'water',`${id} 的 group 必須維持 water`);
  }
  assert.equal(services.find(s=>s.id==='rooftop_tank').cat,'tank');
  assert.equal(services.find(s=>s.id==='water_pipe_cleaning').cat,'pipe');
  assert.equal(services.find(s=>s.id==='leak_inspection').cat,'leak');
});

test('水泥水塔已開賣：三個級距有牌價，破百噸維持現場勘查',()=>{
  assert.equal(services.find(s=>s.id==='concrete_tank_small').price,4499);
  assert.equal(services.find(s=>s.id==='concrete_tank_medium').price,5999);
  assert.equal(services.find(s=>s.id==='concrete_tank_large').price,9999);
  assert.equal(services.find(s=>s.id==='concrete_upper_tank').quote,true);
  for(const item of categoryRows('tank')) assert.equal(item.cat,'tank');
});

// 突變測試：刻意改壞要會紅
test('mutation: 把水塔設成預設展開會被抓到',()=>{
  const mutated = categories.map(c=>c.id==='tank'?{...c,defaultId:'rooftop_tank'}:c);
  assert.throws(()=>{
    const byId = Object.fromEntries(mutated.map(c=>[c.id,c.defaultId]));
    assert.equal(byId.tank,null);
  });
});

test('mutation: 冷氣預設改成吊隱式會被抓到',()=>{
  const mutated = categories.map(c=>c.id==='aircon'?{...c,defaultId:'ceiling_concealed'}:c);
  assert.throws(()=>{
    assert.equal(mutated.find(c=>c.id==='aircon').defaultId,'wall_mounted_split');
  });
});

test('mutation: 少一個大項會讓服務變成孤兒',()=>{
  const mutated = categories.filter(c=>c.id!=='leak');
  const ids = new Set(mutated.map(c=>c.id));
  assert.throws(()=>{
    for(const item of services) assert.ok(ids.has(item.cat),`${item.id} 孤兒`);
  });
});

test('mutation: 把漏水補漏掛上固定牌價會被抓到（成本級距高，不得對客顯示總價）',()=>{
  const mutated = services.map(s=>s.id==='supply_pipe_leak_repair'?{...s,quote:false,price:39999}:s);
  assert.throws(()=>{
    const item = mutated.find(s=>s.id==='supply_pipe_leak_repair');
    assert.equal(item.quote,true);
  });
});

test('大項起價不看加購項（冷氣不可顯示成 NT$ 500 起）',()=>{
  const main = categoryRows('aircon').filter(s=>!s.quote && !/加購/.test(s.groupLabel||''));
  assert.equal(Math.min(...main.map(s=>s.price)),1599);
  // 加購項確實存在且更便宜——沒排除就會變成起價
  const addons = categoryRows('aircon').filter(s=>/加購/.test(s.groupLabel||''));
  assert.ok(addons.length>0 && Math.min(...addons.map(s=>s.price))<1599);
});

test('抽屜的螢幕閱讀器文字必須用倉庫既有的隱藏 class，不可自創（會變成可見大字）',()=>{
  const src = readFileSync(new URL('../assets/home-service-hub.js',import.meta.url),'utf8');
  const css = readFileSync(new URL('../assets/home-service-hub.css',import.meta.url),'utf8');
  const classes = [...src.matchAll(/class="([a-z-]*visually-hidden|[a-z-]*sr-only)"/g)].map(m=>m[1]);
  assert.ok(classes.length>0,'抽屜應有螢幕閱讀器說明文字');
  for(const cls of classes) assert.ok(css.includes('.'+cls+'{'),`${cls} 未定義於 CSS，會變成可見文字`);
});
