'use client';
import { useEffect, useMemo, useState } from 'react';
import { DURATION_INVERSE_MAP } from '@/lib/constants';
import {
  addFavorite,
  removeFavorite,
  fetchFavorites,
  fetchTeachingPlanDetail,
  TeachingPlanDetail,
} from '@/services/teaching-plan';
import { normalizeCategory } from '@/lib/categories';
import { OLDER_ISSUE_VALUE, compareIssues, getOlderAcademicYearValues } from '@/lib/issues';
import type { Filters, Row, SearchPlan, IssueSortValue } from './types';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
const API_PREFIX = BACKEND_URL ? `${BACKEND_URL}/teaching-plan` : '';

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
  const createdAtMs = p.created_at ? Date.parse(p.created_at) : Number.NaN;
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
    viewCount: typeof p.view_count === 'number' ? p.view_count : undefined,
    searchScore: typeof p.search_score === 'number' ? p.search_score : undefined,
    createdAt: Number.isFinite(createdAtMs) ? createdAtMs : undefined,
    hashtags: Array.isArray(p.hashtags) ? p.hashtags : [],
  };
}

interface UseSearchResultsParams {
  query: string;
  filters: Filters;
  trigger: number;
  initialSort: IssueSortValue;
  initialOnlyGood: boolean;
}

/**
 * SearchResults 的搜尋 / 排序 / 分頁 / 收藏 / 詳情 modal 全部狀態
 * （自原元件抽出，邏輯不變）。
 */
export function useSearchResults({
  query,
  filters,
  trigger,
  initialSort,
  initialOnlyGood,
}: UseSearchResultsParams) {
  const [sort, setSort] = useState<IssueSortValue>(() =>
    query.trim().length > 0 ? 'relevance_desc' : initialSort
  );
  const [onlyGood, setOnlyGood] = useState<boolean>(initialOnlyGood);

  // 當外部觸發新搜尋時，重設排序與優良篩選
  useEffect(() => {
    if (trigger === 0) return;
    setSort(query.trim().length > 0 ? 'relevance_desc' : initialSort);
    setOnlyGood(initialOnlyGood);
  }, [trigger, initialSort, initialOnlyGood, query]);
  const [rawRows, setRawRows] = useState<Row[]>([]);
  const [searching, setSearching] = useState(() => trigger > 0);
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

    setSearching(true);
    setRawRows([]);

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
          setSearching(false);
        }
      } catch {
        if (!aborted) {
          setRawRows([]);
          setPage(1);
          setSearching(false);
        }
      }
    })();

    return () => {
      aborted = true;
      controller.abort();
    };
  }, [trigger, queryString]);


  // ---- 前端排序（保留你原本的互動）----
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
      switch (sort) {
        case 'issue_asc':
          return compareIssues(a.issue, b.issue);
        case 'views_desc':
          return (b.viewCount ?? 0) - (a.viewCount ?? 0);
        case 'relevance_desc':
          return (b.searchScore ?? 0) - (a.searchScore ?? 0);
        case 'uploaded_desc':
          return (b.createdAt ?? 0) - (a.createdAt ?? 0);
        case 'issue_desc':
        default:
          return compareIssues(b.issue, a.issue);
      }
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

  return {
    sort,
    setSort,
    onlyGood,
    setOnlyGood,
    searching,
    page,
    setPage,
    total,
    displayTotalPages,
    pageRows,
    detailModalOpen,
    detailPlanId,
    detailPlan,
    detailSummary,
    detailLiked,
    detailLoading,
    favoritePendingId,
    toggleLike,
    handleView,
    handleCloseDetailModal,
    handleModalFavoriteToggle,
  };
}
