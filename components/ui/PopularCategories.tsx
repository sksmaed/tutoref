'use client';

import Image from 'next/image';

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
      className="w-[180px] h-[56px] flex items-center justify-between rounded-lg px-5 py-4 bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] transition-transform hover:-translate-y-px active:translate-y-0 hover:cursor-pointer"
      aria-label={`${label} 類別，共 ${count} 筆`}
      onClick={() => onSelect?.(item)}
    >
      <span className="flex items-center gap-3 w-[64px] h-6">
        <Image src={icon} alt="" aria-hidden width={20} height={20} className="w-5 h-5" />
        <span className="text-[16px] leading-[150%] font-normal font-['Noto_Sans_TC']" style={{ color }}>
          {label}
        </span>
      </span>
      <span className="text-[14px] leading-[150%] font-normal text-black-500">{count}</span>
    </button>
  );
}

function CategoryCardSkeleton() {
  return (
    <div className="w-[180px] h-[56px] rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] px-5 py-4 flex items-center justify-between animate-pulse">
      <span className="flex items-center gap-3 w-[64px] h-6">
        <span className="h-5 w-5 rounded-full bg-black-100" />
        <span className="h-4 w-12 rounded bg-black-100" />
      </span>
      <span className="h-4 w-8 rounded bg-black-100" />
    </div>
  );
}

export default function PopularCategories({ items, loading = false, error, onSelect }: PopularCategoriesProps) {
  const hasData = items.length > 0;

  return (
    <section className="w-[976px] mx-auto" aria-label="靈感與熱門課程">
      <h2 className="w-[200px] h-[38px] mx-auto text-center text-[25px] leading-[150%] font-bold font-['Noto_Sans_TC'] text-black mt-16">
        需要來點靈感嗎？
      </h2>

      <div className="mt-10">
        <span className="inline-block w-[96px] h-6 text-[16px] leading-[150%] font-bold font-['Noto_Sans_TC'] text-black">
          熱門課程類別
        </span>
      </div>

      <div className="grid grid-cols-5 gap-[19px] w-[976px] mt-4 min-h-[124px]">
        {loading
          ? Array.from({ length: 10 }).map((_, index) => <CategoryCardSkeleton key={index} />)
          : hasData
            ? items.map((item) => <CategoryCard key={item.key} item={item} onSelect={onSelect} />)
            : (
                <div className="col-span-5 flex h-[56px] items-center justify-center rounded-lg bg-white text-[14px] text-black-500 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
                  {error || '目前尚無熱門類別資料。'}
                </div>
              )}
      </div>
      {!loading && hasData && error && (
        <p className="mt-6 text-center text-[16px] text-destructive">{error}</p>
      )}
    </section>
  );
}
