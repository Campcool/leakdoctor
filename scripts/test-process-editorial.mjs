import {readFileSync, existsSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import assert from 'node:assert/strict';
import {test} from 'node:test';
import {parseCss, resolve as resolveCss} from './css-cascade.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const read = path => readFileSync(resolve(root,path),'utf8');
// Snapshot of pre-refinement safety/operational copy, not regenerated from new markup.
const originals = JSON.parse(read('scripts/fixtures/process-original-content.json'));
const pages = Object.keys(originals);
const css = read('assets/process-editorial.css');
const strip = text => text.replace(/<[^>]*>/g,'');

function checkProcess(page, html) {
  assert.match(html, /data-editorial-page/);
  assert.equal((html.match(/href="\/assets\/process-editorial.css\?/g)||[]).length,1);
  const section = html.match(/<section\b(?=[^>]*\bclass="service-flow(?: service-flow--compact)?")(?=[^>]*\bdata-process-editorial)[^>]*>[\s\S]*?<\/section>/)?.[0];
  assert.ok(section, `${page}: editorial flow is present`);
  assert.match(section, /<ol class="process-timeline" role="list">/);
  assert.doesNotMatch(section, /service-step-grid/);
  const details = [...section.matchAll(/<details class="process-detail">([\s\S]*?)<\/details>/g)];
  assert.equal(details.length, originals[page].length);
  details.forEach(([_, detail], i) => {
    const old = originals[page][i];
    assert.ok(detail.includes(old.title.replace(/^\d+\.\s*/,'')),`${page} ${i}: title survives`);
    assert.ok(detail.includes(`<p>${old.body}</p>`),`${page} ${i}: complete original copy survives`);
    assert.match(detail, /<summary><h3>/);
    assert.match(detail, /class="process-summary">[^<]+</);
    assert.ok(detail.includes(`class="process-number" aria-hidden="true">${String(i+1).padStart(2,'0')}</span>`));
    assert.doesNotMatch(detail, /onclick|role="button"/);
  });
  const img = section.match(/<img src="([^"]+)"[^>]*width="(\d+)" height="(\d+)"/);
  assert.ok(img,`${page}: image has dimensions`);
  assert.ok(existsSync(resolve(root,img[1].replace(/^\//,''))),`${page}: asset exists`);
}

function checkLayout(source) {
  assert.match(source, /\.headline-line\{white-space:normal!important/);
  assert.match(source, /grid-template-columns:repeat\(2,minmax\(0,1fr\)\)!important/);
  assert.match(source, /#water-tank-cases \.real-case-grid \.craft-compare\{aspect-ratio:4\/3\}/);
  assert.match(source, /summary:focus-visible/);
  assert.match(source, /\.service-step::before\{content:none;display:none\}/);
  assert.match(source, /\.keep-phrase\{display:inline-block;max-width:100%/);
  assert.match(source, /--service-toc-h,0px/);
  assert.ok(source.includes('.price-table tr:has(> th){display:none!important}'));
}

for (const page of pages) test(`${page}: ordered, accessible flow retains original instructions`,()=>checkProcess(page,read(page+'.html')));
test('shared layout guards',()=>checkLayout(css));
test('water-tank pairs do not override the common aspect ratio',()=>{
  const cases = read('water-tank.html').split('id="water-tank-cases"')[1].split('</section>')[0];
  assert.equal((cases.match(/class="craft-compare"/g)||[]).length,2);
  assert.doesNotMatch(cases,/style="[^"]*aspect-ratio/);
});
test('table phrase grouping does not change price or service text',()=>{
  const home = read('homeclean.html'), pipe = read('pipe-cleaning.html');
  for(const text of ['重污、移動家具、較多細節','社區／店面／辦公室','約 $400–1,000／坪','現場確認後包工報價']) assert.ok(strip(home).includes(text),text);
  for(const text of ['依樓層與管線條件報價','水塔或加壓設備狀況','出水點數']) assert.ok(strip(pipe).includes(text),text);
});
test('TOC observes font/reflow changes; editorial rows do not wait for reveal',()=>{
  const js = read('assets/craft.js');
  assert.match(js,/new ResizeObserver\(setTocHeight\)\.observe\(toc\)/);
  assert.match(js,/document.fonts.ready.then\(setTocHeight\)/);
  assert.match(js,/service-step:not\(\.process-timeline \.service-step\)/);
});

// Mutation tests use isolated strings: no working-tree or production modification.
test('mutation: dropping power isolation is caught',()=>{
  const html=read('aircon.html').replace(originals.aircon[1].body,'省略斷電直接施工');
  assert.throws(()=>checkProcess('aircon',html));
});
test('mutation: dropping an entire step is caught',()=>{
  const html=read('water-tank.html').replace(/<li><article class="service-step">[\s\S]*?<\/article><\/li>/,'');
  assert.throws(()=>checkProcess('water-tank',html));
});
test('mutation: reintroducing nowrap title is caught',()=>assert.throws(()=>checkLayout(css.replace('.headline-line{white-space:normal!important','.headline-line{white-space:nowrap!important'))));
test('mutation: unequal case media ratio is caught',()=>assert.throws(()=>checkLayout(css.replace('.craft-compare{aspect-ratio:4/3}', '.craft-compare{aspect-ratio:1}'))));
test('mutation: mobile header rows cannot return as vertical text',()=>assert.throws(()=>checkLayout(css.replace('.price-table tr:has(> th){display:none!important}', ''))));

const serviceCases = ['aircon','washer','homeclean','water-tank','pipe-cleaning','leak-repair'];
function checkCaseMarkup(html, count) {
  assert.match(html,/class="[^"]*case-gallery-container/);
  const gallery=html.split('data-case-gallery')[1]?.split('</section>')[0];
  assert.ok(gallery,'explicit case gallery scope');
  assert.equal((gallery.match(/<article class="craft-case">/g)||[]).length,count);
  assert.equal((gallery.match(/<h3 class="craft-case-title">/g)||[]).length,count);
  assert.equal((gallery.match(/<span>現場實拍<\/span><span>已去識別<\/span>/g)||[]).length,count);
  assert.doesNotMatch(gallery,/style="[^"]*aspect-ratio/,'inline ratio must not defeat common media frame');
  for(const match of gallery.matchAll(/(?:src|srcset)="(\/[^" ]+)"/g))assert.ok(existsSync(resolve(root,match[1].slice(1))),match[1]);
}
test('six service galleries retain 17 real cases with semantic headings',()=>{
  serviceCases.forEach(page=>checkCaseMarkup(read(page+'.html'),page==='water-tank'?2:3));
});

// Check winning declarations, not just rule existence. This does NOT implement
// grid layout or prove image/text alignment; the browser matrix covers those.
function checkGalleryStyles(extraCss=css) {
  const rules=parseCss(read('assets/craft.css')+'\n'+read('assets/uiux-polish.css')+'\n'+extraCss);
  const element=(classes,ancestors=[],attrs={})=>({tag:'div',classes,attrs,ancestors,states:[]});
  for(const width of [320,375,768,860,1024,1440]) {
    for(const name of ['craft-compare','real-case-media']) {
      const media=element([name],['craft-case']);
      assert.equal(resolveCss(rules,media,'aspect-ratio',width).value,'4/3');
      assert.equal(resolveCss(rules,{...element([],['craft-case',name]),tag:'img'},'object-fit',width).value,'contain');
    }
    const grid=element(['real-case-grid'],[],{'data-case-gallery':''});
    assert.equal(resolveCss(rules,element(['container','case-gallery-container'],['section']),'padding-inline',width).value,'24px');
    assert.equal(resolveCss(rules,element(['craft-case','craft-reveal']),'opacity',width).value,'1');
    assert.equal(resolveCss(rules,grid,'grid-auto-flow',width).value,'row');
    assert.equal(resolveCss(rules,grid,'grid-template-columns',width).value,'repeat(auto-fit,minmax(min(100%,max(300px,16rem)),1fr))');
  }
}
test('winning gallery declarations keep equal media frames and readable adaptive columns',()=>checkGalleryStyles());

function checkCities(html) {
  const area=html.split('id="service-area"')[1].split('</section>')[0];
  const groups=[...area.matchAll(/<ul class="area-cities"[^>]*>(.*?)<\/ul>/g)].map(m=>[...m[1].matchAll(/<li>(.*?)<\/li>/g)].map(m=>m[1]));
  assert.deepEqual(groups,[['台北市','新北市','基隆市','桃園市','新竹市','新竹縣','宜蘭縣'],['苗栗縣','台中市','彰化縣','南投縣','雲林縣'],['嘉義市','嘉義縣','台南市','高雄市','屏東縣'],['花蓮縣','台東縣']]);
  assert.equal((area.match(/<h3 class="area-region"><svg /g)||[]).length,4);
  assert.match(area,/大台北 48H/);assert.match(area,/其他 72H/);
  assert.equal((area.match(/72H 內安排/g)||[]).length,2);
  assert.match(area,/離島地區（澎湖、金門、馬祖）目前暫不提供服務/);
}
test('coverage keeps all 19 city names, exclusions and scheduling statements',()=>checkCities(read('leak-repair.html')));
test('mutation: a competing important media ratio is rejected',()=>assert.throws(()=>checkGalleryStyles(css+'\nbody[data-editorial-page] [data-case-gallery] .craft-compare{aspect-ratio:3/4!important}')));
test('mutation: a narrow fixed three-column grid is rejected',()=>assert.throws(()=>checkGalleryStyles(css+'\nbody[data-editorial-page] [data-case-gallery]{grid-template-columns:repeat(3,1fr)!important}')));
test('mutation: an inline case ratio is rejected',()=>assert.throws(()=>checkCaseMarkup(read('washer.html').replace('style="--compare:50%"','style="--compare:50%;aspect-ratio:3/4"'),3)));
test('mutation: a lost city is rejected',()=>assert.throws(()=>checkCities(read('leak-repair.html').replace('<li>新竹縣</li>',''))));

function checkPriceLabels(source=css) {
  // The shared resolver excludes pseudo-elements. Resolve ONLY ::before rules
  // against their originating cell; removing the common suffix preserves their
  // relative specificity. This is a declaration check, not a layout engine.
  const all=parseCss(read('assets/craft.css')+'\n'+read('assets/uiux-polish.css')+'\n'+source);
  for(const id of ['homeclean-pricing','pipe-pricing']) {
    const rules=all.filter(r=>r.selector.endsWith('::before') &&
      (!/#(?:homeclean|pipe)-pricing/.test(r.selector)||r.selector.includes('#'+id)))
      // Probe a non-first data cell: the first column intentionally has no label.
      .map(r=>({...r,selector:r.selector.replace(/::before$/,'').replace(/:not\(:first-child\)/g,'')}))
      .filter(r=>!r.selector.includes('td:first-child'));
    const cell={tag:'td',classes:[],attrs:{'data-label':'參考價格'},states:[],ancestors:['#'+id,'price-table','service-page']};
    for(const width of [320,375,768,960]) {
      assert.equal(resolveCss(rules,cell,'content',width).value,'attr(data-label)',`${id} at ${width}px keeps the label`);
      assert.notEqual(resolveCss(rules,cell,'display',width).value,'none',`${id} label stays visible`);
    }
  }
}
test('mobile homeclean and pipe prices retain their field labels',()=>checkPriceLabels());
test('mutation: removing generated price labels is rejected',()=>{
  assert.throws(()=>checkPriceLabels(css.replace('content:attr(data-label)','content:none')));
});
test('mutation: a later important rule cannot hide price labels',()=>{
  for(const id of ['homeclean-pricing','pipe-pricing'])assert.throws(()=>checkPriceLabels(css+`\n@media(max-width:960px){#${id} .price-table td::before{display:none!important}}`));
});
function checkShortCopy(source) {
  const rules=parseCss(read('assets/craft.css')+'\n'+source+'\n'+css);
  for(const [mode,classes] of [['balance',['svc-title','process-title','cc-title','promise-title']],['pretty',['cta-sub','service-visual-note','process-disclosure']]]) {
    for(const name of classes)for(const width of [375,768,1440]) {
      assert.equal(resolveCss(rules,{tag:'div',classes:[name],attrs:{},states:[],ancestors:[]},'text-wrap',width).value,mode);
    }
  }
}
test('short headings and explanatory copy keep targeted wrap rules',()=>checkShortCopy(read('assets/uiux-polish.css')));
test('mutation: reverting short-copy wrapping is rejected',()=>{
  assert.throws(()=>checkShortCopy(read('assets/uiux-polish.css').replace('.cc-title,.promise-title{text-wrap:balance}', '.cc-title,.promise-title{text-wrap:wrap}')));
});

const chapterOrder={
  aircon:['aircon-services','knowledge','impact','flow','aircon-cases','aircon-pricing'],
  washer:['washer-services','washer-differences','flow','washer-cases','washer-pricing'],
  homeclean:['homeclean-services','homeclean-difference','flow','homeclean-cases','homeclean-estimate','homeclean-areas'],
  'water-tank':['water-tank-content','water-tank-difference','flow','water-tank-cases','water-tank-pricing'],
  'pipe-cleaning':['pipe-content','pipe-difference','flow','pipe-cases','pipe-pricing'],
  'leak-repair':['pain','knowledge','promises','myths','instruments','leak-flow','cases-carousel','pricing','team-carousel','service-area']
};
function checkChapters(page,html){
  const actual=[...html.matchAll(/<section[^>]*data-reading-chapter="([^"]+)"/g)].map(m=>m[1]);
  assert.deepEqual(actual.slice(0,chapterOrder[page].length),chapterOrder[page]);
  const toc=html.match(/<nav class="service-toc"[\s\S]*?<\/nav>/)?.[0];
  assert.ok(toc);
  const hashes=[...toc.matchAll(/href="#([^"]+)"/g)].map(m=>m[1]);
  assert.match(hashes[0],/pricing/,'direct price access remains the first shortcut');
  for(const hash of hashes)assert.ok(html.includes('id="'+hash+'"'),hash+' exists');
  assert.ok(hashes.some(hash=>/flow/.test(hash)),'process is directly accessible');
  assert.doesNotMatch(html,/<section[^>]*data-reading-chapter[^>]*\bhidden\b/);
}
test('six services: explanation → flow → real cases → price, with direct price shortcuts',()=>serviceCases.forEach(page=>checkChapters(page,read(page+'.html'))));
test('mutation: moving prices ahead of the narrative is rejected',()=>{
  const html=read('washer.html').replace('data-reading-chapter="washer-services"','data-reading-chapter="washer-pricing"');
  assert.throws(()=>checkChapters('washer',html));
});
test('mutation: orphaned TOC anchor is rejected',()=>assert.throws(()=>checkChapters('homeclean',read('homeclean.html').replace('id="homeclean-pricing"','id="lost-pricing"'))));
function checkReadingSurface(source){
  assert.match(source,/body\[data-editorial-page\]\{overflow-x:clip;overflow-y:visible\}/,'no non-scrolling body ancestor; modal inline lock can still win');
  assert.match(source,/--reading-space:clamp\(36px,4vw,60px\)/);
  assert.match(source,/div\.item-card:nth-child\(even\)\{background:var\(--reading-tone\)!important\}/);
  assert.match(source,/\.service-toc\[data-local-count\] a\{[^}]*min-height:44px[^}]*border-radius:0!important/);
}
test('theme shades, tighter chapter spacing and usable secondary navigation',()=>checkReadingSurface(css));
test('mutation: sticky-killing body overflow is rejected',()=>assert.throws(()=>checkReadingSurface(css.replace('overflow-x:clip;overflow-y:visible','overflow-x:hidden;overflow-y:visible'))));
test('mutation: oversized chapter gaps or lost tone boundaries are rejected',()=>{
  assert.throws(()=>checkReadingSurface(css.replace('--reading-space:clamp(36px,4vw,60px)','--reading-space:120px')));
  assert.throws(()=>checkReadingSurface(css.replace('div.item-card:nth-child(even){background:var(--reading-tone)!important}','')));
});
