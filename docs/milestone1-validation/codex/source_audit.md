# Milestone 1：組長端與組織資料唯讀程式碼查核

本文件是 Codex 測試的輔助程式碼查核，**不是 UI／API 實測紀錄**。未操作瀏覽器、API、資料庫，未修改專案程式，未讀取 Claude 的測試區域，也未執行 git。來源為使用者指定同版本的唯讀前後端 repo，已讀兩者的 `AGENTS.md` 與 `docs/REVIEW_MODULE_PLAN.md`。下列相對路徑的 `前端` 指 `Tutoref/tutoref/`，`後端` 指 `Tutoref/tutoref_backend/`。

## Workflow 1–3、8 的現行實作

### Workflow 1：開新一期

- 右上使用者選單確實有「設定」連到 `/account`（前端 `src/components/layout/UserMenu.tsx:85`）；設定頁只有個人基本資料與本期身份，沒有開新一期區塊（前端 `src/app/account/page.tsx:27`、`:56`）。全域搜尋 `src` 的 `organization/terms` 呼叫只有讀取期別與讀寫 policy，沒有建立或啟用期別的前端服務。
- 後端有 `POST /organization/terms` 建立 inactive 期別（`features/organization/apis.py:106`，`:115`）；建立時 signal 只自動建立 `TermPolicy`（`features/organization/signals.py:9`）。沒有同一操作中自動建立時程、複製成員、啟用新期與封存舊期的流程。
- `POST /organization/terms/{id}/activate` 與 `PATCH /organization/terms/{id}` 可啟用（`features/organization/apis.py:120`、`:137`）。`activate_term` 用交易鎖與唯一條件約束維持至多一個 active 期別（`features/organization/services.py:45`；`features/organization/models.py:24`）。
- 啟用新期時，舊期只更新 `is_active=False`，**不會設 `is_readonly=True`**（`features/organization/services.py:51`–`:58`）。舊資料沒有被刪除。手動 `PATCH is_readonly` 才會標示唯讀（`features/organization/apis.py:124`）。
- 建議實測補救順序為「建立新期 → 從舊期複製角色 → 啟用新期」。`CanManageReview` 依當前期權限授權（`features/organization/permissions.py:23`–`:27`），先啟用空白新期時組長會暫失管理能力；複製 API 另外允許來源期組長操作，註解明確處理這個問題（`features/organization/apis.py:244`–`:258`）。

### Workflow 2：複製與管理成員

- 成員管理頁 `/admin/members` 有獨立「複製哪一期的角色」與「複製到本期」，需手動點擊（前端 `src/app/admin/members/page.tsx:193`–`:210`）。來源的 active membership 與 active role 會複製，目標既有資料原則上跳過（後端 `features/organization/services.py:153`–`:177`）。不是開新期時自動複製。
- 單筆新增／編輯用同一個 `MemberEditDialog`，姓名、email、單選必填家別、可複選角色（前端 `src/features/admin/members/MemberDialogs.tsx:55`、`:76`、`:97`、`:113`）。既有 email 欄位 disabled（`:93`）。沒有通訊錄檔案匯入 UI、驗證碼認領 UI、詳細檢視或歷史紀錄 UI。
- 新 email 會建立 `set_unusable_password()` 帳號，程式並未在這段發邀請或設定密碼信（後端 `features/organization/apis.py:184`–`:187`）。Dialog 說明「之後由本人設定密碼」（前端 `MemberDialogs.tsx:64`）。可認定建立帳號已實作，但如何交接帳號須另外實測，不能把該說明當作認領流程已完成。
- 搜尋包含姓名或信箱；只有單選家別篩選，顯示資料固定使用當前期別。沒有期別切換、角色篩選、多選家別（前端 `src/app/admin/members/page.tsx:37`、`:71`–`:77`、`:177`–`:191`）。「複製哪一期」是操作來源，不是列表篩選。
- 表格有姓名、email、家別、角色、編輯按鈕；沒有狀態欄。資料列沒有 click handler，只有「編輯」按鈕（前端 `src/features/admin/members/MemberTable.tsx:34`–`:38`、`:50`、`:79`）。沒有先看資訊，再進入編輯的分層。
- 底層一人一期只准一個 active membership；同一 role 一期只准一份 active assignment，明確無法表達需求所述「同期不同家別分成多筆」（後端 `features/organization/models.py:55`–`:70`、`:107`–`:110`）。這不是只改 UI 就能滿足。
- 批量 UI 家別為單選，提供「不變更」；角色為單選「新增角色」，空白叫「不新增」。只能追加角色，不能批量覆蓋或移除（前端 `MemberDialogs.tsx:151`、`:183`–`:214`；`src/app/admin/members/page.tsx:129`–`:158`）。未選任何人時仍渲染 `BulkActionBar`（`:214`），因為元件 `visible` 預設 true（`src/features/review-shared/BulkActionBar.tsx:20`）。

### Workflow 3：時程與標準

- `/admin/review?tab=schedule` 有初驗／總驗 timeline 與「編輯時程與規則」Dialog（前端 `src/app/admin/review/page.tsx:158`–`:167`）。可設兩輪的送件截止與驗收截止（`src/features/admin/settings/ScheduleSettings.tsx:8`、`:55`–`:89`）。未設定為空；表單說明逾期不擋（`:20`、`:51`）。
- `PUT /review/schedules` 會更新指定 term 的多項時程；service 檢查唯讀並記 AuditLog 前後值（後端 `features/review/services/schedule_service.py:27`、`:52`）。資料格式是字串 parse datetime，未見同輪先送件後驗收、初驗在總驗之前的順序檢查（`features/review/apis/schedule.py:31`、`:55`–`:70`）；此為待驗證的輸入品質問題，非已測得錯誤。
- `/admin/review?tab=rubric` 及 `/admin/rubric` 共用 `RubricPanel`，有初驗／總驗分頁、建立本期標準、以當前版本建立新版與版本紀錄（前端 `src/features/admin/rubric/RubricPanel.tsx:13`、`:59`、`:104`、`:152`）。新期建立標準時優先沿用建立時間較早期別的啟用標準，沒有則用預設項目（後端 `features/review/apis/rubric.py:83`–`:94`、`:122`–`:153`）。
- 固定欄位可編輯分類／區塊、項目說明、初驗扣分、底分，能新增與移除項目，預設立即啟用新版（前端 `src/features/admin/rubric/RubricEditor.tsx:178`–`:259`）。未見企劃書上傳與解析標準功能；原需求標記 nice-to-have，不應當成 M1 核心阻斷。
- 編輯新版只送 `scoring: {base_score}`，未沿用或開放改門檻三項（前端 `RubricEditor.tsx:255`；後端 `features/review/services/rubric_service.py:123`）。若舊版曾改門檻，新版可能恢復 model 預設，這是需單獨實測的風險。

### Workflow 8：組長檢查送件

- `/admin/review?tab=initial&view=submissions` 顯示六家送件狀態、送出份數、缺交總數與送出時間（前端 `src/features/admin/overview/FamilyProgressTable.tsx:34`–`:60`）。另有全團教案、作者搜尋與送件／缺檔篩選（`src/features/admin/review-manage/SubmissionsView.tsx:61`–`:93`）。
- 教案紙與投影片只顯示 `StatusChip`「已繳／缺少」，沒有附件連結、預覽或點擊入口（前端 `SubmissionsView.tsx:126`–`:130`）。後端 `GET /review/family-plans` 也只回是否有檔案，未回實體 URL（`features/review/apis/submission.py:187`–`:215`）。
- 六家進度只有缺交份數，沒有逐份缺交清單；`GET /review/family-submissions` 也只回 `missing_total`（後端 `features/review/apis/submission.py:110`–`:119`）。目前不能由這個 UI 追到「誰、哪份教案、缺哪種內容」。
- 初驗仍固定顯示投影片欄；「缺檔」篩選無輪次判斷，`!sheet_present || !slide_present`（前端 `SubmissionsView.tsx:67`）。因此初驗僅缺非必要投影片也會列為缺檔。

## 建議優先實測的缺陷與原因

| 編號 | 情境 | 程式碼指向的現象／風險 | 可能影響 | 檔案與行號 |
| --- | --- | --- | --- | --- |
| S01 | 組長開新期 | 無 UI；建立、複製、啟用、封存是分散 API | 一般使用者無法完成 Workflow 1 | 前端 `src/app/account/page.tsx:56`；後端 `features/organization/apis.py:106` |
| S02 | 新期啟用後查舊期 | 舊期僅 inactive、未唯讀 | 歷史資料仍可能被改 | 後端 `features/organization/services.py:51` |
| S03 | 舊期已手動 readonly 後再編輯成員／policy／rubric | 這些寫入端點未做 `term.is_readonly` guard；時程等 review service 有做 | 「舊期唯讀」不是一致不變量 | 後端 `features/organization/apis.py:149`、`:175`、`:220`、`:244`；`features/review/apis/rubric.py:111`、`:122`、`:155` |
| S04 | 組長把既有 writer／parent 換家別，不新增角色 | 前端只把 `added` roles 傳給 upsert，原有 assignment 的 family_id 不會一起改 | membership 和角色家別分歧；家長送件權限可能失敗 | 前端 `src/app/admin/members/page.tsx:102`–`:117`；後端 `features/organization/apis.py:201`–`:217` |
| S05 | 組長批量換家別 | 批量同樣只傳新增角色 | 與 S04 相同 | 前端 `src/app/admin/members/page.tsx:140`–`:146` |
| S06 | 成員曾換過家別後看列表 | `_member_rows` 以 user_id 把所有 active／inactive memberships 放字典；沒有先選 active，也沒有明確排序 | 可能取到舊 inactive membership，顯示家別空白，即使 context 有有效家別 | 後端 `features/organization/apis.py:60`–`:64`、`:79` |
| S07 | 組長取消全部角色 | patch 只撤角色，仍留 active membership；所有登入者固定有 plan.author；term member permission 仍可通過 | 不完全滿足「沒角色不可參與驗收流程」 | 後端 `features/organization/apis.py:238`；`features/organization/services.py:82`；`features/organization/permissions.py:40` |
| S08 | 同期多家別成員 | UI 單選、DB 單一 active membership | US03／04／05 多家別無法表達 | 後端 `features/organization/models.py:55`–`:70` |
| S09 | 搜尋、查看與編輯成員 | 無期別／角色篩選、家別非複選；無狀態、資訊 Dialog、歷史紀錄 | US03／04 部分或未滿足 | 前端 `src/app/admin/members/page.tsx:37`、`:177`；`MemberTable.tsx:34`、`:50` |
| S10 | 未選人與批量編輯 | 仍顯示 0 位動作列；角色僅新增單一角色，非覆蓋複選與「不變更」 | US05 明確 UI 落差 | 前端 `src/app/admin/members/page.tsx:214`；`MemberDialogs.tsx:198` |
| S11 | 組長核對已送件資料 | 附件僅已繳狀態；缺交僅總數 | Workflow 8 無法實際查看附件與缺交對象 | 前端 `SubmissionsView.tsx:126`；`FamilyProgressTable.tsx:55`；後端 `submission.py:110`、`:187` |
| S12 | 初驗篩選缺檔 | 未交投影片也算缺檔 | 不必要的追件與誤判 | 前端 `SubmissionsView.tsx:67` |

## US01–08 子項目查核摘要

| User Story 子項 | 程式碼呈現的實際行為 |
| --- | --- |
| US01 右上 profile → 設定入口 | 有設定，無「開始新的一期」 |
| US01 確認執行、風險提示彈窗 | 無新期功能，故無此彈窗 |
| US01 開新期設定時程、之後編輯 | 新期 API 不含驗收時程；之後可在時程 Dialog 編輯 |
| US01 舊資料保存、UI 隱藏 | activate 不刪舊資料，前端各頁以 current term 為主；但不自動 readonly |
| US02 單筆新增 | 有；email 對應現有帳號或新建不可用密碼帳號 |
| US02 通訊錄匯入 TBD | 無檔案匯入 UI；底層 POST 可多筆 upsert |
| US02 組長建帳號／本人設密碼 TBD | 建帳號有；此操作沒有可用初始密碼，也未發認領／邀請 |
| US02 登入／註冊後驗證碼認領 TBD | 未見實作 |
| US03 姓名搜尋 | 有，另可搜尋 email |
| US03 必填期別預設當期 | 只有固定當期，無可切換篩選 |
| US03 家別、角色多選篩選 | 家別單選；角色無篩選 |
| US03 姓名、信箱、家別、角色、狀態欄 | 前四項有，狀態無；一人一期一個 active 家別 |
| US04 點列資訊彈窗 | 無；編輯按鈕直接進編輯 Dialog |
| US04 顯示基本欄與歷史表格 | 編輯 Dialog 只有基本欄，無狀態與歷史 |
| US05 取消角色處理退團 | 可取消角色，紀錄保留，但 membership 保留、plan.author 保留 |
| US05 資訊彈窗內進編輯 | 無資訊彈窗，直接編輯 |
| US05 姓名、各期家別角色可編輯；email 不可 | 姓名、本期單一家別、角色可改；email disabled；無各期編輯 |
| US05 批量未選隱藏 | 未隱藏，預設顯示 0 位 |
| US05 批量家別複選覆蓋 | 單選家別覆蓋 membership，但既有 role 家別未同步 |
| US05 批量角色複選覆蓋／不變更 | 只能單選新增一角色；空值文字「不新增」 |
| US05 已刪除的批量狀態 | UI 無批量狀態；符合刪除該需求的方向 |
| US06 本期時程編輯 | 有初驗／總驗兩個 deadline 的 Dialog；能修改並稽核 |
| US07 固定格式驗收標準 | 有初驗／總驗、分類、項目、扣分、版本化建立 |
| US07 匯入企劃書解析 nice-to-have | 未見實作 |
| US08 各家進度 | 有已送出狀態、份數、時間 |
| US08 缺交名單與附件檢查 | 只有缺交總數與已繳 badge，無細項與附件連結 |

所有疑似缺陷應以根任務的 UI／API 觀察決定最終嚴重度；本文件僅提供來源依據，不主張已發生上述每一種風險。
