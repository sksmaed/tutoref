'use client'

import React, { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { FileUpload } from '@/components/ui/FileUpload';
import { TeachingPlan } from '@/types/api';
import { filterOptions } from '@/types/filter';
import TeachingPlanEditor, { TeachingPlanEditorRef } from '@/components/layout/TeachingPlanEditor';
import TeachingPlanPreview from '@/components/layout/TeachingPlanPreview';
import { useToast } from '@/hooks/use-toast';
import { setFlash } from '@/utils/flash';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';
import { DURATION_INVERSE_MAP, DURATION_MAP } from '@/lib/constant';
import { normalizeCategory } from '@/lib/categories';

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
const API_PREFIX = BACKEND_URL ? `${BACKEND_URL}/api/v2/teaching-plan` : '';

const formatDurationLabel = (value: number | string | null | undefined): string => {
  if (typeof value === 'number') {
    return DURATION_MAP[value] ?? `${value}分鐘`;
  }
  if (typeof value === 'string') {
    return value;
  }
  return '';
};

const splitSemester = (value: string) => {
  const trimmed = (value ?? '').trim();
  if (trimmed.length < 3) {
    return { academicYear: '', semesterPeriod: '' };
  }
  return {
    academicYear: trimmed.slice(0, 2),
    semesterPeriod: trimmed.slice(2),
  };
};

const normalizeTeachingPlan = (plan: any): TeachingPlan => {
  const semester = plan?.semester ?? `${plan?.academic_year ?? ''}${plan?.semester_period ?? ''}`;
  const rawCategory = plan?.category ?? '';
  const trimmedCategory = rawCategory.trim();
  const normalizedCategory = trimmedCategory ? normalizeCategory(trimmedCategory) : '';
  const category = trimmedCategory
    ? (filterOptions.category.includes(trimmedCategory) ? trimmedCategory : normalizedCategory)
    : '';

  return {
    id: String(plan?.id ?? ''),
    team: plan?.team ?? '',
    semester: semester ?? '',
    writer_name: plan?.writer_name ?? '',
    category,
    category_group: normalizedCategory,
    tp_name: plan?.tp_name ?? '',
    grade: plan?.grade ?? '',
    duration: formatDurationLabel(plan?.duration),
    objectives: plan?.objectives ?? '',
    outline: plan?.outline ?? '',
    completion_notes: plan?.post_class_notes ?? plan?.completion_notes ?? '',
    slide_pdf: plan?.slide_pdf ?? '',
    content: plan?.content ?? '',
  };
};

const inferDurationValue = (label: string): number | undefined => {
  if (!label) return undefined;
  if (Object.prototype.hasOwnProperty.call(DURATION_INVERSE_MAP, label)) {
    return DURATION_INVERSE_MAP[label];
  }
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : undefined;
};

const toUpdatePayload = (plan: TeachingPlan) => {
  const { academicYear, semesterPeriod } = splitSemester(plan.semester ?? '');
  const duration = inferDurationValue(plan.duration);

  return {
    tp_name: plan.tp_name,
    writer_name: plan.writer_name,
    team: plan.team,
    category: plan.category,
    grade: plan.grade,
    objectives: plan.objectives,
    outline: plan.outline,
    post_class_notes: plan.completion_notes ?? '',
    slide_pdf: plan.slide_pdf,
    ...(plan.content ? { content: plan.content } : {}),
    ...(academicYear ? { academic_year: academicYear } : {}),
    ...(semesterPeriod ? { semester_period: semesterPeriod } : {}),
    ...(typeof duration === 'number' ? { duration } : {}),
  };
};

const toCreatePayload = (plan: TeachingPlan) => {
  const { academicYear, semesterPeriod } = splitSemester(plan.semester ?? '');
  const duration = inferDurationValue(plan.duration) ?? 0;

  return {
    tp_name: plan.tp_name ?? '',
    writer_name: plan.writer_name ?? '',
    team: plan.team ?? '',
    academic_year: academicYear ?? '',
    semester_period: semesterPeriod ?? '',
    category: plan.category ?? '',
    grade: plan.grade ?? '',
    duration,
    objectives: plan.objectives ?? '',
    outline: plan.outline ?? '',
    content: plan.content ?? '',
    post_class_notes: plan.completion_notes ?? '',
  };
};

const UploadPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
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
  const [tempFileId, setTempFileId] = useState<string>('');
  const editorRef = useRef<TeachingPlanEditorRef>(null);
  const loadedPlanIdRef = useRef<string | null>(null);
  const { toast } = useToast();

  const currentPlan = useMemo(() => {
    if (!parsedPlans.length) return null;
    const [firstPlan] = parsedPlans;
    return { ...firstPlan, slide_pdf: persistentSlideFile } as TeachingPlan;
  }, [parsedPlans, persistentSlideFile]);

  const handleFileUpload = async (file: File | null) => {
    if (!file) {
      setUploadedFile(null);
      setParsedPlans([]);
      setShowPreview(false);
      setShowEditor(false);
      setPersistentSlideFile('');
      setPreEditSlideFile('');
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
    setTempFileId('');
  };

  const planIdFromQuery = searchParams?.get('planId');

  useEffect(() => {
    if (!API_PREFIX || !planIdFromQuery) {
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
  }, [API_PREFIX, planIdFromQuery, toast]);

  // const handleSubmit = async () => {
  //   // 檢查檔案類型
  //   if (!uploadedFile) return;
    
  //   // 檢查是否為 PDF 檔案
  //   if (uploadedFile.type !== 'application/pdf' && !uploadedFile.name.toLowerCase().endsWith('.pdf')) {
  //     setShowErrorModal(true);
  //     return;
  //   }

  //   // 如果檔案格式正確，開始上傳並解析
  //   setIsUploading(true);

  //   try {
  //     const formData = new FormData();
  //     formData.append('files', uploadedFile);

  //     const response = await fetch(`${BACKEND_URL}/api/teaching-plan/upload-files`, {
  //       method: 'POST',
  //       body: formData
  //     });

  //     const data = await response.json();
  //     setParsedPlans(data);
      
  //     // 重置slide檔案狀態為新解析結果的狀態
  //     if (data && data.length > 0) {
  //       setPersistentSlideFile(data[0].slide_pdf || '');
  //       setShowPreview(true);
  //       setShowEditor(false);
  //     }
  //   } catch (error) {
  //     console.error('Upload error:', error);
  //     toast({
  //       title: "❌ 上傳失敗",
  //       description: "請稍後再試。",
  //       variant: "destructive",
  //     });
  //   } finally {
  //     setIsUploading(false);
  //   }
  // };

  const handleSubmit = async () => {
    if (!uploadedFile) return;

    if (uploadedFile.type !== 'application/pdf' && !uploadedFile.name.toLowerCase().endsWith('.pdf')) {
      setShowErrorModal(true);
      return;
    }

    if (!API_PREFIX) {
      console.error('NEXT_PUBLIC_BACKEND_URL 未設定');
      toast({
        title: '❌ 設定錯誤',
        description: '後端網址未設定（NEXT_PUBLIC_BACKEND_URL）。',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', uploadedFile);

      const res = await fetch(`${API_PREFIX}/extract`, {
        method: 'POST',
        body: formData,
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

      const data = JSON.parse(raw);
      if (!data?.temp_file_id) {
        throw new Error('解析成功但未取得暫存檔 ID');
      }

      const normalizedPlan = normalizeTeachingPlan(data);
      setParsedPlans([normalizedPlan]);
      setTempFileId(data.temp_file_id);

      const firstSlide = normalizedPlan?.slide_pdf ?? '';
      setPersistentSlideFile(firstSlide);
      setPreEditSlideFile(firstSlide);
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
      const slide = normalized.slide_pdf ?? '';

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

      setPersistentSlideFile(slide);
      setPreEditSlideFile(slide);
      setShowEditor(false);
      setShowPreview(true);
      setShowCancelConfirm(false);
    };

    if (!updatedPlan?.id) {
      applyLocalUpdate(updatedPlan);
      toast({
        title: '✅ 編輯完成',
        description: '內容已更新，請確認後完成上傳。',
      });
      return;
    }

    if (!API_PREFIX) {
      console.error('NEXT_PUBLIC_BACKEND_URL 未設定');
      toast({
        title: '❌ 設定錯誤',
        description: '後端網址未設定（NEXT_PUBLIC_BACKEND_URL）。',
        variant: 'destructive',
      });
      return;
    }

    setIsUploading(true);
    try {
      const payload = toUpdatePayload(updatedPlan);
      const res = await fetch(`${API_PREFIX}/detail/${updatedPlan.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
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

  const handlePreviewReset = () => {
    setShowPreview(false);
    setShowEditor(false);
    setUploadedFile(null);
    setParsedPlans([]);
    setPersistentSlideFile('');
    setPreEditSlideFile('');
    setTempFileId('');
    loadedPlanIdRef.current = null;
  };

  const handlePreviewConfirm = async () => {
    if (!API_PREFIX) {
      console.error('NEXT_PUBLIC_BACKEND_URL 未設定');
      toast({
        title: '❌ 設定錯誤',
        description: '後端網址未設定（NEXT_PUBLIC_BACKEND_URL）。',
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

    const payload = toCreatePayload(plan);

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('teaching_plan_temp_file_id', tempFileId);
      Object.entries(payload).forEach(([key, value]) => {
        formData.append(key, value != null ? String(value) : '');
      });

      const res = await fetch(`${API_PREFIX}/upload-file`, {
        method: 'POST',
        body: formData,
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

      const result = JSON.parse(raw);

      setFlash({
        type: 'success',
        title: '教案上傳成功！',
        message: '感謝你願意跟大家分享教案～',
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

  return (
    <div className="w-full h-full bg-black-100 flex flex-col items-center pt-[60px]">
      <h1 className="text-[40px] leading-normal font-bold text-black-900 mb-10">上傳教案</h1>
      
      {!showPreview && !showEditor ? (
        <>
          {/* 上傳卡片 */}
          <div className={`w-[576px] flex flex-col bg-white rounded-lg px-[100px] py-20`}>
            {/* 使用新的 FileUpload 元件 */}
            <FileUpload
              onFileUpload={handleFileUpload}
              isUploading={isUploading}
              uploadedFile={uploadedFile}
            />

            {/* 載入狀態 */}
            {isUploading && (
              <div className="mt-6 text-center">
                <div className="inline-flex items-center space-x-2 text-primary-900">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-primary-900 border-t-transparent"></div>
                  <span>正在上傳教案...</span>
                </div>
              </div>
            )}
            
            {/* 按鈕區域 */}
            <div className="flex flex-col gap-3 mt-8">
              {/* 重新選擇檔案按鈕 - 只在有檔案時顯示 */}
              {uploadedFile && (
                <div className="flex justify-center">
                  <Button
                    onClick={() => handleFileUpload(null)}
                    variant="large"
                    disabled={isUploading}
                    className="text-sm bg-white border border-primary-900 text-primary-900 hover:bg-primary-50"
                  >
                    重新選擇檔案
                  </Button>
                </div>
              )}

              {/* 確認上傳按鈕*/}
              <div className="flex justify-center">
                <Button 
                  onClick={handleSubmit}
                  disabled={!uploadedFile || isUploading}
                  variant="large"
                  className={`
                    ${!uploadedFile ? 'bg-black-300 text-black-500 cursor-not-allowed' : 'bg-primary-900 text-white hover:bg-primary-900/90'}
                  `}
                >
                  確認上傳
                </Button>
              </div>
            </div>
          </div>
        </>
      ) : showPreview ? (
        /* 預覽表格 */
        <>
          {currentPlan && (
            <TeachingPlanPreview 
              plan={currentPlan}
            />
          )}
          
          {/* 預覽頁按鈕 */}
          <div className="w-full flex justify-center gap-2.5 mt-10">
            <Button
              variant="small"
              onClick={handlePreviewEdit}
              disabled={isUploading}
              className="text-base leading-normal bg-white border border-primary-900 text-primary-900"
            >
              編輯內容
            </Button>
            <Button
              variant="small"
              onClick={handlePreviewConfirm}
              disabled={isUploading}
              className="text-base leading-normal bg-primary-900 text-white font-bold"
            >
              確認上傳
            </Button>
          </div>
        </>
      ) : (
        /* 編輯表格 */
        <>
          <p className="text-xl leading-normal text-black-900 text-center mb-8">
            以下資訊為系統自動辨識檔案內容產生，供大家在檢索結果中預覽，
            <br />
            現在你可以修改內容囉！
          </p>
          {currentPlan && (
            <TeachingPlanEditor
              ref={editorRef}
              plan={currentPlan}
              onSave={handleEditorSave}
              onCancel={handleEditorCancel}
              onValidationChange={handleValidationChange}
            />
          )}
          
          {/* 編輯頁按鈕 */}
          <div className="w-full flex justify-center gap-2.5 mt-10">
            <Button
              variant="small"
              onClick={handleEditorCancel}
              className="text-base leading-normal bg-white border border-primary-900 text-primary-900"
            >
              取消編輯
            </Button>
            <Button
              variant="small"
              onClick={() => editorRef.current?.save()}
              disabled={!isValid || isUploading}
              className={`text-base leading-normal font-bold ${
                isValid && !isUploading
                  ? 'bg-primary-900 text-white' 
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              編輯完成
            </Button>
          </div>
        </>
      )}

      {/* 取消編輯確認對話框 */}
      <ConfirmModal
        open={showCancelConfirm}
        title="你確定要取消編輯嗎？"
        description="剛剛所做之變更將不會被保存。"
        cancelText="取消編輯"
        confirmText="繼續編輯"
        onClose={handleContinueEditing}
        onCancel={handleConfirmCancel}
        onConfirm={handleContinueEditing}
      />

      {/* 檔案格式錯誤 Modal */}
      <Modal
        open={showErrorModal}
        description="所選檔案格式不符，請重新上傳！"
        confirmText="我知道了"
        onClose={() => setShowErrorModal(false)}
      />
    </div>
  );
};

export default UploadPage;
