'use client';

import { useCallback, useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/features/auth/useAuth';
import type { Capability, TermContext } from './types';

/**
 * GET /review/me/context 的唯一入口——全站角色與能力都從這裡來。
 *
 * 快取規則（見 docs/REVIEW_MODULE_PLAN.md §5.1）：驗收資料一律不進 sessionStorage，
 * 但 context 例外，可在「單次 session 記憶體內」共用，因為 Navbar 與每個頁面都要用，
 * 而角色不會在使用中變動。登入 / 登出時必須呼叫 clearTermContextCache()。
 */

type CacheState = {
  data: TermContext | null;
  promise: Promise<TermContext | null> | null;
  loaded: boolean;
};

const cache: CacheState = { data: null, promise: null, loaded: false };
const subscribers = new Set<() => void>();

function notify() {
  subscribers.forEach((fn) => fn());
}

export function clearTermContextCache() {
  cache.data = null;
  cache.promise = null;
  cache.loaded = false;
  notify();
}

async function fetchTermContext(): Promise<TermContext | null> {
  const response = await api.get<TermContext>('/review/me/context');
  return response.data ?? null;
}

function loadTermContext(force = false): Promise<TermContext | null> {
  if (force) {
    cache.promise = null;
    cache.loaded = false;
  }
  if (cache.loaded && !force) return Promise.resolve(cache.data);
  if (!cache.promise) {
    cache.promise = fetchTermContext()
      .then((data) => {
        cache.data = data;
        cache.loaded = true;
        return data;
      })
      .catch((error) => {
        // 失敗不算「已載入」：不 poison 快取，讓下一次呼叫可以重試（避免登入後
        // 剛好碰到一次暫時性失敗就永遠卡住，需要整頁 refresh 才能恢復）。
        cache.data = null;
        cache.loaded = false;
        throw error;
      })
      .finally(() => {
        cache.promise = null;
        notify();
      });
  }
  return cache.promise;
}

export interface UseTermContextResult {
  context: TermContext | null;
  loading: boolean;
  error: string | null;
  reload: () => Promise<void>;
  can: (capability: Capability) => boolean;
}

export function useTermContext(): UseTermContextResult {
  const { loading: authLoading, authenticated } = useAuth();
  const [context, setContext] = useState<TermContext | null>(cache.data);
  const [loading, setLoading] = useState(!cache.loaded);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (force: boolean) => {
      if (!authenticated) {
        setContext(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const data = await loadTermContext(force);
        setContext(data);
        setError(null);
      } catch (err) {
        setContext(null);
        setError(err instanceof Error ? err.message : '無法取得驗收身分資訊');
      } finally {
        setLoading(false);
      }
    },
    [authenticated]
  );

  useEffect(() => {
    if (authLoading) return;
    void run(false);
  }, [authLoading, run]);

  // 其他元件清掉快取時同步刷新
  useEffect(() => {
    const onChange = () => setContext(cache.data);
    subscribers.add(onChange);
    return () => {
      subscribers.delete(onChange);
    };
  }, []);

  const can = useCallback(
    (capability: Capability) => !!context?.capabilities?.includes(capability),
    [context]
  );

  const reload = useCallback(async () => {
    await run(true);
  }, [run]);

  return { context, loading: authLoading || loading, error, reload, can };
}
