# Service Options Database - 2026-07-10 09:07 Asia/Taipei

本文件說明 `data/service-options.json` 的用途與目前分類。這份資料是給網站估價器、LINE Bot 快選按鈕、AI tool call、未來 D1 seed data 共用。

## 設計原則

1. 客戶少打字：優先用快選按鈕取得服務類型、機型、數量、地區、時段。
2. AI 不亂報價：只有網站/AI-README 已確認的價格才放固定價格；其他先標 `quote_required`。
3. 後續可擴充：同一份 JSON 可轉成 D1 資料表，也可用於 LINE Flex / Quick Reply。
4. 保留人工接手：商用、大樓、水泥水塔、故障、客訴、殺價、退款都要轉人工。

## 參考資料

- LINE Quick Reply 官方文件：Quick Reply 可讓使用者直接點選回覆，一則訊息最多 13 個 quick reply buttons，因此資料庫採分步快選而不是一次塞滿所有選項。https://developers.line.biz/en/docs/messaging-api/using-quick-reply/
- LINE Webhook 官方文件：Webhook 會將使用者事件送到 bot server，後台需要驗簽與快速處理。https://developers.line.biz/en/docs/messaging-api/receiving-messages/
- 灰汰郎目前公開價格來源：`AI-README.md` 與現有網站服務頁。未公開或未確認的四方吹、商用、水塔、水管清洗價格均先標示 `quote_required`。

## 已建立分類

### 冷氣清洗

- 壁掛分離式：固定價 $1,499 / 台。
- 吊隱式冷氣：固定價 $2,599 / 台。
- 四方吹冷氣：需報價。
- 商用冷氣：需報價。
- 窗型冷氣：固定價 $3,000 / 台。

快選會先問「幾台」，再問地區、希望時段、稱呼電話。四方吹、商用冷氣需要照片或現場條件，不讓 AI 自行報固定價。

### 洗衣機清洗

- 直立式洗衣機：固定價 $1,299 / 台。
- 滾筒式洗衣機：固定價 $2,999 / 台。
- 商用/投幣洗衣機：需報價。

快選會問機型、台數、容量級距。若客戶提到故障碼、漏水、無法排水、堆疊或嵌入櫃體，轉人工確認。

### 水塔清洗

- 屋頂不鏽鋼/塑膠水塔：以顆數與容量判斷，需報價。
- 水泥上水塔：需報價。
- 水泥下水塔/地下蓄水池：需報價。
- 上下水塔一起清洗：需報價。

水塔的快選重點是「顆數、容量、上水塔/下水塔、是否水泥、是否需停水公告」。容量選項先用常見級距：500L、1000L、1500L、2000L、3000L、5000L 以上，並允許客戶選「不確定」。

### 水管清洗

- 住家水管清洗：需報價。
- 公寓大樓水管清洗：需報價。

水管清洗的快選重點是「屋齡、管材、出水點數、是否有黃水/異味/水量變小、是否能停水」。它是清潔管路內部沉積與異味的服務，需與漏水檢測、水電維修分開判斷；若客戶描述破管、滲水、牆面潮濕或水表異常，應轉漏水檢測流程。

## 建議轉成 D1 的表

第一版可以先直接讀 JSON；等後台成形後，再轉成 D1：

```sql
service_groups(id, label, default_unit, customer_prompt, sort_order, active)
service_options(id, group_id, label, short_label, pricing_status, base_price, price_unit, customer_description, ai_notes, active)
service_aliases(id, option_id, alias)
service_selectors(id, option_id, selector_type, label, options_json)
handoff_rules(id, scope, rule)
```

## LINE Bot 使用方式

建議流程：

```text
1. 選服務：冷氣 / 洗衣機 / 水塔 / 水管 / 其他
2. 選機型、水塔類型或水管清洗需求
3. 選數量或容量
4. 選地區
5. 選希望時段
6. 請客戶補照片或電話
7. 建立 draft order
```

AI 可以做自然語言理解，但回覆價格前必須先查 `service-options.json` 或 D1。若 `pricing.status = quote_required`，只能說「需要照片/現場條件確認」，不可直接報價。

## 給 Claude / Codex 後續討論

1. 水塔清洗與水管清洗已於 2026-07-13 補成正式前台服務頁，但價格仍維持「人工確認」。
2. 四方吹與商用冷氣是否要設定初步價格級距，或維持全部人工報價？
3. `data/service-options.json` 要繼續留在網站 repo，還是未來搬到私有 bot repo 並由網站只讀 API？
4. 若要讓客戶在網站直接快選，是否把這份 JSON 接到 `header.js` 的 quote modal？
