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
    id: number;
    team: string;
    semester: string;
    writer_name: string;
    category: string;
    tp_name: string;
    grade: string;
    duration: number;
    staffing: string;
    venue: string;
    objectives: string;
    outline: string;
    sheet_docx: string;
    sheet_pdf: string;
    slide_pptx: string;
    slide_pdf: string;
    is_open: boolean;
}