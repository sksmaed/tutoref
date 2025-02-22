import { DURATION_INVERSE_MAP } from '@/lib/constant';
import { SearchParams, SearchResponse } from '@/types/api';
import dotenv from 'dotenv';

dotenv.config();

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

export async function searchTeachingPlans(params: SearchParams): Promise<SearchResponse> {
  try {
    const mappedParams = {
      team: params.filters.team,
      semester: params.filters.semester,
      category: params.filters.category,
      grade: params.filters.grade,
      duration: params.filters.duration.map(d => DURATION_INVERSE_MAP[d]).filter(n => n !== undefined),
      keyword: params.keyword,
      writer_name: params.author,
      teamHash: params.teamHash,
    };

    const response = await fetch(`${BACKEND_URL}/api/search`, {
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
    console.error('Error searching teaching plans:', error);
    throw error;
  }
}