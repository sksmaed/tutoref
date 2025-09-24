import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback, useMemo } from 'react';
import Image from 'next/image';
import { TeachingPlan } from '@/types/api';
import { filterOptions } from '@/types/filter';
import RadioCheckboxGroup from '@/components/ui/RadioCheckboxGroup';
import SlideUpload from '@/components/ui/SlideUpload';
import { generateIssueLabels, getOlderAcademicYearValues } from '@/lib/issues';
import { normalizeCategory } from '@/lib/categories';

interface TeachingPlanEditorProps {
  plan: TeachingPlan;
  onSave: (updatedPlan: TeachingPlan) => void;
  onCancel: () => void;
  onValidationChange?: (isValid: boolean) => void;
  onSlideFileSelect?: (file: File | null) => void;
}

export interface TeachingPlanEditorRef {
  save: () => void;
  getCurrentPlan: () => TeachingPlan;
}

const TeachingPlanEditor = forwardRef<TeachingPlanEditorRef, TeachingPlanEditorProps>(({
  plan,
  onSave,
  onCancel,
  onValidationChange,
  onSlideFileSelect,
}, ref) => {
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

  useEffect(() => {
    const rawCategory = plan.category ?? '';
    const trimmedCategory = rawCategory.trim();
    const normalizedCategory = trimmedCategory
      ? (categoryOptions.includes(trimmedCategory) ? trimmedCategory : normalizeCategory(trimmedCategory))
      : '';
    const sanitizedPlan: TeachingPlan = {
      ...plan,
      semester: plan.semester ?? '',
      category: normalizedCategory,
    };

    setEditedPlan(sanitizedPlan);
    setTouchedFields(new Set());
  }, [plan, categoryOptions]);

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

  // 暴露方法給父元件
  useImperativeHandle(ref, () => ({
    save: handleSave,
    getCurrentPlan: () => editedPlan
  }));

  const handleSlideFileChange = (fileName: string) => {
    handleChange('slide_pdf', fileName);
  };

  const handleSlideFileRemove = () => {
    handleChange('slide_pdf', '');
    onSlideFileSelect?.(null);
  };

  const isFieldEmpty = useCallback((field: string) => {
    const value = editedPlan[field as keyof TeachingPlan];
    return !value || value.toString().trim() === '';
  }, [editedPlan]);

  const shouldShowEmptyWarning = useCallback((field: string) => {
    const requiredFields = ['tp_name', 'writer_name', 'objectives', 'outline', 'team', 'category', 'grade', 'duration', 'semester'];
    return requiredFields.includes(field) && touchedFields.has(field) && isFieldEmpty(field);
  }, [touchedFields, isFieldEmpty]);

  return (
    <div className="w-full max-w-4xl flex flex-col items-center">
      <div className="w-[777px] bg-white rounded-lg shadow-lg border border-black-200 overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            {/* 課程名稱 */}
            <tr>
              <td className="w-[120px] border-l-0 border-t-0 border-r border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                課程名稱
              </td>
              <td className="border-t-0 border-r-0 border-b border-l border-black-200 px-10 py-3" colSpan={3}>
                <div 
                  className="relative group"
                  onMouseEnter={() => setHoveredField('tp_name')}
                  onMouseLeave={() => setHoveredField(null)}
                >
                  <input
                    type="text"
                    className="w-full border-none outline-hidden bg-transparent text-base text-black-900 leading-normal"
                    value={editedPlan.tp_name}
                    placeholder="請輸入課程名稱"
                    onChange={(e) => handleChange('tp_name', e.target.value)}
                    onBlur={() => handleBlur('tp_name')}
                  />
                  
                  {hoveredField === 'tp_name' && editedPlan.tp_name && (
                    <button
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-black-400 hover:text-black-600"
                      onClick={() => handleClearField('tp_name')}
                    >
                      ✕
                    </button>
                  )}
                  
                  {shouldShowEmptyWarning('tp_name') && (
                    <div className="text-red-500 text-sm mt-1">此欄位不可為空白唷！</div>
                  )}
                </div>
              </td>
            </tr>

            {/* 家別 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                家別
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <div>
                  <RadioCheckboxGroup
                    options={filterOptions.team}
                    selectedValue={editedPlan.team}
                    onChange={(value) => {
                      handleChange('team', value);
                      handleBlur('team');
                    }}
                  />
                  {shouldShowEmptyWarning('team') && (
                    <div className="text-red-500 text-sm mt-1">此欄位不可為空白唷！</div>
                  )}
                </div>
              </td>
            </tr>

            {/* 期數 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                期數
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <div className="space-y-3">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-1">
                      {/* <span className="text-sm font-medium text-black-700">年份</span> */}
                      <div className="relative inline-flex w-[80px] items-center justify-between">
                        <select
                          className="
                            w-full h-[32px]
                            appearance-none
                            rounded-lg border-[1.5px] border-black-200
                            bg-white text-black-900 text-base
                            pl-[12px] pr-[8px] pt-[5px] pb-[6px]
                            focus:outline-hidden focus:ring-2 focus:ring-primary-200 focus:border-primary-900
                          "
                          value={selectedYear}
                          onChange={(event) => {
                            const year = event.target.value;
                            const season = selectedSeason || '冬';
                            handleChange('semester', year ? year + season : '');
                            handleBlur('semester');
                          }}
                          onFocus={() => setYearDropdownOpen(true)}
                          onBlur={() => setYearDropdownOpen(false)}
                        >
                          <option value="" disabled>
                            選擇
                          </option>
                          {yearOptions.map((year) => (
                            <option key={year} value={year}>
                              {year}
                            </option>
                          ))}
                        </select>
                        <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2">
                          <Image
                            src={yearDropdownOpen ? '/icons/angle-up.png' : '/icons/angle-down.png'}
                            alt="dropdown icon"
                            width={20}
                            height={20}
                          />
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
                      {/* <span className="text-sm font-medium text-black-700">學期</span> */}
                      <RadioCheckboxGroup
                        options={seasons}
                        selectedValue={selectedSeason}
                        onChange={(season) => {
                          const year = selectedYear || yearOptions[0] || '';
                          handleChange('semester', year ? year + season : '');
                          handleBlur('semester');
                        }}
                        className="flex items-center gap-3"
                      />
                    </div>
                  </div>
                </div>
                {shouldShowEmptyWarning('semester') && (
                  <div className="text-red-500 text-sm mt-1">此欄位不可為空白唷！</div>
                )}
              </td>
            </tr>

            {/* 撰寫者 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                撰寫者
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <div 
                  className="relative group"
                  onMouseEnter={() => setHoveredField('writer_name')}
                  onMouseLeave={() => setHoveredField(null)}
                >
                  <input
                    type="text"
                    className="w-full border-none outline-hidden bg-transparent text-base text-black-900 leading-normal"
                    value={editedPlan.writer_name}
                    placeholder="請輸入撰寫者姓名"
                    onChange={(e) => handleChange('writer_name', e.target.value)}
                    onBlur={() => handleBlur('writer_name')}
                  />
                  
                  {hoveredField === 'writer_name' && editedPlan.writer_name && (
                    <button
                      className="absolute right-2 top-1/2 transform -translate-y-1/2 text-black-400 hover:text-black-600"
                      onClick={() => handleClearField('writer_name')}
                    >
                      ✕
                    </button>
                  )}
                  
                  {shouldShowEmptyWarning('writer_name') && (
                    <div className="text-red-500 text-sm mt-1">此欄位不可為空白唷！</div>
                  )}
                </div>
              </td>
            </tr>

            {/* 類別 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                類別
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <div>
                  <RadioCheckboxGroup
                    options={categoryOptions}
                    selectedValue={editedPlan.category}
                    onChange={(value) => {
                      handleChange('category', value);
                      handleBlur('category');
                    }}
                  />
                  {shouldShowEmptyWarning('category') && (
                    <div className="text-red-500 text-sm mt-1">此欄位不可為空白唷！</div>
                  )}
                </div>
              </td>
            </tr>

            {/* 適用年級 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                適用年級
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <div>
                  <RadioCheckboxGroup
                    options={filterOptions.grade}
                    selectedValue={editedPlan.grade}
                    onChange={(value) => {
                      handleChange('grade', value);
                      handleBlur('grade');
                    }}
                  />
                  {shouldShowEmptyWarning('grade') && (
                    <div className="text-red-500 text-sm mt-1">此欄位不可為空白唷！</div>
                  )}
                </div>
              </td>
            </tr>

            {/* 課程時長 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                課程時長
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <div>
                  <RadioCheckboxGroup
                    options={filterOptions.duration}
                    selectedValue={editedPlan.duration}
                    onChange={(value) => {
                      handleChange('duration', value);
                      handleBlur('duration');
                    }}
                  />
                  {shouldShowEmptyWarning('duration') && (
                    <div className="text-red-500 text-sm mt-1">此欄位不可為空白唷！</div>
                  )}
                </div>
              </td>
            </tr>

            {/* 課程目標 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                課程目標
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <div 
                  className="relative group"
                  onMouseEnter={() => setHoveredField('objectives')}
                  onMouseLeave={() => setHoveredField(null)}
                >
                  <textarea
                    className="w-full border-none outline-hidden resize-none bg-transparent text-base text-black-900 leading-normal"
                    value={editedPlan.objectives}
                    placeholder="請輸入課程目標"
                    onChange={(e) => handleChange('objectives', e.target.value)}
                    onBlur={() => handleBlur('objectives')}
                    rows={4}
                  />
                  
                  {hoveredField === 'objectives' && editedPlan.objectives && (
                    <button
                      className="absolute right-2 top-2 text-black-400 hover:text-black-600"
                      onClick={() => handleClearField('objectives')}
                    >
                      ✕
                    </button>
                  )}
                  
                  {shouldShowEmptyWarning('objectives') && (
                    <div className="text-red-500 text-sm mt-1">此欄位不可為空白唷！</div>
                  )}
                </div>
              </td>
            </tr>

            {/* 課程大綱 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                課程大綱
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <div 
                  className="relative group"
                  onMouseEnter={() => setHoveredField('outline')}
                  onMouseLeave={() => setHoveredField(null)}
                >
                  <textarea
                    className="w-full border-none outline-hidden resize-none bg-transparent text-base text-black-900 leading-normal"
                    value={editedPlan.outline}
                    placeholder="請輸入課程大綱"
                    onChange={(e) => handleChange('outline', e.target.value)}
                    onBlur={() => handleBlur('outline')}
                    rows={4}
                  />
                  
                  {hoveredField === 'outline' && editedPlan.outline && (
                    <button
                      className="absolute right-2 top-2 text-black-400 hover:text-black-600"
                      onClick={() => handleClearField('outline')}
                    >
                      ✕
                    </button>
                  )}
                  
                  {shouldShowEmptyWarning('outline') && (
                    <div className="text-red-500 text-sm mt-1">此欄位不可為空白唷！</div>
                  )}
                </div>
              </td>
            </tr>

            {/* 完課筆記 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                完課筆記
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <div 
                  className="relative group"
                  onMouseEnter={() => setHoveredField('completion_notes')}
                  onMouseLeave={() => setHoveredField(null)}
                >
                  <textarea
                    className="w-full border-none outline-hidden resize-none bg-transparent text-base text-black-900 leading-normal"
                    value={editedPlan.completion_notes || ''}
                    placeholder="請輸入完課筆記（選填）"
                    onChange={(e) => handleChange('completion_notes', e.target.value)}
                    onBlur={() => handleBlur('completion_notes')}
                    rows={4}
                  />
                  
                  {hoveredField === 'completion_notes' && editedPlan.completion_notes && (
                    <button
                      className="absolute right-2 top-2 text-black-400 hover:text-black-600"
                      onClick={() => handleClearField('completion_notes')}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </td>
            </tr>

            {/* 投影片 */}
            <tr>
              <td className="w-[120px] border-l-0 border-b-0 border-r border-t border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                投影片
              </td>
              <td className="border border-black-200 pl-6 pr-10 py-4" colSpan={3}>
                <SlideUpload
                  initialFileName={editedPlan.slide_pdf}
                  onFileChange={handleSlideFileChange}
                  onFileRemove={handleSlideFileRemove}
                  onFileSelect={onSlideFileSelect}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
});

TeachingPlanEditor.displayName = 'TeachingPlanEditor';

export default TeachingPlanEditor;
