// Visual acceptance for the homepage and six service routes. All remote traffic is mocked.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFileSync, existsSync, statSync, mkdirSync, writeFileSync} from 'node:fs';
import {resolve, extname, sep} from 'node:path';
import {fileURLToPath, pathToFileURL} from 'node:url';
import {createRequire} from 'node:module';
const repo=resolve(fileURLToPath(new URL('../',import.meta.url)));
const root=process.env.SITE_ROOT?resolve(process.env.SITE_ROOT):repo;
const output=process.env.EVIDENCE_DIR||'/tmp/graywolf-editorial-evidence';
const {services}=createRequire(import.meta.url)('../assets/home-service-hub.js');
const {chromium}=await import(pathToFileURL(process.env.PLAYWRIGHT_MODULE));
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.jpg':'image/jpeg','.png':'image/png','.webp':'image/webp','.json':'application/json'};
const server=createServer((req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname;
 const file=resolve(root,'.'+(path==='/'?'/index.html':decodeURIComponent(path)));
 if(!file.startsWith(root+sep)||!existsSync(file)||!statSync(file).isFile()){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':types[extname(file)]||'application/octet-stream'});res.end(readFileSync(file));
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
const base=`http://127.0.0.1:${server.address().port}`;
mkdirSync(output,{recursive:true});
const browser=await chromium.launch();
const results=[];
async function isolate(context){
 await context.route('**/*',route=>{
  const url=route.request().url();
  if(url.startsWith(base))return route.continue();
  if(url.includes('/api/service-availability'))return route.fulfill({contentType:'application/json',body:JSON.stringify({serviceIds:services.map(s=>s.id)})});
  return route.fulfill({contentType:'application/json',body:'{}'});
 });
}
try{
 for(const width of [320,375,768,1440]){
  const context=await browser.newContext({viewport:{width,height:950},reducedMotion:'reduce'});await isolate(context);
  for(const name of ['index','aircon','washer','homeclean','water-tank','pipe-cleaning','leak-repair']){
   const page=await context.newPage();const errors=[];const missing=[];
   page.on('pageerror',e=>errors.push(e.message));page.on('response',r=>{if(r.url().startsWith(base)&&r.status()>=400)missing.push(r.url())});
   await page.goto(`${base}/${name==='index'?'':name+'.html'}`);await page.locator('.ld-tab:not([hidden])').first().waitFor();await page.waitForTimeout(200);
   assert.equal(await page.locator('.ld-tab:not([hidden])').count(),6);
   if(name!=='index'){
    const visual=await page.locator('.service-visual').first().evaluate(el=>{const media=el.querySelector('.service-visual-img,.process-photo');const note=el.querySelector('.service-visual-note');return {media:media.getBoundingClientRect().toJSON(),note:note.getBoundingClientRect().toJSON(),display:getComputedStyle(note).display}});
    assert(visual.media.height>=120,`${name}/${width}: hero illustration collapsed`);
    assert(visual.display!=='none'&&visual.note.top>=visual.media.bottom-1,`${name}/${width}: illustration caption must follow its image`);
   }
   await page.screenshot({path:resolve(output,`${name}-${width}-top.png`)});
   for(let i=0;i<12;i++)await page.evaluate(()=>scrollBy(0,innerHeight));
   await page.locator('footer').scrollIntoViewIfNeeded();
   await page.evaluate(async()=>{await Promise.all([...document.images].map(async img=>{img.loading='eager';try{await img.decode()}catch{}}))});
   assert.deepEqual(await page.locator('img').evaluateAll(imgs=>imgs.filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src)),[],`${name}/${width}: images`);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}/${width}: horizontal overflow`);
   if(name==='index'){
    const prices=page.locator('.svc-price');assert.equal(await prices.count(),6);
    for(const price of await prices.all())assert(await price.isVisible(),'Service price must be readable without opening the calculator');
    const grid=await page.locator('.svc-grid').evaluate(el=>getComputedStyle(el).gridTemplateColumns.split(' ').length);
    assert.equal(grid,width<=600?1:2);
    assert.equal(await page.locator('.hero-real-pair img').first().evaluate(el=>getComputedStyle(el).objectFit),'contain');
    await page.locator('#services').evaluate(el=>el.scrollIntoView({block:'start'}));await page.screenshot({path:resolve(output,`services-${width}.png`)});
    await page.locator('#home-booking-questions summary').first().click();assert(await page.locator('#home-booking-questions details').first().getAttribute('open')!==null);
    // Repeated mode changes must preserve quantities and never submit a lead.
    await page.locator('#home-tab-price').click();await page.locator('.qty-btn').first().waitFor();
    const quantity=page.locator('.qty-value').first();await quantity.fill('2');await quantity.dispatchEvent('change');
    await page.locator('#home-tab-knowledge').click();await page.locator('#home-tab-price').click();assert.equal(await quantity.inputValue(),'2');
    await page.locator('#home-tab-knowledge').click();
   }
   // Enlarged Chinese text must remain readable without page-wide horizontal scrolling.
   await page.addStyleTag({content:'html{font-size:24px!important}'});
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),`${name}/${width}: enlarged text overflow`);
   assert.deepEqual(errors,[]);assert.deepEqual(missing,[]);
   results.push({page:name,width,images:'pass',overflow:'pass',enlargedText:'pass',errors:0});await page.close();
  }
  await context.close();
 }
 const nojs=await browser.newContext({javaScriptEnabled:false,viewport:{width:375,height:950}});await isolate(nojs);
 const page=await nojs.newPage();await page.goto(base);assert.equal(await page.locator('.svc-price:visible').count(),6);assert(await page.locator('noscript a[href="https://lin.ee/WVxmY65"]').isVisible());
 await page.locator('#home-booking-questions summary').first().click();assert(await page.locator('#home-booking-questions details[open]').count());await nojs.close();
 writeFileSync(resolve(output,'results.json'),JSON.stringify({browser:browser.version(),remoteTraffic:'mocked; no production analytics, leads or LINE messages',noJavaScript:'prices, LINE fallback, FAQ passed',results},null,2));
 console.log(`Passed ${results.length} route/viewport checks, enlarged text, homepage prices, calculator state, native FAQ and no-JS fallback.`);
} finally {await browser.close();await new Promise(done=>server.close(done));}
