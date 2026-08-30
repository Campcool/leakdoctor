// Diagnostic reproduction, NOT a green regression gate.
// Exit 0 currently means the known A/B defects reproduced as expected.
// After fixing the bot, replace these defect assertions with desired-behaviour tests.
// Read-only repo audit: real application functions + local in-memory SQLite.
// No production API, LINE, analytics, or supplier notification calls.
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { registerHooks, createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve, sep } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { createHmac } from 'node:crypto';

registerHooks({resolve(specifier, context, nextResolve) {
  if (specifier.startsWith('.') && context.parentURL?.startsWith('file:')) {
    const candidate = new URL(specifier + '.ts', context.parentURL);
    if (existsSync(fileURLToPath(candidate))) return nextResolve(candidate.href, context);
  }
  return nextResolve(specifier, context);
}});
// Fail closed if application code accidentally attempts an external request.
globalThis.fetch = async () => { throw new Error('Network prohibited in this audit'); };
if (!process.argv[2]) throw new Error('Usage: node scripts/audit-bot-handoff.mjs <local-bot-repository>');
const botRoot = pathToFileURL(resolve(process.argv[2]) + sep);
const { default:worker, buildWebsiteDraft } = await import(new URL('src/index.ts', botRoot));
const dbModule = await import(new URL('src/db.ts', botRoot));
const { parseWebsiteForm } = await import(new URL('src/parser.ts', botRoot));
const { orderConfirmationFlex, partnerWorkOrderFlex } = await import(new URL('src/line.ts', botRoot));
const { orderServiceNeeds } = await import(new URL('src/dispatch.ts', botRoot));
const { computeOrderSettlement } = await import(new URL('src/settlement.ts', botRoot));
const require = createRequire(import.meta.url);
const front = require('../assets/home-service-hub.js');
const sql = new DatabaseSync(':memory:');
for (const file of readdirSync(new URL('migrations/', botRoot)).filter(x => x.endsWith('.sql')).sort()) {
  sql.exec(readFileSync(new URL('migrations/' + file, botRoot), 'utf8'));
}
const db = {prepare(query) {
  const statement = sql.prepare(query);
  const bound = (args) => ({
      bind(...next) { return bound(next); },
      async first() { return statement.get(...args) ?? null; },
      async all() { return {results:statement.all(...args)}; },
      async run() { const r = statement.run(...args); return {meta:{changes:Number(r.changes),last_row_id:Number(r.lastInsertRowid)}}; }
  });
  return bound([]);
}};
const env = {DB:db};
const customer = {name:'測試用勿派工',phone:'0912345678',address:'新北市三重區測試路1號',time:'週六上午'};
const parse = (entries, leadId) => parseWebsiteForm(front.formatMessage(new Map(entries),customer,leadId));
const scenarios = [
  [['wall_mounted_split',2],['aircon_outdoor_unit',1]],
  [['ceiling_concealed',1],['aircon_outdoor_unit',1]],
  [['aircon_outdoor_unit',1]],
  [['window_aircon',2],['top_load_washer',1]],
  [['deep_cleaning',1],['window_aircon',3]],
  [['commercial_washer',2]],
  [['home_cleaning_4h',3]],
  [['rooftop_tank',1],['water_pipe_cleaning_house',1]],
];
let index = 0;
for (const entries of scenarios) {
  const calc = front.calculate(new Map(entries));
  const input = parse(entries,'HTL-L-20260830-ABC123');
  const draft = await buildWebsiteDraft(env,`audit-scenario-${++index}`,input);
  const stored = await dbModule.getOrderByPublicId(db,draft.publicId);
  assert.equal(stored.detail.items.length,entries.length);
  assert.equal(stored.detail.priced_subtotal,calc.amount);
  assert.equal(stored.detail.web_lead_id,'HTL-L-20260830-ABC123');
  if (calc.quoted.length) assert.equal(stored.estimateMin,undefined);
  else assert.equal(stored.estimateMin,calc.amount);
  assert.equal(orderServiceNeeds(stored).length,entries.length);
  for (const card of [orderConfirmationFlex(stored),partnerWorkOrderFlex(stored)]) {
    const json = JSON.stringify(card);
    for (const item of calc.items) assert.ok(json.includes(item.label),`Card lost ${item.id}`);
  }
}
console.log('PASS: 8 scenarios, actual frontend -> parser -> buildWebsiteDraft -> SQLite -> customer/partner cards -> dispatch needs');

// Exercise the actual settlement freeze SQL, including overwrite prevention.
const priced = await buildWebsiteDraft(env,'audit-settlement',parse(scenarios[0]));
const settlement = computeOrderSettlement({...priced,finalPrice:3698},[{id:1,partnerId:1,serviceId:'wall_mounted_split',cost:1300,active:true}]);
assert.equal(settlement.cost,2600);
assert.equal(settlement.margin,1098);
assert.equal(await dbModule.freezeOrderSettlement(db,priced.id,'2026-08',settlement),true);
assert.equal(await dbModule.freezeOrderSettlement(db,priced.id,'2026-09',{revenue:1,cost:1,margin:0}),false);
const frozen = sql.prepare('SELECT revenue_amount,cost_amount,margin_amount,settled_month FROM orders WHERE id=?').get(priced.id);
assert.deepEqual({...frozen},{revenue_amount:3698,cost_amount:2600,margin_amount:1098,settled_month:'2026-08'});
console.log('PASS: actual settlement freeze persists 3698/2600/1098 and refuses a second freeze');

// Reproduce a changed inquiry while an earlier draft is still pending.
const original = await buildWebsiteDraft(env,'audit-edited-inquiry',parse([['wall_mounted_split',1]]));
const edited = await buildWebsiteDraft(env,'audit-edited-inquiry',parse([['wall_mounted_split',2],['aircon_outdoor_unit',1]]));
assert.equal(edited.publicId,original.publicId);
assert.equal(edited.detail.items.length,1);
assert.equal(edited.detail.items[0].quantity,1);
assert.equal(edited.estimateMin,1599);
console.log('REPRODUCED: edited inquiry wall x2 + outdoor x1 should be 3698; actual old draft remains wall x1 = 1599');

// The same lead can be claimed repeatedly; linkage success is not once-only.
const lead = await dbModule.createWebLead(db,{...customer,service:'冷氣清洗',details:['壁掛內機 × 1'],attribution:{},gaClientId:'test.123'});
const claim1 = await dbModule.getWebLeadForClaim(db,lead.publicId,customer.phone);
assert.ok(claim1);
assert.equal(await dbModule.linkWebLeadToOrder(db,claim1,'audit-edited-inquiry',original.id),true);
const claim2 = await dbModule.getWebLeadForClaim(db,lead.publicId,customer.phone);
assert.ok(claim2);
assert.equal(await dbModule.linkWebLeadToOrder(db,claim2,'audit-edited-inquiry',original.id),true);
console.log('REPRODUCED: converted lead can be claimed and linked again; lifecycle handler has no once-only guard');

// Full webhook path with fake credentials and in-memory interception of all HTTP.
// Two distinct customer messages (NOT LINE webhook redelivery) containing one lead.
const outbound = [];
globalThis.fetch = async (url, options) => {
  const target = String(url);
  if (!target.startsWith('https://api.line.me/v2/bot/message/reply') && !target.startsWith('https://www.google-analytics.com/mp/collect')) {
    throw new Error('Unexpected outbound request blocked: ' + new URL(target).origin);
  }
  outbound.push({url:target,body:JSON.parse(options.body)});
  return new Response('{}',{status:200,headers:{'content-type':'application/json'}});
};
const webhookEnv = {...env,LINE_CHANNEL_SECRET:'local-audit-only',LINE_CHANNEL_ACCESS_TOKEN:'local-audit-only',GA4_MEASUREMENT_ID:'G-LOCAL',GA4_API_SECRET:'local-audit-only'};
const webhookLead = await dbModule.createWebLead(db,{...customer,service:'冷氣清洗',details:['壁掛內機 × 1'],attribution:{},gaClientId:'test.456'});
const webhookMessage = front.formatMessage(new Map([['wall_mounted_split',1]]),customer,webhookLead.publicId);
for (let attempt = 1; attempt <= 2; attempt++) {
  const body = JSON.stringify({events:[{type:'message',webhookEventId:`local-audit-event-${attempt}`,timestamp:Date.now(),replyToken:`local-audit-reply-${attempt}`,source:{type:'user',userId:'audit-webhook-customer'},message:{type:'text',id:`local-audit-message-${attempt}`,text:webhookMessage}}]});
  const signature = createHmac('sha256',webhookEnv.LINE_CHANNEL_SECRET).update(body).digest('base64');
  const tasks = [];
  const response = await worker.fetch(new Request('https://audit.invalid/webhook',{method:'POST',body,headers:{'x-line-signature':signature}}),webhookEnv,{waitUntil(p){tasks.push(p);}});
  assert.equal(response.status,200);
  await Promise.all(tasks);
}
const gaCalls = outbound.filter(r=>r.url.startsWith('https://www.google-analytics.com/mp/collect'));
assert.equal(gaCalls.length,2);
assert.equal(gaCalls[0].body.events[0].name,'working_lead');
assert.equal(gaCalls[0].body.events[0].params.lead_id,gaCalls[1].body.events[0].params.lead_id);
const replies = outbound.filter(r=>r.url.startsWith('https://api.line.me/'));
assert.equal(replies.length,2);
assert.equal(sql.prepare("SELECT count(*) AS n FROM orders o JOIN customers c ON c.id=o.customer_id WHERE c.line_user_id='audit-webhook-customer'").get().n,1);
console.log('REPRODUCED: real webhook handler, same form sent as two messages -> 1 draft but 2 working_lead events (HTTP mocked; no external traffic)');
sql.close();
