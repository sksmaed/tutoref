'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import { requestReset } from "@/services/auth";

const isValidEmail = (s: string) =>
  /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim());

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [touched, setTouched] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (!isValidEmail(email) || sending) return;
    setSending(true);
    try {
      await requestReset(email);
      setSent(true);
    } catch {
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  const showError = (touched || submitted) && !isValidEmail(email);

  return (
    <div className="w-full min-h-[calc(100vh-120px)] bg-black-100 flex flex-col items-center pt-8 sm:pt-[60px] px-4 sm:px-0">
      <h1 className="text-[28px] sm:text-[40px] leading-normal font-bold text-black-900 mb-6 sm:mb-10">
        忘記密碼
      </h1>

      <div
        className="
          w-full sm:w-[576px] rounded-xl sm:rounded-[8px]
          bg-white
          shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]
          flex flex-col items-center
          px-6 sm:px-[100px] py-10 sm:py-[80px] gap-[40px]
        "
      >
        <form
          onSubmit={handleSubmit}
          className="w-full sm:w-[376px] flex flex-col items-center gap-[16px]"
        >
          <div className="w-full rounded-[8px] bg-primary-100 p-4 flex items-center gap-[10px]">
            <img src="/icons/lightbulb-alt.svg" alt="" width={20} height={20} className="shrink-0" />
            <span className="text-black-900 text-sm/normal">
              請輸入當時註冊之電子信箱，以收取驗證信！
            </span>
          </div>

          <div className="w-full">
            <Input
              type="email"
              placeholder="輸入電子信箱"
              value={email}
              onChange={(v) => setEmail(v)}
              onBlur={() => setTouched(true)}
              leftIcon="/icons/mail.svg"
              error={showError}
              errorMessage={showError ? '此為無效電子信箱' : undefined}
            />
          </div>

          {sent ? (
            <div className="w-full flex flex-col items-start gap-[12px]">
              <div
                className="
                  w-full h-[48px] rounded-[8px]
                  px-[48px] py-[12px]
                  bg-secondary-100
                  flex items-center justify-center
                "
              >
                <span className="text-[16px] leading-[24px] font-normal text-secondary-800 font-['Noto_Sans_TC']">
                  驗證信已寄出！
                </span>
              </div>
              <p className="w-full text-[14px] sm:text-[16px] leading-[24px] font-normal text-black-900 font-['Noto_Sans_TC']">
                ＊請至上方輸入之信箱收信，根據信中指示重設密碼
              </p>
            </div>
          ) : (
            <button
              type="submit"
              disabled={!isValidEmail(email) || sending}
              className={`
                w-full h-[48px] rounded-[8px] px-[48px] py-[12px]
                ${!isValidEmail(email) || sending
                  ? 'bg-black-200 text-white cursor-not-allowed'
                  : 'bg-primary-900 text-white hover:opacity-90'}
                transition-opacity font-semibold
              `}
            >
              {sending ? '寄送中…' : '寄出驗證信'}
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
