import React, { useState,useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Warning } from '../ui/Warning';
import { Tab } from '../ui/Tab';

interface LoginSignupBoardProps {
    onLogin?: (email: string, password: string, rememberMe: boolean) => void;
    onSignup?: (email: string, password: string, confirmPassword: string) => void;
    onGoogleLogin?: () => void;
    forceTab?: 'login' | 'signup';
    className?: string;
}

//TODO: error handling (input border), popout window
export const LoginSignupBoard: React.FC<LoginSignupBoardProps> = ({
    onLogin,
    onSignup,
    onGoogleLogin,
    className = '',
    forceTab,
}) => {
    const router = useRouter();
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>("login");
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showWarning, setShowWarning] = useState(false);
    const [touched, setTouched] = useState({ email: false, password: false, confirm: false });
    const [submitted, setSubmitted] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setSubmitted(true);

        if (activeTab === 'login') {
            const ok = isValidEmail(email) && password.trim() !== '';
            if (!ok) return;
            setSubmitted(false);
            onLogin?.(email, password, rememberMe);
        } else {
            const ok =
            isValidEmail(email) &&
            isValidPassword(password) &&
            confirmPassword === password;

            if (!ok) return;
            setSubmitted(false);
            onSignup?.(email, password, confirmPassword);
        }
    };

    // 檢查表單是否完整填寫
    const isFormValid = () => {
        if (activeTab === 'login') {
            return isValidEmail(email) && password.trim() !== '';
        } else {
            return (
                isValidEmail(email) &&
                isValidPassword(password) &&
                confirmPassword === password
            );
        }
    };

    const isValidEmail = (s: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s);
    const isValidPassword = (s: string) => {
        if (s.length < 8) return false;
        const hasLetter = /[A-Za-z]/.test(s);
        const hasDigit = /\d/.test(s);
        return hasLetter && hasDigit;
    };

    const handleForgotPassword = () => {
        router.push('/forgot-password');
    };

    const handleRegisterRedirect = () => {
        setActiveTab('signup');
    };

    useEffect(() => {
        setTouched({ email: false, password: false, confirm: false });
        setSubmitted(false);
        setShowWarning(false); 
    }, [activeTab]);

    useEffect(() => {
        if (!forceTab) return;
        setActiveTab(forceTab);
    }, [forceTab]); // ← 去掉 activeTab

    return (
        <div className={`flex flex-col w-[576px] bg-white rounded-lg pb-10 gap-8`}>
            <Tab activeTab={activeTab} onTabChange={setActiveTab} />

            <form onSubmit={handleSubmit} className="flex flex-col items-center gap-8">
                <div className="w-[378px] flex flex-col gap-5">
                    {activeTab === 'login' && (
                        <Warning
                            message={
                                <span>
                                    若您還沒有帳號，記得先
                                    <button
                                        type="button"
                                        onClick={() => setActiveTab('signup')}
                                        className="text-primary-900 underline hover:opacity-90"
                                    >
                                        註冊
                                    </button>
                                    再來登入喔！
                                </span>
                            }
                            className="text-sm/normal font-normal"
                        />
                    )}

                    <div className={`w-full flex flex-col gap-4 ${className}`}>
                        <Input
                            type="email"
                            placeholder="輸入電子信箱"
                            value={email}
                            onChange={(v) => { setEmail(v); setShowWarning(false); }}
                            onBlur={() => setTouched((t) => ({ ...t, email: true }))}
                            leftIcon="/icons/mail.png"
                            error={(touched.email || submitted) && !isValidEmail(email)}
                            errorMessage={(touched.email || submitted) && !isValidEmail(email)
                                ? "此為無效電子信箱" : undefined}
                        />

                        <Input
                            type="password"
                            placeholder={activeTab === 'login' ? "輸入密碼" : "設定密碼（至少 8 碼，英數混合）"}
                            value={password}
                            onChange={(v) => { setPassword(v); setShowWarning(false); }}
                            onBlur={() => setTouched((t) => ({ ...t, password: true }))}
                            leftIcon="/icons/key.png"
                            showPasswordToggle
                            error={
                                activeTab === 'login'
                                ? (touched.password || submitted) && password.trim() === ''
                                : (touched.password || submitted) && !isValidPassword(password)
                            }
                            errorMessage={
                                activeTab === 'login'
                                ? (touched.password || submitted) && password.trim() === '' ? "請輸入密碼" : undefined
                                : (touched.password || submitted) && !isValidPassword(password)
                                    ? "密碼需至少 8 碼，且包含英文與數字"
                                    : undefined
                            }
                        />

                        {activeTab === 'signup' && (
                            <Warning
                                message="密碼至少爲 8 個字元，且包含英文及數字噢！"
                                className="text-sm/normal font-normal"
                            />
                        )}

                        {activeTab === 'signup' && (
                            <Input
                                type="password"
                                placeholder="確認密碼"
                                value={confirmPassword}
                                onChange={(v) => { setConfirmPassword(v); setShowWarning(false); }}
                                onBlur={() => setTouched((t) => ({ ...t, confirm: true }))}
                                leftIcon="/icons/key.png"
                                showPasswordToggle
                                disabled={!isValidPassword(password)}
                                error={(touched.confirm || submitted) && confirmPassword !== password}
                                errorMessage={(touched.confirm || submitted) && confirmPassword !== password
                                ? "再次輸入之密碼不相符" : undefined}
                            />
                        )}

                    </div>

                    {activeTab === 'login' && (
                        <div className="w-full flex items-center justify-between">
                            <Checkbox
                                checked={rememberMe}
                                onChange={setRememberMe}
                                label="記住帳密"
                            />
                            <button
                                type="button"
                                onClick={handleForgotPassword}
                                className="text-base/normal font-normal text-primary-900 hover:opacity-90"
                            >
                                忘記密碼？
                            </button>
                        </div>
                    )}
                </div>

                <div className='w-[378px] border border-black-200'></div>

                <div className="w-[378px] flex flex-col gap-4">
                    <Button
                        variant="large"
                        onClick={onGoogleLogin}
                        className='bg-black-700 font-normal text-base/normal text-white'
                        leftIcon='/icons/google.png'
                    >
                        使用 Google 帳號登入
                    </Button>

                    <Button
                        type="submit"
                        variant="large"
                        disabled={!isFormValid()}
                        className={`font-bold text-base/normal text-white ${isFormValid()
                            ? 'bg-primary-900'
                            : 'bg-black-200 cursor-not-allowed'
                            }`}
                    >
                        {activeTab === 'login' ? '登入' : '註冊'}
                    </Button>
                </div>
            </form>
        </div>
    );
};

export default LoginSignupBoard;