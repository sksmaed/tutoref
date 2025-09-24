'use client';

import Image from 'next/image';

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
}

function StartHereCard({ label, count, icon, helperText }: StartHereItem) {
  return (
    <button
      type="button"
      className="h-[56px] flex items-center justify-between rounded-lg px-5 py-4 bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] hover:-translate-y-px active:translate-y-0 transition-transform hover:cursor-pointer"
      aria-label={`${label}，共 ${count} 筆`}
    >
      <span className="flex flex-col justify-center">
        <span className="flex items-center gap-3 w-[112px] h-6">
          <Image src={icon} alt="" aria-hidden width={20} height={20} className="w-5 h-5" />
          <span className="text-[16px] leading-[150%] font-normal font-['Noto_Sans_TC'] text-black-900">
            {label}
          </span>
        </span>
        {helperText ? (
          <span className="mt-1 text-[12px] leading-[150%] text-black-500">{helperText}</span>
        ) : null}
      </span>
      <span className="text-[14px] leading-[150%] font-normal text-black-500">{count}</span>
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

export default function StartHere({ items, loading = false, error }: StartHereProps) {
  const hasData = items.length > 0;

  return (
    <section className="w-[976px] mx-auto" aria-label="或是從這裡下手">
      <div className="mt-10">
        <span className="inline-block w-[128px] h-6 text-[16px] leading-[150%] font-bold font-['Noto_Sans_TC'] text-black">
          或是從這裡下手...
        </span>
      </div>

      <div className="grid grid-cols-3 gap-[19px] w-[976px] mt-4 mb-6 min-h-[56px]">
        {loading
          ? Array.from({ length: 3 }).map((_, index) => <StartHereSkeleton key={index} />)
          : hasData
            ? items.map((item) => <StartHereCard key={item.id} {...item} />)
            : (
                <div className="col-span-3 flex h-[56px] items-center justify-center rounded-lg bg-white text-[14px] text-black-500 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
                  {error || '目前尚無推薦內容。'}
                </div>
              )}
      </div>
      {!loading && hasData && error && (
        <p className="mb-10 text-center text-[16px] text-destructive">{error}</p>
      )}
    </section>
  );
}
