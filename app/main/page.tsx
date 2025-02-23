'use client'

import { Suspense, useState } from 'react';
import Head from 'next/head';
import Image from "next/image"
import { searchTeachingPlans } from '../api/search';
import { TeachingPlan } from '@/types/api';
import { initialFilters, FilterOptions } from '@/types/filter';
import HeaderMenu from '@/components/layout/headerMenu';
import ResultTable from '@/components/layout/resultTable';
import SearchBar from '@/components/layout/searchBar';
import logo from '@/public/logo.png';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toaster';
import { useSearchParams } from 'next/navigation';

export default function SearchPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <SearchPageContent />
    </Suspense>
  );
}

function SearchPageContent() {
  const searchParams = useSearchParams();
  const teamHash = searchParams.get('team') as string;

  const [filters, setFilters] = useState<FilterOptions>(initialFilters);
  const [searchResults, setSearchResults] = useState<TeachingPlan[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [keyword, setKeyword] = useState('');
  const [author, setAuthor] = useState('');
  const { toast } = useToast();

  const handleFilterChange = (type: string, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[type as keyof FilterOptions];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      return { ...prev, [type]: newValues };
    });
  };

  const handleSearch = async ({ keyword, author }: { keyword: string; author: string }) => {
    setIsSearching(true);
    try {
      const response = await searchTeachingPlans({
        filters,
        keyword,
        author,
        teamHash
      });
      setSearchResults(response.data);

      if (response.data.length === 0) {
        toast({
          title: "沒有找到結果",
          description: "試試調整搜尋條件或關鍵字。",
          duration: 3000,
        });
      }
    } catch (error) {
      console.error('搜尋錯誤:', error);
      toast({
        variant: "destructive",
        title: "搜尋失敗",
        description: "抱歉，搜尋過程中發生錯誤，請稍後再試。",
        duration: 3000,
      });
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>教案檢索系統</title>
      </Head>

      <HeaderMenu />

      <main className="max-w-4xl mx-auto p-4">
        <div className="mb-4 flex justify-center">
          <Image src={logo} alt="教案檢索系統圖片" className="w-auto" />
        </div>
        <SearchBar 
          onFilterChange={handleFilterChange} 
          filters={filters}
          onSearch={handleSearch}
          isSearching={isSearching}
          keyword={keyword}
          setKeyword={setKeyword}
          author={author}
          setAuthor={setAuthor}
        />
        <ResultTable results={searchResults}/>
        <Toaster />
      </main>
    </div>
  );
}