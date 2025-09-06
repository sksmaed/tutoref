import React, { useState, useEffect, useImperativeHandle, forwardRef } from 'react';
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

  const handleChange = (field: keyof TeachingPlan, value: string | number) => {
    setEditedPlan(prev => ({ ...prev, [field]: value }));
    // 標記欄位為已觸碰
    setTouchedFields(prev => new Set(prev).add(field));
  };

  const handleClearField = (field: keyof TeachingPlan) => {
    setEditedPlan(prev => ({ ...prev, [field]: '' }));
    // 標記欄位為已觸碰
    setTouchedFields(prev => new Set(prev).add(field));
  };

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

  const isFieldEmpty = (field: string) => {
    const value = editedPlan[field as keyof TeachingPlan];
    return !value || value.toString().trim() === '';
  };

  const shouldShowEmptyWarning = (field: string) => {
    const requiredFields = ['tp_name', 'writer_name', 'objectives', 'outline', 'team', 'category', 'grade', 'duration', 'semester'];
    return requiredFields.includes(field) && touchedFields.has(field) && isFieldEmpty(field);
  };

  // 文字編輯欄位組件
  const TextEditField = ({ 
    field, 
    value, 
    placeholder = "", 
    multiline = false 
  }: { 
    field: keyof TeachingPlan; 
    value: string; 
    placeholder?: string;
    multiline?: boolean;
  }) => (
    <div 
      className="relative group"
      onMouseEnter={() => setHoveredField(field)}
      onMouseLeave={() => setHoveredField(null)}
    >
      {multiline ? (
        <textarea
          className="w-full border-none outline-none resize-none bg-transparent text-base text-black-900 leading-[1.5]"
          value={value}
          placeholder={placeholder}
          onChange={(e) => handleChange(field, e.target.value)}
          onBlur={() => setTouchedFields(prev => new Set(prev).add(field))}
          rows={4}
        />
      ) : (
        <input
          type="text"
          className="w-full border-none outline-none bg-transparent text-base text-black-900 leading-[1.5]"
          value={value}
          placeholder={placeholder}
          onChange={(e) => handleChange(field, e.target.value)}
          onBlur={() => setTouchedFields(prev => new Set(prev).add(field))}
        />
      )}
      
      {hoveredField === field && value && (
        <button
          className="absolute right-2 top-1/2 transform -translate-y-1/2 text-black-400 hover:text-black-600"
          onClick={() => handleClearField(field)}
        >
          ✕
        </button>
      )}
      
      {shouldShowEmptyWarning(field) && (
        <div className="text-red-500 text-sm mt-1">此欄位不可為空白唷！</div>
      )}
    </div>
  );

  // 勾選欄位組件 - 使用新的 RadioCheckboxGroup
  const CheckboxField = ({ 
    field,
    options, 
    selectedValue, 
    onChange 
  }: { 
    field: keyof TeachingPlan;
    options: string[]; 
    selectedValue: string; 
    onChange: (value: string) => void;
  }) => (
    <div>
      <RadioCheckboxGroup
        options={options}
        selectedValue={selectedValue}
        onChange={(value) => {
          onChange(value);
          setTouchedFields(prev => new Set(prev).add(field));
        }}
      />
      {shouldShowEmptyWarning(field) && (
        <div className="text-red-500 text-sm mt-1">此欄位不可為空白唷！</div>
      )}
    </div>
  );

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
                <TextEditField 
                  field="tp_name" 
                  value={editedPlan.tp_name} 
                  placeholder="請輸入課程名稱"
                />
              </td>
            </tr>

            {/* 家別 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                家別
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <CheckboxField 
                  field="team"
                  options={filterOptions.team}
                  selectedValue={editedPlan.team}
                  onChange={(value) => handleChange('team', value)}
                />
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
                    <CheckboxField 
                      field="semester"
                      options={years}
                      selectedValue={editedPlan.semester?.substring(0, 2) || ''}
                      onChange={(year) => {
                        const season = editedPlan.semester?.substring(2) || '冬';
                        handleChange('semester', year + season);
                      }}
                    />
                  </div>
                  <div>
                    <div className="text-sm font-medium text-black-700 mb-2">學期</div>
                    <CheckboxField 
                      field="semester"
                      options={seasons}
                      selectedValue={editedPlan.semester?.substring(2) || ''}
                      onChange={(season) => {
                        const year = editedPlan.semester?.substring(0, 2) || '25';
                        handleChange('semester', year + season);
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
                <TextEditField 
                  field="writer_name" 
                  value={editedPlan.writer_name} 
                  placeholder="請輸入撰寫者姓名"
                />
              </td>
            </tr>

            {/* 類別 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                類別
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <CheckboxField 
                  field="category"
                  options={filterOptions.category}
                  selectedValue={editedPlan.category}
                  onChange={(value) => handleChange('category', value)}
                />
              </td>
            </tr>

            {/* 適用年級 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                適用年級
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <CheckboxField 
                  field="grade"
                  options={filterOptions.grade}
                  selectedValue={editedPlan.grade}
                  onChange={(value) => handleChange('grade', value)}
                />
              </td>
            </tr>

            {/* 課程時長 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                課程時長
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <CheckboxField 
                  field="duration"
                  options={filterOptions.duration}
                  selectedValue={editedPlan.duration}
                  onChange={(value) => handleChange('duration', value)}
                />
              </td>
            </tr>

            {/* 課程目標 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                課程目標
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <TextEditField 
                  field="objectives" 
                  value={editedPlan.objectives} 
                  placeholder="請輸入課程目標"
                  multiline={true}
                />
              </td>
            </tr>

            {/* 課程大綱 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                課程大綱
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <TextEditField 
                  field="outline" 
                  value={editedPlan.outline} 
                  placeholder="請輸入課程大綱"
                  multiline={true}
                />
              </td>
            </tr>

            {/* 完課筆記 */}
            <tr>
              <td className="w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center">
                完課筆記
              </td>
              <td className="border-r-0 border-l border-t border-b border-black-200 px-10 py-3" colSpan={3}>
                <TextEditField 
                  field="completion_notes" 
                  value={editedPlan.completion_notes || ''} 
                  placeholder="請輸入完課筆記（選填）"
                  multiline={true}
                />
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
