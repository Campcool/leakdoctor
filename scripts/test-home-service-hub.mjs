import assert from 'node:assert/strict';
import {test} from 'node:test';
import {createRequire} from 'node:module';
import {readFileSync} from 'node:fs';
import vm from 'node:vm';

const require = createRequire(import.meta.url);
const {services,clampQuantity,calculate,detailLines,formatMessage,routeForHash} = require('../assets/home-service-hub.js');
const cart = (...entries) => new Map(entries);
test('summary anchor remains inside price route, knowledge and initial route stay separate',()=>{
  assert.equal(routeForHash('#home-order-summary'),'price');
  assert.equal(routeForHash('#price-overview'),'price');
  assert.equal(routeForHash('#knowledge-overview'),'knowledge');
  assert.equal(routeForHash(''),'knowledge');
});

test('21 unique public services, no concrete tanks / dehumidifier / internal supplier costs',()=>{
  assert.equal(services.length,21);
  assert.equal(new Set(services.map(s=>s.id)).size,21);
  assert.ok(services.every(s=>!s.id.includes('concrete') && !s.id.includes('dehumidifier') && s.price !== -1));
  assert.ok(services.every(s=>s.quote || Number.isInteger(s.price) && s.price > 0));
});
test('all 12 fixed retail prices match the approved catalog snapshot',()=>{
  const prices = {wall_mounted_split:1599,ceiling_concealed:2799,transformer_split_aircon:2500,blower_wheel_removal:800,ceiling_concealed_extra_blower:500,aircon_outdoor_unit:500,top_load_washer:1599,front_load_drum_washer:3599,home_cleaning_4h:2500,rooftop_tank:1599,water_pipe_cleaning:3599,water_pipe_cleaning_house:4999};
  assert.deepEqual(Object.fromEntries(services.filter(s=>!s.quote).map(s=>[s.id,s.price])),prices);
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
