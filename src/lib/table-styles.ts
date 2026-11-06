/**
 * 表格共用 class（v13 `.table-wrap` / `th` / `td`）。
 * Tailwind 要看得到完整字串，所以集中寫成常數而不是動態拼接。
 */
export const TABLE_WRAP =
  'overflow-x-auto rounded-[10px] border border-black-200 bg-white shadow-[0_3px_12px_rgba(0,0,0,0.045)]';
export const TABLE = "w-full border-collapse font-['Noto_Sans_TC'] text-[14px]";
export const TH =
  'whitespace-nowrap border-b border-black-100 bg-primary-100 px-[14px] py-[13px] text-left text-[13px] font-bold text-black-900';
export const TD = 'border-b border-black-100 px-[14px] py-[13px] align-middle text-black-900';
export const TR = 'transition-colors hover:bg-primary-100/40 last:[&>td]:border-b-0';
export const TH_CHECKBOX = `${TH} w-[42px] text-center`;
export const TD_CHECKBOX = `${TD} w-[42px] text-center`;
