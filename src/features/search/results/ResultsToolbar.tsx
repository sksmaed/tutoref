'use client';
import IssueSortDropdown from '@/features/teaching-plan/IssueSortDropdown';
import { goodTint, type IssueSortValue } from './types';

interface ResultsToolbarProps {
  searching: boolean;
  total: number;
  onlyGood: boolean;
  onOnlyGoodToggle: () => void;
  sort: IssueSortValue;
  onSortChange: (value: IssueSortValue) => void;
}

/** 檢索結果工具列：筆數 + 優良教案篩選 + 排序（含手機與桌機兩種版型）。 */
export default function ResultsToolbar({
  searching,
  total,
  onlyGood,
  onOnlyGoodToggle,
  sort,
  onSortChange,
}: ResultsToolbarProps) {
  return (
    <>
      {/* 手機版：單行（count + icon-only 篩選 + 排序） */}
      <div className="flex items-center justify-between md:hidden">
        <span className="text-[14px] font-normal font-['Noto_Sans_TC'] text-black-900">
          {searching ? '搜尋中…' : `檢索結果：${total} 筆`}
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={onlyGood}
            onClick={onOnlyGoodToggle}
            className={[
              'h-[32px] w-[32px] inline-flex items-center justify-center',
              'rounded-[8px] bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]',
              'border hover:cursor-pointer',
              onlyGood ? 'border-secondary-700' : 'border-transparent',
            ].join(' ')}
            title="只看優良教案"
          >
            <img
              src="/icons/good.svg"
              alt="優良教案"
              width={20}
              height={20}
              style={onlyGood ? goodTint : undefined}
            />
          </button>
          <IssueSortDropdown value={sort} onChange={onSortChange} />
        </div>
      </div>

      {/* 桌機版：原有兩行布局 */}
      <div className="hidden md:flex flex-wrap items-end gap-x-3 gap-y-2">
        <div className="flex items-end gap-3 w-full sm:w-auto">
          <h2 className="whitespace-nowrap h-[38px] text-[25px] leading-[150%] font-bold font-['Noto_Sans_TC'] text-black-900">
            檢索結果
          </h2>
          <span className="h-6 text-[16px] leading-[150%] font-normal font-['Noto_Sans_TC'] text-black-900 sm:w-[120px]">
            {searching ? '搜尋中…' : `（共 ${total} 筆）`}
          </span>
        </div>
        <div className="flex items-center gap-3 sm:ml-auto">
          <button
            type="button"
            aria-pressed={onlyGood}
            onClick={onOnlyGoodToggle}
            className={[
              'h-[32px] w-auto inline-flex items-center justify-center gap-[3px] whitespace-nowrap px-[12px]',
              'rounded-[8px] py-[5px] bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]',
              'border hover:cursor-pointer',
              onlyGood ? 'border-secondary-700 text-secondary-700' : 'border-transparent text-black-900',
            ].join(' ')}
            title="只看優良教案"
          >
            <img src="/icons/good.svg" alt="" width={16} height={16}
              style={onlyGood ? goodTint : undefined}
            />
            <span className="text-[14px] leading-[150%] font-normal font-['Noto_Sans_TC']">優良教案</span>
          </button>
          <IssueSortDropdown value={sort} onChange={onSortChange} />
        </div>
      </div>
    </>
  );
}
