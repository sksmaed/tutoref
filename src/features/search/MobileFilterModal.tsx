'use client';
import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import DropdownMulti, { Option } from '@/components/ui/DropdownMulti';
import { generateIssueLabels, OLDER_ISSUE_LABEL, OLDER_ISSUE_VALUE, SELECT_ALL_VALUE } from '@/lib/issues';

type FilterState = {
  categories: Set<string>;
  families: Set<string>;
  issues: Set<string>;
  grades: Set<string>;
  durations: Set<string>;
};

type Props = {
  isOpen: boolean;
  onClose: () => void;
  onApply: (filters: FilterState) => void;
  initial: FilterState;
};

const FAMILIES: Option[] = [
  { value: '全選', label: '全選' },
  { value: '加拿', label: '加拿' },
  { value: '初來', label: '初來' },
  { value: '新武', label: '新武' },
  { value: '霧鹿', label: '霧鹿' },
  { value: '利稻', label: '利稻' },
  { value: '電光', label: '電光' },
];

const CATEGORIES: Option[] = [
  { value: SELECT_ALL_VALUE, label: SELECT_ALL_VALUE },
  { value: '自然', label: '自然' },
  { value: '社會', label: '社會' },
  { value: '綜合', label: '綜合' },
  { value: '資訊', label: '資訊' },
  { value: '藝文', label: '藝文' },
  { value: '國語', label: '國語' },
  { value: '健教', label: '健教' },
  { value: '晨讀', label: '晨讀' },
  { value: '英文', label: '英文' },
  { value: '其他', label: '其他' },
];

const ISSUE_LABELS = generateIssueLabels();
const ISSUES: Option[] = [
  { value: SELECT_ALL_VALUE, label: SELECT_ALL_VALUE },
  ...ISSUE_LABELS.map((label) => ({ value: label, label })),
  { value: OLDER_ISSUE_VALUE, label: OLDER_ISSUE_LABEL },
];

const GRADES: Option[] = [
  { value: '全選', label: '全選' },
  { value: '低年級', label: '低年級' },
  { value: '中年級', label: '中年級' },
  { value: '高年級', label: '高年級' },
  { value: '低中年級', label: '低中年級' },
  { value: '中高年級', label: '中高年級' },
  { value: '全年級', label: '全年級' },
];

const DURATIONS: Option[] = [
  { value: '全選', label: '全選' },
  { value: '大堂課（90分鐘）', label: '大堂課（90分鐘）' },
  { value: '小堂課（40分鐘）', label: '小堂課（40分鐘）' },
  { value: '其他', label: '其他' },
];

export default function MobileFilterModal({ isOpen, onClose, onApply, initial }: Props) {
  const [cat, setCat] = useState<Set<string>>(new Set(initial.categories));
  const [fam, setFam] = useState<Set<string>>(new Set(initial.families));
  const [issue, setIssue] = useState<Set<string>>(new Set(initial.issues));
  const [grade, setGrade] = useState<Set<string>>(new Set(initial.grades));
  const [dur, setDur] = useState<Set<string>>(new Set(initial.durations));

  // 每次開啟時同步外部狀態
  useEffect(() => {
    if (isOpen) {
      setCat(new Set(initial.categories));
      setFam(new Set(initial.families));
      setIssue(new Set(initial.issues));
      setGrade(new Set(initial.grades));
      setDur(new Set(initial.durations));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleApply = () => {
    onApply({ categories: cat, families: fam, issues: issue, grades: grade, durations: dur });
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      {/* 遮罩 */}
      <div className="absolute inset-0 bg-black/50" onClick={handleCancel} aria-hidden />

      {/* Modal 本體 */}
      <div className="relative w-full max-w-[360px] sm:max-w-[480px] bg-white rounded-2xl px-6 pt-5 pb-6 shadow-xl">
        {/* 標題列 */}
        <div className="flex items-center justify-between mb-6">
          <span className="text-[18px] font-bold font-['Noto_Sans_TC'] text-black-900">篩選條件</span>
          <button type="button" onClick={handleCancel} aria-label="關閉篩選" className="cursor-pointer">
            <X className="w-5 h-5 text-black-500" />
          </button>
        </div>

        {/* Dropdowns */}
        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-[14px] font-['Noto_Sans_TC'] text-black-900 mb-2">類別</label>
            <DropdownMulti label="所有類別" options={CATEGORIES} value={cat} onChange={setCat} triggerWidth="100%" panelWidth="100%" />
          </div>
          <div>
            <label className="block text-[14px] font-['Noto_Sans_TC'] text-black-900 mb-2">家別</label>
            <DropdownMulti label="所有家別" options={FAMILIES} value={fam} onChange={setFam} triggerWidth="100%" panelWidth="100%" />
          </div>
          <div>
            <label className="block text-[14px] font-['Noto_Sans_TC'] text-black-900 mb-2">期數</label>
            <DropdownMulti label="所有期數" options={ISSUES} value={issue} onChange={setIssue} triggerWidth="100%" panelWidth="100%" />
          </div>
          <div>
            <label className="block text-[14px] font-['Noto_Sans_TC'] text-black-900 mb-2">年級</label>
            <DropdownMulti label="所有年級" options={GRADES} value={grade} onChange={setGrade} triggerWidth="100%" panelWidth="100%" />
          </div>
          <div>
            <label className="block text-[14px] font-['Noto_Sans_TC'] text-black-900 mb-2">時長</label>
            <DropdownMulti label="所有時長" options={DURATIONS} value={dur} onChange={setDur} triggerWidth="100%" panelWidth="100%" panelHeight={176} />
          </div>
        </div>

        {/* 按鈕列 */}
        <div className="flex gap-3 mt-6">
          <button
            type="button"
            onClick={handleCancel}
            className="flex-1 h-[48px] rounded-full border border-primary-900 text-primary-900 text-[16px] font-['Noto_Sans_TC'] cursor-pointer hover:bg-primary-50"
          >
            取消
          </button>
          <button
            type="button"
            onClick={handleApply}
            className="flex-1 h-[48px] rounded-full bg-primary-900 text-white text-[16px] font-['Noto_Sans_TC'] cursor-pointer hover:bg-primary-800"
          >
            套用
          </button>
        </div>
      </div>
    </div>
  );
}
