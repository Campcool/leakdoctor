# 前台審查報告｜by Claude（後台）2026-07-15

> 給 Codex：業主請我以「後台視角」複查前台（`origin/main` @ `3d3e0e5`，功能版本 `7bfe813`）。
> 方法：全站 23 頁自動掃描（連結完整性／重複 ID／JSON-LD／header.js 引用資產）、`node --check`、header.js 與 craft.js 逐段閱讀、**表單訊息格式 vs bot parser 跨 repo 比對**、價格治理比對 bot catalog。正式站在我環境連不到（proxy），瀏覽器行為以你記錄的驗證為準。

## ✅ 通過項（值得肯定）

- 23 頁掃描 **0 問題**：內部連結全部存在、無重複 ID、JSON-LD 全部可解析、header.js 引用的資產全部存在。
- `header.js`／`assets/craft.js` 語法乾淨；craft.js 第三層分頁 **a11y 紮實**（`role=tablist`、`aria-selected`、`aria-controls`、鍵盤左右鍵、`prefers-reduced-motion`）；無 JS 時內容全顯示的 fallback 成立（分頁由 JS 注入，天然降級）。
- 表單有做必填驗證（姓名/電話/地址/服務，電話 regex）；GA4 只由 header.js 載入一次，**無雙重計數**；真實 ID `G-1H1X1X9QZE` 已上線 ✓。
- **價格治理良好**：水塔/水管頁不寫死價格（與 bot `quote_required` 一致）；漏水頁的金額區間來自業主已核准的 FAQ。
- 新服務名稱（水塔清洗/水管清洗/抽油煙機清潔/漏水檢測與修補）**全部能被 bot catalog 解析** ✓。

## 🐛 已發現的 Bug（跨 repo，後台端我已修好）

1. **（嚴重，已修）表單「服務內容」行被 bot 丟棄 → 機型與台數遺失。**
   header.js 送出 `服務內容：吊隱式冷氣 × 2台（參考價 $2,599／台）`，但 bot parser 原本不認識這個欄位 → 訂單落回「冷氣清洗 × 1」，確認卡誤配壁掛 $1,499。**Bot 端已修**（commit `9534450`）：第一行明細精修服務與數量、多行明細與括號說明進備註、價格仍只由 catalog 查。→ **前台不用改**；請維持 `〈品項〉 × 〈數字〉〈單位〉（說明）` 這個格式不變，改格式前先同步我。
2. **（中，已修）`現場狀況／備註：` 與 `漏水判讀摘要：` 不在 parser 別名裡 → 客戶備註靜默遺失。** 同 commit 已修。→ 前台不用改。

## 🎨 建議 Codex 處理（前台端）

3. **室外機清洗「加購 $500／台」出處確認（價格治理）**：這是全站唯一一個 bot catalog 沒有的固定價（bot 知識庫目前說「報價時評估」）。請跟業主確認 $500 是否為核准價——**是** → 告訴我，我把它補進 bot catalog/知識庫，讓 LINE 報價一致；**否** → 表單文案改成「現場評估」。
4. **`docs/GOOGLE-ADS-PLAN.md` 撞名**：main 上你的版本與我分支上我的版本內容完全不同（144/142 行差異）。我的分支另有 `GOOGLE-ADS-BUILD-SPEC.md`（可直接照做的建置指令書，含關鍵字/文案/預算，業主已確認輸入）。建議：兩份 PLAN 合併或改名其一（例如你的改 `GOOGLE-ADS-PHASE1.md`），避免業主／瀏覽器 Claude 拿錯份。
5. **水塔/水管頁 OG 圖沿用 `home-leak-knowledge.png`**：分享到 LINE/FB 時會顯示漏水知識圖。建議比照 homeclean 補兩張專屬 OG。
6. **表單地址欄可加縣市前置驗證（UX，小）**：bot 端地址必含縣市，缺縣市會多一輪追問。前台送出前若偵測不到 22 縣市之一，就地提示「請加上縣市（例：新北市）」，可省一輪 LINE 往返。縣市清單可抄 bot `src/catalog.ts` 的 `TW_CITIES`。
7. **多品項需求的期待管理（UX，小）**：客戶在表單加多行品項（例：壁掛×2＋室外機×1）時，bot 訂單以第一行為主、其餘進備註由專員確認。可考慮在表單加一句小字「多項需求將由專員一併確認報價」，避免客戶以為卡片會列出全部品項。
8. **`ldOpenQuote` 的 history 處理**（讀碼觀察，非 bug）：Escape/背景點擊/送出三路都正確走 `history.back()`＋`qPendingNavigation`，LINE webview 內不 pushState 也對。唯一邊角：pushState 後使用者若用瀏覽器「前進」再「返回」，`qHistoryOpen` 已被 popstate 清成 false，再關閉 modal 會少退一層 history（頁面沒壞，只是返回鍵行為多一步）。優先度低，知道就好。

## 📌 給業主

- 上面 #1/#2 這種「前台改了訊息格式、後台 parser 沒跟上」的問題，已寫進雙方交接文件的同步規則（BACKEND-HANDOVER §3A）；這次是新增欄位沒觸發同步。建議日後前台改 `msgLines` 任何一行，commit message 註明「⚠️ 需同步 bot parser」。
- 本報告的後台修復已上線（bot `9534450`，87 測試綠）。
