import axios from "axios";
import { VersionResponse } from "@/types/api";
import { CSRF_HEADER_NAME, ensureCsrfToken, isUnsafeMethod } from "@/lib/csrf";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v2",
  withCredentials: true, // 關鍵：送/收 Session Cookie
});

// 跨網域（frontend/backend 不同 host）下 axios 不會自動帶 XSRF header，
// 手動幫每個會改資料的請求加上 X-CSRFToken。
api.interceptors.request.use(async config => {
  if (isUnsafeMethod(config.method)) {
    const token = await ensureCsrfToken();
    if (token) {
      config.headers.set(CSRF_HEADER_NAME, token);
    }
  }
  return config;
});

// 統一錯誤攔截（友善訊息給 UI）
api.interceptors.response.use(
  r => r,
  err => {
    const data = err?.response?.data;

    const normalizeErrors = (value: unknown): unknown[] => {
      if (!value) return [];
      if (Array.isArray(value)) return value;
      if (typeof value === "object") {
        const valueObj = value as { errors?: unknown } & Record<string, unknown>;
        if (Array.isArray(valueObj.errors)) {
          return valueObj.errors;
        }
        return Object.values(valueObj).flatMap(entry =>
          Array.isArray(entry)
            ? entry
            : typeof entry === "object" && entry !== null
              ? [entry]
              : entry != null
                ? [entry]
                : []
        );
      }
      return [value];
    };

    const errorsArray = normalizeErrors(data?.errors);
    const firstEntry = errorsArray[0];

    type ApiErrorEntry = {
      error_code?: string;
      message?: string;
      extra_data?: { message?: string } & Record<string, unknown>;
    };

    const isApiErrorEntry = (entry: unknown): entry is ApiErrorEntry =>
      typeof entry === "object" && entry !== null;

    const errorObject = isApiErrorEntry(firstEntry) ? firstEntry : undefined;
    const errorString = typeof firstEntry === "string" ? firstEntry : undefined;
    const msg =
      errorString ||
      (typeof errorObject?.extra_data?.message === "string" ? errorObject.extra_data.message : undefined) ||
      errorObject?.message ||
      data?.detail ||
      data?.message ||
      err.message ||
      "Request failed";
    type AugmentedError = Error & { code?: string; errors?: unknown[]; status?: number };
    const augmentedError = new Error(msg) as AugmentedError;
    augmentedError.code = errorObject?.error_code || "UNKNOWN";
    augmentedError.errors = errorsArray;
    augmentedError.status = err?.response?.status;
    return Promise.reject(augmentedError);
  }
);

// 版本 API
export const getVersion = async (): Promise<VersionResponse> => {
  const response = await api.get<VersionResponse>("/version");
  return response.data;
};
