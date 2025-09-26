import React from 'react';

interface TabProps {
    activeTab: 'login' | 'signup';
    onTabChange: (tab: 'login' | 'signup') => void;
}

export const Tab: React.FC<TabProps> = ({ activeTab, onTabChange }) => {
    return (
        <div className="flex justify-between h-[72px] border-b border-black-100">
            <div className="flex flex-col w-1/2 items-center">
                <button
                    onClick={() => onTabChange('login')}
                    className={`flex-1 w-full text-center text-xl/normal font-medium hover:opacity-90 hover:cursor-pointer ${activeTab === 'login'
                        ? 'text-primary-900'
                        : 'text-black-900'
                        }`}
                >
                    登入帳號
                </button>

                {
                    activeTab === 'login' && (
                        <div className="w-[186px] h-0 border border-primary-900"></div>
                    )
                }
            </div>

            <div className="flex flex-col w-1/2 items-center">
                <button
                    onClick={() => onTabChange('signup')}
                    className={`flex-1 w-full text-center text-xl/normal font-medium hover:opacity-90 hover:cursor-pointer ${activeTab === 'signup'
                        ? 'text-primary-900'
                        : 'text-black-900'
                        }`}
                >
                    註冊帳號
                </button>
                {
                    activeTab === 'signup' && (
                        <div className="w-[186px] h-0 border border-primary-900"></div>
                    )
                }
            </div>
        </div>
    );
};