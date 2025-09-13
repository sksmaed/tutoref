import React, { useState, useEffect, useImperativeHandle, forwardRef, useCallback } from 'react';
import { TeachingPlan } from '@/types/api';
import { filterOptions } from '@/types/filter';
import RadioCheckboxGroup from '@/components/ui/RadioCheckboxGroup';
import SlideUpload from '@/components/ui/SlideUpload';

interface TeachingPlanEditorProps {
  plan: TeachingPlan;
  onSave: (updatedPlan: TeachingPlan) => void;
  onCancel: () => void;
  onValidationChange?: (isValid: boolean) => void;
}

export interface TeachingPlanEditorRef {
  save: () => void;
  getCurrentPlan: () => TeachingPlan;
}

const TeachingPlanEditor = forwardRef<TeachingPlanEditorRef, TeachingPlanEditorProps>(({
  plan,
  onSave,
  onCancel,
  onValidationChange
}, ref) => {
  const [editedPlan, setEditedPlan] = useState<TeachingPlan>(plan);
  const [hoveredField, setHoveredField] = useState<string | null>(null);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // 分離年份和學期的選項
  const years = ['23', '24', '25', '26'];
  const seasons = ['冬', '夏'];

  useEffect(() => {
    console.log('TeachingPlanEditor - plan prop 改變:', plan.slide_pdf);
    setEditedPlan(plan);
  }, [plan]);

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
      <div>
        <p className="text-xl leading-[1.5] text-black-900 text-center mb-8">
          以下資訊為系統自動辨識檔案內容產生，供大家在檢索結果中預覽，
          <br />    
          現在你可以修改內容囉！
        </p>
      </div>

      {/* 編輯表格 */}
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
                    className="w-full border-none outline-none bg-transparent text-base text-black-900 leading-[1.5]"
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
                  <div>
                    <div className="text-sm font-medium text-black-700 mb-2">年份</div>
                    <RadioCheckboxGroup
                      options={years}
                      selectedValue={editedPlan.semester?.substring(0, 2) || ''}
                      onChange={(year) => {
                        const season = editedPlan.semester?.substring(2) || '冬';
                        handleChange('semester', year + season);
                        handleBlur('semester');
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-black-700 mb-2">學期</div>
                    <RadioCheckboxGroup
                      options={seasons}
                      selectedValue={editedPlan.semester?.substring(2) || ''}
                      onChange={(season) => {
                        const year = editedPlan.semester?.substring(0, 2) || '25';
                        handleChange('semester', year + season);
                        handleBlur('semester');
                      }}
                    />
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
                    className="w-full border-none outline-none bg-transparent text-base text-black-900 leading-[1.5]"
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
                    options={filterOptions.category}
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
                    className="w-full border-none outline-none resize-none bg-transparent text-base text-black-900 leading-[1.5]"
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
                    className="w-full border-none outline-none resize-none bg-transparent text-base text-black-900 leading-[1.5]"
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
                    className="w-full border-none outline-none resize-none bg-transparent text-base text-black-900 leading-[1.5]"
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
