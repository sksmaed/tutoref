'use client';
import { useEffect, useMemo, useState } from 'react';
import { DURATION_INVERSE_MAP } from '@/lib/constant';
import {
  addFavorite,
  removeFavorite,
  fetchFavorites,
  fetchTeachingPlanDetail,
  TeachingPlanDetail,
} from '@/services/teachingPlan';
import { normalizeCategory } from '@/lib/categories';
import { OLDER_ISSUE_VALUE, compareIssues, getOlderAcademicYearValues } from '@/lib/issues';
import IssueSortDropdown, { ISSUE_SORT_OPTIONS } from '@/components/ui/IssueSortDropdown';
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
  viewCount?: number;
  searchScore?: number;
  createdAt?: number;
  hashtags?: string[];
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
  view_count?: number;
  search_score?: number;
  created_at?: string;
  hashtags?: string[];
};

const goodTint = {
  filter:
    'brightness(0) saturate(100%) invert(49%) sepia(12%) saturate(1148%) hue-rotate(47deg) brightness(88%) contrast(87%)',
};

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

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

type IssueSortValue = (typeof ISSUE_SORT_OPTIONS)[number]['value'];

export default function SearchResults({
  query,
  filters,
  trigger,
  initialSort = 'issue_desc',
  initialOnlyGood = false,
}: {
  query: string;
  filters: Filters;
  trigger: number;
  initialSort?: IssueSortValue;
  initialOnlyGood?: boolean;
}) {
  const [sort, setSort] = useState<IssueSortValue>(initialSort);
  const [onlyGood, setOnlyGood] = useState<boolean>(initialOnlyGood);

  // 當外部觸發新搜尋時，同步初始 sort / onlyGood
  useEffect(() => {
    if (trigger === 0) return;
    setSort(initialSort);
    setOnlyGood(initialOnlyGood);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [trigger]);
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

  return (
    <>
      <section className="mt-10 mx-auto w-full max-w-[976px] px-4 sm:px-6 lg:px-0">
      {/* 手機版：單行（count + icon-only 篩選 + 排序） */}
      <div className="flex items-center justify-between md:hidden">
        <span className="text-[14px] font-normal font-['Noto_Sans_TC'] text-black-900">
          檢索結果：{total} 筆
        </span>
        <div className="flex items-center gap-2">
          <button
            type="button"
            aria-pressed={onlyGood}
            onClick={() => setOnlyGood((v) => !v)}
            className={[
              'h-[32px] w-[32px] inline-flex items-center justify-center',
              'rounded-[8px] bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]',
              'border hover:cursor-pointer',
              onlyGood ? 'border-secondary-700' : 'border-transparent',
            ].join(' ')}
            title="只看優良教案"
          >
            <img
              src="/icons/good.svg"
              alt="優良教案"
              width={20}
              height={20}
              style={onlyGood ? goodTint : undefined}
            />
          </button>
          <IssueSortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      {/* 桌機版：原有兩行布局 */}
      <div className="hidden md:flex flex-wrap items-end gap-x-3 gap-y-2">
        <div className="flex items-end gap-3 w-full sm:w-auto">
          <h2 className="whitespace-nowrap h-[38px] text-[25px] leading-[150%] font-bold font-['Noto_Sans_TC'] text-black-900">
            檢索結果
          </h2>
          <span className="h-6 text-[16px] leading-[150%] font-normal font-['Noto_Sans_TC'] text-black-900 sm:w-[120px]">
            （共 {total} 筆）
          </span>
        </div>
        <div className="flex items-center gap-3 sm:ml-auto">
          <button
            type="button"
            aria-pressed={onlyGood}
            onClick={() => setOnlyGood((v) => !v)}
            className={[
              'h-[32px] w-auto inline-flex items-center justify-center gap-[3px] whitespace-nowrap px-[12px]',
              'rounded-[8px] py-[5px] bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]',
              'border hover:cursor-pointer',
              onlyGood ? 'border-secondary-700 text-secondary-700' : 'border-transparent text-black-900',
            ].join(' ')}
            title="只看優良教案"
          >
            <img src="/icons/good.svg" alt="" width={16} height={16}
              style={onlyGood ? goodTint : undefined}
            />
            <span className="text-[14px] leading-[150%] font-normal font-['Noto_Sans_TC']">優良教案</span>
          </button>
          <IssueSortDropdown value={sort} onChange={setSort} />
        </div>
      </div>

      {/* 桌機表格（md 以上） */}
      <div className="mt-4 w-full hidden md:block rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden">
        <table className="w-full border-collapse text-[14px] font-['Noto_Sans_TC']">
          <colgroup>
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col className="w-[9%]" />
            <col />
            <col className="w-[14%]" />
            <col className="w-[7%]" />
            <col className="w-[7%]" />
          </colgroup>
          <thead>
            <tr className="bg-primary-100 text-black-900 font-bold">
              {['家別','期數','類別','教案名稱','撰寫者','查看','收藏'].map((h, i) => (
                <th key={h} className={`h-[48px] px-3 text-center border border-black-200 whitespace-nowrap ${i === 0 ? 'rounded-tl-lg' : ''} ${i === 6 ? 'rounded-tr-lg' : ''}`}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-black-200">
            {pageRows.length === 0 ? (
              <tr>
                <td colSpan={7} className="h-[48px] text-center text-[16px] text-black-700 border-x border-b border-black-200 rounded-b-lg">
                  查無符合條件的教案，請調整檢索條件後再試。
                </td>
              </tr>
            ) : pageRows.map((r) => (
              <tr key={r.id} className="hover:bg-primary-50 transition-colors">
                <td className="h-[48px] px-2 text-center border-x border-black-200">{r.family}</td>
                <td className="h-[48px] px-2 text-center border-x border-black-200">{r.issue}</td>
                <td className="h-[48px] px-2 text-center border-x border-black-200">{r.category}</td>
                <td className="px-4 py-[6px] border-x border-black-200 max-w-0">
                  <div className="flex items-center gap-2 overflow-hidden">
                    {r.good && <img src="/icons/good.svg" alt="" width={16} height={16} style={goodTint} className="shrink-0" />}
                    <span className="truncate" title={r.title}>{r.title}</span>
                  </div>
                  {r.hashtags && r.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-x-2 mt-[2px] overflow-hidden">
                      {r.hashtags.map((tag) => (
                        <span key={tag} className="text-[12px] leading-[150%] font-['Noto_Sans_TC'] font-normal text-[#808080] whitespace-nowrap">#{tag}</span>
                      ))}
                    </div>
                  )}
                </td>
                <td className="h-[48px] px-2 text-center border-x border-black-200">{r.author}</td>
                <td className="h-[48px] text-center border-x border-black-200">
                  <button type="button" onClick={() => handleView(r)} aria-label="查看"
                    disabled={detailLoading && detailPlanId === r.id}
                    className={detailLoading && detailPlanId === r.id ? 'cursor-not-allowed opacity-60' : 'hover:opacity-70 cursor-pointer'}>
                    <img src="/icons/file-alt.svg" alt="查看" width={20} height={20} />
                  </button>
                </td>
                <td className="h-[48px] text-center border-x border-black-200">
                  <button type="button" onClick={() => toggleLike(r.id)}
                    aria-label={r.liked ? '取消收藏' : '加入收藏'}
                    disabled={favoritePendingId === r.id}
                    className={favoritePendingId === r.id ? 'cursor-not-allowed opacity-60' : 'hover:opacity-70 cursor-pointer'}>
                    <img src={r.liked ? '/icons/liked.svg' : '/icons/like.svg'} alt="" width={20} height={20} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 手機卡片（md 以下） */}
      <div className="mt-4 md:hidden flex flex-col gap-3">
        {pageRows.length === 0 ? (
          <div className="py-6 text-center text-[15px] font-['Noto_Sans_TC'] text-black-700 bg-white rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
            查無符合條件的教案，請調整檢索條件後再試。
          </div>
        ) : pageRows.map((r) => (
          <div key={r.id} className="bg-white rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden">
            {/* 上區塊：優良標籤 + hashtags + 心形；標題 */}
            <div className="px-4 py-2 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 flex-wrap flex-1 min-w-0">
                  {r.good && (
                    <>
                      <img src="/icons/good.svg" alt="" width={14} height={14} style={goodTint} className="shrink-0" />
                      <span className="text-[13px] font-semibold font-['Noto_Sans_TC'] text-secondary-700 shrink-0">優良教案</span>
                    </>
                  )}
                  {r.hashtags?.map((tag) => (
                    <span key={tag} className="text-[12px] font-['Noto_Sans_TC'] font-normal text-[#808080]">#{tag}</span>
                  ))}
                </div>
                <button type="button" onClick={() => toggleLike(r.id)}
                  aria-label={r.liked ? '取消收藏' : '加入收藏'}
                  disabled={favoritePendingId === r.id}
                  className={`shrink-0 ${favoritePendingId === r.id ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-70 cursor-pointer'}`}>
                  <img src={r.liked ? '/icons/liked.svg' : '/icons/like.svg'} alt="" width={20} height={20} />
                </button>
              </div>
              <p className="text-[16px] font-bold font-['Noto_Sans_TC'] text-black-900 leading-snug">{r.title}</p>
            </div>

            {/* 下區塊：期數/類別、家別/撰寫者（左）+ 查看按鈕（右） */}
            <div className="px-4 py-2 flex items-center gap-3">
              <div className="flex-1 flex flex-col gap-1">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <img src="/icons/calender.svg" alt="" width={14} height={14} className="shrink-0" />
                    <span className="text-[13px] font-['Noto_Sans_TC'] text-black-700">{r.issue}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src="/icons/category.svg" alt="" width={14} height={14} className="shrink-0" />
                    <span className="text-[13px] font-['Noto_Sans_TC'] text-black-700">{r.category}</span>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1">
                    <img src="/icons/home.svg" alt="" width={14} height={14} className="shrink-0" />
                    <span className="text-[13px] font-['Noto_Sans_TC'] text-black-700">{r.family}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <img src="/icons/author.svg" alt="" width={14} height={14} className="shrink-0" />
                    <span className="text-[13px] font-['Noto_Sans_TC'] text-black-700">{r.author}</span>
                  </div>
                </div>
              </div>
              <button type="button" onClick={() => handleView(r)} aria-label="查看"
                disabled={detailLoading && detailPlanId === r.id}
                className={`w-[64px] h-[26px] rounded-[4px] px-[20px] py-[4px] bg-primary-900 text-white text-[12px] font-normal font-['Noto_Sans_TC'] leading-[150%] whitespace-nowrap shrink-0 inline-flex items-center justify-center ${detailLoading && detailPlanId === r.id ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}>
                查看
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <div className="mt-6 w-[320px] h-[36px] mx-auto flex items-center justify-center gap-2">
        <PageBtn icon="/icons/angle-left-double.svg" disabled={page <= 1} onClick={() => setPage(1)} />
        <PageBtn icon="/icons/angle-left.svg" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
        <div className="w-[160px] h-[24px] flex items-center justify-center gap-2 text-[16px] font-['Noto_Sans_TC']">
          第 {pad2(total === 0 ? 0 : page)} 頁，共 {pad2(displayTotalPages)} 頁
        </div>
        <PageBtn icon="/icons/angle-right.svg" disabled={page >= displayTotalPages} onClick={() => setPage((p) => Math.min(displayTotalPages, p + 1))} />
        <PageBtn icon="/icons/angle-right-double.svg" disabled={page >= displayTotalPages} onClick={() => setPage(displayTotalPages)} />
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
      className={`w-[32px] h-[36px] inline-flex items-center justify-center rounded-[4px] px-[10px] py-[4px] border border-black-200 bg-white ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-black-100 hover:cursor-pointer'}`}>
      <img src={icon} alt="" width={20} height={20} />
    </button>
  );
}
