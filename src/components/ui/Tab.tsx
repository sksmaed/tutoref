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
}

export function Tab<T extends string>({ tabs, active, onChange }: TabProps<T>) {
    return (
        <div className="flex justify-between h-[72px] border-b border-black-100">
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
