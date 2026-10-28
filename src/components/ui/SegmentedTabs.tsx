import React from 'react';
import type { TabItem } from './Tab';

interface SegmentedTabsProps<T extends string> {
  tabs: TabItem<T>[];
  active: T;
  onChange: (tab: NoInfer<T>) => void;
  /**
   * solid：作用中為橘底白字（v13 `.management-subtabs`，用在子頁籤）
   * soft：作用中為白底橘字（v13 `.view-toggle`，用在檢視切換）
   */
  variant?: 'solid' | 'soft';
  className?: string;
}

/** 膠囊式切換列。 */
export function SegmentedTabs<T extends string>({
  tabs,
  active,
  onChange,
  variant = 'solid',
  className = '',
}: SegmentedTabsProps<T>) {
  const wrap =
    variant === 'solid'
      ? 'border border-black-200 bg-white'
      : 'bg-black-100';
  return (
    <div className={`inline-flex gap-1 rounded-[10px] p-1 ${wrap} ${className}`} role="tablist">
      {tabs.map((tab) => {
        const on = tab.key === active;
        const tone =
          variant === 'solid'
            ? on
              ? 'bg-primary-900 text-white'
              : 'text-black-500 hover:text-black-900'
            : on
              ? 'bg-white text-primary-900 shadow-[0_2px_6px_rgba(0,0,0,0.06)]'
              : 'text-black-500 hover:text-black-900';
        return (
          <button
            key={tab.key}
            type="button"
            role="tab"
            aria-selected={on}
            onClick={() => onChange(tab.key)}
            className={`cursor-pointer rounded-[7px] px-3 py-[7px] font-['Noto_Sans_TC'] text-[14px] font-bold ${tone}`}
          >
            {tab.label}
          </button>
        );
      })}
    </div>
  );
}
