export const PRIMARY_CATEGORY_LABELS = [
  '自然',
  '社會',
  '綜合',
  '資訊',
  '藝文',
  '國語',
  '健教',
  '晨讀',
  '英文',
] as const;

export const OTHER_CATEGORY_LABEL = '其他';

const PRIMARY_CATEGORY_SET = new Set<string>(PRIMARY_CATEGORY_LABELS);

export function normalizeCategory(label: string | null | undefined): string {
  if (!label) return OTHER_CATEGORY_LABEL;
  const trimmed = label.trim();
  if (!trimmed) return OTHER_CATEGORY_LABEL;
  return PRIMARY_CATEGORY_SET.has(trimmed) ? trimmed : OTHER_CATEGORY_LABEL;
}

export function isPrimaryCategory(label: string): boolean {
  return PRIMARY_CATEGORY_SET.has(label);
}
