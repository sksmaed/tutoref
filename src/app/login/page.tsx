'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import LoginSignupBoard from '@/features/auth/LoginSignupBoard';
import { setFlash } from '@/lib/flash';
import { Modal } from '@/components/ui/Modal';
import { login as apiLogin, register as apiRegister, initiateGoogleLogin } from "@/services/auth";
import { useAuth } from "@/features/auth/useAuth";


const LoginPage: React.FC = () => {
  const router = useRouter();
  const [submitting, setSubmitting] = useState(false);
  const [failOpen, setFailOpen] = useState(false);
  const [failText, setFailText] = useState<string>('');

  const [signupOpen, setSignupOpen] = useState(false);
  const [signupText, setSignupText] = useState<string>('');
  const [signupConfirmText, setSignupConfirmText] = useState<'我知道了' | '前往登入'>('我知道了');
  const [signupOnConfirm, setSignupOnConfirm] = useState<(() => void) | undefined>(undefined);
  const [forceTab, setForceTab] = useState<'login' | 'signup' | undefined>(undefined);

  const { refresh, authenticated } = useAuth();

  useEffect(() => {
    if (!authenticated) {
      try {
        sessionStorage.removeItem('oauthPostLoginFlash');
      } catch {}
    }
  }, [authenticated]);

  const handleLogin = async (email: string, password: string, _rememberMe: boolean) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiLogin(email, password);
      await refresh(); // 👈 讓 Navbar 立刻知道已登入
      setSubmitting(false);

      setFlash({
        type: 'success',
        title: '登入成功！',
        message: '可以開始檢索教案囉～',
        timeout: 5000,
      });
      router.push('/'); // 與你原本行為一致
    } catch (e: any) {
      setSubmitting(false);
      const errorCode: string | undefined = e?.code;
      let msg: string;

      switch (errorCode) {
        case 'auth:incorrect_password':
          msg = '密碼錯誤，請重新輸入';
          break;
        case 'auth:email_not_registered':
          msg = '此電子信箱尚未被註冊，\n請重新輸入！';
          break;
        default:
          // 保留原始錯誤訊息，避免吃掉其他情況（ex. server error）
          msg = e?.message || '登入失敗，請稍後再試';
      }

      setFailText(msg);
      setFailOpen(true);
    }
  };


  const handleSignup = async (email: string, password: string, confirmPassword: string) => {
    if (submitting) return;
    setSubmitting(true);
    try {
      await apiRegister({ email, password1: password, password2: confirmPassword });
      setSubmitting(false);

      setSignupText('恭喜你註冊成功，現在請再次登入系統！');
      setSignupConfirmText('前往登入');
      setSignupOnConfirm(() => () => {
        setSignupOpen(false);
        setForceTab('login');
      });
      setSignupOpen(true);
    } catch (e: any) {
      setSubmitting(false);

      // 先組一個預設訊息（可把多個 errors 串成多行）
      let fallback =
        (Array.isArray(e.errors) && e.errors.length
          ? e.errors.map((er: any) => er?.extra_data?.message || er?.message).filter(Boolean).join('\n')
          : e.message) || '註冊失敗，請確認資料是否正確';

      // 預設按鈕文案與行為
      let msg: string = fallback;
      let confirmText: '我知道了' | '前往登入' = '我知道了';
      let onConfirm: (() => void) | undefined = undefined;
      console.log('signup error:', e);

      switch (e.code) {
        case 'auth:email_already_exists':
          msg = '該信箱已被註冊，請重新登入！';
          confirmText = '我知道了';
          console.log('email_already_exists');
          break;
        default:
          // 保持預設
          break;
      }

      // ✅ 使用「註冊 Modal」，而不是 fail modal
      setSignupText(msg);
      setSignupConfirmText(confirmText);
      setSignupOnConfirm(onConfirm);
      setSignupOpen(true);
    }
  };


  const handleGoogleLogin = async () => {
    try {
      await initiateGoogleLogin(); // 會自動導到 Google
    } catch (e: any) {
      setFailText(e.message || 'Google 登入初始化失敗');
      setFailOpen(true);
    }
  };

  return (
    <div className="w-full h-full bg-black-100 flex flex-col items-center pt-8 sm:pt-[60px] px-4 sm:px-0">
      <h1 className="text-[28px] sm:text-[40px] leading-normal font-bold text-black-900 mb-6 sm:mb-10">登入註冊</h1>

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
