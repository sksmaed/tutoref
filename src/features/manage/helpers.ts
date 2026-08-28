import type { Row, MyTeachingPlanItem, FavoriteItem } from './types';
import { CSRF_HEADER_NAME, ensureCsrfToken, isUnsafeMethod } from '@/lib/csrf';

export const formatIssue = (academicYear?: string | null, semesterPeriod?: string | null) => {
  const year = academicYear ?? '';
  const period = semesterPeriod ?? '';
  return `${year}${period}`.trim();
};

type ErrorPayload = {
  errors?: { errors?: Array<{ extra_data?: { message?: string } }> };
  message?: string;
};

const extractErrorMessage = (payload: unknown, fallback: string) => {
  if (typeof payload === 'object' && payload !== null) {
    const candidate = payload as ErrorPayload;
    const nestedMessage = candidate.errors?.errors?.[0]?.extra_data?.message;
    if (nestedMessage) return nestedMessage;
    if (typeof candidate.message === 'string') return candidate.message;
  }
  return fallback;
};

export const mapPlanToRow = (plan: MyTeachingPlanItem): Row => ({
  id: plan.id,
  family: plan.team ?? '',
  issue: formatIssue(plan.academic_year, plan.semester_period),
  category: plan.category ?? '',
  title: plan.tp_name ?? '',
  author: plan.writer_name ?? '',
  grade: plan.grade ?? '',
  duration: typeof plan.duration === 'number' ? plan.duration : undefined,
  good: plan.is_excellent,
  hashtags: Array.isArray(plan.hashtags) ? plan.hashtags : [],
});

export const mapFavoriteToRow = (plan: FavoriteItem): Row => ({
  ...mapPlanToRow(plan),
  liked: true,
});

/** fetch 包裝：自動帶 cookie、改資料的請求自動帶 X-CSRFToken、檢查 content-type、統一錯誤訊息抽取。 */
export const requestJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const headers = new Headers(init?.headers);
  if (isUnsafeMethod(init?.method)) {
    const token = await ensureCsrfToken();
    if (token) headers.set(CSRF_HEADER_NAME, token);
  }

  const response = await fetch(url, { credentials: 'include', ...init, headers });
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const fallback = `HTTP ${response.status} ${response.statusText}`;
    const message = isJson
      ? extractErrorMessage(payload, fallback)
      : typeof payload === 'string' && payload.trim()
        ? payload
        : fallback;
    throw new Error(String(message));
  }

  if (!isJson) {
    throw new Error('Unexpected content-type received from server');
  }

  return payload as T;
};

export const debugLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[ManagePage]', ...args);
  }
};
