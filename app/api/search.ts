import { DURATION_INVERSE_MAP, DURATION_MAP } from '@/lib/constant';
import { normalizeCategory } from '@/lib/categories';
import { SearchParams, SearchResponse, TeachingPlan } from '@/types/api';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
const API_PREFIX = BACKEND_URL ? `${BACKEND_URL}/api/v2/teaching-plan` : '';

type BackendSearchPayload = {
  search_texts?: string[];
  team?: string[];
  academic_year?: string[];
  semester_period?: string[];
  category?: string[];
  grade?: string[];
  duration?: number[];
};

type BackendSearchResponse = {
  status: string;
  data: BackendTeachingPlan[];
  count: number;
  source?: string;
};

type BackendTeachingPlan = {
  id: string;
  tp_name: string;
  writer_name: string;
  team: string;
  academic_year: string;
  semester_period: string;
  category: string;
  grade: string;
  duration: number;
  objectives: string;
  outline: string;
  content?: string;
  post_class_notes?: string;
  is_excellent: boolean;
  slide_pdf?: string | null;
  created_at: string;
  updated_at: string;
};

const toSearchPayload = ({ filters, keyword, author }: SearchParams): BackendSearchPayload => {
  const payload: BackendSearchPayload = {};

  const searchTexts = [keyword, author].map(text => text?.trim()).filter(Boolean) as string[];
  if (searchTexts.length) {
    payload.search_texts = searchTexts;
  }

  if (filters.team.length) {
    payload.team = filters.team;
  }

  if (filters.semester.length) {
    // 後端會解析帶有「夏/冬」的值，因此直接用 academic_year 欄位承載
    payload.academic_year = filters.semester;
  }

  if (filters.category.length) {
    payload.category = filters.category;
  }

  if (filters.grade.length) {
    payload.grade = filters.grade;
  }

  if (filters.duration.length) {
    const durations = filters.duration
      .map(label => DURATION_INVERSE_MAP[label])
      .filter((value): value is number => typeof value === 'number');
    if (durations.length) {
      payload.duration = durations;
    }
  }

  return payload;
};

const toFrontendTeachingPlan = (plan: BackendTeachingPlan): TeachingPlan => {
  const semester = `${plan.academic_year ?? ''}${plan.semester_period ?? ''}`;
  const durationLabel = DURATION_MAP[plan.duration] ?? `${plan.duration}分鐘`;

  return {
    id: plan.id,
    team: plan.team ?? '',
    semester,
    writer_name: plan.writer_name ?? '',
    category: plan.category ?? '',
    category_group: normalizeCategory(plan.category),
    tp_name: plan.tp_name ?? '',
    grade: plan.grade ?? '',
    duration: durationLabel,
    objectives: plan.objectives ?? '',
    outline: plan.outline ?? '',
    completion_notes: plan.post_class_notes ?? '',
    slide_pdf: plan.slide_pdf ?? '',
    content: plan.content ?? '',
  };
};

export async function searchTeachingPlans(params: SearchParams): Promise<SearchResponse> {
  if (!API_PREFIX) {
    throw new Error('後端網址未設定（NEXT_PUBLIC_BACKEND_URL）。');
  }

  const payload = toSearchPayload(params);

  const response = await fetch(`${API_PREFIX}/search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    credentials: 'include',
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`搜尋失敗：HTTP ${response.status} ${response.statusText} — ${text.slice(0, 200)}`);
  }

  const data = (await response.json()) as BackendSearchResponse;
  const converted: TeachingPlan[] = Array.isArray(data?.data)
    ? data.data.map(toFrontendTeachingPlan)
    : [];

  return {
    status: data.status ?? 'success',
    data: converted,
    count: data.count ?? converted.length,
  };
}
