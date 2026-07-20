'use client';
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

/** 桌機表格（md 以上），含搜尋中骨架與空狀態。 */
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
    <div className="mt-4 w-full hidden md:block rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden">
      <table className="w-full border-collapse text-[14px] font-['Noto_Sans_TC']">
        <colgroup>
          <col className="w-[9%]" />
          <col className="w-[9%]" />
          <col className="w-[9%]" />
          <col />
          <col className="w-[14%]" />
          <col className="w-[7%]" />
          <col className="w-[7%]" />
        </colgroup>
        <thead>
          <tr className="bg-primary-100 text-black-900 font-bold">
            {['家別','期數','類別','教案名稱','撰寫者','查看','收藏'].map((h, i) => (
              <th key={h} className={`h-[48px] px-3 text-center border border-black-200 whitespace-nowrap ${i === 0 ? 'rounded-tl-lg' : ''} ${i === 6 ? 'rounded-tr-lg' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-black-200">
          {searching ? (
            Array.from({ length: 5 }).map((_, i) => (
              <tr key={i}>
                {Array.from({ length: 7 }).map((__, j) => (
                  <td key={j} className="h-[48px] px-3 border-x border-black-200">
                    <div className="h-4 bg-gray-200 rounded animate-pulse mx-auto" style={{ width: j === 3 ? '80%' : '60%' }} />
                  </td>
                ))}
              </tr>
            ))
          ) : pageRows.length === 0 ? (
            <tr>
              <td colSpan={7} className="h-[48px] text-center text-[16px] text-black-700 border-x border-b border-black-200 rounded-b-lg">
                查無符合條件的教案，請調整檢索條件後再試。
              </td>
            </tr>
          ) : pageRows.map((r) => (
            <tr key={r.id} className="hover:bg-primary-50 transition-colors">
              <td className="h-[48px] px-2 text-center border-x border-black-200">{r.family}</td>
              <td className="h-[48px] px-2 text-center border-x border-black-200">{r.issue}</td>
              <td className="h-[48px] px-2 text-center border-x border-black-200">{r.category}</td>
              <td className="px-4 py-[6px] border-x border-black-200 max-w-0">
                <div className="flex items-center gap-2 overflow-hidden">
                  {r.good && <img src="/icons/good.svg" alt="" width={16} height={16} style={goodTint} className="shrink-0" />}
                  <span className="truncate" title={r.title}>{r.title}</span>
                </div>
                {r.hashtags && r.hashtags.length > 0 && (
                  <div className="flex flex-wrap gap-x-2 mt-[2px] overflow-hidden">
                    {r.hashtags.map((tag) => (
                      <span key={tag} className="text-[12px] leading-[150%] font-['Noto_Sans_TC'] font-normal text-[#808080] whitespace-nowrap">#{tag}</span>
                    ))}
                  </div>
                )}
              </td>
              <td className="h-[48px] px-2 text-center border-x border-black-200">{r.author}</td>
              <td className="h-[48px] text-center border-x border-black-200">
                <button type="button" onClick={() => onView(r)} aria-label="查看"
                  disabled={detailLoading && detailPlanId === r.id}
                  className={detailLoading && detailPlanId === r.id ? 'cursor-not-allowed opacity-60' : 'hover:opacity-70 cursor-pointer'}>
                  <img src="/icons/file-alt.svg" alt="查看" width={20} height={20} />
                </button>
              </td>
              <td className="h-[48px] text-center border-x border-black-200">
                <button type="button" onClick={() => onToggleLike(r.id)}
                  aria-label={r.liked ? '取消收藏' : '加入收藏'}
                  disabled={favoritePendingId === r.id}
                  className={favoritePendingId === r.id ? 'cursor-not-allowed opacity-60' : 'hover:opacity-70 cursor-pointer'}>
                  <img src={r.liked ? '/icons/liked.svg' : '/icons/like.svg'} alt="" width={20} height={20} />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
