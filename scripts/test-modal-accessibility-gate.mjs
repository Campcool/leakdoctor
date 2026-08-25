#!/usr/bin/env node
// Mutation test for the reservation modal's 14px text and 44px controls gate.

import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const root = path.resolve(import.meta.dirname, '..');
const HEADER = path.join(root, 'header.js');
const VALIDATE = path.join(root, 'scripts', 'validate-site.mjs');
const original = fs.readFileSync(HEADER);

function runValidate() {
  try {
    execFileSync(process.execPath, [VALIDATE], { cwd: root, stdio: 'pipe' });
    return { code: 0, out: '' };
  } catch (error) {
    return { code: error.status ?? 1, out: String(error.stdout || '') + String(error.stderr || '') };
  }
}

function inject(anchor, cssSnippet) {
  const source = original.toString('utf8');
  if (!source.includes(anchor)) throw new Error('Missing injection anchor: ' + anchor);
  return source.replace(anchor, anchor + '\n  ' + cssSnippet + '\n');
}

const MOBILE_ANCHOR = '@media(max-width:390px){';
const DESKTOP_ANCHOR = '@media(min-width:640px){';
const CASES = [
  {
    name: 'privacy copy reduced to 10px',
    mutate: () => inject(MOBILE_ANCHOR, '.ld-q-privacy{font-size:10px!important}'),
    expectFail: true,
  },
  {
    name: 'price note reduced to 11px',
    mutate: () => inject(MOBILE_ANCHOR, '.ld-detail-note{font-size:11px!important}'),
    expectFail: true,
  },
  {
    name: 'close button reduced to 32px',
    mutate: () => inject(MOBILE_ANCHOR, '.ld-q-close{height:32px!important;min-height:32px!important}'),
    expectFail: true,
  },
  {
    name: 'quantity button reduced to 34px',
    mutate: () => inject(MOBILE_ANCHOR, '.ld-qty-btn{height:34px!important;min-height:34px!important}'),
    expectFail: true,
  },
  {
    name: 'unrelated small print remains outside the modal contract',
    mutate: () => inject(MOBILE_ANCHOR, '.other-component{font-size:10px}'),
    expectFail: false,
  },
  {
    name: 'desktop-only modal override remains outside the mobile gate',
    mutate: () => inject(DESKTOP_ANCHOR, '.ld-q-privacy{font-size:10px}'),
    expectFail: false,
  },
  {
    name: 'larger modal text and controls remain valid',
    mutate: () => inject(MOBILE_ANCHOR, '.ld-q-privacy{font-size:16px}.ld-q-close{height:48px;min-height:48px}'),
    expectFail: false,
  },
  // ── 以「真實祖先」為 key 的案例 ───────────────────────────────
  // 上面的案例全部用裸選擇器，證明不了門禁的合成元素祖先寫對沒有。
  // 初版把祖先寫成不存在的 .ld-quote-card，這幾條當時全部漏放。
  // 祖先名稱取自真實 DOM 實測，不是憑印象；改動前先重量一次。
  {
    name: 'real ancestor .ld-q-field shrinks the text input',
    mutate: () => inject(MOBILE_ANCHOR,
      '.ld-q-field .ld-q-input{height:20px!important;min-height:20px!important;padding:0!important}'),
    expectFail: true,
  },
  {
    name: 'real ancestor .ld-q-head shrinks the modal title',
    mutate: () => inject(MOBILE_ANCHOR, '.ld-q-head .ld-q-title{font-size:10px!important}'),
    expectFail: true,
  },
  {
    name: 'real ancestor .ld-detail-section shrinks the quantity button',
    mutate: () => inject(MOBILE_ANCHOR,
      '.ld-detail-section .ld-qty-btn{height:24px!important;min-height:24px!important}'),
    expectFail: true,
  },
  {
    name: 'validation-state ancestor .ld-invalid shrinks the field error text',
    mutate: () => inject(MOBILE_ANCHOR, '.ld-q-field.ld-invalid .ld-q-err{font-size:9px!important}'),
    expectFail: true,
  },
  {
    name: 'selected-state compound .ld-service-choice.ld-selected shrinks the option',
    mutate: () => inject(MOBILE_ANCHOR,
      '.ld-service-choice.ld-selected{height:28px!important;min-height:28px!important}'),
    expectFail: true,
  },
  {
    name: 'a rule keyed on a class that is absent from the real DOM must not fail the gate',
    // 反向保護：.ld-quote-card 不存在於真實 DOM，這條規則實際不會生效，
    // 門禁若攔它就是假紅——初版正是如此。
    mutate: () => inject(MOBILE_ANCHOR, '.ld-quote-card .ld-q-input{min-height:20px!important}'),
    expectFail: false,
  },
  {
    name: 'min-height alone cannot shrink a control that also sets height',
    // .ld-qty-btn 同時宣告 height:44px 與 min-height:44px。
    // 只壓 min-height 時 max(min-height,height) 仍是 44px，元素實際不會變小，
    // 門禁若攔它就是誤殺。有效反例必須同時壓 height。
    mutate: () => inject(MOBILE_ANCHOR, '.ld-detail-section .ld-qty-btn{min-height:24px!important}'),
    expectFail: false,
  },
];

console.log('Reservation modal accessibility gate mutation test');
const base = runValidate();
console.log('baseline: exit=' + base.code);
if (base.code !== 0) {
  console.error(base.out.slice(0, 1000));
  process.exit(2);
}

let passed = 0;
const failures = [];
try {
  for (const testCase of CASES) {
    fs.writeFileSync(HEADER, testCase.mutate(), 'utf8');
    const result = runValidate();
    const caught = result.code !== 0;
    const correct = caught === testCase.expectFail;
    if (correct) passed++; else failures.push(testCase.name);
    console.log((correct ? 'OK ' : 'FAIL ') + testCase.name + ' (expected '
      + (testCase.expectFail ? 'reject' : 'allow') + ', got ' + (caught ? 'reject' : 'allow') + ')');
    if (caught && testCase.expectFail) {
      const line = result.out.split('\n').find((entry) => entry.includes('預約 modal'));
      if (line) console.log('  ' + line.trim().slice(0, 180));
    }
  }
} finally {
  fs.writeFileSync(HEADER, original);
}

const after = runValidate();
console.log('restored: exit=' + after.code);
console.log('cases=' + CASES.length + ' passed=' + passed + ' failed=' + failures.length);
if (failures.length || after.code !== 0) {
  if (failures.length) console.error('Unexpected results:\n- ' + failures.join('\n- '));
  process.exit(1);
}
