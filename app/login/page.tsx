'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginSignupBoard from '@/components/layout/LoginSignupBoard';
import { setFlash } from '@/utils/flash';
import { Modal } from '@/components/ui/Modal';
import { fakeLogin, type FailKind, fakeSignup, type SignupResult } from '@/utils/auth.fake';


const LoginPage: React.FC = () => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [failOpen, setFailOpen] = useState(false);
  const [failText, setFailText] = useState<string>('');
  
  const [signupOpen, setSignupOpen] = useState(false);
  const [signupText, setSignupText] = useState('');
  const [signupConfirmText, setSignupConfirmText] = useState<'我知道了' | '前往登入'>('我知道了');
  const [signupOnConfirm, setSignupOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [forceTab, setForceTab] = useState<'login' | 'signup' | undefined>(undefined);


  const handleLogin = async (email: string, password: string, rememberMe: boolean) => {
    if (submitting) return;
    setSubmitting(true);
    const result = await fakeLogin(email, password);
    setSubmitting(false);

    if (result === 'ok') {
      // 設定跳轉後的 toast
      setFlash({
        type: 'success',
        title: '登入成功！',
        message: '可以開始檢索教案囉～',
        timeout: 5000,
      });
      router.push('/'); // 跳到根目錄
      return;
    }

    // 失敗：顯示彈窗
    if (result === 'wrong_password') {
      setFailText('密碼錯誤，請重新輸入！');
    } else {
      setFailText('此電子信箱尚未被註冊，請重新輸入！');
    }
    setFailOpen(true);
  };

  const handleSignup = async (email: string, password: string, confirmPassword: string) => {
    if (submitting) return;
    setSubmitting(true);

    const res: SignupResult = await fakeSignup(email);
    setSubmitting(false);

    if (res === 'duplicated') {
        // 失敗：信箱已被註冊
        setSignupText('該信箱已被註冊，請重新輸入！');
        setSignupConfirmText('我知道了');
        setSignupOnConfirm(undefined);     // 只關掉
        setSignupOpen(true);
        return;
    }

    // 成功：顯示成功訊息，按「前往登入」→ 切到 login 分頁
    console.log('註冊成功，請前往登入：', { email });
    setSignupText('恭喜你註冊成功，現在請前往登入系統！');
    setSignupConfirmText('前往登入');
    setSignupOnConfirm(() => () => {
        setSignupOpen(false);
        setForceTab('login');             // <<< 關鍵：切到登入分頁
    });
    setSignupOpen(true);
  };


  const handleGoogleLogin = () => {
    console.log('Google login (fake)');
  };

  return (
    <div className="w-full h-full bg-black-100 flex flex-col items-center pt-[60px]">
      <h1 className="text-[40px] leading-normal font-bold text-black-900 mb-10">登入註冊</h1>

      <LoginSignupBoard
        onLogin={handleLogin}
        onSignup={handleSignup}
        onGoogleLogin={handleGoogleLogin}
        forceTab={forceTab}   
      />

      <Modal
        open={failOpen}
        description={failText}
        onClose={() => setFailOpen(false)}
        confirmText="我知道了"
      />

      {/* 註冊成功/失敗 Modal */}
      <Modal
        open={signupOpen}
        description={signupText}
        onClose={() => setSignupOpen(false)}
        confirmText={signupConfirmText}
        onConfirm={signupOnConfirm}
      />
    </div>
  );
};

export default LoginPage;
