// Optional cross-repository integration check. No network, no real orders.
// node scripts/check-home-bot-contract.mjs ../leakdoctor-bot
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire,stripTypeScriptTypes} from 'node:module';
const require = createRequire(import.meta.url);
const {services,formatMessage} = require('../assets/home-service-hub.js');
// 前台用客戶看得懂的量詞，後台用報價單的計價單位；以下差異是刻意的，改動前請一併確認訊息與卡片讀起來合理。
const UNIT_EXCEPTIONS = {
  commercial_aircon:'案',            // bot「案件」
  commercial_washer:'台',            // bot「案件」；客戶是以台數描述，實際仍逐案報價
  home_cleaning_4h:'次',             // bot「4 小時」；訊息寫「× 3 次」比「× 3 4 小時」清楚
  deep_cleaning:'案',                // bot「案件」
  move_out_cleaning:'案',            // bot「案件」
  post_renovation_cleaning:'案',     // bot「案件」
  leak_inspection:'案',              // bot「案件」
};
const root = process.argv[2];
if(!root) throw new Error('Pass the local leakdoctor-bot checkout path');
const asModule = source => 'data:text/javascript;base64,' + Buffer.from(source).toString('base64');
const catalogUrl = asModule(stripTypeScriptTypes(readFileSync(resolve(root,'src/catalog.ts'),'utf8')));
const catalog = await import(catalogUrl);
const parserSource = stripTypeScriptTypes(readFileSync(resolve(root,'src/parser.ts'),'utf8')).replace('"./catalog"',JSON.stringify(catalogUrl));
const {parseWebsiteForm} = await import(asModule(parserSource));
for(const item of services){
  const actual = catalog.SERVICE_OPTIONS.find(option=>option.id===item.id);
  assert.ok(actual,`Missing backend ID ${item.id}`);
  assert.equal(item.label,actual.label);
  assert.equal(Boolean(item.quote),actual.pricing.status==='quote_required');
  if(!item.quote) assert.equal(item.price,actual.pricing.basePrice);
  // 單位語意：前台面向客戶、後台面向報價單，少數用字刻意不同。
  // 差異必須列在 UNIT_EXCEPTIONS 由人審過，不能靜默漂移。
  const backendUnit = actual.pricing.unit.replace(/^每/,'');
  const expectedUnit = UNIT_EXCEPTIONS[item.id] ?? backendUnit;
  assert.equal(item.unit,expectedUnit,`Unit drift on ${item.id}: front "${item.unit}" vs bot "${backendUnit}" (not in UNIT_EXCEPTIONS)`);
  const parsed = parseWebsiteForm(formatMessage(new Map([[item.id,2]]),{}));
  assert.ok(parsed,`Could not parse ${item.id}`);
  assert.equal(parsed.service,actual.label);
  assert.equal(parsed.detail.quantity,2);
}
const mixed = parseWebsiteForm(formatMessage(new Map([['wall_mounted_split',2],['aircon_outdoor_unit',1],['leak_inspection',1]]),{name:'整合測試',phone:'0912345678'},'HTL-L-20260830-ABC123'));
assert.equal(mixed.detail.service_lines.length,3);
assert.equal(mixed.detail.web_lead_id,'HTL-L-20260830-ABC123');

// 混合訂單：待報價項目不可排在第一行。parser 用第一行推訂單主服務，
// 排錯會讓訂單標題與業主通知掛成需報價品項，即使客戶主要買的是固定價服務。
const mixedOrder = parseWebsiteForm(formatMessage(new Map([['window_aircon',2],['top_load_washer',1]]),{name:'整合測試',phone:'0912345678'}));
assert.equal(mixedOrder.service,'直立式洗衣機清洗','Quote-only item must not become the order headline service');

// 冷氣售價只含室內機：兩種主機標籤都不可宣稱含室外機（會讓客戶以為不必加購 $500）。
for(const id of ['wall_mounted_split','ceiling_concealed']){
  const label = catalog.SERVICE_OPTIONS.find(o=>o.id===id).label;
  assert.ok(!label.includes('室內外機') && !label.includes('含室外機'),`${id} label must not claim the outdoor unit is included: ${label}`);
}

// 前台的訊息欄位名要落在 parser 認得的別名上，否則整行被靜默丟掉。
const fieldMsg = formatMessage(new Map([['wall_mounted_split',1]]),{name:'整合測試',phone:'0912345678',address:'新北市三重區',time:'週六上午'});
const parsedFields = parseWebsiteForm(fieldMsg);
assert.equal(parsedFields.preferredTime,'週六上午','希望時段 must reach preferredTime');
assert.equal(parsedFields.address,'新北市三重區');

console.log(`Bot contract OK: ${services.length} retail labels/prices/units/parser mappings + mixed-order headline, indoor-only labels, field aliases and lead ID.`);
