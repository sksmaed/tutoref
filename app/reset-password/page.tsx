'use client';

import { useMemo, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { Input } from '@/components/ui/Input';
import Image from 'next/image';
import { Modal } from '@/components/ui/Modal';

const isValidPassword = (s: string) => {
  const str = String(s ?? '');
  if (str.length < 8) return false;
  const hasLetter = /[A-Za-z]/.test(str);
  const hasNumber = /\d/.test(str);
  return hasLetter && hasNumber;
};

export default function ResetPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');

  // 表單狀態
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [touchedPwd, setTouchedPwd] = useState(false);
  const [touchedConfirm, setTouchedConfirm] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // 成功 Modal
  const [okOpen, setOkOpen] = useState(false);

  const pwdOK = isValidPassword(password);
  const confirmOK = pwdOK && confirm === password;
  const canSubmit = pwdOK && confirmOK && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit) return;
    setSubmitting(true);

    // 假送出
    await new Promise((r) => setTimeout(r, 600));

    setSubmitting(false);
    setOkOpen(true);
  };

  return (
    <div className="w-full min-h-[calc(100vh-120px)] flex flex-col items-center pt-[60px]">
      <h1 className="text-[40px] leading-normal font-bold text-black-900 mb-10">重設密碼</h1>

      {/* 外框：576x468、圓角8、padding 80/100/80/100、gap 40、陰影 */}
      <div
        className="
          w-[576px] h-[468px] rounded-[8px] bg-white
          shadow-[2px_2px_10px_0px_#0000001A]
          flex flex-col items-center
          pt-[80px] pr-[100px] pb-[80px] pl-[100px] gap-[40px]
        "
      >
        {/* 外殼：378x308、gap 32 */}
        <div className="w-[378px] h-[308px] flex flex-col items-center gap-[32px]">

          {/* 內層：378x308、gap 16 */}
          <form onSubmit={handleSubmit} className="w-[378px] h-[308px] flex flex-col gap-[16px]">

            {/* Email（顯示用，可鎖定） */}
            <Input
                type="email"
                placeholder="輸入電子信箱"
                value={email}
                onChange={setEmail}
                leftIcon="/icons/mail.png"
            />

            {/* 密碼 */}
            <Input
              type="password"
              placeholder="輸入密碼"
              value={password}
              onChange={(v) => setPassword(v)}
              onBlur={() => setTouchedPwd(true)}
              leftIcon="/icons/key.png"
              showPasswordToggle
              // 預設為不可見（你的 Input 目前預設閉眼）
              error={(touchedPwd) && !pwdOK}
              errorMessage={(touchedPwd) && !pwdOK ? '不符合下方的密碼設定規則' : undefined}
            />

            {/* 規則提示條（Primary/100） */}
            <div className="w-[378px] h-[52px] rounded-[8px] bg-primary-100 p-4 flex items-center gap-[10px]">
              <Image src="/icons/lightbulb-alt.png" alt="" width={20} height={20} />
              <span className="text-black-900 text-sm/normal">
                密碼需至少為 8 個字元，且包含英文及數字字母！
              </span>
            </div>

            {/* 再次輸入密碼（在密碼達標前 disabled） */}
            <Input
              type="password"
              placeholder="再次輸入密碼"
              value={confirm}
              onChange={(v) => setConfirm(v)}
              onBlur={() => setTouchedConfirm(true)}
              leftIcon="/icons/key.png"
              showPasswordToggle
              disabled={!pwdOK}
              error={(touchedConfirm) && pwdOK && confirm !== password}
              errorMessage={(touchedConfirm) && pwdOK && confirm !== password ? '再次輸入之密碼不相符' : undefined}
            />

            {/* 主按鈕 */}
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
        </div>
      </div>

      {/* 成功彈窗：按「前往登入」回登入頁（Default） */}
      <Modal
        open={okOpen}
        description={`密碼重設成功，\n現在請再次登入系統！`}
        onClose={() => setOkOpen(false)}
        confirmText="前往登入"
        onConfirm={() => {
          setOkOpen(false);
          router.replace('/login');
        }}
      />
    </div>
  );
}
