import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { runInNewContext } from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';
import {parseCss, resolve as resolveCss} from './css-cascade.mjs';

const root = new URL('../', import.meta.url);
const header = readFileSync(new URL('header.js', root), 'utf8');
const polish = readFileSync(new URL('assets/uiux-polish.css', root), 'utf8');
const expected = ['aircon', 'washer', 'homeclean', 'water-tank', 'pipe-cleaning', 'leak-repair'];
function checkNavigation(source) {
  const start = source.indexOf('  const activeNavId =');
  const end = source.indexOf('  const SERVICE_CHOICE_ICONS', start);
  assert.ok(start >= 0 && end > start);
  for (const activePage of expected) {
    const context = { activePage, NAV_ICONS: {} };
    runInNewContext(source.slice(start, end) + ';result={ids:tabs.map(t=>t.id),html:tabsHTML};', context);
    assert.deepEqual(Array.from(context.result.ids), expected);
    assert.equal((context.result.html.match(/aria-current="page"/g) || []).length, 1);
    assert.match(context.result.html, new RegExp('ld-tab--' + activePage + ' ld-active'));
  }
}
function checkBottomSpace(source) {
  assert.match(source, /body\s*\{padding-bottom:var\(--ld-bottom-space,/);
  const fn = source.match(/function setBottomSpace\(\)\{[\s\S]*?\n  \}/)?.[0];
  assert.ok(fn, 'shared bottom-space measurement must exist');
  for (const height of [0, 69, 103, 151]) {
    const properties = {};
    const context = { document: {
      getElementById: () => ({ offsetHeight: height }),
      documentElement: { style: { setProperty: (k, v) => { properties[k] = v; } } },
    }};
    runInNewContext(fn + ';setBottomSpace();', context);
    assert.equal(properties['--ld-bottom-space'], height + 'px');
  }
  assert.match(source, /bottomObserver\.observe\(stickyBar\)/);
}
test('all six services have an independent active navigation entry', () => checkNavigation(header));
test('bottom content space follows actual CTA height, including safe area', () => checkBottomSpace(header));
test('official LINE PNG is used once, without hand-drawn or duplicate lettering', () => {
  assert.match(header, /<img id="ld-float-icon" src="\/assets\/brand\/line-brand-icon\.png"/);
  assert.doesNotMatch(header, /const LINE_ICON|const LINE_FLOAT_ICON|id="ld-float-text"/);
  const image = readFileSync(new URL('assets/brand/line-brand-icon.png', root));
  assert.equal(createHash('sha256').update(image).digest('hex'), readFileSync(new URL('scripts/line-brand.sha256', root), 'utf8').trim());
});
test('mutation: removing water-tank is rejected', () => {
  assert.throws(() => checkNavigation(header.replace(/\s*\{id:'water-tank'[^\n]+\n/, '\n')));
});
test('mutation: marking leak-repair active on water pages is rejected', () => {
  assert.throws(() => checkNavigation(header.replace('const activeNavId = activePage;', "const activeNavId = ['water-tank','pipe-cleaning'].includes(activePage) ? 'leak-repair' : activePage;")));
});
test('mutation: restoring 66px reservation is rejected', () => {
  assert.throws(() => checkBottomSpace(header.replace(/body\{padding-bottom:var\(--ld-bottom-space,[^\n]+/, 'body{padding-bottom:66px}')));
});
test('mutation: a hard-coded bar height is rejected', () => {
  assert.throws(() => checkBottomSpace(header.replace('stickyBar.offsetHeight', '66')));
});
function checkPriceFocus(css) {
  assert.match(css, /\.home-price-active #ld-float\{display:none!important\}/);
}
test('price mode keeps floating LINE away from quantity controls', () => checkPriceFocus(polish));
test('mutation: removing price-mode float protection is rejected', () => {
  assert.throws(() => checkPriceFocus(polish.replace('.home-price-active #ld-float{display:none!important}', '')));
});

function checkMobileFloat(css) {
  const base = header.match(/const css = `([\s\S]*?)`;/)?.[1];
  assert.ok(base, 'include the injected header CSS before the polish layer');
  const rules = parseCss(base + '\n' + css);
  for (const priceMode of [false, true]) {
    const el = {tag:'a', id:'ld-float', classes:[], attrs:{}, states:[], ancestors:priceMode?['home-price-active']:[]};
    for (const width of [320,360,375,390,720,721,768,1023,1024,1440]) {
      const expected = width <= 720 || (priceMode && width <= 1023) ? 'none' : 'flex';
      assert.equal(resolveCss(rules,el,'display',width).value,expected,`float width=${width}, priceMode=${priceMode}`);
    }
  }
  assert.match(header,/LINE 直接問/);
  assert.match(header,/填單估價/);
}
test('mobile copy is not covered by a duplicate LINE float; desktop and CTA remain',()=>checkMobileFloat(polish));
test('mutation: removing the mobile override is rejected despite header fallback',()=>{
  assert.throws(()=>checkMobileFloat(polish.replace('#ld-float{display:none!important}','')));
});
test('mutation: a later important rule reviving the float is rejected',()=>{
  assert.throws(()=>checkMobileFloat(polish+'\n#ld-float{display:flex!important}'));
});
