/** sessionStorage 的 JSON 讀寫（SSR 安全；解析失敗時自動清除壞資料）。 */
export const readSessionJson = <T>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
};

export const writeSessionJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(key, JSON.stringify(value));
};
