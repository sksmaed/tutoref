const CSRF_COOKIE_NAME = 'csrftoken';
const CSRF_HEADER_NAME = 'X-CSRFToken';
const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:8000/api/v2';

const SAFE_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

function readCsrfCookie(): string | null {
  if (typeof document === 'undefined') return null;
  const match = document.cookie.match(/(?:^|; )csrftoken=([^;]*)/);
  return match ? decodeURIComponent(match[1]) : null;
}

let bootstrapPromise: Promise<void> | null = null;

/**
 * backend 的 csrftoken cookie 只有 GET /auth/csrf/（@ensure_csrf_cookie）會種下來，
 * 一般 API 呼叫不會附帶 Set-Cookie。第一次沒有 cookie 時要先打這支才拿得到 token。
 */
function bootstrapCsrfCookie(): Promise<void> {
  if (!bootstrapPromise) {
    bootstrapPromise = fetch(`${API_BASE}/auth/csrf/`, { credentials: 'include' })
      .catch(() => undefined)
      .then(() => undefined);
  }
  return bootstrapPromise;
}

/** 回傳可用的 CSRF token；cookie 還沒種下來的話會先打 bootstrap endpoint。 */
export async function ensureCsrfToken(): Promise<string | null> {
  const existing = readCsrfCookie();
  if (existing) return existing;
  await bootstrapCsrfCookie();
  return readCsrfCookie();
}

export function isUnsafeMethod(method?: string): boolean {
  return !SAFE_METHODS.has((method ?? 'GET').toUpperCase());
}

export { CSRF_HEADER_NAME };
