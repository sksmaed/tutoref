/** 驗收模組共用的顯示格式；日期一律走這裡，避免每頁各寫一套。 */

const DATE_TIME = new Intl.DateTimeFormat('zh-TW', {
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
  hour12: false,
});

/** ISO 字串 → 2026/08/30 00:24；拿不到就回傳 fallback。 */
export function formatDateTime(value?: string | null, fallback = '未設定'): string {
  if (!value) return fallback;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return fallback;
  return DATE_TIME.format(date);
}

export interface DeadlineState {
  /** 「距離截止還有 3 天」／「已逾期 2 天」；沒設定截止日就是 null。 */
  label: string | null;
  overdue: boolean;
}

/**
 * 逾期只標記、不擋（§6.8）——這個函式只負責算文案，呼叫端不要拿它去 disable 按鈕。
 */
export function deadlineState(dueAt?: string | null, now: Date = new Date()): DeadlineState {
  if (!dueAt) return { label: null, overdue: false };
  const due = new Date(dueAt);
  if (Number.isNaN(due.getTime())) return { label: null, overdue: false };

  const dayMs = 24 * 60 * 60 * 1000;
  const diff = due.getTime() - now.getTime();
  const days = Math.floor(Math.abs(diff) / dayMs);

  if (diff < 0) {
    return { label: days > 0 ? `已逾期 ${days} 天` : '已逾期', overdue: true };
  }
  if (days > 0) return { label: `距離截止還有 ${days} 天`, overdue: false };
  const hours = Math.floor(diff / (60 * 60 * 1000));
  return { label: hours > 0 ? `距離截止剩不到 ${hours + 1} 小時` : '即將截止', overdue: false };
}

/** ISO 字串 → <input type="datetime-local"> 需要的本地時間字串。 */
export function toDateTimeLocal(value?: string | null): string {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

/** datetime-local 的值 → 後端要的 ISO 字串；空字串代表「清掉這個日期」。 */
export function fromDateTimeLocal(value: string): string | null {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}
