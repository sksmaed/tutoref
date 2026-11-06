'use client';
import { TABLE, TABLE_WRAP, TD, TH } from '@/lib/table-styles';
import { goodTint, type Row } from './types';

interface ResultsTableProps {
  searching: boolean;
  pageRows: Row[];
  detailLoading: boolean;
  detailPlanId: string | null;
  favoritePendingId: string | null;
  onView: (row: Row) => void;
  onToggleLike: (id: string) => void;
}

// v13 `.lesson-search-table`：固定欄寬、不水平捲動
const COLUMNS: { label: string; width: string; center?: boolean }[] = [
  { label: '教案名稱', width: 'w-[31%]' },
  { label: '撰寫者', width: 'w-[19%]' },
  { label: '類別', width: 'w-[10%]' },
  { label: '家別', width: 'w-[9%]' },
  { label: '期數', width: 'w-[9%]' },
  { label: '年級', width: 'w-[14%]' },
  { label: '收藏', width: 'w-[8%]', center: true },
];

/** 桌機表格（md 以上），含搜尋中骨架與空狀態。點整列開啟課程詳細資訊。 */
export default function ResultsTable({
  searching,
  pageRows,
  detailLoading,
  detailPlanId,
  favoritePendingId,
  onView,
  onToggleLike,
}: ResultsTableProps) {
  return (
    <div className={`mt-4 hidden md:block ${TABLE_WRAP} overflow-x-hidden`}>
      <table className={`${TABLE} table-fixed`}>
        <colgroup>
          {COLUMNS.map((col) => (
            <col key={col.label} className={col.width} />
          ))}
        </colgroup>
        <thead>
          <tr>
            {COLUMNS.map((col) => (
              <th key={col.label} className={`${TH} px-[10px] py-[11px] ${col.center ? 'text-center' : ''}`}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {searching ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {COLUMNS.map((col, j) => (
                  <td key={col.label} className={`${TD} px-[10px] py-[11px]`}>
                    <div className="h-4 rounded bg-black-100 animate-pulse" style={{ width: j === 0 ? '80%' : '60%' }} />
                  </td>
                ))}
              </tr>
            ))
          ) : pageRows.length === 0 ? (
            <tr>
              <td colSpan={COLUMNS.length} className="py-12 text-center text-[15px] text-black-500">
                查無符合條件的教案，請調整檢索條件後再試。
              </td>
            </tr>
          ) : pageRows.map((r) => {
            const opening = detailLoading && detailPlanId === r.id;
            return (
              <tr
                key={r.id}
                onClick={() => !opening && onView(r)}
                className={`transition-colors hover:bg-primary-100/40 ${opening ? 'cursor-wait opacity-60' : 'cursor-pointer'}`}
              >
                <td className={`${TD} break-words px-[10px] py-[11px]`}>
                  <div className="flex items-start gap-2">
                    <span className="font-bold" title={r.title}>{r.title}</span>
                    {r.good && (
                      <span className="inline-flex shrink-0 items-center gap-[2px] rounded-full bg-status-done-bg px-2 py-[2px] text-[11px] font-bold text-status-done">
                        <img src="/icons/good.svg" alt="" width={12} height={12} style={goodTint} />
                        優良
                      </span>
                    )}
                  </div>
                  {r.hashtags && r.hashtags.length > 0 && (
                    <div className="mt-[2px] flex flex-wrap gap-x-2">
                      {r.hashtags.map((tag) => (
                        <span key={tag} className="whitespace-nowrap text-[12px] text-black-500">#{tag}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td className={`${TD} break-words px-[10px] py-[11px]`}>{r.author}</td>
                <td className={`${TD} px-[10px] py-[11px]`}>{r.category}</td>
                <td className={`${TD} px-[10px] py-[11px]`}>{r.family}</td>
                <td className={`${TD} px-[10px] py-[11px]`}>{r.issue}</td>
                <td className={`${TD} break-words px-[10px] py-[11px]`}>{r.grade || '—'}</td>
                <td className={`${TD} px-[10px] py-[11px] text-center`}>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      onToggleLike(r.id);
                    }}
                    aria-label={r.liked ? '取消收藏' : '加入收藏'}
                    disabled={favoritePendingId === r.id}
                    className="rounded-lg p-[6px] enabled:cursor-pointer enabled:hover:bg-primary-100 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    <img src={r.liked ? '/icons/liked.svg' : '/icons/like.svg'} alt="" width={20} height={20} />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
