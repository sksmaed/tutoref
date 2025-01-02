import { SearchParams, SearchResponse } from '@/types/api';

export async function searchTeachingPlans(params: SearchParams): Promise<SearchResponse> {
  try {
    const mappedParams = {
      semester: params.filters.semester,
      category: params.filters.category,
      duration: params.filters.duration,
      grade: params.filters.grade,
      keyword: params.keyword,
      writer_name: params.author,
    };

    const response = await fetch('http://localhost:8000/api/search', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(mappedParams),
    });

    if (!response.ok) {
      throw new Error('搜尋失敗');
    }

    const data: SearchResponse = await response.json();
    return data;
  } catch (error) {
    console.error('搜尋錯誤:', error);
    throw error;
  }
}