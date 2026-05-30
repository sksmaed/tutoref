'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { DeleteTeachPlanModal } from '@/components/ui/DeleteTeachPlanModal';
import { TeachingPlanDetailModal } from '@/components/ui/TeachingPlanDetailModal';
import { fetchTeachingPlanDetail, TeachingPlanDetail } from '@/services/teachingPlan';

type Row = {
  id: string;
  family: string;
  issue: string;
  category: string;
  title: string;
  author: string;
  liked?: boolean;
  good?: boolean;
  grade?: string;
  duration?: number;
  hashtags?: string[];
};

type MyTeachingPlanItem = {
  id: string;
  team?: string;
  academic_year?: string;
  semester_period?: string;
  category?: string;
  tp_name?: string;
  writer_name?: string;
  grade?: string;
  duration?: number;
  is_excellent?: boolean;
  hashtags?: string[];
};

type FavoriteItem = {
  id: string;
  team?: string;
  academic_year?: string;
  semester_period?: string;
  category?: string;
  tp_name?: string;
  writer_name?: string;
  grade?: string;
  duration?: number;
  is_excellent?: boolean;
  hashtags?: string[];
};

type MyTeachingPlansResponse = {
  data?: MyTeachingPlanItem[];
};

type FavoritesResponse = {
  data?: FavoriteItem[];
};

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_PREFIX = BACKEND_URL ? `${BACKEND_URL}/teaching-plan` : '';
const MY_PLANS_CACHE_KEY = 'manage:myPlansCache:v1';
const MY_LIKES_CACHE_KEY = 'manage:myLikesCache:v1';
const LIKES_STATE_CACHE_KEY = 'manage:likesStateCache:v1';

const formatIssue = (academicYear?: string | null, semesterPeriod?: string | null) => {
  const year = academicYear ?? '';
  const period = semesterPeriod ?? '';
  return `${year}${period}`.trim();
};

const goodTint = {
  filter:
    'brightness(0) saturate(100%) invert(49%) sepia(12%) saturate(1148%) hue-rotate(47deg) brightness(88%) contrast(87%)',
};

type ErrorPayload = {
  errors?: { errors?: Array<{ extra_data?: { message?: string } }> };
  message?: string;
};

const extractErrorMessage = (payload: unknown, fallback: string) => {
  if (typeof payload === 'object' && payload !== null) {
    const candidate = payload as ErrorPayload;
    const nestedMessage = candidate.errors?.errors?.[0]?.extra_data?.message;
    if (nestedMessage) return nestedMessage;
    if (typeof candidate.message === 'string') return candidate.message;
  }
  return fallback;
};

const mapPlanToRow = (plan: MyTeachingPlanItem): Row => ({
  id: plan.id,
  family: plan.team ?? '',
  issue: formatIssue(plan.academic_year, plan.semester_period),
  category: plan.category ?? '',
  title: plan.tp_name ?? '',
  author: plan.writer_name ?? '',
  grade: plan.grade ?? '',
  duration: typeof plan.duration === 'number' ? plan.duration : undefined,
  good: plan.is_excellent,
  hashtags: Array.isArray(plan.hashtags) ? plan.hashtags : [],
});

const mapFavoriteToRow = (plan: FavoriteItem): Row => ({
  ...mapPlanToRow(plan),
  liked: true,
});

const requestJson = async <T,>(url: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(url, { credentials: 'include', ...init });
  const contentType = response.headers.get('content-type') ?? '';
  const isJson = contentType.includes('application/json');
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const fallback = `HTTP ${response.status} ${response.statusText}`;
    const message = isJson
      ? extractErrorMessage(payload, fallback)
      : typeof payload === 'string' && payload.trim()
        ? payload
        : fallback;
    throw new Error(String(message));
  }

  if (!isJson) {
    throw new Error('Unexpected content-type received from server');
  }

  return payload as T;
};

const debugLog = (...args: unknown[]) => {
  if (process.env.NODE_ENV !== 'production') {
    console.debug('[ManagePage]', ...args);
  }
};

const readSessionJson = <T,>(key: string): T | null => {
  if (typeof window === 'undefined') return null;
  const raw = window.sessionStorage.getItem(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    window.sessionStorage.removeItem(key);
    return null;
  }
};

const writeSessionJson = (key: string, value: unknown) => {
  if (typeof window === 'undefined') return;
  window.sessionStorage.setItem(key, JSON.stringify(value));
};

const buildLikesMapFromRows = (rows: Row[]) => Object.fromEntries(rows.map((row) => [row.id, true]));

export default function TeachPlanManagePage() {
  const router = useRouter();
  const { toast } = useToast();
  const { loading: authLoading, authenticated } = useAuth();

  const [myPlansAll, setMyPlansAll] = useState<Row[]>([]);
  const [myLikesAll, setMyLikesAll] = useState<Row[]>([]);
  const [likes, setLikes] = useState<Record<string, boolean>>({});
  const [plansLoading, setPlansLoading] = useState(false);
  const [likesLoading, setLikesLoading] = useState(false);
  const [plansError, setPlansError] = useState('');
  const [likesError, setLikesError] = useState('');
  const [favoriteUpdatingId, setFavoriteUpdatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailPlanId, setDetailPlanId] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<Row | null>(null);
  const [detailPlan, setDetailPlan] = useState<TeachingPlanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);

  const hasPlans = myPlansAll.length > 0;
  const hasLikes = myLikesAll.length > 0;

  const myPlans = useMemo(() => myPlansAll.slice(0, 5), [myPlansAll]);
  const myLikes = useMemo(() => myLikesAll.slice(0, 5), [myLikesAll]);

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
      duration: matchPlan?.duration ?? detailRow.duration,
      isExcellent: matchPlan?.is_excellent ?? detailRow.good ?? false,
    };
  }, [detailRow, detailPlan]);

  const detailLiked = detailPlanId ? Boolean(likes[detailPlanId]) : Boolean(detailRow?.liked);

const viewAllBtnClass = (disabled: boolean) =>
  [
    'w-[160px] h-[48px] rounded-[8px] px-[20px] py-[12px] whitespace-nowrap text-[16px] leading-[150%] font-["Noto_Sans_TC"] shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]',
    disabled
        ? 'bg-white border border-black-300 text-black-300 cursor-not-allowed'
        : 'bg-white border border-primary-900 text-primary-900 cursor-pointer hover:bg-primary-50',
  ].join(' ');

  // 檢查登入狀態
  useEffect(() => {
    if (authLoading) return; // 等待驗證完成

    if (!authenticated) {
      toast({
        title: '❌ 需要登入',
        description: '請先登入才能使用教案管理功能。',
        variant: 'destructive',
      });
      router.push('/login');
      return;
    }
  }, [authLoading, authenticated, router, toast]);

  useEffect(() => {
    if (authLoading || !authenticated) {
      // 等待登入驗證完成，或者已經跳轉到登入頁面
      return;
    }

    if (!API_PREFIX) {
      const message = '後端網址未設定（NEXT_PUBLIC_API_BASE_URL）。';
      setPlansError(message);
      setLikesError(message);
      return;
    }

    let isMounted = true;

    const loadMyPlans = async () => {
      const cachedPlans = readSessionJson<Row[]>(MY_PLANS_CACHE_KEY);
      if (cachedPlans) {
        setMyPlansAll(cachedPlans);
        setPlansLoading(false);
      } else {
        setPlansLoading(true);
      }
      setPlansError('');
      try {
        const payload = await requestJson<MyTeachingPlansResponse>(`${API_PREFIX}/my-teaching-plans`);
        const rows = Array.isArray(payload?.data) ? payload.data.map(mapPlanToRow) : [];
        debugLog('Fetched my plans', rows);
        if (isMounted) {
          setMyPlansAll(rows);
          writeSessionJson(MY_PLANS_CACHE_KEY, rows);
        }
      } catch (error) {
        debugLog('Fetch my plans failed', error);
        if (isMounted) {
          if (!cachedPlans) {
            setPlansError(error instanceof Error ? error.message : '取得我的教案失敗');
          }
        }
      } finally {
        if (isMounted) {
          setPlansLoading(false);
        }
      }
    };

    const loadFavorites = async () => {
      const cachedLikes = readSessionJson<Row[]>(MY_LIKES_CACHE_KEY);
      const cachedLikesState = readSessionJson<Record<string, boolean>>(LIKES_STATE_CACHE_KEY);
      if (cachedLikes) {
        setMyLikesAll(cachedLikes);
        setLikes(cachedLikesState ?? buildLikesMapFromRows(cachedLikes));
        setLikesLoading(false);
      } else {
        setLikesLoading(true);
      }
      setLikesError('');
      try {
        const payload = await requestJson<FavoritesResponse>(`${API_PREFIX}/favorites`);
        const rows = Array.isArray(payload?.data) ? payload.data.map(mapFavoriteToRow) : [];
        const nextLikesState = buildLikesMapFromRows(rows);
        debugLog('Fetched favorites', rows);
        if (isMounted) {
          setMyLikesAll(rows);
          setLikes(nextLikesState);
          writeSessionJson(MY_LIKES_CACHE_KEY, rows);
          writeSessionJson(LIKES_STATE_CACHE_KEY, nextLikesState);
        }
      } catch (error) {
        debugLog('Fetch favorites failed', error);
        if (isMounted) {
          if (!cachedLikes) {
            setLikesError(error instanceof Error ? error.message : '取得收藏清單失敗');
          }
        }
      } finally {
        if (isMounted) {
          setLikesLoading(false);
        }
      }
    };

    loadMyPlans();
    loadFavorites();

    return () => {
      isMounted = false;
    };
  }, [authLoading, authenticated]);

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
      } catch (error) {
        if (!cancelled) {
          toast({
            title: '❌ 取得教案失敗',
            description: error instanceof Error ? error.message : '請稍後再試。',
            variant: 'destructive',
          });
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
  }, [detailModalOpen, detailPlanId, detailPlan, toast]);

  const handleFavoriteToggle = async (row: Row) => {
    if (!API_PREFIX) {
      toast({
        title: '❌ 設定錯誤',
        description: '後端網址未設定（NEXT_PUBLIC_API_BASE_URL）。',
        variant: 'destructive',
      });
      return;
    }

    if (favoriteUpdatingId) {
      return;
    }

    const { id } = row;
    const currentlyLiked = !!likes[id];
    debugLog('Toggle favorite requested', { id, currentlyLiked, row });
    const previousLikes = { ...likes };
    const previousFavorites = [...myLikesAll];
    let nextLikes = previousLikes;
    let nextFavorites = previousFavorites;

    setFavoriteUpdatingId(id);

    if (currentlyLiked) {
      nextLikes = { ...previousLikes };
      delete nextLikes[id];
      nextFavorites = previousFavorites.filter((item) => item.id !== id);
    } else {
      nextLikes = { ...previousLikes, [id]: true };
      nextFavorites = previousFavorites.some((item) => item.id === id) ? previousFavorites : [row, ...previousFavorites];
    }

    setLikes(nextLikes);
    setMyLikesAll(nextFavorites);
    writeSessionJson(MY_LIKES_CACHE_KEY, nextFavorites);
    writeSessionJson(LIKES_STATE_CACHE_KEY, nextLikes);

    try {
      await requestJson(`${API_PREFIX}/${id}/favorite`, {
        method: currentlyLiked ? 'DELETE' : 'POST',
      });

      toast({
        title: currentlyLiked ? '✅ 已取消收藏' : '✅ 已加入收藏',
        description: currentlyLiked ? '教案已從收藏中移除。' : '教案已加入收藏清單。',
      });
    } catch (error) {
      debugLog('Toggle favorite failed', error);
      setLikes(previousLikes);
      setMyLikesAll(previousFavorites);
      writeSessionJson(MY_LIKES_CACHE_KEY, previousFavorites);
      writeSessionJson(LIKES_STATE_CACHE_KEY, previousLikes);
      toast({
        title: '❌ 收藏更新失敗',
        description: error instanceof Error ? error.message : '請稍後再試。',
        variant: 'destructive',
      });
    } finally {
      setFavoriteUpdatingId(null);
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

  const handleDetailFavoriteToggle = async (planId: string, nextLiked: boolean) => {
    const existingRow =
      (detailRow && detailRow.id === planId ? detailRow : null) ??
      myLikesAll.find((item) => item.id === planId) ??
      myPlansAll.find((item) => item.id === planId) ??
      null;

    const fallbackPlan = detailPlan && detailPlan.id === planId ? detailPlan : null;
    const derivedIssue = fallbackPlan ? formatIssue(fallbackPlan.academic_year, fallbackPlan.semester_period) : '';

    const rowForToggle: Row = existingRow
      ? { ...existingRow, liked: nextLiked }
      : {
          id: planId,
          family: fallbackPlan?.team ?? '',
          issue: derivedIssue,
          category: fallbackPlan?.category ?? '',
          title: fallbackPlan?.tp_name ?? '',
          author: fallbackPlan?.writer_name ?? '',
          liked: nextLiked,
          good: fallbackPlan?.is_excellent ?? false,
        };

    await handleFavoriteToggle(rowForToggle);
    setDetailRow((prev) => (prev && prev.id === planId ? { ...prev, liked: nextLiked } : prev));
  };

  const handleEdit = (row: Row) => {
    if (!row?.id) {
      toast({
        title: '❌ 找不到教案',
        description: '無法取得教案 ID，請重新整理後再試。',
        variant: 'destructive',
      });
      return;
    }
    router.push(`/plans/${row.id}/edit`);
  };

  const handleDelete = (row: Row) => {
    if (!API_PREFIX) {
      toast({
        title: '❌ 設定錯誤',
        description: '後端網址未設定（NEXT_PUBLIC_API_BASE_URL）。',
        variant: 'destructive',
      });
      return;
    }

    if (!row?.id) {
      toast({
        title: '❌ 找不到教案',
        description: '無法取得教案 ID，請重新整理後再試。',
        variant: 'destructive',
      });
      return;
    }

    setDeleteTarget(row);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!API_PREFIX) {
      toast({
        title: '❌ 設定錯誤',
        description: '後端網址未設定（NEXT_PUBLIC_API_BASE_URL）。',
        variant: 'destructive',
      });
      setDeleteModalOpen(false);
      return;
    }

    if (!deleteTarget?.id) {
      toast({
        title: '❌ 找不到教案',
        description: '無法取得教案 ID，請重新整理後再試。',
        variant: 'destructive',
      });
      setDeleteModalOpen(false);
      return;
    }

    const { id } = deleteTarget;
    const previousPlans = [...myPlansAll];
    const previousFavorites = [...myLikesAll];
    const previousLikesState = { ...likes };
    const nextPlans = previousPlans.filter((item) => item.id !== id);
    const nextFavorites = previousFavorites.filter((item) => item.id !== id);
    const nextLikesState = { ...previousLikesState };
    delete nextLikesState[id];

    setDeletingId(id);
    setMyPlansAll(nextPlans);
    setMyLikesAll(nextFavorites);
    setLikes(nextLikesState);
    writeSessionJson(MY_PLANS_CACHE_KEY, nextPlans);
    writeSessionJson(MY_LIKES_CACHE_KEY, nextFavorites);
    writeSessionJson(LIKES_STATE_CACHE_KEY, nextLikesState);

    try {
      const res = await requestJson<{ message?: string }>(`${API_PREFIX}/detail/${id}`, {
        method: 'DELETE',
      });

      toast({
        title: '✅ 已刪除教案',
        description: typeof res === 'object' && res?.message ? String(res.message) : '教案已移除。',
      });
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error) {
      setMyPlansAll(previousPlans);
      setMyLikesAll(previousFavorites);
      setLikes(previousLikesState);
      writeSessionJson(MY_PLANS_CACHE_KEY, previousPlans);
      writeSessionJson(MY_LIKES_CACHE_KEY, previousFavorites);
      writeSessionJson(LIKES_STATE_CACHE_KEY, previousLikesState);
      toast({
        title: '❌ 刪除失敗',
        description: error instanceof Error ? error.message : '請稍後再試。',
        variant: 'destructive',
      });
    } finally {
      setDeletingId(null);
    }
  };

  const handleCloseDeleteModal = () => {
    if (deletingId) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  // 如果正在驗證登入狀態，顯示載入畫面
  if (authLoading) {
    return (
      <main className="min-h-screen bg-black-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-[16px] font-['Noto_Sans_TC'] text-black-700">驗證登入狀態中...</p>
        </div>
      </main>
    );
  }

  // 如果未登入，不顯示內容（將跳轉到登入頁面）
  if (!authenticated) {
    return null;
  }

  return (
    <>
      <main className="min-h-screen bg-black-50">
        <section className="mx-auto mt-16 w-full max-w-[976px] px-4 sm:px-6 lg:px-0">
        <h1 className="text-center text-[32px] sm:text-[40px] font-bold font-['Noto_Sans_TC'] text-black-900">
          教案管理
        </h1>

        {/* ===== 我的教案 ===== */}
        <SectionHeader title="我的教案" total={myPlansAll.length} />

        {/* Desktop table */}
        <div className="mt-2 hidden md:block rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] bg-white overflow-hidden">
          <table className="w-full border-collapse">
            <colgroup>
              <col style={{ width: '9.4%' }} />
              <col style={{ width: '9.4%' }} />
              <col style={{ width: '9.4%' }} />
              <col style={{ width: '36.1%' }} />
              <col style={{ width: '16.8%' }} />
              <col style={{ width: '9.4%' }} />
              <col style={{ width: '9.4%' }} />
            </colgroup>
            <thead>
              <tr className="bg-primary-100 text-[14px] font-bold font-['Noto_Sans_TC'] text-black-900">
                {['家別', '期數', '類別', '教案名稱', '撰寫者', '編輯', '刪除'].map((col, i, arr) => (
                  <th key={col} className={['h-[48px] border border-black-200 px-2 text-center font-bold whitespace-nowrap', i === 0 ? 'rounded-tl-lg' : '', i === arr.length - 1 ? 'rounded-tr-lg' : ''].filter(Boolean).join(' ')}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {plansLoading ? (
                <tr><td colSpan={7} className="h-[48px] border border-black-200 text-center text-[16px] text-black-700">資料載入中...</td></tr>
              ) : plansError ? (
                <tr><td colSpan={7} className="h-[48px] border border-black-200 text-center text-[16px] text-black-700">{plansError}</td></tr>
              ) : hasPlans ? (
                myPlans.map((r) => (
                  <tr key={r.id} className="text-[14px]">
                    <td className="h-[48px] border border-black-200 px-2 text-center">{r.family}</td>
                    <td className="h-[48px] border border-black-200 px-2 text-center">{r.issue}</td>
                    <td className="h-[48px] border border-black-200 px-2 text-center">{r.category}</td>
                    <td className="h-[48px] border border-black-200 px-2 max-w-0">
                      <div className="flex items-center justify-center gap-2 overflow-hidden">
                        {r.good && <img src="/icons/good.svg" alt="" width={16} height={16} style={goodTint} className="shrink-0" />}
                        <span className="truncate" title={r.title}>{r.title}</span>
                      </div>
                    </td>
                    <td className="h-[48px] border border-black-200 px-2 text-center">{r.author}</td>
                    <td className="h-[48px] border border-black-200 px-2 text-center">
                      <button type="button" aria-label="編輯" onClick={() => handleEdit(r)} disabled={plansLoading || deletingId === r.id} className={plansLoading || deletingId === r.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                        <img src="/icons/edit.svg" alt="" width={20} height={20} />
                      </button>
                    </td>
                    <td className="h-[48px] border border-black-200 px-2 text-center">
                      <button type="button" aria-label="刪除" onClick={() => handleDelete(r)} disabled={plansLoading || deletingId === r.id} className={plansLoading || deletingId === r.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                        <img src="/icons/trash.svg" alt="" width={20} height={20} />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr><td colSpan={7} className="h-[48px] border border-black-200 text-center text-[16px] text-black-700 px-4">你還沒上傳任何教案唷，快點擊下方按鈕上傳第一份教案吧！</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards - 我的教案 */}
        <div className="mt-2 md:hidden flex flex-col gap-3">
          {plansLoading ? (
            <div className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] px-4 py-3 text-center text-[14px] text-black-500">資料載入中...</div>
          ) : plansError ? (
            <div className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] px-4 py-3 text-center text-[14px] text-black-500">{plansError}</div>
          ) : hasPlans ? (
            myPlans.map((r) => (
              <div key={r.id} className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden">
                {/* 上區塊：優良標籤（左）+ 編輯/刪除（右）→ 標題 */}
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
                    <div className="flex items-center gap-3 shrink-0">
                      <button type="button" aria-label="編輯" onClick={() => handleEdit(r)} disabled={plansLoading || deletingId === r.id} className={plansLoading || deletingId === r.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                        <img src="/icons/edit.svg" alt="" width={20} height={20} />
                      </button>
                      <button type="button" aria-label="刪除" onClick={() => handleDelete(r)} disabled={plansLoading || deletingId === r.id} className={plansLoading || deletingId === r.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                        <img src="/icons/trash.svg" alt="" width={20} height={20} />
                      </button>
                    </div>
                  </div>
                  <p className="text-[16px] font-bold font-['Noto_Sans_TC'] text-black-900 leading-snug">{r.title}</p>
                </div>
                {/* 下區塊：期數/類別、家別/撰寫者 */}
                <div className="px-4 py-2 flex flex-col gap-1">
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
              </div>
            ))
          ) : (
            <div className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] px-4 py-3 text-center text-[14px] text-black-500">你還沒上傳任何教案唷，快點擊下方按鈕上傳第一份教案吧！</div>
          )}
        </div>

        <div className="mt-6 flex w-full items-center justify-center gap-[24px]">
          <button
            type="button"
            disabled={!hasPlans || plansLoading}
            onClick={() => hasPlans && !plansLoading && router.push('/plans/mine')}
            className={viewAllBtnClass(!hasPlans || plansLoading)}
          >
            查看全部
          </button>

          <button
            type="button"
            onClick={() => router.push('/upload')}
            className="
              w-[160px] h-[48px] rounded-[8px] bg-primary-900
              px-[47px] py-[12px] whitespace-nowrap
              text-[16px] leading-[150%] font-['Noto_Sans_TC'] font-bold text-white
              shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] cursor-pointer hover:opacity-90
            "
          >
            上傳教案
          </button>
        </div>

        {/* ===== 我的收藏 ===== */}
        <SectionHeader className="mt-12" title="我的收藏" total={myLikesAll.length} />

        {/* Desktop table */}
        <div className="mt-2 hidden md:block rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] bg-white overflow-hidden">
          <table className="w-full border-collapse">
            <colgroup>
              <col style={{ width: '9.4%' }} />
              <col style={{ width: '9.4%' }} />
              <col style={{ width: '9.4%' }} />
              <col style={{ width: '36.1%' }} />
              <col style={{ width: '16.8%' }} />
              <col style={{ width: '9.4%' }} />
              <col style={{ width: '9.4%' }} />
            </colgroup>
            <thead>
              <tr className="bg-primary-100 text-[14px] font-bold font-['Noto_Sans_TC'] text-black-900">
                {['家別', '期數', '類別', '教案名稱', '撰寫者', '查看', '收藏'].map((col, i, arr) => (
                  <th key={col} className={['h-[48px] border border-black-200 px-2 text-center font-bold whitespace-nowrap', i === 0 ? 'rounded-tl-lg' : '', i === arr.length - 1 ? 'rounded-tr-lg' : ''].filter(Boolean).join(' ')}>
                    {col}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {likesLoading ? (
                <tr><td colSpan={7} className="h-[48px] border border-black-200 text-center text-[16px] text-black-700">資料載入中...</td></tr>
              ) : likesError ? (
                <tr><td colSpan={7} className="h-[48px] border border-black-200 text-center text-[16px] text-black-700">{likesError}</td></tr>
              ) : hasLikes ? (
                myLikes.map((r) => {
                  const liked = likes[r.id] ?? true;
                  return (
                    <tr key={r.id} className="text-[14px]">
                      <td className="h-[48px] border border-black-200 px-2 text-center">{r.family}</td>
                      <td className="h-[48px] border border-black-200 px-2 text-center">{r.issue}</td>
                      <td className="h-[48px] border border-black-200 px-2 text-center">{r.category}</td>
                      <td className="h-[48px] border border-black-200 px-2 max-w-0">
                        <div className="flex items-center justify-center gap-2 overflow-hidden">
                          {r.good && <img src="/icons/good.svg" alt="" width={16} height={16} style={goodTint} className="shrink-0" />}
                          <span className="truncate" title={r.title}>{r.title}</span>
                        </div>
                      </td>
                      <td className="h-[48px] border border-black-200 px-2 text-center">{r.author}</td>
                      <td className="h-[48px] border border-black-200 px-2 text-center">
                        <button type="button" aria-label="查看" onClick={() => handleView(r)} disabled={detailLoading && detailPlanId === r.id} className={detailLoading && detailPlanId === r.id ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                          <img src="/icons/file-alt.svg" alt="" width={20} height={20} />
                        </button>
                      </td>
                      <td className="h-[48px] border border-black-200 px-2 text-center">
                        <button type="button" onClick={() => handleFavoriteToggle(r)} disabled={favoriteUpdatingId === r.id || likesLoading} aria-label={liked ? '取消收藏' : '加入收藏'} className={favoriteUpdatingId === r.id || likesLoading ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:opacity-80'}>
                          <img src={liked ? '/icons/liked.svg' : '/icons/like.svg'} alt="" width={20} height={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr><td colSpan={7} className="h-[48px] border border-black-200 text-center text-[16px] text-black-700 px-4">目前沒有收藏的教案唷，快去探索看看其他人的教案吧！</td></tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile cards - 我的收藏 */}
        <div className="mt-2 md:hidden flex flex-col gap-3">
          {likesLoading ? (
            <div className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] px-4 py-3 text-center text-[14px] text-black-500">資料載入中...</div>
          ) : likesError ? (
            <div className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] px-4 py-3 text-center text-[14px] text-black-500">{likesError}</div>
          ) : hasLikes ? (
            myLikes.map((r) => {
              const liked = likes[r.id] ?? true;
              return (
                <div key={r.id} className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] overflow-hidden">
                  {/* 上區塊：優良標籤（左）+ 心形（右）→ 標題 */}
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
                      <button type="button" onClick={() => handleFavoriteToggle(r)} disabled={favoriteUpdatingId === r.id || likesLoading} aria-label={liked ? '取消收藏' : '加入收藏'} className={`shrink-0 ${favoriteUpdatingId === r.id || likesLoading ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-70 cursor-pointer'}`}>
                        <img src={liked ? '/icons/liked.svg' : '/icons/like.svg'} alt="" width={20} height={20} />
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
                    <button type="button" aria-label="查看" onClick={() => handleView(r)}
                      disabled={detailLoading && detailPlanId === r.id}
                      className={`w-[64px] h-[26px] rounded-[4px] px-[20px] py-[4px] bg-primary-900 text-white text-[12px] font-normal font-['Noto_Sans_TC'] leading-[150%] whitespace-nowrap shrink-0 inline-flex items-center justify-center ${detailLoading && detailPlanId === r.id ? 'opacity-60 cursor-not-allowed' : 'hover:opacity-90 cursor-pointer'}`}>
                      查看
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] px-4 py-3 text-center text-[14px] text-black-500">目前沒有收藏的教案唷，快去探索看看其他人的教案吧！</div>
          )}
        </div>

        <div className="mt-6 mb-12 flex w-full items-center justify-center">
          <button
            type="button"
            disabled={!hasLikes || likesLoading}
            onClick={() => hasLikes && !likesLoading && router.push('/plans/likes')}
            className={viewAllBtnClass(!hasLikes || likesLoading)}
          >
            查看全部
          </button>
        </div>
        </section>
      </main>
      <TeachingPlanDetailModal
        open={detailModalOpen}
        loading={detailLoading}
        plan={detailPlan && detailPlan.id === detailPlanId ? detailPlan : null}
        summary={detailSummary}
        liked={detailLiked}
        favoriteLoading={favoriteUpdatingId === detailPlanId}
        onClose={handleCloseDetailModal}
        onToggleFavorite={handleDetailFavoriteToggle}
      />
      <DeleteTeachPlanModal
        open={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        planTitle={deleteTarget?.title || undefined}
        confirming={Boolean(deletingId)}
      />
    </>
  );
}

/* ===== 小元件 ===== */

function SectionHeader({
  title,
  total,
  className = '',
}: {
  title: string;
  total: number;
  className?: string;
}) {
  return (
    <div className={`mt-10 ${className}`}>
      <h3 className="inline-block w-auto text-[25px] font-bold font-['Noto_Sans_TC'] text-black-900 leading-[150%] tracking-normal">
        {title}
        <span className="ml-2 text-[16px] font-normal leading-[150%]">
          （共 {total} 筆）
        </span>
      </h3>
    </div>
  );
}

