'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/features/auth/useAuth';
import { fetchTeachingPlanDetail, TeachingPlanDetail } from '@/services/teaching-plan';
import type { Row, MyTeachingPlansResponse, FavoritesResponse } from './types';
import { formatIssue, mapPlanToRow, mapFavoriteToRow, requestJson, debugLog } from './helpers';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_PREFIX = BACKEND_URL ? `${BACKEND_URL}/teaching-plan` : '';

/**
 * 教案管理頁的完整狀態（自原 page 抽出，邏輯不變）：
 * 我的教案 / 我的收藏載入、收藏切換（樂觀更新）、刪除（含確認 modal）、詳情 modal。
 */
export function usePlanManagement() {
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
      setPlansLoading(true);
      setPlansError('');
      try {
        const payload = await requestJson<MyTeachingPlansResponse>(`${API_PREFIX}/my-teaching-plans`);
        const rows = Array.isArray(payload?.data) ? payload.data.map(mapPlanToRow) : [];
        debugLog('Fetched my plans', rows);
        if (isMounted) {
          setMyPlansAll(rows);
        }
      } catch (error) {
        debugLog('Fetch my plans failed', error);
        if (isMounted) {
          setPlansError(error instanceof Error ? error.message : '取得我的教案失敗');
        }
      } finally {
        if (isMounted) {
          setPlansLoading(false);
        }
      }
    };

    const loadFavorites = async () => {
      setLikesLoading(true);
      setLikesError('');
      try {
        const payload = await requestJson<FavoritesResponse>(`${API_PREFIX}/favorites`);
        const rows = Array.isArray(payload?.data) ? payload.data.map(mapFavoriteToRow) : [];
        debugLog('Fetched favorites', rows);
        if (isMounted) {
          setMyLikesAll(rows);
          setLikes(Object.fromEntries(rows.map((row) => [row.id, true])));
        }
      } catch (error) {
        debugLog('Fetch favorites failed', error);
        if (isMounted) {
          setLikesError(error instanceof Error ? error.message : '取得收藏清單失敗');
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

    setFavoriteUpdatingId(id);

    if (currentlyLiked) {
      setLikes((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
      setMyLikesAll((prev) => prev.filter((item) => item.id !== id));
    } else {
      setLikes((prev) => ({ ...prev, [id]: true }));
      setMyLikesAll((prev) => {
        if (prev.some((item) => item.id === id)) {
          return prev;
        }
        return [row, ...prev];
      });
    }

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

    setDeletingId(id);
    setMyPlansAll((prev) => prev.filter((item) => item.id !== id));
    setMyLikesAll((prev) => prev.filter((item) => item.id !== id));
    setLikes((prev) => {
      if (!prev[id]) return prev;
      const next = { ...prev };
      delete next[id];
      return next;
    });

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

  return {
    router,
    authLoading,
    authenticated,
    myPlansAll,
    myLikesAll,
    myPlans,
    myLikes,
    hasPlans,
    hasLikes,
    likes,
    plansLoading,
    likesLoading,
    plansError,
    likesError,
    favoriteUpdatingId,
    deletingId,
    deleteModalOpen,
    deleteTarget,
    detailModalOpen,
    detailPlanId,
    detailPlan,
    detailSummary,
    detailLiked,
    detailLoading,
    handleFavoriteToggle,
    handleView,
    handleCloseDetailModal,
    handleDetailFavoriteToggle,
    handleEdit,
    handleDelete,
    handleConfirmDelete,
    handleCloseDeleteModal,
  };
}
