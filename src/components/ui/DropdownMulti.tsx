'use client';
import { useEffect, useRef, useState } from 'react';

export type Option = { value: string; label: string };

type Props = {
  label: string;
  options: Option[];
  /** 已提交（committed）的選項集合；只在收合時才會更新 */
  value: Set<string>;
  /** 收合時提交新值 */
  onChange: (next: Set<string>) => void;
  panelWidth?: number | string;
  panelHeight?: number;
  triggerWidth?: number | string;
  triggerHeight?: number;
};

export default function DropdownMulti({
  label,
  options,
  value,
  onChange,
  panelWidth = 152,
  panelHeight = 256,
  triggerWidth = 152,
  triggerHeight = 40,
}: Props) {
  const [open, setOpen] = useState(false);
  const [temp, setTemp] = useState<Set<string>>(new Set(value));
  const rootRef = useRef<HTMLDivElement>(null);

  // 打開時複製一份暫存；關閉時提交
  useEffect(() => {
    if (open) setTemp(new Set(value));
  }, [open, value]);

  // 點外面 → 關閉並提交
  useEffect(() => {
    const onDocClick = (e: MouseEvent) => {
      if (!rootRef.current) return;
      if (!rootRef.current.contains(e.target as Node)) {
        if (open) {
          setOpen(false);
          onChange(new Set(temp)); // ✅ 收合才提交
        }
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open, temp, onChange]);

  const toggleTemp = (v: string) => {
    const next = new Set(temp);
    if (v === '全選') {
      const others = options.filter(o => o.value !== '全選').map(o => o.value);
      const allSelected = others.every(x => next.has(x));
      if (allSelected) others.forEach(x => next.delete(x));
      else others.forEach(x => next.add(x));
    } else {
      next.has(v) ? next.delete(v) : next.add(v);
    }
    setTemp(next);
  };

  const committedCount = [...value].filter(v => v !== '全選').length;
  const closedLabel = committedCount ? `${label}（${committedCount}）` : label;
  const displayText = open ? label : closedLabel;

  const others = options.filter(o => o.value !== '全選').map(o => o.value);
  const allSelected = others.length > 0 && others.every(x => temp.has(x));

  return (
    <div ref={rootRef} className={`relative ${triggerWidth === '100%' ? 'block w-full' : 'inline-block'}`}>
      {/* 觸發器 */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="
          inline-flex items-center justify-between
          rounded-lg px-4 pr-3
          bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]
          text-[16px] font-normal font-['Noto_Sans_TC'] text-black-900
          flex-none
          cursor-pointer
        "
        style={{ width: triggerWidth, height: triggerHeight }}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-label={label}
      >
        <span className="truncate whitespace-nowrap">{displayText}</span>
        <img
          src={open ? '/icons/angle-up.svg' : '/icons/angle-down.svg'}
          alt=""
          width={20}
          height={20}
          className="w-5 h-5 shrink-0"
          aria-hidden
        />
      </button>

      {/* 面板 */}
      {open && (
        <div
          className="
            absolute left-0 z-50 mt-2
            bg-white rounded-lg
            shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]
            overflow-y-auto custom-scroll
          "
          style={{ width: panelWidth, height: panelHeight, padding: '8px 12px' }}
          role="listbox"
          aria-multiselectable="true"
        >
          {options.map(opt => {
            const isAll = opt.value === '全選';
            const checked = isAll ? allSelected : temp.has(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                onClick={() => toggleTemp(opt.value)}
                className={`
                  w-full h-[40px] flex items-center gap-2 px-2 py-2 rounded-md
                  ${checked ? 'bg-primary-100' : 'hover:bg-black-100/50'}
                  cursor-pointer
                `}
                role="option"
                aria-selected={checked}
                title={opt.label}
              >
                {/* ⬇️ 勾選圖示：未選用 uncheck.png；選取用 checked.png */}
                <img
                  src={checked ? '/icons/checked.svg' : '/icons/uncheck.svg'}
                  alt=""
                  width={20} height={20}
                  className="w-5 h-5 shrink-0 flex items-center justify-center"
                />
                <span
                  className="
                    text-[16px] leading-[150%] font-normal font-['Noto_Sans_TC'] text-black-900"
                >
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
