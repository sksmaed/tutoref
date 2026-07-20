'use client';

/** 區塊標題（我的教案／我的收藏），含總筆數。 */
export function SectionHeader({
  title,
  total,
  className = '',
}: {
  title: string;
  total: number;
  className?: string;
}) {
  return (
    <div className={`mt-10 ${className}`}>
      <h3 className="inline-block w-auto text-[25px] font-bold font-['Noto_Sans_TC'] text-black-900 leading-[150%] tracking-normal">
        {title}
        <span className="ml-2 text-[16px] font-normal leading-[150%]">
          （共 {total} 筆）
        </span>
      </h3>
    </div>
  );
}

/** 「查看全部」按鈕樣式（依 disabled 狀態切換）。 */
export const viewAllBtnClass = (disabled: boolean) =>
  [
    'w-[160px] h-[48px] rounded-[8px] px-[20px] py-[12px] whitespace-nowrap text-[16px] leading-[150%] font-["Noto_Sans_TC"] shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]',
    disabled
        ? 'bg-white border border-black-300 text-black-300 cursor-not-allowed'
        : 'bg-white border border-primary-900 text-primary-900 cursor-pointer hover:bg-primary-50',
  ].join(' ');
