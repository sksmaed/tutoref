import axios from "axios";
import { VersionResponse } from "@/types/api";

export const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000/api/v2",
  withCredentials: true, // 關鍵：送/收 Session Cookie
});

// 統一錯誤攔截（友善訊息給 UI）
api.interceptors.response.use(
  r => r,
  err => {
    const data = err?.response?.data;
    const errors = data?.errors || [];
    const firstError = errors[0];
    const msg =
      firstError?.extra_data?.message ||
      data?.detail ||
      data?.message ||
      err.message ||
      "Request failed";
    const error = new Error(msg) as any;
    error.code = firstError?.error_code || "UNKNOWN";
    error.errors = errors;
    error.status = err?.response?.status;
    return Promise.reject(error);
  }
);

// 版本 API
export const getVersion = async (): Promise<VersionResponse> => {
  const response = await api.get<VersionResponse>("/version");
  return response.data;
};

