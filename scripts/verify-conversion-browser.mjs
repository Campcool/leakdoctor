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
    await page.locator('.ld-service-choice[data-service="冷氣清洗"]').click();
    await page.getByRole("button", { name: "繼續 →" }).click();
    await page.locator("#ld-q-addr").fill("新北市三重區測試路1號");
    await page.getByRole("button", { name: "繼續 →" }).click();
    await page.locator("#ld-q-name").fill("測試勿派工");
    await page.locator("#ld-q-phone").fill("0912345678");
    await page.locator(".ld-q-submit").click();
    await page.locator("#ld-q-receipt a").waitFor();
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
    await page.locator('#home-order-line').click();await page.locator('#home-order-receipt a').waitFor();
    assert.ok(!(await page.locator('#home-order-receipt a').getAttribute('href')).includes('?'));
    assert.equal(await page.locator('#home-order-line').isDisabled(),true);
    await page.evaluate(()=>document.addEventListener('click',event=>{const link=event.target.closest('a');if(link&&link.href.startsWith('https://line.me/'))window.observeLineHref(link.href);},true));
    await page.locator('#home-order-receipt a').click();await page.getByText('Local LINE handoff fixture').waitFor();
    assert.match(decodeURIComponent(navigatedLine),/試算測試勿派工/);assert.match(decodeURIComponent(navigatedLine),/0912111222/);
    assert.ok(observedHrefs.every(href=>!href.includes('?')));
    assert.deepEqual(errors, []);
    await context.close();
  }
  console.log(
    "PASS: 320/375/768/1440, six service journeys, lost response identity, retained errors, receipt semantics and analytics/storage privacy.",
  );
} finally {
  await browser.close();
  await new Promise((r) => server.close(r));
}
