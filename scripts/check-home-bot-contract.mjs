// Optional cross-repository integration check. No network, no real orders.
// node scripts/check-home-bot-contract.mjs ../huitailang-bot
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createRequire,stripTypeScriptTypes} from 'node:module';
const require = createRequire(import.meta.url);
const {services,formatMessage} = require('../assets/home-service-hub.js');
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
  const parsed = parseWebsiteForm(formatMessage(new Map([[item.id,2]]),{}));
  assert.ok(parsed,`Could not parse ${item.id}`);
  assert.equal(parsed.service,actual.label);
  assert.equal(parsed.detail.quantity,2);
}
const mixed = parseWebsiteForm(formatMessage(new Map([['wall_mounted_split',2],['aircon_outdoor_unit',1],['leak_inspection',1]]),{name:'整合測試',phone:'0912345678'},'HTL-L-20260830-ABC123'));
assert.equal(mixed.detail.service_lines.length,3);
assert.equal(mixed.detail.web_lead_id,'HTL-L-20260830-ABC123');
console.log(`Bot contract OK: ${services.length} retail labels/prices/parser mappings + 3-item message and lead ID.`);
