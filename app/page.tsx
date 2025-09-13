'use client';
import { useCallback, useState, useEffect } from 'react';
import { popFlash, Flash } from '@/utils/flash';
import { Toast } from '@/components/ui/toast';
import SearchBar from '@/components/ui/SearchBar';
import SearchFilters from '@/components/ui/SearchFilters';
import PopularCategories from '@/components/ui/PopularCategories';
import StartHere from '@/components/ui/StartHere';
import SearchResults from '@/components/ui/SearchResults';

export default function Home() {
  const [toast, setToast] = useState<Flash | null>(null);
  const [open, setOpen] = useState(false);

  // 搜尋與篩選狀態
  const [query, setQuery] = useState('');
  const [hasFilters, setHasFilters] = useState(false);
  const [filters, setFilters] = useState<{
    categories: Set<string>;
    families: Set<string>;
    issues: Set<string>;
    grades: Set<string>;
    durations: Set<string>;
  }>({
    categories: new Set(),
    families:   new Set(),
    issues:     new Set(),
    grades:     new Set(),
    durations:  new Set(),
  });

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

  const handleSearch = useCallback(() => {
    if (!canSearch) return;
    setHasSearched(true);                 // ⬅️ 顯示結果、隱藏靈感區
    setSearchTrigger((n) => n + 1);       // 觸發 SearchResults 做一次搜尋
  }, [canSearch]);

  useEffect(() => {
    const f = popFlash();
    if (f) {
      setToast(f);
      setOpen(true);
    }
  }, []);

  return (
    <div>
      <main className="...">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          canSearch={canSearch}
          onSearch={handleSearch}
        />

        <SearchFilters onFiltersChange={handleFiltersChange} />

        {/* 搜尋結果元件（掛在首頁） */}
        {hasSearched ? (
          <SearchResults
            query={query}
            filters={filters}
            trigger={searchTrigger}
          />
        ) : (
          <>
            <PopularCategories />
            <StartHere />
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
