import React, { useState } from 'react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';
import { Checkbox } from '../ui/Checkbox';
import { Warning } from '../ui/Warning';
import { Tab } from '../ui/Tab';

interface LoginSignupBoardProps {
    onLogin?: (email: string, password: string, rememberMe: boolean) => void;
    onSignup?: (email: string, password: string, confirmPassword: string) => void;
    onGoogleLogin?: () => void;
    className?: string;
}

//TODO: error handling (input border), popout window
export const LoginSignupBoard: React.FC<LoginSignupBoardProps> = ({
    onLogin,
    onSignup,
    onGoogleLogin,
    className = ''
}) => {
    const [activeTab, setActiveTab] = useState<'login' | 'signup'>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(false);
    const [showWarning, setShowWarning] = useState(false);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('表單提交:', { email, password, confirmPassword, rememberMe });

        if (!email || !password) {
            setShowWarning(true);
            return;
        }

        if (activeTab === 'signup') {
            onSignup?.(email, password, confirmPassword);
        } else {
            setShowWarning(true);
            onLogin?.(email, password, rememberMe);
        }
    };

    // 檢查表單是否完整填寫
    const isFormValid = () => {
        if (activeTab === 'login') {
            return email.trim() !== '' && password.trim() !== '';
        } else {
            return email.trim() !== '' && password.trim() !== '' && confirmPassword.trim() !== '' && password === confirmPassword;
        }
    };

    const handleForgotPassword = () => {
        // 實現忘記密碼邏輯
        console.log('忘記密碼');
    };

    const handleRegisterRedirect = () => {
        setActiveTab('signup');
    };

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
                            onChange={setEmail}
                            leftIcon="/icons/mail.png" // 替換為你的圖檔路徑
                            error={showWarning && !email}
                            errorMessage={showWarning && !email ? "請輸入電子信箱" : undefined}
                        />

                        <Input
                            type="password"
                            placeholder="輸入密碼"
                            value={password}
                            onChange={setPassword}
                            leftIcon="/icons/key.png" // 替換為你的圖檔路徑
                            showPasswordToggle
                            error={showWarning && !password}
                            errorMessage={showWarning && !password ? "請輸入密碼" : undefined}
                        />

                        {activeTab === 'signup' && (
                            <Warning
                                message="若您還沒有帳號，記得先註冊再來登入喔！"
                                className="text-sm/normal font-normal"
                            />
                        )}

                        {activeTab === 'signup' && (
                            <Input
                                type="password"
                                placeholder="確認密碼"
                                value={confirmPassword}
                                onChange={setConfirmPassword}
                                leftIcon="/icons/key.png" // 替換為你的圖檔路徑
                                showPasswordToggle
                                error={showWarning && password !== confirmPassword}
                                errorMessage={showWarning && password !== confirmPassword ? "密碼不相符" : undefined}
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