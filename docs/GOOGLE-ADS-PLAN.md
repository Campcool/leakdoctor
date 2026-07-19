# Google Ads Launch Plan｜灰汰郎

> 目標：先用 Google Search 抓「已經在找清洗/檢測/修補」的高意圖需求，讓客戶進站後用 LINE 預約或送出需求表單。暫不先開 Performance Max / Display / YouTube，避免沒有轉換資料時被系統花在低意圖流量。

最後更新：2026-07-19（Asia/Taipei）
網站：`https://leakdoctor.tw/`  
GA4：`G-1H1X1X9QZE`  
主要轉換：`quote_submit`（送出網站表單並開啟 LINE 預填訊息）  
次要訊號：`quote_open`、`line_click`、`line_direct_click`

---

## 1. 目前可直接啟動的基礎

- 全站已安裝 GA4，事件由 `header.js` 的 `ldTrack()` 統一送出。
- 目前已送出的重要事件：
  - `quote_open`：使用者打開預約/估價 modal。
  - `quote_submit`：使用者填完表單送出，網站會組 LINE 預填訊息。
  - `line_click`：使用者點 LINE 連結。
  - `line_direct_click`：使用者從首頁首屏或手機底部列直接開啟 LINE；`placement` 可區分入口。
  - `service_click` / `area_click`：服務與地區入口點擊。
- 首頁與六大服務頁皆可作為搜尋廣告落地頁：
  - `/aircon.html`
  - `/washer.html`
  - `/homeclean.html`
  - `/water-tank.html`
  - `/pipe-cleaning.html`
  - `/leak-repair.html`

---

## 2. Google Ads / GA4 轉換設定

依 Google 官方文件，Google Ads 可追蹤網站動作、電話、App、離線轉換等；本站第一階段使用「網站動作」作為轉換。Google 也支援從 GA4 事件建立/匯入 Google Ads 轉換，前提是 Google Ads 與 GA4 已連結、Google Ads 開啟自動標記，且 GCLID 不能被網站導向流程移除。

官方參考：
- Google Ads conversion tracking types: `https://support.google.com/google-ads/answer/1722054`
- Create conversions from Google Analytics events in Google Ads: `https://support.google.com/google-ads/answer/2375435`

### 必做

1. 在 GA4 後台確認 `quote_submit` 已出現在 Events。
2. 將 `quote_submit` 標記為 Key event。
3. Google Ads 連結 GA4 property。
4. Google Ads 開啟 Auto-tagging。
5. 在 Google Ads 建立/匯入 GA4 conversion：
   - Name: `lead_quote_submit`
   - Category: `Lead`
   - Source: GA4 event `quote_submit`
   - Optimization: Primary
   - Count: One
   - Value: 先用固定值，建議 `TWD 500` 作為初估 lead value，等實際成交率回填後再調整。
6. 建立次要轉換：
   - `quote_open`：Secondary，觀察用，不給出價最佳化。
   - `line_click`：Secondary，觀察用。LINE 點擊不等於有效詢價，不建議第一階段當 Primary。
   - `line_direct_click`：Secondary，觀察雙 CTA 中直接 LINE 路徑；不可與 `line_click` 相加當成獨立人次。

### 暫不做

- 不直接在程式碼新增 `AW-XXXXXXXXX` Google Ads tag，因為目前尚未提供 Google Ads Conversion ID / Label。
- 不啟用 Enhanced Conversions，除非後續有明確同意與隱私揭露更新；本站表單會收電話與地址，需避免未經確認就把 PII 傳給廣告平台。
- 不用電話通話轉換，因為前台策略是不公開電話 CTA。

---

## 3. 第一階段 Campaign 架構

命名格式：

`GOOG_Search_[Intent]_[Service]_[Geo]_[YYYYQ]`

### Campaign A：清潔核心服務

Name: `GOOG_Search_HighIntent_Cleaning_NorthWest_2026Q3`

用途：冷氣、洗衣機、居家清潔。  
落地頁：各服務頁。  
地區：台北、新北、基隆、桃園、新竹、苗栗、台中。  
語言：中文。  
網路：Google Search only，先不要開 Display Network。  
出價：追蹤確認後可用 Maximize Conversions；若轉換量不足，先用 Maximize Clicks + CPC cap 控制測試成本。  

Ad groups:
- `AG_AirconCleaning`
- `AG_AirconSymptoms`：室內機結霜／結冰、吹白霧／霧氣、風量變小；文案先分流髒污與故障，不承諾清洗必定解決。
- `AG_WasherCleaning`
- `AG_HomeCleaning`

### Campaign B：用水/漏水高意圖

Name: `GOOG_Search_HighIntent_WaterLeak_NorthWest_2026Q3`

用途：水塔清洗、水管清洗、漏水檢測。  
落地頁：各服務頁。  
同樣先只開 Search。  

Ad groups:
- `AG_WaterTankCleaning`
- `AG_PipeCleaning`
- `AG_PipeSymptoms`：熱水器點不著、只有熱水變小、熱水水量／水壓不足；文案先比較冷熱水並排除熱水器與閥件問題。
- `AG_LeakRepair`

### 症狀型搜尋的投放原則

- 客戶不一定先搜尋服務名稱，常從「冷氣結霜」「冷氣吹白霧」「熱水器點不著」「熱水水量不足」開始找原因；這些字另建 ad group，讓廣告與落地頁使用相同語言。
- 第一階段只使用 exact／phrase，不先使用 broad。症狀查詢較容易混入維修、DIY 與危險故障需求，需要每週檢查 Search terms 再擴字。
- 廣告不可宣稱清洗一定能修好：冷氣結霜也可能是冷媒、風扇或感測器；熱水器點火失敗也可能是電池、瓦斯、點火器、濾網、閥件或本體故障。
- 安全分流：冷氣若有焦味、真正煙霧或異常聲音，文案與頁面都要求先停機維修；不要用「洗完就好」吸引不適合的案件。

### Campaign C：品牌保護

Name: `GOOG_Search_Brand_GreyTaro_All_2026Q3`

用途：保護灰汰郎、台灣漏水醫生、leakdoctor.tw、舊品牌搜尋。  
預算小，但必開，避免品牌詞被競品或目錄站吃走。  

Ad groups:
- `AG_Brand`

---

## 4. 預算建議

尚未提供正式預算前，先用測試級配置：

- 最低測試：`NT$500/day`，跑 14 天。
- 比較有資料量：`NT$1,000/day`，跑 14 天。
- 分配：
  - 清潔核心服務：50%
  - 用水/漏水高意圖：40%
  - 品牌：10%

前兩週不要頻繁調整預算。若要放大，單次增加 20-30%，觀察 3-5 天。

---

## 5. 第一階段 KPI

先看 lead quality，不追求大量點擊。

| 指標 | 第一階段判斷 |
|---|---|
| CTR | Search 非品牌低於 3% 時，先檢查關鍵字與廣告文字是否不吻合 |
| CPC | 先記錄，不硬設目標；清潔與漏水關鍵字競價可能差異大 |
| `quote_open` rate | 進站後願意打開估價，代表落地頁與 CTA 有吸引力 |
| `quote_submit` rate | 第一階段主要成效 |
| LINE 實際有效對話率 | 最終要由後台人工/LINE Bot 回填，單靠 GA4 不足 |
| 成交率 | 後續建立 offline conversion 或至少月報手動回填 |

---

## 6. 地區策略

第一階段地區不用分太細，先跑有服務能力的中北部：

- 台北市
- 新北市
- 基隆市
- 桃園市
- 新竹縣市
- 苗栗縣
- 台中市

若花費上來，再拆：

- `North_Core`：台北、新北、基隆、桃園
- `NorthWest_Extend`：新竹、苗栗
- `Central`：台中

---

## 7. Landing Page 對應

| Ad group | Landing page | 轉換重點 |
|---|---|---|
| `AG_AirconCleaning` | `/aircon.html` | 價格清楚、機型、台數、LINE 預約 |
| `AG_AirconSymptoms` | `/aircon.html` | 結霜先停機、白霧與煙分辨、清洗／維修分流 |
| `AG_WasherCleaning` | `/washer.html` | 直立式/滾筒式、拆槽理由、品牌型號 |
| `AG_HomeCleaning` | `/homeclean.html` | 定期、大掃除、退租、裝潢細清，抽油煙機放在居家清潔內 |
| `AG_WaterTankCleaning` | `/water-tank.html` | 容量、顆數、停水、入口通道 |
| `AG_PipeCleaning` | `/pipe-cleaning.html` | 屋齡、管材、出水點、漏水風險 |
| `AG_PipeSymptoms` | `/pipe-cleaning.html` | 冷熱水比較、熱水器點火、水量不足、設備／管路分流 |
| `AG_LeakRepair` | `/leak-repair.html` | 水痕、壁癌、漏點定位、修補方式 |
| `AG_Brand` | `/` | 品牌保護、全服務入口 |

---

## 8. Google Ads 後台建立順序

1. 連結 GA4。
2. 開啟 auto-tagging。
3. 確認 `quote_submit` 在 GA4 事件中出現並設為 key event。
4. 匯入 `quote_submit` 為 Primary conversion。
5. 匯入 `quote_open`、`line_click`、`line_direct_click` 為 Secondary conversions。
6. 建立 shared negative keyword list：見 `ads/google-ads-negative-keywords.txt`。
7. 建立 Campaign A / B / C。
8. 匯入關鍵字：見 `ads/google-ads-keywords.csv`。
9. 建立 RSA：見 `ads/google-ads-rsa.csv`。
10. 加入 assets：見 `ads/google-ads-assets.md`。
11. 手動用廣告預覽工具搜尋主要字，確認不觸發不相關查詢。
12. 上線後前 72 小時只看明顯錯誤，不急著調整。

---

## 9. 上線前需要業主確認

- 每日預算：最低 `NT$500/day`，建議 `NT$1,000/day` 才比較快有資料。
- 是否只投中北部，或台中以南也先開小額測試。
- Google Ads 帳號是否已建立、付款方式是否已設定。
- Google Ads Customer ID。
- 是否要我後續直接在帳號內建立 campaign。
