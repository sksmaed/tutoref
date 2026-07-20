import React from 'react';
import { TeachingPlan } from '@/types/api';
import RadioCheckboxGroup from '@/components/ui/RadioCheckboxGroup';

const EMPTY_WARNING_TEXT = '此欄位不可為空白唷！';

/** 必填欄位空白警示（與原版相同的紅字樣式）。 */
export function EmptyFieldWarning() {
  return <div className="text-red-500 text-sm mt-1">{EMPTY_WARNING_TEXT}</div>;
}

interface EditorTextCellProps {
  field: keyof TeachingPlan;
  value: string;
  placeholder: string;
  /** true 時渲染 textarea（rows=4），false 時渲染單行 input。 */
  multiline?: boolean;
  hoveredField: string | null;
  setHoveredField: (field: string | null) => void;
  onChange: (field: keyof TeachingPlan, value: string) => void;
  onClear: (field: keyof TeachingPlan) => void;
  onBlur: (field: string) => void;
  showWarning: boolean;
}

/**
 * 可編輯文字欄位（hover 顯示清除按鈕 + 必填警示）。
 * 自 TeachingPlanEditor 內重複五次的 input/textarea 區塊抽出，DOM 結構與原版一致。
 */
export function EditorTextCell({
  field,
  value,
  placeholder,
  multiline = false,
  hoveredField,
  setHoveredField,
  onChange,
  onClear,
  onBlur,
  showWarning,
}: EditorTextCellProps) {
  return (
    <div
      className="relative group"
      onMouseEnter={() => setHoveredField(field)}
      onMouseLeave={() => setHoveredField(null)}
    >
      {multiline ? (
        <textarea
          className="w-full border-none outline-hidden resize-none bg-transparent text-base text-black-900 leading-normal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(field, e.target.value)}
          onBlur={() => onBlur(field)}
          rows={4}
        />
      ) : (
        <input
          type="text"
          className="w-full border-none outline-hidden bg-transparent text-base text-black-900 leading-normal"
          value={value}
          placeholder={placeholder}
          onChange={(e) => onChange(field, e.target.value)}
          onBlur={() => onBlur(field)}
        />
      )}

      {hoveredField === field && value && (
        <button
          className={
            multiline
              ? 'absolute right-2 top-2 text-black-400 hover:text-black-600 hover:cursor-pointer'
              : 'absolute right-2 top-1/2 transform -translate-y-1/2 text-black-400 hover:text-black-600 hover:cursor-pointer'
          }
          onClick={() => onClear(field)}
        >
          ✕
        </button>
      )}

      {showWarning && <EmptyFieldWarning />}
    </div>
  );
}

interface EditorChoiceCellProps {
  field: keyof TeachingPlan;
  options: string[];
  selectedValue: string;
  onChange: (field: keyof TeachingPlan, value: string) => void;
  onBlur: (field: string) => void;
  showWarning: boolean;
}

/**
 * 單選欄位（家別／類別／適用年級／課程時長共用），選取後同時標記為已觸碰。
 */
export function EditorChoiceCell({
  field,
  options,
  selectedValue,
  onChange,
  onBlur,
  showWarning,
}: EditorChoiceCellProps) {
  return (
    <div>
      <RadioCheckboxGroup
        options={options}
        selectedValue={selectedValue}
        onChange={(value) => {
          onChange(field, value);
          onBlur(field);
        }}
      />
      {showWarning && <EmptyFieldWarning />}
    </div>
  );
}
