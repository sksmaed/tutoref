'use client';
import { useEffect, useMemo, useState } from 'react';
import DropdownMulti, { Option } from './DropdownMulti';
import {
  generateIssueLabels,
  OLDER_ISSUE_LABEL,
  OLDER_ISSUE_VALUE,
  SELECT_ALL_VALUE,
} from '@/lib/issues';

type Props = {
  onFiltersChange?: (state: {
    categories: Set<string>;
    families: Set<string>;
    issues: Set<string>;
    grades: Set<string>;
    durations: Set<string>;
    hasAny: boolean;
  }) => void;

  /** ⭐ 新增：一開始渲染時帶入記憶值（陣列即可） */
  initialCategories?: string[];
  initialFamilies?: string[];
  initialIssues?: string[];
  initialGrades?: string[];
  initialDurations?: string[];
};


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

const FAMILIES: Option[] = [
  { value: '全選', label: '全選' },
  { value: '加拿', label: '加拿' },
  { value: '初來', label: '初來' },
  { value: '新武', label: '新武' },
  { value: '霧鹿', label: '霧鹿' },
  { value: '利稻', label: '利稻' },
  { value: '電光', label: '電光' },
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


export default function SearchFilters({
  onFiltersChange,
  initialCategories = [],
  initialFamilies = [],
  initialIssues = [],
  initialGrades = [],
  initialDurations = [],
}: Props) {
  const [cat, setCat]       = useState<Set<string>>(() => new Set(initialCategories));
  const [fam, setFam]       = useState<Set<string>>(() => new Set(initialFamilies));
  const [issue, setIssue]   = useState<Set<string>>(() => new Set(initialIssues));
  const [grade, setGrade]   = useState<Set<string>>(() => new Set(initialGrades));
  const [duration, setDur]  = useState<Set<string>>(() => new Set(initialDurations));

  const categoriesKey = useMemo(() => [...initialCategories].sort().join('|'), [initialCategories]);
  const familiesKey = useMemo(() => [...initialFamilies].sort().join('|'), [initialFamilies]);
  const issuesKey = useMemo(() => [...initialIssues].sort().join('|'), [initialIssues]);
  const gradesKey = useMemo(() => [...initialGrades].sort().join('|'), [initialGrades]);
  const durationsKey = useMemo(() => [...initialDurations].sort().join('|'), [initialDurations]);

  const categoriesPreset = useMemo(() => [...initialCategories], [categoriesKey]);
  const familiesPreset = useMemo(() => [...initialFamilies], [familiesKey]);
  const issuesPreset = useMemo(() => [...initialIssues], [issuesKey]);
  const gradesPreset = useMemo(() => [...initialGrades], [gradesKey]);
  const durationsPreset = useMemo(() => [...initialDurations], [durationsKey]);

  useEffect(() => {
    setCat(new Set(categoriesPreset));
  }, [categoriesPreset]);

  useEffect(() => {
    setFam(new Set(familiesPreset));
  }, [familiesPreset]);

  useEffect(() => {
    setIssue(new Set(issuesPreset));
  }, [issuesPreset]);

  useEffect(() => {
    setGrade(new Set(gradesPreset));
  }, [gradesPreset]);

  useEffect(() => {
    setDur(new Set(durationsPreset));
  }, [durationsPreset]);

  const hasAny = useMemo(() => {
    const nz = (s: Set<string>) => [...s].filter(v => v !== SELECT_ALL_VALUE).length > 0;
    return nz(cat) || nz(fam) || nz(issue) || nz(grade) || nz(duration);
  }, [cat, fam, issue, grade, duration]);

  useEffect(() => {
    onFiltersChange?.({ categories: cat, families: fam, issues: issue, grades: grade, durations: duration, hasAny });
  }, [cat, fam, issue, grade, duration, hasAny, onFiltersChange]);

  const clearAll = () => {
    setCat(new Set()); setFam(new Set()); setIssue(new Set());
    setGrade(new Set()); setDur(new Set());
  };

  return (
    <div
      className="flex items-center justify-center gap-3 mx-auto mt-4 w-full"
      aria-label="搜尋篩選列"
    >
      <div className="flex items-center gap-3 w-[860px] hover:cursor-pointer">
        <DropdownMulti label="類別" options={CATEGORIES} value={cat} onChange={setCat} />
        <DropdownMulti label="家別" options={FAMILIES} value={fam} onChange={setFam} />
        <DropdownMulti label="期數" options={ISSUES} value={issue} onChange={setIssue} />
        <DropdownMulti label="年級" options={GRADES} value={grade} onChange={setGrade} />
        <DropdownMulti
          label="時長"
          options={DURATIONS}
          value={duration}
          onChange={setDur}
          triggerWidth={204}
          triggerHeight={40}
          panelWidth={204}
          panelHeight={176}
        />
      </div>

      {/* 清除所有：有條件才啟用顏色變 primary-900 */}
      <button
        type="button"
        onClick={hasAny ? clearAll : undefined}
        disabled={!hasAny}
        aria-disabled={!hasAny}
        className={`
          h-[35px] w-[104px] px-6 text-[16px] leading-[150%] font-normal font-['Noto_Sans_TC'] whitespace-nowrap
          ${hasAny ? 'text-primary-900 cursor-pointer' : 'text-black-900 cursor-not-allowed'}
        `}
      >
        清除所有
      </button>
    </div>
  );
}
