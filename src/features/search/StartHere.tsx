'use client';


export type StartHereItem = {
  id: string;
  label: string;
  count: number;
  icon: string;
  helperText?: string;
};

interface StartHereProps {
  items: StartHereItem[];
  loading?: boolean;
  error?: string;
  onSelect?: (id: string) => void;
}

function StartHereCard({ label, count, icon, onClick }: StartHereItem & { onClick?: () => void }) {
  const formattedCount = Number.isFinite(count) ? count.toLocaleString('zh-TW') : String(count);
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full h-[56px] flex items-center justify-between rounded-lg px-5 py-4 bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] hover:-translate-y-px active:translate-y-0 transition-transform hover:cursor-pointer"
      aria-label={`${label}，共 ${formattedCount} 筆`}
    >
      <span className="flex items-center gap-3 h-6">
        <img src={icon} alt="" aria-hidden width={20} height={20} className="w-5 h-5 shrink-0" />
        <span className="text-[16px] leading-[150%] font-normal font-['Noto_Sans_TC'] text-black-900 whitespace-nowrap">
          {label}
        </span>
      </span>
      <span className="text-[14px] leading-[150%] font-normal text-black-500">{formattedCount}</span>
    </button>
  );
}

function StartHereSkeleton() {
  return (
    <div className="h-[56px] rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] px-5 py-4 flex items-center justify-between animate-pulse">
      <span className="flex flex-col gap-1">
        <span className="flex items-center gap-3">
          <span className="h-5 w-5 rounded-full bg-black-100" />
          <span className="h-4 w-16 rounded bg-black-100" />
        </span>
        <span className="h-3 w-20 rounded bg-black-100" />
      </span>
      <span className="h-4 w-8 rounded bg-black-100" />
    </div>
  );
}

export default function StartHere({ items, loading = false, error, onSelect }: StartHereProps) {
  const hasData = items.length > 0;

  return (
    <section className="w-full max-w-[976px] mx-auto px-4 sm:px-6 lg:px-0" aria-label="或是從這裡下手">
      <div className="mt-10">
        <span className="inline-block h-6 text-[16px] leading-[150%] font-bold font-['Noto_Sans_TC'] text-black">
          或是從這裡下手...
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 lg:gap-[19px] mt-4 mb-10 min-h-[56px]">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => <StartHereSkeleton key={index} />)
          : hasData
            ? items.map((item) => <StartHereCard key={item.id} {...item} onClick={() => onSelect?.(item.id)} />)
            : (
                <div className="col-span-1 sm:col-span-3 flex h-[56px] items-center justify-center rounded-lg bg-white text-[14px] text-black-500 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
                  {error || '目前尚無推薦內容。'}
                </div>
              )}
      </div>
      {!loading && hasData && error && (
        <p className="mt-2 mb-10 text-center text-[12px] text-destructive">{error}</p>
      )}
    </section>
  );
}
