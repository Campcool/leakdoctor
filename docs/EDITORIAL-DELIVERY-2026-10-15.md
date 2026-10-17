# 灰汰郎首頁及六服務精修交付

分支：codex/huitailang-editorial-20261015。尚未合併／部署。業主後續轉向幼稚園網站更新，本次成果先保存為可檢視分支。

## 完成
- 首頁深藍／暖橘首屏、暖白／暖灰章節、雙欄服務與原有起價可見、實拍前後圖完整呈現、FAQ與文案閱讀節奏。
- 六服務頁一致的標題、圖說、字級和詢價入口。修正水塔／水管原有 absolute 圖片與新圖說版面的衝突。
- 設計權威仍為 DESIGN.md；使用技能、基準及方向見 design-plans/EDITORIAL-2026-10-15.md。
- 價格catalog、LINE／GA4常數、Bot、接單與正式資料皆未改。

## 已驗證
- node scripts/validate-site.mjs：23個根頁面／34個sitemap網址通過（先移出既有 _site 產物以免來源掃描重複）。
- node --test --test-concurrency=1 scripts/test-header-contract.mjs scripts/test-home-service-hub.mjs scripts/test-process-editorial.mjs scripts/test-process-media.mjs scripts/test-reading-rhythm.mjs scripts/test-og-contract.mjs：132/132。
- 既有 verify-conversion-browser：320／375／768／1440，六服務詢價、失敗重試／去重、回執、資料保留及分析／儲存隱私通過。
- verify-editorial-browser：7頁×4寬度共28組，放大文字無頁面水平溢出、無破圖／本機404／JS錯誤，圖說位於圖下；首頁價格、試算數量保留、原生FAQ與無JS備援通過。
- 系統 Chromium 154.0.8037.57；外部請求以 fixture 攔截，未送正式訂單、分析或LINE訊息。截圖位於 /workspace/graywolf-evidence，代表圖附於本目錄 previews。
- git diff --check 通過。

## 未完成與界線
- 環境缺少 rsync，prepare-pages-artifact.sh 未完成；sudo 亦不存在。CI使用既有Ubuntu映像的rsync，發布前仍需完成正式白名單產物驗證。
- 尚未執行本分支遠端CI／發布；無Lighthouse、Firefox／WebKit、真機與LINE webview結果。外部字體由系統繁中字型備援，正式字體載入仍需覆核。
- 既有LINE品牌綠的對比取捨保留；不宣稱全站WCAG認證或成交率提升。
