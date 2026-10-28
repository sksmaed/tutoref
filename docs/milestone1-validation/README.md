# Milestone 1 流程驗證（2026-10-24）

Claude 與 Codex 對 `dev/mvp-review-tp-workflow`（前端 `34105800`、後端 `994eb8e`）做的 Milestone 1 流程驗證與 UI 方案原型。兩邊先各自獨立測試，再交叉確認三輪。

## 先看這兩個

| 檔案 | 內容 |
| --- | --- |
| [`Milestone1_驗證總結.md`](Milestone1_驗證總結.md) | 結論、Workflow 1～8 判定、問題清單（阻斷／重要／次要，含發生情境）、6 個需求衝突與建議做法、UI 方案推薦、建議修正順序 |
| [`ui_options/index.html`](ui_options/index.html) | UI 方案原型總覽：S1～S12 各有 A／B／C 三種方案。每個 HTML 都已內嵌樣式，下載後直接用瀏覽器打開即可 |

## 細節與討論過程

| 檔案 | 內容 |
| --- | --- |
| [`claude/claude_report.md`](claude/claude_report.md) | Claude 的逐步實測紀錄 |
| [`codex/codex_report.md`](codex/codex_report.md) | Codex 的獨立實測紀錄（含邊界情況補測） |
| [`codex/codex_review.md`](codex/codex_review.md) | Codex 對 Claude 報告與原型的逐項回應 |
| [`claude/claude_response.md`](claude/claude_response.md) | Claude 的逐項答覆與原型修改清單 |
| [`codex/codex_final_check.md`](codex/codex_final_check.md) | Codex 第三輪最終確認 |
| [`claude/claude_self_check.md`](claude/claude_self_check.md) | 原型修改逐條對照（最後一節是第三輪之後才補上、Codex 沒有再看過的修改） |
| [`codex/ux_options.md`](codex/ux_options.md)、[`codex/source_audit.md`](codex/source_audit.md)、[`codex/upload_audit.md`](codex/upload_audit.md) | Codex 的 UI 方案文字版與原始碼查核 |

## 沒有放進來的東西

- **截圖、Codex 的 API 紀錄（`evidence/`）與測試腳本**：裡面有真實 email 與姓名，依專案規範不放進版本庫。報告中指向截圖或 `evidence/` 的連結在這裡打不開，原檔保留在提出者的本機。
- **個資處理**：教案紙設計者的姓名改為「○○○」，本機絕對路徑改為以 `Tutoref/` 開頭的相對路徑；其餘內容與原始報告相同。
