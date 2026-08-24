#!/usr/bin/env node
// test-mobile-nav-gate.mjs — 手機導覽門禁的 mutation test
//
// 為什麼要有這支
// ------------------------------------------------------------------
// validate-site.mjs 的「手機服務導覽」斷言前後被證明假綠兩次，兩次都是因為用字串比對：
//   2026-08-24 覆審反例：`.ld-tab[aria-current="page"]{height:28px!important;min-height:28px!important}`
//   把作用中頁籤實際壓到 28px，validator 仍 exit 0 並宣稱「最小值 44px」。
//
// 「斷言會綠」不等於「斷言有效」。這支測試往 header.js 注入各種真實的繞過寫法，
// 確認該紅的真的會紅、該綠的不會被誤殺。每個案例測完立即還原，不留痕跡。
//
// 使用：node scripts/test-mobile-nav-gate.mjs
// 退出碼：0＝全部符合期望；1＝有案例不符合（門禁本身有問題）

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
  } catch (e) {
    return { code: e.status ?? 1, out: String(e.stdout || '') + String(e.stderr || '') };
  }
}

// 手機斷點的錨點：把注入內容放進 1023px 以下的區塊，才會在手機生效
const MOBILE_ANCHOR = '@media(max-width:420px){';
const DESKTOP_ANCHOR = '@media(min-width:1024px){';

/** 在指定 anchor 之後注入一段 CSS。 */
function inject(anchor, cssSnippet) {
  const src = original.toString('utf8');
  if (!src.includes(anchor)) throw new Error('找不到注入錨點：' + anchor);
  return src.replace(anchor, anchor + '\n  ' + cssSnippet + '\n');
}

const CASES = [
  // ── 必須被攔截（真實的繞過寫法）──────────────────────────
  {
    name: '屬性選擇器 + !important 壓到 28px（2026-08-24 覆審反例）',
    mutate: () => inject(MOBILE_ANCHOR, '.ld-tab[aria-current="page"]{height:28px!important;min-height:28px!important;padding:0!important}'),
    expectFail: true,
  },
  {
    name: '複合選擇器 .ld-tab.ld-active 壓到 28px',
    mutate: () => inject(MOBILE_ANCHOR, '.ld-tab.ld-active{min-height:28px;height:28px}'),
    expectFail: true,
  },
  {
    name: '後代選擇器 .ld-nav .ld-tab 壓到 30px',
    mutate: () => inject(MOBILE_ANCHOR, '.ld-nav .ld-tab{min-height:30px;height:30px}'),
    expectFail: true,
  },
  {
    name: '標籤 + 屬性選擇器 a.ld-tab[href] 壓到 20px',
    mutate: () => inject(MOBILE_ANCHOR, 'a.ld-tab[href]{min-height:20px;height:20px}'),
    expectFail: true,
  },
  {
    name: '直接改基準規則的 min-height 44px→30px',
    mutate: () => original.toString('utf8').replace('min-width:112px;min-height:44px', 'min-width:112px;min-height:30px'),
    expectFail: true,
  },
  {
    name: '.ld-nav 自己關掉橫向捲動',
    mutate: () => inject(MOBILE_ANCHOR, '.ld-nav{overflow-x:hidden}'),
    expectFail: true,
  },
  {
    name: '.ld-nav 用 !important 關掉橫向捲動',
    mutate: () => inject(MOBILE_ANCHOR, '.ld-nav{overflow-x:hidden!important}'),
    expectFail: true,
  },
  {
    name: '作用中頁籤的 scroll-snap-align 改成 start',
    mutate: () => original.toString('utf8').replace('scroll-snap-align:center', 'scroll-snap-align:start'),
    expectFail: true,
  },
  {
    name: '置中改回會在載入時算出 0 的 scrollLeft 算式',
    mutate: () => original.toString('utf8').replace(
      "activeTab.scrollIntoView({ block:'nearest', inline:'center' });",
      'nav.scrollLeft = Math.max(0, activeTab.offsetLeft - (nav.clientWidth - activeTab.offsetWidth) / 2);',
    ),
    expectFail: true,
  },

  // ── 必須放行（不可誤殺）────────────────────────────────
  {
    name: '無關元件使用 overflow-x:hidden',
    mutate: () => inject(MOBILE_ANCHOR, '.other-component{overflow-x:hidden}'),
    expectFail: false,
  },
  {
    name: 'media query 改成等價的空白寫法（CSS 行為不變）',
    mutate: () => original.toString('utf8').split('@media(max-width:1023px)').join('@media (max-width: 1023px)'),
    expectFail: false,
  },
  {
    name: '只在桌機斷點縮小 .ld-tab（不影響手機觸控區）',
    mutate: () => inject(DESKTOP_ANCHOR, '.ld-tab{min-height:28px;height:28px}'),
    expectFail: false,
  },
  {
    name: '在手機斷點把觸控區加大到 56px',
    mutate: () => inject(MOBILE_ANCHOR, '.ld-tab{min-height:56px}'),
    expectFail: false,
  },
];

console.log('手機導覽門禁 mutation test');
const base = runValidate();
console.log('基準（未注入）：exit=' + base.code + (base.code === 0 ? ' ✓' : ' ✗ 基準就不綠，後續結果無意義'));
if (base.code !== 0) { console.error(base.out.slice(0, 800)); process.exit(2); }

let pass = 0;
const failures = [];
try {
  for (const c of CASES) {
    fs.writeFileSync(HEADER, c.mutate(), 'utf8');
    const r = runValidate();
    const caught = r.code !== 0;
    const good = caught === c.expectFail;
    if (good) pass++; else failures.push(c.name);
    const want = c.expectFail ? '應攔截' : '應放行';
    const got = caught ? '攔截' : '放行';
    console.log('  ' + (good ? 'OK ' : '✗  ') + c.name + '　（' + want + ' / 實際 ' + got + '）');
    if (caught && c.expectFail) {
      const line = r.out.split('\n').find((l) => l.includes('手機服務導覽'));
      if (line) console.log('        ' + line.trim().slice(0, 150));
    }
    if (!good && caught) {
      const line = r.out.split('\n').find((l) => l.includes('手機服務導覽'));
      if (line) console.log('        誤殺原因：' + line.trim().slice(0, 150));
    }
  }
} finally {
  fs.writeFileSync(HEADER, original);
}

const after = runValidate();
console.log('\n還原後：exit=' + after.code + (after.code === 0 ? ' ✓' : ' ✗ 還原失敗'));
console.log('分母：' + CASES.length + ' 個突變 | 符合期望 ' + pass + ' | 不符合 ' + failures.length);
if (failures.length) {
  console.error('不符合期望：\n  - ' + failures.join('\n  - '));
  process.exit(1);
}
if (after.code !== 0) process.exit(1);
console.log('門禁有效：該紅的會紅、該綠的沒被誤殺。');
