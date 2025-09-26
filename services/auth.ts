// src/services/auth.ts
import { api } from "@/lib/api";

// ---- Types (依你後端的 Pydantic Schema / SessionInfoResponse 調整) ----
export type UUID = string;

export interface UserResp {
  id: UUID;
  email: string;
  first_name?: string;
  last_name?: string;
}

export interface SessionInfoResponse {
  authenticated: boolean;
  user: UserResp | null;
  providers: any[] | null; // 可細化為你的 socialaccount 結構
}

export interface LoginResponse {
  success: boolean;
  message: string;
  user: UserResp;
}

export interface RegisterResponse {
  success: boolean;
  message: string;
  user: UserResp;
  email_verification_required: boolean;
}

export interface ForgotPasswordResponse {
  success: boolean;
  message: string;
}

export interface ValidateResetTokenResponse {
  success: boolean;
  message: string;
  valid: boolean;
  email?: string | null;
}

export interface ResetPasswordResponse {
  success: boolean;
  message: string;
}

export interface GoogleLoginResponse {
  success: boolean;
  redirect_url?: string | null;
  message: string;
  session_info?: Record<string, any> | null;
}

// ---- Session & Auth ----
export async function fetchSession(): Promise<SessionInfoResponse> {
  const { data } = await api.get<SessionInfoResponse>("/auth/session/");
  return data;
}

export async function login(email: string, password: string): Promise<UserResp> {
  // 依你後端的 login 回傳 LoginResponse；也可以只靠 /auth/session/
  await api.post<LoginResponse>("/auth/login/", { email, password });
  const { data } = await api.get<SessionInfoResponse>("/auth/session/");
  console.log('login response:', data);
  if (!data.authenticated || !data.user) throw new Error("Login failed");
  return data.user;
}

export async function register(payload: { email: string; password1: string; password2: string }): Promise<RegisterResponse> {
  const { data } = await api.post<RegisterResponse>("/auth/register/", payload);
  return data;
}

export async function logout(): Promise<void> {
  // 你後端目前沒有 /auth/logout/；如果補上就能呼叫這一支
  await api.post("/auth/logout/");
}

// ---- Password Reset ----
export async function requestReset(email: string): Promise<ForgotPasswordResponse> {
  const { data } = await api.post<ForgotPasswordResponse>("/auth/forgot-password/", { email });
  return data;
}

export async function validateResetToken(uidb64: string, token: string): Promise<ValidateResetTokenResponse> {
  const { data } = await api.post<ValidateResetTokenResponse>("/auth/validate-reset-token/", { uidb64, token });
  return data;
}

export async function resetPassword(params: { uidb64: string; token: string; password1: string; password2: string }): Promise<ResetPasswordResponse> {
  const { data } = await api.post<ResetPasswordResponse>("/auth/reset-password/", params);
  return data;
}

// ---- Providers ----
export async function fetchProviders(): Promise<string[]> {
  const { data } = await api.get<any>("/auth/providers/");
  // 兩種可能格式的 normalize：
  // 1) allauth headless: { providers: [...] } 或其它
  if (Array.isArray(data?.providers)) {
    return data.providers.map((p: any) => (typeof p === "string" ? p : p?.id || p?.provider || "unknown"));
  }
  // 2) fallback: { available_providers: ["google"], configured: true }
  if (Array.isArray(data?.available_providers)) {
    return data.available_providers;
  }
  return [];
}

// ---- Google OAuth ----
export async function initiateGoogleLogin(opts?: { provider?: "google"; process?: "login" | "signup" | "connect"; callback_url?: string }) {
  const payload = {
    provider: "google",
    process: "login",
    ...(opts || {}),
  };
  if (typeof window !== 'undefined') {
    try {
      sessionStorage.setItem(
        'oauthPostLoginFlash',
        JSON.stringify({
          type: 'success',
          title: '登入成功！',
          message: '可以開始檢索教案囉～',
          timeout: 5000,
        }),
      );
    } catch {
      sessionStorage.removeItem('oauthPostLoginFlash');
    }
  }

  const { data } = await api.post<GoogleLoginResponse>("/auth/google/initiate/", payload);
  if (data?.success && data?.redirect_url) {
    window.location.href = data.redirect_url; // 直接跳轉到 allauth 的 Google 登入頁
  } else {
    throw new Error(data?.message || "Failed to initiate Google login");
  }
}
