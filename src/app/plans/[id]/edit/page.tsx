'use client';

import { useEffect, useRef, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import TeachingPlanEditor, { TeachingPlanEditorRef } from '@/features/teaching-plan/TeachingPlanEditor';
import { TeachingPlan } from '@/types/api';
import { api } from '@/lib/api';
import { DURATION_MAP, DURATION_INVERSE_MAP } from '@/lib/constants';
import { updateManageCachesAfterEdit } from '@/features/manage/cache';
import Link from 'next/link';

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

export default function EditTeachingPlanPage() {
  const params = useParams<{ id: string }>();
  const planId = params?.id;
  const router = useRouter();
  const editorRef = useRef<TeachingPlanEditorRef>(null);
  const { toast } = useToast();

  const [plan, setPlan] = useState<TeachingPlan | null>(null);
  // 教案一旦進入驗收就不能從這裡改，改動要走「本期教案」的修改版流程。
  // 判準是「有沒有進過驗收流程」而不是 editing_status——歷屆教案在 migration 0012
  // 被回填成 locked，那是「歷屆已通過」，不是正在驗收。
  const [inReviewPipeline, setInReviewPipeline] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [slideAction, setSlideAction] = useState<'none' | 'upload' | 'remove'>('none');
  const [selectedSlideFile, setSelectedSlideFile] = useState<File | null>(null);

  useEffect(() => {
    if (!planId) return;
    let mounted = true;

    (async () => {
      try {
        const { data } = await api.get<{ in_review_pipeline?: boolean }>(
          `/teaching-plan/detail/${planId}`
        );
        if (!mounted) return;
        setPlan(normalizePlan(data));
        setInReviewPipeline(!!data?.in_review_pipeline);
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

  if (inReviewPipeline) {
    return (
      <main className="min-h-screen flex flex-col items-center py-16">
        <div className="w-full max-w-[640px] rounded-lg bg-white px-8 py-10 text-center shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <h1 className="font-['Noto_Sans_TC'] text-[22px] font-bold text-black-900">
            本期教案已進入驗收
          </h1>
          <p className="mt-3 font-['Noto_Sans_TC'] text-[15px] leading-[170%] text-black-700">
            送出驗收後這頁不能再編輯——驗收看的是送出當下凍結的版本，
            在這裡改不會影響已經在跑的驗收，只會讓兩邊對不起來。
            <br />
            要處理回饋或上傳總驗修改版，請到「本期教案」。
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button
              type="button"
              onClick={() => router.back()}
              className="h-[44px] w-[140px] rounded-[8px] border border-primary-900 bg-white text-primary-900 hover:cursor-pointer"
            >
              返回
            </button>
            <Link
              href="/review/my-plans"
              className="flex h-[44px] w-[160px] items-center justify-center rounded-[8px] bg-primary-900 font-bold text-white"
            >
              前往本期教案
            </Link>
          </div>
        </div>
      </main>
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
        onSheetReupload={() => router.push(`/upload?replacePlanId=${planId}`)}
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
