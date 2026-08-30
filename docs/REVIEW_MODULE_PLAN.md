# 驗收模組實作計畫（Frontend）

> 定位：把 Tutoref 前端從「教案檢索」擴成「教案檢索 + 教案驗收 + 管理後台」的施工圖。
> 給 coding agent 直接照著建檔、寫元件用。
>
> **上游文件**：
> - `../後續發展/新版平台完整規劃.md`：產品規格（角色、流程、每個畫面該有什麼）
> - `../後續發展/教案驗收流程規劃 v12.html`：可操作 prototype（畫面與互動的參考實作）
> - `../後續發展/INTEGRATION_MASTER_PLAN.md`：整併總覽與跨端契約
> - `../tutoref_backend/docs/REVIEW_MODULE_PLAN.md`：後端 API 契約
>
> **最高原則：視覺不重做。** 顏色、間距、字級、圓角、元件外觀全部沿用現有 `globals.css`
> 與 `src/components/ui/`。prototype v12 是**流程與資訊架構**的參考，**不是視覺稿**——
> 它用的是綠色系（`#2f6f55`），正式站是橘色系（`primary-900 #ed7a13`），
> 照 prototype 的色票做會讓新頁面看起來像另一個產品。

---

## 開工方式（給 coding agent）

**在 `Desktop/Tutoref/` 這一層開 session**，不要只開 `tutoref/` ——
產品文件與 prototype 在 `後續發展/`，不屬於任何一個 git repo。
git 操作要指定 repo：`git -C tutoref ...`。

### 一定要讀（依序）

| # | 檔案 | 它告訴你什麼 |
| --- | --- | --- |
| 1 | `tutoref/AGENTS.md` | **專案慣例**：Next.js App Router、頁面薄邏輯放 features/、API 一律走 `lib/api.ts`、sessionStorage 快取集中在 `features/manage/cache.ts`、驗證門檻是 `tsc --noEmit` + `next build`。 |
| 2 | 本文件 | **這次要蓋的東西**：路由表、features 目錄、視覺沿用規則、每個畫面的規格、ticket 清單（§9）。 |
| 3 | `後續發展/INTEGRATION_MASTER_PLAN.md` | **跨端契約與決策**：capabilities 由後端算（前端只做 `includes()`）、六個狀態欄位不合併、命名對照、D1–D4 決策。 |
| 4 | `tutoref_backend/docs/REVIEW_MODULE_PLAN.md` §8 | **API 契約**：端點、request/response 形狀、錯誤碼、冪等與樂觀鎖的約定。串接前必讀。 |

### 一定要讀的既有程式碼（在寫任何 UI 之前）

| 檔案 | 為什麼 |
| --- | --- |
| `src/app/globals.css` | **色票 token 的唯一來源**。新頁面只能用 `primary-*` / `secondary-*` / `black-*` / `category-*`，不准自創顏色 |
| `src/lib/api.ts` + `src/lib/csrf.ts` | API 呼叫方式與錯誤物件形狀（`error.code` / `error.message`） |
| `src/features/manage/usePlanManagement.ts` | hook 的寫法慣例，新 hook 照這個形狀 |
| `src/features/teaching-plan/AllPlansTable.tsx` | 表格（含 checkbox 欄、hover、排序）直接抄它的樣式 |
| `src/app/plans/mine/page.tsx` | 頁面容器、標題區、工具列的間距節奏 |
| `src/components/ui/` | 可重用元件清單（Modal、ConfirmModal、Checkbox、DropdownMulti、toast…） |

### 依 ticket 需要才讀

`src/components/layout/Navbar.tsx`（F1-1）、`src/features/teaching-plan/PdfPreview.tsx`（F5-2）、
`src/components/ui/Tab.tsx`（F0-3）、`src/app/announcement/page.tsx`（F7-4）、
`src/features/manage/cache.ts`（要知道**驗收模組不套用**這套快取，見 §5.1）

### 參考、但不是視覺稿

`後續發展/教案驗收流程規劃 v12.html` 是**流程與資訊架構**的參考 —— 用瀏覽器打開走一遍。
**它的顏色是綠色系（`#2f6f55`），正式站是橘色系（`#ed7a13`），照它的色票做會像另一個產品。**
`後續發展/新版平台完整規劃.md` §19 有逐步的操作情境（Scenario A–J），實作完可以照著自測。

### 絕對不要讀、不要改、不要 commit

`.env.local`、`node_modules/`、`.next/`、`venv/`

---

## 0. 一句話總結

**新增一個 `/review` 區塊與一個 `/admin` 區塊，其餘全部沿用。**
不新增任何 npm 依賴、不引入新的狀態管理、不新增品牌色票——
驗收模組需要的狀態色全部是既有 token 的語意別名。

---

## 1. 範圍

### 1.1 要做

| 項目 | 說明 |
| --- | --- |
| `/review/*` 前台驗收區 | 驗收公告、家內驗收清單（家長）、本期教案（撰寫者）、我的驗收任務（Reviewer） |
| `/admin/*` 管理後台 | 教案管理、成員管理、驗收管理（總覽/分配/結果）、驗收標準、驗收公告 |
| Navbar 擴充 | 依 capability 顯示「教案驗收」，右上角頭貼選單加「後台管理 / 教案平台」切換 |
| 狀態語意 token | `globals.css` 加 `--color-status-*`，值指向既有色票 |
| 共用元件補強 | `Tab` 泛型化、新增 `StatusChip`、`BulkActionBar`、`RoundTabs`、`LockBanner`、`SnapshotBox` |

### 1.1.1 已定案的四個決策（2026-08-29）與前端影響

| # | 決策 | 前端要做的事 |
| --- | --- | --- |
| **D1** | 缺交的教案不進驗收 | 家長清單上「未納入本輪」的教案，送出後不會有任何驗收狀態；缺交面板旁要有一句說明「缺交的教案本輪不進行驗收」，避免家長以為系統會自動追 |
| **D2** | 每份教案固定兩位 Reviewer（slot A / B） | 分配頁不是「多選 reviewer」，而是**兩個固定欄位 A、B**；未填滿的教案要能一眼看出來（見 §6.5） |
| **D3** | 本期不做漏送補件 | 送出確認 modal 要做得比原本更重（見 §6.1）——這是真正不可逆的動作 |
| **D4** | 每輪 deadline 可調、逾期不擋 | 新增 `?tab=settings` 時程設定；deadline 顯示在三個地方（見 §6.8） |

### 1.2 不做

- 不做 prototype 的「導覽樣式切換器（側邊 / 上方）」——那是測試工具，正式站維持現有 top header。
- 不做 prototype 的「身分切換下拉」——正式站角色由後端決定；只保留 admin 的 impersonate（Phase 6，且會寫 audit）。
- 不做教案版本歷史 UI。
- 不做 dark mode（`globals.css` 有 `.dark` 變數但站上未啟用，新頁面不要另外處理）。
- **不引入 React Query / SWR / Zustand**（理由見 §5）。

---

## 2. 沿用既有慣例（agent 必讀）

1. **Next.js App Router**，頁面元件保持薄，狀態與流程抽成 `features/<domain>/use*.ts`
   （參考 `features/manage/usePlanManagement.ts`）。
2. **API 一律走 `src/lib/api.ts` 的 axios instance**（已處理 `withCredentials` 與 CSRF header），
   或 `src/services/` 的封裝。不要在元件裡直接 `fetch`。
3. **錯誤處理**：`lib/api.ts` 的 interceptor 已把後端 `errors[0].error_code` 轉成
   `error.code`、訊息轉成 `error.message`。UI 用 `error.code` 分支，不解析文字。
4. **樣式**：Tailwind utility class；色票只用 `primary-*` / `secondary-*` / `black-*` /
   `category-*` / `error-border`。字體 `Noto Sans TC`。圓角用 `rounded-lg`（`--radius: 0.5rem`）。
5. **UI 語言**：使用者可見字串一律繁體中文。
6. **驗證門檻**：`npx tsc --noEmit` 與 `npm run build` 都要過才 commit。
7. **不新增依賴**。若某個 ticket 真的需要，先在 PR 說明理由並單獨提出。

---

## 3. 路由設計

### 3.1 與既有頁面的整併（重要）

| 既有 | 處理方式 |
| --- | --- |
| `/announcement`、`/announcement/[id]` | **不新開驗收公告路由。** 既有公告頁擴充成支援 `type` 篩選（一般 / 驗收時程 / 初驗結果 / 總驗結果 / 補驗），驗收公告是其中一種 type。後端 `GET /review/announcements` 同時服務兩者。<br>（架構快照指出這頁目前沒有對應後端 API，正好一次補齊。） |
| `/manage`、`/plans/mine`、`/plans/likes` | 不動。驗收期間的教案修改改在 `/review/my-plans` 處理，`/plans/mine` 只在教案已進入驗收流程時顯示一條提示與連結。 |
| `/plans/[id]/edit` | 教案 `editing_status` 非 `draft` 時進入唯讀 + 提示「本期教案已進入驗收，請至『本期教案』處理」。 |
| `/admin-login` | 保留。登入後依 `capabilities` 決定是否能進 `/admin`。 |
| `/upload` | 不動。 |
| `/package` | 不動（學習資源）。 |

### 3.2 新增路由

```
src/app/
├── review/
│   ├── layout.tsx                 # 驗收區共用：期別標題、RoundTabs context、capability guard
│   ├── page.tsx                   # → redirect 到該角色的預設頁
│   ├── family/page.tsx            # 家內驗收清單（capability: family.submit）
│   ├── my-plans/page.tsx          # 本期教案（capability: plan.author）
│   └── tasks/
│       ├── page.tsx               # 我的驗收任務清單（capability: review.submit）
│       └── [jobId]/page.tsx       # 驗收工作區（左預覽 / 右表單）
└── admin/
    ├── layout.tsx                 # 後台殼層 + 側邊選單（capability: admin.enter）
    ├── page.tsx                   # → redirect /admin/review
    ├── plans/page.tsx             # 教案管理（全團、批量編輯、優良標記）
    ├── members/page.tsx           # 成員管理（Term/Family/Role/Status、批量編輯）
    ├── review/page.tsx            # 驗收管理，tab 由 ?tab= 控制：
    │                              #   overview | assignments | results | settings
    │                              #   settings = 每輪 deadline（D4）+ TermPolicy 開關
    ├── rubric/page.tsx            # 驗收標準（初驗 / 總驗）
    └── announcements/page.tsx     # 驗收公告發布
```

> **「教案繳交」tab 不做。** Prototype 回饋明確說它多餘；六家送件進度放在 `overview` 就夠。
> 若之後需要，再從 overview 拆出來。

`?tab=` 與 `?round=`（initial / final）都放 URL query，不放 component state——
驗收期間大家會互相貼連結，「我在看總驗分配」要能被貼出來。

### 3.3 features 目錄

```
src/features/
├── review-shared/
│   ├── useTermContext.ts       # 包 GET /review/me/context，全站唯一角色來源
│   ├── Can.tsx                 # <Can capability="review.manage">…</Can>
│   ├── RoundTabs.tsx           # 初驗 / 總驗切換（讀寫 ?round=）
│   ├── LockBanner.tsx          # 「本輪已送出／已鎖定」提示條
│   ├── StatusChip.tsx          # 所有狀態徽章的唯一實作（見 §4.2）
│   ├── SnapshotBox.tsx         # 送出快照：時間 + 兩個檔案狀態
│   ├── BulkActionBar.tsx       # 已選 N 筆 + 批量動作（sticky）
│   └── types.ts
├── review-family/              # 家內驗收清單
│   ├── FamilyReviewTable.tsx
│   ├── MissingSubmissionPanel.tsx
│   ├── SubmitConfirmModal.tsx
│   └── useFamilyReview.ts
├── review-author/              # 本期教案（撰寫者）
│   ├── AuthorPlanTable.tsx
│   ├── FeedbackItemList.tsx
│   ├── FinalRevisionUploadModal.tsx
│   └── useAuthorReview.ts
├── review-tasks/               # 我的驗收任務
│   ├── TaskList.tsx
│   ├── InitialReviewForm.tsx   # 勾選未達標 + 即時試算
│   ├── FinalReviewForm.tsx     # 初驗改善追蹤 + 教案紙 / 投影片判定
│   ├── ReviewWorkspace.tsx     # 左 PdfPreview / 右表單
│   └── useReviewWorkspace.ts
└── admin/
    ├── AdminShell.tsx
    ├── overview/FamilyProgressTable.tsx
    ├── assignments/AssignmentByPlan.tsx
    ├── assignments/AssignmentByReviewer.tsx
    ├── assignments/useAssignmentBoard.ts
    ├── results/ResultTable.tsx
    ├── results/useResults.ts
    ├── members/MemberTable.tsx
    ├── rubric/RubricEditor.tsx
    └── announcements/AnnouncementComposer.tsx
```

---

## 4. 視覺：怎麼在不改風格的前提下表達新狀態

### 4.1 現有色票（`src/app/globals.css`，不要改這些值）

| Token | 值 | 現有用途 |
| --- | --- | --- |
| `primary-900` / `primary-700` / `primary-300` / `primary-100` | `#ed7a13` / `#f1994a` / `#fbcf9e` / `#fef7f1` | 主要動作、強調、hover |
| `secondary-700` / `secondary-100` | `#728a47` / `#f4f7f0` | 次要強調 |
| `black-900`…`black-100` | `#0d0d0d`…`#f1f1f1` | 文字與灰階 |
| `category-*` | 九個類別色 | 教案類別標籤 |
| `error-border` | `#f24822` | 錯誤 |

### 4.2 新增的是「語意別名」，不是新顏色

在 `globals.css` 的 `@theme` 區塊末尾加入（**只加這一段，不動既有任何值**）：

```css
  /* 驗收流程狀態色：全部指向既有色票，不新增品牌色 */
  --color-status-idle: var(--color-black-400);        /* 尚未開始 / 未送出 */
  --color-status-idle-bg: var(--color-black-100);
  --color-status-active: var(--color-primary-900);    /* 進行中 / 待處理 */
  --color-status-active-bg: var(--color-primary-100);
  --color-status-done: var(--color-secondary-700);    /* 已完成 / 通過 */
  --color-status-done-bg: var(--color-secondary-100);
  --color-status-alert: var(--color-category-art);    /* 補驗 / 未通過（#c85f5f） */
  --color-status-alert-bg: #faf0f0;
  --color-status-locked: var(--color-black-500);      /* 已鎖定 / 唯讀 */
  --color-status-locked-bg: var(--color-black-100);
```

**所有狀態徽章只能用 `StatusChip`**，不要在各頁面自己寫 `bg-orange-100 text-orange-700`。
狀態 → 樣式的對應表集中在 `StatusChip.tsx` 一個檔案：

| 業務狀態 | chip 樣式 |
| --- | --- |
| 未繳交 / 尚未送出 / 待分配 | `idle` |
| 待驗收 / 驗收中 / 待處理 / 待修改 | `active` |
| 已送出 / 已完成 / 已通過 / 已凍結 | `done` |
| 補驗 / 未通過 / 缺附件 | `alert` |
| 已鎖定 / 唯讀 / 已發布不可改 | `locked` |

### 4.3 間距與版面

沿用既有頁面的節奏，不要自創：

- 頁面容器、標題區、工具列的 class 直接抄 `src/app/plans/mine/page.tsx`。
- 表格抄 `src/features/teaching-plan/AllPlansTable.tsx`（含 checkbox 欄、hover、排序）。
- Modal 用 `src/components/ui/Modal.tsx`；確認類用 `ConfirmModal.tsx`。
- 圓角一律 `rounded-lg`；卡片邊框 `border-black-100`。

---

## 5. 資料取得與快取規則

### 5.1 為什麼不引入 React Query

現有站用的是 `useEffect` + `useState` + `sessionStorage`（`features/manage/cache.ts`）。
為了一個新模組引入 TanStack Query 意味著：新依賴、兩套資料流並存、team 要學新東西。
**驗收模組的資料量不大（一期 60–100 份教案），值不回票價。**

改為訂一條明確規則：

> **驗收資料一律不進 sessionStorage 快取，每次進頁面重抓。**

理由：驗收是多人同時操作的協作流程。家長剛送出、組長剛改分配、reviewer 剛提交——
任何一份過期快取都會讓人看到錯的狀態並做出錯的決定。
教案清單那種讀多寫少的資料才適合快取，驗收不是。

唯一例外：`useTermContext()` 的結果可在**單次 session 內**快取（角色不會在使用中變動），
但登入 / 登出 / 切換期別時必須清掉。

### 5.2 統一的資料 hook 形狀

每個 feature 一個 hook，形狀一致，方便 agent 複製：

```ts
// features/review-family/useFamilyReview.ts
export function useFamilyReview(round: 'initial' | 'final') {
  const [data, setData] = useState<FamilyReviewData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const reload = useCallback(async () => { /* api.get(...) */ }, [round]);
  useEffect(() => { reload(); }, [reload]);

  // mutation 成功後一律 reload()，不手動改 local state
  const submit = async (payload: SubmitPayload) => { await api.post(...); await reload(); };

  return { data, loading, error, reload, submit };
}
```

**mutation 之後一律 `reload()`，不要手動 patch local state。**
狀態轉移會連動好幾張表（送件會同時建 snapshot、job、鎖清單），前端算不準，也不該算。

### 5.3 冪等

送件與公告發布這兩個動作，前端要：

1. 送出時產生一組 `Idempotency-Key`（`crypto.randomUUID()`）帶在 header。
2. **同一次操作重試時沿用同一把 key**（存在 hook 的 ref，不要每次 render 重生）。
3. 按鈕在請求進行中 disable。

---

## 6. 各畫面規格

以下只寫**與 prototype 不同、或 prototype 未定義**的部分；其餘照 v12 的資訊架構。

### 6.1 `/review/family` 家內驗收清單（家長）

- 表格欄位：教案名稱 / 撰寫者 / 類別 / 檔案完整性 / 納入本輪驗收 / 送出快照 / 目前狀態。
- **「檔案完整性」的判定要寫在畫面上**：目前只是「教案紙與投影片都有連結」。
  Prototype 回饋直接問了「系統怎麼判斷檔案完整性」——所以欄位旁要有 tooltip 說明判準。
- 缺交註記面板：**以份數為主**（`missing_count` 必填），姓名可空。
- **送出是真正不可逆的**〔D3〕。本期不做補件流程，家長漏送一份就是漏了，
  系統沒有補救路徑（只能請管理員進 Django admin 手動處理）。
  所以送出確認要比一般的 `ConfirmModal` 更重，必須包含：

  1. **本輪送出份數**（大字），以及被排除的份數。
  2. **缺交人數與份數**。
  3. **被排除教案的完整清單**（不是只有數字）——漏送就是在這一步被發現的，
     只給數字等於要家長自己心算。清單可捲動，標題寫「以下 3 份不會進入本輪驗收」。
  4. 紅字：「送出後本輪清單與附件不可再修改，且**無法補送**」。
  5. 按鈕文案「確認並送出本輪驗收」，不是「送出」（上游 §21.1）。

  送出請求必須帶 `Idempotency-Key`，且**同一次操作重試沿用同一把 key**（存在 hook 的 ref）。
  在這個沒有補件機制的設計下，重複送件沒有補救辦法。
- 送出後整頁進唯讀，頂部顯示 `LockBanner`。
- 資料筆數可能 30–100，**「送出」按鈕用 sticky bottom bar**（上游 §21.2），
  同時顯示「已選 N 份｜缺交 M 份」。

### 6.2 `/review/my-plans` 本期教案（撰寫者）

- 初驗 tab：逐則 `FeedbackItemList`。狀態四選一；選「部分修改」或「不修改」時，
  說明欄變必填（前端擋一次，後端也擋）。
- **「上傳總驗修改版」入口要放在初驗 tab 的每一列上，不是只在總驗 tab。**
  Prototype 回饋兩個人都卡在這裡：「Feedback 不是初驗的版本嗎？為什麼會直接接到上傳總驗修改版本」。
  作法：初驗列上有「上傳修改版」按鈕，點下去用同一個 `FinalRevisionUploadModal`，
  modal 內文字說明「此檔案將作為總驗版本，家長送出後才鎖定」。總驗 tab 保留同一個入口。
- 頁面頂部顯示整體處理進度（「12 則回饋，已處理 9 則」）——上游回饋要求的「整體狀態」。

### 6.3 `/review/tasks` 我的驗收任務（Reviewer）

- 任務清單：教案 / 家別 / 檔案完整性 / Deadline / 任務狀態 / 動作。
- 未發布時列表為空，並顯示空狀態文案「本輪任務尚未開放」——不要顯示假的 loading。
- **`ReviewWorkspace` 是獨立路由 `/review/tasks/[jobId]`，不是 modal。**
  Prototype 用 modal，但驗收一份教案要 10–20 分鐘、要對照 PDF、可能要中途離開。
  獨立頁面才能重整、貼連結、開新分頁對照。
- 版面：左 `PdfPreview`（**既有元件 `features/teaching-plan/PdfPreview.tsx` 直接重用**）、右表單。
  上游回饋提到「左邊那區預計會放投影片預覽嗎」「初驗一頁搭配左邊預覽教案紙之後，下一頁進到投影片部分」
  → 左側預覽加一組切換（教案紙 / 投影片）。
- 初驗表單：四大分類、勾選未達標、每項可填理由；**即時顯示試算分數**（保留上游 §21.4 的 A 方案），
  但分數旁標註「以送出後系統計算為準」，送出後顯示後端回傳的真實分數。
  是否顯示由 `policy.show_live_score_to_reviewer` 控制。
- 總驗表單：三個區塊（初驗改善追蹤 / 教案紙判定 / 投影片檢核），
  投影片 checklist 較長 → 分區塊 collapse，並提供「本區全部通過」快捷（上游回饋要求）。
- **草稿**：表單每 30 秒或欄位 blur 時存 draft（`review_state = draft`），
  避免 prototype「提交後沒儲存到」的問題重演。

### 6.4 `/admin/review?tab=overview` 總覽

六家送件進度表：家別 / 送件狀態 / 待驗收份數 / 缺交份數 / 送出時間。
設計目標是「5 秒內回答哪家還沒送」→ 未送出的列用 `alert` 樣式，並置頂。

### 6.5 `/admin/review?tab=assignments` 驗收分配

- 預設**檢視模式**，右上角「編輯分配」才進編輯（上游 §10.3，回饋確認這個設計是對的）。
- 兩種檢視：從教案檢視 / 從驗收者檢視。
- **從驗收者檢視也要能調整分配**（上游回饋直接問了「不能從『從驗收者檢視』調整教案分配嗎」）
  → 該檢視的每一列可展開教案清單，逐份移除或改派。
- Loading 顯示份數，並附加權 points（大堂課 2 / 小堂課 1 / 其他 1），
  兩個數字並列（「8 份 · 13 pts」），不做成切換開關。
- **每份教案是兩個固定欄位 Reviewer A、Reviewer B**〔D2〕，不是多選 tag。
  - 未填滿（只有 A 或兩個都空）的教案在清單上用 `alert` 樣式標示，並在頁首顯示
    「還有 8 份未完成分配」——因為**只要有一份沒填滿，整輪就發布不了**（後端會擋）。
  - 同一份教案的 A、B 不可為同一人：選了 A 之後，B 的下拉要把那個人排除。
  - 批量指派時要指定套用到哪個 slot（「批量設定 Reviewer A」），不是「加一位 reviewer」。
  - 換人就是換該 slot 的人，slot 標籤不變。
  - 總驗預設帶入初驗的 A/B 時，**按 slot 對應**顯示（初驗 A → 總驗 A）。
- 自己家的教案在 reviewer 下拉中**標紅並 disable**（I1 的第一道提示，後端仍會 hard reject）。
- 儲存後回檢視模式，並顯示「已儲存，Reviewer 尚未看得到；前往發布公告 →」的引導。

### 6.6 `/admin/review?tab=results` 驗收結果

- 初驗：Reviewer A/B 分數、平均、系統篩選、Feedback 進度、最終結果（通過 / 補驗）。
- **點教案列可直接展開 / 跳到該份的 reviewer feedback**（三個人在回饋裡要求了同一件事）。
- 批量套用結果前**一律跳確認**，確認 modal 列出將被套用的教案名稱清單。
- 按鈕文案「確認並鎖定結果」（上游 §21.1）。
- 鎖定後列變 `locked` 樣式，只有具 `policy.leader_can_unlock_result` 或 admin 能解鎖，且需填理由。

### 6.7 `/admin/announcements` 驗收公告

新增公告 modal：模板選擇（驗收時程 / 初驗結果 / 總驗結果 / 補驗通知）→
標題、內容、是否寄 Email、是否同步開放本輪任務、是否同步開放本輪結果、是否附缺交名單。
「同步開放本輪任務」只在分配已儲存時可勾選（未儲存時 disable + tooltip 說明原因）。

**發布前顯示影響摘要**：「將開放 62 份任務給 7 位 Reviewer，寄出 7 封信」——
這是不可逆動作，值得一個具體的確認畫面。

### 6.8 時程（deadline）

〔D4〕四個日期＝兩輪 × 兩個截止點，全部來自 `GET /review/schedules`，
也一併出現在 `/review/me/context` 的 `stage_state`，**前端不要自己算、不要寫死**。

| 位置 | 顯示 |
| --- | --- |
| `/admin/review?tab=settings` | 兩輪各兩個 datetime 欄位，可隨時修改（含任務已發布後）。改動後 toast 提示「已更新，前台立即生效」。權限：`admin.enter` 且 `policy.leader_can_edit_schedule`（管理員恆可） |
| `/announcement` 時程區塊 | 取代 prototype 寫死的 timeline。未設定的日期顯示「未設定」，不要顯示假日期 |
| `/review/family` 頁首 | 「距離初驗送件截止還有 3 天」；逾期改成「已逾期 2 天」＋ `alert` 樣式 |
| `/review/tasks` 清單 | Deadline 欄；逾期的列用 `alert` 樣式 |

**逾期不擋。** 過了截止時間家長仍可送件、reviewer 仍可提交，UI 只標記。
不要在前端加 disable——後端不擋，前端擋只會製造「明明還能做卻按不下去」的求救訊息。

---

## 7. 導覽與權限

### 7.1 Navbar 改動（`src/components/layout/Navbar.tsx`）

現況：`BASE_MENU` 是寫死的陣列，登入後插入「教案管理」。
改法：保持同樣結構，改成由 capability 決定：

```ts
const menu = useMemo(() => {
  const items = [BASE_MENU[0]];                                   // 教案檢索
  if (authenticated) items.push({ key: 'manage', label: '教案管理', to: '/manage' });
  if (ctx?.capabilities.length) items.push({ key: 'review', label: '教案驗收', to: '/review' });
  return [...items, ...BASE_MENU.slice(1)];                       // 學習資源 / 使用手冊 / 錯誤回報
}, [authenticated, ctx]);
```

`/review` 的 `page.tsx` 依 capability redirect：
`family.submit → /review/family`；`review.submit → /review/tasks`；
`plan.author → /review/my-plans`；都沒有 → `/review`（只顯示公告連結）。

右上角頭貼選單（既有 hover dropdown）加一項：
`admin.enter` 時顯示「後台管理」/「教案平台」切換。

### 7.2 權限只做一件事：藏 UI

**前端的 capability 檢查只負責不畫出使用者用不到的東西，不是安全機制。**
每個受保護的頁面在 `layout.tsx` 檢查 capability，缺少就 redirect 回 `/`；
但真正的擋是後端做的，前端不做任何「因為我是組長所以可以」的業務判斷。

`policy` 決定的欄位（raw score、reviewer 姓名等）**後端本來就不會回傳**，
前端只需要處理「欄位不存在」的情況（`?.` + fallback），不要用 policy 自己決定要不要 render。

---

## 8. 共用元件

### 8.1 直接重用（不改）

`components/ui/`：`Modal`、`ConfirmModal`、`Checkbox`、`Button`、`Input`、
`DropdownMulti`、`RadioCheckboxGroup`、`Warning`、`toast`、`FileUpload`
`features/teaching-plan/`：`PdfPreview`（驗收工作區左側）、`AllPlansTable`（後台教案管理）

### 8.2 需要小幅調整

| 元件 | 調整 |
| --- | --- |
| `components/ui/Tab.tsx` | 目前泛型寫死 `'login' \| 'signup'`。改成 `Tab<T extends string>({ tabs, active, onChange })`，登入頁的用法保持不變（傳兩個 tab 進去即可） |
| `components/layout/Navbar.tsx` | §7.1 |
| `app/plans/[id]/edit/page.tsx` | `editing_status !== 'draft'` 時唯讀 + 引導至 `/review/my-plans` |
| `app/announcement/page.tsx` | 加 type 篩選，接上 `GET /review/announcements` |

### 8.3 新增（放 `features/review-shared/`）

`StatusChip`、`RoundTabs`、`LockBanner`、`SnapshotBox`、`BulkActionBar`、`Can`

**`BulkActionBar` 要 sticky**，因為後台常常一次處理 60–100 列，
按鈕捲出畫面是 prototype 回饋裡明確提到的痛點。

---

## 9. 給 coding agent 的執行順序

一個 ticket 一個 PR。每個 ticket 完成後跑：`npx tsc --noEmit && npm run build && npm run lint`

```
F0-1  globals.css 加 --color-status-* 語意 token                     [S]
F0-2  StatusChip + Can + useTermContext（先接 mock，後端 T1-5 後換真） [M]
F0-3  Tab.tsx 泛型化（登入頁不得改變外觀）                            [S]
F1-1  Navbar capability 化 + 頭貼選單加後台切換                       [M]
F1-2  /review layout + redirect page + /admin layout（殼層與 guard）  [M]
F2-1  RoundTabs / LockBanner / SnapshotBox / BulkActionBar            [M]
F3-1  /review/family 表格 + 缺交面板                                  [L]
F3-2  送出確認 modal（含被排除清單）+ sticky bar + 冪等 key            [M]
F3-3  deadline 顯示：家長頁倒數 + 公告時程區塊                         [M]
F4-0  /admin/review?tab=settings 時程設定 + TermPolicy 開關            [M]
F4-1  /admin/review?tab=overview 六家進度                             [M]
F4-2  /admin/review?tab=assignments 檢視模式（雙檢視）                 [L]
F4-3  分配編輯模式：A/B 兩 slot + 批量指派 + 自家禁選 + points         [L]
F4-4  /admin/announcements 公告 modal + 影響摘要                       [L]
F5-1  /review/tasks 清單                                             [M]
F5-2  /review/tasks/[jobId] ReviewWorkspace 殼層 + PdfPreview 切換     [L]
F5-3  InitialReviewForm（勾選 + 試算 + 草稿自動存）                    [L]
F5-4  /admin/review?tab=results 初驗結果 + 批量 + 確認鎖定             [L]
F6-1  /review/my-plans + FeedbackItemList + 進度                      [L]
F6-2  FinalRevisionUploadModal（初驗頁與總驗頁共用入口）               [M]
F6-3  FinalReviewForm（改善追蹤 + 教案紙 / 投影片判定 + 區塊全過）      [L]
F6-4  /admin/review?tab=results 總驗 + 最終決策                        [M]
F7-1  /admin/members 成員管理 + 批量編輯 + 複製上期角色                [L]
F7-2  /admin/plans（沿用 AllPlansTable）+ 優良標記                    [M]
F7-3  /admin/rubric 標準檢視與編輯                                    [L]
F7-4  /announcement 整併驗收公告 type                                 [M]
F7-5  /plans/[id]/edit 驗收期間唯讀導引                               [S]
```

F0–F2 可以在後端還沒好時先做（接 mock context）。
F3 起需要對應的後端 ticket 完成（對照 `../tutoref_backend/docs/REVIEW_MODULE_PLAN.md` §14）。

---

## 10. 驗收（QA）檢查點

每個階段結束時，用 `新版平台完整規劃.md` §19 的 Scenario A–J 實際走一次。
另外三個一定要測到：

1. **未發布時 reviewer 看不到任務**——組長儲存分配但不發布，reviewer 重整頁面必須是空的。
2. **送出後真的鎖住**——家長送出後重整、換裝置，欄位仍不可編輯（不是只有前端 disable）。
3. **快取沒有騙人**——A 視窗組長改了分配，B 視窗 reviewer 重整就該看到新結果（因為驗收資料不快取）。
