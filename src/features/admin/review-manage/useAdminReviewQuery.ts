'use client';

import { useCallback } from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import type { Round } from '@/features/review-shared/types';

export type AdminTab = 'schedule' | 'rubric' | 'initial' | 'final';
export type RoundView = 'submissions' | 'assignments' | 'results';

const TABS: AdminTab[] = ['schedule', 'rubric', 'initial', 'final'];
const VIEWS: RoundView[] = ['submissions', 'assignments', 'results'];

/** 舊網址（?tab=overview|assignments|results|settings&round=…）對應到新的分頁。 */
const LEGACY_VIEW: Record<string, RoundView> = {
  overview: 'submissions',
  assignments: 'assignments',
  results: 'results',
};

/**
 * 本期驗收管理的分頁狀態全部放在網址（§3.2：大家會互相貼連結）：
 * ?tab=schedule|rubric|initial|final，初驗/總驗再帶 &view=submissions|assignments|results。
 */
export function useAdminReviewQuery() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const rawTab = searchParams?.get('tab') ?? '';
  const rawView = searchParams?.get('view') ?? '';
  const legacyRound: Round = searchParams?.get('round') === 'final' ? 'final' : 'initial';

  let tab: AdminTab;
  let view: RoundView;
  if ((TABS as string[]).includes(rawTab)) {
    tab = rawTab as AdminTab;
    view = (VIEWS as string[]).includes(rawView) ? (rawView as RoundView) : 'submissions';
  } else if (rawTab === 'settings') {
    tab = 'schedule';
    view = 'submissions';
  } else if (rawTab in LEGACY_VIEW) {
    tab = legacyRound;
    view = LEGACY_VIEW[rawTab];
  } else {
    tab = 'initial';
    view = 'submissions';
  }

  const round: Round | null = tab === 'initial' || tab === 'final' ? tab : null;

  const navigate = useCallback(
    (next: { tab: AdminTab; view?: RoundView }) => {
      const params = new URLSearchParams();
      params.set('tab', next.tab);
      if (next.tab === 'initial' || next.tab === 'final') params.set('view', next.view ?? 'submissions');
      router.replace(`${pathname}?${params.toString()}`);
    },
    [pathname, router]
  );

  const setTab = useCallback((next: AdminTab) => navigate({ tab: next, view }), [navigate, view]);
  const setView = useCallback((next: RoundView) => navigate({ tab, view: next }), [navigate, tab]);

  return { tab, view, round, setTab, setView };
}
