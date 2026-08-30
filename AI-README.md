# AI-README｜灰汰郎（leakdoctor.tw）AI 協作交接文件

> **⚠️ 所有 AI 協作規則（必讀）**
> 1. **動手前**：先完整讀完本檔案，了解架構、進度與待辦。
> 2. **動手後**：完成任何修改，必須更新本檔案的「進度紀錄」與「待辦清單」，再一併 commit。
> 3. 本檔案是唯一的交接依據，寫給 AI 看：請保持精確、可執行、不留模糊描述。
> 4. **所有時間戳一律台灣時間（Asia/Taipei, UTC+8）**。

最後更新：2026-08-31（Codex）— 頁籤 favicon 改用既有灰汰郎品牌圖形；前批閱讀節奏詳 `docs/CODEX-MOBILE-READING-2026-08-31.md`。兩批皆尚未推 main／部署。

## 2026-08-25 GitHub Actions Node 24 runtime（Codex）

依 GitHub 官方各 Action 的 `action.yml` 實際 runtime，將 workflow 升至 `checkout@v7`、
`setup-node@v7`、`configure-pages@v6`、`upload-pages-artifact@v5`、`deploy-pages@v5`。
前四個 JavaScript Action 使用 Node 24；Pages 上傳 Action 為 composite，內部已使用
`upload-artifact@v7`（Node 24）。網站執行用 Node 版本仍為 22，本輪未改網站內容或對外事實。

同一分支補上預約 modal 的完整焦點生命週期：開啟時保存觸發元素並把焦點移到 dialog，
Tab／Shift+Tab 留在 18 個可操作元素內循環，Esc／背景點擊／瀏覽器返回關閉後把焦點還給原按鈕。
`validate-site.mjs` 新增 7 項焦點契約；modal mutation 測試由 14 增至 18 案，18/18 符合預期。
390×844 無頭 Chrome 實測：開啟焦點為 `ld-quote-card`、Tab 首站為關閉鈕、正反循環皆通過、
Esc 後焦點回到手機「填單估價」按鈕，body scroll lock 清除，console error 0。

U5 非 modal 字級仍未完成，且不得用全域 `!important` 粗暴放大。2026-08-25 以無頭 Chrome
掃描 20 個根頁面、390px 與 1440px，得到 366 個「頁寬／選擇器／實算字級」低於 14px 的
可見文字組合；其中混有正文、按鈕、footer 與儀器示意圖 3.5–6px 的裝飾刻度。下一階段須先分成
正文／控制項／裝飾標記，再以頁面群分批修正與目視回歸。`fonts.ready` 的可見跳動仍未經真實手機
驗證；本輪無實機，沒有以無頭瀏覽器冒充。

## 2026-08-24 Pages artifact 公開範圍收斂（Codex）

修正前實測 `https://leakdoctor.tw/AI-README.md` 為 HTTP 200。新增
`scripts/prepare-pages-artifact.sh`，PR check 與 deploy 都以明確公開白名單建立 `_site`；
未列入白名單的維護文件、廣告投放資料與品牌素材封裝預設不發佈。artifact PR #3 已合併，
Pages Source 已由 `legacy` 切為 `workflow`；首頁 bytes／SHA256 與切換前一致，交接文件、廣告資料與
`data/service-options.json` 實測 404，網站使用的 `cases.json`／`data/leak-guide.json` 維持 200。
本輪未改價格、電話、LINE、服務區、GA4、案例或網站內容。

## 2026-08-24 U5 預約 modal 可讀性與觸控區

- 本輪只處理預約 modal，不宣稱全站小字已清完；`.footer-copy` 等非 modal 項目仍留在後續矩陣。
- 18 類 modal 文字在 320／375／390／414／560px 均至少 14px，包含隱私聲明與參考價註記。
- 12 類可操作元件的實際高度下限至少 44px，包含關閉、服務選項、機型、數量、新增／移除與送出按鈕。
- `scripts/validate-site.mjs` 直接使用 `scripts/css-cascade.mjs` 的 `resolve()` 計算生效宣告；`scripts/test-modal-accessibility-gate.mjs` 注入 7 種變異，結果 7/7 符合預期。
- 瀏覽器實測上述五個寬度：可見文字無低於 14px、可操作元件無低於 44px、文件與 modal 水平溢位皆 0。320px 的機型／數量列另改為兩列配置，避免下拉文字被擠到只剩一字。
- `css-cascade.mjs` 只在規則真的宣告受測屬性時才把不支援的 selector 記為不確定；既有手機導覽 mutation test 仍為 13/13。
- 未修改價格、LINE、電話、GA4、服務範圍、案例或照片。
- **`fonts.ready` 的可見跳動仍無實體手機驗證；桌面瀏覽器響應式測試不算實機。**

## 2026-08-24 Claude 審查後追加修正（四項）

### ① 作用中頁籤置中：`scrollLeft` 算式改為 `scrollIntoView`

初版用 `requestAnimationFrame` + `nav.scrollLeft = offsetLeft - ...`。算式本身沒錯，
但那個 rAF 在 `insertAdjacentHTML` 之後立刻執行，**版面尚未定案**，
`offsetLeft`／`clientWidth` 還不是最終值，算出來是 0；之後除了 `resize` 沒有補算機制。

實測（完整載入 + 等 2 秒）：三個服務頁 `scrollLeft` **全為 0**，
`leak-repair.html` 的作用中頁籤置中誤差 **439px、完全在畫面外**。

改為 `activeTab.scrollIntoView({ block:'nearest', inline:'center' })` 由瀏覽器處理版面時機，
並在 `load` 與 `document.fonts.ready` 之後各補一次（字體換掉會改變頁籤寬度）。

修正後實測：

| 頁面 | 作用中頁籤 | `scrollLeft` | 置中誤差 | 完全可見 |
|---|---|---:|---:|---|
| `aircon.html` | 第 1 個 | 0 | −126px（已到最左，正確） | ✅ |
| `washer.html` | 第 2 個 | 0 | −15px | ✅ |
| `homeclean.html` | 第 3 個 | 96 | **0px** | ✅ |
| `leak-repair.html` | 第 6 個 | 329 | 110px（已到最右，正確） | ✅ |

> ⚠️ 舊文件記載的「中間服務置中誤差 0px」在初版**並未成立**（實測 96px）；修正後才真的是 0px。

### ② `resize` 不再搶走使用者手動捲動的位置

初版 `resize` 監聽無防抖也無條件，**手機網址列一收合就把導覽捲回作用中頁籤**，
蓋掉使用者自己滑到的位置。改為：使用者用手指／滾輪／鍵盤操作過導覽後就不再自動置中；
`resize` 只在**跨過 1024px 斷點**時重算。實測同斷點 resize 不改變位置，跨斷點會重新置中。

### ③ 首頁四階段補回被刪的事實（**階段數不變，仍是 4**）

初版整併時刪掉三處實質內容並弱化一處安全語意，已逐句補回：

| 補回內容 | 屬性 |
|---|---|
| 「隔離電源」（原被弱化為「斷電」） | 安全事實 |
| 「不用單一方式套用所有現場」 | 服務差異化說明 |
| 「確認**固定、接頭、表面**與作業區皆完成整理」 | 驗收檢查項 |
| 「**必要時說明後續觀察期**」 | 止漏後觀察期，抓漏本業最相關的驗收事實 |

以 `main` 的原始六步切出 **27 個實質短語**逐一比對，四階段現在**全數涵蓋、遺漏 0 個**。

### ④-2 導覽門禁改為計算 CSS cascade（2026-08-24 覆審後第二次重做，**目前生效版本**）

> 🔴 **這條斷言前後被證明假綠兩次，根因都一樣：用字串／regex 檢查 CSS。**
> 任何「字串是否存在」的門禁，都能被 specificity、屬性選擇器、複合選擇器或 `!important` 繞過。
> **不要再往這條路上加第三層 regex。**

覆審提出的反例（瀏覽器 computed height 確實變 28px，validator 卻仍 exit 0 並宣稱「最小值 44px」）：

```css
.ld-tab[aria-current="page"] { height:28px!important; min-height:28px!important; padding:0!important }
```

`/\.ld-tab\s*\{/` 只命中「純 `.ld-tab{`」，看不到帶屬性或複合的選擇器，所以完全漏判。

**現在的做法**：新增 `scripts/css-cascade.mjs`（**零相依**——本站沒有 `package.json`，
CI 只跑 `setup-node` + `node`，不能引外部套件），實際解析 `header.js` 的 `const css` 樣板並**計算 cascade**：

1. 解析規則（含巢狀 `@media`、逗號分列、`!important`）
2. 對每個受測 viewport 判定 media 條件
3. 用選擇器比對合成的元素描述（`a.ld-tab.ld-tab--aircon[href]`，以及帶 `.ld-active` +
   `aria-current="page"` 的作用中版本），支援複合／屬性／後代選擇器
4. 依 **specificity → `!important` → 來源順序**決出勝出宣告
5. 實際盒高下限取 `max(min-height, height)`，低於 44px 即失敗，錯誤訊息**印出勝出的選擇器**

`overflow-x` 也改成只解析 `.ld-nav` **自己**算出來的值，無關元件寫 `overflow-x:hidden` 不會誤殺。

**受測範圍**：CSS 內所有 `max-width ≤ 1023px` 的宣告斷點（目前 220／390／420／560／720／1023px），
各取「剛好命中」與「再窄 1px」，另補 320／360／375／390／414／768px，
共 **16 個寬度 × 2 種頁籤狀態**。解析器看不懂的選擇器（`:is()`／`:not()`／`:nth-child()` 等）
**不會靜默放行**，會列為「需人工確認」並讓門禁失敗。

**已知限制**（寫在 `css-cascade.mjs` 檔頭）：不處理繼承、`var()` 求值、`calc()`、
`@container`／`@layer`／style attribute；`:is()/:not()` 的內部 specificity 不精算。

#### mutation test：`scripts/test-mobile-nav-gate.mjs`

門禁會綠不等於門禁有效。這支測試注入 13 種真實繞過寫法，確認該紅的會紅、該綠的不被誤殺：

| 必須攔截 | 必須放行 |
|---|---|
| `.ld-tab[aria-current="page"]` + `!important` 壓 28px（覆審反例） | `.other-component{overflow-x:hidden}`（無關元件） |
| `.ld-tab.ld-active` 複合選擇器壓 28px | media query 改等價空白寫法 |
| `.ld-nav .ld-tab` 後代選擇器壓 30px | 只在**桌機**斷點縮小 `.ld-tab` |
| `a.ld-tab[href]` 標籤＋屬性壓 20px | 手機斷點把觸控區**加大**到 56px |
| 直接改基準規則 44px→30px | |
| `.ld-nav{overflow-x:hidden}`（含 `!important` 版） | |
| `scroll-snap-align` 改 `start` | |
| 置中改回 `scrollLeft` 算式 | |

**結果 13/13 全部符合期望。** 執行 `node scripts/test-mobile-nav-gate.mjs`（測完自動還原）。

#### 與瀏覽器交叉驗證

把覆審反例注入後兩邊分別量測：

| | validator（靜態 cascade） | 瀏覽器 computed style |
|---|---|---|
| 作用中頁籤 | 28px、exit 1、指出勝出選擇器 `.ld-tab[aria-current="page"]` | **28px**（375／414px 皆同） |
| 一般頁籤 | 未標記（≥44px） | **44px** |

還原後，頂層視窗 320／375／414／720／1023px 實測：六個頁籤高度皆 **44px**、
`.ld-nav` 為 `flex` + `overflow-x:auto`、作用中頁籤 `scroll-snap-align:center`。

> ⚠️ **量測陷阱**：用 `<iframe>` 設寬度在斷點邊界（例如 1023px）量測**不可信**——
> iframe 的實際媒體查詢寬度有子像素誤差（實測 MQ 臨界點落在 **1022.98**），
> 會造成 `max-width:1023px` 與 `min-width:1024px` 同時不成立、量到錯誤的 42px／grid。
> **邊界值要用頂層視窗量**；頂層設 1023px 時結果正確（44px、flex、auto）。

### ④ 第一次重做（已被 ④-2 取代，保留紀錄）

初版是 `headerJs.includes(字串)` 的存在檢查，**攔不住真實回歸**。突變測試 6 項只符合 3 項：
觸控區改 30px、`!important` 壓到 28px、`!important` 關掉橫向捲動**全部放行**
（因為 `min-height:44px` 在 `header.js` 出現 6 次、分散 6 個不相干選擇器），純排版改寫則**誤殺**。

改為掃出**所有 `max-width <= 1023px` 的斷點區塊**（目前 6 個），解析 `.ld-nav`／`.ld-tab`
的實際宣告值，取 `min-height` **最小值**比對 44px 下限，並偵測任何斷點內的 `overflow-x:hidden`。
`ok()` 訊息改為輸出實際掃描的斷點清單與最小值，不再宣稱未驗證的事。

修正後突變測試 **7/7 全部符合期望**（含先前漏放的三項與誤殺的一項）。

### 本輪未處理（留給後續）

- **U5 後續矩陣**：預約 modal 已由獨立分支處理；全站其餘小字與觸控區仍需逐頁盤點，
  `.footer-copy` 目前仍 11.5px。不可把本輪 modal 門禁誤寫成「全站已完成」。
- 手機導覽的捲軸被完全隱藏，可發現性靠第 4 個頁籤露出一角，無漸層或箭頭等明確提示。
- **`fonts.ready` 在實體手機上是否有可見跳動：未驗。** 本輪只有無頭／桌面 Chromium，
  沒有實體手機可測。**不得因為桌面測起來正常就宣稱已驗證。**

---

## 1. 專案是什麼

- **品牌**：灰汰郎（清潔與居家到府服務）。舊名「台灣漏水醫生」，2026-07 完成改名。
- **網域**：`leakdoctor.tw`（GitHub Pages，CNAME 檔控制）。網域是舊品牌遺留，目前保留使用。
- **商業模式**：客戶透過 LINE 或網站表單整理需求，由合作服務團隊到府評估與施工；網站同時提供免費居家知識。純諮詢免費、不施工不收費。
- **服務項目與定價錨點**：
  | 服務 | 起價 | 備註 |
  |---|---|---|
  | 冷氣清洗 | 壁掛內機 $1,599／吊隱二風鼓含室外機 $2,799／變形金剛 $2,500；室外機加購 $500 | 窗型需 3 台以上再評估，非固定價；依 bot 正式 catalog |
  | 洗衣機清洗 | 直立式 $1,599／滾筒式 $3,599 | 特殊機型與日立／三菱含烘乾功能需先確認是否承接 |
  | 居家清潔 | 定時 $2,500/4hr、大掃除 $3,500 起（$200-350/坪）、退租 $3,000 起、裝潢細清 $6,000 起（$400-1,000/坪） | 來自業主另一品牌「潔美淨」（0988145875.com.tw）的定價 |
  | 水塔清洗 | 白鐵 $1,599／顆，需確認容量、通道與排水條件 | 水泥／地下蓄水池暫不承接 |
  | 水管清洗 | 大樓／公寓 $3,599、透天 $4,999／戶 | 需確認管材與現場；與漏水檢測分開 |
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
| GA4 評估 ID | `G-1H1X1X9QZE` | `header.js` 開頭 `GA4_ID` 常數；全站事件由 `ldTrack` 統一送出 |
| 灰汰郎線索 API | `https://leakdoctor-bot.a0920077473.workers.dev/api/leads` | `header.js` 的 `LEAD_API`；表單必須先寫 D1 成功，才可開啟 LINE |

## 3. 技術架構

- **純靜態站**，無框架、無打包工具，直接編輯 HTML。部署 = push 到 `main`（GitHub Pages）。
- 根目錄保留 `.nojekyll`，讓 GitHub Pages 直接發布靜態檔案，不執行不必要的 Jekyll metadata build；勿刪除。
- **`header.js` 是全站共用核心**（每頁 `<script src="header.js">` 或 `../header.js` 載入），runtime 注入：
  - fixed header＋6 個主服務頁籤（root 絕對路徑 `/xxx.html`，讓 /articles/ 下也正確）；桌機 Logo 首頁入口與服務頁籤同列等高，手機／平板維持 Logo＋單列橫向滑動服務選項，服務頁會把作用中頁籤置中
  - 右側 LINE 浮動鈕、回頂鈕、手機底部 LINE 預約列；網站不提供公開電話 CTA，也不顯示「加入我們」
  - 六服務專屬色系由 body theme class 與 CSS variables 串接頁籤及頁面 CTA：冷氣青藍、洗衣機紫、居家清潔琥珀、水塔綠、水管靛藍、漏水青綠
  - **預約表單 modal**（`ldOpenQuote(serviceKey)` 全域函式）：姓名/電話/地址/服務卡片/日期時段，送出 → `POST /api/leads` 寫入灰汰郎 D1 → 取得 `HTL-L-*` 線索編號 → 組訊息 → `line.me/R/oaMessage/@478xvlgl/?<encoded>` 開 LINE 預填；API 失敗時不開 LINE，避免需求未落案
  - GA4 載入與事件：`line_click`、`line_direct_click`、`quote_open`、`generate_lead`、`quote_submit`；`generate_lead` 只在 D1 建案成功後送出
  - ⚠️ 全部包在 `ldInit()`，body 未就緒時等 `DOMContentLoaded`——**文章頁在 `<head>` 載入 header.js，改壞這個模式會讓文章頁整個導覽消失**（曾發生）
- 服務頁與地區頁不常駐大型估價器。**2026-08-30 業主新增例外**：首頁提供「清洗知識／價格一覽」雙入口，預設知識；主動切到價格後才顯示跨服務試算與聯絡欄位。原本共用 modal 保留。
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
assets/service-story.css        六大服務頁 hero 下方圖片主題輪播（header.js 自動插入）
assets/illustrations/           AI 生成教育型示意圖（水塔上下水塔、水管清洗效果與風險、空調髒污位置、洗衣機槽背髒污來源）
assets/hero/                    各服務 hero 圖（含居家清潔新清洗情境圖）
assets/og/                      社群分享圖；首頁使用 huitailang-home-service-og-20260715.jpg，各服務頁保留專屬 OG 圖
assets/optimized/               頁面實際載入用小圖（WebP + JPG fallback）；正式頁面不要直接載入 1–2MB 原始 PNG
ads/                             Google Ads 第一階段素材：關鍵字、RSA 文案、否定字、sitelinks/callouts
docs/GOOGLE-ADS-PLAN.md          Google Ads 第一階段投放架構、追蹤設定與上線順序
data/service-options.json     服務快選資料庫（Bot／AI tool call 與網站服務明細的價格來源種子）
cases/                         冷氣、洗衣機、水塔、水管與漏水的匿名化真實案例照（WebP + JPG fallback）
cases-clean/                   潔美淨真實前後對比照（居家清潔目前使用 case03/08/11）
logo/                          完整品牌素材包（logos、social-ads、avatars-icons、manifest.csv）
og-image.jpg                   分享卡（深藍版 og-navy 1200x630）
favicon*.png/ico, apple-touch-icon.png, android-chrome-192.png
sitemap.xml / robots.txt / llms.txt / CNAME
google00a268e494d7ca7a.html    GSC 驗證檔（勿動）
og-image.html                  舊 OG 產生器工具頁（未連結，可忽略）
master_*.jpg                   漏水專業人員頭像；缺圖項目已改為姓名字首頭像
```

### 案例照片上傳與上架 SOP（業主補圖時照做）

**業主上傳方式**
- 請直接上傳原圖，不必先壓縮；一批可以混不同服務，但每組最好附一句說明。
- 一個「案例組」建議包含：清洗前同角度、清洗後同角度、過程照、髒污近照。前後照是必備，過程與近照可選。
- 每組請用文字補充：`服務類型`、`地點城市`、`空間/設備`、`重點髒污`、`是否可公開`。範例：`服務：居家清潔 / 抽油煙機；地點：基隆；空間：廚房；重點：重油污前後；可公開：是，已取得同意。`
- 避免只傳完工美照；網站最需要能看出「髒污 → 處理 → 變乾淨」的差異。

**AI 接圖後處理流程**
1. 先篩圖：模糊、角度差太多、看不出成果、涉及隱私且不好遮的照片先不要上架。
2. 去識別：遮掉人臉、門牌、車牌、地址、客戶姓名、LINE 對話、住戶可辨識物件；移除 EXIF。
3. 裁切三版：案例卡橫圖 `16:10`、前後對比直圖 `3:4`、縮圖 `1:1`。不要把重點髒污裁掉。
4. 壓縮：用內建 Python Pillow 轉 WebP（優先 `quality=78~84`），必要時保留 JPG fallback；單張一般控制在 120–350 KB，OG/hero 可到 600 KB 內，特殊大圖才放寬。
5. 命名與落檔：後續正式案例請放 `cases/<service>/`；舊 `cases-clean/` 先保留，不要破壞現有引用。
6. 上架位置：六大服務頁 hero 下方的圖片輪播由 `header.js` 的 `SERVICE_STORIES` 控制；第三張「清洗前後案例」優先換成真實案例。頁面下方既有案例區再放完整前後對比。
7. 完成後驗證：`node --check header.js`、JSON-LD 解析、正式網址資源 200、手機版輪播可左右滑；再更新本檔並 commit/push。

**建議目錄與命名**
```
cases/
  aircon/
    aircon-001-before.webp
    aircon-001-after.webp
    aircon-001-process.webp
    aircon-001-detail.webp
  washer/
  homeclean/
  range-hood/
  water-tank/
  pipe-cleaning/
  leak-repair/
```

**第一階段各服務補圖數量**
| 服務 | 最低可上線 | 建議量 | 優先畫面 |
|---|---:|---:|---|
| 居家清潔 | 4 組 | 8–12 組 | 廚房油污、浴室水垢、地板、入住/退租 |
| 抽油煙機清洗 | 3 組 | 5–8 組 | 濾網油垢、機身內部、清洗後金屬光澤 |
| 冷氣清洗 | 4 組 | 6–10 組 | 濾網、風鼓黑垢、排水髒水、清洗罩施工 |
| 洗衣機清洗 | 4 組 | 6–10 組 | 內槽拆出、槽背黑垢、洗劑殘留、清洗後 |
| 水塔清洗 | 3 組 | 5–8 組 | 水塔內沉積物、刷洗過程、清洗後內壁 |
| 水管清洗 | 3 組 | 5–6 組 | 黃水前後、濾網沉積、水量改善、設備接管 |
| 漏水檢測與修補 | 6 組 | 10–15 組 | 水痕、儀器檢測、施工中、修補後、測試 |

**最適合下一批先補**
- 第一波請優先補：居家清潔 6 組、洗衣機 4 組、冷氣 4 組。
- 第二波再補：水塔 3 組、水管 3 組、漏水 4–6 組。
- 所有案例文字要克制：只描述「現場狀況、處理範圍、完成後差異」，不要承諾除菌、保固或永久改善。

## 4. Git 狀態與流程

- **正式分支**：`main`；2026-07-13 由 Codex 補齊水塔清洗、水管清洗服務頁、六服務導覽、首頁 root 連結、favicon 與服務圖片輪播。
- **正式網站版本**：GitHub Pages 直接追蹤 `main`；每次 push 後須讀取正式網址確認共用資源版本與互動狀態。
- 慣例：直接開發、清楚的 commit message、`git push -u origin <branch>`；**絕不 force push**；不建 PR 除非業主要求。
- 修改後驗證慣例：`node --check header.js`；以 Node 驗證 JSON-LD、內部連結、四頁流程與禁止字樣；本機網址受瀏覽器安全政策阻擋時，直接使用正式部署標記與真機驗證，不可繞過安全政策。

## 5. 進度紀錄（新條目加在最上面）

### 2026-08-31（Codex・品牌 favicon）
- 依業主截圖，以 `logo/avatars-icons/` 已存在的品牌圖形（刷子、弧線與星芒）取代自行繪製的斜刷子。直接使用既有素材，未生成或重畫 Logo；小尺寸不放「灰汰郎／清潔公司」字樣，以免縮小難辨。
- 根目錄 16／32px PNG、ICO、180px Apple、192px Android、512px 來源同步品牌素材；移除零引用的舊 `favicon.svg`。36 個 HTML 頁面的 favicon cache key 統一為 `20260831-brand`，並補齊漏水指南原本缺少的 16px／Apple／ICO 宣告。既有公開 artifact 根目錄圖片白名單已涵蓋這些檔案，品牌素材包本身仍不公開。
- `test-header-contract.mjs` 新增素材一致性／尺寸、全站引用及舊素材／舊 cache key 突變回歸。未動網站排版、價格、LINE 或後台；本批只做本機修改與驗證，尚未推送、未驗正式站頁籤及真機。
- 驗證：Header／首頁／流程回歸合計 73/73；`validate-site.mjs` 通過（22 頁、33 個 sitemap 網址）；已目視檢查 16／32px 品牌素材。這是素材與本機契約驗證，不等於正式 Chrome 頁籤或真機驗收。

### 2026-08-31（Codex・雙路徑與閱讀節奏）
- 基準`588cde3`。首頁價格／知識選擇移到Hero前並隨瀏覽固定；價格模式隱藏知識長頁，數量／價格同列、型號與限制分層。首頁標題按完整詞組斷行、圖說移到照片下。
- 六服務原段落／價目／h2逐一對照基準，內容不變而順序改為問題與處理→流程限制→案例→價格／預約。居家價目抽成獨立section，原錨點不變；價格捷徑仍在目錄第一項。
- 六項主導覽完整；第二列改較輕的文字目錄、至少44px觸控、原生錨點與scrollspy。沒有啟用休眠`initServiceLayerTabs`的分層隱藏邏輯。
- 業主追加深淺色／空白要求：各服務主色混白7%／13%分章節，價格列4%／9%、相鄰流程與說明有色階；一般章節上下36–60px。照片證據不改圖，不以縮字／截字壓縮頁面。
- 修正首頁body overflow-x:hidden造成sticky失效；使用clip且不壓過modal inline overflow。實測modal焦點移入、背景鎖定、back關閉與焦點返回仍正確。
- 70/70（新增14項、含7項突變），22頁／33 sitemap及21項跨repo價格契約通過；首頁12組尺寸×字級、六服務24組均無文件溢出。390px選壁掛2＋室外1＝3698，切換／back-forward保留；底部按鈕跳現有明細。
- 沿用真實照片新增首頁2組前後對照與3條預約FAQ；6頁原17案例、37段流程全文不減。截圖與測試界線見新交接文件。本輪未改Bot/D1、不送正式LINE、不建訂單、不派工；未推main／部署。

### 2026-08-30（Codex・Claude建議只做必要修正）
- 實際基準`cee9b90`比Claude附件`c66b61a`新。案例長標籤已有修正，不重做；Bot路徑是工作區差異，保留Codex的`../huitailang-bot`並補Claude的`../leakdoctor-bot`用法，不改資料夾或檢查腳本。
- 手機水管圖說與LINE浮鈕字框交疊44.03px：720px以下隱藏重複浮鈕，保留底部兩CTA（實測各48px高）；價格模式1023px防護維持。只改polish CSS與其cache key，不改LINE素材／連結／提交流程。
- 對四類短標題加balance、三類短說明加pretty，不改字級／原文／寬度。七頁24px×375／768／1440，加七頁16px×375，共28組，指定8類文字未再量到行尾孤字，六導覽與零水平溢出維持；不代表全站正文或真機全部通過。
- 價目卡UI原本正確，只補::before勝出content／display檢查與突變。新增8測試（含5突變），56/56；瀏覽器在375／768px、24px根字級核對居家／水管共44個欄名，皆對應data-label且可見。資料及截圖在`design-plans/CLAUDE-NECESSARY-2026-08-30/`。
- 不改Bot、D1、GA與派工，不送正式訊息。真機／舊瀏覽器／Bot A/B維持待辦；前兩輪「無溢出／特定詞組不拆行」並不等於所有文字零孤字。

### 2026-08-30（Codex・追加案例與地區截圖修正）
- 基準 `c66b61a`。業主再指出居家／洗衣機案例圖文錯位，以及漏水地區的碎裂斷行與不一致圖示；沒有把上一輪測試綠燈當成全站視覺已完成。
- 六服務共17張實拍案例使用 `data-case-gallery` 與較寬的專用容器；同排媒體統一4:3、圖片 contain 保留全幅，不修改原圖與前後方向。欄數依閱讀寬度調整，窄版改單欄，不再硬塞三欄或藏在橫滑列。
- 標題改 h3，使用 subgrid 對齊同排標題／中繼文字／正文；不截字、不設固定文字高度。中繼文字精簡為「現場實拍／已去識別」，移除沒有地點資訊卻使用定位圖示的歧義。手機保留24px左右邊距。
- 漏水地區保留原有19個縣市、時效與離島排除；改語意清單保留完整地名、統一定位圖示與底部安排說明。容器依可用寬度／字級呈4／2／1欄。
- 本機Chrome：六服務×375／768／1024／1440px×16／24px根字級，再補320px＋24px，共54組；無頁面／案例文字溢出、破圖、同排圖文起點差異超過1px、地名拆行。滑桿鍵盤End／Home分別讀到100%／0%。截圖與JSON在 `design-plans/CASE-REGION-2026-08-30/`。
- 新增7項門禁（含4個突變）；流程檔23＋Header9＋首頁16＝48項全綠，結構22頁／33 sitemap及跨repo21品項契約通過。這仍不是iOS／Android／LINE真機驗收；未改Bot或觸發正式訊息／訂單。

### 2026-08-30（Codex・精修交接定稿，僅文件）
- 更新 `docs/CODEX-EDITORIAL-REVIEW-2026-08-30.md`：固定本輪差異 `faa59aa..53065b5`，補入功能 commit 與 Pages run #44（33305228880）成功證據。
- 補齊可直接提供 Claude 的唯讀提示詞：逐頁視覺／段落／流程／導覽、回歸命令、突變檢查、findings格式與正式系統操作限制。
- 本次只改交接文件與本檔，不改網站或 Bot；真機、正式接單與 Bot A/B 仍未完成，待辦不因文件交付而勾選。

### 2026-08-30（Codex・截圖缺陷綜合精修：流程／文字／表格／案例）
- 依業主連續截圖，首頁及六服務頁改為「現場照片＋垂直作業序列」。短摘要常駐、完整原文以原生 details 展開；保留首頁四階段、居家三個預約步驟、其餘五服務各六步，不刪斷電、排水與觀察期說明。
- 新增 `assets/process-editorial.css`，移除流程重複卡框與低對比號碼；正文 16px（手機 .95rem）並尊重放大字級。用既有真實照片，不新增或生成假案例。
- 修正強制 nowrap 的 Hero 標題、雙欄最小寬與間距；水塔兩案例改同一 4:3 圖框，保留拖曳比較方向；居家／水管表格按詞組換行，960px 以下改附欄名的直式資料卡。截圖另抓到 legacy grid!important 讓 th 欄名直排，已覆寫並補測。
- 手機頁內目錄保留完整標籤並橫滑；目錄實高同步 ResizeObserver／字體載入。漏水「提供的服務」改為短段落說明，不再是三張看似可點的卡片。未啟用休眠的 service-layer 分頁。
- 新增 `scripts/test-process-editorial.mjs`：16 案，含 5 個突變驗證，納入 CI；既有首頁 16、Header 9、結構 22頁/33 sitemap、跨 repo 21品項契約通過。視覺量測與截圖詳 `docs/CODEX-EDITORIAL-REVIEW-2026-08-30.md`。
- 僅修改前台；無正式訂單、LINE 訊息或派工。Bot A/B 與真機驗收待辦維持，不因 UI 通過而視為解決。

### 2026-08-30（Codex・六大服務與最後複核）
- 業主本輪明確回答「六大項」，覆蓋早先四項決策。Header 恢復水塔／水管，六頁各有正確選取狀態；桌機同列，手機橫滑，Logo 保持首頁品牌入口。
- LINE 浮鈕改用官方未改動 PNG、移除手繪與重複文字並保持靜態；底部保留空間由 ResizeObserver 實測，含 safe-area。價格模式手機隱藏浮鈕，避免遮住數量與說明，保留原 LINE CTA。
- 修正部分非 modal 小字、首頁標題過窄及平板 Hero 擁擠；尊重使用者根字級，不把 Chrome 24px 字體設定改掉。針對根字級 16px／24px 與模擬 safe-area 34px 做分開驗證。
- 本機 Chrome 七頁 × 375／768／1440 檢查無水平溢出；mobile bar/body 為 69/69px，safe-area 模擬為 103/103px。實際點選水塔→水管→返回、modal 返回關閉與焦點歸還、首頁價格↔知識保留數量及 3,698 元試算正常。這不是 iOS／Android／LINE 真機驗收。
- 新增 `scripts/test-header-contract.mjs`（9 案，含 5 個故意破壞的變異案例）並進 CI；首頁 16 案、結構 22 頁/33 sitemap、跨 repo 21 品項契約通過。完整證據與 Claude 提示詞見 `docs/CODEX-FINAL-REVIEW-2026-08-30.md`。
- Bot 本輪未修改：以真實函式＋本機 SQLite 再次重現 A 草稿修改被吃掉、B working_lead 重複。`scripts/audit-bot-handoff.mjs` 是缺陷重現工具，exit 0 不代表缺陷修好，不可當成 CI 綠燈。
- 更正歷史宣稱：service-layer 分頁目前因只掃 body 直屬節點而未啟用；native 目錄 hash 跳轉可用，但第二／第三層分頁不能宣稱通過。未啟用真實派單，也未寫入潔美淨 LINE ID。

### 2026-08-30（Codex・Claude 審查交接，僅文件）
- 新增 `docs/CLAUDE-REVIEW-HANDOFF-2026-08-30.md`，列出功能 `43c28fd`（基準 `e5a5fa8`）的修改對照、價格來源、驗證證據、可重現命令與審查格式。
- 功能部署 run `33284989144` 的 check／deploy 皆成功；正式站已確認雙入口與 NT$3,698 試算。本輪只補文件，不改網站或後台程式。
- 明列待審：建案／LINE鏈、逾時重送、靜態價格與承接同步、加購依賴、單位語意、真機剪貼簿／深層連結、history／焦點、隱私與測試盲點。待審項目不等於已確認缺陷。
- 更正驗證邊界：12項首頁測試含 mock D1 橋接；跨 repo 檢查只跑真實 catalog／parser，沒有執行正式 D1 建案或 LINE 確認／派工。請 Claude 先只讀審查，不自行建正式訂單或部署。

### 2026-08-30（Codex・首頁雙入口＋跨服務互動試算）
- `index.html` 首屏提供「看價格・即時試算／先看清洗知識」；`#knowledge-overview` 保留六服務知識入口，`#price-overview` 為價格子頁狀態，支援網址直達、返回／前進及鍵盤左右鍵／Home／End。原四階段安全流程完整保留。
- 新增 `assets/home-service-hub.css/js`：21 個可詢價品項、6 種分類篩選、0–20 數量輸入／加減、跨分類保留選擇、清空、逐項小計；12 種固定價與9種需報價分開，純待報價顯示「待報價」，混合只顯示已定價小計。
- 公開價目核對 `leakdoctor-bot main@3a5b94e src/catalog.ts`，不使用舊 `data/service-options.json`；供應商成本 `-1` 不是客戶售價。水泥水塔等未承接品項不列入，現行後台允許人工派單的項目仍可詢價。
- 「只複製明細」不向後台送出資料、不建立案件、不送轉換事件；若客戶已填聯絡欄位，會一併複製至剪貼簿。「複製並開啟 LINE」需稱呼＋手機，地址／時段選填。透過 `header.js` 的 `ldCreatePriceInquiry` 橋接既有 D1 API、來源追蹤及 LINE ID，成功取得 `HTL-L-*` 後才開 LINE；失敗保留選擇與欄位、不開 LINE、不送 `generate_lead`（逾時時伺服器是否已寫入仍需另外確認）。
- 訊息逐行使用既有 `服務內容：品名 × 數量` 協定；Bot 會以正式 catalog 重新計價，不信任前台價格。API 目前最多12行明細，因此單次最多12種品項（非12台），超過時明確提示分次詢問，避免默默截斷。
- 手機有固定小計／查看明細入口；價格模式隱藏會遮住加號的回頂浮鈕。表單與控制文字至少14px、輸入16px、觸控至少44px，保留 reduced-motion。
- 驗證：新增12項價格／路由／D1橋接測試進入 CI；另以 `node scripts/check-home-bot-contract.mjs ../huitailang-bot` 直接執行21品項真實 Bot parser 對照與混合訊息／線索編號檢查（不連線、不建單）。既有手機導覽13/13、modal20/20與22頁／33網址結構檢查通過。桌面瀏覽器320／375／768／1440響應式檢查、返回／鍵盤切換、跨分類選擇、複製三項明細與純待報價實測；實體手機 LINE 傳送／正式預約未代客測試。
- 維護時價格變動須同步此模組與測試；首頁 JS 不存客戶個資至 localStorage，也不將聯絡資料送往 GA。

### 2026-08-30（Codex・AI-skill UI/UX 全站精修＋LINE 視覺同步）
- 完整讀取 `Campcool/AI-skill` 的 `uiux-design/SKILL.md`、Improve UI／Baseline UI／Accessibility／Motion／Metadata 參考技能，並以 `DESIGN.md` 與 `docs/FRONTEND-CRAFT.md` 作為品牌約束；稽核紀錄在 `design-plans/GRAYWOLF-UIUX-2026-08-30.md`。
- 新增 `assets/uiux-polish.css` 作為最後載入的跨頁精修層：統一焦點、字級、閱讀行長、卡片層級、服務專屬色、首屏圖片、表單、固定底部 CTA、輪播觸控區與 reduced-motion；不再把覆寫分散到各頁。
- 首層固定導覽重新收斂為四個高頻服務大項：冷氣、洗衣機、居家清潔、漏水檢測與修補。水塔、水管仍保留首頁入口與完整服務頁，於導覽層歸入水路／漏水相關服務；桌機四等分，手機單列滑動且作用中頁籤置中。
- Header 改用 `website-header-logo-640x240`，品牌標誌維持非按鈕外觀並放大；新增鍵盤「跳到主要內容」，所有頁面保留 fixed header＋runtime spacer，1024／1440 與 375／768 實測無溢位。
- 預約視窗改為「整理需求，LINE 接著聊」：選填標籤、隱私文案、送出按鈕與說明層級統一，仍沿用原有案件 API、焦點循環、Escape／手機返回關閉與服務明細漸進揭露。
- 修正首頁重複 `aria-label`、偏廣告式「一站搞定」與角色不清文案；全站 LINE 大小寫統一，移除 CTA／footer 的電話 emoji，主要服務頁改用可驗證的專員確認與服務邊界說明。
- 輪播圓點保留 8px／24px 視覺，但實際觸控區升至 44px；漏水長輪播手機隱藏密集圓點，只留明確前後按鈕。八條核心路由於 375 與 1440 實測：零水平溢位、零破圖。
- Bot repo 同輪更新客戶／廠商／業主 LINE Flex：`bubble.size = mega`、移除 emoji 功能圖示、加寬卡片並重整預約成功與完工感謝段落。Bot 23 個測試檔、260 項測試與 TypeScript typecheck 全數通過。

### 2026-08-24（Codex・灰汰郎 UI/UX 結構優化）
- 分支 `codex/ui-polish-gray-wolf-2026-08-24`，基準 `main@ba0dc95`；與公開範圍 draft PR #3 分開施工，**本輪不合併、不切 Pages Source**。
- `header.js`：1023px 以下的六服務導覽由 3×2 改為單列橫向滑動，保留 44px 觸控高度、`aria-current="page"`，並讓服務頁的作用中頁籤自動置中；手機 Header 實測由約 172px 降到 `114.8px`，固定底部 CTA 保留。
- `index.html`／`assets/site-unified.css`：首頁重複的六張通用流程卡整併為「確認範圍／安全準備／分區處理／復原驗收」四階段，原本的斷電、關水電、環境保護、整理與成果測試資訊均保留；六服務卡與三張圖片流程卡不動。
- 服務卡說明、價格、按鈕、承諾文字與 Footer 連結提升至至少 14px；服務卡按鈕、Footer 連結、回頂按鈕補到至少 44px，並把兩處不明確的 transition 改為指定屬性。
- `DESIGN.md` 同步更新手機導覽與首頁四階段規則。未新增或變更價格、LINE、電話、GA4、服務地區、案例、圖片與其他對外營運事實。
- 驗證：`validate-site.mjs` 新增「手機導覽單列可滑動＋44px」與「首頁恰為四階段」斷言；故意改成 `overflow-x:visible` 並移除 compact class 時正確回報 2 項失敗、exit 1，還原後全綠。`node --check header.js`、完整 validate（22 頁／33 sitemap 網址）、`node scripts/inspect-header.mjs`、`git diff --check` 均通過。瀏覽器實測 375×812／768×900／1440×1000：無水平溢位；Header 分別 `114.8px`／`116.8px`／`78.8px`；中間服務頁籤置中誤差 `0px`；首頁流程手機 1 欄、平板 2 欄、桌機 4 欄；預約 modal 開關正常且未送出資料；console 0 error／0 warning。

### 2026-08-21（Codex・Pages 部署門禁 PR）

依 `Campcool/AI-skill` 的跨倉庫優化專案 P0-1，將 `.github/workflows/site-check.yml`
從純 Site check 升級為 `Validate and deploy to GitHub Pages`：

- PR 仍只跑既有 `validate-site.mjs`、防假綠、`og-image.html` noindex 與 `llms.txt` 常數檢查。
- main push 時必須先通過同一組檢查，才執行 `actions/deploy-pages`。
- 此變更需搭配 GitHub Pages 設定從 legacy branch deploy 改為 GitHub Actions workflow；合併後再切換 Pages source。

本輪只改部署 workflow 與交接文件，未改任何網站內容、LINE、GA4、schema 或素材。

### 2026-08-17（Claude・7 個地區頁補在地內容）

上一項把地區頁放出來索引後，差異度只有 64.6%，偏低。本項補內容拉開差異。

**內容來源的界線（重要，後續維護請沿用）**：本站為代管，業主端目前沒有可用的
實際服務資料。因此新增的內容**只使用公開可查的地理、氣候與建築存量特徵**——
屋齡結構、建築型態、季風與降雨條件、行政區分布。這些是外部事實，可查證。

**不寫、也不可由 AI 補的**：施工案例、服務件數、師傅資訊、客戶評價。
那些是營運事實，沒有來源就編造等同不實廣告。每頁的案例位置已留 HTML 註解
標記（訪客看不到），業主提供素材後補在該處即可。

變更：7 頁各新增一個「{城市}住宅特徵與常見狀況」區塊，內容依各頁 JSON-LD
已宣告的 5 個行政區撰寫，5–6 項不等。例如：
- 基隆：降雨日數導致的持續濕度、山坡地背水面、臨港鹽分腐蝕
- 新竹：九降風的風壓灌水（無風時完全不出現，常被誤判為「時好時壞的漏水」）
- 台中：透天自設水塔、頂樓曝曬、西曬造成的冷氣負荷
- 台北：老公寓外牆與頂樓加蓋交界、坡地社區背水面、巷弄施工動線

成效：頁面差異化斷言的最高相似度 **64.6% → 56.1%**，每頁可見文字約 +1,600 字元。
結構驗證：section/div 標籤全數配對、標題階層無跳級、validate 全綠。

⚠️ 仍待業主提供：實際案例與照片。補上後差異度會再降，SEO 效果也才完整——
目前的內容是「這個地區的房子有什麼特徵」，補案例才會變成「我們在這個地區做過什麼」。

### 2026-08-17（業主決定・7 個地區頁恢復索引）

前一項只消除了「noindex 頁卻列在 sitemap」的矛盾訊號，沒有改索引策略。
本項是業主對索引策略本身的決定：**把 7 個地區頁放出來讓 Google 收錄**。

判斷依據（實測，非推論）：
- 7 頁彼此高度相似，但差異的部分是有價值的在地訊號——各市自己的
  `LocalBusiness` schema（含 5 個行政區）、到府時間（台北 48 小時／
  台中 72 小時）、城市專屬 FAQ（台北問老公寓壁癌、台中問透天頂樓與水塔）。
- title 與 meta description 本來就各市獨立，頁面做得完整，只是被關掉。
- 而整合目標 `leak-repair.html` 裡苗栗只出現 1 次、基隆 2 次——
  「已整合」其實沒有真的發生。

變更內容：
- 7 頁（`taipei` / `new-taipei` / `taichung` / `taoyuan` / `hsinchu` /
  `keelung` / `miaoli`）移除 `<meta name="robots" content="noindex,follow">`。
- canonical 由全部指向 `leak-repair.html` 改為**各自指向自己**。
  原本的寫法是雙重錯誤：noindex 會讓 Google 根本不處理 canonical。
- sitemap 26 → 33（移除 noindex 後由 `update-sitemap.mjs` 自動納入）。
- `areas.html` / `team.html` / `cases.html` **維持 noindex 不變**，
  不在本次決定範圍內。

新增斷言「頁面差異化」（防 doorway pages）：
  兩兩比對所有可索引頁的可見文字，最高相似度超過 75% 即擋下。
  門檻用實測校準：現況 17 頁最高 64.6%（keelung vs taipei），
  純複製只換地名為 78.8%，取 75% 夾在兩者之間。
  ⚠️ 這條斷言初版把地區頁檔名寫死成清單，防假綠測試（複製 miaoli 成
  changhua）當場沒抓到——因為新頁不在清單裡。已改為掃描所有可索引頁，
  沒有清單就不會過時。換相似度算法時必須重新校準門檻。

⚠️ **接下來需要業主投入的內容工作**：7 頁的差異度目前偏低（64.6%）。
放出來能接地區搜尋流量，但若長期維持這個重複度，Google 仍可能判定為
量產落地頁而降權。建議逐頁補該地區的**實際案例照、在地師傅、常見屋型**——
這些是只有業主有的素材，不能由 AI 代寫（寫了就是編造營運事實）。

✅ **Google Search Console 已於 2026-08-17 完成**：sitemap（33 網址）已提交且
狀態「成功」、讀取日 2026-08-17；7 個地區頁已逐一「要求建立索引」。

生效需要幾天到一兩週。確認方式二選一：
- 搜尋 `site:leakdoctor.tw/taipei.html`，出現即已收錄
- GSC「編製索引 → 網頁」報表，「被『noindex』標記排除」的數量會逐漸下降

> 若兩週後仍無動靜，優先查兩件事：頁面差異化斷言的相似度是否惡化
> （目前 56.1%），以及 GSC 的網址檢查是否回報抓取問題。

GSC 存取：`leakdoctor.tw` 與 `blossomkids.tw` 皆已驗證，共用驗證碼
`google00a268e494d7ca7a`（驗證檔在 repo 根目錄，**不要刪**）。
`campcool.tw`、`0988145875.com.tw`、TITAN-STAR 尚未接 GSC。

### 2026-08-17（Claude・交叉複驗：修正前一輪的兩項漏判）

前一輪（2026-08-16 Manus）的方向正確，但有兩處「斷言宣稱的範圍大於實際掃描的範圍」，
本輪修正。兩項都不是行為/瀏覽器層面的細節，是純靜態的斷言設計問題。

- **sitemap 移除 10 個 noindex 頁（36 → 26）**。前一輪的 `update-sitemap.mjs` 依
  「根目錄存在的 .html」列舉，把 `areas / cases / team` 與 7 個地區頁一併收錄。
  這 10 頁全是 `noindex,follow` 且 canonical 指向 `leak-repair.html`，等於同時對 Google
  送出「請收錄」與「不要收錄」，且 noindex 會讓 canonical 永遠不被處理。
  ⚠️ **這推翻了本檔 §6 早已記載的決定**：「舊 cases/team/areas 與地區頁改為 noindex
  並指向整合頁，**且自 sitemap 移除**」。腳本改為主動讀 robots meta 排除 noindex 頁，
  並在輸出印出被排除的清單，不再只印「補收錄 N 個」（把數量多當成品質好）。
- **`validate-site.mjs` 補反向斷言**：原本只驗「檔案 → 有沒有進 sitemap」，
  驗不到「已在 sitemap 的頁是不是 noindex」，所以上一輪製造的狀態它結構上看不見。
  新增 2b 反向檢查，防假綠實測通過（把 taipei.html 塞回 sitemap → 正確 exit 1）。
- **附帶修掉 noindex 偵測的靜默失效**：原本用 `content="noindex"` 精確比對，
  但實際頁面寫的是 `content="noindex,follow"`，比對永遠不成立。已抽成共用的
  `isNoindex()` 容錯版本，`update-sitemap.mjs` 共用同一套寫法。
- **LINE 綠還原為 `#06C755`（業主決定）**。前一輪把 header.js 的 5 處改成
  `#047a36`（白字 5.47:1），但全站另外 80 處（29 個檔案，且都是 `.cta-btn`／`.page-btn`
  等主要轉換按鈕）未動，同一頁出現兩種綠；而當時的對比斷言只讀 `header.js`，
  對那 80 處完全隱形。業主選擇保留 LINE 官方品牌綠，接受白字 2.26:1 未達 WCAG AA
  1.4.3 作為明示的品牌取捨。斷言改為「全站只有一種綠」（掃 49 個 html/css/js，
  報出 86 處的實際分母），防假綠實測通過。
- **新增撰寫規則**（已寫進 `validate-site.mjs` 檔頭）：每條斷言的 `ok()` 訊息
  必須寫出實際掃描範圍與分母（幾個檔案／幾處），不得只寫「完成」或「全域」。
  上一輪三條斷言的漏判，只要把分母印出來當場就會被發現。
- 驗證：validate-site.mjs 全綠（22 頁面、26 sitemap 網址）＋兩項新斷言防假綠實測通過。
- ⚠️ 待業主決定（本輪未動）：那 10 個地區頁該不該長期維持 noindex。地區頁通常是
  本地 SEO 的主力資產，目前全部導回 `leak-repair.html`；若內容夠厚實，值得評估
  取消 noindex 讓它們各自可索引。本輪只消除矛盾訊號，未改變索引策略。

### 2026-08-16（Manus・滿分制第二輪・可及性補強）

- **全站 `prefers-reduced-motion` 統一停用規則**：滿分制盤點發現 38 頁中有 32 頁含 CSS 動畫（109 處 transition、2 組 keyframes），但只有 1 頁有減少動態處理（WCAG 2.3.3）。因動畫分散在各頁內嵌 `<style>`，採單一生效點修法：`header.js` 的 `ldInit` 頭部注入動態 `<style>`（`data-ld-reduced-motion`），使用者開啟減少動態偏好時全站動畫與轉場統一停用；文章頁 `<head>` 載入模式同樣覆蓋。一處修改、全站生效，不碰各頁內嵌樣式。
- **validate 新增斷言**：header.js 必須同時含 `data-ld-reduced-motion`、`animation:none`、`transition:none`、`prefers-reduced-motion: reduce` 四項，防假綠通過（故意移除注入後正確報錯）。
- ~~**sitemap 驗證確認**：`update-sitemap.mjs` 已正確覆蓋 articles/ 16 篇（36 個網址全收錄），本盤點曾誤判漏收，實為檢查指令引號問題，腳本無 bug。~~
  ⚠️ **2026-08-17 更正**：腳本確有 bug——它不排除 noindex 頁。「36 個網址全收錄」不是好事，其中 10 個是 noindex 轉跳頁。
- ~~驗證：validate-site.mjs 全綠（22 頁面、36 sitemap 網址）。~~ ⚠️ 當時全綠是因為斷言只驗單向，看不見 noindex 頁被收錄。現為 26 網址。

- ~~**更新 `sitemap.xml`（26→36 網址）**：areas/地區頁 8 張、cases、team 長期未收錄（sitemap 停在 2026-07-13）。~~
  ⚠️ **2026-08-17 已回退為 26 網址**：那 8 張地區頁 + cases + team 不是「長期未收錄」，是 §6 記載的**刻意排除**（已改 noindex 並整合進 leak-repair.html）。新增 `scripts/update-sitemap.mjs` 依實體頁面與 git 最後修改日重生成的做法保留，但已加上 noindex 排除規則。
- **og-image.html 補 noindex**：工具頁原本可被索引，會污染搜尋結果。validate 新增「工具頁必須標 noindex」檢查（Google 驗證檔維持單行純文字，豁免 noindex 檢查）。
### 2026-08-16（Manus・防回歸驗證＋CI 自動化）
- 建立 `scripts/validate-site.mjs` 品牌事實防回歸驗證（11 項）：sitemap↔實體頁面雙向對應、header.js 常數唯一性（LINE/LINE_OA_ID/GA4_ID/LEAD_API）、全站 LINE 短連結 ID 統一（防露涼社混入）、GA4 無占位假 ID、根/子目錄頁面 header.js 引用路徑一致性、header.js 語法＋ldInit/DOMContentLoaded 結構、表單個資保護文案。
- **刪除根目錄重複頁 `mold-wall-cure.html`**：與 `articles/mold-wall-cure.html` 同題不同版（291/282 行），sitemap 只收 articles 版且根目錄版引用 `../header.js` 在根目錄會 404；AI-README §7 成長批次待辦的「刪重複頁」於此次完成。validate 的「根目錄頁引用 ../header.js 硬錯誤」規則正是抓住此殘留。
- 建立 `.github/workflows/site-check.yml`：push/PR 自動跑 validate＋CI 內建**防假綠步驟**（故意破壞 header.js 常數再恢復，確認 validate 能抓住）＋og-image noindex＋llms.txt 常數一致性。防假綠本地驗證通過。
- **header.js（62KB/25 函式）本次不拆**：辯證結論——全部函式在同一 IIFE scope 互相引用（ldTrack 被表單提交用、detailCatalog 被 renderServiceDetails 用），拆模組會破壞文章頁 <head> 載入模式或需改造 global bridge，風險>收益；靜態站 62KB 單檔解析成本可接受。
- 驗證：validate-site.mjs 全綠（22 頁面、26 sitemap 網址）＋防假綠通過＋workflow 建立。

### 2026-07-23（Claude・服務卡改版＋光掃放慢延伸）
- 依業主真機回饋調整首頁六服務卡：
  - **卡片內部同服務色系極淡填滿**：`@supports color-mix` 下 `.svc-card[data-service]` 背景 = `color-mix(accent 7%, #fff)`；不支援時退回白底。邊框維持既有粗細。
  - **icon 與標題改同一行**（icon 左、標題右）：新增 `.svc-head` flex 容器包住 `.svc-icon`＋`.svc-title`（6 張卡 HTML 均改）。
  - **icon 與標題放大**：`home-refresh.css` 的 `.svc-icon` 42→60px、內部 `.craft-icon` 27→34px、`.svc-title` 1.15→1.4rem（皆 `!important`，因 home-refresh 原本就用 !important 壓著）。`home-refresh.css` cache key `20260719a→20260723a`（僅 index.html 引用，bump 一處）。
  - **內文潤飾斷句**：6 張卡 `.svc-desc` 改為兩句、用 `<br>` 明確斷行，敘述更清楚。
- **光掃頻率放慢＋延伸到服務頁**：
  - 首頁 Hero 光掃 `ld-shine` 由 4s→8s（不要那麼頻繁）。
  - 各服務頁「立即預約／估價」CTA（`body.service-page .page-btn/.mid-cta-btn/.cta-btn`、`body.leak-page .hero-btn/.cta-btn`）新增 `ld-shine-slow` 8s 光掃，放進 `craft.css`；同色白光掃過、`z-index:-1` 在服務色底上文字下。全部包 `prefers-reduced-motion`。
  - **`craft.css` cache key `20260720e→20260723a`**：已同步 7 個 HTML `<link>` ＋ `header.js` 兩處 runtime upgrade（共 9 處）。
- 驗證：`node --check header.js` 通過；`index.html` `<style>`（105/105）、`craft.css`（259/259）、`home-refresh.css`（78/78）大括號平衡；6 張卡皆含 `.svc-head`；無殘留舊 cache key。

### 2026-07-23（Claude・首頁導入 galaxy 品牌化點綴元件）
- 參考 GitHub `uiverse-io/galaxy`（MIT，3,000+ 純 HTML/CSS 元件）挑選其中兩種常見 pattern，改成灰汰郎品牌色後導入首頁，全部包 `prefers-reduced-motion`：
  - **Hero 主 CTA「加入 LINE 免費初判」光掃鈕**：在既有 LINE 綠鈕上加白色高光掃過（`.hero-btn::before` + `@keyframes ld-shine`，`overflow:hidden;isolation:isolate;z-index:-1` 讓高光在底色上、文字下）。減少動態時停止掃光，只留 hover 上浮。
  - **六大服務卡轉動漸層邊框**：`.svc-card::before` 用 `conic-gradient` + `mask` 疊出邊框光環，角度由 `@property --ld-angle` 驅動（`@keyframes ld-rotate`），顏色吃 `craft.css` 既有的 `--service-accent`（青藍/紫/琥珀/水塔藍/靛藍/青綠）。**桌機 hover 才觸發並旋轉**；減少動態時顯示靜態彩邊不旋轉；`@property` 不支援的舊瀏覽器自動退回不顯示、不破版。**手機／觸控（`@media(hover:none)`）改為常駐靜態彩邊、不旋轉不閃**，並用 `@supports color-mix` 漸層加分、不支援時退回實色邊。
- **改動範圍僅 `index.html` 內嵌 `<style>`**，未動 `header.js`／`craft.css` 等共用檔，故**未動任何 cache key**；HTML 為 GitHub Pages 直發，部署後即生效。
- 驗證：`node --check header.js` 通過、`index.html` `<style>` 大括號平衡（96/96）、`git diff --stat` 僅 index.html。
- **未做**：galaxy Loaders（表單送出／開 LINE 瞬間的極簡 loader）——需改共用 `header.js` 送出流程（易壞區），且「按了即跳 LINE」情境收益低，暫緩，待業主確認前兩者後再單獨處理。

### 2026-07-20（Codex・透明滿版刷子 favicon）
- 移除舊 favicon 的白色方底、外圈與星光，改為單一深灰／青綠刷子符號；透明底主體邊界約占畫布寬 93%、高 88%，提升 16–32px 分頁圖示辨識度。
- 更新 `favicon.svg`、`favicon-source-512.png`、`favicon-16.png`、`favicon-32.png`、`favicon.ico`、`apple-touch-icon.png` 與 `android-chrome-192.png`；PNG 均保留 alpha 透明通道。
- 全站 37 份 HTML 的 favicon cache key 由 `20260713d` 升為 `20260720e`，避免瀏覽器與 LINE 沿用舊圖示。

### 2026-07-20（Codex・Hero 口號斷句與節奏統一）
- 首頁及冷氣、洗衣機、居家清潔、水塔、水管、漏水六服務頁的 Hero 主標，統一為無標點、固定兩行的完整句子；不再交由容器依寬度任意斷句。
- 依服務情境改寫成上下句押韻或近韻：懂／用、霧／除、淨／心、清／精、足／路、準／穩；水塔口號另改為「水塔污垢洗得淨／日常用水更安心」。
- 首頁流程大標改為「不是隨便洗一遍／每個步驟看得見」，移除引號、逗號與行尾孤立標點。
- 新增共用 `.headline-line` 固定行結構並將 `craft.css`、`header.js` cache key 升為 `20260720e`；以 1536×900 桌機及 390×844 手機逐頁驗證，七頁均為兩行且無水平溢出。

### 2026-07-20（Codex・服務照片素材入庫與前台套用）
- 新增 `assets/service-photos/`，保存冷氣、洗衣機、居家清潔、水塔、水管與漏水檢測六類素材；每類包含 1200×628 橫式及 1200×1200 方形 JPG。
- 六個服務頁 Hero 已換成對應橫式照片，首頁 Hero／冷氣／洗衣機／漏水流程卡亦使用對應照片；生成圖一律標示為流程示意，不取代或冒充真實案例。
- 六個服務頁 `og:image`／`twitter:image` 已改為各自專屬照片，OG 尺寸統一 1200×628 並補齊 `image/jpeg`。
- 已以 1536px 桌機與 390×844 手機視窗檢查首屏；圖片裁切、固定 CTA 與文字區未發現遮擋。

### 2026-07-20（Codex・清潔前後滑桿角標修正）
- 確認滑桿圖片順序本身正確：`after` 圖由左側揭露、`before` 底圖保留在右側；錯誤來自共用角標位置仍為左前右後。照片未換位，僅將角標統一改為左「清潔／清洗後」、右「清潔／清洗前」。
- 共用修正涵蓋冷氣 1 組、洗衣機 1 組、居家清潔 3 組與水塔 2 組，共 7 組真實前後對比；角標加大並加入 2px 白邊、高對比底色、文字陰影與外陰影。
- 本機抽查 1440px 水塔頁與 390px 居家清潔頁，標示方向均與照片內容一致、沒有遮住中央拖曳把手，瀏覽器錯誤為 0；共用 cache key 升為 `20260720d`。

### 2026-07-20（Codex・第二／第三層導覽辨識度調整）
- 放大六個服務頁的第二層區段按鈕與第三層分支按鈕；桌機捲動收合後實測約為 46px／42px，手機約為 49px／38px，第三層仍略小於第二層以保留階層關係。
- 同步放大字級、按鈕左右留白、第三層分支標籤與 sticky bar 內距；保留服務專屬色、作用中流光與捲動時微收合行為。
- 以 1440×900 與 390×844 檢查 `homeclean.html#homeclean-cases`，兩種寬度皆無頁面水平溢出；共用 `craft.css` 與 `header.js` cache key 升為 `20260720c`，首頁與六服務頁同步更新。

### 2026-07-20（Codex・真實案例照片上架與手機案例列修復）
- 從業主本機 `灰汰郎案例照片` 篩選 18 張原始實拍，重新編碼移除 EXIF，以中性檔名輸出 WebP＋JPG 至 `cases/<service>/`；網站與 git 均未帶入客戶姓名檔名。
- 冷氣上架 1 組可拖曳前後照＋2 張既有前後合併照，並移除誤用的居家清潔 `cases-clean/case04`。
- 洗衣機上架 1 組可拖曳前後照＋2 張既有前後合併照；水塔上架 2 組可拖曳前後照，照片均由頂部人孔拍攝，未使用錯誤的側開水塔示意。
- 水管上架 3 張「管件堵塞／接頭沉積／作業排出物」現場實拍；因不是同案同角度前後照，頁面明確標示為拆檢或作業紀錄，不宣稱清洗前後。
- 漏水頁上架 3 張「插座異常出水／灌注施工／局部開孔」真實紀錄；六服務 hero 圖片輪播的第三張已改用相對應實拍（居家清潔沿用既有實拍）。
- 修正共用橫向案例 grid 同時保留明示欄位與 auto-column，導致手機第一張卡片曾被壓成約 2px 的問題；現在手機為 280px 橫滑、桌機 2–3 欄，六頁均無頁面級橫向溢出。
- 驗證：`header.js`／`craft.js` 語法、`git diff --check`、37 個 `/cases/` 圖片引用零缺檔；本機瀏覽器檢查六服務頁桌機卡片數與圖片錯誤皆正常，390px 手機抽查案例卡寬 280px、無破圖與頁面溢出。
- 首次部署遭 GitHub Pages API 連續回傳 `503`（程式 build 本身無錯）；純靜態站已新增 `.nojekyll`，後續部署直接發布檔案並略過 Jekyll metadata build。
- 正式站抽查時發現 `header.js` 仍會把 `craft.css` runtime 版號覆寫回 `20260719b`，已同步更新並將 HTML／runtime 的 JS、CSS cache key 統一升為 `20260720b`；後續修改共用檔案時兩處版號必須一起更新。

### 2026-07-19（Codex・前台 P0 轉換路徑與手機首屏）
- 依 Claude 前台審查的 P0 方向執行，但維持目前六服務架構，不合併會刪除水塔／水管頁與新素材的舊分支。
- 共用 LINE 預約表單降低阻力：姓名、電話、服務仍必填；服務地區改為選填，完整地址可在確認預約前補；機型與數量改為明確的選填收合區，未展開時不送出預設明細。後台已支援缺地址草稿與後續補問。
- 首頁 Hero 與手機底部列改為雙路徑：「LINE 直接問／加入 LINE 免費初判」直接開啟官方帳號，「填單估價」再開共用表單；新增 GA4 `line_direct_click`，以 `placement=home-hero|mobile-sticky` 區分直接 LINE 入口，既有 `line_click`／`quote_open`／`quote_submit` 保留。
- 手機 Header Logo 與服務列改成穩定尺寸，預設 spacer 從 130px 調整為接近實際首屏高度，並用 `ResizeObserver` 持續同步 fixed header 與錨點偏移，降低字體／圖片載入後的首屏跳動。
- 首頁六張服務卡改用 `data-service` 明確綁定六組專屬色，價格、查價邊框、預約 CTA 與 hover 邊框都延續該服務色，不再由 `nth-child` 造成第 5／6 項掉色。
- 共用資源快取版本升為 `header.js?v=20260719c`、`craft.css?v=20260719b`；420px 以下的手機底部列隱藏說明文字，兩顆 CTA 平均分寬，避免窄螢幕溢出；服務頁 Hero／中段／底部估價 CTA 與價格文字明確套用各服務主色。
- 已部署功能 commits `ebd362d`、`186f112`、`cf0d7e2`。正式站 390×844 驗證：Header／spacer 同為 172px、文件 `scrollWidth=375` 無橫向溢出、六個服務鍵完整、底部兩顆 CTA 各 175px；表單地址為選填、選服務後機型數量仍收合且可正常展開。水管頁驗證 Hero CTA 與價格文字均為主色 `#0e7490`，七個主入口使用最終快取版本且無破圖；1366×768 首頁 Header 為 79px、六張服務卡色彩正常。

### 2026-07-16（Claude・前台四視角綜合審查 + 業主定案兩決策 → 交接 Codex）
> 由 Claude 在文件分支產出後合入；正文以 Codex 的 main 版為準，本條為交接指標。
- 新增 **`docs/FRONTEND-REVIEW-2026-07-16.md`**：四個獨立視角 AI agent（視覺／CRO／內容／UX）平行審 main 正式版，依「嚴重×成效×成本×共識」做綜合排序（P0 快贏／P1 信任地基／P2 內容對等／P3 精修約 30 項），附 **P0 五項實作建議草圖（參考非要求，含大約行號）**。詳細待辦見 §7「前台優化執行」。
- **四視角一致結論**：流量進得來、卡在「最後一步」——低摩擦入口缺失（表單門檻高／手機無一鍵 LINE）＋信任地基薄弱（全站零評價、清洗頁零保固）＋品牌換血只換一半（新頁自營、深層頁仍舊媒合語氣矛盾）＋四色品牌系統未落實＋手機首屏又擠又慢。
- **業主定案兩決策（全站文案唯一準據）**：
  - **A＝混合式**：清潔/家電由灰汰郎安排團隊、漏水以 FAQ 後媒合廠商；款項灰汰郎收、**驗收成功才付廠商**（當客戶保障賣點）；純諮詢免費不施工不收費，**車馬費只在「到場無法施作」收**（冷氣缺型號/照片、洗衣機螺絲鏽死拆不開、水管檢測既有滲漏客戶不洗）；清掉舊「車馬費代管/平台/$500-2000 分級」語，金額與後端 bot 一致（$500）。
  - **B＝保固**：清洗前正常、清洗後無法運作→灰汰郎負責維修；完工兩週內同問題由負責部門免費重洗＋上門檢修（帶「因清洗導致」邊界）。
- 另同批合入的交接文件：`docs/PARTNERSHIP-LOI-SEEYANGYANG.md`（洗洋洋合作意向書＋價目分潤表）、`docs/GOOGLE-ADS-BUILD-SPEC.md`＋`docs/GOOGLE-ADS-DECISION.md`（Claude 版 ads 對照，正本仍為 Codex 的 `GOOGLE-ADS-PLAN.md`）、`docs/FRONTEND-REVIEW-2026-07-15.md`。

### 2026-07-19（Codex・冷氣／水管症狀型搜尋意圖）
- 冷氣清洗頁新增「室內機結霜／結冰、吹白霧／霧氣、風量變小」客戶情境，並同步更新首屏、meta、OG、可見 FAQ 與 FAQPage schema；明確區分髒污、潮濕凝結、冷媒與零件故障，焦味或異常煙霧要求先停機維修。
- 冷氣頁症狀區加入客戶授權的室內機結霜實照 `cases/aircon/aircon-icing-inquiry-20260719.jpg`；以「實際症狀照片」呈現，不冒充清洗前後案例。另輸出 Google Ads 1.91:1 與 1:1 兩種去 EXIF／GPS 素材於 `ads/assets/`。
- 水管清洗頁改以「熱水器點不著、只有熱水變小、熱水水量／水壓不足」承接實際搜尋意圖，加入冷熱水比較、熱水器濾網／閥件／電池／瓦斯／本體故障分流，避免宣稱洗水管一定能解決點火問題。
- Google Ads 新增 `AG_AirconSymptoms` 與 `AG_PipeSymptoms`，各 9 個 exact／phrase 關鍵字及一組 15 標題／4 描述 RSA；廣告與落地頁共用症狀語言，第一階段不開 broad。
- `llms.txt` 同步補充症狀與服務邊界，讓搜尋引擎與 AI 系統讀到一致內容。

### 2026-07-16（Codex・PC 三層服務導覽比例與路徑識別）
- PC 第一層共用服務列由 88px 卡片縮為 66px，整體 fixed header 高度降至約 79px；Logo 同步縮至 184px 寬，減少頂部留白，手機版 3×2 服務列維持原尺寸。
- 第二層頁內目錄與第三層分支統一使用 1180px 中央軌道；一般桌面高度約為 59px／51px，捲動收合後約為 50px／46px，不再出現第二層過小、第三層偏左或寬度不一致。
- 六個服務主色由第一層作用中頁籤延伸到第二、第三層底線；目前所在的第一、第二與第三層加入白色流光，第三層作用中項目改為實色膠囊，清楚表達可切換與所在路徑。`prefers-reduced-motion` 會停用流光。
- 快取版本更新為 `20260716a`。本機已驗證 1920×1080 水管頁「內容說明 → 流程」定位誤差 2px；1366×768 六服務頁的第二／第三層均置中且無橫向溢出；390×844 手機版水管頁仍可正常切換且無破版。

### 2026-07-15（Codex・第二／第三層互動導覽修正，已部署）
- 正式站部署後實測發現：舊版第二層 scroll-spy 仍會讀取被第三層隱藏的區塊，造成捲動時「價格／案例」選取狀態跳動；點「內容說明」雖已切換內容，第二層卻會立刻被 scroll-spy 搶回，視覺上像只閃一下。
- `assets/craft.js` 已移除第二層的捲動搶選機制，改為唯一的點擊狀態：選取第二層大分類後，才建立並顯示該分類的第三層分支。價格分類沒有子分支時會收起第三層；內容、差異、案例等分類只顯示各自相關細項。
- 第二、第三層維持 sticky；頁面捲過首屏後套用 `service-nav-compact` 微幅縮小高度，並在尺寸 transition 結束後重算 CSS 高度變數，避免兩列錯位或內容被遮住。手機版四項第二層固定為單列，洗衣機長標籤縮為「機型差異」。
- 第三層改成有分類標籤、方形底線子頁籤的視覺，不再與第二層使用同一種膠囊比例。居家清潔的服務地區歸入「實際案例」分支，不混在「內容說明」。
- 修正手機價格表：以高權重規則隱藏 `thead`，避免表頭被後段 grid 規則重新顯示成深色錯排卡片。
- 洗衣機髒污來源、水塔系統、水管清洗效果三張 733×1100 直式資訊圖新增 `fit: contain` 與實際尺寸；手機使用較高的資訊圖容器，不再被 16:9 橫幅 `object-fit: cover` 裁掉文字與上下內容。
- 第三層點擊新增捲動序號鎖：只有最後一次點擊能執行延後捲動，避免前一次圖解／內容切換的雙層 `requestAnimationFrame` 晚到後把畫面拉回舊落點。第三層不再把自動產生的面板 ID 寫進網址；網址只保留第二層分類錨點，按鍵作用中狀態由目前顯示面板唯一決定。
- 快取版本更新為 `20260715g`。本機瀏覽器已驗證六服務頁 390×844：第二層狀態、分支範圍、錨點貼齊、價格表、破圖與水平溢出皆正常；另驗證洗衣機 1365×768 桌面版。此批後續已部署並由正式網址確認。

### 2026-07-15（Codex・首頁社群分享主圖重製）
- 首頁原本沿用 `homeclean-service-og-20260713.png` 多格拼貼圖，縮成 LINE 卡片後主體破碎且大量留白；已改為單一清楚場景的 1200×630 JPEG：師傅使用清洗罩拆洗壁掛式冷氣，排水管與髒水桶清楚可見，背景自然帶到洗衣機。
- 新圖 `assets/og/huitailang-home-service-og-20260715.jpg` 使用 ImageGen 產生實景底圖，再以正式透明 Logo 做固定位置品牌合成；首頁 `og:image`、尺寸、MIME、alt 與 `twitter:image` 已同步更新。服務分頁仍保留各自的專屬 OG 圖。

### 2026-07-15（Codex・服務頁第三層分頁、案例與錨點修正）
- 六個主服務頁改為三層資訊架構：主服務導覽 → 價格／內容／差異／案例頁內目錄 → 深入內容分頁。價格與預約判斷維持優先，流程、知識、差異、案例、FAQ 等長內容改成一次只顯示一組，無 JavaScript 時仍會完整顯示。
- `assets/craft.js` 新增共用第三層分頁與鍵盤左右鍵操作；`assets/craft.css` 新增 sticky 分頁列、作用中狀態與手機版樣式。漏水頁原有的大量內容也沿用同一套分層，不再一次全部向下展開。
- 修正第三層錨點：切換內容後會等待版面重排，再依主導覽、第二層目錄與第三層分頁的實際高度計算落點；第二層連到隱藏內容及網址直接帶 `#錨點` 時，也會先開啟正確分頁再定位。
- 手機價格表改為緊湊卡片；超過四筆的價目表預設收合並提供「看完整報價項目」，桌面版維持完整表格。
- 居家清潔頁精簡預約說明與流程，新增 3 組已去識別真實服務前後對比（`case03`、`case08`、`case11`），手機可橫向瀏覽，桌面三欄呈現。
- 全站共用資源快取版本更新為 `20260715e`。部署前已通過：全站 JavaScript 語法、JSON-LD、CSS 括號、主要頁重複 ID／本機資源引用、`git diff --check`；瀏覽器驗證六服務頁 390×844 與居家清潔 1365×768，無破圖、無水平溢出，第三層落點正常。
- 已部署 `main` 功能 commit `7bfe813`。正式站六個服務頁皆載入 `craft.js?v=20260715e`，第三層切換與錨點正常、無水平溢出；六張新案例圖片正式網址均回應 200，首頁維持 `https://leakdoctor.tw/`，不會導向 `/index.html`。

### 2026-07-15（Codex・Google Ads 第一階段啟動包）
- 建立 `docs/GOOGLE-ADS-PLAN.md`：定義 Google Search 第一階段架構，先投高意圖搜尋，不先開 Performance Max / Display / YouTube；主轉換為 GA4 `quote_submit`，`quote_open` / `line_click` 僅作 Secondary 觀察。
- 依 Google 官方文件整理追蹤 SOP：Google Ads 與 GA4 需連結、Google Ads 開啟 auto-tagging、GA4 `quote_submit` 需標記 key event 後匯入 Google Ads；GCLID 不可在導向流程中遺失。暫不直接安裝 `AW-XXXXXXXXX`，因尚未提供 Google Ads Conversion ID / Label。
- 新增 `ads/google-ads-keywords.csv`：第一波 Campaign 分為清潔核心、用水/漏水高意圖、品牌保護；涵蓋冷氣、洗衣機、居家清潔、水塔、水管、漏水與品牌詞。
- 新增 `ads/google-ads-rsa.csv`：7 個 ad group 的 RSA 文案，每組 15 headlines + 4 descriptions；已用 PowerShell 自檢標題 ≤30 字、描述 ≤90 字。
- 新增 `ads/google-ads-negative-keywords.txt` 與 `ads/google-ads-assets.md`：共用否定字、sitelinks、callouts、structured snippets 與 UTM template。
- 尚未實際進 Google Ads 後台建立 campaign；下一步需要業主提供每日預算、Google Ads Customer ID、是否授權 AI 直接操作帳號。

### 2026-07-14（Codex・首屏標注與價格表資訊密度調整）
- 依業主 LINE 真機截圖修正首屏三個標注：`trust-badge` 不再於手機被 `service-refresh.css` 改成直排純文字，改由 `craft.css` 統一覆蓋為膠囊備註，避免冷氣頁「環境保護／依機型拆洗／復原後測試」看起來像散落文字。
- 參考洗洋洋服務總覽的資訊密度（簡短分類與服務入口，不使用厚重分段卡片），手機版價格表改為更緊湊的資料列：第一格作為服務項目標題，後續欄位才顯示「報價方式／預約前請提供」等標籤。
- 修正 `enhancePriceTables()` 執行時機：服務頁的 `header.js` 可能在表格尚未解析完成時先執行，現在會在 `DOMContentLoaded` 後再補一次 `data-label`，避免手機價格卡片缺欄位標籤。
- 首頁與六大服務頁的 `header.js` query 升到 `v=20260714c`，`header.js` 內部載入 `craft.css?v=20260714b`，降低 LINE 內建瀏覽器吃舊版 CSS/JS 的機率。

### 2026-07-14（Codex・服務輪播圖重做與手機版錯排修正）
- 依業主真機回報修正六大服務頁輪播：每個主要服務改用同一套「為什麼需要洗／怎麼洗／清洗前後或完工確認」框架，可左右滑、按鈕切換與 4 秒自動輪播；輪播已取代價格區下方的舊單張說明圖，避免重複。
- 新增 `assets/service-story/` 壓縮圖組（WebP + JPG fallback）：冷氣、洗衣機、居家清潔、水塔、水管、漏水各一張。水塔圖特別改為正確的上方圓蓋開口水塔，不使用側邊開門版本。
- 首頁與六大服務頁的 `header.js` query 升到 `v=20260714b`；`header.js` 會自動把舊 `craft.css` 版本升級到 `v=20260714a`，並把 `service-story.css` 升到 `v=20260714b`，降低 LINE 與手機瀏覽器載入舊版 CSS/JS 的機率。
- 手機版價格表改為卡片式欄位呈現，由 `enhancePriceTables()` 自動把表頭寫入 `data-label`；修正水管清洗三欄報價表在窄螢幕變成難讀直排的問題。
- 手機版隱藏右側浮動 LINE 圓鈕，保留底部 LINE 預約列；回頂鈕位置上移，避免遮住輪播與價格內容。LINE 內建瀏覽器開啟預約 modal 時不再寫入 history state，降低返回／切頁無反應風險。

### 2026-07-14（Codex・服務輪播與 LINE 瀏覽器載入修正）
- 依業主回報修正服務頁圖片輪播：`header.js` 的 `SERVICE_STORIES` 改成同一個單張框架，可左右按鈕、手動滑動、圓點切換，並在非 reduced-motion 環境每 4 秒自動輪播。
- 新增 `assets/optimized/`，把 1.7–2.5MB 的 AI PNG 轉成頁面用 WebP/JPG fallback；洗衣機說明圖從約 2.2MB 降到約 124KB WebP。OG 圖仍保留原路徑，避免影響 LINE 分享預覽。
- 洗衣機與冷氣首屏不再載入 `assets/process-images.css` 內嵌大型 base64 圖，改用壓縮外部圖，降低 LINE 內建瀏覽器進頁空白或卡住風險；漏水頁仍使用該 CSS，後續若要優化再單獨處理。
- 正式站文案移除「後續補圖」「照片待補」「更有說服力」等內部設計語氣，水塔、水管、洗衣機案例區改為客戶可閱讀的完工確認重點。
- 驗證：`node --check header.js` 通過、`git diff --check` 僅 CRLF 提示、本機 `washer.html` 與壓縮圖 HTTP 200；Playwright 套件缺 `playwright-core`，本輪未完成截圖級瀏覽器驗證。

### 2026-07-14（Codex・交接文件完善）
- 補齊案例照片上傳與上架 SOP：明確定義「一組案例」應包含清洗前、清洗後、過程照與髒污近照；業主上傳時需補服務、地點、空間、重點與公開授權狀態。
- 補上 AI 接圖後的標準流程：篩圖、去識別、裁切、Pillow 壓縮 WebP、命名落檔、替換 `header.js` 的 `SERVICE_STORIES` 輪播，以及頁面案例區完整前後對比。
- 補上第一階段各服務建議案例數：居家清潔 8–12 組、抽油煙機 5–8 組、冷氣 6–10 組、洗衣機 6–10 組、水塔 5–8 組、水管 5–6 組、漏水 10–15 組；下一批優先居家清潔 6 組、洗衣機 4 組、冷氣 4 組。
- 修正交接文件裡過期資訊：正式網站版本更新為 `b87f610`，GA4 已填入 `G-1H1X1X9QZE`，不再列為業主待辦。

### 2026-07-13（Codex・水塔／水管服務頁補齊）
- 依業主指示補上 `water-tank.html` 與 `pipe-cleaning.html`，參考洗洋洋服務分類但不複製文案或素材；兩頁皆採「價格／報價規則 → 內容說明 → 差異說明 → 實際案例」順序。
- 共用 `header.js` 從四服務改為六服務導覽，新增水塔清洗、水管清洗主題色、modal 服務選項、頁面對應與服務明細；手機導覽改為 3×2。
- 既有 `aircon.html`、`washer.html`、`homeclean.html`、`leak-repair.html` 調整為價格優先；`homeclean.html` 保留抽油煙機清洗為居家清潔內的單項加強清潔，不再混入水塔／水管。
- `data/service-options.json` 增補水管清洗 group 與 intent mapping；`llms.txt`、`sitemap.xml`、`about.html` 與主要頁 footer 同步六服務入口。
- 新增 `assets/service-landing.css` 供水塔／水管頁共用；並加入四張 AI 生成教育型示意圖：上下水塔功能、水管清洗效果與老舊管線風險、空調髒污位置、洗衣機槽背髒污來源。實際案例區先放待補照片 placeholder，後續可接業主提供圖片。
- 依業主即時回饋放大 header 六服務頁籤文字、縮小 icon 比例，讓文字成為主要視覺；四張教育示意圖移到價格區下方強化轉換，並移除水塔頁 hero 下方空白資訊框。
- 補入 GA4 `G-1H1X1X9QZE`；水塔、水管、居家清潔新增 AI 生成 hero 圖，水塔／水管頁首屏恢復與其他服務頁一致的左文右圖尺寸，並修正水管頁右側空白框。
- 全站首頁入口統一指向 `/`，避免內部導覽產生 `https://leakdoctor.tw/index.html`；同步將 favicon／apple-touch icon 改為灰汰郎品牌素材並加上 `v=20260713d` 版本參數，以降低瀏覽器快取到舊藍色圖示的機率。
- 依業主回饋重做首頁分享與居家清潔 OG／hero 圖：新增 `assets/og/homeclean-service-og-20260713.png` 與 `assets/hero/homeclean-cleaning-hero-20260713.png`，改為清潔人員處理抽油煙機、地面與浴室的直覺服務照片。另新增 `assets/service-story.css`，由 `header.js` 在六個主服務頁 hero 後自動插入「為什麼需要洗／怎麼洗／清洗前後案例」圖片主題輪播，位置在價格區之前；後續業主補實拍案例時，只要替換 `header.js` 的 `SERVICE_STORIES` 第三張圖即可。

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
  > ⚠️ **2026-08-17 部分推翻**：7 個地區頁已恢復索引（業主決定，見 §5）。
  > 原因是整合並未真的發生——`leak-repair.html` 裡苗栗只出現 1 次、基隆 2 次，
  > 而各地區頁有自己的行政區清單、到府時間與專屬 FAQ。等於把有在地訊號的頁
  > 關掉，再指向一個幾乎沒提到那些城市的頁。`cases.html`／`team.html`／
  > `areas.html` 維持 noindex 不變。
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
- **成長批次**：GA4 佔位與轉換事件；4 篇清潔文章；潔美淨真實案例照上服務頁；12 篇舊文加快速答案；「漏水百科」→「居家百科」；fonts preconnect；~~刪重複頁 knowledge-1/mold-wall-cure-1~~（2026-08-16 Manus 已刪根目錄 mold-wall-cure.html 重複頁）；llms.txt

## 6. 已知陷阱（改壞過的地方，小心）

1. **header.js 的 ldInit/DOMContentLoaded 模式不可拆**——文章頁在 head 載入，拆了導覽會全站消失。
2. **導覽連結必須 root 絕對路徑**：首頁用 `/`，服務頁用 `/aircon.html` 這類 root path；相對路徑在 /articles/ 下會 404，站內入口不要再產生 `/index.html`。
3. **LINE 連結不可隨意替換**：業主有多個事業（露涼社等）各有自己的 LINE。曾把露涼社連結誤換到全站（未推送即攔下）。**換任何 lin.ee 連結前必須向業主確認該連結屬於灰汰郎。**
4. 價格改動同步點：頁面價目表、JSON-LD Offer、llms.txt、首頁服務卡、`header.js` 的 `SERVICE_DETAIL_CATALOG`、`data/service-options.json`。
5. 雲端 session 容器會被回收：**成果要盡早 commit+push**，別累積大量未提交修改。
6. `.ld-tab` 目前應為 **6 個主服務大項**（冷氣、洗衣機、居家清潔、水塔、水管、漏水檢測與修補），依 2026-08-30 業主最新決定。1023px 以下維持可橫向滑動單列；水塔／水管有獨立 active，不要又縮回四項。
7. `initServiceLayerTabs()` 目前只掃 body 直屬節點，內容在 main 內，實際沒有產生 `.service-layer-tabs`。不可照歷史文件宣稱已啟用。若後续修復，須完整驗證 hidden、hash、history、焦點與 sticky 偏移，不要只改 selector 就啟用休眠程式。

## 7. 待辦清單

### 🔑 只有業主能做（AI 請勿代做，可提醒）
- [x] GA4 已提供並填入 `header.js`：`G-1H1X1X9QZE`
- [ ] 在 GA4 Web 資料串流建立 Measurement Protocol API secret，存入灰汰郎 Worker Secret `GA4_API_SECRET`；未設定前，官網 `generate_lead` 正常，但 `working_lead`／`qualify_lead`／`close_convert_lead` 不會送出。
- [ ] LINE 官方帳號顯示名稱仍是「台灣漏水醫生_百科全書」→ 到 manager.line.biz 改名「灰汰郎」
- [ ] 建立灰汰郎的 Google 商家檔案（現存搜尋結果掛美國電話 +1 407-917-1773 的商家檔案不是業主的）
- [x] ~~Google Search Console 提交新 sitemap＋對 7 個地區頁請求重新索引~~
      **2026-08-17 已完成**（sitemap 33 網址、狀態成功；7 頁皆已送出索引請求）。
      生效需幾天到一兩週，確認方式見 §5 該輪紀錄。
- [ ] 觀察 7 個地區頁的收錄結果（約 2026-08-24 之後再看）。若未收錄，
      先查差異化相似度（目前 56.1%）與 GSC 網址檢查的抓取狀態。
- [ ] **業主提供地區實際案例與照片**。7 頁已預留 HTML 註解標記位置，
      建議格式：地點（行政區）／屋型與屋齡／症狀／處理方式／前後照片。
      ⚠️ 案例、件數、師傅、評價屬營運事實，**不可由 AI 代寫或推估**。
      目前頁面寫的是「這個地區的房子有什麼特徵」（公開可查的地理與氣候事實），
      補上案例才會變成「我們在這個地區做過什麼」——後者才是轉換素材。
- [ ] （選）`areas.html`／`team.html`／`cases.html` 目前仍 noindex。
      `team.html` 有 18 位師傅、`cases.html` 約 40,540 字，都是獨立且不重複的
      內容，被關掉有點可惜。要不要放出來是獨立決定，本輪未動。

### 🟠 高價值，AI 可做
- [x] **本機完成首頁雙入口／緊湊試算／六服務閱讀節奏**：同色系深淺、較緊留白、文字式目錄、完整詞組斷句；70項測試。詳`docs/CODEX-MOBILE-READING-2026-08-31.md`。
- [ ] **本輪交付後審查與上線**：Claude唯讀覆核；依業主後續授權推main／部署；不得把本機完成寫成已上線。
- [ ] **本輪真機／LINE webview**：首屏雙入口、數量留存、鍵盤與抽屜返回；舊瀏覽器color-mix／clip／subgrid降級與真實CLS/LCP／轉換率均待驗。
- [x] **Claude必要修正**：手機重複LINE浮鈕遮字、指定大字短文換行、價目欄名測試缺口；路徑差異補文件、不盲目替換。詳`docs/CODEX-NECESSARY-FIXES-2026-08-30.md`。
- [ ] **閱讀節奏強化（R1–R5）**：首屏零數字／價格藏在點擊後、桌機 CTA 中段空窗 39–80%、
      FAQ 只有漏水頁在做異議處理、水管價格口徑不一致（**需業主裁決**）、痛點位置不一。
      完整重現數據、最小修正與驗收要求見 `docs/CLAUDE-READING-RHYTHM-2026-08-30.md`。
      方法論出自 `Campcool/AI-skill` 的 `uiux-design/SKILL.md`〈閱讀節奏與資訊順序〉。
- [ ] **本批真機與舊瀏覽器覆驗**：720px浮鈕／底部兩CTA、放大文字、price-label與balance／pretty降級；桌面28組不等同真機驗收。
- [x] **追加案例／服務地區修正**：六服務17張案例的寬度與圖文對齊、19個漏水服務縣市的完整斷行；54組桌面模擬尺寸通過，真機仍待驗。
- [ ] **Claude 追加複核**：最新檢查 `c66b61a..main` 的案例／地區修正，含subgrid降級、contain全幅、手機24px邊距、縣市不變及未啟用service-layer的既有邊界；不要只審舊的 `53065b5`。
- [x] **截圖版面綜合精修**：七頁流程、首屏欄距、居家／水管詞組與手機表格、水塔案例對齊、漏水說明與手機目錄；交接見 `docs/CODEX-EDITORIAL-REVIEW-2026-08-30.md`。
- [ ] **Claude 複核本輪視覺改動**：提示詞已定稿於上述文件，審查 `faa59aa..53065b5` 並核對最新 main；尤其確認 CSS 載入順序、放大字級、中文詞組及原生 details。真機／LINE webview 仍須獨立驗收。
- [x] **六大項 Header／官方 LINE／底部安全區**：本輪必要修正與 Chrome 模擬回歸完成，詳 `docs/CODEX-FINAL-REVIEW-2026-08-30.md`；真機未驗。
- [ ] **Bot A/B 優先修正**：同客戶修改草稿就地更新、維持 public_id、相同內容去重；working_lead 只在首次轉換發送。已重現但本輪未改 Bot，禁止用新增訂單規避去重。
- [ ] **service-layer 分頁初始化與文件落差**：目前原生頁內目錄可用，第二／第三層分頁未生效；先確認預期互動後修復並加 history／焦點回歸。
- [ ] **實體手機／LINE webview 驗收**：包含 24px 放大字、價格返回與逾時重送、鍵盤／安全區、剪貼簿及 LINE 跳轉。正式 D1、GA4 DebugView、潔美淨綁定另需安全操作及業主授權。
- [x] **Claude 審查交接文件**：最新截圖精修以 `docs/CODEX-EDITORIAL-REVIEW-2026-08-30.md` 為準；Header／LINE與Bot缺陷邊界仍見 `docs/CODEX-FINAL-REVIEW-2026-08-30.md`，更早交接保留歷史用途。
- [ ] **Claude 獨立複核首頁價格功能**：先審 `e5a5fa8..43c28fd` 與目前 main 差異，按附件輸出具證據的 findings；確認修正範圍後再實作。真實 LINE 建案／確認／派工測試另需業主授權。
- [x] **首頁知識／價格雙入口**：跨服務數量試算、固定價／待報價區分、複製明細、D1 成功後 LINE 交接、手機小計入口與測試門禁。
- [x] **前台轉換 P0**：地址選填、機型數量收合、首頁／手機雙 CTA、`line_direct_click`、手機 Header CLS 與六服務卡配色已於 2026-07-19 完成。
- [x] **2026-08-30 UI/UX 全站精修**：四大項固定導覽、跨頁 polish layer、LINE modal、輪播觸控區、首頁文案、LINE Flex mega 卡片及 375／768／1024／1440 複核完成；詳本輪進度與 design plan。
- [ ] **前台優化 P1–P3 — 依 `docs/FRONTEND-REVIEW-2026-07-16.md` 排序**：P1 信任地基（真實評價、清洗保固、商業模式敘事、可開發票、首屏效能）→ P2 內容對等（cases/team/knowledge 清潔素材、水塔水管價錨案例、漏水文章漏斗、地理統一）→ P3 精修。業主定案 A／B 收費與保固口徑為必守準據。
- [x] **廣告投放前視覺改版 P1**：首頁＋冷氣／洗衣機／抓漏首屏、DESIGN.md、流程示意與知識型 OG；2026-07-11 已部署並完成正式網址驗證。
- [ ] **視覺改版 P2**：延伸至居家清潔、地區、案例、百科與文章頁；建立真實案例／流程示意的圖片標示規格
- [ ] **galaxy 點綴元件延伸**：首頁已導入 Hero 光掃鈕與服務卡漸層邊框（2026-07-23）。可評估：(a) galaxy Loaders 接入送出流程；(b) 六服務頁 Hero CTA 沿用同款光掃；(c) 服務卡漸層邊框效果推廣到服務頁與地區頁卡片。導入時一律套品牌色 + `prefers-reduced-motion`，並注意共用檔 cache key 同步。
- [x] **廣告啟動包 P0**：已建立 Google Ads 第一階段投放架構、關鍵字、RSA 文案、否定字、assets 與追蹤 SOP（`docs/GOOGLE-ADS-PLAN.md` + `ads/`）。
- [ ] **Google Ads 帳號設定 P1**：連結 GA4、開啟 auto-tagging、將 `generate_lead` 設為 GA4 key event 並匯入 Google Ads Primary conversion；`quote_submit` 保留相容觀察，`quote_open` / `line_click` / `line_direct_click` 設 Secondary。後續累積足夠資料後，再以 `qualify_lead` 或 `close_convert_lead` 作更深層優化，避免重複計算主要轉換。
- [ ] **Google Ads 上線 P2**：業主確認每日預算、Google Ads Customer ID、投放地區後，建立 Search campaigns；第一階段不開 PMax/Display/YouTube。
- [x] **LINE Bot P1**：2026-07-11 驗收通過並上線（詳 BOT-PLAN 驗收報告）。剩 PARTNER_LINE_USER_ID 待業主設定
- [x] **LINE Bot P2**：夥伴回報、完工、車馬費、逾時／D-1／今日提醒與戰情室程式已完成；仍待 PARTNER_LINE_USER_ID 與管理 Secrets
- [ ] **cases.html / team.html 清潔化**：目前案例頁與師傅頁內容 100% 漏水主題，與清潔主業錯位。加入清潔案例（cases-clean/ 還有 case02/03/06/08-11 未用，在 `Campcool/0988145875` repo 的 cases/），師傅頁加清潔技師
- [x] **第一波真實案例上架**：2026-07-20 已完成居家清潔 3 組、冷氣 3 組、洗衣機 3 組、水塔 2 組、水管現場實拍 3 張、漏水現場實拍 3 張；均已匿名化並有 WebP＋JPG。
- [ ] **第二波案例補強**：優先補冷氣、洗衣機、水塔各 1–3 組同案同角度前後照；水管需補可確認為同案的出水水色／水量前後，漏水需補修補完成與測試驗收照。AI 依 §3 SOP 處理，勿把單張症狀照宣稱為前後成果。
- [ ] 更多清潔文章（水塔清洗、水管清洗、除塵蟎、冷氣省電、大掃除清單…），照 articles/ 現有 4 篇清潔文的模板
- [ ] 剩餘地區頁（宜蘭？台中以南？）——先問業主服務範圍再做

### 🟡 中低優先
- [x] Header 採 fixed＋等高 spacer；2026-07-19 補上穩定手機尺寸與 `ResizeObserver`，避免初始高度與載入後高度不一致
- [x] 第二／第三層 sticky 導覽已於 2026-07-20 放大並完成桌機、手機與收合狀態驗證。
- [x] 7 組真實前後滑桿角標已於 2026-07-20 統一修正為左「後」右「前」，並放大高對比顯示。
- [x] 首頁與六服務頁 Hero 口號已於 2026-07-20 統一為無標點固定兩行，完成桌機與手機逐頁驗證。
- [x] 全站 favicon 於 2026-08-31 依業主要求改用既有灰汰郎品牌圖形，取代 2026-07-20 的斜刷子；同步各尺寸、ICO 與 36 頁 cache key。
- [ ] **品牌 favicon 上線覆驗**：待授權推送後確認首頁、六服務頁、文章頁與 Chrome 頁籤；舊分頁／書籤可能仍有瀏覽器快取，不宣稱更新 query 可清除所有裝置快取。
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
