// css-cascade.mjs — 零相依的 CSS 解析與 cascade 計算（供 validate-site.mjs 的門禁使用）
//
// 為什麼需要這個模組
// ------------------------------------------------------------------
// 2026-08-24 覆審發現：用 `.ld-tab\s*\{` 這類字串／regex 檢查 CSS，攔不住真實回歸。
// 反例是在手機斷點加一條
//     .ld-tab[aria-current="page"]{height:28px!important;min-height:28px!important;padding:0!important}
// 瀏覽器 computed height 確實變成 28px，但 regex 因為選擇器不是「純 .ld-tab{」而完全看不到它，
// validator 仍回報「最小值 44px」並 exit 0。
//
// 任何以「字串是否存在」為基礎的門禁，都能被 specificity、屬性選擇器、複合選擇器或
// !important 繞過。所以這裡改成真的解析 CSS，並依照 cascade 規則算出「最後生效的宣告」。
//
// 涵蓋範圍與已知限制（誠實列出，不要當成完整的 CSS 引擎）
// ------------------------------------------------------------------
// 有處理：
//   - 註解、巢狀 @media（含多重條件以 and 串接）、@supports（一律視為成立）
//   - 選擇器逗號分列、後代／子代組合子、複合選擇器（.a.b）、屬性選擇器（[a]、[a="v"]、[a~="v"] 等）
//   - :hover/:focus 等 pseudo-class（可指定狀態）、::before/::after 等 pseudo-element（一律排除，
//     因為它們是另一個盒子，不影響本體高度）
//   - specificity（id / class+attr+pseudo-class / type）、!important、來源順序
// 沒處理（用到時會拋錯或明確回報，不會靜默放行）：
//   - @keyframes 內容（整段跳過，本來就不參與 cascade）
//   - :is()/:where()/:not() 的內部 specificity 計算 —— 遇到時保守地視為「可能命中」並標記
//   - 繼承、var() 求值、calc()、相對單位換算 —— 本模組只回傳宣告的原始值字串
//   - @container / @layer / style attribute
//
// 使用者：scripts/validate-site.mjs

/** 去掉註解，但保留字串內容的長度不變（避免位移影響 order 判斷時出錯）。 */
function stripComments(css) {
  return css.replace(/\/\*[\s\S]*?\*\//g, (m) => ' '.repeat(m.length));
}

/**
 * 把 CSS 解析成扁平的規則清單。
 * @param {string} cssText
 * @returns {{selector:string, decls:Array<{prop:string,value:string,important:boolean}>, media:string[], order:number}[]}
 */
export function parseCss(cssText) {
  const css = stripComments(cssText);
  const rules = [];
  let order = 0;

  function parseBlock(text, offset, media) {
    let i = 0;
    while (i < text.length) {
      // 找下一個 { 或 }
      const braceOpen = text.indexOf('{', i);
      if (braceOpen === -1) break;
      const prelude = text.slice(i, braceOpen).trim();

      // 配對出這個區塊的內容
      let depth = 0, j = braceOpen, close = -1;
      for (; j < text.length; j++) {
        if (text[j] === '{') depth++;
        else if (text[j] === '}') { depth--; if (depth === 0) { close = j; break; } }
      }
      if (close === -1) break;                       // 括號不平衡：停止解析
      const body = text.slice(braceOpen + 1, close);

      if (prelude.startsWith('@')) {
        const at = prelude.slice(1).split(/[\s(]/)[0].toLowerCase();
        if (at === 'media' || at === 'supports') {
          const cond = prelude.slice(('@' + at).length).trim();
          parseBlock(body, offset + braceOpen + 1, media.concat(at === 'media' ? [cond] : []));
        }
        // @keyframes / @property / @font-face 等不參與元素 cascade，整段跳過
      } else if (prelude) {
        const decls = parseDeclarations(body);
        for (const sel of splitSelectors(prelude)) {
          rules.push({ selector: sel, decls, media: media.slice(), order: order++ });
        }
      }
      i = close + 1;
    }
  }

  parseBlock(css, 0, []);
  return rules;
}

/** 依逗號拆選擇器，但不切到括號（:is(a,b)、[attr="a,b"]）裡面的逗號。 */
function splitSelectors(prelude) {
  const out = [];
  let depth = 0, quote = null, buf = '';
  for (const ch of prelude) {
    if (quote) { buf += ch; if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue; }
    if (ch === '(' || ch === '[') depth++;
    if (ch === ')' || ch === ']') depth--;
    if (ch === ',' && depth === 0) { if (buf.trim()) out.push(buf.trim()); buf = ''; continue; }
    buf += ch;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

/** 拆宣告，處理 !important 與括號內的分號。 */
function parseDeclarations(body) {
  const out = [];
  let depth = 0, quote = null, buf = '';
  const flush = () => {
    const s = buf.trim();
    buf = '';
    if (!s) return;
    const c = s.indexOf(':');
    if (c === -1) return;
    const prop = s.slice(0, c).trim().toLowerCase();
    let value = s.slice(c + 1).trim();
    const important = /!\s*important\s*$/i.test(value);
    if (important) value = value.replace(/!\s*important\s*$/i, '').trim();
    if (prop) out.push({ prop, value, important });
  };
  for (const ch of body) {
    if (quote) { buf += ch; if (ch === quote) quote = null; continue; }
    if (ch === '"' || ch === "'") { quote = ch; buf += ch; continue; }
    if (ch === '(') depth++;
    if (ch === ')') depth--;
    if (ch === ';' && depth === 0) { flush(); continue; }
    buf += ch;
  }
  flush();
  return out;
}

/**
 * 判斷 media 條件在給定 viewport 下是否成立。
 * 只支援 min-width / max-width（本站唯一用到的）；遇到看不懂的條件回傳 null＝不確定。
 */
export function mediaMatches(conditions, viewportWidth) {
  for (const cond of conditions) {
    const parts = cond.split(/\band\b/i);
    for (const p of parts) {
      const mw = p.match(/\(\s*(min|max)-width\s*:\s*([\d.]+)px\s*\)/i);
      if (mw) {
        const v = Number(mw[2]);
        if (mw[1].toLowerCase() === 'min' ? !(viewportWidth >= v) : !(viewportWidth <= v)) return false;
        continue;
      }
      if (!p.trim()) continue;
      if (/^\s*(screen|all)\s*$/i.test(p)) continue;
      return null;                                    // 不確定：交給呼叫端決定怎麼處理
    }
  }
  return true;
}

const PSEUDO_ELEMENT = /::[\w-]+|:(before|after|first-line|first-letter|selection|placeholder|-webkit-[\w-]+)\b/i;

/** 把一段複合選擇器（不含組合子）拆成 tag/id/classes/attrs/pseudos。 */
function parseCompound(text) {
  const out = { tag: null, id: null, classes: [], attrs: [], pseudos: [], unknown: false };
  let i = 0;
  while (i < text.length) {
    const ch = text[i];
    if (ch === '*') { i++; continue; }
    if (ch === '.') {
      const m = /^\.([\w-]+)/.exec(text.slice(i));
      if (!m) { out.unknown = true; break; }
      out.classes.push(m[1]); i += m[0].length; continue;
    }
    if (ch === '#') {
      const m = /^#([\w-]+)/.exec(text.slice(i));
      if (!m) { out.unknown = true; break; }
      out.id = m[1]; i += m[0].length; continue;
    }
    if (ch === '[') {
      let depth = 0, j = i, quote = null;
      for (; j < text.length; j++) {
        const c = text[j];
        if (quote) { if (c === quote) quote = null; continue; }
        if (c === '"' || c === "'") { quote = c; continue; }
        if (c === '[') depth++;
        else if (c === ']') { depth--; if (depth === 0) break; }
      }
      const raw = text.slice(i + 1, j);
      const am = /^\s*([\w-]+)\s*(?:([~^|$*]?=)\s*(?:"([^"]*)"|'([^']*)'|([^\s\]]+))\s*)?$/.exec(raw);
      if (!am) out.unknown = true;
      else out.attrs.push({ name: am[1].toLowerCase(), op: am[2] || null, value: am[3] ?? am[4] ?? am[5] ?? null });
      i = j + 1; continue;
    }
    if (ch === ':') {
      const m = /^::?[\w-]+(\([^)]*\))?/.exec(text.slice(i));
      if (!m) { out.unknown = true; break; }
      out.pseudos.push(m[0]); i += m[0].length; continue;
    }
    const tm = /^[\w-]+/.exec(text.slice(i));
    if (tm) { out.tag = tm[0].toLowerCase(); i += tm[0].length; continue; }
    out.unknown = true; break;
  }
  return out;
}

/** 拆組合子，回傳複合選擇器序列（只需要最後一個對應目標元素）。 */
function parseSelector(sel) {
  const parts = sel.trim().split(/\s*([>+~])\s*|\s+/).filter((x) => x !== undefined && x !== '');
  return parts.map((p) => (['>', '+', '~'].includes(p) ? p : parseCompound(p)));
}

/**
 * 目標元素描述：{ tag, classes:[], attrs:{}, states:[] }
 * states 是想模擬的 pseudo-class，例如 ['hover']；未列出的 pseudo-class 視為不成立。
 * ancestors 是已知的祖先 class 清單（例如 .ld-tab 一定在 .ld-nav 裡）。
 */
function compoundMatches(c, el) {
  if (c.unknown) return 'maybe';
  if (c.tag && el.tag && c.tag !== el.tag) return false;
  if (c.id && el.id !== c.id) return false;
  for (const cls of c.classes) if (!el.classes.includes(cls)) return false;
  for (const a of c.attrs) {
    const have = el.attrs[a.name];
    if (have === undefined) return false;
    if (a.op === null) continue;
    if (a.op === '=' && String(have) !== a.value) return false;
    if (a.op === '~=' && !String(have).split(/\s+/).includes(a.value)) return false;
    if (a.op === '^=' && !String(have).startsWith(a.value)) return false;
    if (a.op === '$=' && !String(have).endsWith(a.value)) return false;
    if (a.op === '*=' && !String(have).includes(a.value)) return false;
    if (a.op === '|=' && !(String(have) === a.value || String(have).startsWith(a.value + '-'))) return false;
  }
  for (const p of c.pseudos) {
    if (PSEUDO_ELEMENT.test(p)) return false;                 // 偽元素是另一個盒子，不影響本體
    const name = p.replace(/^::?/, '').replace(/\(.*/, '').toLowerCase();
    if (['is', 'where', 'not', 'has'].includes(name)) return 'maybe';
    // :root 只命中 <html>，可以確定判斷，不必列為不確定
    if (name === 'root') { if (el.tag !== 'html') return false; continue; }
    // 這些取決於 DOM 位置，靜態分析無法判定；但只有在同一個複合選擇器的其餘條件
    // 都已命中時才會走到這裡，所以標成「可能命中」交給人工看，不要靜默放行
    if (['first-child', 'last-child', 'nth-child', 'nth-of-type', 'only-child', 'first-of-type', 'last-of-type'].includes(name)) return 'maybe';
    if (!(el.states || []).includes(name)) return false;
  }
  return true;
}

/** 選擇器是否命中目標元素（最後一個複合必須命中；祖先以 el.ancestors 概略比對）。 */
export function selectorMatches(sel, el) {
  const seq = parseSelector(sel);
  if (!seq.length) return false;
  const last = seq[seq.length - 1];
  if (typeof last === 'string') return false;
  const m = compoundMatches(last, el);
  if (m !== true) return m;                                    // false 或 'maybe'
  // 祖先：只要每個祖先複合的 class 都出現在 el.ancestors 裡就算命中（保守放寬）
  const ancestors = seq.slice(0, -1).filter((x) => typeof x !== 'string');
  for (const a of ancestors) {
    if (a.unknown) return 'maybe';
    const pool = el.ancestors || [];
    const need = a.classes.concat(a.id ? ['#' + a.id] : []);
    if (need.length && !need.every((c) => pool.includes(c))) return false;
  }
  return true;
}

/** CSS specificity：[id, class+attr+pseudo-class, type]。 */
export function specificity(sel) {
  let a = 0, b = 0, c = 0;
  for (const part of parseSelector(sel)) {
    if (typeof part === 'string') continue;
    if (part.id) a++;
    b += part.classes.length + part.attrs.length;
    for (const p of part.pseudos) {
      if (PSEUDO_ELEMENT.test(p)) c++; else b++;
    }
    if (part.tag) c++;
  }
  return [a, b, c];
}

function cmpSpec(x, y) {
  for (let i = 0; i < 3; i++) if (x[i] !== y[i]) return x[i] - y[i];
  return 0;
}

/**
 * 依 cascade 算出某個 property 在指定 viewport 下的最終宣告。
 * @returns {{value:string|null, selector:string|null, important:boolean, media:string[], uncertain:string[]}}
 */
export function resolve(rules, el, prop, viewportWidth) {
  let win = null;
  const uncertain = [];
  for (const r of rules) {
    const mm = mediaMatches(r.media, viewportWidth);
    if (mm === false) continue;
    if (mm === null) { uncertain.push('無法判定的 media 條件：' + r.media.join(' and ')); continue; }
    const d = [...r.decls].reverse().find((x) => x.prop === prop);
    if (!d) continue;
    const sm = selectorMatches(r.selector, el);
    if (sm === false) continue;
    if (sm === 'maybe') uncertain.push('無法判定的選擇器：' + r.selector);
    const cand = { value: d.value, selector: r.selector, important: d.important, media: r.media, spec: specificity(r.selector), order: r.order };
    if (!win) { win = cand; continue; }
    if (cand.important !== win.important) { if (cand.important) win = cand; continue; }
    const s = cmpSpec(cand.spec, win.spec);
    if (s > 0 || (s === 0 && cand.order > win.order)) win = cand;
  }
  return win
    ? { value: win.value, selector: win.selector, important: win.important, media: win.media, uncertain }
    : { value: null, selector: null, important: false, media: [], uncertain };
}

/** 把 '44px' 這種長度字串轉成 px 數值；非固定 px（auto/%/calc/var）回傳 null。 */
export function toPx(value) {
  if (value === null || value === undefined) return null;
  const m = /^\s*(-?[\d.]+)px\s*$/.exec(value);
  return m ? Number(m[1]) : null;
}
