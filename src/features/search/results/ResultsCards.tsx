'use client';
import { goodTint, type Row } from './types';

interface ResultsCardsProps {
  searching: boolean;
  pageRows: Row[];
  detailLoading: boolean;
  detailPlanId: string | null;
  favoritePendingId: string | null;
  onView: (row: Row) => void;
  onToggleLike: (id: string) => void;
}

/** 手機卡片（md 以下），含搜尋中骨架與空狀態。 */
export default function ResultsCards({
  searching,
  pageRows,
  detailLoading,
  detailPlanId,
  favoritePendingId,
  onView,
  onToggleLike,
}: ResultsCardsProps) {
  return (
    <div className="mt-4 md:hidden flex flex-col gap-3">
      {searching ? (
        Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden p-4 flex flex-col gap-3">
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/3" />
            <div className="h-5 bg-gray-200 rounded animate-pulse w-3/4" />
            <div className="h-4 bg-gray-200 rounded animate-pulse w-1/2" />
          </div>
        ))
      ) : pageRows.length === 0 ? (
        <div className="py-6 text-center text-[15px] font-['Noto_Sans_TC'] text-black-700 bg-white rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          查無符合條件的教案，請調整檢索條件後再試。
        </div>
      ) : pageRows.map((r) => (
        <div key={r.id} className="bg-white rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden">
          {/* 上區塊：優良標籤 + hashtags + 心形；標題 */}
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
              <button type="button" onClick={() => onToggleLike(r.id)}
                aria-label={r.liked ? '取消收藏' : '加入收藏'}
                disabled={favoritePendingId === r.id}
                className={`shrink-0 ${favoritePendingId === r.id ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-70 cursor-pointer'}`}>
                <img src={r.liked ? '/icons/liked.svg' : '/icons/like.svg'} alt="" width={20} height={20} />
              </button>
            </div>
            <p className="text-[16px] font-bold font-['Noto_Sans_TC'] text-black-900 leading-snug">{r.title}</p>
          </div>

          {/* 下區塊：期數/類別、家別/撰寫者（左）+ 查看按鈕（右） */}
          <div className="px-4 py-2 flex items-center gap-3">
            <div className="flex-1 flex flex-col gap-1">
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
            <button type="button" onClick={() => onView(r)} aria-label="查看"
              disabled={detailLoading && detailPlanId === r.id}
              className={`w-[64px] h-[26px] rounded-[4px] px-[20px] py-[4px] bg-primary-900 text-white text-[12px] font-normal font-['Noto_Sans_TC'] leading-[150%] whitespace-nowrap shrink-0 inline-flex items-center justify-center ${detailLoading && detailPlanId === r.id ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}>
              查看
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
