# 灰汰郎前台與營運整合改版

基準：前台 c4fcc55、bot 2f40b9f。目標是提高完成詢價的便利性、減少重複建單與管理者補問；成效需部署後以實際漏斗數據評估，不預先宣稱提升比例。

## 實作範圍
1. 實際案例與價格雙入口、三段式需求整理、送出後保留 LINE 傳送及複製入口。
2. 同一需求 UUID 重送回傳同一線索；改動草稿更新同一單號；working_lead 僅首次銜接送出。
3. 營運中心：案件、地區與排程、官網線索、夥伴準備度、客服與合作申請；全體 SQL 計數與限量清單分開標示。
4. 真 SQLite、離線 webhook、跨倉庫價格合約、手機/桌面瀏覽器與部署驗證。

## 營運底線
沿用正式 GA4 G-1H1X1X9QZE、LINE @478xvlgl 與既有牌價。漏水、需報價、未知成本及虧損不擴大自動派工，純居清議價例外沿用。水男孩 1500 車馬費須個案討論。案例須實際圖；不捏造評論、保固、檔期與營收。無新增 D1 migration、無正式測試 LINE 推播、四個 cron 不變。

## 度量
觀察 quote_step → generate_lead → working_lead → confirmed/dispatch，前台事件不傳姓名、電話、地址或 LINE 訊息 URL。working_lead 首次資料庫銜接成功後送出，程序中斷仍可能漏報，未承諾分析事件 exactly-once。

## 驗證與發布
132項前台測試、品牌與結構檢查、真SQLite跨bot八種價格情境及A/B修正通過；固定Playwright1.63.0在320/375/768/1440驗證首頁、六服務、逾時重送同鍵、保留錯誤、LINE回執與追蹤／storage無聯絡個資。348項bot測試含並發建單／第一個線索連結、地址完整性、知識庫FAQ、授權及lead明細。

先部署相容舊前台的bot，再發布本站；以 meta ld-release=2026-10-06-conversion-operations、Actions和中央交付快照核對。所有頁面header.js引用版本更新，避免舊快取暫時保留單頁表單。

## 限制與後續
同需求UUID在sessionStorage最長24小時／20筆；禁止storage後只保留同頁記憶，關頁後不保證去重。客戶端generate_lead依鍵去重，bot working_lead依首次DB銜接去重；網路／程序中斷仍可能漏報，不宣稱跨系統exactly-once。正式LINE真機送出、管理者登入的實際資料、GA4／Ads後台與成交提升比例待核對，隔離測試不代替這些結果。

回滾前台可回前一版本；bot回滾須保留新版leadId parser與去重，避免已傳給消費者的訊息不能接續。沒有新增D1 migration，不刪除真實資料。
