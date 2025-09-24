'use client';
import { useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { DURATION_INVERSE_MAP } from '@/lib/constant';
import {
  addFavorite,
  removeFavorite,
  fetchFavorites,
  fetchTeachingPlanDetail,
  TeachingPlanDetail,
} from '@/services/teachingPlan';
import { normalizeCategory } from '@/lib/categories';
import { OLDER_ISSUE_VALUE, getOlderAcademicYearValues } from '@/lib/issues';
import { TeachingPlanDetailModal } from '@/components/ui/TeachingPlanDetailModal';

type Filters = {
  categories: Set<string>;
  families: Set<string>;
  issues: Set<string>;   // 例如：'25冬'、'24夏'
  grades: Set<string>;
  durations: Set<string>;
};

type Row = {
  id: string;
  family: string;        // 家別 → team
  issue: string;         // e.g. '25冬'（academic_year + semester_period）
  category: string;      // 原始類別名稱 → category
  categoryGroup: string; // 類別群組（正規化後）
  title: string;         // 教案名稱 → tp_name
  author: string;        // 撰寫者 → writer_name
  good?: boolean;        // 是否優良 → is_excellent
  liked?: boolean;
  grade?: string;
  duration?: number;
};

type SearchPlan = {
  id?: string;
  team?: string;
  academic_year?: string;
  semester_period?: string;
  category?: string;
  tp_name?: string;
  writer_name?: string;
  is_excellent?: boolean;
  grade?: string;
  duration?: number;
};

const SORTS = [
  { value: 'issue_desc', label: '期數由新到舊' },
  { value: 'issue_asc',  label: '期數由舊到新' },
  { value: 'title_asc',  label: '名稱 A → Z' },
  { value: 'title_desc', label: '名稱 Z → A' },
] as const;

const goodTint = {
  filter:
    'brightness(0) saturate(100%) invert(49%) sepia(12%) saturate(1148%) hue-rotate(47deg) brightness(88%) contrast(87%)',
};

const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? '';
const API_PREFIX = BACKEND_URL ? `${BACKEND_URL}/api/v2/teaching-plan` : '';

function buildSearchParams(query: string, filters: Filters): URLSearchParams {
  const params = new URLSearchParams();

  query
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .forEach((text) => params.append('search_texts', text));

  filters.families.forEach((value) => params.append('team', value));
  filters.categories.forEach((value) => params.append('category', value));
  filters.grades.forEach((value) => params.append('grade', value));

  const includeOlderIssues = filters.issues.has(OLDER_ISSUE_VALUE);

  const explicitYears = new Set<string>();

  filters.issues.forEach((value) => {
    if (value !== OLDER_ISSUE_VALUE) {
      params.append('academic_year', value);
      explicitYears.add(value);
    }
  });

  if (includeOlderIssues) {
    const olderYears = getOlderAcademicYearValues();
    olderYears.forEach((year) => {
      if (!explicitYears.has(year)) {
        params.append('academic_year', year);
      }
    });
  }

  Array.from(filters.durations)
    .map((label) => DURATION_INVERSE_MAP[label])
    .filter((value): value is number => typeof value === 'number')
    .forEach((value) => params.append('duration', String(value)));

  return params;
}

/** 後端回傳 TeachingPlan → 映射成 Row（符合你表格顯示欄位） */
function mapPlanToRow(p: SearchPlan): Row {
  return {
    id: String(p.id ?? crypto.randomUUID()),
    family: p.team ?? '',
    issue: `${p.academic_year ?? ''}${p.semester_period ?? ''}`,
    category: p.category ?? '',
    categoryGroup: normalizeCategory(p.category),
    title: p.tp_name ?? '',
    author: p.writer_name ?? '',
    good: !!p.is_excellent,
    liked: false,
    grade: p.grade ?? '',
    duration: typeof p.duration === 'number' ? p.duration : undefined,
  };
}

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

export default function SearchResults({
  query,
  filters,
  trigger,
}: {
  query: string;
  filters: Filters;
  trigger: number;
}) {
  const [sort, setSort] = useState<string>('issue_desc');
  const [onlyGood, setOnlyGood] = useState<boolean>(false);
  const [rawRows, setRawRows] = useState<Row[]>([]);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());
  const [page, setPage] = useState<number>(1);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailPlanId, setDetailPlanId] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<Row | null>(null);
  const [detailPlan, setDetailPlan] = useState<TeachingPlanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [favoritePendingId, setFavoritePendingId] = useState<string | null>(null);
  const pageSize = 10;

  // ---- 真正打 API 的搜尋 ----
  const params = useMemo(() => buildSearchParams(query, filters), [query, filters]);
  const queryString = useMemo(() => params.toString(), [params]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const favorites = await fetchFavorites();
        if (!mounted) return;
        setFavoriteIds(new Set(favorites.map((plan) => plan.id)));
      } catch {
        if (mounted) setFavoriteIds(new Set());
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!detailModalOpen || !detailPlanId) {
      setDetailLoading(false);
      return;
    }

    if (detailPlan && detailPlan.id === detailPlanId) {
      setDetailLoading(false);
      return;
    }

    let cancelled = false;
    setDetailLoading(true);

    (async () => {
      try {
        const payload = await fetchTeachingPlanDetail(detailPlanId);
        if (!cancelled) {
          setDetailPlan(payload);
        }
      } catch {
        if (!cancelled) {
          setDetailPlan(null);
        }
      } finally {
        if (!cancelled) {
          setDetailLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [detailModalOpen, detailPlanId, detailPlan]);

  useEffect(() => {
    if (trigger === 0 || !API_PREFIX) return; // 尚未按搜尋或後端未設定
    let aborted = false;
    const controller = new AbortController();

    (async () => {
      try {
        const url = queryString ? `${API_PREFIX}/search?${queryString}` : `${API_PREFIX}/search`;
        const res = await fetch(url, {
          method: 'GET',
          credentials: 'include',
          signal: controller.signal,
        });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const json = await res.json(); // { status, data, count, ... }
        const items = Array.isArray(json?.data) ? json.data.map(mapPlanToRow) : [];
        if (!aborted) {
          setRawRows(items);
          setPage(1);
        }
      } catch {
        if (!aborted) {
          setRawRows([]);
          setPage(1);
        }
      }
    })();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [trigger, queryString]);

  // ---- 前端排序（保留你原本的互動）----
  const seasonRank = (season: string) => {
    const mapping: Record<string, number> = { 春: 1, 夏: 2, 秋: 3, 冬: 4 };
    return mapping[season] ?? 0;
  };
  const rowsWithFavorites = useMemo(
    () =>
      rawRows.map((row) => ({
        ...row,
        liked: favoriteIds.has(row.id),
      })),
    [rawRows, favoriteIds],
  );

  const detailSummary = useMemo(() => {
    if (!detailRow) return null;
    const matchPlan = detailPlan && detailPlan.id === detailRow.id ? detailPlan : null;
    return {
      id: detailRow.id,
      title: detailRow.title,
      team: detailRow.family,
      issue: detailRow.issue,
      category: detailRow.category,
      author: detailRow.author,
      grade: matchPlan?.grade ?? detailRow.grade ?? '',
      duration: matchPlan?.duration ?? detailRow.duration ?? null,
      isExcellent: matchPlan?.is_excellent ?? detailRow.good ?? false,
    };
  }, [detailRow, detailPlan]);

  const detailLiked = detailPlanId
    ? favoriteIds.has(detailPlanId)
    : detailRow
      ? favoriteIds.has(detailRow.id)
      : false;

  const filteredRows = useMemo(
    () => (onlyGood ? rowsWithFavorites.filter((r) => r.good) : rowsWithFavorites),
    [rowsWithFavorites, onlyGood],
  );
  const sortedRows = useMemo(() => {
    const list = [...filteredRows];
    list.sort((a, b) => {
      if (sort === 'title_asc') return a.title.localeCompare(b.title, 'zh-Hant');
      if (sort === 'title_desc') return b.title.localeCompare(a.title, 'zh-Hant');
      // issue 排序：academic_year（數字） + semester_period（春<夏<秋<冬）
      const ayA = parseInt(a.issue.slice(0, 2) || '0', 10);
      const ayB = parseInt(b.issue.slice(0, 2) || '0', 10);
      const spA = seasonRank(a.issue.slice(2));
      const spB = seasonRank(b.issue.slice(2));
      const cmp = ayA === ayB ? spA - spB : ayA - ayB;
      return sort === 'issue_asc' ? cmp : -cmp;
    });
    return list;
  }, [filteredRows, sort]);

  // ---- 分頁（沿用你原本做法）----
  const total = sortedRows.length;
  const totalPages = Math.max(0, Math.ceil(total / pageSize));
  const displayTotalPages = Math.max(1, totalPages);
  const pageRows = useMemo(() => {
    if (total === 0) return [];
    const start = (page - 1) * pageSize;
    return sortedRows.slice(start, start + pageSize);
  }, [sortedRows, total, page]);

  const updateFavorite = async (id: string, shouldLike: boolean) => {
    setFavoritePendingId(id);
    setFavoriteIds((prev) => {
      const next = new Set(prev);
      if (shouldLike) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });

    try {
      if (shouldLike) {
        await addFavorite(id);
      } else {
        await removeFavorite(id);
      }
    } catch (error) {
      setFavoriteIds((prev) => {
        const next = new Set(prev);
        if (shouldLike) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      throw error;
    } finally {
      setFavoritePendingId(null);
    }
  };

  const toggleLike = async (id: string) => {
    const shouldLike = !favoriteIds.has(id);
    try {
      await updateFavorite(id, shouldLike);
    } catch {
      /* ignore */
    }
  };

  const handleView = (row: Row) => {
    setDetailRow(row);
    setDetailPlanId(row.id);
    setDetailPlan((prev) => (prev && prev.id === row.id ? prev : null));
    setDetailModalOpen(true);
  };

  const handleCloseDetailModal = () => {
    setDetailModalOpen(false);
    setDetailPlanId(null);
    setDetailRow(null);
    setDetailPlan(null);
  };

  const handleModalFavoriteToggle = async (planId: string, nextLiked: boolean) => {
    try {
      await updateFavorite(planId, nextLiked);
    } catch {
      /* ignore */
    }
  };

  return (
    <>
      <section className="mt-10 mx-auto w-[976px]">
      {/* 標題 + 右側控制列 */}
      <div className="flex items-end gap-3">
        <h2 className="w-[100px] h-[38px] text-[25px] leading-[150%] font-bold font-['Noto_Sans_TC'] text-black-900">
          檢索結果
        </h2>
        <span className="w-[120px] h-6 text-[16px] leading-[150%] font-normal font-['Noto_Sans_TC'] text-black-900">
          （共 {total} 筆）
        </span>

        <div className="ml-auto flex items-center gap-3">
          {/* 優良教案切換 */}
          <button
            type="button"
            aria-pressed={onlyGood}
            onClick={() => setOnlyGood((v) => !v)}
            className={[
              'h-[32px] w-[102px] inline-flex items-center justify-center gap-[3px]',
              'rounded-[8px] px-[12px] py-[5px] bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]',
              'border',
              onlyGood ? 'border-primary-900 text-primary-900' : 'border-transparent text-black-900',
            ].join(' ')}
            title="只看優良教案"
          >
            <Image src="/icons/good.png" alt="" width={16} height={16}
              style={onlyGood ? { filter: 'brightness(0) saturate(100%) invert(55%) sepia(87%) saturate(624%) hue-rotate(346deg) brightness(96%) contrast(95%)' } : undefined}
            />
            <span className="text-[14px] leading-[150%] font-normal font-['Noto_Sans_TC']">優良教案</span>
          </button>

          {/* 排序 */}
          <div className="relative h-[32px] w-[140px] rounded-[8px] bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none h-[32px] w-full rounded-[8px] pl-[12px] pr-[28px] text-[14px] leading-[32px] bg-transparent font-['Noto_Sans_TC'] font-normal border-0 outline-none"
              aria-label="排序方式"
            >
              {SORTS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
            <Image src="/icons/angle-down.png" alt="" width={20} height={20}
              className="pointer-events-none absolute right-[8px] top-1/2 -translate-y-1/2"
            />
          </div>
        </div>
      </div>

      {/* 表格容器（沿用你的 UI） */}
      <div className="mt-4 w-[976px] mx-auto rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] bg-white">
        {/* 表頭 */}
        <div className="w-[976px] h-[48px] flex">
          <HeaderCell className="rounded-tl-lg">家別</HeaderCell>
          <HeaderCell>期數</HeaderCell>
          <HeaderCell>類別</HeaderCell>
          <HeaderCell wide="title">教案名稱</HeaderCell>
          <HeaderCell wide="author">撰寫者</HeaderCell>
          <HeaderCell>查看</HeaderCell>
          <HeaderCell className="rounded-tr-lg">收藏</HeaderCell>
        </div>

        {/* 內容 */}
        {pageRows.length === 0 ? (
          <div className="w-[976px] h-[48px] flex items-center justify-center border-x border-b border-black-200 rounded-b-lg px-11">
            <p className="w-[336px] h-6 text-[16px] leading-[150%] font-normal font-['Noto_Sans_TC'] text-black-700 text-center">
              查無符合條件的教案，請調整檢索條件後再試。
            </p>
          </div>
        ) : (
          <div className="border-x border-b border-black-200 rounded-b-lg divide-y">
            {pageRows.map((r) => (
              <div key={r.id} className="flex h-[48px] items-center text-[14px]">
                <BodyCell w="92">{r.family}</BodyCell>
                <BodyCell w="92">{r.issue}</BodyCell>
                <BodyCell w="92">{r.category}</BodyCell>
                <BodyCell w="352">
                  <div className="flex items-center justify-center gap-2">
                    {r.good && (
                      <Image src="/icons/good.png" alt="" width={16} height={16} style={goodTint} />
                    )}
                    <span className="truncate">{r.title}</span>
                  </div>
                </BodyCell>
                <BodyCell w="164">{r.author}</BodyCell>
                <BodyCell w="92" center>
                  <button
                    type="button"
                    onClick={() => handleView(r)}
                    aria-label="查看"
                    disabled={detailLoading && detailPlanId === r.id}
                    className={detailLoading && detailPlanId === r.id ? 'cursor-not-allowed opacity-60' : ''}
                  >
                    <Image src="/icons/file-alt.png" alt="查看" width={20} height={20} />
                  </button>
                </BodyCell>
                <BodyCell w="92" center>
                  <button
                    type="button"
                    onClick={() => toggleLike(r.id)}
                    aria-label={r.liked ? '取消收藏' : '加入收藏'}
                    disabled={favoritePendingId === r.id}
                    className={favoritePendingId === r.id ? 'cursor-not-allowed opacity-60' : ''}
                  >
                    <Image src={r.liked ? '/icons/liked.png' : '/icons/like.png'} alt="" width={20} height={20} />
                  </button>
                </BodyCell>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="mt-6 w-[320px] h-[36px] mx-auto flex items-center justify-center gap-2">
        <PageBtn icon="/icons/angle-left-double.png" disabled={page <= 1} onClick={() => setPage(1)} />
        <PageBtn icon="/icons/angle-left.png" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
        <div className="w-[160px] h-[24px] flex items-center justify-center gap-2 text-[16px] font-['Noto_Sans_TC']">
          第 {pad2(total === 0 ? 0 : page)} 頁，共 {pad2(displayTotalPages)} 頁
        </div>
        <PageBtn icon="/icons/angle-right.png" disabled={page >= displayTotalPages} onClick={() => setPage((p) => Math.min(displayTotalPages, p + 1))} />
        <PageBtn icon="/icons/angle-right-double.png" disabled={page >= displayTotalPages} onClick={() => setPage(displayTotalPages)} />
      </div>
      </section>

      <TeachingPlanDetailModal
        open={detailModalOpen}
        loading={detailLoading}
        plan={detailPlan && detailPlan.id === detailPlanId ? detailPlan : null}
        summary={detailSummary}
        liked={detailLiked}
        favoriteLoading={favoritePendingId === detailPlanId}
        onClose={handleCloseDetailModal}
        onToggleFavorite={handleModalFavoriteToggle}
      />
    </>
  );
}

/** 分頁按鈕 / 表頭 / 內容欄位（原樣保留） */
function PageBtn({ icon, disabled, onClick }: { icon: string; disabled?: boolean; onClick?: () => void; }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={`w-[32px] h-[36px] inline-flex items-center justify-center rounded-[4px] px-[10px] py-[4px] border border-black-200 bg-white ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-black-100'}`}>
      <Image src={icon} alt="" width={20} height={20} />
    </button>
  );
}
function HeaderCell({ children, className = '', wide }: { children: React.ReactNode; className?: string; wide?: 'title' | 'author'; }) {
  const base =
    'flex items-center justify-center text-[14px] font-bold font-["Noto_Sans_TC"] text-black-900 border border-black-200 bg-primary-100 whitespace-nowrap break-normal';
  const padNormal = 'py-2 px-2';
  const padTitle = 'py-2 px-[30px]';
  const wClass = wide === 'title' ? 'w-[352px]' : wide === 'author' ? 'w-[164px]' : 'w-[92px]';
  return <div className={`${base} ${wClass} ${wide ? padTitle : padNormal} ${className}`} style={{ wordBreak: 'keep-all' }}>{children}</div>;
}
function BodyCell({ children, w, center = true }: { children: React.ReactNode; w: '92' | '164' | '352'; center?: boolean; }) {
  return (
    <div className={[`w-[${w}px] h-[48px] px-2 flex items-center`, center ? 'justify-center text-center' : '', 'border-x border-b border-black-200 first:border-l-0 last:border-r-0',].join(' ')}>
      {children}
    </div>
  );
}
