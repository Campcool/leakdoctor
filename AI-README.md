# AI-README｜灰汰郎（leakdoctor.tw）AI 協作交接文件

> **⚠️ 所有 AI 協作規則（必讀）**
> 1. **動手前**：先完整讀完本檔案，了解架構、進度與待辦。
> 2. **動手後**：完成任何修改，必須更新本檔案的「進度紀錄」與「待辦清單」，再一併 commit。
> 3. 本檔案是唯一的交接依據，寫給 AI 看：請保持精確、可執行、不留模糊描述。
> 4. **所有時間戳一律台灣時間（Asia/Taipei, UTC+8）**。

最後更新：2026-07-11（by Codex）— 廣告投放前視覺改版製作中，尚未合併上線

---

## 1. 專案是什麼

- **品牌**：灰汰郎（清潔公司／居家服務媒合平台）。舊名「台灣漏水醫生」，2026-07 完成改名。
- **網域**：`leakdoctor.tw`（GitHub Pages，CNAME 檔控制）。網域是舊品牌遺留，目前保留使用。
- **商業模式**：媒合平台。客戶透過 LINE 或網站表單詢價 → 平台媒合師傅到府服務。純諮詢免費、不施工不收費。
- **服務項目與定價錨點**：
  | 服務 | 起價 | 備註 |
  |---|---|---|
  | 冷氣清洗 | 分離式 $1,499／吊隱式 $2,599／窗型 $3,000 | 對標「洗洋洋」會員價 |
  | 洗衣機清洗 | 直立式 $1,299／滾筒式 $2,999 | 對標「洗洋洋」 |
  | 居家清潔 | 定時 $2,500/4hr、大掃除 $3,500 起（$200-350/坪）、退租 $3,000 起、裝潢細清 $6,000 起（$400-1,000/坪） | 來自業主另一品牌「潔美淨」（0988145875.com.tw）的定價 |
  | 水管抓漏 | 免費初判，現場報價 | 舊品牌的原核心業務 |
- **關聯品牌（同一位業主）**：
  - 潔美淨清潔社（基隆，repo：`Campcool/0988145875`）— 實際施工方之一，清潔案例照來源
  - 洗洋洋（seeyangyang.com，**非業主的**，僅價格對標參考）
  - ⚠️ 露涼社：業主的另一個事業，**與本站無關，LINE 連結不可混用**（曾發生誤換事件，見 §6）

## 2. 關鍵聯絡資訊（寫死在程式裡的常數）

| 項目 | 值 | 位置 |
|---|---|---|
| LINE 加好友連結 | `https://lin.ee/WVxmY65` | 全站 82 處（html/schema/llms.txt）＋ `header.js` 的 `LINE` 常數 |
| LINE 官方帳號 ID | `@478xvlgl` | `header.js` 的 `LINE_OA_ID`（表單 oaMessage 深層連結用） |
| 電話 | 0920-077-473（`tel:+886920077473`） | header.js 黏性列、各頁 footer、LocalBusiness schema、llms.txt |
| GA4 評估 ID | **尚未填**，佔位 `G-XXXXXXXXXX` | `header.js` 開頭 `GA4_ID` 常數；填入真實 ID 即全站啟用 |
| 廠商合作表單 | `https://forms.gle/T4UTULXMaXaoGZQG8` | `header.js` 的 `JOIN_FORM` |

## 3. 技術架構

- **純靜態站**，無框架、無打包工具，直接編輯 HTML。部署 = push 到 `main`（GitHub Pages）。
- **`header.js` 是全站共用核心**（每頁 `<script src="header.js">` 或 `../header.js` 載入），runtime 注入：
  - 固定 header＋9 個導覽頁籤（root 絕對路徑 `/xxx.html`，讓 /articles/ 下也正確）
  - LINE 浮動鈕、加入我們鈕、回頂鈕、手機底部黏性列（含 📞 與預約鈕）
  - **預約表單 modal**（`ldOpenQuote(serviceKey)` 全域函式）：姓名/電話/地址/清洗項目/日期時段，送出 → 組訊息 → `line.me/R/oaMessage/@478xvlgl/?<encoded>` 開 LINE 預填
  - GA4 載入與事件：`line_click`、`phone_click`、`quote_open`、`quote_submit`
  - ⚠️ 全部包在 `ldInit()`，body 未就緒時等 `DOMContentLoaded`——**文章頁在 `<head>` 載入 header.js，改壞這個模式會讓文章頁整個導覽消失**（曾發生）
- **首頁 `index.html` 另有內嵌快速估價器**（3 步驟選服務算價格，JS 在頁尾）。
- 頁面樣式：每頁 `<style>` 內嵌（同一套設計 token：--blue-dark #1e3a8a 等）。地區頁由產生器生成（腳本在 session scratchpad，已遺失，需要時照現有頁面仿寫）。

### 檔案地圖
```
index.html                     首頁（hero、估價器、四服務卡、地區條、CTA）
aircon / washer / homeclean / leak-repair .html   四大服務頁（價目表+Offer schema+FAQ+案例+延伸閱讀）
areas.html + taipei/new-taipei/keelung/taoyuan/hsinchu/miaoli/taichung.html   地區頁（LocalBusiness+FAQ schema）
knowledge.html                 居家百科（漏水百科改名，頂部有清潔文章區塊）
cases.html / team.html / about.html   案例、師傅、關於（內容仍偏漏水，見待辦）
articles/*.html                16 篇：12 篇漏水 + 4 篇清潔（每篇有⚡快速答案、Article+FAQPage schema）
header.js                      全站共用（見上）
estimator.js                   共用快速估價器（吃 data/service-options.json，13 頁使用）
data/service-options.json     服務快選資料庫（Codex 建，估價器/未來 bot 共用的價格單一來源種子）
cases-clean/                   潔美淨真實前後對比照（case01/04/05/07）
logo/                          完整品牌素材包（logos、social-ads、avatars-icons、manifest.csv）
og-image.jpg                   分享卡（深藍版 og-navy 1200x630）
favicon*.png/ico, apple-touch-icon.png, android-chrome-192.png
sitemap.xml / robots.txt / llms.txt / CNAME
google00a268e494d7ca7a.html    GSC 驗證檔（勿動）
og-image.html                  舊 OG 產生器工具頁（未連結，可忽略）
master_*.jpg                   漏水師傅頭像（master_08/16 不存在，頁面已有 onerror fallback）
```

## 4. Git 狀態與流程

- **工作分支**：`claude/cleaning-service-search-scope-j8v2td`
- **2026-07-10 已合併回 `main` 並推送（merge commit `0a05232`）→ 網站已上線最新版**。後續工作繼續在工作分支開發，完成經業主同意後合併回 main。
- 慣例：直接開發、清楚的 commit message、`git push -u origin <branch>`；**絕不 force push**；不建 PR 除非業主要求。
- 修改後驗證慣例：`node --check header.js`；JSON-LD 用 python `json.loads` 驗證；有 Playwright（chromium 在 `/opt/pw-browsers/chromium`）可跑頁面測試（測試時 route abort `fonts.googleapis.com` 避免逾時）。

## 5. 進度紀錄（新條目加在最上面）

### 2026-07-11（Codex）
- 建立 `DESIGN.md`：定義灰汰郎品牌調性、色彩、字級、元件、圖片揭露、無障礙、效能與廣告投放門檻。
- 完成首頁第一階段 UI/UX 改版：暖白雙欄 Hero、信任列、簡化導覽、橘色主 CTA、三項服務流程示意與更清楚的轉換文案。
- 完成 `aircon.html`、`washer.html`、`leak-repair.html` 首屏改版，移除過度概括或缺乏證據的行銷宣稱，改以「先確認、再報價、後安排」說明流程。
- `aircon.html` 新增清洗前後影響與排水檢查說明：採「可能影響」避免醫療／節能保證；寫明倒水測試、簡易堵塞可協助排除，以及嚴重堵塞／管路問題需另請水電或維修專業人員處理。
- 生成冷氣清洗、洗衣機拆洗、抓漏補漏三張 AI 流程示意，轉為 66–165 KB WebP；頁面已明確標示為 AI 流程示意，不能當成真實案例。
- 本地桌機預覽已完成；尚待手機斷點、互動、連結與部署後 Pages 驗證。

### 2026-07-11 10:07 +8（Claude）
- **P1 驗收完成：通過**。Codex 初版全項符合 BOT-PLAN v2.2；金鑰掃描零命中；Actions 全綠且 Worker 已真實部署；真機端到端成功（訂單 HTL-20260710-66F743，Anthropic 已付款）。驗收報告附 BOT-PLAN 文末
- 修復 bot parser 日期覆蓋 bug（commit 992a87f，25/25 測試通過，push 觸發自動部署）
- **上線僅剩一步：洗洋洋加 OA 傳「我的ID」→ 業主設 PARTNER_LINE_USER_ID（Worker secret）**


### 2026-07-10 18:40 +8（Claude）
- 前置作業收齊：業主建立私有 repo **`Campcool/leakdoctor-bot`**；LINE Messaging API 金鑰與 Cloudflare Account/Token 已交付（存放於對話，待寫入 CF/Actions secrets，絕不入 git）；Anthropic API key 於 19:05 補齊（交付 Codex）
- 發現環境限制：Claude 雲端環境無法連 api.cloudflare.com → **部署一律走 bot repo 的 GitHub Actions**（已寫入 BOT-PLAN §2）
- **P1 初版改由 Codex 實作，Claude 驗收**；驗收清單＝BOT-PLAN v2.2 全項＋安全掃描（金鑰不得入 git）＋cron UTC 換算＋無 AI key 優雅降級。業主通知發佈後啟動
- 時間戳規範定為 Asia/Taipei（+8），入協作規則第 4 條

### 2026-07-10 下午（Claude｜採納 Codex 評估後執行）
- **BOT-PLAN 升 v2.2**：採納 Codex 意見（webhook 快速回應+waitUntil 背景化、webhook_events 去重表、恢復 partners 表、AI 工具介面六函式、單一價格來源=bot repo JSON）；Codex 三題定案（provider adapter 預設 Claude／JSON 先行後 D1／獨立 handoff_rules）；修正一點：Queues 需付費方案，P1 用免費 waitUntil。回應以時間戳附於 BOT-PLAN 文末
- **估價器全站化**：新共用元件 `estimator.js`（自 index.html 抽出），讀 `data/service-options.json` 增補需報價機型（四方吹/商用/水塔→導表單），部署首頁＋4 服務頁（預選服務）＋8 地區頁；index.html 舊內嵌估價器 CSS/JS 已移除
- **about.html**：清除 9 處漏水舊文案（含 AboutPage schema description，Codex 抓到的遺漏）
- **BreadcrumbList schema**：32 頁全補
- **GA4 事件**：header.js 曝露 `window.ldTrack`，新增 `service_click`/`area_click`（六事件到齊）
- 圖片尺寸稽核：全站 img 均已有尺寸資訊，無 CLS 風險（Codex 掃的是舊版）

### 2026-07-10（Claude）
- LINE Bot 後台規劃書 `docs/BOT-PLAN.md` **v2.1**：業主決策全數入檔（單一夥伴洗洋洋、無搶單、完工收款+月結拆帳、車馬費$500全歸洗洋洋、自動轉單不設核准關卡、時效話術僅暗示）；新增附錄 A＝可直接轉傳給老闆娘的合作說明。**尚未動工**，開放其他 AI 評估（意見附加文末，勿改正文）；僅剩拆帳比例待業主談定（不擋 P1/P2）
- 全站 LINE 加好友連結換成 `lin.ee/WVxmY65`（業主確認同帳號）
- 建立本檔案 AI-README.md + CLAUDE.md 指標
- **合併工作分支回 main 並推送，全部更新正式上線**

### 2026-07-09（Claude）
- **品牌收尾**：17 頁殘留「台灣漏水醫生」→「灰汰郎」；schema alternateName 保留舊名
- **轉換機制**：全站預約表單 modal（LINE 預填訊息）；首頁快速估價器；服務卡雙 CTA
- **修復**：文章頁 header 完全不渲染（body null bug）、導覽相對路徑 404、leak-repair 破圖與 alert() 假按鈕
- **價格**：洗衣機/居家清潔價目表+Offer schema（原本只寫現場報價）
- **地區頁**：7 城市 + areas.html hub（各自行政區、在地需求、FAQ、schema）
- **品牌素材**：header 換正式 logo、OG 換深藍卡、favicon 全套更新
- **成長批次**：GA4 佔位+4 轉換事件；電話 0920-077-473 上線（黏性列/footer/schema）；4 篇清潔文章；潔美淨真實案例照上服務頁；12 篇舊文加⚡快速答案；「漏水百科」→「居家百科」；fonts preconnect；刪重複頁 knowledge-1/mold-wall-cure-1；llms.txt

## 6. 已知陷阱（改壞過的地方，小心）

1. **header.js 的 ldInit/DOMContentLoaded 模式不可拆**——文章頁在 head 載入，拆了導覽會全站消失。
2. **導覽連結必須 root 絕對路徑**（`/index.html`），相對路徑在 /articles/ 下會 404。
3. **LINE 連結不可隨意替換**：業主有多個事業（露涼社等）各有自己的 LINE。曾把露涼社連結誤換到全站（未推送即攔下）。**換任何 lin.ee 連結前必須向業主確認該連結屬於灰汰郎。**
4. 價格改動同步點：頁面價目表、JSON-LD Offer、llms.txt、首頁服務卡、`estimator.js` 的 `CONFIG`、`data/service-options.json`。
5. 雲端 session 容器會被回收：**成果要盡早 commit+push**，別累積大量未提交修改。
6. `.ld-tab` 目前應為 9 個；Playwright 測試以此為基準。

## 7. 待辦清單

### 🔑 只有業主能做（AI 請勿代做，可提醒）
- [ ] 申請 GA4，把評估 ID 填入 `header.js` 的 `GA4_ID`（或提供給 AI 填）
- [ ] LINE 官方帳號顯示名稱仍是「台灣漏水醫生_百科全書」→ 到 manager.line.biz 改名「灰汰郎」
- [ ] 建立灰汰郎的 Google 商家檔案（現存搜尋結果掛美國電話 +1 407-917-1773 的商家檔案不是業主的）
- [ ] Google Search Console 提交新 sitemap、對改名頁面請求重新索引

### 🟠 高價值，AI 可做
- [x] **廣告投放前視覺改版 P1**：首頁＋冷氣／洗衣機／抓漏首屏、DESIGN.md、三張流程示意（尚待部署驗收）
- [ ] **視覺改版 P2**：延伸至居家清潔、地區、案例、百科與文章頁；建立真實案例／流程示意的圖片標示規格
- [ ] **廣告數據門檻**：取得 GA4 Measurement ID，驗證 quote_open／quote_submit／line_click／phone_click，再建立廣告落地頁
- [x] **LINE Bot P1**：2026-07-11 驗收通過並上線（詳 BOT-PLAN 驗收報告）。剩 PARTNER_LINE_USER_ID 待業主設定
- [ ] **LINE Bot P2**（協作流：夥伴回報按鈕/完工/車馬費結案/逾時提醒/D-1 提醒）：規格在 BOT-PLAN §5/§9/§12，可開工
- [ ] **cases.html / team.html 清潔化**：目前案例頁與師傅頁內容 100% 漏水主題，與清潔主業錯位。加入清潔案例（cases-clean/ 還有 case02/03/06/08-11 未用，在 `Campcool/0988145875` repo 的 cases/），師傅頁加清潔技師
- [ ] 更多清潔文章（水塔清洗、除塵蟎、冷氣省電、大掃除清單…），照 articles/ 現有 4 篇清潔文的模板
- [ ] 剩餘地區頁（宜蘭？台中以南？）——先問業主服務範圍再做

### 🟡 中低優先
- [ ] header 高度 CLS 優化（header.js runtime 注入造成跳動）
- [ ] emoji icon 換 SVG（全站視覺統一，優先度最低）
- [ ] footer「服務時間」文案是否改為「LINE 24 小時可留言預約・客服回覆 週一至週六 09:00–18:00」（待業主確認）
- [ ] og-image.html 舊工具頁決定去留

---

*每次修改完成，請更新 §5 進度紀錄（加日期與執行者）、勾選或增補 §7 待辦，然後與程式碼一併 commit。*
---

## Codex 備註索引（2026-07-10 08:50 Asia/Taipei）

- Codex 已讀取 GitHub 最新 `main`、`AI-README.md`、`CLAUDE.md`、`docs/BOT-PLAN.md`、網站頁面、`header.js`、`llms.txt`，並參考 Google / Cloudflare / LINE 官方文件補充評估。
- 完整補充文件：`docs/CODEX-REVIEW-2026-07-10.md`
- 原則：此段為 Codex 追加備註，不覆蓋 Claude 原始紀錄；後續 AI 可接續閱讀並追加各自時間戳備註。

## Codex 備註索引（2026-07-10 09:07 Asia/Taipei）

- Codex 已新增服務快選資料庫：`data/service-options.json`，涵蓋冷氣清洗、洗衣機清洗、水塔清洗的機型/容量/別名/必填欄位/轉人工規則。
- 說明文件：`docs/SERVICE-OPTIONS-DATABASE.md`
- `docs/BOT-PLAN.md` 已追加同時間戳備註，供 Claude / Codex 後續共同討論是否作為 P1 單一服務資料來源。
# AI-README｜灰汰郎（leakdoctor.tw）AI 協作交接文件

> **⚠️ 所有 AI 協作規則（必讀）**
> 1. **動手前**：先完整讀完本檔案，了解架構、進度與待辦。
> 2. **動手後**：完成任何修改，必須更新本檔案的「進度紀錄」與「待辦清單」，再一併 commit。
> 3. 本檔案是唯一的交接依據，寫給 AI 看：請保持精確、可執行、不留模糊描述。
> 4. **所有時間戳一律台灣時間（Asia/Taipei, UTC+8）**。

最後更新：2026-07-11（by Codex）— 廣告投放前視覺改版製作中，尚未合併上線

---

## 1. 專案是什麼

- **品牌**：灰汰郎（清潔公司／居家服務媒合平台）。舊名「台灣漏水醫生」，2026-07 完成改名。
- **網域**：`leakdoctor.tw`（GitHub Pages，CNAME 檔控制）。網域是舊品牌遺留，目前保留使用。
- **商業模式**：媒合平台。客戶透過 LINE 或網站表單詢價 → 平台媒合師傅到府服務。純諮詢免費、不施工不收費。
- **服務項目與定價錨點**：
  | 服務 | 起價 | 備註 |
  |---|---|---|
  | 冷氣清洗 | 分離式 $1,499／吊隱式 $2,599／窗型 $3,000 | 對標「洗洋洋」會員價 |
  | 洗衣機清洗 | 直立式 $1,299／滾筒式 $2,999 | 對標「洗洋洋」 |
  | 居家清潔 | 定時 $2,500/4hr、大掃除 $3,500 起（$200-350/坪）、退租 $3,000 起、裝潢細清 $6,000 起（$400-1,000/坪） | 來自業主另一品牌「潔美淨」（0988145875.com.tw）的定價 |
  | 水管抓漏 | 免費初判，現場報價 | 舊品牌的原核心業務 |
- **關聯品牌（同一位業主）**：
  - 潔美淨清潔社（基隆，repo：`Campcool/0988145875`）— 實際施工方之一，清潔案例照來源
  - 洗洋洋（seeyangyang.com，**非業主的**，僅價格對標參考）
  - ⚠️ 露涼社：業主的另一個事業，**與本站無關，LINE 連結不可混用**（曾發生誤換事件，見 §6）

## 2. 關鍵聯絡資訊（寫死在程式裡的常數）

| 項目 | 值 | 位置 |
|---|---|---|
| LINE 加好友連結 | `https://lin.ee/WVxmY65` | 全站 82 處（html/schema/llms.txt）＋ `header.js` 的 `LINE` 常數 |
| LINE 官方帳號 ID | `@478xvlgl` | `header.js` 的 `LINE_OA_ID`（表單 oaMessage 深層連結用） |
| 電話 | 0920-077-473（`tel:+886920077473`） | header.js 黏性列、各頁 footer、LocalBusiness schema、llms.txt |
| GA4 評估 ID | **尚未填**，佔位 `G-XXXXXXXXXX` | `header.js` 開頭 `GA4_ID` 常數；填入真實 ID 即全站啟用 |
| 廠商合作表單 | `https://forms.gle/T4UTULXMaXaoGZQG8` | `header.js` 的 `JOIN_FORM` |

## 3. 技術架構

- **純靜態站**，無框架、無打包工具，直接編輯 HTML。部署 = push 到 `main`（GitHub Pages）。
- **`header.js` 是全站共用核心**（每頁 `<script src="header.js">` 或 `../header.js` 載入），runtime 注入：
  - 固定 header＋9 個導覽頁籤（root 絕對路徑 `/xxx.html`，讓 /articles/ 下也正確）
  - LINE 浮動鈕、加入我們鈕、回頂鈕、手機底部黏性列（含 📞 與預約鈕）
  - **預約表單 modal**（`ldOpenQuote(serviceKey)` 全域函式）：姓名/電話/地址/清洗項目/日期時段，送出 → 組訊息 → `line.me/R/oaMessage/@478xvlgl/?<encoded>` 開 LINE 預填
  - GA4 載入與事件：`line_click`、`phone_click`、`quote_open`、`quote_submit`
  - ⚠️ 全部包在 `ldInit()`，body 未就緒時等 `DOMContentLoaded`——**文章頁在 `<head>` 載入 header.js，改壞這個模式會讓文章頁整個導覽消失**（曾發生）
- **首頁 `index.html` 另有內嵌快速估價器**（3 步驟選服務算價格，JS 在頁尾）。
- 頁面樣式：每頁 `<style>` 內嵌（同一套設計 token：--blue-dark #1e3a8a 等）。地區頁由產生器生成（腳本在 session scratchpad，已遺失，需要時照現有頁面仿寫）。

### 檔案地圖
```
index.html                     首頁（hero、估價器、四服務卡、地區條、CTA）
aircon / washer / homeclean / leak-repair .html   四大服務頁（價目表+Offer schema+FAQ+案例+延伸閱讀）
areas.html + taipei/new-taipei/keelung/taoyuan/hsinchu/miaoli/taichung.html   地區頁（LocalBusiness+FAQ schema）
knowledge.html                 居家百科（漏水百科改名，頂部有清潔文章區塊）
cases.html / team.html / about.html   案例、師傅、關於（內容仍偏漏水，見待辦）
articles/*.html                16 篇：12 篇漏水 + 4 篇清潔（每篇有⚡快速答案、Article+FAQPage schema）
header.js                      全站共用（見上）
estimator.js                   共用快速估價器（吃 data/service-options.json，13 頁使用）
data/service-options.json     服務快選資料庫（Codex 建，估價器/未來 bot 共用的價格單一來源種子）
cases-clean/                   潔美淨真實前後對比照（case01/04/05/07）
logo/                          完整品牌素材包（logos、social-ads、avatars-icons、manifest.csv）
og-image.jpg                   分享卡（深藍版 og-navy 1200x630）
favicon*.png/ico, apple-touch-icon.png, android-chrome-192.png
sitemap.xml / robots.txt / llms.txt / CNAME
google00a268e494d7ca7a.html    GSC 驗證檔（勿動）
og-image.html                  舊 OG 產生器工具頁（未連結，可忽略）
master_*.jpg                   漏水師傅頭像（master_08/16 不存在，頁面已有 onerror fallback）
```

## 4. Git 狀態與流程

- **工作分支**：`claude/cleaning-service-search-scope-j8v2td`
- **2026-07-10 已合併回 `main` 並推送（merge commit `0a05232`）→ 網站已上線最新版**。後續工作繼續在工作分支開發，完成經業主同意後合併回 main。
- 慣例：直接開發、清楚的 commit message、`git push -u origin <branch>`；**絕不 force push**；不建 PR 除非業主要求。
- 修改後驗證慣例：`node --check header.js`；JSON-LD 用 python `json.loads` 驗證；有 Playwright（chromium 在 `/opt/pw-browsers/chromium`）可跑頁面測試（測試時 route abort `fonts.googleapis.com` 避免逾時）。

## 5. 進度紀錄（新條目加在最上面）

### 2026-07-11（Codex）
- 建立 `DESIGN.md`：定義灰汰郎品牌調性、色彩、字級、元件、圖片揭露、無障礙、效能與廣告投放門檻。
- 完成首頁第一階段 UI/UX 改版：暖白雙欄 Hero、信任列、簡化導覽、橘色主 CTA、三項服務流程示意與更清楚的轉換文案。
- 完成 `aircon.html`、`washer.html`、`leak-repair.html` 首屏改版，移除過度概括或缺乏證據的行銷宣稱，改以「先確認、再報價、後安排」說明流程。
- 生成冷氣清洗、洗衣機拆洗、抓漏補漏三張 AI 流程示意，轉為 66–165 KB WebP；頁面已明確標示為 AI 流程示意，不能當成真實案例。
- 本地桌機預覽已完成；尚待手機斷點、互動、連結與部署後 Pages 驗證。

### 2026-07-11 10:07 +8（Claude）
- **P1 驗收完成：通過**。Codex 初版全項符合 BOT-PLAN v2.2；金鑰掃描零命中；Actions 全綠且 Worker 已真實部署；真機端到端成功（訂單 HTL-20260710-66F743，Anthropic 已付款）。驗收報告附 BOT-PLAN 文末
- 修復 bot parser 日期覆蓋 bug（commit 992a87f，25/25 測試通過，push 觸發自動部署）
- **上線僅剩一步：洗洋洋加 OA 傳「我的ID」→ 業主設 PARTNER_LINE_USER_ID（Worker secret）**


### 2026-07-10 18:40 +8（Claude）
- 前置作業收齊：業主建立私有 repo **`Campcool/leakdoctor-bot`**；LINE Messaging API 金鑰與 Cloudflare Account/Token 已交付（存放於對話，待寫入 CF/Actions secrets，絕不入 git）；Anthropic API key 於 19:05 補齊（交付 Codex）
- 發現環境限制：Claude 雲端環境無法連 api.cloudflare.com → **部署一律走 bot repo 的 GitHub Actions**（已寫入 BOT-PLAN §2）
- **P1 初版改由 Codex 實作，Claude 驗收**；驗收清單＝BOT-PLAN v2.2 全項＋安全掃描（金鑰不得入 git）＋cron UTC 換算＋無 AI key 優雅降級。業主通知發佈後啟動
- 時間戳規範定為 Asia/Taipei（+8），入協作規則第 4 條

### 2026-07-10 下午（Claude｜採納 Codex 評估後執行）
- **BOT-PLAN 升 v2.2**：採納 Codex 意見（webhook 快速回應+waitUntil 背景化、webhook_events 去重表、恢復 partners 表、AI 工具介面六函式、單一價格來源=bot repo JSON）；Codex 三題定案（provider adapter 預設 Claude／JSON 先行後 D1／獨立 handoff_rules）；修正一點：Queues 需付費方案，P1 用免費 waitUntil。回應以時間戳附於 BOT-PLAN 文末
- **估價器全站化**：新共用元件 `estimator.js`（自 index.html 抽出），讀 `data/service-options.json` 增補需報價機型（四方吹/商用/水塔→導表單），部署首頁＋4 服務頁（預選服務）＋8 地區頁；index.html 舊內嵌估價器 CSS/JS 已移除
- **about.html**：清除 9 處漏水舊文案（含 AboutPage schema description，Codex 抓到的遺漏）
- **BreadcrumbList schema**：32 頁全補
- **GA4 事件**：header.js 曝露 `window.ldTrack`，新增 `service_click`/`area_click`（六事件到齊）
- 圖片尺寸稽核：全站 img 均已有尺寸資訊，無 CLS 風險（Codex 掃的是舊版）

### 2026-07-10（Claude）
- LINE Bot 後台規劃書 `docs/BOT-PLAN.md` **v2.1**：業主決策全數入檔（單一夥伴洗洋洋、無搶單、完工收款+月結拆帳、車馬費$500全歸洗洋洋、自動轉單不設核准關卡、時效話術僅暗示）；新增附錄 A＝可直接轉傳給老闆娘的合作說明。**尚未動工**，開放其他 AI 評估（意見附加文末，勿改正文）；僅剩拆帳比例待業主談定（不擋 P1/P2）
- 全站 LINE 加好友連結換成 `lin.ee/WVxmY65`（業主確認同帳號）
- 建立本檔案 AI-README.md + CLAUDE.md 指標
- **合併工作分支回 main 並推送，全部更新正式上線**

### 2026-07-09（Claude）
- **品牌收尾**：17 頁殘留「台灣漏水醫生」→「灰汰郎」；schema alternateName 保留舊名
- **轉換機制**：全站預約表單 modal（LINE 預填訊息）；首頁快速估價器；服務卡雙 CTA
- **修復**：文章頁 header 完全不渲染（body null bug）、導覽相對路徑 404、leak-repair 破圖與 alert() 假按鈕
- **價格**：洗衣機/居家清潔價目表+Offer schema（原本只寫現場報價）
- **地區頁**：7 城市 + areas.html hub（各自行政區、在地需求、FAQ、schema）
- **品牌素材**：header 換正式 logo、OG 換深藍卡、favicon 全套更新
- **成長批次**：GA4 佔位+4 轉換事件；電話 0920-077-473 上線（黏性列/footer/schema）；4 篇清潔文章；潔美淨真實案例照上服務頁；12 篇舊文加⚡快速答案；「漏水百科」→「居家百科」；fonts preconnect；刪重複頁 knowledge-1/mold-wall-cure-1；llms.txt

## 6. 已知陷阱（改壞過的地方，小心）

1. **header.js 的 ldInit/DOMContentLoaded 模式不可拆**——文章頁在 head 載入，拆了導覽會全站消失。
2. **導覽連結必須 root 絕對路徑**（`/index.html`），相對路徑在 /articles/ 下會 404。
3. **LINE 連結不可隨意替換**：業主有多個事業（露涼社等）各有自己的 LINE。曾把露涼社連結誤換到全站（未推送即攔下）。**換任何 lin.ee 連結前必須向業主確認該連結屬於灰汰郎。**
4. 價格改動同步點：頁面價目表、JSON-LD Offer、llms.txt、首頁服務卡、`estimator.js` 的 `CONFIG`、`data/service-options.json`。
5. 雲端 session 容器會被回收：**成果要盡早 commit+push**，別累積大量未提交修改。
6. `.ld-tab` 目前應為 9 個；Playwright 測試以此為基準。

## 7. 待辦清單

### 🔑 只有業主能做（AI 請勿代做，可提醒）
- [ ] 申請 GA4，把評估 ID 填入 `header.js` 的 `GA4_ID`（或提供給 AI 填）
- [ ] LINE 官方帳號顯示名稱仍是「台灣漏水醫生_百科全書」→ 到 manager.line.biz 改名「灰汰郎」
- [ ] 建立灰汰郎的 Google 商家檔案（現存搜尋結果掛美國電話 +1 407-917-1773 的商家檔案不是業主的）
- [ ] Google Search Console 提交新 sitemap、對改名頁面請求重新索引

### 🟠 高價值，AI 可做
- [x] **廣告投放前視覺改版 P1**：首頁＋冷氣／洗衣機／抓漏首屏、DESIGN.md、三張流程示意（尚待部署驗收）
- [ ] **視覺改版 P2**：延伸至居家清潔、地區、案例、百科與文章頁；建立真實案例／流程示意的圖片標示規格
- [ ] **廣告數據門檻**：取得 GA4 Measurement ID，驗證 quote_open／quote_submit／line_click／phone_click，再建立廣告落地頁
- [x] **LINE Bot P1**：2026-07-11 驗收通過並上線（詳 BOT-PLAN 驗收報告）。剩 PARTNER_LINE_USER_ID 待業主設定
- [ ] **LINE Bot P2**（協作流：夥伴回報按鈕/完工/車馬費結案/逾時提醒/D-1 提醒）：規格在 BOT-PLAN §5/§9/§12，可開工
- [ ] **cases.html / team.html 清潔化**：目前案例頁與師傅頁內容 100% 漏水主題，與清潔主業錯位。加入清潔案例（cases-clean/ 還有 case02/03/06/08-11 未用，在 `Campcool/0988145875` repo 的 cases/），師傅頁加清潔技師
- [ ] 更多清潔文章（水塔清洗、除塵蟎、冷氣省電、大掃除清單…），照 articles/ 現有 4 篇清潔文的模板
- [ ] 剩餘地區頁（宜蘭？台中以南？）——先問業主服務範圍再做

### 🟡 中低優先
- [ ] header 高度 CLS 優化（header.js runtime 注入造成跳動）
- [ ] emoji icon 換 SVG（全站視覺統一，優先度最低）
- [ ] footer「服務時間」文案是否改為「LINE 24 小時可留言預約・客服回覆 週一至週六 09:00–18:00」（待業主確認）
- [ ] og-image.html 舊工具頁決定去留

---

*每次修改完成，請更新 §5 進度紀錄（加日期與執行者）、勾選或增補 §7 待辦，然後與程式碼一併 commit。*
---

## Codex 備註索引（2026-07-10 08:50 Asia/Taipei）

- Codex 已讀取 GitHub 最新 `main`、`AI-README.md`、`CLAUDE.md`、`docs/BOT-PLAN.md`、網站頁面、`header.js`、`llms.txt`，並參考 Google / Cloudflare / LINE 官方文件補充評估。
- 完整補充文件：`docs/CODEX-REVIEW-2026-07-10.md`
- 原則：此段為 Codex 追加備註，不覆蓋 Claude 原始紀錄；後續 AI 可接續閱讀並追加各自時間戳備註。

## Codex 備註索引（2026-07-10 09:07 Asia/Taipei）

- Codex 已新增服務快選資料庫：`data/service-options.json`，涵蓋冷氣清洗、洗衣機清洗、水塔清洗的機型/容量/別名/必填欄位/轉人工規則。
- 說明文件：`docs/SERVICE-OPTIONS-DATABASE.md`
- `docs/BOT-PLAN.md` 已追加同時間戳備註，供 Claude / Codex 後續共同討論是否作為 P1 單一服務資料來源。
# AI-README｜灰汰郎（leakdoctor.tw）AI 協作交接文件

> **⚠️ 所有 AI 協作規則（必讀）**
> 1. **動手前**：先完整讀完本檔案，了解架構、進度與待辦。
> 2. **動手後**：完成任何修改，必須更新本檔案的「進度紀錄」與「待辦清單」，再一併 commit。
> 3. 本檔案是唯一的交接依據，寫給 AI 看：請保持精確、可執行、不留模糊描述。
> 4. **所有時間戳一律台灣時間（Asia/Taipei, UTC+8）**。

最後更新：2026-07-10（by Claude）— 已合併上線

---

## 1. 專案是什麼

- **品牌**：灰汰郎（清潔公司／居家服務媒合平台）。舊名「台灣漏水醫生」，2026-07 完成改名。
- **網域**：`leakdoctor.tw`（GitHub Pages，CNAME 檔控制）。網域是舊品牌遺留，目前保留使用。
- **商業模式**：媒合平台。客戶透過 LINE 或網站表單詢價 → 平台媒合師傅到府服務。純諮詢免費、不施工不收費。
- **服務項目與定價錨點**：
  | 服務 | 起價 | 備註 |
  |---|---|---|
  | 冷氣清洗 | 分離式 $1,499／吊隱式 $2,599／窗型 $3,000 | 對標「洗洋洋」會員價 |
  | 洗衣機清洗 | 直立式 $1,299／滾筒式 $2,999 | 對標「洗洋洋」 |
  | 居家清潔 | 定時 $2,500/4hr、大掃除 $3,500 起（$200-350/坪）、退租 $3,000 起、裝潢細清 $6,000 起（$400-1,000/坪） | 來自業主另一品牌「潔美淨」（0988145875.com.tw）的定價 |
  | 水管抓漏 | 免費初判，現場報價 | 舊品牌的原核心業務 |
- **關聯品牌（同一位業主）**：
  - 潔美淨清潔社（基隆，repo：`Campcool/0988145875`）— 實際施工方之一，清潔案例照來源
  - 洗洋洋（seeyangyang.com，**非業主的**，僅價格對標參考）
  - ⚠️ 露涼社：業主的另一個事業，**與本站無關，LINE 連結不可混用**（曾發生誤換事件，見 §6）

## 2. 關鍵聯絡資訊（寫死在程式裡的常數）

| 項目 | 值 | 位置 |
|---|---|---|
| LINE 加好友連結 | `https://lin.ee/WVxmY65` | 全站 82 處（html/schema/llms.txt）＋ `header.js` 的 `LINE` 常數 |
| LINE 官方帳號 ID | `@478xvlgl` | `header.js` 的 `LINE_OA_ID`（表單 oaMessage 深層連結用） |
| 電話 | 0920-077-473（`tel:+886920077473`） | header.js 黏性列、各頁 footer、LocalBusiness schema、llms.txt |
| GA4 評估 ID | **尚未填**，佔位 `G-XXXXXXXXXX` | `header.js` 開頭 `GA4_ID` 常數；填入真實 ID 即全站啟用 |
| 廠商合作表單 | `https://forms.gle/T4UTULXMaXaoGZQG8` | `header.js` 的 `JOIN_FORM` |

## 3. 技術架構

- **純靜態站**，無框架、無打包工具，直接編輯 HTML。部署 = push 到 `main`（GitHub Pages）。
- **`header.js` 是全站共用核心**（每頁 `<script src="header.js">` 或 `../header.js` 載入），runtime 注入：
  - 固定 header＋9 個導覽頁籤（root 絕對路徑 `/xxx.html`，讓 /articles/ 下也正確）
  - LINE 浮動鈕、加入我們鈕、回頂鈕、手機底部黏性列（含 📞 與預約鈕）
  - **預約表單 modal**（`ldOpenQuote(serviceKey)` 全域函式）：姓名/電話/地址/清洗項目/日期時段，送出 → 組訊息 → `line.me/R/oaMessage/@478xvlgl/?<encoded>` 開 LINE 預填
  - GA4 載入與事件：`line_click`、`phone_click`、`quote_open`、`quote_submit`
  - ⚠️ 全部包在 `ldInit()`，body 未就緒時等 `DOMContentLoaded`——**文章頁在 `<head>` 載入 header.js，改壞這個模式會讓文章頁整個導覽消失**（曾發生）
- **首頁 `index.html` 另有內嵌快速估價器**（3 步驟選服務算價格，JS 在頁尾）。
- 頁面樣式：每頁 `<style>` 內嵌（同一套設計 token：--blue-dark #1e3a8a 等）。地區頁由產生器生成（腳本在 session scratchpad，已遺失，需要時照現有頁面仿寫）。

### 檔案地圖
```
index.html                     首頁（hero、估價器、四服務卡、地區條、CTA）
aircon / washer / homeclean / leak-repair .html   四大服務頁（價目表+Offer schema+FAQ+案例+延伸閱讀）
areas.html + taipei/new-taipei/keelung/taoyuan/hsinchu/miaoli/taichung.html   地區頁（LocalBusiness+FAQ schema）
knowledge.html                 居家百科（漏水百科改名，頂部有清潔文章區塊）
cases.html / team.html / about.html   案例、師傅、關於（內容仍偏漏水，見待辦）
articles/*.html                16 篇：12 篇漏水 + 4 篇清潔（每篇有⚡快速答案、Article+FAQPage schema）
header.js                      全站共用（見上）
estimator.js                   共用快速估價器（吃 data/service-options.json，13 頁使用）
data/service-options.json     服務快選資料庫（Codex 建，估價器/未來 bot 共用的價格單一來源種子）
cases-clean/                   潔美淨真實前後對比照（case01/04/05/07）
logo/                          完整品牌素材包（logos、social-ads、avatars-icons、manifest.csv）
og-image.jpg                   分享卡（深藍版 og-navy 1200x630）
favicon*.png/ico, apple-touch-icon.png, android-chrome-192.png
sitemap.xml / robots.txt / llms.txt / CNAME
google00a268e494d7ca7a.html    GSC 驗證檔（勿動）
og-image.html                  舊 OG 產生器工具頁（未連結，可忽略）
master_*.jpg                   漏水師傅頭像（master_08/16 不存在，頁面已有 onerror fallback）
```

## 4. Git 狀態與流程

- **工作分支**：`claude/cleaning-service-search-scope-j8v2td`
- **2026-07-10 已合併回 `main` 並推送（merge commit `0a05232`）→ 網站已上線最新版**。後續工作繼續在工作分支開發，完成經業主同意後合併回 main。
- 慣例：直接開發、清楚的 commit message、`git push -u origin <branch>`；**絕不 force push**；不建 PR 除非業主要求。
- 修改後驗證慣例：`node --check header.js`；JSON-LD 用 python `json.loads` 驗證；有 Playwright（chromium 在 `/opt/pw-browsers/chromium`）可跑頁面測試（測試時 route abort `fonts.googleapis.com` 避免逾時）。

## 5. 進度紀錄（新條目加在最上面）

### 2026-07-11 10:07 +8（Claude）
- **P1 驗收完成：通過**。Codex 初版全項符合 BOT-PLAN v2.2；金鑰掃描零命中；Actions 全綠且 Worker 已真實部署；真機端到端成功（訂單 HTL-20260710-66F743，Anthropic 已付款）。驗收報告附 BOT-PLAN 文末
- 修復 bot parser 日期覆蓋 bug（commit 992a87f，25/25 測試通過，push 觸發自動部署）
- **上線僅剩一步：洗洋洋加 OA 傳「我的ID」→ 業主設 PARTNER_LINE_USER_ID（Worker secret）**


### 2026-07-10 18:40 +8（Claude）
- 前置作業收齊：業主建立私有 repo **`Campcool/leakdoctor-bot`**；LINE Messaging API 金鑰與 Cloudflare Account/Token 已交付（存放於對話，待寫入 CF/Actions secrets，絕不入 git）；Anthropic API key 於 19:05 補齊（交付 Codex）
- 發現環境限制：Claude 雲端環境無法連 api.cloudflare.com → **部署一律走 bot repo 的 GitHub Actions**（已寫入 BOT-PLAN §2）
- **P1 初版改由 Codex 實作，Claude 驗收**；驗收清單＝BOT-PLAN v2.2 全項＋安全掃描（金鑰不得入 git）＋cron UTC 換算＋無 AI key 優雅降級。業主通知發佈後啟動
- 時間戳規範定為 Asia/Taipei（+8），入協作規則第 4 條

### 2026-07-10 下午（Claude｜採納 Codex 評估後執行）
- **BOT-PLAN 升 v2.2**：採納 Codex 意見（webhook 快速回應+waitUntil 背景化、webhook_events 去重表、恢復 partners 表、AI 工具介面六函式、單一價格來源=bot repo JSON）；Codex 三題定案（provider adapter 預設 Claude／JSON 先行後 D1／獨立 handoff_rules）；修正一點：Queues 需付費方案，P1 用免費 waitUntil。回應以時間戳附於 BOT-PLAN 文末
- **估價器全站化**：新共用元件 `estimator.js`（自 index.html 抽出），讀 `data/service-options.json` 增補需報價機型（四方吹/商用/水塔→導表單），部署首頁＋4 服務頁（預選服務）＋8 地區頁；index.html 舊內嵌估價器 CSS/JS 已移除
- **about.html**：清除 9 處漏水舊文案（含 AboutPage schema description，Codex 抓到的遺漏）
- **BreadcrumbList schema**：32 頁全補
- **GA4 事件**：header.js 曝露 `window.ldTrack`，新增 `service_click`/`area_click`（六事件到齊）
- 圖片尺寸稽核：全站 img 均已有尺寸資訊，無 CLS 風險（Codex 掃的是舊版）

### 2026-07-10（Claude）
- LINE Bot 後台規劃書 `docs/BOT-PLAN.md` **v2.1**：業主決策全數入檔（單一夥伴洗洋洋、無搶單、完工收款+月結拆帳、車馬費$500全歸洗洋洋、自動轉單不設核准關卡、時效話術僅暗示）；新增附錄 A＝可直接轉傳給老闆娘的合作說明。**尚未動工**，開放其他 AI 評估（意見附加文末，勿改正文）；僅剩拆帳比例待業主談定（不擋 P1/P2）
- 全站 LINE 加好友連結換成 `lin.ee/WVxmY65`（業主確認同帳號）
- 建立本檔案 AI-README.md + CLAUDE.md 指標
- **合併工作分支回 main 並推送，全部更新正式上線**

### 2026-07-09（Claude）
- **品牌收尾**：17 頁殘留「台灣漏水醫生」→「灰汰郎」；schema alternateName 保留舊名
- **轉換機制**：全站預約表單 modal（LINE 預填訊息）；首頁快速估價器；服務卡雙 CTA
- **修復**：文章頁 header 完全不渲染（body null bug）、導覽相對路徑 404、leak-repair 破圖與 alert() 假按鈕
- **價格**：洗衣機/居家清潔價目表+Offer schema（原本只寫現場報價）
- **地區頁**：7 城市 + areas.html hub（各自行政區、在地需求、FAQ、schema）
- **品牌素材**：header 換正式 logo、OG 換深藍卡、favicon 全套更新
- **成長批次**：GA4 佔位+4 轉換事件；電話 0920-077-473 上線（黏性列/footer/schema）；4 篇清潔文章；潔美淨真實案例照上服務頁；12 篇舊文加⚡快速答案；「漏水百科」→「居家百科」；fonts preconnect；刪重複頁 knowledge-1/mold-wall-cure-1；llms.txt

## 6. 已知陷阱（改壞過的地方，小心）

1. **header.js 的 ldInit/DOMContentLoaded 模式不可拆**——文章頁在 head 載入，拆了導覽會全站消失。
2. **導覽連結必須 root 絕對路徑**（`/index.html`），相對路徑在 /articles/ 下會 404。
3. **LINE 連結不可隨意替換**：業主有多個事業（露涼社等）各有自己的 LINE。曾把露涼社連結誤換到全站（未推送即攔下）。**換任何 lin.ee 連結前必須向業主確認該連結屬於灰汰郎。**
4. 價格改動同步點：頁面價目表、JSON-LD Offer、llms.txt、首頁服務卡、`estimator.js` 的 `CONFIG`、`data/service-options.json`。
5. 雲端 session 容器會被回收：**成果要盡早 commit+push**，別累積大量未提交修改。
6. `.ld-tab` 目前應為 9 個；Playwright 測試以此為基準。

## 7. 待辦清單

### 🔑 只有業主能做（AI 請勿代做，可提醒）
- [ ] 申請 GA4，把評估 ID 填入 `header.js` 的 `GA4_ID`（或提供給 AI 填）
- [ ] LINE 官方帳號顯示名稱仍是「台灣漏水醫生_百科全書」→ 到 manager.line.biz 改名「灰汰郎」
- [ ] 建立灰汰郎的 Google 商家檔案（現存搜尋結果掛美國電話 +1 407-917-1773 的商家檔案不是業主的）
- [ ] Google Search Console 提交新 sitemap、對改名頁面請求重新索引

### 🟠 高價值，AI 可做
- [x] **LINE Bot P1**：2026-07-11 驗收通過並上線（詳 BOT-PLAN 驗收報告）。剩 PARTNER_LINE_USER_ID 待業主設定
- [ ] **LINE Bot P2**（協作流：夥伴回報按鈕/完工/車馬費結案/逾時提醒/D-1 提醒）：規格在 BOT-PLAN §5/§9/§12，可開工
- [ ] **cases.html / team.html 清潔化**：目前案例頁與師傅頁內容 100% 漏水主題，與清潔主業錯位。加入清潔案例（cases-clean/ 還有 case02/03/06/08-11 未用，在 `Campcool/0988145875` repo 的 cases/），師傅頁加清潔技師
- [ ] 更多清潔文章（水塔清洗、除塵蟎、冷氣省電、大掃除清單…），照 articles/ 現有 4 篇清潔文的模板
- [ ] 剩餘地區頁（宜蘭？台中以南？）——先問業主服務範圍再做

### 🟡 中低優先
- [ ] header 高度 CLS 優化（header.js runtime 注入造成跳動）
- [ ] emoji icon 換 SVG（全站視覺統一，優先度最低）
- [ ] footer「服務時間」文案是否改為「LINE 24 小時可留言預約・客服回覆 週一至週六 09:00–18:00」（待業主確認）
- [ ] og-image.html 舊工具頁決定去留

---

*每次修改完成，請更新 §5 進度紀錄（加日期與執行者）、勾選或增補 §7 待辦，然後與程式碼一併 commit。*
---

## Codex 備註索引（2026-07-10 08:50 Asia/Taipei）

- Codex 已讀取 GitHub 最新 `main`、`AI-README.md`、`CLAUDE.md`、`docs/BOT-PLAN.md`、網站頁面、`header.js`、`llms.txt`，並參考 Google / Cloudflare / LINE 官方文件補充評估。
- 完整補充文件：`docs/CODEX-REVIEW-2026-07-10.md`
- 原則：此段為 Codex 追加備註，不覆蓋 Claude 原始紀錄；後續 AI 可接續閱讀並追加各自時間戳備註。

## Codex 備註索引（2026-07-10 09:07 Asia/Taipei）

- Codex 已新增服務快選資料庫：`data/service-options.json`，涵蓋冷氣清洗、洗衣機清洗、水塔清洗的機型/容量/別名/必填欄位/轉人工規則。
- 說明文件：`docs/SERVICE-OPTIONS-DATABASE.md`
- `docs/BOT-PLAN.md` 已追加同時間戳備註，供 Claude / Codex 後續共同討論是否作為 P1 單一服務資料來源。
