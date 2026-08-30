# Claude 審查交接｜首頁雙入口與互動價格總覽

更新：2026-08-30（Asia/Taipei，Codex）

本文件是 `AI-README.md` 的本次變更／審查附件，不取代該檔的交接主索引。
用途：提供可重現的審查範圍、已完成修正、測試邊界與待複核項目。以下「待複核」不是已確認缺陷，也不代表授權直接修改或部署。

## 1. 版本與審查範圍

- 前台：`Campcool/leakdoctor`，功能版本 `43c28fdbd9f5b1ed6f67ef2bc557bbd883bf86c4`。
- 本次功能 diff：`e5a5fa8..43c28fd`，10 個檔案；本文件所屬後續 commit 僅補交接文件。
- 後台對照基準：`Campcool/leakdoctor-bot` 的 `3a5b94e`，價格與解析以 `src/catalog.ts`、`src/parser.ts`、`src/index.ts` 為準。本次首頁功能沒有修改 bot repo。
- 前一批 UI/UX：前台 `3bb6b09`、Logo 公開資源修正 `e5a5fa8`；LINE Flex 視覺 `3a5b94e`。可作回歸範圍，不應和本次首頁功能混算。
- 審查開始先記錄兩個 repo 的實際 main SHA。若 main 有更新，分開列出新增差異，不假設本文件描述仍等於最新程式。
- 正式頁：<https://leakdoctor.tw/>、<https://leakdoctor.tw/#price-overview>。
- 功能部署證據：[GitHub Actions run 33284989144](https://github.com/Campcool/leakdoctor/actions/runs/33284989144)，`check`／`deploy` 均成功，對應功能 SHA `43c28fd`。

## 2. 使用者需求與不可回退的決策

1. 首頁提供平行入口「清洗知識／價格一覽」，不強迫所有客戶先填表。
2. 價格導向客戶可選服務、輸入數量、看試算、複製明細，再開 LINE 確認訂單。
3. 預設知識模式；價格模式是使用者主動開啟的首頁例外，不恢復每個服務頁的大型常駐估價器。
4. 首層固定導覽仍為冷氣、洗衣機、居家清潔、漏水檢測與修補四項。水塔／水管保留獨立服務頁與首頁入口，不刪服務。
5. 供應商成本、客戶售價、是否可人工派單是不同概念。成本 `-1` 代表個案議價，不是負售價，也不是自動隱藏。當前 bot 允許人工派單的項目可詢價；不要僅依舊筆記把成本 `0` 的所有項目從前台刪掉，須核對最新承接規則。
6. 水泥水塔等明確未承接品項不放入首頁選單。特殊機型、窗型出勤條件與現場風險不能因顯示參考價而省略。
7. 只有取得後台線索編號才可將正式表單成功記為 `generate_lead`；開 LINE、複製或看價格都不等於成交／確認預約。
8. 不更換 LINE 帳號、價格、服務區、營運承諾，不恢復公開電話 CTA，不加入虛構評價或殺菌／療效保證。

## 3. 已實作／修正項目

| 項目 | 實際行為與檔案 |
|---|---|
| 首屏雙入口 | `index.html`：看價格即時試算／先看清洗知識；知識模式保留六類服務頁入口 |
| 價格子頁 | `#price-overview`，與 `#knowledge-overview` 互斥顯示；不是另建 HTML 路由 |
| 服務與數量 | `assets/home-service-hub.js`：21 品項、6 種篩選；數量可輸入或加減，正規化為 0–20 整數；分類切換保留已選項目 |
| 計價 | 12 種固定價、9 種需報價；固定價逐項相加，混合只顯示已定價小計，純待報價顯示「待報價」而非 NT$0 |
| 明細上限 | 每次最多12種品項，呼應 `/api/leads` 的12行限制；不是限制合計台數12台；超過時提示分次整理 |
| 只複製 | 可不填聯絡資料；若已填欄位會一起複製。不呼叫建案 API、不送轉換事件；缺資料不塞「待補」假值 |
| 建案後 LINE | `header.js` 新增 `ldCreatePriceInquiry`，共用原 API、LINE ID、來源歸因；稱呼＋手機必填，地址／時段選填；成功後帶線索編號與全部明細進 LINE |
| 失敗與防連點 | 送出中停用表單操作；失敗不開 LINE，保留欄位與選擇並提示重試；API 請求8秒逾時 |
| 訊息格式 | `服務內容：品名 × 數量（參考價／待報價）` 每項獨立一行；Bot 再依正式 catalog 計價，不信任前台單價 |
| 瀏覽狀態 | 支援子頁 hash、返回／前進及左右鍵／Home／End；修正「查看明細」錨點曾誤切回知識頁 |
| 手機操作 | `assets/home-service-hub.css`：單欄價格、固定小計／跳到明細入口；價格模式隱藏會遮住加號的回頂浮鈕 |
| 可讀性 | 新區塊主要文字／控制至少14px、聯絡輸入16px、控制高度至少44px；具可見焦點與 reduced-motion |
| 視覺／文案 | 新增價格圖示至 `assets/icons.svg`，縮短手機切換副標；保留知識型 OG 與原首頁四階段安全流程 |
| 部署門禁 | `.github/workflows/site-check.yml` 加入 `test-home-service-hub.mjs`；`AI-README.md`、`DESIGN.md` 同步首頁例外規則 |

## 4. 價格資料與維護邊界

首頁目前是**版本化靜態快照**，不是即時向 bot API 取得售價／承接清單。快照來源是 `3a5b94e` 的 `src/catalog.ts`；後台日後改價，需同步前台模組與測試，不能宣稱已自動同步。

| 固定參考價品項 | 售價 TWD |
|---|---:|
| 壁掛分離式室內機 | 1,599／台 |
| 吊隱二風鼓，含室內外機 | 2,799／台 |
| 變形金剛機型 | 2,500／台 |
| 風鼓拆下深度清洗，加購 | 800／台 |
| 吊隱多一組風鼓，加購 | 500／組 |
| 室外機 | 500／台 |
| 直立式洗衣機 | 1,599／台 |
| 滾筒式洗衣機 | 3,599／台 |
| 定時居家清潔4小時 | 2,500／次 |
| 白鐵水塔 | 1,599／顆 |
| 大樓／公寓給水管清洗 | 3,599／戶 |
| 透天給水管清洗 | 4,999／戶 |

窗型、四方吹、商用冷氣、商用洗衣機、大掃除、退租、裝潢細清、抽油煙機、抓漏屬需報價。顯示「起價」不代表該項已納入固定總額。

## 5. 已執行驗證與證據邊界

部署前與正式站結果（2026-08-30）：

- `node --test scripts/test-home-service-hub.mjs`：12/12。涵蓋純函式計算、數量正規化、混合／純待報價、缺欄位與換行清理、明細格式、hash分類、建案橋接成功與失敗。
- `node scripts/check-home-bot-contract.mjs ../huitailang-bot`：21個品項的 ID、名稱、固定價／報價狀態、Bot parser 主項目與數量對應，另驗3項訊息及 `web_lead_id`。此檢查直接執行真實 catalog/parser，但**沒有**呼叫 D1、`buildWebsiteDraft` 或 LINE。
- `node scripts/validate-site.mjs`：22頁／33個 sitemap 網址通過。
- `node scripts/test-mobile-nav-gate.mjs`：13/13 mutation cases；`node scripts/test-modal-accessibility-gate.mjs`：20/20。
- 本機桌面瀏覽器響應式 320／375／768／1440：本輪掃描的新區塊文字與控制未出現低於14px／44px的項目，無頁面橫向溢出、無破圖。不是全站 WCAG 認證。
- 以 UI 操作驗證：分類切換保留數量、返回及鍵盤切換、明細跳轉、清空、純待報價、三項混合明細複製。
- 正式站驗證價格子頁可見，壁掛2台＋室外機1台＝NT$3,698，375px 無溢位／破圖；受測瀏覽器 console 無 error。新增 CSS／JS 正式資源 HTTP 200。
- 首頁測試以 mock 驗 D1 橋接；**未以真實客戶資料提交 `/api/leads`，未在 LINE 按傳送、未測試正式確認卡／派工／廠商通知**。
- 跨 repo 檢查使用 Node24 的 `stripTypeScriptTypes`；不在目前 Node22 CI 中自動執行。CI 跑的是12項首頁測試與網站門禁，不能說跨 repo 自動同步已有 CI 保證。

## 6. 請 Claude 優先複核

以下是審查問題／已知測試缺口，不預設都有 bug。需要程式位置、具體重現或邊界推導後才能下結論。

1. **正式建案鏈**：前台 details → `normalizeWebLead` → D1線索 → LINE parser → `buildWebsiteDraft`，混合服務、所有項目及線索ID是否保留，後台重新定價是否完整。
2. **逾時與重送**：前台收到錯誤不代表伺服器一定沒寫入。檢查8秒timeout、重試／連點、LINE未開啟後返回，是否可能重複建案／轉換事件；不要把「前台不開 LINE」寫成「D1 必定沒有資料」。
3. **價格與承接同步**：靜態快照更新流程是否足夠；前台舊 modal、各服務價目表、schema、llms.txt 是否仍有不同口徑。不得把內部成本直接顯示給客戶。
4. **加購／特殊機型**：目前主要靠文字提示，未建立完整相依選項驗證。室外機、拆風鼓、多風鼓單獨選／超量選、吊隱含室外機又重複加購、變形金剛與一般壁掛重複計算是否會誤導；日立／三菱洗脫烘、窗型低於3台的後續確認是否正確。
5. **單位語意**：現有跨 repo 測試不比對單位；例如商用洗衣機前台「台」、後台報價單位「案件」，居家4小時的「次」與數量是否在訊息／卡片中清楚。
6. **LINE／剪貼簿真機**：iOS Safari、Android Chrome、LINE內建瀏覽器的複製權限失敗、深層連結、長訊息、app未安裝、返回後狀態；這些未以實體手機驗證。
7. **返回／焦點／遮擋**：服務子頁、明細錨點、既有預約modal history、重新載入、返回快取、螢幕鍵盤與固定小計／底部 CTA 是否互相干擾。
8. **轉換與隱私**：只複製不應送出表單／GA成交事件；建案成功才計轉換；確認姓名電話不進 GA、一般站內網址或除必要LINE交接外的外部傳輸。
9. **測試能否攔真回歸**：不只檢查綠燈。首頁測試目前偏純函式與橋接，不是完整 DOM 送出端到端；檢查12品項上限、欄位錯誤、失敗保留、防連點與實際導頁是否有盲點。
10. **視覺與文件一致性**：新區塊文字、錯字、價格單位、低對比、窄螢幕斷字；`AI-README.md`／`DESIGN.md` 部分歷史／通則仍寫六項導覽或禁常駐試算，需辨識最新四項導覽與首頁主動價格模式的例外，不直接依舊規則回退產品。

## 7. 重現命令與交付格式

在前台 repo 執行（mutation 測試會暫時改寫／還原共用檔，請先確認工作樹乾淨，並依序跑，不要平行）：

```sh
git diff e5a5fa8..43c28fd -- index.html header.js assets/home-service-hub.js assets/home-service-hub.css assets/icons.svg scripts .github/workflows/site-check.yml
node --check header.js
node --check assets/home-service-hub.js
node --test scripts/test-home-service-hub.mjs
node scripts/validate-site.mjs
node scripts/test-mobile-nav-gate.mjs
node scripts/test-modal-accessibility-gate.mjs
# 需可用的 bot checkout 與 Node24；路徑按環境調整
node scripts/check-home-bot-contract.mjs ../leakdoctor-bot
```

請回傳：審查結論 → P0/P1/P2 findings（檔案／行號、重現步驟、預期與實際、影響、最小修正方向）→ 已跑測試與限制 → 未驗證項目。沒有可重現問題就明確寫未發現，不湊數。

本輪先只讀審查、不要修改／commit／push／部署；不要使用正式金鑰、送真實LINE訊息、建立正式訂單或通知廠商。缺任一 repo 權限請列出受阻範圍，不以推測當成驗證通過。確有必要的正式端到端測試，先另提測試資料與可能外部影響供業主確認。
