// utils/flash.ts
export type Flash = {
  type: 'success' | 'error' | 'info';
  title: string;
  message?: string;
  timeout?: number; // ms
};
const KEY = '__flash__';

export function setFlash(flash: Flash) {
  if (typeof window === 'undefined') return;
  sessionStorage.setItem(KEY, JSON.stringify(flash));
}

export function popFlash(): Flash | null {
  if (typeof window === 'undefined') return null;
  const raw = sessionStorage.getItem(KEY);
  if (!raw) return null;
  sessionStorage.removeItem(KEY);
  try { return JSON.parse(raw) as Flash; } catch { return null; }
}
