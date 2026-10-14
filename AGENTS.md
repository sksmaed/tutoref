# AGENTS.md

給 coding agent 的專案指南（人類請看 `README.md`；
驗收模組的實作規格見 `docs/REVIEW_MODULE_PLAN.md`，動到 /review、/admin 相關頁面前必讀——
其中路由與導覽章節已被本文件的「版面與導覽」取代）。

## 專案概觀

Tutoref 前端 —— 台大山服的教案檢索平台。使用者可搜尋、上傳、收藏、管理教案 PDF。

- **框架**：Next.js（App Router）+ TypeScript + Tailwind CSS
- **後端**：獨立 repo `tutoref_backend`（Django + django-ninja-extra），透過 `NEXT_PUBLIC_API_BASE_URL` 指定位址，API 掛在 `/api/v2/`
- **部署**：Vercel（`main` 分支自動部署）
- **UI 語言**：繁體中文（使用者可見字串一律 zh-TW）

## 目錄結構

```
src/
├── app/            # App Router 路由（頁面盡量薄，邏輯放 features/）
│   ├── page.tsx            # 教案檢索（未查詢：熱門分類 + Start Here；有查詢：結果表格）
│   ├── package/            # 學習資源
│   ├── announcement/       # 訊息公告（＋ 公告撰寫器，?compose=1&round=…）
│   ├── plans/mine/         # 已上傳教案
│   ├── plans/likes/        # 已收藏教案
│   ├── plans/[id]/edit/    # 教案編輯
│   ├── upload/             # 上傳流程
│   ├── account/            # 設定（個人資料與本期身份，唯讀）
│   ├── review/             # 教案驗收：family/（家內教案）、tasks/（我的驗收任務＋工作區 [jobId]）
│   └── admin/              # review/（本期驗收管理）、members/、plans/、rubric/
├── features/       # 依領域劃分的功能模組（元件 + hooks + helpers 就近放）
│   ├── auth/               # 登入/註冊、useAuth
│   ├── search/             # 搜尋篩選與結果（results/ 子模組）
│   ├── manage/             # 已上傳教案清單快取（cache.ts）
│   ├── teaching-plan/      # 教案編輯器、AllPlansTable、詳情 modal、OwnedPlanModal
│   ├── upload/             # 上傳 dropzone 與流程 hook
│   ├── announcement/       # 公告撰寫器、模板、驗收時程 timeline
│   ├── account/            # 設定頁卡片
│   ├── review-shared/      # useTermContext、StatusChip、LockBanner、RoundTabs、TermPageHead…
│   ├── review-family/      # 家內教案
│   ├── review-author/      # 我的驗收任務 → 我的教案（回饋處理、總驗修改版上傳）
│   ├── review-tasks/       # 我的驗收任務 → 待驗收教案、驗收工作區表單
│   ├── admin/              # review-manage/（驗收管理各分頁）、assignments/、results/、members/、rubric/…
│   └── package/            # 教材包
├── components/
│   ├── layout/             # AppShell、Sidebar、UserMenu、nav-config、PageHead、Footer
│   └── ui/                 # Dialog、Drawer、Card、SegmentedTabs、Tab、toast…
├── lib/            # api client、constants、session-cache、issues 排序、table-styles、button-styles
├── services/       # 後端 API 呼叫封裝（auth、teaching-plan、review）
├── hooks/          # 共用 React hooks（use-toast 等）
└── types/          # 共用 TypeScript 型別
```

路徑別名：`@/*` → `./src/*`。

## 版面與導覽

- **全站殼層**：`components/layout/AppShell.tsx`（左側浮動側欄 + 右上使用者選單 + Footer）。
  登入、忘記密碼、重設密碼頁不套側欄（`ClientLayoutWrapper.tsx` 的 `BARE_PREFIXES`）。
- **側欄項目一律寫在 `components/layout/nav-config.ts`**：分組、連結、作用中判斷、顯示條件都在這裡；
  顯示條件只看 `useTermContext().capabilities`（後端算好，前端只做 `includes()`），只是藏入口，真正的擋在後端。
- **現行路由**（舊網址由 `next.config.ts` 的 `redirects()` 轉址）：

  | 側欄 | 路由 | 顯示條件 |
  | --- | --- | --- |
  | 教案檢索 / 學習資源 | `/`、`/package` | 所有人 |
  | 訊息公告 | `/announcement` | 已登入；`announcement.publish` 才有「新增公告」 |
  | 已上傳教案 / 已收藏教案 | `/plans/mine`、`/plans/likes` | 已登入（`/manage` 轉址到 `/plans/mine`） |
  | 家內教案 | `/review/family` | `family.submit` |
  | 我的驗收任務 | `/review/tasks` | `plan.author` 或 `review.submit`（`/review/my-plans` 轉址到這裡） |
  | 本期驗收管理 | `/admin/review?tab=schedule\|rubric\|initial\|final&view=submissions\|assignments\|results` | `review.manage` |
  | 成員管理 / 教案管理 / 驗收標準 | `/admin/members`、`/admin/plans`、`/admin/rubric` | `admin.enter` / `rubric.manage` |
  | 設定（使用者選單） | `/account` | 已登入 |

- **頁面標題**：一般頁用 `components/layout/PageHead`；驗收區用 `features/review-shared/TermPageHead`（自動帶期別）。
  PageHead 右側留白是為了避開右上角的使用者選單，不要自己另寫標題列。
- **狀態放網址**：分頁、輪次（`?round=`）、檢視（`?view=`）都放 query，方便互相貼連結。

## 常用指令

```bash
npm install          # 或 pnpm install（兩種 lockfile 都有維護）
npm run dev          # 開發伺服器（turbopack）
npm run build        # 產線建置——改動後的必要驗證
npx tsc --noEmit     # 型別檢查——改動後的必要驗證
npm run lint         # ESLint
```

環境變數放 `.env.local`（不進 git）；至少需要 `NEXT_PUBLIC_API_BASE_URL`。

## 慣例與注意事項

- **邏輯放 features/**：頁面元件保持薄，狀態與流程抽成 feature 內的 hook（參考 `features/review-family/useFamilyReview.ts`、`features/announcement/useAnnouncementComposer.ts`）。大元件拆成子模組（參考 `features/search/results/`）。
- **sessionStorage 快取**：已上傳教案清單快取的鍵值與同步邏輯集中在 `src/features/manage/cache.ts`（清單頁讀寫，編輯頁與上傳流程存檔後呼叫 `updateMineCacheAfterEdit`），底層讀寫在 `src/lib/session-cache.ts`。不要在頁面內另寫 sessionStorage 存取；驗收資料一律不進 sessionStorage。
- **API 呼叫**：一律帶 cookie（session 認證）。優先用 `src/services/` 的封裝或 `src/lib/api.ts`。
- **樣式**：Tailwind utility class，字體 `Noto Sans TC`，色票只用 `globals.css` 的 token（`primary-*` / `secondary-*` / `black-*` / `category-*`；狀態色用 `status-*` 語意別名），不要寫死 hex 或用 Tailwind 內建色（`blue-50` 等）。
- **共用 UI**：狀態徽章一律 `StatusChip`；表格用 `lib/table-styles.ts`、按鈕用 `lib/button-styles.ts` 的 class 常數；彈窗用 `components/ui/Dialog`（疊兩層時 Esc 只關最上層）、側邊抽屜用 `Drawer`；批量動作列用 `BulkActionBar`（`variant="inline"` 放在表格上方）。
- **驗證門檻**：`tsc --noEmit` 與 `next build` 都必須通過才能 commit。刪檔後 `tsc` 若報 `.next/types/...` 找不到模組，是舊的建置產物，跑一次 `next build` 就會消失。
- **Vercel 附註**：非 Vercel 專案成員的 commit 不會產生 preview 部署（check 會紅），與程式碼品質無關。

## Commit / PR

- Commit 訊息用 conventional commits（`feat:`、`fix:`、`refactor:`……），現有歷史為準。
- 分支開自 `main`，PR 目標也是 `main`。
