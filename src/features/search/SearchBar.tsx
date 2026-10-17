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
    <div className="w-full" aria-label="搜尋列">
      <div
        className="w-full h-[52px] flex items-center
          rounded-xl border border-black-200 bg-white px-4 pr-4 lg:pr-5
          shadow-[0_4px_16px_rgba(0,0,0,0.05)] focus-within:border-primary-700"
        role="search"
        aria-label="教案檢索"
      >
        <img src="/icons/search.svg" alt="" aria-hidden width={20} height={20} className="w-5 h-5 mr-3 shrink-0 opacity-60" />
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
          className="flex-1 min-w-0 mr-3 text-[15px] leading-[150%] font-['Noto_Sans_TC'] text-black-900 placeholder:text-black-400 focus:outline-none"
        />
        {/* 桌面版：搜尋按鈕 */}
        <button
          type="button"
          onClick={() => canSearch && onSearch()}
          disabled={!canSearch}
          className="hidden lg:inline-flex h-[34px] items-center justify-center shrink-0 rounded-lg bg-primary-900 px-4
            text-[14px] font-bold font-['Noto_Sans_TC'] text-white
            enabled:cursor-pointer enabled:hover:opacity-90 disabled:opacity-40"
          aria-label="搜尋"
        >
          搜尋
        </button>
        {/* 手機版：漏斗篩選按鈕 */}
        <button
          type="button"
          onClick={onFilterClick}
          className="lg:hidden w-6 h-6 inline-flex items-center justify-center shrink-0 cursor-pointer"
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
