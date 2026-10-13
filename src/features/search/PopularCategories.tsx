'use client';


export type PopularCategoryItem = {
  key: string;
  label: string;
  count: number;
  color: string;
  icon: string;
};

interface PopularCategoriesProps {
  items: PopularCategoryItem[];
  loading?: boolean;
  error?: string;
  onSelect?: (item: PopularCategoryItem) => void;
}

function CategoryCard({ item, onSelect }: { item: PopularCategoryItem; onSelect?: (item: PopularCategoryItem) => void }) {
  const { label, count, color, icon } = item;
  return (
    <button
      type="button"
      className="w-full h-[56px] flex items-center justify-between rounded-[10px] px-4 py-4 bg-white border border-black-200 shadow-[0_3px_12px_rgba(0,0,0,0.045)] transition-transform hover:-translate-y-px active:translate-y-0 hover:cursor-pointer"
      aria-label={`${label} 類別，共 ${count} 筆`}
      onClick={() => onSelect?.(item)}
    >
      <span className="flex items-center gap-3 h-6">
        <img src={icon} alt="" aria-hidden width={20} height={20} className="w-5 h-5 shrink-0" />
        <span className="text-[16px] leading-[150%] font-normal font-['Noto_Sans_TC'] whitespace-nowrap" style={{ color }}>
          {label}
        </span>
      </span>
      <span className="text-[14px] leading-[150%] font-normal text-black-500">{count}</span>
    </button>
  );
}

function CategoryCardSkeleton() {
  return (
    <div className="w-full h-[56px] rounded-[10px] bg-white border border-black-200 shadow-[0_3px_12px_rgba(0,0,0,0.045)] px-4 py-4 flex items-center justify-between animate-pulse">
      <span className="flex items-center gap-3 h-6">
        <span className="h-5 w-5 rounded-full bg-black-100 shrink-0" />
        <span className="h-4 w-12 rounded bg-black-100" />
      </span>
      <span className="h-4 w-8 rounded bg-black-100" />
    </div>
  );
}

export default function PopularCategories({ items, loading = false, error, onSelect }: PopularCategoriesProps) {
  const hasData = items.length > 0;

  return (
    <section className="w-full" aria-label="靈感與熱門課程">
      <div className="mt-10">
        <h2 className="text-[17px] leading-[150%] font-bold font-['Noto_Sans_TC'] text-black-900">
          需要來點靈感嗎？
        </h2>
        <p className="mt-1 text-[13px] font-['Noto_Sans_TC'] text-black-500">熱門課程類別</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 lg:gap-[19px] mt-4 min-h-[124px]">
        {loading
          ? Array.from({ length: 10 }).map((_, index) => <CategoryCardSkeleton key={index} />)
          : hasData
            ? items.map((item) => <CategoryCard key={item.key} item={item} onSelect={onSelect} />)
            : (
                <div className="col-span-2 sm:col-span-3 lg:col-span-5 flex h-[56px] items-center justify-center rounded-[10px] bg-white text-[14px] text-black-500 border border-black-200 shadow-[0_3px_12px_rgba(0,0,0,0.045)]">
                  {error || '目前尚無熱門類別資料。'}
                </div>
              )}
      </div>
      {!loading && hasData && error && (
        <p className="mt-3 text-center text-[12px] text-destructive">{error}</p>
      )}
    </section>
  );
}
