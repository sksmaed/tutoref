'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import TeachingPlanEditor, { TeachingPlanEditorRef } from '@/components/layout/TeachingPlanEditor';
import { TeachingPlan } from '@/types/api';
import { api } from '@/lib/api';
import { DURATION_MAP, DURATION_INVERSE_MAP } from '@/lib/constant';

const MY_PLANS_CACHE_KEY = 'manage:myPlansCache:v1';
const MY_LIKES_CACHE_KEY = 'manage:myLikesCache:v1';
const MINE_PLANS_CACHE_KEY = 'plansMine:rowsCache:v1';

type ManageCachedRow = {
  id: string;
  family: string;
  issue: string;
  category: string;
  title: string;
  author: string;
  liked?: boolean;
  good?: boolean;
  grade?: string;
  duration?: number;
  hashtags?: string[];
};

type MineCachedRow = {
  id: string;
  family: string;
  issue: string;
  category: string;
  title: string;
  author: string;
  good?: boolean;
  liked?: boolean;
  grade?: string;
  duration?: number;
  viewCount?: number;
  searchScore?: number;
  createdAt?: number;
  hashtags?: string[];
};

const readSessionJson = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
};

const writeSessionJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(key, JSON.stringify(value));
};

const normalizePlan = (detail: any): TeachingPlan => {
  const semester = `${detail?.academic_year ?? ''}${detail?.semester_period ?? ''}`;
  return {
    id: String(detail?.id ?? ''),
    team: detail?.team ?? '',
    semester,
    writer_name: detail?.writer_name ?? '',
    category: detail?.category ?? '',
    tp_name: detail?.tp_name ?? '',
    grade: detail?.grade ?? '',
    duration: DURATION_MAP[detail?.duration] ?? `${detail?.duration ?? ''}分鐘`,
    objectives: detail?.objectives ?? '',
    outline: detail?.outline ?? '',
    completion_notes: detail?.post_class_notes ?? '',
    sheet_pdf: detail?.sheet_pdf ?? '',
    slide_pdf: detail?.slide_pdf ?? '',
    content: detail?.content ?? '',
  };
};

const toPatchPayload = (plan: TeachingPlan) => {
  const semester = plan.semester ?? '';
  const duration = (() => {
    if (typeof plan.duration === 'number') {
      return plan.duration;
    }
    const mapped = DURATION_INVERSE_MAP[plan.duration as keyof typeof DURATION_INVERSE_MAP];
    if (typeof mapped === 'number') {
      return mapped;
    }
    const parsed = parseInt(plan.duration.replace(/[^0-9]/g, ''), 10);
    return Number.isFinite(parsed) ? parsed : 0;
  })();

  return {
    tp_name: plan.tp_name,
    writer_name: plan.writer_name,
    team: plan.team,
    category: plan.category,
    grade: plan.grade,
    objectives: plan.objectives,
    outline: plan.outline,
    content: plan.content ?? '',
    post_class_notes: plan.completion_notes ?? '',
    academic_year: semester.slice(0, 2),
    semester_period: semester.slice(2) || '冬',
    duration,
  };
};

const mapDetailToManageRow = (detail: any): ManageCachedRow => ({
  id: String(detail?.id ?? ''),
  family: detail?.team ?? '',
  issue: `${detail?.academic_year ?? ''}${detail?.semester_period ?? ''}`.trim(),
  category: detail?.category ?? '',
  title: detail?.tp_name ?? '',
  author: detail?.writer_name ?? '',
  good: Boolean(detail?.is_excellent),
  grade: detail?.grade ?? '',
  duration: typeof detail?.duration === 'number' ? detail.duration : undefined,
  hashtags: Array.isArray(detail?.hashtags) ? detail.hashtags : [],
});

const mapDetailToMineRow = (detail: any): MineCachedRow => ({
  id: String(detail?.id ?? ''),
  family: detail?.team ?? '',
  issue: `${detail?.academic_year ?? ''}${detail?.semester_period ?? ''}`.trim(),
  category: detail?.category ?? '',
  title: detail?.tp_name ?? '',
  author: detail?.writer_name ?? '',
  good: Boolean(detail?.is_excellent),
  liked: false,
  grade: detail?.grade ?? '',
  duration: typeof detail?.duration === 'number' ? detail.duration : undefined,
  viewCount: typeof detail?.view_count === 'number' ? detail.view_count : undefined,
  createdAt: detail?.created_at ? Date.parse(String(detail.created_at)) : undefined,
  hashtags: Array.isArray(detail?.hashtags) ? detail.hashtags : [],
});

const updateManageCachesAfterEdit = (detail: any) => {
  const nextRow = mapDetailToManageRow(detail);
  const nextMineRow = mapDetailToMineRow(detail);
  if (!nextRow.id) return;

  const cachedMyPlans = readSessionJson<ManageCachedRow[]>(MY_PLANS_CACHE_KEY);
  if (Array.isArray(cachedMyPlans)) {
    const nextMyPlans = cachedMyPlans.map((item) =>
      item.id === nextRow.id ? { ...item, ...nextRow } : item,
    );
    writeSessionJson(MY_PLANS_CACHE_KEY, nextMyPlans);
  }

  const cachedMyLikes = readSessionJson<ManageCachedRow[]>(MY_LIKES_CACHE_KEY);
  if (Array.isArray(cachedMyLikes)) {
    const nextMyLikes = cachedMyLikes.map((item) =>
      item.id === nextRow.id ? { ...item, ...nextRow, liked: true } : item,
    );
    writeSessionJson(MY_LIKES_CACHE_KEY, nextMyLikes);
  }

  const cachedMinePlans = readSessionJson<MineCachedRow[]>(MINE_PLANS_CACHE_KEY);
  if (Array.isArray(cachedMinePlans)) {
    const nextMinePlans = cachedMinePlans.map((item) =>
      item.id === nextMineRow.id ? { ...item, ...nextMineRow } : item,
    );
    writeSessionJson(MINE_PLANS_CACHE_KEY, nextMinePlans);
  }
};

export default function EditTeachingPlanPage() {
  const params = useParams<{ id: string }>();
  const planId = params?.id;
  const router = useRouter();
  const editorRef = useRef<TeachingPlanEditorRef>(null);
  const { toast } = useToast();

  const [plan, setPlan] = useState<TeachingPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slideAction, setSlideAction] = useState<'none' | 'upload' | 'remove'>('none');
  const [selectedSlideFile, setSelectedSlideFile] = useState<File | null>(null);

  useEffect(() => {
    if (!planId) return;
    let mounted = true;

    (async () => {
      try {
        const { data } = await api.get(`/teaching-plan/detail/${planId}`);
        if (!mounted) return;
        setPlan(normalizePlan(data));
        setSlideAction('none');
        setSelectedSlideFile(null);
      } catch (error: any) {
        toast({
          title: '❌ 載入失敗',
          description: error?.message || '無法載入教案資料，請稍後再試。',
          variant: 'destructive',
        });
        router.replace('/plans/mine');
      } finally {
        if (mounted) setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [planId, router, toast]);

  const handleSubmit = async (updatedPlan: TeachingPlan) => {
    if (!planId) return;
    setSaving(true);
    try {
      const payload = toPatchPayload(updatedPlan);
      const { data } = await api.patch(`/teaching-plan/detail/${planId}`, payload);
      setPlan(normalizePlan(data));

      if (slideAction === 'upload' && selectedSlideFile) {
        const formData = new FormData();
        formData.append('slides_pdf', selectedSlideFile);
        await api.post(`/teaching-plan/detail/${planId}/slides`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        setPlan((prev) => (prev ? { ...prev, slide_pdf: selectedSlideFile.name } : prev));
      } else if (slideAction === 'remove') {
        await api.delete(`/teaching-plan/detail/${planId}/slides`);
        setPlan((prev) => (prev ? { ...prev, slide_pdf: '' } : prev));
      }

      updateManageCachesAfterEdit(data);

      toast({
        title: '✅ 教案已更新',
        description: '教案內容已成功儲存。',
      });
      router.push('/plans/mine');
    } catch (error: any) {
      toast({
        title: '❌ 更新失敗',
        description: error?.message || '儲存時發生錯誤，請稍後再試。',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
      setSlideAction('none');
      setSelectedSlideFile(null);
    }
  };

  const handleSlideFileSelect = (file: File | null) => {
    if (file) {
      setSelectedSlideFile(file);
      setSlideAction('upload');
    } else {
      setSelectedSlideFile(null);
      setSlideAction('remove');
      setPlan((prev) => (prev ? { ...prev, slide_pdf: '' } : prev));
    }
  };

  if (loading || !plan) {
    return (
      <div className="flex min-h-screen items-center justify-center text-black-700">
        資料載入中...
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-black-50 py-16 flex flex-col items-center">
      <h1 className="text-[40px] font-bold text-black-900 mb-8">編輯教案</h1>
      <TeachingPlanEditor
        ref={editorRef}
        plan={plan}
        onSave={handleSubmit}
        onCancel={() => router.back()}
        onSlideFileSelect={handleSlideFileSelect}
      />
      <div className="mt-6 flex gap-4">
        <button
          type="button"
          className="w-[160px] h-[48px] rounded-[8px] border border-primary-900 text-primary-900 bg-white hover:cursor-pointer disabled:cursor-not-allowed"
          onClick={() => router.back()}
          disabled={saving}
        >
          取消編輯
        </button>
        <button
          type="button"
          className="w-[160px] h-[48px] rounded-[8px] bg-primary-900 text-white hover:cursor-pointer disabled:cursor-not-allowed"
          onClick={() => editorRef.current?.save()}
          disabled={saving}
        >
          編輯完成
        </button>
      </div>
    </main>
  );
}
