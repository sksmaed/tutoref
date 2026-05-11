'use client';

import { useEffect, useMemo, useRef, useState } from 'react';

export const ISSUE_SORT_OPTIONS = [
  { value: 'issue_desc', label: '期數由新到舊' },
  { value: 'issue_asc', label: '期數由舊到新' },
  { value: 'views_desc', label: '瀏覽數由高到低' },
  { value: 'relevance_desc', label: '符合度由高到低' },
  { value: 'uploaded_desc', label: '上傳時間由新到舊' },
] as const;

type IssueSortOption = typeof ISSUE_SORT_OPTIONS[number];

type IssueSortDropdownProps = {
  value: IssueSortOption['value'];
  onChange: (value: IssueSortOption['value']) => void;
};

export default function IssueSortDropdown({ value, onChange }: IssueSortDropdownProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const active = useMemo(
    () => ISSUE_SORT_OPTIONS.find((option) => option.value === value) ?? ISSUE_SORT_OPTIONS[0],
    [value],
  );

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (!containerRef.current) return;
      if (event.target instanceof Node && containerRef.current.contains(event.target)) return;
      setOpen(false);
    };

    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [open]);

  const handleSelect = (nextValue: IssueSortOption['value']) => {
    onChange(nextValue);
    setOpen(false);
  };

  return (
    <div ref={containerRef} className="relative" style={{ width: 140 }}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="h-[36px] w-full rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] cursor-pointer hover:bg-black-100/60"
      >
        <div className="flex h-full items-center justify-between gap-2 px-3 pt-[7px] pb-2 font-['Noto_Sans_TC'] text-[14px] leading-[150%] text-black-900">
          <span className="truncate">{active.label}</span>
          <img src="/icons/angle-down.svg" alt="" width={20} height={20} />
        </div>
      </button>

      {open && (
        <div className="absolute left-0 top-[calc(100%+6px)] z-10 w-full rounded-lg bg-white py-1 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          {ISSUE_SORT_OPTIONS.map((option) => {
            const selected = option.value === value;
            return (
              <button
                type="button"
                key={option.value}
                onClick={() => handleSelect(option.value)}
                className={`w-full px-3 pt-[7px] pb-2 text-left font-['Noto_Sans_TC'] text-[14px] leading-[150%] text-black-900 hover:text-primary-900 cursor-pointer ${
                  selected ? 'font-medium' : ''
                }`}
                aria-selected={selected}
              >
                {option.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
