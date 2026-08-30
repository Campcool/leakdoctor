# 六大服務最後複核與 Claude 交接

日期：2026-08-30（Asia/Taipei）

## 1. 結論與範圍

**前台本輪必要修正完成；不代表前後台所有缺陷皆已通過。**

- 前台基準：`f14ed48bc1f30935b0a7f5b8589227eec0729100`。
- Bot 基準：`bc648a80be725cfb4112ee8180df235dda2e6c66`，本輪沒有修改或部署 Bot。
- 業主最新明確決定是「六大項」：冷氣、洗衣機、居家清潔、水塔、水管、漏水檢測與修補。覆蓋先前四項決策，後續審查不要再移除水塔／水管首層入口。
- 本輪經授權分析必要性後修改前台並推 main。交接 Claude 的預設工作是獨立審查；正式訂單、LINE／廠商通知及新的部署請另確認授權。
- A 草稿修訂與 B working_lead 重複仍存在，見 §5。**不建議把本輪當成放量投廣告或端到端驗收已完成。**

必讀：本文件、`AI-README.md`、`DESIGN.md`、`docs/CLAUDE-REVIEW-RESULT-2026-08-30.md`；Bot 的 `AI-README.md`、`BACKEND-HANDOVER.md`、`docs/DISPATCH-CANCELLATION-2026-08-30.md`。歷史紀錄不能取代程式與實测。

## 2. 本輪修改

| 項目 | 必要性／處理 |
|---|---|
| 六服務主導覽 | 原本四項，水塔／水管頁被標為漏水 active；改回六項與獨立 aria-current。桌機七入口含 Logo 同列，手機橫向滑動。 |
| 水塔、水管圖示 | 同一 SVG sprite 新增對應容器／管路圖示，不再共用水滴／工具圖示。 |
| LINE 品牌素材 | 移除死碼 LINE_ICON、手繪 LINE_FLOAT_ICON、重複 LINE 文字，改為官方原始 PNG；圖示靜態、外框也不持續脈衝。 |
| 底部內容遮擋 | 原 body 66px、bar 69px；含 34px safe-area 時 bar 103px。改以 ResizeObserver 實測 bar 高度，同步 CSS 自訂屬性。 |
| 手機價格模式 | 浮動 LINE 會遮住價目說明／數量區，該模式隱藏浮鈕，保留底部與明細內 LINE CTA；不影響其他頁浮鈕。 |
| 寬度與字級 | 首頁 H1 不再受 10ch 窄欄限制；手機標題可換行、平板 Hero 不強塞雙欄；精準提升輔助文字下限，未全站強制根字級。 |
| 圖說 | 圖片說明改實色白底，避免透明底疊在照片上看不清。 |
| 文件／門禁 | 更新 DESIGN、AI-README，新增 9 項 Header 門禁並進 CI。 |

使用 AI-skill UI/UX improve-ui 的方法先檢查既有畫面、資訊層級和可點擊狀態，再做小範圍修正；未重做品牌、價格、派工或文案承諾。

## 3. LINE 官方素材來源

- 品牌下載及使用規範：<https://www.line.me/en/logo>
- 官方下載：<https://www.line.me/static/logo/top/LINE_Brand_icon.zip>
- 壓縮檔內的 `LINE_Brand_icon.png` 未修改內容；repo 路徑 `assets/brand/line-brand-icon.png`，22,239 bytes。
- SHA-256：`5e93437eb5ec0dcdece92d1562fcd435d1d521cca5c013d2d9e15b544a1d8a39`。
- 顯示圖示 48×48px，點擊容器 64×64px；保留比例、原色及官方字形。沒有新增 LINE 字樣，也沒有重繪或 AI 製作商標。
- 官方禁止對圖示加動畫不等於整個網站不能有動畫。本輪採保守靜態呈現，沒有推定「只動外框一定獲准」。原本灰汰郎 LINE URL 沒有變更。

## 4. 已驗證的範圍

### 4.1 Chrome 響應式檢查，不是真機

七頁：`/`、`/aircon.html`、`/washer.html`、`/homeclean.html`、`/water-tank.html`、`/pipe-cleaning.html`、`/leak-repair.html`。

| 條件 | 頁數 | 文件水平溢出 | Header／spacer | 固定列／body 保留 |
|---|---:|---:|---:|---:|
| 375×812，根字級 16px，safe-area 0 | 7 | 0 | 119／119px | 69／69px |
| 375×812，根字級 24px，safe-area 模擬 34px | 7 | 0 | 119／119px | 103／103px |
| 768×1024，根字級 16px | 7 | 0 | 117／117px | 69／69px |
| 1440×1000，根字級 16px | 7 | 0 | 86／86px | desktop 不顯示底部列 |

另外檢查水塔頁 1024px 邊界（六籤同列、末項可換兩行）、1440px 根字級 24px（六籤完整、圖片圖說可讀）。375px 的 Chrome 文件 clientWidth 為 360px，1440px 為 1425px，因桌面捲軸占 15px；沒有把這個尺寸模擬稱為 iPhone 或 Android 實測。

本機預覽只允許 GET，CSP 阻止正式 API／GA 請求與表單提交；測試未按 LINE 送單／未建立正式案件。safe-area 透過測試伺服器替換 CSS env 值，不是實體裝置環境。Chrome 原有字級為 24px；沒有修改使用者瀏覽器設定，另以測試用樣式比較 16px／24px。

375px 正常字級下，可見 HTML 小字掃描剩餘 <12px 僅為 FAQ／折疊箭頭；不包含 SVG 裝飾刻度，也沒有驗遍所有展開狀態或所有文章。不能寫成「全站 WCAG 全部通過」。

### 4.2 真實 UI 操作（仍為本機 Chrome）

- 主導覽：首頁→水塔→水管，水塔／水管各有正確 active，進頁 scrollY=0；返回回到水塔。
- 375px 開啟「填單估價」→瀏覽器返回：modal 關閉、body scroll lock 清除、焦點回到「填單估價」。
- 首頁價格頁填壁掛 2＋室外機 1 → NT$3,698；切知識再返回價格，數量 2／1 保留。
- 冷氣「差異說明」、水塔「差異說明」的原生 hash 跳轉：目標標題在 sticky 目錄下方，未被表頭蓋住。
- 圖像與文字初載仍應在真機驗證：本輪只確認完成載入後的版面與上述互動，**未做載入動畫逐幀、效能追蹤或真機 fonts.ready 跳動驗收**。

### 4.3 截圖證據

`docs/qa/2026-08-30/` 為內部審查檔，不進公開 Pages artifact。

- `before-water-tank-1440-font24.png`：正式基準版本、水塔 URL、1440×1000、根字級 24px、safe-area 0。
- `after-water-tank-1440-font24.png`：本機同條件；可直接比較六大項、選取、官方 LINE、圖說底色。
- `after-homeclean-1440-font16.png`：本機 1440×1000、根字級 16px。
- `after-water-tank-375-font24-safe34.png`：本機 375×812，24px 大字及 34px 安全區模擬。
- `after-price-375-font16.png`：本機 375×812，試算與浮鈕防遮擋。
- `layout-measurements.json`：四組七頁量測，保留原始幾何與 active 資訊。

### 4.4 可重跑門禁

於前台 repo：最後一個參數是「本機 Bot checkout 路徑」，不是固定 repo 名稱。此 Codex 工作區為 `../huitailang-bot`，Claude 工作區可能為 `../leakdoctor-bot`；先確認該路徑內有 `src/catalog.ts` 與 `src/parser.ts`，再執行。不要為了照抄命令重命名資料夾。

```sh
node --check header.js
node --test scripts/test-header-contract.mjs scripts/test-home-service-hub.mjs
node scripts/validate-site.mjs
node scripts/check-home-bot-contract.mjs ../huitailang-bot
```

- Header 9／9，首頁 16／16；結構 22 頁／33 sitemap；跨 repo 21 品項 label／價格／單位／parser 契約通過。
- 新 Header 測試包含 5 種突變：刪除水塔、把水塔／水管選取映射成漏水、body 改回 66px、量測改寫死 66px、移除價格模式浮鈕防護。各自斷言能拒絕破壞；不是只檢查正常版本。
- 舊手機導覽 mutation 13／13、modal mutation 20／20 通過。Bot 原有 typecheck 與 281／281 測試通過，但沒有覆蓋 §5 的 A/B；綠燈不能推翻實際重現。
- Pages workflow 增加 Header 測試；跨 repo 契約**仍未進 CI**，需另設安全的雙 repo checkout，不把私有憑證寫入 workflow。

## 5. 仍存在，Claude 優先接手

### A — P0：修改後重送被草稿去重吞掉

用真實前台 formatter→Bot parser→buildWebsiteDraft→SQLite：同客戶先壁掛 1 台 1,599 元，再送壁掛 2＋室外機 1，應為 3,698 元，但仍回舊 public_id／舊 qty1／舊金額。

`createDraftOrder` 只比 customer、service、draft、10 分鐘。修正必須維持 public_id、相同內容不重複建單；內容改變就地修訂，寫 draft_revised，不能用「每次新增訂單」規避。對已確認單及併發重送也要獨立設計回歸。

### B — P1：working_lead 不是首次轉換才發送

以真實 worker webhook handler、不同 eventId 的兩則同內容訊息重現：只有 1 草稿，但有 2 次 working_lead。GA clientId、measurementId、secret 均為本機假值，fetch 被攔截回傳；沒有送至 Google。

`getWebLeadForClaim` 允許 converted、`linkWebLeadToOrder` 第二次同單仍 true，handler 也沒有 once-only gate。需一起核對 DB 條件與 handler，A 和 B 同批修，不能靠重複建單讓 B 表面消失。

### C — P1：文件與 service-layer 分頁實際狀態不符

`assets/craft.js:49` 的 `initServiceLayerTabs()` 只掃 `document.body.children`；現在各服務 section 在 `<main>` 內，blocks 不足直接 return，實測 `.service-layer-tabs` 數量 0。

原生 TOC hash 仍有效；不能宣稱第三層切頁及狀態同步通過。不要直接把 body 改 main 就開啟整段休眠邏輯：先確認要保留原生長頁目錄，還是正式恢復分頁，再完整測 hidden、deep link、返回／前進、鍵盤焦點、sticky、不同內容高度。漏水頁的 body class 與其他服務頁亦不同。

### 缺陷重現工具

```sh
# 已實跑 Node v24.16.0，無需正式環境憑證
node scripts/audit-bot-handoff.mjs ../huitailang-bot
```

該工具：真實 Bot 函式＋SQLite in-memory、實跑 migrations；8 組價目到確認卡／派工所需品項；驗證月結快照只能凍結一次；再**刻意斷言上述 A/B 缺陷存在**。exit 0 是成功重現，不是修正通過，因此未加入 CI。修復後應另寫期望正確行為的回歸測試與突變，並更新這支診斷工具。

不等同實際 D1、LINE Flex 真機渲染、廠商接受派單或月結付款流程。所有 HTTP 在程式內攔截，未外送。

## 6. 未驗證／不可宣稱完成

- iOS、Android、LINE webview：字體載入、返回、剪貼簿、深連結、鍵盤與 safe-area。
- 8 秒逾時時伺服器是否已寫入、正式 D1 端到端及併發冪等。
- GA4 DebugView 真實事件落地；只複製不算轉換的真機覆驗。
- LINE Flex 卡片的實體手機視覺／寬度；本輪僅驗證其 JSON 包含多品項。
- 潔美淨 LINE ID **本輪未寫入**，不得宣稱已啟用其自動派單。
- 取消派工沿用既有已驗程式，本輪沒有做正式取消或觸發提醒；廠商回報取消仍由管理者登記，不是廠商直接刪單。
- 第 5 節 A/B/C 尚未修正，不可因其他測試全綠改標通過。

## 7. 可直接交給 Claude 的提示詞

```text
請獨立複核 Campcool/leakdoctor 最新 main，及 Campcool/leakdoctor-bot 的 main。
先讀前台 docs/CODEX-FINAL-REVIEW-2026-08-30.md、AI-README.md、DESIGN.md，
以及前輪 CLAUDE-REVIEW-RESULT 與 Bot 的交接／取消派工文件；以程式及可重現結果為準。

本輪業主已明確確認「六大項」：冷氣、洗衣機、居家清潔、水塔、水管、漏水。
請勿再把水塔／水管移出主導覽，或讓它們選取成漏水頁。
審查六服務 Header、1024px 斷點、375/768/1440px、16/24px 根字級、safe-area、
官方 LINE 原始素材／靜態呈現、價格模式防遮擋、頁內目錄及跨頁返回／焦點。
請對照 docs/qa/2026-08-30 的前後截圖，不只看 CSS 或測試綠燈。

優先重現 A 草稿修改仍回舊數量與 B working_lead 重複。前台 scripts/audit-bot-handoff.mjs
用本機 SQLite＋真實 Bot 函式且攔截所有外送；它 exit 0 表示缺陷重現，不是修復通過。
另外核對 craft.js 掃 body.children 而 section 在 main 中導致 service-layer 未啟用的落差。
先輸出 P0/P1/P2 findings：檔案行號、重現、影響、建議、已通過與未驗證清單。
此交接預設只讀審查；需要改碼、推送或正式測試時先確認授權，勿發真實訂單／LINE／廠商通知。

不可回退：同內容不重複建單／派工，草稿修訂維持 public_id；成本 -1 為個案議價且可承接、
0 無可用廠商才隱藏；成本不公開、待報價不當零元；冷氣只含內機、外機另加500；
只複製不計轉換；對客不用媒合／轉真人；憑證與真實 LINE ID 不入 Git。
後續任何修改同步更新各 repo AI-README 的進度與待辦，新增測試須驗證故意改壞會失敗。
沒有真機、正式 D1 或 GA DebugView 證據就明確標未驗，不要寫全部通過。
```
