'use client';

import React from 'react';
import { PageHead } from '@/components/layout/PageHead';
import { useTermContext } from './useTermContext';

interface TermPageHeadProps {
  title: string;
  /** 說明文字；期別會自動接在前面。 */
  description?: React.ReactNode;
  actions?: React.ReactNode;
}

/** 驗收區頁面標題：標題 + 「期別・說明」+ 動作按鈕。 */
export function TermPageHead({ title, description, actions }: TermPageHeadProps) {
  const { context } = useTermContext();
  const term = context?.current_term;
  return (
    <PageHead
      title={title}
      actions={actions}
      subtitle={
        term || description ? (
          <>
            {term?.label}
            {term?.is_readonly && <span className="ml-1 text-status-locked">（唯讀期別）</span>}
            {term && description ? '・' : ''}
            {description}
          </>
        ) : undefined
      }
    />
  );
}
