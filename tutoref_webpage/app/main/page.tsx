'use client'
import { useState } from 'react';
import Head from 'next/head';
import Image from "next/image"

import { initialFilters, FilterOptions } from '../../types/filter';
import HeaderMenu from '../../components/layout/headerMenu';
import ResultTable from '../../components/layout/resultTable';
import SearchBar from '../../components/layout/searchBar';

import logo from '../../public/logo.png';

export default function SearchPage() {
  const [filters, setFilters] = useState<FilterOptions>(initialFilters);

  const handleFilterChange = (type: string, value: string) => {
    setFilters((prev) => {
      const currentValues = prev[type as keyof FilterOptions];
      const newValues = currentValues.includes(value)
        ? currentValues.filter((item) => item !== value)
        : [...currentValues, value];
      return { ...prev, [type]: newValues };
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Head>
        <title>教案檢索系統</title>
      </Head>

      <HeaderMenu />

      <main className="max-w-4xl mx-auto p-4">
        <div className="mb-4 flex justify-center">
          <Image src={logo} alt="教案檢索系統圖片" className="w-auto " />
        </div>
        <SearchBar onFilterChange={handleFilterChange} filters={filters} />
        <ResultTable filters={filters} />
      </main>
    </div>
  );
}