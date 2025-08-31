'use client';
import { ChevronDown } from 'lucide-react';

type Props = {
  label: string;          // 外顯文字（類別/家別/期數/年級/時長）
  value?: string;         // 當前選擇
  width?: number;         // 預設 152；時長用 204
  onClick?: () => void;   // 之後接真實下拉即可
};

export default function DropdownLarge({ label, value, width = 152, onClick }: Props) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`
        h-[40px] inline-flex items-center justify-between
        rounded-lg px-4 pr-3
        bg-white
        shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]
        text-[16px] font-normal font-['Noto_Sans_TC']
      `}
      style={{ width }}
      aria-haspopup="listbox"
      aria-label={label}
    >
      <span className="truncate">{value ?? label}</span>
      <ChevronDown className="w-5 h-5 text-black" aria-hidden />
    </button>
  );
}
