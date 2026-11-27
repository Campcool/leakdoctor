# 2026-11-27 搜尋曝光優化

本次使用者授權：依更新AI-skill盤查各專案並全面優化，SEO／GEO曝光優先、UI／UX及功能為輔。官網與內部工具分開；不購買廣告、不代發訊息、不修改正式訂單或放寬存取。

## 問題與結果

地區頁從四項補齊六項服務，百科新增六項詳細說明的原生連結；商家及服務provider共用穩定的#business識別，原本全台Country範圍改對齊已公開服務區（居清保留原本五區）。本輪更新17頁及其sitemap日期，不批次刷新未變文章。

基準main commit：`146c9929bfaac98ed924e111b74fc83f726dabb7`。以新提交回退（revert）並重跑既有部署門禁，不回退既有資料。

## 驗證

既有validator全綠；5組Node測試107項通過；搜尋門禁34個HTML、34個sitemap項目。

新增scripts/check-search.mjs，以正式產物核對sitemap檔案、canonical、可索引／可摘要、title／description唯一性、初始HTML H1、og:url及JSON-LD公開引用；自家商家評分不當作評論摘要資格。既有瀏覽器門禁保留，新清潔服務頁已補進版面及操作測試。PR／Actions最終結果以GitHub為準。

本機瀏覽器無可執行引擎，官方瀏覽器下載403，遠端預覽不能連到本機，因此未聲稱本機截圖目視或三引擎已驗。CI通過前不把本機靜態綠燈當成瀏覽器通過；無正式LINE訊息、訂單或Google分析事件測試污染。

## 成效與待辦

- 正式首頁HTTP 200、現有公開搜尋可找到品牌；搜尋結果僅是抽查，不是Google完整收錄量／排名／GSC報告。
- 新頁曝光、自然點擊、AI引用與有效詢問尚未量測，不能保證排名、營收或AI推薦。發布後應核對新頁HTTP與原始HTML，再觀察GSC／Bing收錄和成效。
- Google商家、Search Console、Bing Webmaster及GA4／Ads需帳號資料才可驗證；缺品牌衡量ID不可借其他品牌。華兒園師資／授權照片、收費／名額等補件維持待補。
- 潔美淨11/27搜尋抽查摘要仍有舊統編60214473及9樓之2；正式來源已是61475587及8樓之2。這是搜尋快照延遲的證據，尚未完成引擎重抓；不得把搜尋快照當成復原舊資料的依據。

## 官方依據

- https://developers.google.com/search/docs/appearance/ai-features — 可索引、可摘要、文字可讀及站內連結；無必要AI專用檔或特殊schema。
- https://developers.openai.com/api/docs/bots — OAI-SearchBot、GPTBot與ChatGPT-User用途分開；訓練允許不等於搜尋引用保證。本輪保留既有robots政策。
- https://developers.google.com/search/docs/appearance/structured-data/review-snippet — 自家LocalBusiness評論不符合評論摘要資格；不影響展示原有可查證評論。
