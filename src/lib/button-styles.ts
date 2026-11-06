/**
 * v13 按鈕樣式（`.btn` / `.btn.primary` / `.btn.danger` / `.btn.small`）。
 * 用法：`className={BTN_PRIMARY}`；小尺寸再接 `BTN_SM`。
 */
const BTN_BASE =
  "inline-flex items-center justify-center gap-[7px] rounded-[10px] border px-[13px] py-[9px] font-['Noto_Sans_TC'] text-[14px] font-bold whitespace-nowrap transition-colors enabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50";

export const BTN = `${BTN_BASE} border-black-200 bg-white text-black-900 enabled:hover:border-black-300 enabled:hover:bg-black-100/40`;
export const BTN_PRIMARY = `${BTN_BASE} border-primary-900 bg-primary-900 text-white enabled:hover:opacity-90`;
export const BTN_DANGER = `${BTN_BASE} border-status-alert-bg bg-white text-status-alert enabled:hover:bg-status-alert-bg`;
/** 疊在上面任一款之後，縮成表格內的小按鈕。 */
export const BTN_SM = 'rounded-lg px-[9px] py-[6px] text-[12px]';
