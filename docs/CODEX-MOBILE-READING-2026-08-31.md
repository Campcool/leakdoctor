# 首頁雙路徑、六服務閱讀節奏與同色系分隔

日期：2026-08-31（Asia/Taipei）｜執行：Codex
基準：前台 `588cde3`。本輪只改前台，未改 Bot、D1、價格、廠商資料與派工。
交付狀態：本機修改與驗證；此文件不代表已推 main 或部署。

## 1. 業主五點要求對照

| 要求 | 實作 |
|---|---|
| 首頁價格／知識雙入口 | 移到 Hero 前、Header 正下方；兩路徑可直接切換，價格模式不經過長篇故事 |
| 六服務章節敘事 | 保留原內容，重新排序為問題／處理、流程限制、真實案例、價格／預約；目錄第一項仍可直達價格 |
| 減少連續等大卡片 | 首頁流程改圖文交錯；六服務說明改短條目，流程維持可展開清單，案例保留照片框、價格保留表格 |
| 圖文分工 | 首頁 Hero 圖說改在圖下；新增取自既有案件的兩組前後對照，與流程示意分開；六服務圖說不再蓋在照片上 |
| 六大項＋頁內目錄 | 六項不刪，頁內目錄改文字／作用中底線，保留44px觸控區、原生錨點及瀏覽器返回 |

以上是實作狀態，不等於真機驗收或轉換率已提升。

## 2. 新增的色階與留白要求

- 沿用冷氣青藍、洗衣機紫、居家琥珀、水塔藍、水管深青、漏水青綠；不把所有服務塗成同一色。
- 章節白底／7%服務色混白交替；流程區用13%。相鄰步驟、說明卡有白／淡色或淡／稍深色差；仍保留標題、編號、邊界。
- 首頁價格卡依實際六服務上色，4%／9%交替；水塔、水管、抓漏雖共用原 catalog 的 water 分類，畫面仍有各自色彩。不改 catalog group 或解析標籤。
- 一般章節上下留白改36–60px；卡片／條目間距12–24px。圖片／文字分欄仍有足夠距離，不以縮字壓縮頁面。
- 實拍圖片未改圖、未調色、未裁切證據，17個原服務案例完整保留。

## 3. 主要修改與注意事項

- `index.html`：入口列、語意斷句、縮短 Hero 說明、新增2組真實比較／3條預約FAQ；知識區加顯隱標記。
- `assets/home-service-hub.js`：抽出純函式 `renderServiceRow`；數量與價格同列；切換不清空 Map。價格模式底部按鈕導向已選明細，不開空白 modal。
- `assets/home-service-hub.css`：模式列、緊湊價格卡、照片／段落節奏、色階與斷點。
- 六服務 HTML：搬動現有 section，不重寫價格／安全說明。居家價目表從服務概述抽出成獨立章節，原 `#homeclean-pricing` 不變。
- `assets/process-editorial.css`：章節色階／留白、精簡目錄、圖說移出照片；首頁 body 的 `overflow-x:hidden` 改成 clip，否則會讓 sticky 依錯誤的捲動祖先定位。
- overflow 修正不用 important，保留 modal 的 inline `overflow:hidden`。已實測開啟時背景鎖定、上一頁關閉後焦點回到按鈕。
- `assets/craft.js`：只為原生目錄加 scrollspy／`aria-current=location`；不攔截錨點、不隱藏章節，不啟用休眠 layer-tabs。
- 流程錨點多保留48px，以免標題上方的小標被兩層固定導覽遮住。
- 既有內容指紋／禁止重送、只複製不算轉換、Bot重計價與售價條件不改。

## 4. 驗證結果

### 自動檢查

```sh
node --test scripts/test-home-service-hub.mjs scripts/test-header-contract.mjs scripts/test-process-editorial.mjs
node scripts/validate-site.mjs
node scripts/check-home-bot-contract.mjs ../huitailang-bot
node --check assets/craft.js
node --check assets/home-service-hub.js
node --check header.js
```

- 70/70；結構驗證22頁／33 sitemap；21項前後台價格／標籤／單位／parser契約通過。
- 新增14測試，其中7個突變測試；刻意破壞入口、斷句、數量列、章節順序、錨點、sticky overflow、色階或留白時會紅。突變只操作隔離字串，不改正式檔案。
- 與HEAD基準逐頁比對六服務的所有 p、td、h2 內容，多重集合完全相同；章節搬動沒有丟正文、價目儲存格或標題。
- 原37段流程／安全全文、17個案例、六項主導覽沿用既有守門測試。

### 桌面瀏覽器響應式測試（不是手機真機）

- 首頁320／375／390／768／1024／1440，根字級16px與24px共12組；知識＋價格皆無文件／價格卡水平溢出，數量按鈕最小44px。
- 六服務375與1440、根字級16px與24px共24組；h1與文件無水平溢出。24px桌面案例減為2欄，375px單欄，照片比例一致。
- 六服務375px逐一點目錄價格入口：目標均在固定目錄下方；目錄最小點擊高度44px、正常字級目錄總高53px。
- 390px實測壁掛2＋室外1＝3,698；知識／價格往返及瀏覽器back／forward保留數量。底部確認按鈕跳既有明細。
- 390px／24px後續窄列修正覆驗：模式列69px，首張卡約144px，價格／數量同列。320px允許換列，不硬擠控制項。
- Modal開啟時 body overflow hidden、焦點進 dialog；back關閉後回到「填單估價」，恢復clip visible。最後檢查console log為空。
- 本機4180使用16px字級；4181使用24px字級並注入34px底部safe-area，皆為模擬。
- 預覽伺服器只接受GET，以CSP限制連線；沒有送正式API、建立訂單、發LINE或通知廠商。

截圖放在 `design-plans/MOBILE-READING-2026-08-31/`。這是修改後的本機畫面，未冒充正式站或真機。

## 5. 尚未驗證／不可宣稱

- iOS／Android實機、LINE webview頁面被回收後的狀態。
- 正式D1、GA DebugView、8秒逾時冪等、正式送單與派工。
- 舊瀏覽器的color-mix／clip／subgrid降級、跨頁View Transition、Lighthouse與實際CLS/LCP。
- 訂單轉換率是否提升；需部署後以真實漏斗數據判斷。
- Bot A/B去重、working_lead問題的狀態，以Bot最新碼與獨立驗證為準，本輪沒有處理。

## 6. 給 Claude 的審查提示詞

請先唯讀審查 Campcool/leakdoctor 本輪修改，閱讀本文件、AI-README.md、DESIGN.md，並以程式與瀏覽器結果交叉驗證；不要把文件或70條綠燈當成視覺完成。

重點：首頁初入可切價格／知識；375與390正常／放大文字；模式切換及back／forward數量保留；底部確認跳原明細；modal背景鎖與返回；六服務章節排序／價目捷徑／flow小標不被遮；同色系深淺是否有足夠區別且文字易讀；留白是否過量；案例完整且方向未改。

請重新跑上列門禁及跨repo契約（你的Bot若在../leakdoctor-bot，替換路徑即可）。新增缺陷須附頁面、尺寸、操作、實際/預期與嚴重度。若要修或push先取得業主授權；不得發正式LINE、建單或派工。真機與正式流程沒有做就明確列未驗證，不得冒稱通過。
