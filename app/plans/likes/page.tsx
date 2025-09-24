'use client';

import { useEffect, useMemo, useState } from 'react';
import { AllPlansTable, Row } from '@/components/ui/AllPlansTable';
import {
  fetchFavorites,
  addFavorite,
  removeFavorite,
  fetchTeachingPlanDetail,
  TeachingPlanSummary,
  TeachingPlanDetail,
} from '@/services/teachingPlan';
import { useToast } from '@/hooks/use-toast';
import { TeachingPlanDetailModal } from '@/components/ui/TeachingPlanDetailModal';

const mapFavoriteToRow = (plan: TeachingPlanSummary): Row => ({
  id: plan.id,
  family: plan.team ?? '',
  issue: `${plan.academic_year ?? ''}${plan.semester_period ?? ''}`,
  category: plan.category ?? '',
  title: plan.tp_name ?? '',
  author: plan.writer_name ?? '',
  good: plan.is_excellent,
  liked: true,
  grade: plan.grade ?? '',
  duration: typeof plan.duration === 'number' ? plan.duration : undefined,
});

export default function LikesAllPage() {
  const [rows, setRows] = useState<Row[]>([]);
  const { toast } = useToast();
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailPlanId, setDetailPlanId] = useState<string | null>(null);
  const [detailRow, setDetailRow] = useState<Row | null>(null);
  const [detailPlan, setDetailPlan] = useState<TeachingPlanDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [favoritePendingId, setFavoritePendingId] = useState<string | null>(null);

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
      isExcellent: matchPlan?.is_excellent ?? detailRow.good,
    };
  }, [detailRow, detailPlan]);

  const detailLiked = useMemo(() => {
    if (detailPlanId) {
      const match = rows.find((item) => item.id === detailPlanId);
      return match?.liked ?? false;
    }
    return detailRow?.liked ?? false;
  }, [detailPlanId, detailRow, rows]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const favorites = await fetchFavorites();
        if (!mounted) return;
        setRows(favorites.map(mapFavoriteToRow));
      } catch (error) {
        if (mounted) {
          toast({
            title: '❌ 無法取得收藏',
            description: error instanceof Error ? error.message : '請稍後再試。',
            variant: 'destructive',
          });
        }
      }
    })();

    return () => {
      mounted = false;
    };
  }, [toast]);

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

  const handleToggleFavorite = async (row: Row, nextLiked: boolean) => {
    setFavoritePendingId(row.id);
    try {
      if (nextLiked) {
        await addFavorite(row.id);
        setRows((prev) => {
          const exists = prev.some((item) => item.id === row.id);
          if (exists) {
            return prev.map((item) => (item.id === row.id ? { ...item, liked: true } : item));
          }
          return [...prev, { ...row, liked: true }];
        });
      } else {
        await removeFavorite(row.id);
        setRows((prev) => prev.filter((item) => item.id !== row.id));
      }
      setDetailRow((prev) => (prev && prev.id === row.id ? { ...prev, liked: nextLiked } : prev));
    } catch (error) {
      toast({
        title: '❌ 更新收藏失敗',
        description: error instanceof Error ? error.message : '請稍後再試。',
        variant: 'destructive',
      });
      throw error;
    } finally {
      setFavoritePendingId(null);
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
    const existingRow =
      (detailRow && detailRow.id === planId ? detailRow : null) ??
      rows.find((item) => item.id === planId) ??
      null;

    const fallbackPlan = detailPlan && detailPlan.id === planId ? detailPlan : null;
    const derivedIssue = fallbackPlan ? `${fallbackPlan.academic_year ?? ''}${fallbackPlan.semester_period ?? ''}` : '';

    const rowForToggle: Row = existingRow
      ? { ...existingRow, liked: nextLiked }
      : {
          id: planId,
          family: fallbackPlan?.team ?? '',
          issue: derivedIssue,
          category: fallbackPlan?.category ?? '',
          title: fallbackPlan?.tp_name ?? '',
          author: fallbackPlan?.writer_name ?? '',
          good: fallbackPlan?.is_excellent,
          liked: nextLiked,
        };

    await handleToggleFavorite(rowForToggle, nextLiked);
  };

  return (
    <>
      <AllPlansTable
        title="我的收藏"
        rowsInput={rows}
        mode="likes"
        onToggleFavorite={handleToggleFavorite}
        onView={handleView}
      />
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
