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
