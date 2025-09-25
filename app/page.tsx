'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { popFlash, Flash } from '@/utils/flash';
import { Toast } from '@/components/ui/toast';
import SearchBar from '@/components/ui/SearchBar';
import SearchFilters from '@/components/ui/SearchFilters';
import PopularCategories, { PopularCategoryItem } from '@/components/ui/PopularCategories';
import StartHere, { StartHereItem } from '@/components/ui/StartHere';
import SearchResults from '@/components/ui/SearchResults';
import { consumeHomeResetFlag, HOME_RESET_EVENT } from '@/lib/homeReset';
import { OTHER_CATEGORY_LABEL } from '@/lib/categories';

type FilterState = {
  categories: Set<string>;
  families: Set<string>;
  issues: Set<string>;
  grades: Set<string>;
  durations: Set<string>;
};

function createEmptyFilters(): FilterState {
  return {
    categories: new Set<string>(),
    families: new Set<string>(),
    issues: new Set<string>(),
    grades: new Set<string>(),
    durations: new Set<string>(),
  };
}

function cloneFilters(source: FilterState): FilterState {
  return {
    categories: new Set(source.categories),
    families: new Set(source.families),
    issues: new Set(source.issues),
    grades: new Set(source.grades),
    durations: new Set(source.durations),
  };
}

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const API_PREFIX = BACKEND_URL ? `${BACKEND_URL}/teaching-plan` : '';

const CATEGORY_CONFIG: Array<{ key: string; label: string; color: string; icon: string }> = [
  { key: 'nature', label: '自然', color: '#728A47', icon: '/icons/lightening.png' },
  { key: 'social', label: '社會', color: '#F1994A', icon: '/icons/people.png' },
  { key: 'general', label: '綜合', color: '#7F478A', icon: '/icons/gift.png' },
  { key: 'info', label: '資訊', color: '#6392B5', icon: '/icons/globe.png' },
  { key: 'art', label: '藝文', color: '#C85F5F', icon: '/icons/music.png' },
  { key: 'chinese', label: '國語', color: '#C1B349', icon: '/icons/write.png' },
  { key: 'health', label: '健教', color: '#3D9375', icon: '/icons/smile.png' },
  { key: 'morning', label: '晨讀', color: '#C4789A', icon: '/icons/book.png' },
  { key: 'english', label: '英文', color: '#8E5C36', icon: '/icons/speak.png' },
  { key: 'other', label: '其他', color: '#0D0D0D', icon: '/icons/more.png' },
];

export default function Home() {
  const [toast, setToast] = useState<Flash | null>(null);
  const [open, setOpen] = useState(false);

  // 搜尋與篩選狀態
  const [query, setQuery] = useState('');
  const [hasFilters, setHasFilters] = useState(false);
  const [filters, setFilters] = useState<FilterState>(() => createEmptyFilters());
  const [submittedQuery, setSubmittedQuery] = useState('');
  const [submittedFilters, setSubmittedFilters] = useState<FilterState>(() => createEmptyFilters());

  const handleFiltersChange = useCallback((s: {
    categories: Set<string>;
    families: Set<string>;
    issues: Set<string>;
    grades: Set<string>;
    durations: Set<string>;
    hasAny: boolean;
  }) => {
    setHasFilters(s.hasAny);
    setFilters({
      categories: s.categories,
      families:   s.families,
      issues:     s.issues,
      grades:     s.grades,
      durations:  s.durations,
    });
  }, []);

  // 放大鏡可否點
  const canSearch = query.trim().length > 0 || hasFilters;

  // 每按一次搜尋就 +1，讓 SearchResults 重新執行假搜尋
  const [searchTrigger, setSearchTrigger] = useState(0);
  const [hasSearched, setHasSearched] = useState(false);
  const [popularCategories, setPopularCategories] = useState<PopularCategoryItem[]>([]);
  const [startHereItems, setStartHereItems] = useState<StartHereItem[]>([]);
  const [inspirationLoading, setInspirationLoading] = useState(false);
  const [inspirationError, setInspirationError] = useState('');
  const filterInitials = useMemo(
    () => ({
      categories: Array.from(filters.categories),
      families: Array.from(filters.families),
      issues: Array.from(filters.issues),
      grades: Array.from(filters.grades),
      durations: Array.from(filters.durations),
    }),
    [filters]
  );

  const handleSearch = useCallback(() => {
    if (!canSearch) return;
    setSubmittedQuery(query);
    setSubmittedFilters(cloneFilters(filters));
    setHasSearched(true);                 // ⬅️ 顯示結果、隱藏靈感區
    setSearchTrigger((n) => n + 1);       // 觸發 SearchResults 做一次搜尋
  }, [canSearch, filters, query]);

  const handlePopularCategorySelect = useCallback((item: PopularCategoryItem) => {
    setFilters((prev) => {
      const nextFilters: FilterState = {
        categories: new Set([item.label]),
        families: new Set(prev.families),
        issues: new Set(prev.issues),
        grades: new Set(prev.grades),
        durations: new Set(prev.durations),
      };
      setSubmittedQuery(query);
      setSubmittedFilters(cloneFilters(nextFilters));
      return nextFilters;
    });
    setHasFilters(true);
    setHasSearched(true);
    setSearchTrigger((n) => n + 1);
  }, [query]);

  const resetHome = useCallback(() => {
    setQuery('');
    setHasFilters(false);
    setFilters(createEmptyFilters());
    setSubmittedQuery('');
    setSubmittedFilters(createEmptyFilters());
    setHasSearched(false);
    setSearchTrigger(0);
  }, []);

  useEffect(() => {
    const f = popFlash();
    if (f) {
      setToast(f);
      setOpen(true);
    }
  }, []);

  useEffect(() => {
    if (!API_PREFIX) {
      setInspirationError('後端網址未設定（NEXT_PUBLIC_BACKEND_URL）。');
      return;
    }

    let cancelled = false;

    const load = async () => {
      setInspirationLoading(true);
      try {
        const primaryCategories = CATEGORY_CONFIG.filter((category) => category.label !== OTHER_CATEGORY_LABEL);

        const primaryRequests = primaryCategories.map(async (category) => {
          const url = new URL(`${API_PREFIX}/search`);
          url.searchParams.append('category', category.label);

          const res = await fetch(url.toString(), {
            method: 'GET',
            credentials: 'include',
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
          }

          const payload = await res.json();
          const data: any[] = Array.isArray(payload?.data) ? payload.data : [];
          const count = typeof payload?.count === 'number' ? payload.count : data.length;

          return {
            category,
            count,
            plans: data,
          };
        });

        const totalRequest = (async () => {
          const url = new URL(`${API_PREFIX}/search`);
          const res = await fetch(url.toString(), {
            method: 'GET',
            credentials: 'include',
          });

          if (!res.ok) {
            throw new Error(`HTTP ${res.status} ${res.statusText}`);
          }

          const payload = await res.json();
          const data: any[] = Array.isArray(payload?.data) ? payload.data : [];
          const count = typeof payload?.count === 'number' ? payload.count : data.length;
          return { plans: data, count };
        })();

        const responses = await Promise.allSettled([...primaryRequests, totalRequest]);

        if (cancelled) return;

        const primaryFulfilled = responses.slice(0, primaryCategories.length).filter(
          (result): result is { status: 'fulfilled'; value: { category: (typeof primaryCategories)[number]; count: number; plans: any[] } } =>
            result.status === 'fulfilled',
        );

        const totalResult = responses[primaryCategories.length];

        const aggregatedPlans = new Map<string, any>();
        const categoryCountMap = new Map<string, number>();

        primaryFulfilled.forEach(({ value }) => {
          categoryCountMap.set(value.category.label, value.count);
          value.plans.forEach((plan: any) => {
            if (plan?.id) {
              aggregatedPlans.set(plan.id, plan);
            }
          });
        });

        let totalCount = 0;
        if (totalResult?.status === 'fulfilled') {
          totalCount = totalResult.value.count;
          totalResult.value.plans.forEach((plan: any) => {
            if (plan?.id) {
              aggregatedPlans.set(plan.id, plan);
            }
          });
        }

        const primaryTotal = Array.from(categoryCountMap.values()).reduce((sum, count) => sum + count, 0);
        const otherCount = Math.max(totalCount - primaryTotal, 0);

        const sortedCategories = CATEGORY_CONFIG
          .map((category) => {
            const count = category.label === OTHER_CATEGORY_LABEL
              ? otherCount
              : categoryCountMap.get(category.label) ?? 0;
            return {
              key: category.key,
              label: category.label,
              color: category.color,
              icon: category.icon,
              count,
            } satisfies PopularCategoryItem;
          })
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setPopularCategories(sortedCategories);

        const allPlans = Array.from(aggregatedPlans.values());
        const excellentCount = allPlans.reduce((total, plan: any) => total + (plan?.is_excellent ? 1 : 0), 0);

        const now = Date.now();
        const latestThreshold = now - 30 * 24 * 60 * 60 * 1000;
        const latestCount = allPlans.reduce((total, plan: any) => {
          const createdAt = plan?.created_at ? Date.parse(plan.created_at) : Number.NaN;
          return total + (Number.isFinite(createdAt) && createdAt >= latestThreshold ? 1 : 0);
        }, 0);

        const topCategory = sortedCategories.find((category) => category.count > 0) ?? sortedCategories[0];

        const startItems: StartHereItem[] = [
          { id: 'good', label: '優良教案', count: excellentCount, icon: '/icons/good.png' },
          {
            id: 'most',
            label: '最多人參考',
            count: topCategory?.count ?? allPlans.length,
            icon: '/icons/eye-open.png',
            helperText: topCategory && topCategory.count > 0 ? `目前以「${topCategory.label}」最受歡迎` : undefined,
          },
          {
            id: 'latest',
            label: '最新上傳',
            count: latestCount,
            icon: '/icons/time.png',
            helperText: '近 30 天新增',
          },
        ];

        setStartHereItems(startItems);

        const hasRejected = responses.some((result) => result.status === 'rejected');
        const hasAnyData = sortedCategories.some((item) => item.count > 0);
        setInspirationError(hasAnyData
          ? (hasRejected ? '部分熱門資料載入失敗，已顯示可用資訊。' : '')
          : '目前此功能尚未開放😓'
        );
      } catch (error) {
        if (!cancelled) {
          console.error('[Home] Failed to load inspiration data', error);
          setPopularCategories([]);
          setStartHereItems([]);
          setInspirationError(error instanceof Error ? error.message : '無法載入資料，請稍後再試。');
        }
      } finally {
        if (!cancelled) {
          setInspirationLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleHomeReset = () => {
      consumeHomeResetFlag();
      resetHome();
    };

    window.addEventListener(HOME_RESET_EVENT, handleHomeReset);

    if (consumeHomeResetFlag()) {
      resetHome();
    }

    return () => {
      window.removeEventListener(HOME_RESET_EVENT, handleHomeReset);
    };
  }, [resetHome]);

  return (
    <div>
      <main className="...">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          canSearch={canSearch}
          onSearch={handleSearch}
        />

        <SearchFilters
          onFiltersChange={handleFiltersChange}
          initialCategories={filterInitials.categories}
          initialFamilies={filterInitials.families}
          initialIssues={filterInitials.issues}
          initialGrades={filterInitials.grades}
          initialDurations={filterInitials.durations}
        />

        {/* 搜尋結果元件（掛在首頁） */}
        {hasSearched ? (
          <SearchResults
            query={submittedQuery}
            filters={submittedFilters}
            trigger={searchTrigger}
          />
        ) : (
          <>
            <PopularCategories
              items={popularCategories}
              loading={inspirationLoading}
              error={inspirationError}
              onSelect={handlePopularCategorySelect}
            />
            <StartHere
              items={startHereItems}
              loading={inspirationLoading}
              error={inspirationError}
            />
          </>
)}
      </main>

      <Toast
        open={open && !!toast}
        type={toast?.type}
        title={toast?.title ?? ''}
        message={toast?.message}
        timeout={toast?.timeout ?? 5000}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
