'use client';

import { useMemo } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { useTermContext } from '@/features/review-shared/useTermContext';
import type { NavContext } from './nav-config';

/** 側欄與頁面標題共用：登入狀態 + capabilities。 */
export function useNavContext(): NavContext & { loading: boolean } {
  const { loading: authLoading, authenticated } = useAuth();
  const { context, loading } = useTermContext();
  const capabilities = context?.capabilities;
  return useMemo(
    () => ({
      authenticated,
      capabilities: authenticated ? capabilities ?? [] : [],
      loading: authLoading || (authenticated && loading),
    }),
    [authLoading, authenticated, capabilities, loading]
  );
}
