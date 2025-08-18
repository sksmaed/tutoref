// src/utils/auth.fake.ts

export type FailKind = 'wrong_password' | 'unregistered';

export async function fakeLogin(email: string, password: string): Promise<'ok' | FailKind> {
  // 模擬延遲
  await new Promise((r) => setTimeout(r, 600));

  const DEMO_EMAIL = 'demo@tutoref.app';
  const DEMO_PASS = 'Demo1234';

  // 只有 DEMO_EMAIL 被視為已註冊；其他一律「未註冊」
  const normalizedEmail = email.trim().toLowerCase();
  if (normalizedEmail !== DEMO_EMAIL) return 'unregistered';

  // email 正確 → 檢查密碼
  return password === DEMO_PASS ? 'ok' : 'wrong_password';
}

export type SignupResult = 'ok' | 'duplicated';

export async function fakeSignup(email: string): Promise<SignupResult> {
  await new Promise((r) => setTimeout(r, 600)); // 模擬延遲

  const DEMO_EMAIL = 'demo@tutoref.app';
  const normalized = email.trim().toLowerCase();

  // DEMO_EMAIL 視為已被註冊；其它合法 email 視為可註冊
  return normalized === DEMO_EMAIL ? 'duplicated' : 'ok';
}
