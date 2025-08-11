'use client'

import React from 'react';
import LoginSignupBoard from '@/components/layout/LoginSignupBoard';

const LoginPage: React.FC = () => {
    const handleLogin = (email: string, password: string, rememberMe: boolean) => {
        console.log('Login:', { email, password, rememberMe });
        // 實現登入邏輯
    };

    const handleSignup = (email: string, password: string, confirmPassword: string) => {
        console.log('Signup:', { email, password, confirmPassword });
        // 實現註冊邏輯
    };

    const handleGoogleLogin = () => {
        console.log('Google login');
        // 實現 Google 登入邏輯
    };

    return (
        <div className="w-full h-full bg-black-100 flex flex-col items-center pt-[60px]">
            <h1 className="text-[40px] leading-normal font-bold text-black-900 mb-10">登入註冊</h1>
            <LoginSignupBoard
                onLogin={handleLogin}
                onSignup={handleSignup}
                onGoogleLogin={handleGoogleLogin}
            />
        </div>
    );
};

export default LoginPage;