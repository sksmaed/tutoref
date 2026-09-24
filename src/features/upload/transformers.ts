import { TeachingPlan } from '@/types/api';
import { filterOptions } from '@/types/filter';
import { DURATION_INVERSE_MAP, DURATION_MAP } from '@/lib/constants';
import { normalizeCategory } from '@/lib/categories';
import type { UploadMode } from './types';

export const formatDurationLabel = (value: number | string | null | undefined): string => {
  if (typeof value === 'number') {
    return DURATION_MAP[value] ?? `${value}分鐘`;
  }
  if (typeof value === 'string') {
    return value;
  }
  return '';
};

export const splitSemester = (value: string) => {
  const trimmed = (value ?? '').trim();
  if (trimmed.length < 3) {
    return { academicYear: '', semesterPeriod: '' };
  }
  return {
    academicYear: trimmed.slice(0, 2),
    semesterPeriod: trimmed.slice(2),
  };
};

/** 後端回傳（detail / extract）→ 前端 TeachingPlan 形狀（含類別正規化）。 */
export const normalizeTeachingPlan = (plan: any): TeachingPlan => {
  const semester = plan?.semester ?? `${plan?.academic_year ?? ''}${plan?.semester_period ?? ''}`;
  const rawCategory = plan?.category ?? '';
  const trimmedCategory = rawCategory.trim();
  const normalizedCategory = trimmedCategory ? normalizeCategory(trimmedCategory) : '';
  const category = trimmedCategory
    ? (filterOptions.category.includes(trimmedCategory) ? trimmedCategory : normalizedCategory)
    : '';

  // 後端有時可能不回傳 slide_pdf（例如只回傳更新欄位），這裡保持原值由呼叫端決定；若有 slide_pdf_file 名稱也可帶入
  const slidePdfName = plan?.slide_pdf || '';

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
    sheet_pdf: plan?.sheet_pdf ?? '',
    slide_pdf: slidePdfName,
    content: plan?.content ?? '',
  };
};

export const inferDurationValue = (label: string): number | undefined => {
  if (!label) return undefined;
  if (Object.prototype.hasOwnProperty.call(DURATION_INVERSE_MAP, label)) {
    return DURATION_INVERSE_MAP[label];
  }
  const match = label.match(/(\d+)/);
  return match ? Number(match[1]) : undefined;
};

/** 前端 TeachingPlan → PATCH /detail/{id} 的更新 payload。 */
export const toUpdatePayload = (plan: TeachingPlan) => {
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

/** 前端 TeachingPlan → POST /upload-file 的建立 payload。 */
export const toCreatePayload = (plan: TeachingPlan, uploadMode?: UploadMode) => {
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
    ...(uploadMode ? { upload_mode: uploadMode } : {}),
    // slide_pdf 改為透過 FormData 中的 slide_pdf_file 處理
  };
};
