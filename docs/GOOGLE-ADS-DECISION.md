# Google Ads：兩份計畫評比與定案｜2026-07-15

> 業主問：兩份 Google Ads 計畫「誰更適合做？內容哪個比較豐富且適用？」
> 評比對象：Codex 版 `docs/GOOGLE-ADS-PLAN.md`（在 `main`，另附可匯入資產）vs Claude 版 `docs/GOOGLE-ADS-PLAN.md`＋`GOOGLE-ADS-BUILD-SPEC.md`（在 bot 交接分支）。
> 方法：逐段閱讀＋實測 Codex RSA 的中文字數是否超限、關鍵字/否定詞結構。

## 定案（一句話）

**由 Codex 主導這份廣告計畫**——它更豐富、更可直接執行，且廣告素材本就是 Codex 的本行。
**但必須併入 Claude 版的兩項修正：①預算重算到「NT$4,000／月」；②優先序改成「漏水優先、居家減弱」。**
兩份 PLAN 撞名 → 以 Codex 版（main）為唯一正本；Claude 版標記為「已被取代」，只保留 `GOOGLE-ADS-BUILD-SPEC.md` 當預算/文案對照。

## 為什麼是 Codex 主導（它強在哪）

- **可直接批次匯入的資產**：`ads/google-ads-keywords.csv`（45 條，含 Campaign/Ad group/比對類型/Final URL/意圖標註）、`ads/google-ads-rsa.csv`、`ads/google-ads-negative-keywords.txt`（59 條、分類）、`ads/google-ads-assets.md`、以及 `logo/social-ads/` 的廣告用 logo。可用 Google Ads Editor 直接上傳，省下大量手貼。
- **RSA 中文字數全數合規**（Claude 實測）：標題最長 16／30、說明最長 56／90，7 個廣告群組都沒有超限。＝不用擔心被 Google 打回。
- **轉換設定更精準**：GA4 key event、auto-tagging、GCLID 保留、conversion value 暫用 TWD 500、Enhanced Conversions 的隱私提醒（表單有電話/地址，未同意前不外傳 PII）——這些都寫得比 Claude 版細。
- 命名規範、Campaign A/B/C（清潔／用水漏水／品牌）、LP 對應表都齊全。

## 必須併入的 Claude 版修正（Codex 版目前的兩個落差）

1. **預算超標 4–7 倍（最重要）**：Codex 版建議 `NT$500–1,000/day`＝月 `NT$15,000–30,000`；但**業主實際預算是 NT$4,000／月（約 NT$130/day）**。照 Codex 版會在 4–8 天燒完整月預算。
   → 改用 Claude 版 `GOOGLE-ADS-BUILD-SPEC.md` 的配置：**漏水 NT$70/日、清洗 NT$45/日、品牌 NT$8/日、居家先暫停**，月約 NT$3,740。
2. **優先序未反映業主取捨**：業主說「全部但**居家減弱**」，且漏水抓漏客單最高、是舊品牌核心。Codex 版把清潔 Campaign 放第一、各服務近乎均分。
   → 改成**漏水優先**、**居家清潔先暫停**（有數據或預算再開），與 BUILD-SPEC 一致。

## 可保留的 Claude 版素材（給 Codex 併入用）

- `GOOGLE-ADS-BUILD-SPEC.md`：依 NT$4,000/月精算的活動/預算/出價表、否定詞、以及**已驗證字數的 RSA 文案**（可與 Codex 的 rsa.csv 互為對照/補槽）。
- 分工表：業主管帳號金流、Claude 管關鍵字/文案/追蹤/法遵、Codex 管落地頁與素材——這條維持。

## 其他前台審查項的定案（業主指示：填入交接、待 Codex 評估）

| 項 | 內容 | 狀態 |
|---|---|---|
| #3 室外機 $500 | 現行價，**已同步進 bot catalog/知識庫**；另列為**與洗洋洋議定項目**（議定後只改 bot `catalog.ts` 一行） | ✅ 後台已做 |
| #5 | 水塔/水管頁補專屬 OG 分享圖 | 待評估（Codex） |
| #6 | 表單地址欄加「缺縣市」前置提示（縣市清單抄 bot `TW_CITIES`），省一輪 LINE 追問 | 待評估（Codex） |
| #7 | 多品項需求加「將由專員一併確認報價」期待管理文案 | 待評估（Codex） |

> 詳細前台審查見 `docs/FRONTEND-REVIEW-2026-07-15.md`。#1/#2 的表單↔parser bug 後台已修（bot `9534450`）。
