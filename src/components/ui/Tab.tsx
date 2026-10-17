import React from 'react';

export interface TabItem<T extends string> {
    key: T;
    label: string;
}

interface TabProps<T extends string> {
    tabs: TabItem<T>[];
    active: T;
    // NoInfer：T 只由 tabs / active 決定，避免傳 setState 進來時把 T 推成 string
    onChange: (tab: NoInfer<T>) => void;
    /**
     * full：平分寬度的大頁籤（登入、既有頁面）
     * compact：靠左、依內容寬度的底線頁籤（v13 `.tabs` / `.round-tabs`）
     */
    variant?: 'full' | 'compact';
    className?: string;
}

export function Tab<T extends string>({ tabs, active, onChange, variant = 'full', className = '' }: TabProps<T>) {
    if (variant === 'compact') {
        return (
            <div className={`mb-5 flex gap-1 overflow-x-auto border-b border-black-200 ${className}`} role="tablist">
                {tabs.map((tab) => {
                    const on = active === tab.key;
                    return (
                        <button
                            key={tab.key}
                            type="button"
                            role="tab"
                            aria-selected={on}
                            onClick={() => onChange(tab.key)}
                            className={`-mb-px cursor-pointer whitespace-nowrap border-b-2 px-4 py-[10px] font-['Noto_Sans_TC'] text-[15px] font-bold ${on
                                ? 'border-primary-900 text-primary-900'
                                : 'border-transparent text-black-500 hover:text-black-900'
                                }`}
                        >
                            {tab.label}
                        </button>
                    );
                })}
            </div>
        );
    }

    return (
        <div className={`flex justify-between h-[72px] border-b border-black-100 ${className}`}>
            {tabs.map((tab) => (
                <div key={tab.key} className="flex flex-col flex-1 items-center">
                    <button
                        onClick={() => onChange(tab.key)}
                        className={`flex-1 w-full text-center text-xl/normal font-medium hover:opacity-90 hover:cursor-pointer ${active === tab.key
                            ? 'text-primary-900'
                            : 'text-black-900'
                            }`}
                    >
                        {tab.label}
                    </button>

                    {
                        active === tab.key && (
                            <div className="w-full h-0 border border-primary-900"></div>
                        )
                    }
                </div>
            ))}
        </div>
    );
}
