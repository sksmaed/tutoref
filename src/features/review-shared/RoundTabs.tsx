'use client';

import React, { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Tab } from '@/components/ui/Tab';
import type { Round } from './types';

const ROUND_TABS = [
  { key: 'initial' as Round, label: '初驗' },
  { key: 'final' as Round, label: '總驗' },
];

/** 從網址讀目前輪次，預設初驗。 */
export function useRound(): Round {
  const searchParams = useSearchParams();
  return searchParams?.get('round') === 'final' ? 'final' : 'initial';
}

/**
 * 初驗 / 總驗切換。輪次放 ?round=（不放 component state）——
 * 驗收期間大家會互相貼連結，「我在看總驗」要能被貼出來（§3.2）。
 */
export const RoundTabs: React.FC = () => {
  const round = useRound();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleChange = useCallback(
    (next: Round) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      params.set('round', next);
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router, searchParams]
  );

  return <Tab tabs={ROUND_TABS} active={round} onChange={handleChange} />;
};
