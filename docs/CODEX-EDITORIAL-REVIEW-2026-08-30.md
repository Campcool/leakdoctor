# 截圖版面精修交接（2026-08-30）

## Claude 舊基準複核的必要修正

業主要求先判斷必要性，再修改。Claude 附件基準為 `c66b61a`；本次實際基準為 `cee9b90`，所以不可把上輪已修的案例長標籤再當成現行缺陷。逐項採納與實測見 [必要性判定](CODEX-NECESSARY-FIXES-2026-08-30.md)。此節後的歷史量測不是全站所有文字「零孤字」保證。

## 最新追加：案例與服務地區（優先閱讀）

業主在交接後提供三張新截圖，證明居家／洗衣機案例與漏水地區仍有漏修。本次基準 `c66b61a`；請額外審查 `c66b61a..main`，不要只審下方原始差異 `faa59aa..53065b5`。

- 根因：同排案例混用3:4、4:3、1:1媒體；共用900px容器仍在860px以上固定三欄。1024px＋24px根字級下，居家第一／第二張圖片高351.47／197.70px，標題約差153.77px。
- 六服務17張案例改共同4:3圖框、contain保留全幅；案例容器最大1180px、手機24px安全邊距。自動依閱讀寬度減少欄數，不再硬塞三欄或手機橫滑。圖片來源／前後方向不變，沒有生成或修改照片。案例本體不再等待淡入動畫才可見。
- 同排標題／中繼文字／正文使用subgrid對齊，不設固定字數或截斷；h3取代標題div；「現場實拍／已去識別」取代冗長帶定位圖示但沒有地點的標籤。
- 漏水地區統一4個圖示，19個縣市改完整清單詞組；保留原服務範圍、48H／72H安排文字及離島排除。4／2／1欄由容器寬度與字級決定，安排說明於同排底部對齊。
- CSS快取鍵：七頁 `/assets/process-editorial.css?v=20260830-cases`。未改Header、報價、LINE或Bot。

驗證：流程測試23＋Header9＋首頁16＝48案（新增7案，含4個刻意破壞的突變）；結構22頁／33 sitemap、跨repo21品項通過。新增CSS檢查核對cascade勝出宣告，不宣稱靜態解析器能計算Grid幾何；幾何另以Chrome實測。

Chrome共54組：六服務×375／768／1024／1440px×根字級16／24px，另加六服務320px＋24px。無頁面／案例文字水平溢出、同排圖片高度及標題／中繼／內文起點差異超過1px、地名拆行。已完成載入的圖片沒有錯誤；此檢查不代表所有延遲載入圖片在每組量測時都已載入。居家與洗衣機的最終截圖另確認照片全部載入。比較滑桿End／Home後讀到100%／0%。詳[量測JSON](../design-plans/CASE-REGION-2026-08-30/responsive-metrics.json)。

截圖：[居家修正前1024／24](../design-plans/CASE-REGION-2026-08-30/before-homeclean-1024-24.png)、[居家修正後1024／24](../design-plans/CASE-REGION-2026-08-30/after-homeclean-1024-24.png)、[居家375／24](../design-plans/CASE-REGION-2026-08-30/after-homeclean-375-24.png)、[洗衣機1440／16](../design-plans/CASE-REGION-2026-08-30/after-washer-1440-16.png)、[地區1440／24](../design-plans/CASE-REGION-2026-08-30/after-regions-1440-24.png)。修改後桌機圖用瀏覽器原生區塊裁切輸出，修正前及375px圖為視窗截圖；裁切範圍與輸出縮放不同，不能按PNG外框比較viewport寬度。375px是桌機Chrome模擬，不是真機。

未驗：iOS／Android／LINE實機、舊版不支援subgrid／container query瀏覽器的視覺降級。正式D1／GA4／派單與Bot A/B仍非本次範圍。本機預覽只接受GET，CSP禁止正式API與分析腳本；未建立正式線索或發LINE通知。

給Claude追加提示：先鎖定審查時main SHA，複核本節與 `c66b61a..main`；尤其檢查同排三種圖文對齊、contain圖片完整性、320px大字與24px留白、四區19縣市與時效未改。獨立看截圖與瀏覽器，不以「54組零溢出」替代視覺判斷。舊瀏覽器降級未驗請明列；仍採唯讀審查，不push、不建立正式訂單、不通知廠商。

## 範圍與基準

基準：前台 `faa59aa`；本輪功能審查目標：`53065b5`（差異 `faa59aa..53065b5`）。業主要求綜合修正首頁與六服務的流程卡、段落斷字、水管 Hero 圖文過近、水塔案例高低不同、漏水服務說明等截圖問題。只改前台；Bot、D1、LINE 接單與派工未操作。

## 交付與部署

- 功能 commit：[`53065b5`](https://github.com/Campcool/leakdoctor/commit/53065b516785c6968a0a90bba9338100c1bd248a)，已推至 `main`。
- GitHub Pages：[run #44 / 33305228880](https://github.com/Campcool/leakdoctor/actions/runs/33305228880)，對應上述 SHA，`completed / success`。這是 CI 與部署結果，不等於真機視覺或正式訂單驗收。
- 本文件後續補充只更新交接資料與 `AI-README.md`，不改網站功能。請先記錄審查時的遠端 `main` SHA；若已有更新，區分本輪差異與後續改動，勿把舊截圖當成新版證據。

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
- `node scripts/check-home-bot-contract.mjs ../huitailang-bot`：21品項價格／標籤／單位／parser 契約。此為只讀本機驗證，不是正式接單流程。
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
- 功能 commit 的 Pages 部署已成功（見上方連結）；正式站部署後逐頁互動與真機檢查不在上述本機45組證據內，仍需獨立確認。

## 可直接交給 Claude 的提示詞

```text
請對 Campcool/leakdoctor 執行獨立唯讀審查，先不要修改、commit、push 或部署。

版本與必讀：
1. 先確認遠端 main SHA。本輪功能差異是 faa59aa..53065b5；其後交接文件補充不改功能。若 main 有其他更新，請另外標示。
2. 讀取 CLAUDE.md、AI-README.md、DESIGN.md、docs/FRONTEND-CRAFT.md、docs/CODEX-FINAL-REVIEW-2026-08-30.md，以及 docs/CODEX-EDITORIAL-REVIEW-2026-08-30.md。
3. 文件是待核實的紀錄，請以實際程式、測試、瀏覽器與部署 SHA 交叉驗證，不能只採信測試綠燈。

重點驗收：
- 首頁及六服務頁：冷氣、洗衣機、居家清潔、水塔、水管、漏水。六個主頁籤不可消失或被裁掉而無法操作。
- 七頁共37個流程步驟（首頁4、居家3、其餘五服務各6）：核對修改前的安全說明完整保留；檢查 details 的鍵盤操作、焦點、展開後可見性及閱讀順序。不要修改原文 fixture 來掩蓋缺漏。
- 實際檢查 375／768／1440px、根字級16／24px，另補1024px居家／水管／水塔。檢查圖片與文字間距、中文孤字斷行、價格表欄名、內容寬度、CSS載入順序；視覺判斷不能只看 scrollWidth。
- 水管首屏標題不能碰圖或裁切；居家／水管手機價目需清楚對應欄名；水塔同排案例圖片、標題與內文起點應對齊。
- 固定表頭及頁內目錄不能遮住錨點標題；切換服務、上一頁／下一頁、預約視窗開關與返回、首頁知識／價格切換不得遺失狀態或錯位。不要把休眠的 service-layer 誤認為已啟用。
- 確認價格與承接規則、LINE官方素材、複製／送出與追蹤事件沒有回退。只複製不計轉換；待報價不是0元；成本不對客公開；冷氣價格只含室內機，室外機另加500元。

回歸命令（最後參數是本機 checkout 路徑；Codex 是 ../huitailang-bot，Claude 若是 ../leakdoctor-bot 就改用該路徑。先確認 src/catalog.ts 與 src/parser.ts 存在）：
node --test scripts/test-process-editorial.mjs scripts/test-header-contract.mjs scripts/test-home-service-hub.mjs
node scripts/validate-site.mjs
node scripts/check-home-bot-contract.mjs ../huitailang-bot
檢查新測試的5個突變案例是否真能抓到回退。新增探測請使用本機、攔截API及LINE外連，禁止送出正式線索、訂單、GA事件或廠商通知。

輸出格式：
1. P0–P2可重現缺陷：檔案／行號、頁面、瀏覽器與尺寸、重現步驟、預期／實際、客戶影響、最小修正建議。
2. 視覺問題附截圖；區分主觀設計建議與可重現功能缺陷。
3. 列出通過證據、未驗項目及環境限制。桌面模擬不能稱為iOS／Android／LINE真機通過。
4. 若無可重現缺陷，明確寫出結果與驗證邊界，不要為了湊數捏造問題。

範圍限制：本輪未改Bot。草稿修改去重A、working_lead重複B仍待獨立處理，前台UI通過不代表它們已修好。正式D1、8秒逾時冪等、GA4 DebugView、潔美淨綁定／自動派單與真機驗收不得宣稱完成。不得讀出或轉貼憑證及真實LINE ID；不得建立正式訂單或通知客戶、廠商。先回覆審查結果，修正與正式測試另待業主授權。
```
