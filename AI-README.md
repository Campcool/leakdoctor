# AI-README｜灰汰郎（leakdoctor.tw）AI 協作交接文件

> **⚠️ 所有 AI 協作規則（必讀）**
> 1. **動手前**：先完整讀完本檔案，了解架構、進度與待辦。
> 2. **動手後**：完成任何修改，必須更新本檔案的「進度紀錄」與「待辦清單」，再一併 commit。
> 3. 本檔案是唯一的交接依據，寫給 AI 看：請保持精確、可執行、不留模糊描述。
> 4. **所有時間戳一律台灣時間（Asia/Taipei, UTC+8）**。

最後更新：2026-07-13（by Codex）— 補齊水塔／水管清洗服務頁與六服務導覽

---

## 1. 專案是什麼

- **品牌**：灰汰郎（清潔與居家到府服務）。舊名「台灣漏水醫生」，2026-07 完成改名。
- **網域**：`leakdoctor.tw`（GitHub Pages，CNAME 檔控制）。網域是舊品牌遺留，目前保留使用。
- **商業模式**：客戶透過 LINE 或網站表單整理需求，由合作服務團隊到府評估與施工；網站同時提供免費居家知識。純諮詢免費、不施工不收費。
- **服務項目與定價錨點**：
  | 服務 | 起價 | 備註 |
  |---|---|---|
  | 冷氣清洗 | 分離式 $1,499／吊隱式 $2,599／窗型 $3,000 | 對標「洗洋洋」會員價 |
  | 洗衣機清洗 | 直立式 $1,299／滾筒式 $2,999 | 對標「洗洋洋」 |
  | 居家清潔 | 定時 $2,500/4hr、大掃除 $3,500 起（$200-350/坪）、退租 $3,000 起、裝潢細清 $6,000 起（$400-1,000/坪） | 來自業主另一品牌「潔美淨」（0988145875.com.tw）的定價 |
  | 水塔清洗 | 依容量、顆數、材質、通道、排水與停水條件報價 | 已獨立服務頁；不可再塞在居家清潔 |
  | 水管清洗 | 依屋齡、管材、出水點、水壓與停水條件報價 | 已獨立服務頁；與漏水檢測分開 |
  | 漏水檢測與修補 | 免費初判，現場報價 | 舊品牌的原核心業務 |
- **關聯品牌（同一位業主）**：
  - 潔美淨清潔社（基隆，repo：`Campcool/0988145875`）— 實際施工方之一，清潔案例照來源
  - 洗洋洋（seeyangyang.com，**非業主的**，僅價格對標參考）
  - ⚠️ 露涼社：業主的另一個事業，**與本站無關，LINE 連結不可混用**（曾發生誤換事件，見 §6）

## 2. 關鍵聯絡資訊（寫死在程式裡的常數）

| 項目 | 值 | 位置 |
|---|---|---|
| LINE 加好友連結 | `https://lin.ee/WVxmY65` | 全站 82 處（html/schema/llms.txt）＋ `header.js` 的 `LINE` 常數 |
| LINE 官方帳號 ID | `@478xvlgl` | `header.js` 的 `LINE_OA_ID`（表單 oaMessage 深層連結用） |
| GA4 評估 ID | **尚未填**，佔位 `G-XXXXXXXXXX` | `header.js` 開頭 `GA4_ID` 常數；填入真實 ID 即全站啟用 |

## 3. 技術架構

- **純靜態站**，無框架、無打包工具，直接編輯 HTML。部署 = push 到 `main`（GitHub Pages）。
- **`header.js` 是全站共用核心**（每頁 `<script src="header.js">` 或 `../header.js` 載入），runtime 注入：
  - fixed header＋6 個主服務頁籤（root 絕對路徑 `/xxx.html`，讓 /articles/ 下也正確）；桌機 Logo 首頁入口與服務頁籤同列等高，手機維持 Logo＋3×2 服務選項
  - 右側 LINE 浮動鈕、回頂鈕、手機底部 LINE 預約列；網站不提供公開電話 CTA，也不顯示「加入我們」
  - 六服務專屬色系由 body theme class 與 CSS variables 串接頁籤及頁面 CTA：冷氣青藍、洗衣機紫、居家清潔琥珀、水塔綠、水管靛藍、漏水青綠
  - **預約表單 modal**（`ldOpenQuote(serviceKey)` 全域函式）：姓名/電話/地址/服務卡片/日期時段，送出 → 組訊息 → `line.me/R/oaMessage/@478xvlgl/?<encoded>` 開 LINE 預填
  - GA4 載入與事件：`line_click`、`quote_open`、`quote_submit`
  - ⚠️ 全部包在 `ldInit()`，body 未就緒時等 `DOMContentLoaded`——**文章頁在 `<head>` 載入 header.js，改壞這個模式會讓文章頁整個導覽消失**（曾發生）
- 首頁、服務頁與地區頁不再常駐快速估價器；客戶點聯絡／預約 CTA 後才由 `header.js` 開啟共用 modal。
- 頁面樣式：每頁 `<style>` 內嵌（同一套設計 token：--blue-dark #1e3a8a 等）。地區頁由產生器生成（腳本在 session scratchpad，已遺失，需要時照現有頁面仿寫）。

### 檔案地圖
```
index.html                     首頁（hero、六服務卡、地區條、CTA）
aircon / washer / homeclean / water-tank / pipe-cleaning / leak-repair .html   六大服務頁（價目表/報價規則+Offer schema+FAQ+案例+延伸閱讀）
areas.html + taipei/new-taipei/keelung/taoyuan/hsinchu/miaoli/taichung.html   地區頁（LocalBusiness+FAQ schema）
knowledge.html                 居家百科（漏水百科改名，頂部有清潔文章區塊）
cases.html / team.html / about.html   案例、師傅、關於（內容仍偏漏水，見待辦）
articles/*.html                16 篇：12 篇漏水 + 4 篇清潔（每篇有⚡快速答案、Article+FAQPage schema）
header.js                      全站共用（見上）
assets/icons.svg               品牌化 duotone SVG sprite（導覽、服務、知識、狀態與 CTA）
assets/craft.css / craft.js    克制卡片層級、捲動進場、前後對比滑桿與 reduced-motion
assets/illustrations/           AI 生成教育型示意圖（水塔上下水塔、水管清洗效果與風險、空調髒污位置、洗衣機槽背髒污來源）
data/service-options.json     服務快選資料庫（Bot／AI tool call 與網站服務明細的價格來源種子）
cases-clean/                   潔美淨真實前後對比照（case01/04/05/07）
logo/                          完整品牌素材包（logos、social-ads、avatars-icons、manifest.csv）
og-image.jpg                   分享卡（深藍版 og-navy 1200x630）
favicon*.png/ico, apple-touch-icon.png, android-chrome-192.png
sitemap.xml / robots.txt / llms.txt / CNAME
google00a268e494d7ca7a.html    GSC 驗證檔（勿動）
og-image.html                  舊 OG 產生器工具頁（未連結，可忽略）
master_*.jpg                   漏水專業人員頭像；缺圖項目已改為姓名字首頭像
```

## 4. Git 狀態與流程

- **正式分支**：`main`；2026-07-13 由 Codex 補齊水塔清洗、水管清洗服務頁與六服務導覽（本次尚未 commit/push）。
- **正式網站版本**：`9737114`（後續文件提交除外）；首頁與四個核心服務頁已完成線上 200／共用 UI 資源驗證。
- 慣例：直接開發、清楚的 commit message、`git push -u origin <branch>`；**絕不 force push**；不建 PR 除非業主要求。
- 修改後驗證慣例：`node --check header.js`；以 Node 驗證 JSON-LD、內部連結、四頁流程與禁止字樣；本機網址受瀏覽器安全政策阻擋時，直接使用正式部署標記與真機驗證，不可繞過安全政策。

## 5. 進度紀錄（新條目加在最上面）

### 2026-07-13（Codex・水塔／水管服務頁補齊）
- 依業主指示補上 `water-tank.html` 與 `pipe-cleaning.html`，參考洗洋洋服務分類但不複製文案或素材；兩頁皆採「價格／報價規則 → 內容說明 → 差異說明 → 實際案例」順序。
- 共用 `header.js` 從四服務改為六服務導覽，新增水塔清洗、水管清洗主題色、modal 服務選項、頁面對應與服務明細；手機導覽改為 3×2。
- 既有 `aircon.html`、`washer.html`、`homeclean.html`、`leak-repair.html` 調整為價格優先；`homeclean.html` 保留抽油煙機清洗為居家清潔內的單項加強清潔，不再混入水塔／水管。
- `data/service-options.json` 增補水管清洗 group 與 intent mapping；`llms.txt`、`sitemap.xml`、`about.html` 與主要頁 footer 同步六服務入口。
- 新增 `assets/service-landing.css` 供水塔／水管頁共用；並加入四張 AI 生成教育型示意圖：上下水塔功能、水管清洗效果與老舊管線風險、空調髒污位置、洗衣機槽背髒污來源。實際案例區先放待補照片 placeholder，後續可接業主提供圖片。
- 依業主即時回饋放大 header 六服務頁籤文字、縮小 icon 比例，讓文字成為主要視覺；四張教育示意圖移到價格區下方強化轉換，並移除水塔頁 hero 下方空白資訊框。
- 補入 GA4 `G-1H1X1X9QZE`；水塔、水管、居家清潔新增 AI 生成 hero 圖，水塔／水管頁首屏恢復與其他服務頁一致的左文右圖尺寸，並修正水管頁右側空白框。

### 2026-07-12（Codex・FRONTEND-CRAFT 第一階段）
- 依 Claude `docs/FRONTEND-CRAFT.md` 導入第一批高投入報酬精修；維持 `DESIGN.md` 最新規則，不恢復常駐估價器。
- 新增自製 `assets/icons.svg` duotone sprite，以氣流、旋轉水流、居家光澤與水滴定位作為四服務母題；首頁與四服務頁移除指定 emoji，Header／modal 也改讀同一 sprite。
- 新增 `assets/craft.css`／`craft.js`：卡片預設以邊框分層、陰影只在 hover，數字等寬、標題 balance、IntersectionObserver 捲動進場與 70ms stagger，並完整尊重 `prefers-reduced-motion`。
- 冷氣與居家清潔使用已去識別真實照片建立鍵盤可操作的前後對比 range slider；圖片保留 WebP fallback、明確尺寸、lazy loading 與成果差異說明。
- 同步移除「醫療級三重殺菌」「低評分師傅自動下架」等缺乏佐證或與現行角色不符的舊文案，改為具體的清洗、復原、測試與專員協處說明。

### 2026-07-12（Claude・前台質感精修指南 + 後端里程碑指標）
- 業主回饋：前台功能架構 OK，但**圖示仍有 AI 樣板感**，希望更高質感的圖與 icon，並把研究/素材蒐集技巧寫入交接供 Codex 慢慢琢磨。**icon 升級由 Codex 主導**（業主指定）。
- 新增 **`docs/FRONTEND-CRAFT.md`**（Claude→Codex 的質感技法手冊，補 `DESIGN.md` 沒寫的「怎麼做到」）：icon 去樣板化（授權圖庫、光學一致、品牌母題、duotone、sprite、SVGO）、圖片/AI 插畫（真實優先、色調統一、AVIF/WebP、blur-up、去識別）、**研究與素材蒐集**（DevTools/WebFetch/Playwright 學標竿站「系統」而非抄資產＋版權紅線＋工具清單）、進階互動（scroll-driven、前後對比滑桿、微互動、View Transitions）、字體/效能/無障礙、可加技能清單＋檢查表。逐項慢慢導入。
- Claude 另做一版首頁高質感原型（私人 Artifact）示範方向：互動服務切換器、捲動進場、深淺色、專屬色、線性 SVG 骨架（icon 仍待 Codex 依 §2.3 品牌化）。
- **後端（bot）進度以 `Campcool/leakdoctor-bot` 的 AI-README「後端變更版本紀錄」為準**：2026-07-11～12 已完成 P2 協作流、改期重發卡、確認卡資訊/紅字標示、派工必填、戰情室 `/admin`（已啟用）＋今日提醒、過期時間驗證、地址必含縣市。此站 repo 不重複列。

### 2026-07-12（Codex・聯絡後才顯示需求表單）
- 移除首頁、四服務頁與八個地區頁的常駐快速估價器區塊及 `estimator.js` 載入，並刪除已無引用的元件檔。
- 共用聯絡 modal 保留四服務選擇；從服務頁開啟時自動預選目前服務，首頁／地區頁則由客戶先選服務。
- 服務明細採漸進揭露：冷氣預設壁掛內機、洗衣機預設直立式、居家清潔預設定期清潔、漏水預設初步檢測；第一項可改類型，按「＋增加其他設備／項目」才顯示可追加選項。
- 每項提供獨立數量加減與刪除；冷氣室外機明示加購 `$500／台`，送至 LINE 的預填訊息會逐項列出類型、數量、價格提示與客戶備註。

### 2026-07-12（Codex・桌機固定導覽與服務辨色）
- 桌機 Header 改為單列五入口：Logo 即首頁按鈕，與四個服務頁籤均為 72px 高；服務圖示 30px、主標 15px，在 1280px 正式站 viewport 實測完整對齊。
- Header 改用 fixed 固定於視窗頂部，搭配 runtime 等高 spacer，避免捲動時導覽消失或首屏被遮住。
- 移除前台「加入我們」按鈕、`JOIN_FORM` 常數、定位程式與相關 CSS；右側主要浮動操作只保留 LINE。
- 新增四服務專屬頁籤／頁面配色：冷氣青藍 `#087EA4`、洗衣機紫 `#6D5BD0`、居家清潔琥珀 `#D97706`、漏水青綠 `#0F766E`；作用中頁籤、頁面 CTA、淺色區塊與邊界共用同一 theme variables。
- 移除 `home-refresh.css` 與 `service-refresh.css` 對 Header 的桌機覆寫，導覽版面只由 `header.js` 控制。
- 已部署 `main` commit `9737114`；正式站實測 Logo 與四頁籤皆 72px、Header `position: fixed/top: 0`、spacer 97px、四頁 body theme／作用中色正確且 `#ld-join` 不存在。

### 2026-07-12（Codex・真機版面與返回鍵修正）
- 依真機截圖移除 `home-refresh.css`／`service-refresh.css` 的舊 header 與 150–160px body 補位，解決冷氣／洗衣機頁頂部大留白、圖示消失與跨頁樣式不一致。
- Header 本體不使用陰影；「居家知識」不再放在表頭，知識內容保留在四個服務頁內。
- LINE 從表頭改為右側懸浮按鈕，每 2 秒脈衝；手機返回鍵會先關閉預約抽屜，再執行原本的上一頁。
- 冷氣案例 `case04` 的實際素材與檔名相反，已交換前後顯示來源，使「清潔前／清潔後」標籤符合畫面。
- 已部署 `main` commit `b23c755`；正式資源確認無舊 header padding／頁面級 header 覆寫，Header 無陰影、無知識與頂部 LINE 按鈕，懸浮 LINE 與返回鍵狀態已上線。
- 業主指定合作夥伴洗洋洋官網作為 UI 操作參考；`DESIGN.md` 已記錄可採用的服務／價格、流程、案例、FAQ、LINE 順序，以及不可複製品牌與誇大宣稱的界線。

### 2026-07-11（Codex・導覽與估價互動修正）
- 公開電話 CTA、footer 電話、文章電話文案與 LocalBusiness telephone schema 全部移除；顧客改以 LINE 傳照片與預約，表單仍保留派工必要的聯絡電話欄位。
- Logo 放大；原本不明確的符號改為書本 SVG＋「居家知識」文字；四大服務導覽與估價服務選擇改用一致、符合項目的線性 SVG。
- 服務項目由下拉選單改為 2 欄可點選卡片（小螢幕 1 欄），具選取圓點、深色 active、hover、focus、邊框與陰影；日期時段仍保留原生控制。
- Header 改為文件流內 sticky，取消 runtime body padding，降低跨頁首屏錯位；加入跨文件 View Transition 漸入淡出，並統一服務頁 Hero 最小高度。
- 共用卡片與 CTA 強化邊框、陰影、hover 位移及 reduced-motion，讓可點擊項目更容易辨識。
- 已部署至 `main` commit `7eeca91`；正式 header 已驗證服務卡、SVG、sticky、居家知識文字與 View Transition，首頁及四服務頁皆 200 且無公開電話。

### 2026-07-11（Codex・RWD 與資訊架構統一）
- 共用導覽收斂為 4 個主要服務頁籤：冷氣清洗、洗衣機清洗、居家清潔、漏水檢測與修補；桌機置中放大，手機採 2 欄 × 2 列，Logo 返回首頁，居家知識保留為次要入口。
- 四個服務頁新增一致的「先了解，再決定」知識模組，分別說明症狀、處理邊界、週期／工法與驗收，避免頁面只剩估價下單。
- 共用視覺加入低對比網格、柔和光暈、精準卡片層級、hover／focus-visible 與 reduced-motion；方向參考 Apple 的內容層級、Xiaomi 的分類探索、Samsung 的產品敘事，但不複製品牌外觀。
- 新增 `assets/site-unified.css`，統一核心頁面的色彩、Hero、標題、按鈕、卡片、留白與手機斷點。
- 冷氣、洗衣機、居家清潔、抓漏頁皆新增 6 步驟「簡易流程說明」：確認功能／範圍、關機或斷水斷電、保護、清洗或修補、復原、測試。
- 施工案例、專業人員與服務地區移入 `leak-repair.html` 的頁內導覽；舊 `cases.html`、`team.html`、`areas.html` 與地區頁改為 noindex 並指向整合頁，且自 sitemap 移除。
- 所有頁面移除「媒合」與「AI 流程示意」對外字樣，改用服務安排、專業人員及簡易流程說明。
- 本機程式與結構驗證通過；2026-07-11 已直接部署至 `main`，正式首頁與四個服務頁均回應 200、各含 6 步流程與知識模組，且正式頁無「媒合」字樣。視覺細節仍可由業主日後用手機與桌機巡覽回報。

### 2026-07-11（Codex）
- 新增 `leak-guide.html` 三步互動漏水判讀器：住宅類型＋10–50 年以上屋齡 → 漏水表現 → 管線配置、可能成因、檢測順序、案例與修補方向。
- 新增 `data/leak-guide.json` 作為住宅、症狀、六種檢測與七種修補方式的結構化資料；屋齡僅作風險提示，不直接推定管材。
- 判讀結果會透過 `window.ldLeakGuideSummary` 帶入既有 LINE 預約訊息；`knowledge.html` 與 `leak-repair.html` 已新增入口。
- 規範依內政部國土管理署建築給排水規範整理：管線耐壓、給排水／通氣、管道間與排水設計皆需依現場與圖面確認；紅外線等方法皆標示能力限制。
- 建立 `DESIGN.md`：定義灰汰郎品牌調性、色彩、字級、元件、圖片揭露、無障礙、效能與廣告投放門檻。
- 完成首頁第一階段 UI/UX 改版：暖白雙欄 Hero、信任列、簡化導覽、橘色主 CTA、三項服務流程示意與更清楚的轉換文案。
- 完成 `aircon.html`、`washer.html`、`leak-repair.html` 首屏改版，移除過度概括或缺乏證據的行銷宣稱，改以「先確認、再報價、後安排」說明流程。
- `aircon.html` 新增清洗前後影響與排水檢查說明：採「可能影響」避免醫療／節能保證；寫明倒水測試、簡易堵塞可協助排除，以及嚴重堵塞／管路問題需另請水電或維修專業人員處理。
- 生成冷氣清洗、洗衣機拆洗、抓漏補漏三張 簡易流程說明，轉為 66–165 KB WebP；頁面已明確標示為 簡易流程說明，不能當成真實案例。
- 2026-07-11 已合併至 `main` 並完成 Pages 驗證：首頁、漏水指南與 OG 圖皆回應 200；手機版仍需持續觀察真機操作與轉換數據。

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
- **轉換機制**：全站聯絡／預約 CTA → 共用需求表單 modal → LINE 預填訊息；服務卡保留 CTA，頁面不常駐大型估價器
- **修復**：文章頁 header 完全不渲染（body null bug）、導覽相對路徑 404、leak-repair 破圖與 alert() 假按鈕
- **價格**：洗衣機/居家清潔價目表+Offer schema（原本只寫現場報價）
- **地區頁**：7 城市 + areas.html hub（各自行政區、在地需求、FAQ、schema）
- **品牌素材**：header 換正式 logo、OG 換深藍卡、favicon 全套更新
- **成長批次**：GA4 佔位與轉換事件；4 篇清潔文章；潔美淨真實案例照上服務頁；12 篇舊文加快速答案；「漏水百科」→「居家百科」；fonts preconnect；刪重複頁 knowledge-1/mold-wall-cure-1；llms.txt

## 6. 已知陷阱（改壞過的地方，小心）

1. **header.js 的 ldInit/DOMContentLoaded 模式不可拆**——文章頁在 head 載入，拆了導覽會全站消失。
2. **導覽連結必須 root 絕對路徑**（`/index.html`），相對路徑在 /articles/ 下會 404。
3. **LINE 連結不可隨意替換**：業主有多個事業（露涼社等）各有自己的 LINE。曾把露涼社連結誤換到全站（未推送即攔下）。**換任何 lin.ee 連結前必須向業主確認該連結屬於灰汰郎。**
4. 價格改動同步點：頁面價目表、JSON-LD Offer、llms.txt、首頁服務卡、`header.js` 的 `SERVICE_DETAIL_CATALOG`、`data/service-options.json`。
5. 雲端 session 容器會被回收：**成果要盡早 commit+push**，別累積大量未提交修改。
6. `.ld-tab` 目前應為 6 個主服務項目；首頁由 Logo 返回，居家知識是 header 次要入口。桌機 6 欄，手機 3 欄 × 2 列。

## 7. 待辦清單

### 🔑 只有業主能做（AI 請勿代做，可提醒）
- [ ] 申請 GA4，把評估 ID 填入 `header.js` 的 `GA4_ID`（或提供給 AI 填）
- [ ] LINE 官方帳號顯示名稱仍是「台灣漏水醫生_百科全書」→ 到 manager.line.biz 改名「灰汰郎」
- [ ] 建立灰汰郎的 Google 商家檔案（現存搜尋結果掛美國電話 +1 407-917-1773 的商家檔案不是業主的）
- [ ] Google Search Console 提交新 sitemap、對改名頁面請求重新索引

### 🟠 高價值，AI 可做
- [x] **廣告投放前視覺改版 P1**：首頁＋冷氣／洗衣機／抓漏首屏、DESIGN.md、流程示意與知識型 OG；2026-07-11 已部署並完成正式網址驗證。
- [ ] **視覺改版 P2**：延伸至居家清潔、地區、案例、百科與文章頁；建立真實案例／流程示意的圖片標示規格
- [ ] **廣告數據門檻**：取得 GA4 Measurement ID，驗證 quote_open／quote_submit／line_click，再建立廣告落地頁
- [x] **LINE Bot P1**：2026-07-11 驗收通過並上線（詳 BOT-PLAN 驗收報告）。剩 PARTNER_LINE_USER_ID 待業主設定
- [x] **LINE Bot P2**：夥伴回報、完工、車馬費、逾時／D-1／今日提醒與戰情室程式已完成；仍待 PARTNER_LINE_USER_ID 與管理 Secrets
- [ ] **cases.html / team.html 清潔化**：目前案例頁與師傅頁內容 100% 漏水主題，與清潔主業錯位。加入清潔案例（cases-clean/ 還有 case02/03/06/08-11 未用，在 `Campcool/0988145875` repo 的 cases/），師傅頁加清潔技師
- [ ] 更多清潔文章（水塔清洗、水管清洗、除塵蟎、冷氣省電、大掃除清單…），照 articles/ 現有 4 篇清潔文的模板
- [ ] 剩餘地區頁（宜蘭？台中以南？）——先問業主服務範圍再做

### 🟡 中低優先
- [x] header 導覽改為文件流內 sticky 並取消 runtime body padding；跨頁首屏不再依延遲 padding 校正
- [x] 主導覽與估價服務項目改為一致 SVG；內容區既有 emoji 後續依需求逐批替換
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

- Codex 已新增服務快選資料庫：`data/service-options.json`，涵蓋冷氣清洗、洗衣機清洗、水塔清洗、水管清洗的機型/容量/別名/必填欄位/轉人工規則。
- 說明文件：`docs/SERVICE-OPTIONS-DATABASE.md`
- `docs/BOT-PLAN.md` 已追加同時間戳備註，供 Claude / Codex 後續共同討論是否作為 P1 單一服務資料來源。
