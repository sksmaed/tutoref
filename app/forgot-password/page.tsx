'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/Input';
import Image from 'next/image';

// 假寄信 API（前端只要顯示已寄出）
async function fakeSendResetEmail(email: string): Promise<'ok'> {
  await new Promise(r => setTimeout(r, 700));
  return 'ok';
}

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
    await fakeSendResetEmail(email);
    setSent(true);
    setSending(false);
  };

  const showError = (touched || submitted) && !isValidEmail(email);

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center pt-[60px]">
      <h1 className="text-[40px] leading-normal font-bold text-black-900 mb-10">
        忘記密碼
      </h1>

      {/* 外框：576x340、圓角8、padding: 80/100/80/100、gap 40、陰影 */}
      <div
        className="
          w-[576px] h-[384px] rounded-[8px]
          bg-white
          shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]
          flex flex-col items-center
          pt-[80px] pr-[100px] pb-[80px] pl-[100px] gap-[40px]
        "
      >
        {/* 內部排版：378x180、gap 32 */}
        <form
          onSubmit={handleSubmit}
          className="w-[376px] h-[180px] flex flex-col items-center gap-[16px]"
        >
          {/* 提示 Warning：378x52、圓角8、p16、Primary/100 */}
          <div className="w-[376px] h-[52px] rounded-[8px] bg-primary-100 p-4 flex items-center gap-[10px]">
            <Image src="/icons/lightbulb-alt.png" alt="" width={20} height={20} />
            <span className="text-black-900 text-sm/normal">
              請輸入當時註冊之電子信箱，以收取驗證信！
            </span>
          </div>

          {/* Email 輸入：有錯才紅、leave 或 submit 才顯錯 */}
          <div className="w-[376px]">
            <Input
              type="email"
              placeholder="輸入電子信箱"
              value={email}
              onChange={(v) => setEmail(v)}
              onBlur={() => setTouched(true)}
              leftIcon="/icons/mail.png"
              // 對齊規格：邊框 1px、圓角 8（Input 內建樣式已相近）
              error={showError}
              errorMessage={showError ? '此為無效電子信箱' : undefined}
            />
          </div>

          {/* 送出區域 */}
          {sent ? (
            <div className="w-full flex flex-col items-start gap-[12px]">
                {/* 成功條（按鈕樣式） */}
                <div
                className="
                    w-[376px] h-[48px] rounded-[8px]
                    px-[48px] py-[12px]
                    bg-secondary-100
                    flex items-center justify-center
                "
                >
                <span
                    className="text-[16px] leading-[24px] font-normal text-secondary-800"
                    style={{ fontFamily: '"Noto Sans TC", sans-serif' }}
                >
                    驗證信已寄出！
                </span>
                </div>

                {/* 說明文字 */}
                <p
                className="w-[372px] h-[24px] text-[16px] leading-[24px] font-normal text-black-900"
                style={{ fontFamily: '"Noto Sans TC", sans-serif' }}
                >
                ＊請至上方輸入之信箱收信，根據信中指示重設密碼
                </p>
            </div>
            ) : (
                // 原本「寄出驗證信」按鈕的分支維持不變
                <button
                    type="submit"
                    disabled={!isValidEmail(email) || sending}
                    className={`
                    w-[378px] h-[48px] rounded-[8px] px-[48px] py-[12px]
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
