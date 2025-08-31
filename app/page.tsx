'use client';
import { useEffect, useState } from 'react';
import { popFlash, Flash } from '@/utils/flash';
import { Toast } from '@/components/ui/toast';
import SearchBar from '@/components/ui/SearchBar';
import SearchFilters from '@/components/ui/SearchFilters';
import PopularCategories from '@/components/ui/PopularCategories';
import StartHere from '@/components/ui/StartHere';

export default function Home() {
  const [toast, setToast] = useState<Flash | null>(null);
  const [open, setOpen] = useState(false);

  const [query, setQuery] = useState('');
  const [hasFilters, setHasFilters] = useState(false);

  const canSearch = query.trim().length > 0 || hasFilters;


  useEffect(() => {
    const f = popFlash();
    if (f) {
      setToast(f);
      setOpen(true);
    }
  }, []);

  return (
    <div>
      {/* 你的首頁內容 ... */}
      <main className="...">
        <SearchBar
          query={query}
          onQueryChange={setQuery}
          canSearch={canSearch}
          onSearch={() => {
            // TODO: 串你的搜尋邏輯（push 到 /search? ...）
            console.log('搜尋', { query });
          }}
        />
        <SearchFilters
          onFiltersChange={({ hasAny }) => setHasFilters(hasAny)}
        />
        <PopularCategories />
        <StartHere />
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
