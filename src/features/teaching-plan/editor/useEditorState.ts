import { useState, useEffect, useCallback, useMemo } from 'react';
import { TeachingPlan } from '@/types/api';
import { filterOptions } from '@/types/filter';
import { generateIssueLabels, getOlderAcademicYearValues } from '@/lib/issues';
import { normalizeCategory } from '@/lib/categories';

interface UseEditorStateParams {
  plan: TeachingPlan;
  onSave: (updatedPlan: TeachingPlan) => void;
  onValidationChange?: (isValid: boolean) => void;
  onSlideFileSelect?: (file: File | null) => void;
}

/** TeachingPlanEditor 的全部狀態與事件處理邏輯（自原元件抽出，邏輯不變）。 */
export function useEditorState({
  plan,
  onSave,
  onValidationChange,
  onSlideFileSelect,
}: UseEditorStateParams) {
  const [editedPlan, setEditedPlan] = useState<TeachingPlan>(plan);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());
  const [yearDropdownOpen, setYearDropdownOpen] = useState(false);

  // 分離年份和學期的選項
  const seasons = ['冬', '夏'];
  const categoryOptions = useMemo(() => {
    const set = new Set([...filterOptions.category, '其他']);
    return Array.from(set);
  }, []);

  const yearOptions = useMemo(() => {
    const baseYears = Array.from(new Set(generateIssueLabels().map((label) => label.slice(0, 2))));
    const olderYears = getOlderAcademicYearValues();
    const merged = Array.from(new Set([...baseYears, ...olderYears]));
    const currentYear = plan.semester?.substring(0, 2);
    if (currentYear && !merged.includes(currentYear)) {
      return [currentYear, ...merged];
    }
    return merged;
  }, [plan.semester]);

  const selectedYear = editedPlan.semester?.substring(0, 2) || '';
  const selectedSeason = editedPlan.semester?.substring(2) || '';

  // 初始化 / 同步 plan -> editedPlan：
  // 1. 若 plan.id 改變，視為切換到另一份教案，完整載入（但仍保留使用者已上傳、仍相同檔名的 slide_pdf_file? 通常換ID就重置，可直接覆蓋）。
  // 2. 若是同一份 plan（id 不變），只同步會從後端改變且需要正規化的欄位：semester, category。
  //    避免覆寫使用者在前端剛選取但尚未送出的 slide_pdf / slide_pdf_file。
  const [prevPlanId, setPrevPlanId] = useState<string>(plan.id);
  useEffect(() => {
    const rawCategory = plan.category ?? '';
    const trimmedCategory = rawCategory.trim();
    const normalizedCategory = trimmedCategory
      ? (categoryOptions.includes(trimmedCategory) ? trimmedCategory : normalizeCategory(trimmedCategory))
      : '';

    if (plan.id !== prevPlanId) {
      const sanitizedPlan: TeachingPlan = {
        ...plan,
        semester: plan.semester ?? '',
        category: normalizedCategory,
      };
      setEditedPlan(sanitizedPlan);
      setTouchedFields(new Set());
      setPrevPlanId(plan.id);
      console.log('[Plan switch] sanitizedPlan (full load):', sanitizedPlan);
    } else {
      // 同一筆：僅更新需要正規化的欄位
      setEditedPlan(prev => ({
        ...prev,
        semester: plan.semester ?? prev.semester ?? '',
        category: normalizedCategory || prev.category || '',
      }));
      console.log('[Plan sync] partial fields updated (semester/category).');
    }
  }, [plan, categoryOptions, prevPlanId]);

  // 檢查必填欄位是否完整（除了完課筆記外）
  const checkValidation = (planData: TeachingPlan) => {
    const requiredFields = ['tp_name', 'writer_name', 'objectives', 'outline', 'team', 'category', 'grade', 'duration', 'semester'];
    return requiredFields.every(field => {
      const value = planData[field as keyof TeachingPlan];
      return value && value.toString().trim() !== '';
    });
  };

  // 當編輯的資料改變時，檢查驗證狀態
  useEffect(() => {
    const isValid = checkValidation(editedPlan);
    if (onValidationChange) {
      onValidationChange(isValid);
    }
    console.log("valid: ", editedPlan);
  }, [editedPlan, onValidationChange]);

  const handleChange = useCallback((field: keyof TeachingPlan, value: string | number) => {
    setEditedPlan(prev => ({ ...prev, [field]: value }));
  }, []);

  const handleClearField = useCallback((field: keyof TeachingPlan) => {
    setEditedPlan(prev => ({ ...prev, [field]: '' }));
    // 標記欄位為已觸碰
    setTouchedFields(prev => new Set(prev).add(field));
  }, []);

  const handleBlur = useCallback((field: string) => {
    setTouchedFields(prev => new Set(prev).add(field));
  }, []);

  const handleSave = () => {
    onSave(editedPlan);
  };

  const handleSlideFileChange = (_fileName: string | null) => { /* no-op: 合併更新改在 handleSlideFileSelect */ };

  const handleSlideFileRemove = () => {
    setEditedPlan(prev => ({ ...prev, slide_pdf: '', slide_pdf_file: null }));
    onSlideFileSelect?.(null);
  };

  const handleSlideFileSelect = (file: File | null) => {
    setEditedPlan(prev => ({
      ...prev,
      slide_pdf: file ? file.name : '',
      slide_pdf_file: file || null
    }));
    onSlideFileSelect?.(file);
  };

  const isFieldEmpty = useCallback((field: string) => {
    const value = editedPlan[field as keyof TeachingPlan];
    return !value || value.toString().trim() === '';
  }, [editedPlan]);

  const shouldShowEmptyWarning = useCallback((field: string) => {
    const requiredFields = ['tp_name', 'writer_name', 'objectives', 'outline', 'team', 'category', 'grade', 'duration', 'semester'];
    return requiredFields.includes(field) && touchedFields.has(field) && isFieldEmpty(field);
  }, [touchedFields, isFieldEmpty]);

  return {
    editedPlan,
    hoveredField,
    setHoveredField,
    yearDropdownOpen,
    setYearDropdownOpen,
    seasons,
    categoryOptions,
    yearOptions,
    selectedYear,
    selectedSeason,
    handleChange,
    handleClearField,
    handleBlur,
    handleSave,
    handleSlideFileChange,
    handleSlideFileRemove,
    handleSlideFileSelect,
    shouldShowEmptyWarning,
  };
}
