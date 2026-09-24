'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { TeachingPlan } from '@/types/api';
import { TeachingPlanEditorRef } from '@/features/teaching-plan/TeachingPlanEditor';
import { useToast } from '@/hooks/use-toast';
import { setFlash } from '@/lib/flash';
import { CSRF_HEADER_NAME, ensureCsrfToken } from '@/lib/csrf';
import { updateManageCachesAfterEdit } from '@/features/manage/cache';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { normalizeTeachingPlan, splitSemester, toUpdatePayload, toCreatePayload } from './transformers';
import type { UploadMode } from './types';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_PREFIX = BACKEND_URL ? `${BACKEND_URL}/teaching-plan` : '';

/**
 * 上傳教案頁的完整流程狀態機（自原 page 抽出，邏輯不變）：
 * 選檔 → 解析（/extract）→ 預覽 ↔ 編輯（PATCH /detail）→ 確認上傳（/upload-file）。
 * 也支援 ?planId= 載入既有教案進行編輯。
 */
export function useUploadFlow() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const planIdFromQuery = searchParams?.get('planId');
  const replacePlanIdFromQuery = searchParams?.get('replacePlanId');
  const isReplacingSheet = Boolean(replacePlanIdFromQuery);
  const isCreatingPlan = !planIdFromQuery && !replacePlanIdFromQuery;
  const [uploadMode, setUploadMode] = useState<UploadMode | null>(null);
  const [parsedPlans, setParsedPlans] = useState<TeachingPlan[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [showPreview, setShowPreview] = useState(false); // 顯示預覽表格
  const [showEditor, setShowEditor] = useState(false); // 顯示編輯表格
  const [isValid, setIsValid] = useState(true); // 新增驗證狀態
  const [showCancelConfirm, setShowCancelConfirm] = useState(false); // 顯示取消編輯確認對話框
  const [showErrorModal, setShowErrorModal] = useState(false); // 顯示檔案格式錯誤 modal
  const [persistentSlideFile, setPersistentSlideFile] = useState<string>(''); // 持久化的slide檔案名稱
  const [preEditSlideFile, setPreEditSlideFile] = useState<string>(''); // 編輯前的slide檔案狀態，用於取消編輯時恢復
  const [slidePdfFile, setSlidePdfFile] = useState<File | null>(null); // 儲存選中的PDF檔案對象
  const [tempFileId, setTempFileId] = useState<string>('');
  const [replacementBasePlan, setReplacementBasePlan] = useState<TeachingPlan | null>(null);
  const editorRef = useRef<TeachingPlanEditorRef>(null);
  const loadedPlanIdRef = useRef<string | null>(null);
  const { toast } = useToast();
  const { context: termContext, loading: currentTermLoading, error: currentTermError } = useTermContext();
  const currentTerm = termContext?.current_term ?? null;
  const uploadModeModalOpen = isCreatingPlan && uploadMode === null;

  const handleSelectUploadMode = (mode: UploadMode) => {
    if (mode === 'current' && !currentTerm) return;
    setUploadMode(mode);
  };

  const handleCancelUploadMode = () => {
    router.push('/manage');
  };

  const currentPlan = useMemo(() => {
    if (!parsedPlans.length) return null;
    const [firstPlan] = parsedPlans;
    return {
      ...firstPlan,
      slide_pdf: persistentSlideFile,
      slide_pdf_file: slidePdfFile
    } as TeachingPlan;
  }, [parsedPlans, persistentSlideFile, slidePdfFile]);

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      setUploadedFile(null);
      setParsedPlans([]);
      setShowPreview(false);
      setShowEditor(false);
      setPersistentSlideFile('');
      setPreEditSlideFile('');
      setSlidePdfFile(null);
      setTempFileId('');
      loadedPlanIdRef.current = null;
      return;
    }

    loadedPlanIdRef.current = null;
    setUploadedFile(file);
    setParsedPlans([]);
    setShowPreview(false);
    setShowEditor(false);
    setPersistentSlideFile('');
    setPreEditSlideFile('');
    setSlidePdfFile(null);
    setTempFileId('');
  };

  useEffect(() => {
    if (!API_PREFIX || !planIdFromQuery || isReplacingSheet) {
      return;
    }

    if (loadedPlanIdRef.current === planIdFromQuery) {
      return;
    }

    loadedPlanIdRef.current = planIdFromQuery;

    const fetchExistingPlan = async () => {
      setIsUploading(true);
      try {
        const res = await fetch(`${API_PREFIX}/detail/${planIdFromQuery}`, {
          method: 'GET',
          credentials: 'include',
        });

        const contentType = res.headers.get('content-type') || '';
        const raw = await res.text();

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText} — ${raw.slice(0, 200)}`);
        }

        if (!contentType.includes('application/json')) {
          throw new Error(`Unexpected content-type: ${contentType} — ${raw.slice(0, 200)}`);
        }

        const detail = JSON.parse(raw);
        const normalizedPlan = normalizeTeachingPlan(detail);
        setParsedPlans([normalizedPlan]);
        setTempFileId('');
        setUploadedFile(null);
        const slide = normalizedPlan.slide_pdf ?? '';
        setPersistentSlideFile(slide);
        setPreEditSlideFile(slide);
        setSlidePdfFile(null); // 現有教案沒有檔案對象
        setShowPreview(true);
        setShowEditor(false);
        setIsValid(true);

        toast({
          title: '已載入教案',
          description: '可直接編輯內容或更新資料。',
        });
      } catch (error: any) {
        console.error('Load plan error:', error);
        toast({
          title: '❌ 載入失敗',
          description: String(error?.message || '無法載入教案，請稍後再試。'),
          variant: 'destructive',
        });
        loadedPlanIdRef.current = null;
      } finally {
        setIsUploading(false);
      }
    };

    fetchExistingPlan();
  }, [API_PREFIX, isReplacingSheet, planIdFromQuery, toast]);

  useEffect(() => {
    if (!API_PREFIX || !replacePlanIdFromQuery) {
      setReplacementBasePlan(null);
      return;
    }

    let mounted = true;
    const fetchReplacementBase = async () => {
      setIsUploading(true);
      try {
        const res = await fetch(`${API_PREFIX}/detail/${replacePlanIdFromQuery}`, {
          method: 'GET',
          credentials: 'include',
        });
        const contentType = res.headers.get('content-type') || '';
        const raw = await res.text();

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText} — ${raw.slice(0, 200)}`);
        }
        if (!contentType.includes('application/json')) {
          throw new Error(`Unexpected content-type: ${contentType} — ${raw.slice(0, 200)}`);
        }

        const detail = JSON.parse(raw);
        if (detail?.in_review_pipeline) {
          throw new Error('這份教案已進入驗收，請到「本期教案」上傳修改版。');
        }
        if (mounted) {
          setReplacementBasePlan(normalizeTeachingPlan(detail));
        }
      } catch (error: any) {
        console.error('Load replacement base error:', error);
        toast({
          title: '❌ 無法重新上傳',
          description: String(error?.message || '無法載入原教案，請稍後再試。'),
          variant: 'destructive',
        });
        router.replace(`/plans/${replacePlanIdFromQuery}/edit`);
      } finally {
        if (mounted) setIsUploading(false);
      }
    };

    fetchReplacementBase();
    return () => {
      mounted = false;
    };
  }, [replacePlanIdFromQuery, router, toast]);

  const handleSubmit = async () => {
    if (!uploadedFile) return;

    if (isCreatingPlan && !uploadMode) {
      toast({
        title: '請先選擇上傳方式',
        description: '請選擇上傳本期教案或歸檔過去教案。',
        variant: 'destructive',
      });
      return;
    }

    if (uploadedFile.type !== 'application/pdf' && !uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      setShowErrorModal(true);
      return;
    }

    if (!API_PREFIX) {
      console.error('NEXT_PUBLIC_API_BASE_URL 未設定');
      toast({
        title: '❌ 設定錯誤',
        description: '後端網址未設定（NEXT_PUBLIC_API_BASE_URL）。',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const csrfToken = await ensureCsrfToken();
      const res = await fetch(`${API_PREFIX}/extract`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : undefined,
      });

      const contentType = res.headers.get('content-type') || '';
      const raw = await res.text();

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} — ${raw.slice(0, 200)}`);
      }

      if (!contentType.includes('application/json')) {
        throw new Error(`Unexpected content-type: ${contentType} — ${raw.slice(0, 200)}`);
      }

      const data = JSON.parse(raw);
      if (!data?.temp_file_id) {
        throw new Error('解析成功但未取得暫存檔 ID');
      }

      const extractedPlan =
        uploadMode === 'current' && currentTerm
          ? {
              ...data,
              academic_year: currentTerm.academic_year,
              semester_period: currentTerm.semester_period,
            }
          : data;
      const normalizedPlan = normalizeTeachingPlan({
        ...extractedPlan,
        ...(isReplacingSheet && replacementBasePlan
          ? {
              id: replacePlanIdFromQuery,
              post_class_notes: replacementBasePlan.completion_notes ?? '',
              sheet_pdf: replacementBasePlan.sheet_pdf ?? '',
              slide_pdf: replacementBasePlan.slide_pdf ?? '',
            }
          : {}),
      });
      setParsedPlans([normalizedPlan]);
      setTempFileId(data.temp_file_id);

      const firstSlide = normalizedPlan?.slide_pdf ?? '';
      setPersistentSlideFile(firstSlide);
      setPreEditSlideFile(firstSlide);
      setSlidePdfFile(null); // 初始解析時沒有額外的PDF檔案
      setShowPreview(true);
      setShowEditor(false);

      toast({
        title: '✅ 解析成功',
        description: '教案內容已擷取，請確認或編輯後再上傳。',
      });
    } catch (error: any) {
      console.error('Upload error:', error);
      toast({
        title: '❌ 上傳失敗',
        description: String(error?.message || '請稍後再試。'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleEditorSave = async (updatedPlan: TeachingPlan) => {
    const applyLocalUpdate = (planData: any) => {
      const normalized = normalizeTeachingPlan(planData);

      // 若後端未回傳 slide_pdf 但本地有已選檔案名稱，保持本地名稱
      const finalSlidePdf = normalized.slide_pdf || updatedPlan.slide_pdf || persistentSlideFile || '';
      normalized.slide_pdf = finalSlidePdf;
      console.log('Slide PDF updated:', finalSlidePdf);

      setParsedPlans(prev => {
        if (!prev || prev.length === 0) {
          return [normalized];
        }
        const exists = prev.some(plan => plan.id === normalized.id);
        if (!exists) {
          return [normalized, ...prev];
        }
        return prev.map(plan => (plan.id === normalized.id ? normalized : plan));
      });

      setPersistentSlideFile(finalSlidePdf);
      setPreEditSlideFile(finalSlidePdf);
      // 保持使用者剛選擇的檔案物件（未確認前不清掉）
      if (updatedPlan.slide_pdf_file) {
        setSlidePdfFile(updatedPlan.slide_pdf_file);
      }

      setShowEditor(false);
      setShowPreview(true);
      setShowCancelConfirm(false);
    };

    if (!updatedPlan?.id || isReplacingSheet) {
      // 新教案與教案紙替換都等到最後確認才一次寫入後端。
      applyLocalUpdate(updatedPlan);
      toast({
        title: '✅ 編輯完成',
        description: '內容已更新，請確認後完成上傳。',
      });
      return;
    }

    if (!API_PREFIX) {
      console.error('NEXT_PUBLIC_API_BASE_URL 未設定');
      toast({
        title: '❌ 設定錯誤',
        description: '後端網址未設定（NEXT_PUBLIC_API_BASE_URL）。',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      // 如果有新的投影片檔案，使用 FormData 上傳
      if (updatedPlan.slide_pdf_file) {
        const formData = new FormData();
        const payload = toUpdatePayload(updatedPlan);

        // 添加所有教案資料到 FormData
        Object.entries(payload).forEach(([key, value]) => {
          formData.append(key, value != null ? String(value) : '');
        });

        // 添加投影片檔案
        formData.append('slide_pdf_file', updatedPlan.slide_pdf_file);

        const csrfToken = await ensureCsrfToken();
        const res = await fetch(`${API_PREFIX}/detail/${updatedPlan.id}`, {
          method: 'PATCH',
          credentials: 'include',
          body: formData,
          headers: csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : undefined,
        });

        const contentType = res.headers.get('content-type') || '';
        const raw = await res.text();

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText} — ${raw.slice(0, 200)}`);
        }

        if (!contentType.includes('application/json')) {
          throw new Error(`Unexpected content-type: ${contentType} — ${raw.slice(0, 200)}`);
        }

        const detail = JSON.parse(raw);
        applyLocalUpdate(detail);
      } else {
        // 沒有新檔案時，使用 JSON 更新
        const payload = toUpdatePayload(updatedPlan);
        const csrfToken = await ensureCsrfToken();
        const res = await fetch(`${API_PREFIX}/detail/${updatedPlan.id}`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            ...(csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : {}),
          },
          credentials: 'include',
          body: JSON.stringify(payload),
        });

        const contentType = res.headers.get('content-type') || '';
        const raw = await res.text();

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText} — ${raw.slice(0, 200)}`);
        }

        if (!contentType.includes('application/json')) {
          throw new Error(`Unexpected content-type: ${contentType} — ${raw.slice(0, 200)}`);
        }

        const detail = JSON.parse(raw);
        applyLocalUpdate(detail);
      }

      toast({
        title: '✅ 編輯成功',
        description: '教案內容已更新。',
      });
    } catch (error: any) {
      console.error('Update error:', error);
      toast({
        title: '❌ 編輯失敗',
        description: String(error?.message || '請稍後再試。'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handleValidationChange = (valid: boolean) => {
    setIsValid(valid);
  };

  const handleEditorCancel = () => {
    setShowCancelConfirm(true);
  };

  const handleConfirmCancel = () => {
    setPersistentSlideFile(preEditSlideFile);
    setSlidePdfFile(null); // 取消編輯時重置檔案選擇
    setShowEditor(false);
    setShowPreview(true);
    setShowCancelConfirm(false);
  };

  const handleContinueEditing = () => {
    setShowCancelConfirm(false);
  };

  const handlePreviewEdit = () => {
    setPreEditSlideFile(persistentSlideFile);
    setShowPreview(false);
    setShowEditor(true);
  };

  const handleSlideFileSelect = (file: File | null) => {
    setSlidePdfFile(file);
  };

  const handlePreviewReset = () => {
    setShowPreview(false);
    setShowEditor(false);
    setUploadedFile(null);
    setParsedPlans([]);
    setPersistentSlideFile('');
    setPreEditSlideFile('');
    setSlidePdfFile(null);
    setTempFileId('');
    loadedPlanIdRef.current = null;
  };

  const handlePreviewConfirm = async () => {
    if (!API_PREFIX) {
      console.error('NEXT_PUBLIC_API_BASE_URL 未設定');
      toast({
        title: '❌ 設定錯誤',
        description: '後端網址未設定（NEXT_PUBLIC_API_BASE_URL）。',
        variant: 'destructive',
      });
      return;
    }

    if (!parsedPlans.length || !currentPlan) {
      toast({
        title: '❌ 缺少資料',
        description: '尚未取得教案內容，請重新上傳檔案。',
        variant: 'destructive',
      });
      return;
    }

    const plan = currentPlan;

    if (isReplacingSheet) {
      if (!replacePlanIdFromQuery || !tempFileId) {
        toast({
          title: '❌ 缺少資料',
          description: '找不到替換教案或暫存檔，請重新選擇教案紙。',
          variant: 'destructive',
        });
        return;
      }

      const payload = toCreatePayload(plan);
      setIsUploading(true);
      try {
        const formData = new FormData();
        formData.append('teaching_plan_temp_file_id', tempFileId);
        Object.entries(payload).forEach(([key, value]) => {
          formData.append(key, value != null ? String(value) : '');
        });

        const csrfToken = await ensureCsrfToken();
        const res = await fetch(`${API_PREFIX}/detail/${replacePlanIdFromQuery}/replace-sheet`, {
          method: 'POST',
          body: formData,
          credentials: 'include',
          headers: csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : undefined,
        });
        const contentType = res.headers.get('content-type') || '';
        const raw = await res.text();

        if (!res.ok) {
          throw new Error(`HTTP ${res.status} ${res.statusText} — ${raw.slice(0, 200)}`);
        }
        if (!contentType.includes('application/json')) {
          throw new Error(`Unexpected content-type: ${contentType} — ${raw.slice(0, 200)}`);
        }

        const detail = JSON.parse(raw);
        updateManageCachesAfterEdit(detail);
        setFlash({
          type: 'success',
          title: '教案紙更新已送出！',
          message: '欄位與教案紙正在背景替換；公開教案才會同步更新搜尋索引。',
          timeout: 5000,
        });
        handlePreviewReset();
        router.push('/plans/mine');
      } catch (error: any) {
        console.error('Replace sheet error:', error);
        toast({
          title: '❌ 教案紙更新失敗',
          description: String(error?.message || '請稍後再試。'),
          variant: 'destructive',
        });
      } finally {
        setIsUploading(false);
      }
      return;
    }

    if (!tempFileId) {
      if (plan?.id) {
        toast({
          title: '✅ 教案已更新',
          description: '教案內容已儲存，如需更多變更請持續編輯。',
        });
        return;
      }

      toast({
        title: '❌ 缺少資料',
        description: '找不到暫存檔 ID，請重新上傳教案。',
        variant: 'destructive',
      });
      return;
    }

    const payload = toCreatePayload(plan, uploadMode ?? undefined);
    const selectedPeriod = splitSemester(plan.semester ?? '');
    if (
      uploadMode === 'archive' &&
      currentTerm &&
      selectedPeriod.academicYear === currentTerm.academic_year &&
      selectedPeriod.semesterPeriod === currentTerm.semester_period
    ) {
      toast({
        title: '❌ 期數不符合歸檔條件',
        description: `${currentTerm.label} 是本期教案，請返回並選擇「上傳本期教案」。`,
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('teaching_plan_temp_file_id', tempFileId);
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value != null ? String(value) : '');
      });

      // 添加 slide PDF 檔案到 FormData
      if (plan.slide_pdf_file) {
        formData.append('slide_pdf_file', plan.slide_pdf_file);
      }

      const csrfToken = await ensureCsrfToken();
      const res = await fetch(`${API_PREFIX}/upload-file`, {
        method: 'POST',
        body: formData,
        credentials: 'include',
        headers: csrfToken ? { [CSRF_HEADER_NAME]: csrfToken } : undefined,
      });

      const contentType = res.headers.get('content-type') || '';
      const raw = await res.text();

      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText} — ${raw.slice(0, 200)}`);
      }

      if (!contentType.includes('application/json')) {
        throw new Error(`Unexpected content-type: ${contentType} — ${raw.slice(0, 200)}`);
      }

      JSON.parse(raw);

      setFlash({
        type: 'success',
        title: '教案上傳成功！',
        message:
          uploadMode === 'archive'
            ? '過去教案已公開，搜尋索引正在背景建立。'
            : '本期教案已存入教案管理，總驗通過並公告後才會開放檢索。',
        timeout: 5000,
      });

      handlePreviewReset();
      loadedPlanIdRef.current = null;
      router.push('/plans/mine');
    } catch (error: any) {
      console.error('Create error:', error);
      toast({
        title: '❌ 上傳失敗',
        description: String(error?.message || '請稍後再試。'),
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };

  return {
    // 狀態
    isUploading,
    uploadedFile,
    showPreview,
    showEditor,
    isValid,
    showCancelConfirm,
    showErrorModal,
    setShowErrorModal,
    isReplacingSheet,
    uploadMode,
    uploadModeModalOpen,
    currentTerm,
    currentTermLoading,
    currentTermError,
    currentPlan,
    editorRef,
    // 事件
    handleFileUpload,
    handleSelectUploadMode,
    handleCancelUploadMode,
    handleSubmit,
    handleEditorSave,
    handleValidationChange,
    handleEditorCancel,
    handleConfirmCancel,
    handleContinueEditing,
    handlePreviewEdit,
    handleSlideFileSelect,
    handlePreviewConfirm,
  };
}
