export const ISSUE_START_YEAR = 25;
export const ISSUE_START_SEASON: '夏' | '冬' = '冬';
export const ISSUE_COUNT = 8;

export const SELECT_ALL_VALUE = '全選';
export const OLDER_ISSUE_VALUE = '__OLDER__';
export const OLDER_ISSUE_LABEL = '更久以前';

export function generateIssueLabels(
  startYear: number = ISSUE_START_YEAR,
  startSeason: '夏' | '冬' = ISSUE_START_SEASON,
  count: number = ISSUE_COUNT,
): string[] {
  const labels: string[] = [];
  let year = startYear;
  let season: '夏' | '冬' = startSeason;

  for (let i = 0; i < count; i++) {
    labels.push(`${year}${season}`);
    if (season === '冬') {
      year -= 1;
      season = '夏';
    } else {
      season = '冬';
    }
  }

  return labels;
}

export function getEarliestListedYear(
  startYear: number = ISSUE_START_YEAR,
  startSeason: '夏' | '冬' = ISSUE_START_SEASON,
  count: number = ISSUE_COUNT,
): number {
  const labels = generateIssueLabels(startYear, startSeason, count);
  const last = labels[labels.length - 1];
  const match = last?.match(/(\d{1,2})/);
  return match ? Number(match[1]) : startYear;
}

export function getOlderAcademicYearValues(
  startYear: number = ISSUE_START_YEAR,
  startSeason: '夏' | '冬' = ISSUE_START_SEASON,
  count: number = ISSUE_COUNT,
): string[] {
  const earliest = getEarliestListedYear(startYear, startSeason, count);
  const values: string[] = [];
  for (let year = earliest - 1; year >= 0; year--) {
    values.push(year.toString().padStart(2, '0'));
  }
  return values;
}
