'use client';

type Props = {
  query: string;
  onQueryChange: (v: string) => void;
  canSearch: boolean;
  onSearch: () => void;
  onFilterClick?: () => void;
  hasFilters?: boolean;
};

export default function SearchBar({ query, onQueryChange, canSearch, onSearch, onFilterClick, hasFilters = false }: Props) {
  return (
    <div className="flex justify-center items-center mx-auto mt-4 w-full px-4 sm:px-6 lg:px-0" aria-label="搜尋篩選列">
      <div
        className="w-full max-w-[976px] h-[54px] lg:h-[62px] mt-6 lg:mt-20
          flex items-center
          rounded-lg px-4 lg:px-6 pr-4 lg:pr-5 py-3 lg:py-4 bg-white
          shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]"
        role="search"
        aria-label="教案檢索"
      >
        {/* 搜尋 icon（手機版固定顯示） */}
        <img src="/icons/search.svg" alt="" aria-hidden width={20} height={20} className="w-5 h-5 mr-3 shrink-0 sm:hidden" />
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && canSearch) {
              event.preventDefault();
              onSearch();
            }
          }}
          type="text"
          placeholder="輸入教案關鍵字 / 撰寫者姓名"
          className="flex-1 mr-3 text-[16px] lg:text-[20px] leading-[150%] font-['Noto_Sans_TC'] text-gray-500 focus:outline-none"
        />
        {/* 桌面版：放大鏡搜尋按鈕 */}
        <button
          type="button"
          onClick={() => canSearch && onSearch()}
          className={`hidden xl:inline-flex w-6 h-6 items-center justify-center shrink-0
            ${canSearch ? 'cursor-pointer opacity-100' : 'cursor-default opacity-30 pointer-events-none'}`}
          aria-label="搜尋"
        >
          <img src="/icons/search.svg" alt="" aria-hidden width={24} height={24} className="w-6 h-6" />
        </button>
        {/* 手機版：漏斗篩選按鈕 */}
        <button
          type="button"
          onClick={onFilterClick}
          className="xl:hidden w-6 h-6 inline-flex items-center justify-center shrink-0 cursor-pointer"
          aria-label="篩選條件"
        >
          <img
            src="/icons/filter.svg"
            alt="篩選"
            width={20}
            height={20}
            style={{ filter: 'brightness(0) saturate(100%) invert(55%) sepia(87%) saturate(624%) hue-rotate(346deg) brightness(96%) contrast(95%)' }}
          />
        </button>
      </div>
    </div>
  );
}
