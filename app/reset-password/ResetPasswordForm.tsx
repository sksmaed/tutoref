'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Image from 'next/image';
import { Input } from '@/components/ui/Input';
import { validateResetToken, resetPassword } from '@/services/auth';
import { setFlash } from '@/utils/flash';

const isValidPassword = (s: string) => {
  const str = String(s ?? '');
  if (str.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(str);
  const hasNumber = /\d/.test(str);
  return hasLetter && hasNumber;
};

type Props = {
  uidb64?: string;
  token?: string;
};

export default function ResetPasswordForm({ uidb64: uidFromProps, token: tokenFromProps }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const uidb64 = uidFromProps ?? searchParams?.get('uidb64') ?? '';
  const token = tokenFromProps ?? searchParams?.get('token') ?? '';

  const [status, setStatus] = useState<'pending' | 'valid' | 'invalid'>('pending');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touchedPwd, setTouchedPwd] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  useEffect(() => {
    if (!uidb64 || !token) {
      setStatus('invalid');
      setErrorMessage('重設連結無效或已失效，請重新申請重設密碼。');
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const result = await validateResetToken(uidb64, token);
        if (cancelled) return;
        if (result?.valid && result?.email) {
          setEmail(result.email);
          setStatus('valid');
          setErrorMessage('');
        } else {
          setStatus('invalid');
          setErrorMessage(result?.message || '重設連結無效或已失效，請重新申請重設密碼。');
        }
      } catch (error: any) {
        if (!cancelled) {
          setStatus('invalid');
          setErrorMessage(error?.message || '重設連結無效或已失效，請重新申請重設密碼。');
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [uidb64, token]);

  const pwdOK = isValidPassword(password);
  const confirmOK = pwdOK && confirm === password;
  const canSubmit = status === 'valid' && pwdOK && confirmOK && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !uidb64 || !token) return;
    setSubmitting(true);
    setErrorMessage('');
    try {
      const response = await resetPassword({
        uidb64,
        token,
        password1: password,
        password2: confirm,
      });
      if (response?.success !== false) {
        setFlash({
          type: 'success',
          title: '密碼已重設',
          message: '請使用新密碼再次登入系統。',
          timeout: 5000,
        });
        router.replace('/login');
        return;
      }
      setErrorMessage(response?.message || '重設密碼時發生問題，請稍後再試。');
    } catch (error: any) {
      setErrorMessage(error?.message || '重設密碼時發生問題，請稍後再試。');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center pt-[60px]">
      <h1 className="text-[40px] leading-normal font-bold text-black-900 mb-10">重設密碼</h1>

      <div
        className="
          w-[576px] min-h-[360px] rounded-[8px] bg-white
          shadow-[2px_2px_10px_0px_#0000001A]
          flex flex-col items-center
          pt-[80px] pr-[100px] pb-[80px] pl-[100px] gap-[32px]
        "
      >
        {status === 'pending' ? (
          <div className="flex flex-col items-center gap-4">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-primary-900 border-t-transparent" />
            <p className="text-black-700 text-base">驗證重設連結中，請稍候…</p>
          </div>
        ) : status === 'invalid' ? (
          <div className="flex flex-col items-center gap-4 text-center">
            <Image src="/icons/info.png" alt="" width={32} height={32} />
            <p className="text-black-900 text-base" style={{ fontFamily: '"Noto Sans TC", sans-serif' }}>
              {errorMessage || '重設連結無效或已失效，請重新申請重設密碼。'}
            </p>
            <a
              href="/forgot-password"
              className="text-primary-900 underline text-sm"
            >
              前往重新申請重設密碼
            </a>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="w-[378px] flex flex-col gap-[16px]">
            <Input
              type="email"
              placeholder="電子信箱"
              value={email}
              onChange={(_value) => {}}
              leftIcon="/icons/mail.png"
              disabled
            />

            <Input
              type="password"
              placeholder="輸入新密碼"
              value={password}
              onChange={(v) => setPassword(v)}
              onBlur={() => setTouchedPwd(true)}
              leftIcon="/icons/key.png"
              showPasswordToggle
              error={touchedPwd && !pwdOK}
              errorMessage={touchedPwd && !pwdOK ? '不符合下方的密碼設定規則' : undefined}
            />

            <div className="w-[378px] h-[52px] rounded-[8px] bg-primary-100 p-4 flex items-center gap-[10px]">
              <Image src="/icons/lightbulb-alt.png" alt="" width={20} height={20} />
              <span className="text-black-900 text-sm/normal">
                密碼需至少為 8 個字元，且包含英文及數字字母！
              </span>
            </div>

            <Input
              type="password"
              placeholder="再次輸入密碼"
              value={confirm}
              onChange={(v) => setConfirm(v)}
              onBlur={() => setTouchedConfirm(true)}
              leftIcon="/icons/key.png"
              showPasswordToggle
              disabled={!pwdOK}
              error={touchedConfirm && pwdOK && confirm !== password}
              errorMessage={touchedConfirm && pwdOK && confirm !== password ? '再次輸入之密碼不相符' : undefined}
            />

            {errorMessage && (
              <p className="text-destructive text-sm" style={{ fontFamily: '"Noto Sans TC", sans-serif' }}>
                {errorMessage}
              </p>
            )}

            <button
              type="submit"
              disabled={!canSubmit}
              className={`
                w-[378px] h-[48px] rounded-[8px] px-[48px] py-[12px]
                ${canSubmit ? 'bg-primary-900 text-white hover:opacity-90' : 'bg-black-200 text-white cursor-not-allowed'}
                font-semibold transition-opacity
              `}
            >
              {submitting ? '送出中…' : '重設密碼'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
