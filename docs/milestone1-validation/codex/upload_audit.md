# US-09～US-12 與 Workflow 4～8 程式碼唯讀查核

本附件是 Codex 子代理的獨立原始碼查核，**沒有操作 UI、API 或資料庫**。以下「已確認」只代表程式碼具有該條件／欄位；實際執行結果應以主報告與 API 證據為準。不應把本附件當作瀏覽器實測。未讀取 Claude 測試區、未執行 git、未修改前後端程式碼。

查核來源根目錄：

- 前端（以下 `F/`）：`Tutoref/tutoref/`
- 後端（以下 `B/`）：`Tutoref/tutoref_backend/`
- 已閱讀兩 repo 的 `AGENTS.md`，並對照後端 `docs/REVIEW_MODULE_PLAN.md` 的家內送件、缺交、snapshot 段落。

## 實際入口、頁面與權限

| 項目 | 目前實作（原始碼） | 關鍵位置 |
|---|---|---|
| 家內教案導覽 | 只有 `family.submit` 才顯示；撰寫者、驗收者若無家長角色不顯示 | `F/src/components/layout/nav-config.ts:91`（條件 96） |
| 直接進家內頁 | 同樣要求 `family.submit`，否則 `router.replace('/review')` 且回傳 null | `F/src/app/review/family/page.tsx:30`、35、72 |
| 家內上傳入口 | 家內標題操作僅有「送出驗收」，沒有「上傳教案」 | `F/src/app/review/family/page.tsx:83` |
| 作者上傳入口 | 「已上傳教案」頁的「＋ 上傳教案」連 `/upload` | `F/src/app/plans/mine/page.tsx:172` |
| 家內 API 讀取 | `IsAuthenticatedTermMember`，當期有 active membership 或任一角色可讀；不是只有家長 | `B/features/review/apis/submission.py:136`；`B/features/organization/permissions.py:30` |
| 家內 API 範圍 | 非 `review.manage` 強制取 `context.membership_family_id`，忽略傳入其他家或 `all_families`；組長 `all_families=true` 可讀全團 | `B/features/review/apis/submission.py:145`、159 |
| 家內 API 多家 | context 只提供第一筆 active membership，不是多家清單 | `B/features/organization/services.py:127`、134；`B/features/review/apis/submission.py:165` |
| 上傳權限 | `/extract`、`/upload-file` 僅要求登入；`plan.author` 也給每位登入者，不依 writer 角色 | `B/features/teaching_plan/apis.py:150`、177；`B/features/organization/services.py:82` |
| 私人教案詳情 | 作者、staff、教案組、該家家長可讀；一般同家撰寫者／驗收者無法依「家內成員」身分讀取他人的 private detail | `B/features/teaching_plan/services.py:98`～111；`B/features/teaching_plan/apis.py:384`～404 |

**判斷：** Workflow 5 的「撰寫者、驗收者、家長在家內教案看全家教案」有前後端權限分歧。清單 API 已放寬，但 UI 仍等同家長專區；就算另補上詳情連結，private detail 權限仍須同步修正。

## 上傳流程與本期／歸檔模式

1. `/upload` 先出現「本期教案／歸檔過去教案」選擇；上傳 mode 存於 local state。`F/src/features/upload/useUploadFlow.ts:30`、49～57；`F/src/features/upload/UploadModeModal.tsx:43`～74。
2. 初始畫面只有一個 `FileUpload`，選的是教案紙；「確認上傳」才呼叫 `/extract`。不是兩個並列附件區塊。`F/src/features/upload/UploadDropzone.tsx:25`～30、59～68；`F/src/features/upload/useUploadFlow.ts:235`～246。
3. `/extract` 呼叫 `TeachingPlanProcessor`，解析完成建立 `TemporaryFileUpload` 回傳 `temp_file_id`。`B/features/teaching_plan/apis.py:150`～175。
4. 解析完先進預覽，可點「編輯內容」修改；再按第二個「確認上傳」才呼叫 `/upload-file`。`F/src/app/upload/page.tsx:71`～97；`F/src/features/upload/useUploadFlow.ts:598`～617。
5. 投影片上傳欄在「編輯內容」裡；`showSlideUpload={!isReplacingSheet}`，未判斷 initial/final，所以初驗也出現投影片欄。`F/src/app/upload/page.tsx:107`～115；`F/src/features/teaching-plan/TeachingPlanEditor.tsx:309`～323。
6. 本期 mode 在前端把解析出的期別改成 current term；後端也強制取 active term，設 `private`、`draft`。`F/src/features/upload/useUploadFlow.ts:264`～271；`B/features/teaching_plan/services.py:134`～148。
7. 家別優先採 API `family_id`，否則使用者當期 membership，最後才用表單 `team`。目前 UI payload 只有 `team`、沒有 `family_id`，因此使用者編輯表單中的家別字串可能在儲存時被 membership 覆蓋。`F/src/features/upload/transformers.ts:91`～111；`B/features/teaching_plan/services.py:215`～246。
8. 作者 relation (`writers`) 自動加上上傳者，但 `writer_name` 另外保留解析／表單設計者。家內表格顯示的是 relation 的帳號姓名，不是 PDF 中的設計者字串。`B/features/teaching_plan/apis.py:193`～209；`B/features/review/apis/submission.py:195`～196。
9. 本期上傳成功仍跳 `/plans/mine`。該頁 title、側欄都還叫「已上傳教案」；API 取所有 `writers=user`，沒有濾除本期 private/draft/review 教案。`F/src/features/upload/useUploadFlow.ts:632`～644；`F/src/app/plans/mine/page.tsx:79`～83、172～186；`F/src/components/layout/nav-config.ts:71`～76；`B/features/teaching_plan/apis.py:790`～798。
10. 本期 private 教案不應進搜尋：建立時只有 `is_search_index_eligible` 才排 ES 索引；該 queryset 要 public，且本期需總驗 passed、locked、published 條件。`B/features/teaching_plan/apis.py:219`～220；`B/features/teaching_plan/services.py:166`～192。此處為程式碼推論，未查 ES 實際結果。

**判斷：** 解析→編輯→正式存檔的核心已具備；US-12 指定的家內入口、兩區塊選檔、總驗才有投影片、已歸檔命名與待驗收清單分流均未完整落地。US-12 文字中「投影片 optional」與 Workflow「總驗才提供投影片欄位」可解讀為：初驗只顯示教案紙；總驗顯示教案紙＋optional 投影片兩區。

## 家內清單與初驗附件判準

實際欄位：教案名稱（另列年級、時長）、撰寫者、類別、檔案完整性、納入本輪驗收、送出快照、目前狀態。**沒有家別欄、沒有教案紙／投影片連結，也沒有點列詳情互動**。來源 `F/src/features/review-family/FamilyReviewTable.tsx:48`～65、80～124。

- 完整性固定判 `sheet_present && slide_present`，缺投影片就顯示「缺附件／缺投影片」，未分初驗總驗。來源同檔 10、78、89～96。
- `FamilyPlanOut` 僅有 presence booleans，沒有 Drive URL；snapshot 也僅 submitted_at + booleans。因此要補 UI 連結，也必須擴充 API。來源 `B/features/review/schemas.py:128`～156。
- 後端家內清單送件後仍讀 `plan.tp_name`、`plan.category`、目前附件狀態，而不是 snapshot metadata；只有 `included` 和 snapshot 小物件來自 frozen snapshot。來源 `B/features/review/apis/submission.py:187`～215。若作者後續可修改，就會出現「本輪已鎖定」但清單主要欄位已變動的問題。

## 缺交資料單位、儲存與送出

| US-10 要求 | 現有實作 |
|---|---|
| 每份預計教案各一筆 | 一筆 `missing_count` 可大於 1，資料以份數為主 |
| 預計教案名稱 | 沒有欄位 |
| 姓名 | API 有 optional `author_id`；UI 沒成員選擇器，只在 reason placeholder 寫「缺交者姓名或原因（可留空）」 |
| 缺交內容多選（紙／投影片） | 沒有欄位 |
| 編輯、刪除已登記內容 | 送出前可改 reason、份數或移除 local row；沒有獨立儲存 API。頁面重載會丟失；送件後只能看總數 |

精確來源：

- `F/src/app/review/family/page.tsx:25`（missing 初始空陣列）、137～142（僅傳 local state，送件後改 readonlyTotal）。
- `F/src/features/review-family/MissingSubmissionPanel.tsx:43`～45（已送出只總數）、53～78（輸入／移除）、85～91（新增預設 missing_count=1）。
- `B/features/review/schemas.py:74`～89（請求欄位）。
- `B/features/review/models/submission.py:91`～101（缺交 model 只有 submission、author、missing_count、reason）。
- `B/features/review/services/submission_service.py:128`～134（正式送件才持久化缺交）。
- 全部 `B/features/review/apis/` 中 `MissingSubmission` 僅出現在 submission controller 的總數計算；沒有逐筆缺交 GET/PATCH/DELETE route。

送件本身：家內頁預設選取所有候選教案，可逐份選「是否納入」，點「送出驗收」開 Dialog；Dialog 明示不可補送、列出排除教案、納入數與缺交數。`F/src/app/review/family/page.tsx:38`～42；`F/src/features/review-family/SubmitConfirmModal.tsx:39`～94。但按鈕 `disabled={locked || loading || plans.length===0}`，**全家都缺交而 0 份上傳教案時，UI 無法只送出缺交清單**（同 page 88）；API 沒要求 plan_ids 非空，可以補測。

## 送件鎖定、快照與潛在缺陷

可確認的正向行為：

- POST `/review/family-submissions` 要求家長能力，service 再驗該期該家的 active parent；拒絕 readonly 期別、重複同家同輪送件、其他家的 plan ID。`B/features/review/apis/submission.py:219`；`B/features/review/services/submission_service.py:65`～86。
- 在一個交易裡建立送件、snapshot、job、缺交並把 plan 改 `submitted_initial`（或 `final_submitted`），寫 audit。`B/features/review/services/submission_service.py:90`～147。
- Snapshot 自身 save/delete 不允許覆寫刪除；Drive 被 snapshot 引用的舊檔不刪。`B/features/review/models/submission.py:80`～88；`B/features/teaching_plan/tasks.py:80`～93。
- UI 顯示 LockBanner，納入選項 disabled，缺交編輯區收起、送出 disabled。`F/src/app/review/family/page.tsx:88`、105～110、140；`F/src/features/review-family/FamilyReviewTable.tsx:102`。

需要實測的重大風險：

1. **送出後作者寫入仍可能成功。** `_get_editable_plan` 僅驗作者/staff，不驗 editing_status、term readonly；PATCH detail、POST slides、POST sheet 均使用此函式。`B/features/teaching_plan/apis.py:48`～59、418～436、498～507、529～538。只有另外的 `/replace-sheet` 用 `_get_sheet_replaceable_plan` 擋 review_jobs（62～69）。這代表 UI 鎖與 snapshot 保全不等於目前檔案、欄位禁止修改。建議先以可還原的名稱 PATCH 實測，避免為此多上傳 Drive 檔。
2. **上傳中送件可能凍結空附件。** family-plans 判有教案紙的條件是 `sheet_pdf or tp_pdf`（`B/features/review/apis/submission.py:200`～202），但 snapshot 僅複製 `sheet_pdf`（`B/features/review/services/submission_service.py:108`～112），Drive task 之後才寫 `sheet_pdf`（`B/features/teaching_plan/tasks.py:172`～184）。後續 metadata task 明確不補 file ID／連結（`B/features/review/tasks.py:76`～81），所以空 snapshot 不會自動修復。此為程式碼推論；若此次測試等待附件上傳完成，就不要宣稱已重現。
3. **本期新教案可於該家送件後繼續建立。** upload-file 不查家內送件是否 locked；新 plan 仍出現在該家清單，included=false，且同家同輪無法二次送件。對 Milestone 是否需禁止新增或明示留待下一輪，可在 UX 列為要確立的規則。

## 組長檢查送件（支援主代理 Workflow 8）

- `SubmissionsView` 有各家進度、作者／教案搜尋、全部／已送出／未送出／缺檔篩選、全團教案表格。`F/src/features/admin/review-manage/SubmissionsView.tsx:11`～17、61～94、96～143。
- 教案紙、投影片欄只有 StatusChip 已繳／缺少，沒有連結。來源同檔 125～130。
- 初驗也顯示投影片且當成缺檔篩選條件（67、103～104），與「投影片到總驗才需要」不一致。
- 缺交清單在 AssignmentsView 顯示「家別／缺交份數／來源」，不是逐份教案名稱＋姓名＋附件種類。`F/src/features/admin/review-manage/AssignmentsView.tsx:111`～129。
- 組長可改以 API `/review/jobs/{job_id}/workspace` 取得 frozen snapshot 的 Drive URL（有 review.manage 即可，不必被指派）；這是 API 補測，不能視作 UI 已達標。`B/features/review/apis/review.py:66`～74、128～134。

## 建議主代理最少 API 驗證順序

所有路由限定 `http://localhost:8001/api/v2/`，登入只使用 demo 帳號。

1. 撰寫者 GET `review/me/context`，記錄 membership/capabilities；GET `review/family-plans?stage=initial` 確認可讀，與 source 中 UI 被擋並列。
2. POST `teaching-plan/extract`（multipart `file`，教案紙一次）；記錄解析的期別、家別、名稱、writer_name、category、grade、duration、temp_file_id。
3. POST `teaching-plan/upload-file`（multipart `teaching_plan_temp_file_id`、`tp_name` 等欄位、`upload_mode=current`；初驗先不帶 slides）。不要猜表單會套用的期別／家別，GET detail 檢查實際結果。
4. GET `teaching-plan/my-teaching-plans` 驗證本期 draft 是否仍出現；GET family-plans 比對。等 detail.sheet_pdf 有值再進主線送件，避免把 Drive 延遲引入主流程。
5. 家長 POST `review/family-submissions`，body 範例：`{"term_id":"…","family_id":"…","stage":"initial","plan_ids":["…"],"missing":[{"author_id":"…","missing_count":2,"reason":"測試缺交兩份；現 API 無名稱/缺交內容欄"}]}`。傳 Idempotency-Key，留存完整請求與回應。
6. GET family-submissions 與 family-plans，確認已送、included、snapshot；組長 GET `review/jobs?stage=initial` 後 GET workspace，確認 snapshot URL。
7. 撰寫者 PATCH detail 名稱到臨時值後回復，記錄 HTTP 與兩次讀取（測 lock）；同時 GET family-plans 看是否呈現新名稱，workspace 看 snapshot 名稱是否仍舊名。
8. 第二次送件用不同 Idempotency-Key，預期拒絕；他家家長送本家 plan 亦預期拒絕。不要把正當的 idempotent retry 當重送缺陷。

## 可直接帶入主報告的問題候選

| 編號候選 | 情境 | 現象 | 影響／建議嚴重度 |
|---|---|---|---|
| U-01 | 撰寫者／驗收者，Workflow 5，家內頁 | 家內入口及頁面只給家長 | 阻斷：一般角色無法依指定頁面參與主線 |
| U-02 | 撰寫者，Workflow 4，家內頁 | 沒上傳按鈕；要改走已上傳教案 | 重要：指定流程入口未落地 |
| U-03 | 撰寫者，Workflow 4，上傳頁 | 一區選檔；投影片藏編輯頁、初驗也顯示 | 重要：與兩區塊與輪次要求不符 |
| U-04 | 家內成員，Workflow 5，家內表格 | 無教案紙／投影片 URL；API 也沒有 URL | 阻斷：無法在家內頁檢視附件 |
| U-05 | 家長，Workflow 6，缺交註記 | 缺交以份數記；名稱、姓名獨立欄、附件多選未實作 | 阻斷：無法產生需求指定逐份缺交清單 |
| U-06 | 家長，Workflow 6，刷新／離開 | 缺交只存 local state、無儲存接口 | 重要：登記成果易丟失；送後也無明細 |
| U-07 | 家長，Workflow 7，全家尚無上傳教案 | 送件按鈕因 plans.length=0 禁用 | 重要：無法只送缺交紀錄（程式碼推論） |
| U-08 | 作者，Workflow 7，送件後寫 API | 既有 edit guard 不檢輪次／鎖定 | 重要或阻斷：需 API 證實，區分快照不變與現檔可變 |
| U-09 | 家長，Workflow 7，Drive 尚未完成 | presence 真但 snapshot URL 空的競態 | 阻斷風險：此次若未重現需寫「推論」 |
| U-10 | 組長，Workflow 8，檢查送件 | 附件只狀態徽章、缺交只有家別總份數 | 阻斷：不足以檢查完整送件材料 |
| U-11 | 撰寫者，Workflow 4，完成上傳 | 仍回已上傳教案、待驗收也列其中 | 重要：US-12 明確要求分流與改名未完成 |
| U-12 | 家長／組長，初驗清單 | 缺投影片視為缺附件，初驗也可見投影片欄 | 次要～重要：錯誤提示驗收期待與缺檔數 |

本附件未對 UI 視覺品質、鍵盤／手機使用、實際網路錯誤或部署碼是否與參考原始碼完全一致下結論。
