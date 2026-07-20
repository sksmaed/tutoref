import React, { useImperativeHandle, forwardRef } from 'react';
import { TeachingPlan } from '@/types/api';
import { filterOptions } from '@/types/filter';
import RadioCheckboxGroup from '@/components/ui/RadioCheckboxGroup';
import SlideUpload from '@/features/teaching-plan/SlideUpload';
import { useEditorState } from './editor/useEditorState';
import { EditorTextCell, EditorChoiceCell, EmptyFieldWarning } from './editor/EditorFields';

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

/** 表頭儲存格樣式（依列位置調整外框線）。 */
const LABEL_CELL_FIRST = 'w-[120px] border-l-0 border-t-0 border-r border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center';
const LABEL_CELL_MIDDLE = 'w-[120px] border-l-0 border-r border-t border-b border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center';
const LABEL_CELL_LAST = 'w-[120px] border-l-0 border-b-0 border-r border-t border-black-200 bg-primary-100 text-base font-bold text-black-900 text-center';
const VALUE_CELL_FIRST = 'border-t-0 border-r-0 border-b border-l border-black-200 px-10 py-3';
const VALUE_CELL_MIDDLE = 'border-r-0 border-l border-t border-b border-black-200 px-10 py-3';

const TeachingPlanEditor = forwardRef<TeachingPlanEditorRef, TeachingPlanEditorProps>(({
  plan,
  onSave,
  onCancel: _onCancel,
  onValidationChange,
  onSlideFileSelect,
}, ref) => {
  const {
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
  } = useEditorState({ plan, onSave, onValidationChange, onSlideFileSelect });

  // 暴露方法給父元件
  useImperativeHandle(ref, () => ({
    save: handleSave,
    getCurrentPlan: () => editedPlan
  }));

  const textCellProps = {
    hoveredField,
    setHoveredField,
    onChange: handleChange,
    onClear: handleClearField,
    onBlur: handleBlur,
  };

  return (
    <div className="w-full max-w-4xl flex flex-col items-center">
      <div className="w-full overflow-x-auto">
      <div className="w-[777px] mx-auto bg-white rounded-lg shadow-lg border border-black-200 overflow-hidden">
        <table className="w-full border-collapse">
          <tbody>
            {/* 課程名稱 */}
            <tr>
              <td className={LABEL_CELL_FIRST}>課程名稱</td>
              <td className={VALUE_CELL_FIRST} colSpan={3}>
                <EditorTextCell
                  field="tp_name"
                  value={editedPlan.tp_name}
                  placeholder="請輸入課程名稱"
                  showWarning={shouldShowEmptyWarning('tp_name')}
                  {...textCellProps}
                />
              </td>
            </tr>

            {/* 家別 */}
            <tr>
              <td className={LABEL_CELL_MIDDLE}>家別</td>
              <td className={VALUE_CELL_MIDDLE} colSpan={3}>
                <EditorChoiceCell
                  field="team"
                  options={filterOptions.team}
                  selectedValue={editedPlan.team}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  showWarning={shouldShowEmptyWarning('team')}
                />
              </td>
            </tr>

            {/* 期數 */}
            <tr>
              <td className={LABEL_CELL_MIDDLE}>期數</td>
              <td className={VALUE_CELL_MIDDLE} colSpan={3}>
                <div className="space-y-3">
                  <div className="flex items-center gap-6">
                    <div className="flex flex-col gap-1">
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
                          <img
                            src={yearDropdownOpen ? '/icons/angle-up.svg' : '/icons/angle-down.svg'}
                            alt="dropdown icon"
                            width={20}
                            height={20}
                          />
                        </span>
                      </div>
                    </div>

                    <div className="flex flex-col gap-1">
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
                {shouldShowEmptyWarning('semester') && <EmptyFieldWarning />}
              </td>
            </tr>

            {/* 撰寫者 */}
            <tr>
              <td className={LABEL_CELL_MIDDLE}>撰寫者</td>
              <td className={VALUE_CELL_MIDDLE} colSpan={3}>
                <EditorTextCell
                  field="writer_name"
                  value={editedPlan.writer_name}
                  placeholder="請輸入撰寫者姓名"
                  showWarning={shouldShowEmptyWarning('writer_name')}
                  {...textCellProps}
                />
              </td>
            </tr>

            {/* 類別 */}
            <tr>
              <td className={LABEL_CELL_MIDDLE}>類別</td>
              <td className={VALUE_CELL_MIDDLE} colSpan={3}>
                <EditorChoiceCell
                  field="category"
                  options={categoryOptions}
                  selectedValue={editedPlan.category}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  showWarning={shouldShowEmptyWarning('category')}
                />
              </td>
            </tr>

            {/* 適用年級 */}
            <tr>
              <td className={LABEL_CELL_MIDDLE}>適用年級</td>
              <td className={VALUE_CELL_MIDDLE} colSpan={3}>
                <EditorChoiceCell
                  field="grade"
                  options={filterOptions.grade}
                  selectedValue={editedPlan.grade}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  showWarning={shouldShowEmptyWarning('grade')}
                />
              </td>
            </tr>

            {/* 課程時長 */}
            <tr>
              <td className={LABEL_CELL_MIDDLE}>課程時長</td>
              <td className={VALUE_CELL_MIDDLE} colSpan={3}>
                <EditorChoiceCell
                  field="duration"
                  options={filterOptions.duration}
                  selectedValue={editedPlan.duration}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  showWarning={shouldShowEmptyWarning('duration')}
                />
              </td>
            </tr>

            {/* 課程目標 */}
            <tr>
              <td className={LABEL_CELL_MIDDLE}>課程目標</td>
              <td className={VALUE_CELL_MIDDLE} colSpan={3}>
                <EditorTextCell
                  field="objectives"
                  value={editedPlan.objectives}
                  placeholder="請輸入課程目標"
                  multiline
                  showWarning={shouldShowEmptyWarning('objectives')}
                  {...textCellProps}
                />
              </td>
            </tr>

            {/* 課程大綱 */}
            <tr>
              <td className={LABEL_CELL_MIDDLE}>課程大綱</td>
              <td className={VALUE_CELL_MIDDLE} colSpan={3}>
                <EditorTextCell
                  field="outline"
                  value={editedPlan.outline}
                  placeholder="請輸入課程大綱"
                  multiline
                  showWarning={shouldShowEmptyWarning('outline')}
                  {...textCellProps}
                />
              </td>
            </tr>

            {/* 完課筆記 */}
            <tr>
              <td className={LABEL_CELL_MIDDLE}>完課筆記</td>
              <td className={VALUE_CELL_MIDDLE} colSpan={3}>
                <EditorTextCell
                  field="completion_notes"
                  value={editedPlan.completion_notes || ''}
                  placeholder="請輸入完課筆記（選填）"
                  multiline
                  showWarning={false}
                  {...textCellProps}
                />
              </td>
            </tr>

            {/* 投影片 */}
            <tr>
              <td className={LABEL_CELL_LAST}>投影片</td>
              <td className="border border-black-200 pl-6 pr-10 py-4" colSpan={3}>
                <SlideUpload
                  initialFileName={plan.slide_pdf}
                  selectedFileName={editedPlan.slide_pdf}
                  onFileChange={handleSlideFileChange}
                  onFileRemove={handleSlideFileRemove}
                  onFileSelect={handleSlideFileSelect}
                />
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </div>
  );
});

TeachingPlanEditor.displayName = 'TeachingPlanEditor';

export default TeachingPlanEditor;
