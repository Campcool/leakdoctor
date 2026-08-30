# Claude 審查結果與修正｜首頁價格總覽（2026-08-30）

回應 `docs/CLAUDE-REVIEW-HANDOFF-2026-08-30.md`。審查範圍 `e5a5fa8..43c28fd`，
審查當下 main：前台 `a442073`、後台 `3a5b94e`（後台已比交接文件所寫更新，本次首頁功能未動 bot 功能碼）。

## 1. 審查結論

**價格鏈本身是正確的。** 未採信交接紀錄與測試綠燈，另外自建端到端驗證：
把前台 `formatMessage` 產生的訊息真的餵進 bot 的 `parseWebsiteForm`，
再複刻 `buildWebsiteDraft` 的逐項計價段重算金額。8 種情境
（壁掛＋室外機、吊隱＋室外機、純加購、固定價＋待報價混合、純待報價、
商用洗衣機、居家清潔多次、水塔＋透天水管）**前台小計與後台重算完全一致，
21 個標籤全部對得到 catalog，線索編號存活**。前台 21 品項與
bot `bookableServiceIds()`（24 − 3 個水泥水塔）數量完全吻合。

沒有發現金額算錯、待報價被當 0 元、供應商成本外洩或不承接品項外洩。

找到並修正 2 個 P1、6 個 P2。以下逐項說明。

## 2. 已修正

### P1-1 送出成功後表單完全解鎖，可重複建案並重複計轉換
**原碼**：`assets/home-service-hub.js` submit handler 的 `finally` 無條件
`root.querySelectorAll('input,button').forEach(c => c.disabled = false)`。

**實測重現**（Chromium 375×812，`/api/leads` 攔截為假回應，`lineBase` 指向同頁 hash
模擬手機開 LINE 後返回）：送出成功後 DOM 實測
`{line:false, copy:false, name:false, qty:"2"}` —— 全部解鎖且內容原封不動，
再按一次 **`leadCalls` 由 1 變 2，產生第二筆線索**。

**影響（已查證，非推測）**：`web_leads` 是被動紀錄，建立時**不發 LINE 通知、
不通知廠商、不建訂單**（訂單只在客戶實際送出 LINE 訊息、`getWebLeadForClaim`
認領後才產生）。客戶只會送出一次訊息，所以**不會產生重複訂單或重複派工**。
真正的影響是**轉換灌水**：`ldCreatePriceInquiry` 內的 `generate_lead` 與
`quote_submit` 會跟著再送一次，而 `quote_submit` 正是 Google Ads 匯入的主要轉換，
在 NT$4,000／月的預算下會直接扭曲 CPA 與出價。另外戰情室線索清單會多一筆孤兒、
IP 速率限制（12 次／窗口）多消耗一次。

這也是相對既有 modal 的**行為退步**：modal 只在 catch 內解鎖，成功後
`hideQuote()` 收起，返回時按不到。

**修正**：加入「內容指紋」`signature()`（選項 id:數量 ＋ 四個聯絡欄位）。
送出後記錄指紋；指紋未變＝同一筆需求，送出鈕維持 disabled 並保留結果訊息；
**客戶改了任一數量或欄位才解鎖成新的一筆**。不是永久鎖死，避免擋掉正當的二次詢價。
聯絡欄位補上 `input` 監聽，改欄位也會重算鎖定狀態。

**連帶修正**：`updateSummary()` 原本無條件 `status.textContent = ''`。實測逾時後
只要調一次數量，「目前無法確認需求已儲存」的警告就被清空 —— 客戶失去
「可能已建案」的提示，反而更容易重送。改為依同一組指紋保留上次結果訊息。

### P1-2 冷氣標籤宣稱「室內外機」，但售價只含室內機
業主 2026-08-30 確認：**壁掛與吊隱的售價都只含室內機，室外機一律加購 $500／台。**

原 catalog 標籤為「吊隱式冷氣清洗（二風鼓，室內外機）」，等於對客戶宣稱室外機已內含；
實測選「吊隱×1 ＋ 室外機×1」得 NT$3,299，客戶會覺得被重複收費。
（該標籤的由來是更早為了修別名碰撞，把「含室外機」改成「室內外機」，
但兩者對客戶讀起來都像已內含。catalog 註解裡的「含室外機」指的是**廠商成本**，
不是售價，這點原本沒寫清楚。）

**修正（bot repo）**：
- `src/catalog.ts` 標籤改為「吊隱式冷氣清洗（二風鼓，室內機）」，
  註解寫明「售價只含室內機／1,800 是含室外機的廠商成本，不可拿來對客宣稱」。
- `aircon_outdoor_unit` 註解補「兩種機型要洗室外機都要加購」。
- `src/knowledge.ts` 室外機答案補「壁掛與吊隱的清洗價都只含室內機」。

**修正（前台）**：同步標籤，並把說明改為
壁掛／吊隱「價格只含室內機；室外機另列加購」、
室外機「壁掛與吊隱都需另加購」。

**更名的副作用（已驗證）**：Codex 在 `findServiceOption` 加了同分歧義防護，
更名後查「室內機」兩種主機同分 → 回 undefined 觸發追問。
掃描全部 24 個品項的 id／label／alias **皆能正確回到自己**；
「室內機」單獨出現本來就分不出機型，改由 bot 追問比先前靜默選壁掛（$1,599）更安全。

### P2 一覽

| # | 修正 |
|---|---|
| P2-1 | 欄位標籤是「希望時段」，訊息卻輸出 `希望日期：`。parser 兩個別名都吃、功能無誤，但客戶在 LINE 看到的欄位名與填寫時不符 → 訊息改為 `希望時段：` |
| P2-2 | 待報價項目在 services 陣列排在固定價之前（窗型 index 6 < 直立式 index 9），`calculate()` 照陣列順序輸出，導致 parser 用第一行推出的訂單主服務變成待報價品項（實測「直立式×1＋窗型×2」訂單標題為窗型）→ `calculate()` 改為固定價在前、待報價在後，與畫面順序一致 |
| P2-3 | 跨 repo 契約檢查**不比對單位**（測試盲點）→ 加入單位比對，前後台刻意不同的 7 項列入 `UNIT_EXCEPTIONS` 具名例外並附理由，其餘漂移即失敗 |
| P2-4 | `DESIGN.md:121-123` 仍寫「主導覽固定六項／桌機七入口／六個頁籤」，實測導覽只有四項 → 更正為四項＋五入口，並註明水塔與水管保留獨立服務頁 |
| P2-5 | `@media(max-width:640px)` 內三條字級宣告被同檔 `#service-hub :is(...)` 的 ID 權重壓過，實際無效 → 移除死宣告，並在覆寫區塊加註「這裡權重較高，媒體查詢再寫字級不會生效」 |
| P2-6 | `.knowledge-route-card/-grid/-link/-icon`、`.quote-item/-list/-toggle` 七個 class 在 HTML 與 JS 零引用（知識面板實際沿用既有 `.svc-card`）→ 移除，CSS 144 → 127 行 |

## 3. 審查中確認「不是缺陷」的項目

避免下一輪重查。以下皆已實測：

- **手機字級與觸控**：375px computed 實測 —— 聯絡輸入 16px、`.qty-value` 16px、
  送出／複製鈕 16px 高 50px、`.qty-btn` 44×44、說明 14px、無橫向溢出、無 pageerror。
  （我原本讀 CSS base 值 `.86rem` 以為會觸發 iOS 縮放，實際被 ID 權重覆寫區塊救回來，交接文件的宣稱成立。）
- **只複製不建案、不送轉換**：實測 `leadCalls = 0`、無轉換事件、剪貼簿**不含線索編號**。
- **12 種上限**：選 13 種 → 警告顯示、送出被擋、`leadCalls = 0`；與 `normalizeWebLead` 的 `.slice(0,12)` 對齊。
- **失敗與逾時**：HTTP 500 與伺服器不回應（實測 8.9s）皆不開 LINE、不離開頁面、
  數量與聯絡資料完整保留，文案是「無法確認需求已儲存」而非謊稱沒寫入。
- **待報價起價非杜撰**：3,500／3,000／6,000 皆來自 catalog 的 `pricing.reason`。
- **不承接品項未外洩**：catalog 有、前台未列的正好是 3 個水泥水塔類，與 `NOT_ACCEPTED_SERVICE_IDS` 一致。
- **供應商成本未外洩**：前台服務陣列只有售價欄位。
- **`check-home-bot-contract.mjs` 的 Node 版本**：交接文件說需 Node 24、不在 Node 22 CI 中執行 ——
  實測 **Node v22.22.2 可以跑**（`stripTypeScriptTypes` 已可用）。這條限制敘述可放寬，納入 CI 是可行的。

## 4. 測試補強（含防假綠驗證）

`scripts/check-home-bot-contract.mjs` 新增四類斷言，並實際做突變測試確認會紅：

| 突變 | 結果 |
|---|---|
| 單位改掉（`次`→`回`） | ✅ 抓到 |
| 待報價排到第一行 | ✅ 抓到 |
| 標籤改回宣稱含室外機 | ✅ 抓到 |
| 售價漂移（1599→1499） | ✅ 抓到 |

`scripts/test-home-service-hub.mjs` 12 → 16 條，新增：待報價排序、
冷氣說明只含室內機、希望時段欄位名、純待報價不得出現 NT$0。

bot repo `tests/catalog.test.ts` 新增「冷氣售價只含室內機」三條
（標籤不得宣稱含室外機、室外機是獨立加購、查室外機不可被主機標籤攔走）。

## 5. 全部門禁

| 指令 | 結果 |
|---|---|
| `node --check header.js` / `assets/home-service-hub.js` | OK |
| `node --test scripts/test-home-service-hub.mjs` | **16/16** |
| `node scripts/validate-site.mjs` | 22 頁／33 sitemap |
| `node scripts/test-mobile-nav-gate.mjs` | 13/13 mutation |
| `node scripts/test-modal-accessibility-gate.mjs` | 20/20 |
| `node scripts/check-home-bot-contract.mjs ../leakdoctor-bot` | OK（Node 22） |
| bot `npm run typecheck` | 綠 |
| bot `npm test` | **263/263（23 檔）** |
| bot `scripts/check-frontend-contract.mjs` | 綠 |
| 自建端到端（前台訊息 → bot parser → 重新計價） | 8/8 金額一致 |
| 自建 Chromium 實測 375×812 | 字級／觸控／溢出、只複製、建案、重複送出、12 種上限、失敗、8 秒逾時、修正後回歸 |

所有 `/api/leads` 與 `line.me` 請求都以 Playwright route 攔截為本機假回應。
**未打到正式 Worker、未建立正式訂單、未送出 LINE 訊息、未通知廠商。**
測試用姓名一律「測試用勿派工」。

---

## 6. 交接 Codex：尚未驗證項目（可整段作為提示詞）

以下是本輪**確實沒有驗證到**的部分，缺的是真機與正式環境，不是沒查。
不要當成已通過；也不要只因為門禁全綠就跳過。

### 我的環境限制（請先確認你的環境是否相同）
本輪執行環境**沒有正式後台憑證，對外網路被政策擋住**
（egress proxy 對 `workers.dev` 與 `leakdoctor.tw` 回 403 CONNECT），
因此無法打 `/health`、`/api/service-availability`，也無法查正式 D1。
所有驗證都在本機伺服器＋Chromium＋攔截假 API 完成。
若你的環境可連外，請把下列項目實際跑過再回報，不要沿用本文件的結論。

### 待驗證清單

1. **真機與 LINE 內建瀏覽器**（最重要，本輪完全沒碰）
   iOS Safari／Android Chrome／**LINE webview** 的：剪貼簿權限失敗路徑、
   `line.me/R/oaMessage/` 深層連結、LINE app 未安裝、長訊息是否被截斷、
   從 LINE 返回後的 bfcache 狀態。
   特別是 **P1-1 的修正要在 LINE webview 覆驗**：我用桌面 Chromium 模擬 375px，
   webview 保留頁面狀態的行為可能不同；請確認返回後送出鈕仍為 disabled、
   狀態訊息仍在、改動數量後可正常送新的一筆。

2. **正式 D1 與 LINE 端到端**
   本輪未呼叫正式 `/api/leads`、未在 LINE 按傳送、未驗證正式確認卡／派工／廠商通知。
   要驗請先提測試資料與可能外部影響給業主確認。重點：
   混合服務的 `service_lines` 是否全數保留、`web_lead_id` 是否被正確認領、
   `linkWebLeadToOrder` 後 `working_lead` 是否只送一次。

3. **逾時後伺服器是否真的已寫入**
   前台收到錯誤不等於 D1 沒資料，這點前台無法判定。
   請查 `web_leads` 或 Worker log，確認 8 秒逾時的實際落地率。
   若確實會出現「已寫入但前台顯示失敗」，建議加冪等鍵
   （既有 modal 流程同樣沒有，屬共通問題，不是本次首頁功能引入）。

4. **GA 實際事件**
   我的 harness 中 `gaEnabled` 為 false，`gtag` 探針收到 0 筆。
   P1-1 的「轉換重複計算」是依 `ldCreatePriceInquiry` 內兩行 `ldTrack`
   加上實測 `leadCalls = 2` 推得，**未在啟用 GA 的環境實際觀測到雙筆事件**。
   請在 GA4 DebugView 確認：只複製不送事件、建案成功才送、修正後不再重複送。

5. **後台 `3a5b94e` 的 LINE Flex 卡改動**
   交接文件列為回歸範圍但不屬首頁功能，我只讀了 catalog／parser／leads 相關部分，
   **沒有審查該 commit 的 Flex 卡視覺與互動**。

6. **多品項訂單在 bot 端的下游**
   本輪只驗到 `buildWebsiteDraft` 的計價段。確認卡渲染、派工佇列顯示、
   月結凍結金額（`freezeOrderSettlement`）都沒跑。

7. **靜態快照的維護流程**
   首頁價目是版本化靜態快照（來源 `3a5b94e` 的 `catalog.ts`），**不是即時 API**。
   `check-home-bot-contract.mjs` 現在會抓標籤／價格／單位／狀態漂移，
   但它**不在 CI**。實測 Node 22 可跑，建議評估納入 `site-check.yml`
   （需要 clone bot repo，與 bot repo 既有的 `check-frontend-contract.mjs` 對稱）。

8. **本輪修正引入的新行為，請覆核設計是否合意**
   「改動任一數量或聯絡欄位才解鎖送出鈕」是我的取捨：
   既擋掉同內容重複送出，又不擋正當的二次詢價。
   若業主希望更嚴格（例如一律要求重新整理），請改。

### 不要回退的決策
- 冷氣售價**只含室內機**，室外機一律加購（業主 2026-08-30 確認）。
  標籤與說明不得再出現「室內外機」或「含室外機」；契約檢查會擋。
- 成本 `-1` 是個案議價，不是負售價，也不是自動隱藏；`0` 才是不承接。
- 供應商成本不得對外顯示。
- 待報價項目不得以 0 元併入總價。
- 只複製不得送出轉換事件；取得線索編號才計 `generate_lead`／`quote_submit`。
- 對客文字不得使用「媒合」或「轉真人」。
