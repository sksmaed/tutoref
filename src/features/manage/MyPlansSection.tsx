'use client';

import { goodTint, type Row } from './types';
import { SectionHeader, viewAllBtnClass } from './shared';
import { PlanStatusBadges } from '@/features/teaching-plan/PlanStatusBadges';

interface MyPlansSectionProps {
  myPlans: Row[];
  total: number;
  hasPlans: boolean;
  plansLoading: boolean;
  plansError: string;
  deletingId: string | null;
  onEdit: (row: Row) => void;
  onDelete: (row: Row) => void;
  onViewAll: () => void;
  onUpload: () => void;
}

/** 「我的教案」區塊：桌機表格 + 手機卡片 + 查看全部／上傳教案按鈕。 */
export default function MyPlansSection({
  myPlans,
  total,
  hasPlans,
  plansLoading,
  plansError,
  deletingId,
  onEdit,
  onDelete,
  onViewAll,
  onUpload,
}: MyPlansSectionProps) {
  return (
    <>
      <SectionHeader title="我的教案" total={total} />

      {/* Desktop table */}
      <div className="mt-2 hidden md:block rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] bg-white overflow-hidden">
        <table className="w-full border-collapse">
          <colgroup>
            <col style={{ width: '9%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '27%' }} />
            <col style={{ width: '13%' }} />
            <col style={{ width: '15%' }} />
            <col style={{ width: '9%' }} />
            <col style={{ width: '9%' }} />
          </colgroup>
          <thead>
            <tr className="bg-primary-100 text-[14px] font-bold font-['Noto_Sans_TC'] text-black-900">
              {['家別', '期數', '類別', '教案名稱', '撰寫者', '狀態', '編輯', '刪除'].map((col, i, arr) => (
                <th key={col} className={['h-[48px] border border-black-200 px-2 text-center font-bold whitespace-nowrap', i === 0 ? 'rounded-tl-lg' : '', i === arr.length - 1 ? 'rounded-tr-lg' : ''].filter(Boolean).join(' ')}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {plansLoading ? (
              <tr><td colSpan={8} className="h-[48px] border border-black-200 text-center text-[16px] text-black-700">資料載入中...</td></tr>
            ) : plansError ? (
              <tr><td colSpan={8} className="h-[48px] border border-black-200 text-center text-[16px] text-black-700">{plansError}</td></tr>
            ) : hasPlans ? (
              myPlans.map((r) => (
                <tr key={r.id} className="text-[14px]">
                  <td className="h-[48px] border border-black-200 px-2 text-center">{r.family}</td>
                  <td className="h-[48px] border border-black-200 px-2 text-center">{r.issue}</td>
                  <td className="h-[48px] border border-black-200 px-2 text-center">{r.category}</td>
                  <td className="h-[48px] border border-black-200 px-2 max-w-0">
                    <div className="flex items-center justify-center gap-2 overflow-hidden">
                      {r.good && <img src="/icons/good.svg" alt="" width={16} height={16} style={goodTint} className="shrink-0" />}
                      <span className="truncate" title={r.title}>{r.title}</span>
                    </div>
                  </td>
                  <td className="h-[48px] border border-black-200 px-2 text-center">{r.author}</td>
                  <td className="h-[48px] border border-black-200 px-2 text-center">
                    <PlanStatusBadges
                      editingStatus={r.editingStatus}
                      visibilityStatus={r.visibilityStatus}
                    />
                  </td>
                  <td className="h-[48px] border border-black-200 px-2 text-center">
                    <button type="button" aria-label="編輯" onClick={() => onEdit(r)} disabled={plansLoading || deletingId === r.id} className={plansLoading || deletingId === r.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                      <img src="/icons/edit.svg" alt="" width={20} height={20} />
                    </button>
                  </td>
                  <td className="h-[48px] border border-black-200 px-2 text-center">
                    <button type="button" aria-label="刪除" onClick={() => onDelete(r)} disabled={plansLoading || deletingId === r.id} className={plansLoading || deletingId === r.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                      <img src="/icons/trash.svg" alt="" width={20} height={20} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr><td colSpan={8} className="h-[48px] border border-black-200 text-center text-[16px] text-black-700 px-4">你還沒上傳任何教案唷，快點擊下方按鈕上傳第一份教案吧！</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards - 我的教案 */}
      <div className="mt-2 md:hidden flex flex-col gap-3">
        {plansLoading ? (
          <div className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] px-4 py-3 text-center text-[14px] text-black-500">資料載入中...</div>
        ) : plansError ? (
          <div className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] px-4 py-3 text-center text-[14px] text-black-500">{plansError}</div>
        ) : hasPlans ? (
          myPlans.map((r) => (
            <div key={r.id} className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden">
              {/* 上區塊：優良標籤（左）+ 編輯/刪除（右）→ 標題 */}
              <div className="px-4 py-2 flex flex-col gap-1">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                    {r.good && (
                      <>
                        <img src="/icons/good.svg" alt="" width={14} height={14} style={goodTint} className="shrink-0" />
                        <span className="text-[13px] font-semibold font-['Noto_Sans_TC'] text-secondary-700 shrink-0">優良教案</span>
                      </>
                    )}
                    {r.hashtags?.map((tag) => (
                      <span key={tag} className="text-[12px] font-['Noto_Sans_TC'] font-normal text-[#808080]">#{tag}</span>
                    ))}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button type="button" aria-label="編輯" onClick={() => onEdit(r)} disabled={plansLoading || deletingId === r.id} className={plansLoading || deletingId === r.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                      <img src="/icons/edit.svg" alt="" width={20} height={20} />
                    </button>
                    <button type="button" aria-label="刪除" onClick={() => onDelete(r)} disabled={plansLoading || deletingId === r.id} className={plansLoading || deletingId === r.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                      <img src="/icons/trash.svg" alt="" width={20} height={20} />
                    </button>
                  </div>
                </div>
                <p className="text-[16px] font-bold font-['Noto_Sans_TC'] text-black-900 leading-snug">{r.title}</p>
                <PlanStatusBadges
                  editingStatus={r.editingStatus}
                  visibilityStatus={r.visibilityStatus}
                  compact
                />
              </div>
              {/* 下區塊：期數/類別、家別/撰寫者 */}
              <div className="px-4 py-2 flex flex-col gap-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <img src="/icons/calender.svg" alt="" width={14} height={14} className="shrink-0" />
                    <span className="text-[13px] font-['Noto_Sans_TC'] text-black-700">{r.issue}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src="/icons/category.svg" alt="" width={14} height={14} className="shrink-0" />
                    <span className="text-[13px] font-['Noto_Sans_TC'] text-black-700">{r.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <img src="/icons/home.svg" alt="" width={14} height={14} className="shrink-0" />
                    <span className="text-[13px] font-['Noto_Sans_TC'] text-black-700">{r.family}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src="/icons/author.svg" alt="" width={14} height={14} className="shrink-0" />
                    <span className="text-[13px] font-['Noto_Sans_TC'] text-black-700">{r.author}</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] px-4 py-3 text-center text-[14px] text-black-500">你還沒上傳任何教案唷，快點擊下方按鈕上傳第一份教案吧！</div>
        )}
      </div>

      <div className="mt-6 flex w-full items-center justify-center gap-[24px]">
        <button
          type="button"
          disabled={!hasPlans || plansLoading}
          onClick={() => hasPlans && !plansLoading && onViewAll()}
          className={viewAllBtnClass(!hasPlans || plansLoading)}
        >
          查看全部
        </button>

        <button
          type="button"
          onClick={onUpload}
          className="
            w-[160px] h-[48px] rounded-[8px] bg-primary-900
            px-[47px] py-[12px] whitespace-nowrap
            text-[16px] leading-[150%] font-['Noto_Sans_TC'] font-bold text-white
            shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] cursor-pointer hover:opacity-90
          "
        >
          上傳教案
        </button>
      </div>
    </>
  );
}
