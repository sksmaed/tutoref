'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { popFlash, Flash } from '@/utils/flash';
import { Toast } from '@/components/ui/toast';
import SearchBar from '@/components/ui/SearchBar';
import SearchFilters from '@/components/ui/SearchFilters';
import PopularCategories, { PopularCategoryItem } from '@/components/ui/PopularCategories';
import StartHere, { StartHereItem } from '@/components/ui/StartHere';
import SearchResults from '@/components/ui/SearchResults';
import MobileFilterModal from '@/components/ui/MobileFilterModal';
import { consumeHomeResetFlag, HOME_RESET_EVENT } from '@/lib/homeReset';
import { useAuth } from '@/hooks/useAuth';

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
  { key: 'nature', label: '自然', color: '#728A47', icon: '/icons/lightening.svg' },
  { key: 'social', label: '社會', color: '#F1994A', icon: '/icons/people.svg' },
  { key: 'general', label: '綜合', color: '#7F478A', icon: '/icons/gift.svg' },
  { key: 'info', label: '資訊', color: '#6392B5', icon: '/icons/globe.svg' },
  { key: 'art', label: '藝文', color: '#C85F5F', icon: '/icons/music.svg' },
  { key: 'chinese', label: '國語', color: '#C1B349', icon: '/icons/write.svg' },
  { key: 'health', label: '健教', color: '#3D9375', icon: '/icons/smile.svg' },
  { key: 'morning', label: '晨讀', color: '#C4789A', icon: '/icons/book.svg' },
  { key: 'english', label: '英文', color: '#8E5C36', icon: '/icons/speak.svg' },
  { key: 'other', label: '其他', color: '#0D0D0D', icon: '/icons/more.svg' },
];

export default function Home() {
  const { loading, authenticated } = useAuth();
  const [toast, setToast] = useState<Flash | null>(null);
  const [open, setOpen] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

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
  const [initialSort, setInitialSort] = useState<'issue_desc' | 'issue_asc' | 'views_desc' | 'relevance_desc' | 'uploaded_desc'>('issue_desc');
  const [initialOnlyGood, setInitialOnlyGood] = useState(false);
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
    setInitialSort('issue_desc');
    setInitialOnlyGood(false);
    setHasSearched(true);
    setSearchTrigger((n) => n + 1);
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
    setInitialSort('issue_desc');
    setInitialOnlyGood(false);
    setHasSearched(true);
    setSearchTrigger((n) => n + 1);
  }, [query]);

  const handleStartHereSelect = useCallback((id: string) => {
    setSubmittedQuery('');
    setSubmittedFilters(createEmptyFilters());
    if (id === 'good') {
      setInitialSort('issue_desc');
      setInitialOnlyGood(true);
    } else if (id === 'most') {
      setInitialSort('views_desc');
      setInitialOnlyGood(false);
    } else {
      // 'latest'
      setInitialSort('uploaded_desc');
      setInitialOnlyGood(false);
    }
    setHasSearched(true);
    setSearchTrigger((n) => n + 1);
  }, []);

  const resetHome = useCallback(() => {
    setQuery('');
    setHasFilters(false);
    setFilters(createEmptyFilters());
    setSubmittedQuery('');
    setSubmittedFilters(createEmptyFilters());
    setHasSearched(false);
    setSearchTrigger(0);
  }, []);

  // 檢查 flash 訊息的函數
  const checkForFlash = useCallback(() => {
    const f = popFlash();
    if (f) {
      setToast(f);
      setOpen(true);
    }
  }, []);

  // 初始檢查 flash 訊息
  useEffect(() => {
    checkForFlash();
  }, [checkForFlash]);

  // 監聽認證狀態變化，當用戶登入後重新檢查 flash 訊息
  useEffect(() => {
    if (!loading && authenticated) {
      // 稍微延遲一下，確保 useAuth 中的 flash 設置已完成
      const timeoutId = setTimeout(checkForFlash, 200);
      return () => clearTimeout(timeoutId);
    }
  }, [loading, authenticated, checkForFlash]);

  useEffect(() => {
    if (!API_PREFIX) {
      setInspirationError('後端網址未設定（NEXT_PUBLIC_API_BASE_URL）。');
      return;
    }

    let cancelled = false;

    const load = async () => {
      setInspirationLoading(true);
      try {
        const res = await fetch(`${API_PREFIX}/stats`, { method: 'GET', credentials: 'include' });
        if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);

        const stats = await res.json() as {
          category_counts: Record<string, number>;
          excellent_count: number;
          recent_count: number;
          top_viewed: { tp_name: string; view_count: number } | null;
        };

        if (cancelled) return;

        const sortedCategories = CATEGORY_CONFIG
          .map((category) => ({
            key: category.key,
            label: category.label,
            color: category.color,
            icon: category.icon,
            count: stats.category_counts[category.label] ?? 0,
          } satisfies PopularCategoryItem))
          .sort((a, b) => b.count - a.count)
          .slice(0, 10);

        setPopularCategories(sortedCategories);

        const topCategory = sortedCategories.find((c) => c.count > 0) ?? sortedCategories[0];
        const topViewedCount = stats.top_viewed?.view_count ?? topCategory?.count ?? 0;
        const topViewedHelper = stats.top_viewed
          ? `人氣教案：「${stats.top_viewed.tp_name}」`
          : topCategory?.count
            ? `目前以「${topCategory.label}」最受歡迎`
            : undefined;

        setStartHereItems([
          { id: 'good', label: '優良教案', count: stats.excellent_count, icon: '/icons/good.svg' },
          { id: 'most', label: '最多人參考', count: topViewedCount, icon: '/icons/eye-open.svg', helperText: topViewedHelper },
          { id: 'latest', label: '最新上傳', count: stats.recent_count, icon: '/icons/time.svg', helperText: '近 30 天新增' },
        ]);

        setInspirationError(sortedCategories.some((c) => c.count > 0) ? '' : '目前無法取得熱門資料，請稍後再試。');
      } catch (error) {
        if (!cancelled) {
          console.error('[Home] Failed to load stats', error);
          setPopularCategories([]);
          setStartHereItems([]);
          setInspirationError(error instanceof Error ? error.message : '無法載入資料，請稍後再試。');
        }
      } finally {
        if (!cancelled) setInspirationLoading(false);
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
          onFilterClick={() => setMobileFilterOpen(true)}
          hasFilters={hasFilters}
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
            initialSort={initialSort}
            initialOnlyGood={initialOnlyGood}
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
              onSelect={handleStartHereSelect}
            />
          </>
)}
      </main>

      <MobileFilterModal
        isOpen={mobileFilterOpen}
        onClose={() => setMobileFilterOpen(false)}
        initial={{
          categories: filters.categories,
          families: filters.families,
          issues: filters.issues,
          grades: filters.grades,
          durations: filters.durations,
        }}
        onApply={(mobileFilters) => {
          setFilters((prev) => ({
            ...prev,
            categories: mobileFilters.categories,
            families: mobileFilters.families,
            issues: mobileFilters.issues,
            grades: mobileFilters.grades,
            durations: mobileFilters.durations,
          }));
          setHasFilters(
            mobileFilters.categories.size > 0 ||
            mobileFilters.families.size > 0 ||
            mobileFilters.issues.size > 0 ||
            mobileFilters.grades.size > 0 ||
            mobileFilters.durations.size > 0
          );
          setSubmittedFilters((prev) => ({
            ...prev,
            categories: mobileFilters.categories,
            families: mobileFilters.families,
            issues: mobileFilters.issues,
            grades: mobileFilters.grades,
            durations: mobileFilters.durations,
          }));
          setHasSearched(true);
          setSearchTrigger((n) => n + 1);
        }}
      />

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
