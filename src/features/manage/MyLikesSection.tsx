'use client';

import { goodTint, type Row } from './types';
import { SectionHeader, viewAllBtnClass } from './shared';

interface MyLikesSectionProps {
  myLikes: Row[];
  total: number;
  hasLikes: boolean;
  likesLoading: boolean;
  likesError: string;
  likes: Record<string, boolean>;
  favoriteUpdatingId: string | null;
  detailLoading: boolean;
  detailPlanId: string | null;
  onView: (row: Row) => void;
  onFavoriteToggle: (row: Row) => void;
  onViewAll: () => void;
}

/** 「我的收藏」區塊：桌機表格 + 手機卡片 + 查看全部按鈕。 */
export default function MyLikesSection({
  myLikes,
  total,
  hasLikes,
  likesLoading,
  likesError,
  likes,
  favoriteUpdatingId,
  detailLoading,
  detailPlanId,
  onView,
  onFavoriteToggle,
  onViewAll,
}: MyLikesSectionProps) {
  return (
    <>
      <SectionHeader className="mt-12" title="我的收藏" total={total} />

      {/* Desktop table */}
      <div className="mt-2 hidden md:block rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] bg-white overflow-hidden">
        <table className="w-full border-collapse">
          <colgroup>
            <col style={{ width: '9.4%' }} />
            <col style={{ width: '9.4%' }} />
            <col style={{ width: '9.4%' }} />
            <col style={{ width: '36.1%' }} />
            <col style={{ width: '16.8%' }} />
            <col style={{ width: '9.4%' }} />
            <col style={{ width: '9.4%' }} />
          </colgroup>
          <thead>
            <tr className="bg-primary-100 text-[14px] font-bold font-['Noto_Sans_TC'] text-black-900">
              {['家別', '期數', '類別', '教案名稱', '撰寫者', '查看', '收藏'].map((col, i, arr) => (
                <th key={col} className={['h-[48px] border border-black-200 px-2 text-center font-bold whitespace-nowrap', i === 0 ? 'rounded-tl-lg' : '', i === arr.length - 1 ? 'rounded-tr-lg' : ''].filter(Boolean).join(' ')}>
                  {col}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {likesLoading ? (
              <tr><td colSpan={7} className="h-[48px] border border-black-200 text-center text-[16px] text-black-700">資料載入中...</td></tr>
            ) : likesError ? (
              <tr><td colSpan={7} className="h-[48px] border border-black-200 text-center text-[16px] text-black-700">{likesError}</td></tr>
            ) : hasLikes ? (
              myLikes.map((r) => {
                const liked = likes[r.id] ?? true;
                return (
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
                      <button type="button" aria-label="查看" onClick={() => onView(r)} disabled={detailLoading && detailPlanId === r.id} className={detailLoading && detailPlanId === r.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                        <img src="/icons/file-alt.svg" alt="" width={20} height={20} />
                      </button>
                    </td>
                    <td className="h-[48px] border border-black-200 px-2 text-center">
                      <button type="button" onClick={() => onFavoriteToggle(r)} disabled={favoriteUpdatingId === r.id || likesLoading} aria-label={liked ? '取消收藏' : '加入收藏'} className={favoriteUpdatingId === r.id || likesLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                        <img src={liked ? '/icons/liked.svg' : '/icons/like.svg'} alt="" width={20} height={20} />
                      </button>
                    </td>
                  </tr>
                );
              })
            ) : (
              <tr><td colSpan={7} className="h-[48px] border border-black-200 text-center text-[16px] text-black-700 px-4">目前沒有收藏的教案唷，快去探索看看其他人的教案吧！</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile cards - 我的收藏 */}
      <div className="mt-2 md:hidden flex flex-col gap-3">
        {likesLoading ? (
          <div className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] px-4 py-3 text-center text-[14px] text-black-500">資料載入中...</div>
        ) : likesError ? (
          <div className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] px-4 py-3 text-center text-[14px] text-black-500">{likesError}</div>
        ) : hasLikes ? (
          myLikes.map((r) => {
            const liked = likes[r.id] ?? true;
            return (
              <div key={r.id} className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden">
                {/* 上區塊：優良標籤（左）+ 心形（右）→ 標題 */}
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
                    <button type="button" onClick={() => onFavoriteToggle(r)} disabled={favoriteUpdatingId === r.id || likesLoading} aria-label={liked ? '取消收藏' : '加入收藏'} className={`shrink-0 ${favoriteUpdatingId === r.id || likesLoading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-70 cursor-pointer'}`}>
                      <img src={liked ? '/icons/liked.svg' : '/icons/like.svg'} alt="" width={20} height={20} />
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
                  <button type="button" aria-label="查看" onClick={() => onView(r)}
                    disabled={detailLoading && detailPlanId === r.id}
                    className={`w-[64px] h-[26px] rounded-[4px] px-[20px] py-[4px] bg-primary-900 text-white text-[12px] font-normal font-['Noto_Sans_TC'] leading-[150%] whitespace-nowrap shrink-0 inline-flex items-center justify-center ${detailLoading && detailPlanId === r.id ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}>
                    查看
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] px-4 py-3 text-center text-[14px] text-black-500">目前沒有收藏的教案唷，快去探索看看其他人的教案吧！</div>
        )}
      </div>

      <div className="mt-6 mb-12 flex w-full items-center justify-center">
        <button
          type="button"
          disabled={!hasLikes || likesLoading}
          onClick={() => hasLikes && !likesLoading && onViewAll()}
          className={viewAllBtnClass(!hasLikes || likesLoading)}
        >
          查看全部
        </button>
      </div>
    </>
  );
}
