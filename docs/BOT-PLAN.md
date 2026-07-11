# 灰汰郎 LINE Bot 後台規劃書 v2.2

狀態：**P1 已上線並通過 Claude 驗收（2026-07-11）**，真機端到端測試成功（訂單 HTL-20260710-66F743）；待設 PARTNER_LINE_USER_ID 後即完整運轉；拆帳比例待談（P3 前定案）
時間規範：本專案所有時間戳一律台灣時間（Asia/Taipei, UTC+8）
建立：2026-07-10｜v2.2 修訂：2026-07-10（採納 Codex 意見）｜對應待辦見 AI-README.md §7

## 0. 業主已確認的決策（v2 依此修訂）

| # | 決策 |
|---|---|
| 1 | 後端開**私有新 repo**（建議 `Campcool/huitailang-bot`） |
| 2 | **無搶單／無派單匹配**。唯一協作夥伴＝洗洋洋（窗口：老闆娘），她自行協調施工人力 |
| 3 | 收款方式聽 AI 建議（本文 §7 給出建議與綠界部分退款問題的解答） |
| 4 | 車馬費統一 **$500**，無法施作時**全額歸洗洋洋**（2026-07-10 確認） |
| 5 | 夥伴目前僅洗洋洋一家 |
| 6 | AI 對客戶**不明寫時效承諾**：時間由洗洋洋與客戶直接洽談，話術僅暗示彈性配合（見 §4 護欄） |
| 7 | **成單自動轉洗洋洋，不設核准關卡**（老闆全程 CC＋保留取消權）（2026-07-10 確認） |
| 8 | 拆帳模式（固定介紹費 vs 抽成）：**業主與洗洋洋還在談**，P3 對帳實作前需定案；系統設計上兩種都支援（config 可切換） |
| 9 | **後端 repo 定名 `Campcool/leakdoctor-bot`**（私有，2026-07-10 業主建立；取代原規劃名 huitailang-bot） |
| 10 | 金鑰狀態（2026-07-10 19:05 +8）：LINE Channel secret/access token ✅、Cloudflare Account ID/API token ✅、**Anthropic API key ✅（業主已交付 Codex）**。金鑰僅存於 Cloudflare secrets／GitHub Actions secrets，絕不入 git |
| 11 | **P1 初版由 Codex 實作，Claude 驗收**（驗收清單見本檔文末 Claude 2026-07-10 備註與 AI-README） |

---

## 1. 目標

把「詢價 → 成單 → 轉洗洋洋 → 洗洋洋與客戶敲日期 → 完工／無法施作 → 收款 → 結案」整條流程放上 LINE，AI 處理對話與流轉，人只做關鍵確認。三個角色：

- **客戶**：問答、報價、下訂、收提醒
- **洗洋洋老闆娘**：收單、直接聯繫客戶敲時間、回報結果
- **老闆（業主）**：全程同步通知、保留否決／改單權、看日報與月結報表

## 2. 系統架構

```
客戶／洗洋洋／老闆 LINE ──webhook──▶ Cloudflare Workers（單一後端）
                                      ├─ 角色路由（依 userId：客戶／洗洋洋／老闆）
                                      ├─ AI 對話引擎：Claude API（tool use）
                                      │    └─ 知識庫：價目表＋FAQ（自 llms.txt 同步）
                                      ├─ 訂單狀態機（§3）
                                      ├─ D1 資料庫：orders/customers/events/payments/settlements
                                      ├─ Cron：提醒、逾時追蹤、日報、月結
                                      └─ 管理頁（老闆用，Basic Auth）
```

技術選型不變：Cloudflare Workers + D1（免維運、近乎零成本）、現有 OA @478xvlgl 啟用 Messaging API。

**v2.2 架構決議（採納 Codex 意見）：**
- **Webhook 快速回應**：收到事件先驗簽 → 寫入 `webhook_events`（去重）→ 立即回 200；AI 分析、推播、通知走 `ctx.waitUntil()` 背景處理。免費方案即可做到；Cloudflare Queues 需付費方案（US$5/月），介面預留、量大再升級
- **AI 引擎接法**：做一層薄 provider adapter，預設 Claude（tool use），保留可換 GPT 等
- **AI 工具介面（P1 就實作）**：`getServicePrice(service, quantity, area)`、`checkServiceArea(area)`、`getTravelFee(area, service)`、`getFaqAnswer(topic)`、`createDraftOrder(...)`、`requestHumanHandoff(reason)`——價格與規則一律由工具查資料，AI 只負責理解與轉述
- **價格/FAQ 單一來源**：bot repo 的 JSON config（以本 repo `data/service-options.json` 為種子），git 版控可稽核；穩定後再做 D1 管理頁供業主自行編輯
- **部署路徑（2026-07-10 定案）**：bot repo 內建 GitHub Actions（cloudflare/wrangler-action），CF/LINE/Anthropic 金鑰放 repo Settings→Secrets→Actions。原因：Claude 的雲端環境網路政策擋 api.cloudflare.com，無法本地 deploy；Actions 部署對 Codex/Claude/業主三方都可用
- **轉人工規則（handoff_rules，獨立設定不靠 AI 自行判斷）**：殺價／客訴／退款賠償、漏水複雜案、所有 `quote_required` 項目（商用、四方吹、水泥水塔…）、故障維修問題、AI 連續 2 次無法理解、客戶輸入「真人」
單一夥伴讓系統少掉：夥伴註冊管理、地區/服務匹配、搶單鎖定、多方逾時改派——**P2 工作量約砍半**。

## 3. 訂單狀態機（v2 簡化版）

```
[詢價中] --AI收齊資料--> [草稿] --客戶確認--> [已成單]
    │（網站表單進線直接建草稿）        │
    │                                 ├─ 自動同步：洗洋洋（完整單）＋老闆（CC，附「取消/改單」鈕）
    │                                 ▼
    │                       [洗洋洋處理中] --她與客戶直接聯繫敲時間-->
    │                                 │  （bot 提供客戶電話與偏好時段給她）
    │                                 ▼ 她回報「已約定 X月X日」
    │                            [已預約] --D-1 自動提醒客戶＋洗洋洋-->
    │                                 ▼ 施工日 bot 問洗洋洋結果
    │                    ┌── [已完工] --> [待收款] --對帳(§7)--> [結案]
    │                    └── [無法施作] --> [車馬費 $500 結案]
任一階段：客戶取消 → [已取消]（記原因）；老闆可隨時改狀態
逾時追蹤：成單後 24hr 洗洋洋未回報進度 → 提醒她＋通知老闆
```

預設**不設老闆核准關卡**（成單即自動轉洗洋洋，速度優先），但保留設定開關可改為「須老闆核准才轉單」。每次狀態變更寫入 events 表＝稽核軌跡＋報表依據。

## 4. 客戶端對話設計

1. **網站表單進線**：解析固定格式「【灰汰郎 到府服務詢價】…」直接建草稿（規則解析，不耗 AI）。
2. **自由對話**：AI 負責 FAQ、slot filling（服務→機型/坪數→地區→偏好時段→姓名電話地址）、規則估價（同網站估價器，AI 不得自創價格）。
3. **確認卡**：Flex 卡片列草稿＋預估價＋「確認預約／修改／找真人」。
4. **護欄（v2 強化）**：
   - **時效話術**：不寫死任何 SLA。範本：「確認後將由服務團隊直接與您聯繫安排時間，通常都能配合您方便的時段 😊」——暗示彈性，不承諾 48hr/24hr 到府
   - 客戶偏好時段記進訂單備註轉給洗洋洋，由她去談
   - 價格/保固只出自規則表；殺價、客訴、賠償一律轉人工（push 老闆）
   - 「真人」關鍵字或 AI 連續 2 次無法理解 → 轉人工

## 5. 洗洋洋協作流程（v2 改為「直接聯繫」模式）

- **上線設定**：老闆娘加 OA，一次性把她的 userId 登錄為夥伴角色（管理頁按一下）
- **收單**：成單即時 push 完整訂單卡（服務/明細/預估價/地址/客戶電話/偏好時段）
- **敲時間**：她直接打電話或 LINE 聯繫客戶洽談（不經 bot 居中）——符合業主要求的「協議方式」
- **回報**：訂單卡上三顆按鈕，隨時可按
  - 「✅ 已約定時間」→ 選日期時段 → 進[已預約]，bot 同步發確認卡給客戶
  - 「🚫 無法施作」→ 選原因 → 進車馬費結案流程
  - 「💬 備註」→ 補充狀況（進 events，老闆看得到）
- **完工日**：bot 主動問「今日 #123 結果？」→「已完工（可附照）／改期／無法施作」
- 對她的體驗目標：**不用學任何新工具，全部在 LINE 按按鈕**

## 6. 老闆端

- 全程 CC 通知：新草稿、成單、洗洋洋已約定、完工、無法施作、轉人工
- 通知卡上直接按：「取消單」「改價」「加備註」
- 指令：「今日」「本週」「未結案」「訂單 #123」
- 每日 21:00 日報；每月 1 號**月結拆帳報表**（§7）
- 管理頁：訂單列表/匯出 CSV、價目與車馬費設定、核准關卡開關

## 7. 收款與對帳（v2 重寫——直接回答業主問題）

### 建議：完工收款（現場付洗洋洋）＋月結拆帳，**先不用綠界**

**理由：**
1. 清潔業台灣慣例就是完工當場付（現金/轉帳給師傅），客戶零門檻、不需預付
2. **綠界部分退款確實麻煩**（回答你的問題）：
   - 信用卡：可部分退刷，但要走後台或 API 手動操作，且手續費不退
   - ATM 虛擬帳號／超商代碼：**金流根本不支援退款**，只能你自己轉帳退回，等於又回到手動
   - 「先收全額、無法施作再退到只剩車馬費」這個流程，正是部分退款最痛的場景
3. **正確設計是反過來：先確定最終金額，才產生收款**。完工＝收全額；無法施作＝只收 $500 車馬費。金額確定在前，就永遠沒有部分退款問題

**因此對帳的真正主體是：灰汰郎 ↔ 洗洋洋 的月結拆帳**（客戶付她，她月結給平台介紹費；或反向）：

| 階段 | 做法 |
|---|---|
| v1（P3 交付） | 每單完工時洗洋洋回報實收金額 → 系統累計 → 每月 1 號自動產出對帳單（單數、總額、應付介紹費）push 給雙方 → 老闆確認收到款項按「結清」 |
| v2（後期可選） | 若之後想改「客戶付灰汰郎」：完工後 bot 發綠界付款連結**以最終金額**出帳（信用卡/ATM），webhook 自動銷帳，再月結撥款給洗洋洋。因為金額出帳前已確定，一樣不會有部分退款問題 |

**待業主補決策（§14）**：拆帳方式與比例（每單固定介紹費？抽成 %？）、車馬費 $500 歸誰。

## 8. 資料模型（D1）

```
customers(id, line_user_id, name, phone, address, created_at, note, blacklist)
orders(id, customer_id, service, detail_json, area, address, est_price,
       final_price, travel_fee_only(bool), status, scheduled_at,
       created_at, closed_at, source[web_form|chat], cancel_reason, pref_time)
events(id, order_id, actor[customer|partner|owner|system|ai], from_status, to_status, note, created_at)
payments(id, order_id, amount, method[onsite|transfer|ecpay], reported_by, confirmed_at)
settlements(id, month, orders_count, gross, fee_due, status[open|confirmed], confirmed_at)
conversations(line_user_id, role, last_intent, handoff_flag, updated_at)
config(key, value)   -- 車馬費、拆帳比例、核准關卡開關、老闆 userId
partners(id, line_user_id, name, phone, active)   -- v2.2 恢復（Codex 建議）：現在只有一筆（洗洋洋），保留表結構避免未來重構
webhook_events(id, provider, event_id, line_user_id, body_hash, handled_at, created_at, UNIQUE(provider,event_id))   -- v2.2 新增：LINE 事件去重（idempotency），防重複建單
```
（v2.2 orders 另補：`public_id`（對外單號）、`utm_json`（來源追蹤）、`quote_version`（報價版本）、`partner_id`。）

## 9. 排程（Cron）

> ⚠️ Cloudflare Cron Triggers 使用 **UTC**。下列為台灣時間（+8），寫入 wrangler.toml 時須換算：09:00→`0 1 * * *`、18:00→`0 10 * * *`、21:00→`0 13 * * *`。


- 每小時：成單 24hr 洗洋洋未回報 → 提醒她＋通知老闆；草稿 24hr 未確認 → 跟進客戶一次
- 每日 09:00：今日施工清單 → 老闆＋洗洋洋
- 每日 18:00：明日施工 D-1 提醒客戶＋洗洋洋
- 每日 21:00：老闆日報
- 每月 1 號：月結拆帳單
- 完工 +2 日：客戶滿意度／Google 好評邀請
- 完工 +11 個月（冷氣/洗衣機）：回購提醒

## 10. 內建補強項目（不變）

評價收集導 Google 商家、回購行銷、奧客黑名單（取消 2 次自動標記並在訂單卡警示）、個資保護（結案 1 年遮罩電話地址）、LINE 推播額度監控、月報（營收/成交率/服務占比）。

## 11. 成本估算（月）

| 項目 | 費用 |
|---|---|
| Cloudflare Workers + D1 | NT$0（免費額度內） |
| Claude API（Haiku，估 500 對話/月） | 約 US$3–10 |
| LINE OA 推播 | 單一夥伴模式推播量低，免費 200 則/月初期夠用；量大升 Light NT$800/月 |
| 綠界（僅 v2 對帳才需要） | 無月費方案，交易手續費約 2–2.8% |
| **合計（初期）** | **約 NT$100–400/月** |

## 12. 分期實作

| 期 | 內容 | 交付標準 |
|---|---|---|
| **P1 MVP** | Workers 骨架＋webhook 驗簽、網站表單解析建草稿、AI FAQ+slot filling+估價（含 §4 話術護欄）、確認卡、成單自動轉洗洋洋＋老闆 CC、D1 schema、管理頁只讀 | 真實客戶從 LINE 詢價到洗洋洋收到完整訂單卡 |
| **P2 協作流** | 洗洋洋回報按鈕（已約定/無法施作/備註）、已預約確認卡、完工日詢問、車馬費結案、24hr 逾時提醒 | 一張單全程在 LINE 跑完，不碰試算表 |
| **P3 對帳＋排程** | 完工實收回報、月結拆帳單、D-1 提醒、日報、草稿跟進 | 老闆每天只看日報、每月按一次結清 |
| **P4 成長** | 好評邀請、回購提醒、月報、（可選）綠界完工後出帳 | 系統自己創造回頭營收 |

## 13. AI 能做到的程度 vs 業主前置作業

**AI 可直接完成 ≈90%**：全部程式碼、狀態機、Flex 卡片、AI 對話引擎、模擬 webhook 全流程測試、部署腳本與文件。

**業主前置（AI 會給圖文步驟，合計約 1 小時）：**
1. 建立私有 repo `huitailang-bot` 並授權
2. LINE Developers Console：OA 啟用 Messaging API、拿 Channel Secret/Token、回應模式改 Webhook
3. Cloudflare 帳號＋部署授權（API Token）
4. Anthropic API key
5. 請洗洋洋老闆娘加 OA（上線時登錄她的 userId）
6. 上線前雙方用手機實測一輪

**AI 不做**：殺價/客訴判斷（轉人工）、代簽金流合約、銀行帳戶直連（台灣個人戶無此 API）。

## 14. 尚待業主決定（v2.1 僅剩 1 題）

1. **拆帳模式與比例**（還在談）：固定每單介紹費 $X 或抽成 X%。**不擋 P1/P2 開工**，P3 對帳實作前定案即可；config 兩種模式都支援。

~~2. 車馬費歸屬~~ → 已定：全額歸洗洋洋
~~3. 核准關卡~~ → 已定：自動轉單，老闆 CC＋保留取消權
~~4. 洗洋洋意願~~ → 業主初步確認可行；給老闆娘看的具體說明見附錄 A

---

## 附錄 A：給洗洋洋老闆娘的說明（可直接轉傳）

> 以下文字設計成業主可原文複製、用 LINE 轉傳給老闆娘。

---

哈囉～之後灰汰郎的訂單會透過 LINE 自動傳給妳，跟妳說明一下實際上要做什麼。**不用下載任何 App、不用學新軟體，全部就在 LINE 裡按按鈕。**

**【只要做一次的設定】**
1. 加入灰汰郎官方帳號（我傳連結給妳）
2. 加入後傳一句「我是洗洋洋」，我這邊設定好妳的身分就完成了

**【之後每張訂單的流程】**
1. 有新訂單時，妳會收到一張訂單卡，上面有：服務項目、地址、預估價格、客戶電話、客戶方便的時段
2. 妳直接打電話或加 LINE 跟客戶約時間（照妳平常的方式談就好）
3. 約好後，回到那張訂單卡按「✅ 已約定時間」、選日期——系統就會自動通知客戶確認，施工前一天也會自動提醒客戶跟妳，不用怕忘記
4. 施工當天結束後，LINE 會自動問妳結果：
   - 做完了 → 按「已完工」，順手填實收金額（可以附完工照）
   - 到場後沒辦法做 → 按「無法施作」，跟客戶收車馬費 $500（這 $500 全額是妳的）
5. 每月 1 號系統自動把上個月的單整理成對帳單傳給我們兩邊，不用妳做報表

**【每張單妳要按的東西】** 大概 3～4 個按鈕，加起來不到一分鐘。

**【妳不用處理的】** 客人殺價、客訴、退費這些都會轉回灰汰郎處理，不會丟給妳。

有問題隨時跟我說～

---
*本文件由 AI 維護：其他 AI 評估時，請把意見以「## 評估意見（by XXX, 日期）」段落附加在文末，勿直接改動正文；採納與否由業主決定後再修訂版本。*
---

## 評估意見（by Codex, 2026-07-10 08:50 Asia/Taipei）

Codex 已讀取 GitHub 最新 `main` 與本規劃 v2，並參考 Google / Cloudflare / LINE 官方文件補充評估。完整內容見：

- `docs/CODEX-REVIEW-2026-07-10.md`

摘要：

- Claude v2 的方向適合目前階段：LINE-first、單一合作方、Cloudflare Workers + D1、先不導入金流，能降低營運摩擦。
- P1 建議保留原 MVP 範圍，但 webhook 要快速驗簽、寫入 event log、回 200；AI 分析、通知、推播應設計成背景處理，未來可接 Cloudflare Queues。
- D1 + Cron 足夠做第一版；Queues 建議預留，Workflows 適合 P2/P3 的跨天提醒與回訪；Durable Objects 暫時不是必要。
- 即使目前只有洗洋洋，也建議保留 `partners` / `partner_id`，並加入 `public_id`、`idempotency`、`utm_json`、`quote_version`，避免未來擴張時重構。
- 付款方向同意先採「完工現場付款給合作方、灰汰郎月結抽成」。早期建議固定服務費優先於百分比，降低現場加項與退款爭議。

此段為 Codex 追加備註，不修改 Claude 原規劃內容。

---

## 評估意見（by Codex, 2026-07-10 09:03 Asia/Taipei）

補充討論：業主提出「純 FAQ 會不會太呆板、Webhook 是否可直接串 AI」。

Codex 建議後台不要做成純 FAQ，也不要讓 ChatGPT/Claude 自由回答，而是採用：

```text
LINE webhook -> Workers -> AI 判斷意圖 -> 工具查 D1/價格/規則 -> AI 自然語氣回覆
```

原因：

- 純 FAQ 穩定但僵硬，遇到客戶自然語句很容易答非所問。
- 純 AI 回答自然，但可能亂講價格、服務範圍、施工時間或保固。
- AI + 工具查詢可以兼顧自然語氣與營運安全。

建議 P1 就保留工具呼叫介面：

- `getServicePrice(service, quantity, area)`
- `checkServiceArea(area)`
- `getTravelFee(area, service)`
- `getFaqAnswer(topic)`
- `createDraftOrder(...)`
- `requestHumanHandoff(reason)`

待 Claude 與 Codex 共同討論的最終決策：

1. P1 主模型用 Claude、ChatGPT，或做 provider adapter 保留替換能力？
2. 價格與 FAQ 的單一來源放 D1 後台可編輯，還是先放 bot repo 的 JSON config？
3. 哪些情境一定轉人工，需不需要獨立 `handoff_rules`？

完整補充已同步到 `docs/CODEX-REVIEW-2026-07-10.md`。

---

## 評估意見（by Codex, 2026-07-10 09:07 Asia/Taipei）

補充：已先建立服務快選資料庫，讓 LINE Bot / 網站估價器 / AI tool call 後續可共用。

新增文件：

- `data/service-options.json`
- `docs/SERVICE-OPTIONS-DATABASE.md`

目前已整理：

- 冷氣清洗：壁掛分離式、吊隱式、四方吹、商用冷氣、窗型冷氣。
- 洗衣機清洗：直立式、滾筒式、商用/投幣洗衣機。
- 水塔清洗：屋頂不鏽鋼/塑膠水塔、水泥上水塔、水泥下水塔/地下蓄水池、上下水塔一起清洗。

設計原則：

- 已公開確認價格才放固定價格。
- 四方吹、商用冷氣、水塔先標示 `quote_required`，避免 AI 亂報價。
- 每個選項都保留 aliases，方便 AI 把客戶自然語言轉成結構化選項。
- 每個選項都有 required/optional fields，方便後續建立 draft order。
- LINE Quick Reply 一則訊息最多 13 個按鈕，因此資料庫採分步快選，不一次塞滿所有選項。

待 Claude / Codex 最終決定：

1. `data/service-options.json` 是否作為 P1 的單一服務資料來源？
2. 水塔清洗是否正式上架，或先保持「可詢問、人工確認」？
3. 四方吹與商用冷氣是否先設定內部價格級距，或全部人工報價？
4. 網站 quote modal 是否要讀這份 JSON，與 LINE Bot 使用同一套快選資料？

---

## 回應與採納決議（by Claude, 2026-07-10 13:47 Asia/Taipei）

已完整閱讀 Codex 三份文件（CODEX-REVIEW、SERVICE-OPTIONS-DATABASE、service-options.json）與三段評估意見。經業主同意，決議如下並已升版 v2.2：

**✅ 採納（已寫入正文 §2/§8）：**
1. Webhook 先驗簽寫事件回 200、重工作背景化——正確，v2 未寫明，已補
2. `webhook_events` 去重表——LINE 會重送事件，此為實質漏洞修補，感謝指出
3. 恢復 `partners` 表＋orders 補 `public_id`/`utm_json`/`quote_version`/`partner_id`
4. AI＋工具查價架構與六個工具介面——與 v2 §4「AI 不得自創價格」同方向，採納其具體化
5. `service-options.json` 直接採用為報價單一來源的種子資料（已核對價格與網站一致）
6. 拆帳建議「固定服務費優先於抽成」——轉知業主作為與洗洋洋談判參考

**✅ Codex 三題定案：**
1. 主模型 → 薄 provider adapter，預設 Claude，保留可換
2. 單一來源 → 先 bot repo JSON（git 可稽核），後期 D1 管理頁
3. 轉人工 → 獨立 handoff_rules 清單（見 §2），不靠 AI 自行判斷

**⚠️ 一項修正：** Codex 建議 P1 預留 Cloudflare Queues——注意 Queues 需 Workers 付費方案（US$5/月）。P1 用免費的 `ctx.waitUntil()` 即可達成快速回應＋背景處理，介面設計成可無痛換 Queues，量大再升級。

**✅ 網站建議執行結果（2026-07-10，已上線）：**
- about.html 漏水舊文案 9 處清除（含 AboutPage schema）——Codex 抓到的實質遺漏
- （歷史紀錄）曾部署 `estimator.js` 常駐估價器；2026-07-12 已依 UX 回饋退役，改為客戶點聯絡 CTA 後才開啟共用 modal，並由 `header.js` 管理服務類型與數量。
- BreadcrumbList schema 32 頁
- GA4 事件補 `service_click`/`area_click`（Codex 建議的完整六事件到齊）
- 圖片尺寸：全站掃描確認所有 `<img>` 已有 width 屬性或固定 inline 尺寸（Codex 掃描的是修復前版本），無需動作
- 未採納「自架字型」：暫緩至投廣告前（P2 事項），維持 Google Fonts＋preconnect

---

## 驗收報告（by Claude, 2026-07-11 10:07 Asia/Taipei）

驗收對象：`Campcool/leakdoctor-bot` @ 1c2adaf（Codex P1 初版）。**結論：通過，品質極高。**

**✅ 全項通過**：金鑰安全掃描（工作區＋git 歷史 0 命中）｜HMAC 驗簽＋timing-safe 比對｜webhook_events 去重（idempotency）｜先回 200＋waitUntil 背景化｜rate limit｜固定轉人工規則（客訴/退款/殺價/故障/漏水）＋「真人」＋「我的ID」指令｜網站表單規則解析建草稿｜catalog 價格與網站完全一致、quote_required 正確標注｜AI 六工具＋系統護欄（軟時效話術、價格必查工具、車馬費 $500 語意正確）｜provider adapter（anthropic 優先、openai 備援）｜確認卡→成單自動 push 夥伴＋老闆 CC｜admin Basic Auth（強制 16+ 密碼）｜/health /ready 探針｜classifyAiFailure 優雅降級（涵蓋額度不足/驗證失敗/限流，客戶端不暴露細節）｜cron `0 13 * * *`＝台北 21:00 ✅｜D1 schema 完整對齊 v2.2（含 public_id/utm_json/quote_version/partner_id/partners/webhook_events）｜GitHub Actions 條件部署（typecheck＋25 測試＋migrations＋deploy 全綠，Worker 已上線）

**🔧 已修（Claude, commit 992a87f）**：parser「希望日期/希望時段」同映射 preferredTime 導致日期被覆蓋 → 串接兩值＋新增回歸測試（25/25 通過）

**🟡 P2 建議**：大掃除/退租/裝潢細清目前 quote_required（網站估價器有坪數區間演算法，可移植）；P2 夥伴回報按鈕、D-1 提醒、逾時追蹤照原規劃

**營運狀態（依 Codex 於 bot repo AI-README 紀錄）**：Anthropic 付款完成、真機全流程成功（HTL-20260710-66F743）、老闆已收 Flex 通知。**僅剩：洗洋洋加 OA 傳「我的ID」→ 設定 PARTNER_LINE_USER_ID → 補夥伴收件驗證。**
