# Codex Review - 2026-07-10 08:50 Asia/Taipei

本文件是 Codex 對目前 GitHub 最新版本的補充評估。原則：不覆蓋 Claude 原文，只補充可供後續 AI 與業主判斷的備註。

## 讀取範圍

- Repo: `Campcool/leakdoctor`
- Branch: `main`
- 讀取重點：`AI-README.md`, `CLAUDE.md`, `docs/BOT-PLAN.md`, `header.js`, `llms.txt`, 首頁、服務頁、地區頁、文章頁、logo/export assets
- 快速掃描結果：
  - HTML 檔案約 36 個。
  - 約 34 個頁面已有 JSON-LD。
  - 目前未掃到 `BreadcrumbList`。
  - 多數 `<img>` 尚未固定 `width` / `height`。
  - 只有少數頁面有 `loading=`。

## 官方資料參考

- Google Search Central - helpful content: https://developers.google.com/search/docs/fundamentals/creating-helpful-content
- Google Search Central - FAQPage structured data: https://developers.google.com/search/docs/appearance/structured-data/faqpage
- Google Search Central - AI content guidance: https://developers.google.com/search/docs/fundamentals/using-gen-ai-content
- web.dev - Core Web Vitals: https://web.dev/articles/vitals
- web.dev - INP: https://web.dev/articles/inp
- Cloudflare Workers limits: https://developers.cloudflare.com/workers/platform/limits/
- Cloudflare D1 limits: https://developers.cloudflare.com/d1/platform/limits/
- Cloudflare Queues: https://developers.cloudflare.com/queues/
- Cloudflare Workflows: https://developers.cloudflare.com/workflows/
- Cloudflare Cron Triggers: https://developers.cloudflare.com/workers/configuration/cron-triggers/
- LINE Messaging API - Receiving messages: https://developers.line.biz/en/docs/messaging-api/receiving-messages/
- LINE Messaging API - Webhook signature validation: https://developers.line.biz/en/docs/messaging-api/verify-webhook-signature/

## 網站現況判斷

目前網站方向是對的：靜態站、價格露出、LINE CTA、服務頁、地區頁、文章頁、`llms.txt`、Logo 素材、JSON-LD 都已經有雛形。對灰汰郎這種本地清潔服務，這比一開始做複雜系統更適合，因為速度快、維護低、手機打開也容易。

比較需要補強的不是「再加更多頁面」而是三件事：

1. 讓客戶更快完成預約。
2. 讓 Google 與 AI 更清楚理解服務、價格、地區、可信度。
3. 讓網頁效能與穩定度更接近可投廣告的狀態。

## 網站優化建議

### P0 - 立即處理

1. 啟用 GA4 與轉換事件
   - `header.js` 目前仍是 `G-XXXXXXXXXX`。
   - 做法：業主提供 GA4 Measurement ID 後，只替換 `GA4_ID`。
   - 建議追蹤事件：`line_click`, `quote_open`, `quote_submit`, `phone_click`, `service_click`, `area_click`。
   - 原因：未來投 Google Ads / Meta Ads 時，沒有轉換資料會很難優化。

2. 修正品牌敘述仍偏「漏水」
   - `about.html` 的 AboutPage schema description 仍是「台灣漏水工班媒合平台介紹」。
   - 做法：改成「灰汰郎清潔與居家服務媒合平台介紹」，並保留 `alternateName` 或歷史沿革說明。
   - 原因：品牌已轉向清潔服務，schema 與頁面主軸不一致會降低理解清晰度。

3. 圖片固定尺寸，降低 CLS
   - 掃描結果顯示多數 `<img>` 沒有 `width` / `height`。
   - 做法：Logo、案例圖、師傅圖都加上實際尺寸，並用 CSS 控制 responsive。
   - 原因：Google Core Web Vitals 現在重視 LCP、INP、CLS；圖片未保留空間容易造成版面跳動。

4. 確認 Google Business Profile 與 Search Console
   - 這是業主端要做，AI 無法代替。
   - 做法：建立或更名 Google 商家檔案，提交 `sitemap.xml`，驗證 `leakdoctor.tw`。
   - 原因：本地服務的 SEO 很吃商家檔案、評論、地區一致性。

### P1 - 很值得做

1. 把估價器做成全站可用元件
   - 首頁已有快速估價概念，`header.js` 也有預約 modal。
   - 做法：把服務、數量、地區、偏好時段做成固定欄位，讓每個服務頁與地區頁都能直接打開同一個估價流程。
   - 客戶體驗目標：客戶不用打字，只要點選「服務 + 地區 + 數量 + 時段」，最後帶入 LINE 預填訊息。

2. 建立「報價資料單一來源」
   - 目前價格會散在頁面表格、JSON-LD Offer、`llms.txt`、首頁卡片、估價器。
   - 做法：未來可用 `pricing.json` 或 bot repo 的 `services.json` 作為主資料，網站與 `llms.txt` 都由它產生。
   - 原因：價格一變就要同步多處，人工改很容易漏。

3. 補 `BreadcrumbList`
   - 服務頁、地區頁、文章頁目前未掃到 breadcrumb schema。
   - 做法：每頁加首頁 > 服務/地區/知識 > 目前頁面的 JSON-LD。
   - 原因：對搜尋引擎理解站內結構有幫助，也適合後續 AI 摘錄。

4. 案例與師傅頁從「漏水信任」轉為「清潔信任」
   - `cases.html` / `team.html` 可以保留專業感，但要更明確呈現清潔成果。
   - 做法：優先補冷氣、洗衣機、居家清潔的前後對照，圖片壓成 WebP，保留 JPG fallback。
   - 原因：清潔服務客戶最想看「真的有變乾淨」。

5. 表單資料不要只依賴 LINE
   - 現況適合 MVP，但若客戶點了 LINE 又沒送出，線索會消失。
   - 做法：短期可用 Cloudflare Worker 或 Google Form endpoint 記錄匿名 lead；長期由 LINE Bot 接手。
   - 資料欄位：來源頁、服務、地區、估價範圍、UTM、建立時間。

### P2 - 投廣告前補強

1. 自架或精簡字型
   - Noto Sans TC 體積較大。
   - 做法：保留 `font-display: swap`，必要時自架 subset 或改系統字體優先。
   - 原因：中文字型可能影響 FCP/LCP。

2. 重要圖片改用 AVIF/WebP + lazy loading
   - Logo 素材已做得不錯，但頁面案例圖還能統一。
   - 做法：首屏圖不要 lazy；非首屏加 `loading="lazy"` 與 `decoding="async"`。

3. 建立固定 FAQ 與價格答案區塊
   - Google FAQ rich result 顯示已經比以前受限，但 FAQ 仍有助於搜尋與 AI 理解。
   - 做法：每個服務頁用簡短問答直接回答「多少錢、多久、要不要人在家、怎麼預約」。

4. 加強 GEO
   - 已有 `llms.txt` 是優勢。
   - 做法：讓每篇服務頁有明確一句話答案、價格表、服務範圍、更新日期、聯絡方式。
   - 不建議：大量產生低品質地區頁。Google 對 helpful content 的方向仍是以真實幫助、經驗、可信內容為主。

## 後台規劃判斷

Claude v2 的方向整體適合目前階段：LINE-first、Cloudflare Workers + D1、單一合作方「洗洋洋」、不做派單競標、不急著金流，這些都符合小型服務事業的現實。

現階段最重要的不是把後台做很大，而是把「接單流程」做穩。只要能做到：客戶少打字、老闆看得到、合作方知道要處理、狀態可追蹤、結案可對帳，就已經能支撐早期成長。

## 後台補充建議

### P1 MVP 架構

建議維持 Claude 的核心架構，但加上兩個設計原則：

1. Webhook 快速回應，重工作丟背景
   - LINE webhook 不應等待 AI 慢慢想完才回應。
   - 做法：Workers 收 webhook 後先驗簽、寫入 D1/event log、快速回 200，再用 Queue 或後續 async worker 處理 AI、推播、通知。

2. 所有流程以 `events` 為主
   - 不只存 `orders.status`，也要存每一次狀態變化。
   - 原因：日後若合作方說沒收到、客戶說已約時間、老闆要對帳，事件紀錄會是核心證據。

### 是否需要 Cloudflare Queues / Workflows / Durable Objects

- D1 + Cron：適合 P1，可以先做。
- Queues：很建議 P1 就預留，至少用於 webhook 背景處理、重試、通知。
- Workflows：適合 P2/P3，用於跨天提醒、D-1 提醒、完工後回訪、11 個月再行銷。
- Durable Objects：暫時不是必須。除非未來要做每張訂單即時鎖定、多人協作、聊天室狀態，才需要導入。

### 資料表建議補強

在 Claude 原本 schema 基礎上，建議多考慮：

```sql
orders(
  id,
  public_id,
  customer_id,
  service,
  detail_json,
  area,
  address,
  estimate_min,
  estimate_max,
  final_price,
  travel_fee_status,
  status,
  source,
  utm_json,
  quote_version,
  partner_id,
  partner_contacted_at,
  customer_confirmed_at,
  scheduled_at,
  completed_at,
  closed_at,
  created_at,
  updated_at
)

webhook_events(
  id,
  provider,
  event_id,
  line_user_id,
  body_hash,
  handled_at,
  created_at,
  unique(provider, event_id)
)
```

重點是 `public_id`、`event_id/idempotency`、`utm_json`、`quote_version`、`partner_id`。即使目前只有一個合作方，也建議保留 `partners` 表，未來擴張不用重構。

### 付款與抽成

同意 Claude 建議：不要一開始就導入 ECPay。早期最佳做法是：

1. 客戶完工後現場付款給洗洋洋。
2. 灰汰郎每月與洗洋洋結算。
3. 抽成先用「固定服務費」比百分比更容易落地。

原因：清潔服務會遇到現場加項、取消、交通費、實際髒污程度，早期若用線上先收款，退款與改價會造成營運摩擦。

### Admin 後台建議

Claude 提到 Basic Auth admin。P1 可以接受，但 P2 建議改：

- Cloudflare Access 保護後台。
- Owner/partner 角色權限分開。
- 所有人工變更都寫入 `events`。
- 後台第一屏只放：今日訂單、未處理、待約時間、待結案、待對帳。

### AI 使用建議

AI 不應直接決定承諾時間、價格保證、退款承諾。AI 適合做：

- 判斷服務類型。
- 補齊欄位。
- 根據固定規則給價格區間。
- 產生 LINE 確認卡片。
- 把客戶自由文字整理成 `detail_json`。

不建議 AI 做：

- 現場狀況保證。
- 自行承諾可施工時間。
- 自行承諾退款或免收費。
- 直接修改結算金額。

## 建議執行順序

1. 網站先補 GA4、About schema、圖片尺寸、全站估價流程。
2. 同步建立後台私有 repo `Campcool/huitailang-bot`。
3. P1 bot 只做：LINE webhook、客戶建單、老闆通知、合作方通知、狀態按鈕、D1 event log。
4. P2 再做：Queue、排程提醒、每日報表、回訪、對帳。
5. P3 再考慮：金流、更多合作方、Cloudflare Access admin、Workflows。

## Codex 結論

目前網站已經有可營運的基礎，最值得優先做的是「減少客戶打字」與「確保所有詢價都能被記錄」。後台方向也合理，不需要一開始做成大型派單平台。灰汰郎現階段應該先變成一個穩定接單、穩定追蹤、穩定對帳的小系統，再逐步擴張合作方與服務類別。

