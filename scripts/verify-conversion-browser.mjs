import assert from "node:assert/strict";
import { createServer } from "node:http";
import { readFileSync, existsSync, statSync, mkdirSync } from "node:fs";
import { createRequire } from "node:module";
import { resolve, extname, sep } from "node:path";
import { pathToFileURL, fileURLToPath } from "node:url";
const modulePath = process.env.PLAYWRIGHT_MODULE;
if (!modulePath)
  throw new Error("Set PLAYWRIGHT_MODULE to pinned playwright/index.mjs");
const { chromium } = await import(pathToFileURL(modulePath));
const require = createRequire(import.meta.url);
const { services } = require("../assets/home-service-hub.js");
const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const types = {
  ".html": "text/html",
  ".js": "text/javascript",
  ".css": "text/css",
  ".svg": "image/svg+xml",
  ".webp": "image/webp",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".json": "application/json",
};
const server = createServer((req, res) => {
  try {
    const pathname = decodeURIComponent(
      new URL(req.url, "http://localhost").pathname,
    );
    const target = resolve(
      root,
      "." + (pathname === "/" ? "/index.html" : pathname),
    );
    if (
      !target.startsWith(root + sep) ||
      !existsSync(target) ||
      !statSync(target).isFile()
    ) {
      res.writeHead(404);
      res.end();
      return;
    }
    res.writeHead(200, {
      "Content-Type": types[extname(target)] || "application/octet-stream",
    });
    res.end(readFileSync(target));
  } catch {
    res.writeHead(400);
    res.end();
  }
});
await new Promise((r) => server.listen(4173, "127.0.0.1", r));
const browser = await chromium.launch();
const evidence = process.env.EVIDENCE_DIR || "/tmp/leakdoctor-site-browser";
mkdirSync(evidence, { recursive: true });
try {
  for (const width of [320, 375, 768, 1440]) {
    const context = await browser.newContext({
      viewport: { width, height: 950 },
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (e) => errors.push(e.message));
    const requests = [];
    let loseFirst = true,
      forceFailure = false;
    // Deterministic pending API fixture: visual state must follow the real promise.
    let holdSave = false, releaseSave, saveSeen, saveGate;
    function holdNextSave(){
      holdSave = true;
      saveGate = new Promise(resolve => { releaseSave = resolve; });
      return new Promise(resolve => { saveSeen = resolve; });
    }
    function waitForSave(seen){
      return Promise.race([seen,new Promise((_,reject)=>setTimeout(()=>reject(new Error('save fixture not reached')),5000))]);
    }
    const ids = new Map();
    await page.route("https://**/*", async (route) => {
      const req = route.request();
      if (req.url().includes("/api/service-availability")) {
        await route.fulfill({
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "http://127.0.0.1:4173" },
          body: JSON.stringify({ serviceIds: services.map((s) => s.id) }),
        });
        return;
      }
      if (req.url().includes("/api/leads")) {
        if (req.method() === "OPTIONS") {
          await route.fulfill({
            status: 204,
            headers: {
              "Access-Control-Allow-Origin": "http://127.0.0.1:4173",
              "Access-Control-Allow-Headers": "Content-Type",
              "Access-Control-Allow-Methods": "POST, OPTIONS",
            },
          });
          return;
        }
        const body = JSON.parse(req.postData());
        requests.push(body);
        assert.match(body.requestId, /^[a-f0-9-]{36}$/);
        let id = ids.get(body.requestId);
        if (!id) {
          id = "HTL-L-R-" + body.requestId.replaceAll("-", "").toUpperCase();
          ids.set(body.requestId, id);
        }
        if(holdSave){holdSave=false;saveSeen();await saveGate;}
        if (loseFirst) {
          loseFirst = false;
          await route.abort();
          return;
        }
        await route.fulfill({
          status: forceFailure ? 503 : 200,
          contentType: "application/json",
          headers: { "Access-Control-Allow-Origin": "http://127.0.0.1:4173" },
          body: JSON.stringify(
            forceFailure
              ? { error: "capture_unavailable" }
              : { ok: true, leadId: id },
          ),
        });
        return;
      }
      await route.abort();
    });
    await page.goto("http://127.0.0.1:4173");
    await page
      .locator('#ld-q-form[data-journey="1"]')
      .waitFor({ state: "attached" });
    assert.equal(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
      true,
      "homepage overflow " + width,
    );
    await page.screenshot({ path: `${evidence}/home-${width}.png` });
    await page.evaluate(() => window.ldOpenQuote());
    await page.locator("#ld-quote-overlay.ld-show").waitFor();
    await page.getByRole("button", { name: "繼續 →" }).click();
    assert.equal(await page.locator("#ld-f-service.ld-invalid").count(), 1);
    const choices = page.locator('.ld-service-choice');
    assert.equal(await choices.count(),7,'six services plus the existing other option');
    const boxes = await choices.evaluateAll(nodes=>nodes.slice(0,2).map(el=>{
      const r=el.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};
    }));
    assert.ok(boxes[1].x>boxes[0].x+20 && Math.abs(boxes[0].y-boxes[1].y)<2,'P02 two service columns '+width);
    for(const service of ['冷氣清洗','洗衣機清洗','居家清潔','水塔清洗','水管清洗','漏水檢測與修補']){
      const button = page.locator('.ld-service-choice').filter({has:page.locator('span.ld-service-choice-label').filter({hasText:service})});
      await button.focus();await page.keyboard.press('Enter');
      assert.equal(await page.locator('#ld-q-service').inputValue(),service);
      assert.equal(await page.locator('.ld-service-choice[aria-pressed="true"]').count(),1);
      assert.equal(await page.locator('#ld-q-selected-service').innerText(),'目前選擇：'+service);
      assert.ok(await button.evaluate(el=>parseFloat(getComputedStyle(el).outlineWidth)>=3),'P02 keyboard focus');
      assert.ok(await button.evaluate(el=>{
        const rgb = value=>value.match(/[\d.]+/g).slice(0,3).map(Number).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});
        const lum = values=>values.reduce((n,v,i)=>n+v*[.2126,.7152,.0722][i],0);
        const fg=lum(rgb(getComputedStyle(el.querySelector('.ld-service-choice-label')).color));
        const bg=lum(rgb(getComputedStyle(el).backgroundColor));
        return (Math.max(fg,bg)+.05)/(Math.min(fg,bg)+.05)>=4.5;
      }),'P02 selected service text contrast');
    }
    await page.screenshot({path:`${evidence}/p02-service-choices-${width}.png`});
    await page.locator('.ld-service-choice[data-service="冷氣清洗"]').click();
    await page.getByRole("button", { name: "繼續 →" }).click();
    await page.locator("#ld-q-addr").fill("新北市三重區測試路1號");
    await page.getByRole("button", { name: "繼續 →" }).click();
    await page.locator("#ld-q-name").fill("測試勿派工");
    await page.locator("#ld-q-phone").fill("0912345678");
    const pendingSave = holdNextSave();
    await page.locator(".ld-q-submit").click();
    await waitForSave(pendingSave);
    assert.equal(await page.locator('#ld-q-form').getAttribute('aria-busy'),'true');
    assert.equal(await page.locator('#ld-q-status').getAttribute('data-state'),'saving');
    assert.equal(await page.locator('#ld-q-receipt').count(),0,'no premature success');
    assert.equal(await page.locator('.ld-q-submit').isDisabled(),true);
    assert.equal(await page.locator('.ld-q-submit').evaluate(el=>getComputedStyle(el,'::before').animationName),'none','P02 reduced motion');
    await page.screenshot({path:`${evidence}/p02-saving-${width}.png`});
    releaseSave();
    await page.locator("#ld-q-receipt a").waitFor();
    assert.equal(await page.locator('#ld-q-status').getAttribute('data-state'),'saved');
    assert.equal(await page.locator('#ld-q-form').getAttribute('aria-busy'),'false');
    assert.equal(requests.length, 2);
    assert.equal(
      requests[0].requestId,
      requests[1].requestId,
      "lost response retry must preserve key",
    );
    assert.match(
      await page.locator("#ld-q-status").innerText(),
      /尚未完成預約/,
    );
    await page.screenshot({ path: `${evidence}/receipt-${width}.png` });
    assert.ok(
      !(await page.locator("#ld-q-receipt a").getAttribute("href")).includes(
        "?",
      ),
      "private LINE query must not be stored in href",
    );
    const storage = await page.evaluate(() =>
      sessionStorage.getItem("ld_inquiry_keys"),
    );
    assert.ok(
      !storage.includes("0912345678") && !storage.includes("測試勿派工"),
    );
    await page.locator("#ld-q-phone").fill("0912345679");
    forceFailure = true;
    await page.locator(".ld-q-submit").click();
    try {
      await page
        .locator("#ld-q-status")
        .filter({ hasText: "無法確認儲存結果" })
        .waitFor({ timeout: 12000 });
    } catch (e) {
      console.log(
        JSON.stringify({
          width,
          requests: requests.length,
          status: await page.locator("#ld-q-status").innerText(),
          submitting: await page
            .locator("#ld-q-form")
            .getAttribute("data-submitting"),
          button: await page.locator(".ld-q-submit").innerText(),
          phone: await page.locator("#ld-q-phone").inputValue(),
        }),
      );
      await page.screenshot({ path: evidence + "/failure.png" });
      throw e;
    }
    assert.equal(await page.locator("#ld-q-phone").inputValue(), "0912345679");
    assert.equal(await page.locator("#ld-q-receipt").count(), 0);
    assert.equal(await page.locator('#ld-q-status').getAttribute('data-state'),'error');
    assert.equal(await page.locator('#ld-q-form').getAttribute('aria-busy'),'false');
    assert.equal(await page.locator('.ld-q-submit').isDisabled(),false);
    await page.screenshot({path:`${evidence}/p02-failure-${width}.png`});
    const events = await page.evaluate(() =>
      Array.from(window.dataLayer || [])
        .filter((x) => x[0] === "event")
        .map((x) => Array.from(x)),
    );
    assert.equal(events.filter((e) => e[1] === "generate_lead").length, 1);
    assert.equal(
      events.filter((e) =>
        /091234567|測試勿派工|測試路/.test(JSON.stringify(e)),
      ).length,
      0,
    );
    // Simulate automatic outbound measurement reading href, and prove actual handoff still has details.
    let navigatedLine = "";
    const observedHrefs = [];
    await page.exposeFunction("observeLineHref", (href) =>
      observedHrefs.push(href),
    );
    await page.evaluate(() =>
      document.addEventListener(
        "click",
        (event) => {
          const link = event.target.closest("a");
          if (link && link.href.startsWith("https://line.me/"))
            window.observeLineHref(link.href);
        },
        true,
      ),
    );
    await page.route("https://line.me/**", async (route) => {
      navigatedLine = route.request().url();
      await route.fulfill({
        contentType: "text/html",
        body: "<p>Local LINE handoff fixture</p>",
      });
    });
    forceFailure = false;
    await page.locator(".ld-q-submit").click();
    await page.locator("#ld-q-receipt a").waitFor();
    await page.locator("#ld-q-receipt a").click();
    await page.getByText("Local LINE handoff fixture").waitFor();
    assert.match(decodeURIComponent(navigatedLine), /測試勿派工/);
    assert.match(decodeURIComponent(navigatedLine), /0912345679/);
    assert.ok(observedHrefs.length > 0);
    assert.ok(
      observedHrefs.every(
        (href) => !href.includes("?") && !href.includes("0912345679"),
      ),
    );
    for (const service of [
      "aircon",
      "washer",
      "homeclean",
      "water-tank",
      "pipe-cleaning",
      "leak-repair",
    ]) {
      await page.goto("http://127.0.0.1:4173/" + service + ".html");
      await page.locator(".ld-service-start").waitFor();
      await page.locator(".ld-service-start button").click();
      await page.locator("#ld-quote-overlay.ld-show").waitFor();
      assert.ok(
        await page.locator("#ld-q-service").inputValue(),
        "service preset " + service,
      );
      assert.equal(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
        true,
        "service overflow " + service + " " + width,
      );
      await page.evaluate(() => window.ldCloseQuote());
    }
    await page.goto('http://127.0.0.1:4173/#price-overview');
    await page.locator('#price-overview').waitFor();
    await page.locator('[data-quantity-action="add"][data-service-id="wall_mounted_split"]').click();
    await page.locator('#home-order-name').fill('試算測試勿派工');
    await page.locator('#home-order-phone').fill('0912111222');
    await page.locator('#home-order-address').fill('新北市三重區測試路1號');
    assert.equal(await page.locator('[data-price-cat="aircon"]').getAttribute('data-selected'),'true');
    forceFailure = true;
    await page.locator('#home-order-line').click();
    await page.locator('#home-order-status[data-state="error"]').waitFor();
    assert.equal(await page.locator('#home-order-receipt').count(),0);
    assert.equal(await page.locator('#home-order-name').inputValue(),'試算測試勿派工');
    const failedRequestId = requests.at(-1).requestId;
    await page.locator('[data-cat-toggle="aircon"]').first().click();
    assert.equal(await page.locator('[data-price-cat="aircon"]').getAttribute('data-selected'),'true');
    assert.equal(await page.locator('#home-order-status').getAttribute('data-state'),'error','unchanged inquiry keeps warning');
    forceFailure = false;
    const homePending = holdNextSave();
    await page.locator('#home-order-line').click();
    await waitForSave(homePending);
    assert.equal(await page.locator('#home-order-line').getAttribute('aria-busy'),'true');
    assert.equal(await page.locator('#home-order-status').getAttribute('data-state'),'saving');
    assert.equal(await page.locator('#home-order-form').getAttribute('aria-busy'),'true');
    await page.screenshot({path:`${evidence}/p02-price-saving-${width}.png`});
    releaseSave();
    await page.locator('#home-order-receipt a').waitFor();
    assert.equal(requests.at(-1).requestId,failedRequestId,'P02 retry keeps request identity');
    assert.equal(await page.locator('#home-order-status').getAttribute('data-state'),'saved');
    assert.equal(await page.locator('#home-order-line').getAttribute('aria-busy'),'false');
    await page.screenshot({path:`${evidence}/p02-price-saved-${width}.png`});
    assert.ok(!(await page.locator('#home-order-receipt a').getAttribute('href')).includes('?'));
    assert.equal(await page.locator('#home-order-line').isDisabled(),true);
    await page.evaluate(()=>document.addEventListener('click',event=>{const link=event.target.closest('a');if(link&&link.href.startsWith('https://line.me/'))window.observeLineHref(link.href);},true));
    await page.locator('#home-order-receipt a').click();await page.getByText('Local LINE handoff fixture').waitFor();
    assert.match(decodeURIComponent(navigatedLine),/試算測試勿派工/);assert.match(decodeURIComponent(navigatedLine),/0912111222/);
    assert.ok(observedHrefs.every(href=>!href.includes('?')));
    // New homepage paths use the original mode state. They must preserve quantities,
    // work with history/deep links and leave the existing modal focus cycle intact.
    await page.goto('http://127.0.0.1:4173/');
    await page.locator('#visitor-start').waitFor();
    assert.equal(await page.locator('#visitor-start a').count(),4);
    assert.equal(await page.locator('#services .svc-card').count(),6);
    const order=await page.evaluate(()=>['visitor-start','service-hub','home-real-cases'].map(id=>document.getElementById(id).offsetTop));
    assert.ok(order[0]<order[1]&&order[1]<order[2],'task and service choices precede repeated evidence');
    for(const card of await page.locator('#services .svc-card').all()){
      await card.scrollIntoViewIfNeeded();
      await card.locator('img').evaluate(image=>image.complete ? Promise.resolve() : new Promise(resolve=>image.addEventListener('load',resolve,{once:true})));
      assert(await card.locator('img').evaluate(image=>image.naturalWidth>0),'real service image loaded');
      assert(await card.locator('.svc-price').isVisible(),'service price visible');
      assert.equal(await card.locator('img').evaluate(image=>getComputedStyle(image).objectFit),'contain');
    }
    const cards=await page.locator('#services .svc-card').evaluateAll(nodes=>nodes.slice(0,2).map(n=>({x:n.getBoundingClientRect().x,y:n.getBoundingClientRect().y})));
    assert.equal(Math.abs(cards[0].y-cards[1].y)<2,width>1050,'responsive service columns');
    await page.locator('#home-tab-price').click();
    await page.locator('[data-quantity-action="add"][data-service-id="wall_mounted_split"]').click();
    await page.getByRole('link',{name:'服務地區確認',exact:true}).click();
    await page.locator('#areas-strip').waitFor({state:'visible'});
    await page.waitForFunction(()=>document.activeElement.id==='areas-strip');
    const clear=await page.locator('#areas-strip').evaluate(e=>e.getBoundingClientRect().top>=document.getElementById('ld-header').getBoundingClientRect().bottom+document.getElementById('home-route-nav').getBoundingClientRect().height-1);
    assert(clear,'coverage clears fixed header and mode navigation');
    assert.match(await page.locator('#areas-strip').innerText(),/桃園與宜蘭/);
    assert.match(await page.locator('#areas-strip').innerText(),/其他地區不當作保證服務區/);
    await page.goBack();await page.locator('#price-overview').waitFor({state:'visible'});
    assert.equal(await page.locator('[data-quantity-value="wall_mounted_split"]').inputValue(),'1','history preserves chosen quantity');
    await page.goForward();await page.locator('#areas-strip').waitFor({state:'visible'});
    await page.getByRole('link',{name:'詢問前準備',exact:true}).click();
    const preparation=page.locator('#visitor-preparation details');
    assert.equal(await preparation.count(),6);
    await preparation.first().locator('summary').click();
    assert.match(await preparation.first().innerText(),/窗型一次 3 台以上/);
    await page.getByRole('link',{name:'改期與售後聯絡',exact:true}).click();
    assert.match(await page.locator('#visitor-followup').innerText(),/不必重新試算或另建一份需求/);
    assert.equal(await page.locator('#visitor-followup a[href="https://lin.ee/WVxmY65"]').count(),2);
    // Reopening and closing the existing modal on a new hash must restore its trigger.
    const quote=page.locator(width>=1024?'#ld-float-quote':'.ld-sticky-btn--form');
    await quote.click();await page.locator('#ld-quote-overlay.ld-show').waitFor();
    await page.keyboard.press('Escape');
    await page.locator('#ld-quote-overlay.ld-show').waitFor({state:'hidden'});
    await page.waitForFunction(selector=>document.activeElement.matches(selector),width>=1024?'#ld-float-quote':'.ld-sticky-btn--form');
    await page.goto('http://127.0.0.1:4173/#visitor-preparation');
    await page.locator('#visitor-preparation').waitFor({state:'visible'});
    await page.waitForFunction(()=>document.activeElement.id==='visitor-preparation');
    assert.equal(await page.locator('body').evaluate(()=>document.documentElement.scrollWidth<=innerWidth),true,'new visitor paths do not overflow');
    await page.screenshot({path:`${evidence}/visitor-preparation-${width}.png`});
    await page.goto('http://127.0.0.1:4173/#knowledge-overview');
    await page.locator('#services').scrollIntoViewIfNeeded();
    await page.screenshot({path:`${evidence}/visitor-services-${width}.png`});
    await page.goto('http://127.0.0.1:4173/areas.html');
    assert.match(await page.locator('.local-box').first().innerText(),/桃園與宜蘭/);
    assert.equal(await page.locator('meta[name="robots"]').getAttribute('content'),'noindex,follow');
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(
    "PASS: 320/375/768/1440, six service journeys, P02 two-column selection, keyboard/current service, real pending/failure/retry/saved states, reduced motion, unchanged pricing and analytics/storage privacy.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
