# AGENTS.md

給 coding agent 的專案指南（人類請看 `README.md`；
驗收模組的實作規格見 `docs/REVIEW_MODULE_PLAN.md`，動到 /review、/admin 相關頁面前必讀）。

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
│   ├── page.tsx            # 首頁（分類快搜，呼叫 /stats）
│   ├── manage/             # 教案管理總覽
│   ├── plans/mine/         # 我的教案清單
│   ├── plans/likes/        # 我的收藏
│   ├── plans/[id]/edit/    # 教案編輯
│   ├── upload/             # 上傳流程
│   └── announcement/       # 公告
├── features/       # 依領域劃分的功能模組（元件 + hooks + helpers 就近放）
│   ├── auth/               # 登入/註冊、useAuth
│   ├── search/             # 搜尋篩選與結果（results/ 子模組）
│   ├── manage/             # 教案管理（usePlanManagement、cache.ts）
│   ├── teaching-plan/      # 教案編輯器、AllPlansTable、詳情 modal
│   ├── upload/             # 上傳 dropzone 與流程 hook
│   ├── announcement/       # 公告清單
│   └── package/            # 教材包
├── components/     # 跨領域共用元件（ui/、layout/）
├── lib/            # 通用工具：api client、constants、session-cache、issues 排序
├── services/       # 後端 API 呼叫封裝（auth、teaching-plan）
├── hooks/          # 共用 React hooks（use-toast 等）
└── types/          # 共用 TypeScript 型別
```

路徑別名：`@/*` → `./src/*`。

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

- **邏輯放 features/**：頁面元件保持薄，狀態與流程抽成 feature 內的 hook（參考 `features/manage/usePlanManagement.ts`）。大元件拆成子模組（參考 `features/search/results/`）。
- **sessionStorage 快取**：manage / mine / edit 三頁共用清單快取，鍵值與同步邏輯集中在 `src/features/manage/cache.ts`，底層讀寫在 `src/lib/session-cache.ts`。改動快取行為時三頁要一起考慮，不要在頁面內另寫 sessionStorage 存取。
- **API 呼叫**：一律帶 cookie（session 認證）。優先用 `src/services/` 的封裝或 `src/lib/api.ts`。
- **樣式**：Tailwind utility class，字體 `Noto Sans TC`，色票用專案自訂的 `primary-*` / `secondary-*` / `black-*`。
- **驗證門檻**：`tsc --noEmit` 與 `next build` 都必須通過才能 commit。
- **Vercel 附註**：非 Vercel 專案成員的 commit 不會產生 preview 部署（check 會紅），與程式碼品質無關。

## Commit / PR

- Commit 訊息用 conventional commits（`feat:`、`fix:`、`refactor:`……），現有歷史為準。
- 分支開自 `main`，PR 目標也是 `main`。
