import { FilterOptions } from './filter';

export interface SearchBarProps {
    onFilterChange: (type: string, value: string) => void;
    filters: FilterOptions;
    onSearch: (params: { keyword: string; author: string }) => void;
    isSearching: boolean;
    keyword: string;
    setKeyword: (value: string) => void;
    author: string;
    setAuthor: (value: string) => void;
}

export interface SearchParams {
    filters: FilterOptions;
    keyword?: string;
    author?: string;
    teamHash?: string;
}

export interface SearchResponse {
    status: string;
    data: TeachingPlan[];
    count: number;
}

export interface TeachingPlan {
    id: string;
    team: string;
    semester: string;
    writer_name: string;
    category: string;          // 原始類別名稱，例如「傳播」
    category_group?: string;   // 正規化後的群組標籤（自然、社會、…、其他）
    tp_name: string;
    grade: string;
    duration: string;
    objectives: string;
    outline: string;
    completion_notes?: string;
    slide_pdf: string;
    content?: string;
}
