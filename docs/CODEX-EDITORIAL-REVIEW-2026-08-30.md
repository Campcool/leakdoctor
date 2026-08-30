# 截圖版面精修交接（2026-08-30）

## 範圍與基準

基準：前台 `faa59aa`。業主要求綜合修正首頁與六服務的流程卡、段落斷字、水管 Hero 圖文過近、水塔案例高低不同、漏水服務說明等截圖問題。只改前台；Bot、D1、LINE 接单與派工未操作。

## 完成項目

1. **七頁流程重新排版**：真實現場細節照片＋垂直有序清單；短摘要常駐，原生 details 展開全文。共37個步驟（首頁4／居家3／其餘5服務各6），修改前文案保存在 `scripts/fixtures/process-original-content.json`，不能移除安全說明來讓測試通過。
2. **中文字與留白**：Hero 取消強制 nowrap，grid 兩欄可收縮、40–80px 間距，960px以下單欄。流程摘要正常正文大小；標題採 balance、段落採 pretty；部分冗長自我解釋文案精簡。
3. **表格**：居家／水管價格保留原值與文字，加入語意詞組；960px以下直式資料卡。實際截图發現 `craft.css` 的 `tr{display:grid!important}` 會覆蓋欄名隱藏規則，造成手機 th 直排。新樣式修正所有六服務手機表頭，並補了一個突變測試。
4. **水塔案例**：刪掉分別3/4與1的 inline aspect-ratio，同排固定4/3；不拉伸原圖、不改前後照片及滑桿方向。
5. **漏水說明**：三張假互動卡改成留白＋分隔線的說明列，採正確 h3 與短段落；保留事先說明車馬費、由客戶決定施工、完工後專員協助的口徑。
6. **目錄**：手機完整標籤橫滑，不拆成「內容說／明」；目錄高度隨 ResizeObserver 與字體載入更新，錨點保留表頭＋目錄＋24px。休眠的 service-layer 程式沒有啟用。

## 素材

本輪沒有新增 AI 圖，也沒有修圖。使用 repo 原有真實實拍：`cases/aircon/case01-after.webp`、`cases/washer/case01-after.webp`、`cases-clean/case11-after.jpg`、`cases/water-tank/case01-after.webp`、`cases/pipe-cleaning/case02-scale.webp`、`cases/leak-repair/case03-opening.webp`。照片只作現場細節參考，不把單張症狀照包裝成前後成效。水管照片保留全幅接頭；漏水裁切聚焦開孔作業。

## 驗證證據

- `node --test scripts/test-process-editorial.mjs scripts/test-header-contract.mjs scripts/test-home-service-hub.mjs`：41案（16＋9＋16）。新流程16案含5個在記憶體中刻意改壞的突變測試；沒有修改正式資料。
- `node scripts/validate-site.mjs`：22頁／33 sitemap。
- `node scripts/check-home-bot-contract.mjs ../huitailang-bot`：21品項價格／標籤／單位／parser 契約。此為只讀本機驗證，不是正式接单流程。
- Chrome：七頁 × 375／768／1440px × 根字級16／24px，共42組；補居家／水管／水塔1024px＋24px，共45組。無頁面水平溢出、流程或Hero文字溢出、指定詞組拆字；窄版表頭不再直排。完整數據：[responsive-metrics.json](../design-plans/EDITORIAL-REFINEMENT-2026-08-30/responsive-metrics.json)。
- 手機模擬實際點擊水塔→水管→上一頁，依載入完成後量測：三次表頭119px，作用中頁籤正確。原生 details 用 Enter 展開，全文可見。
- 水塔1440px＋24px：兩圖高334.95/334.97px、標題與內文起點差小於0.02px（次像素）。
- 不只看「無溢出」：本輪確實由截圖抓出表頭問題，再增加結構／computed display 驗證；靜態測試不是視覺驗收的替代品。

### 截圖

- [冷氣流程・1440px／16px](../design-plans/EDITORIAL-REFINEMENT-2026-08-30/after-aircon-process-1440-16.png)
- [洗衣機流程・1440px／16px](../design-plans/EDITORIAL-REFINEMENT-2026-08-30/after-washer-process-1440-16.png)
- [居家價格・375px／24px](../design-plans/EDITORIAL-REFINEMENT-2026-08-30/after-homeclean-pricing-375-24.png)
- [水管首屏修改前](../design-plans/EDITORIAL-REFINEMENT-2026-08-30/before-pipe-hero-1440-24.png)／[修改後](../design-plans/EDITORIAL-REFINEMENT-2026-08-30/after-pipe-hero-1440-24.png)
- [水塔案例修改前](../design-plans/EDITORIAL-REFINEMENT-2026-08-30/before-water-cases-1440-24.png)／[修改後](../design-plans/EDITORIAL-REFINEMENT-2026-08-30/after-water-cases-1440-24.png)
- [漏水服務說明](../design-plans/EDITORIAL-REFINEMENT-2026-08-30/after-leak-promises-1440-24.png)

本機預覽只提供 GET，CSP 阻擋正式 API 與分析腳本，未填客戶資料、未送LINE、未通知廠商。截圖／文件不在公開 Pages allowlist 內。

## 未驗證與不可誤認為完成

- 以上是桌面 Chrome 尺寸與根字級模擬，不是 iOS／Android／LINE 真機；螢幕閱讀器、Lighthouse與低階手機FPS未量測。
- Bot A草稿修改被去重吃掉、B working_lead重複，沿用前份交接待修。本輪不處理、不宣稱通過。
- 正式D1、8秒逾時冪等、GA4 DebugView、潔美淨綁定／自動派單未操作。
- 推 main 會觸發 Pages；部署狀態應以本次commit對應Actions及正式頁面為準，不能單看文件或本機綠燈。

## 可直接交給 Claude 的提示詞

請唯讀審查 Campcool/leakdoctor 的 main，基準 faa59aa，先讀 AI-README.md、DESIGN.md、docs/CODEX-EDITORIAL-REVIEW-2026-08-30.md 與相關差異。請獨立驗證而非只採信文件或綠燈：七頁37步流程完整安全原文、native details鍵盤／可見性、45組尺寸的視覺與CSS載入順序、手機價格表欄名不能直排、中文詞組不可孤字斷行、Hero不能碰圖、水塔案例應同高、六主服務不能消失、頁內目錄跳轉不能遮標題。檢查價格／LINE／事件追蹤沒有回退。既有截圖可參考，但若改了CSS請重新實測，勿以regex測試冒充瀏覽器驗收。輸出有位置、重現與影響的P0–P2 findings，區分已驗／未驗。不要自行push、部署、建立正式訂單或通知廠商；Bot A/B與真機等仍為獨立未完成事項。
