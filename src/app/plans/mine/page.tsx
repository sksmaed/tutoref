'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { AllPlansTable, Row } from '@/features/teaching-plan/AllPlansTable';
import { DeleteTeachPlanModal } from '@/features/teaching-plan/DeleteTeachPlanModal';
import { fetchMyTeachingPlans, TeachingPlanDetail } from '@/services/teaching-plan';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { popFlash, Flash } from '@/lib/flash';
import { Toast } from '@/components/ui/toast';
import { readSessionJson, writeSessionJson } from '@/lib/session-cache';
import {
  MINE_PLANS_CACHE_KEY,
  MINE_TABLE_UI_CACHE_KEY,
  removePlanIdFromManageCaches,
} from '@/features/manage/cache';

const mapMyPlanToRow = (plan: TeachingPlanDetail): Row => ({
  id: plan.id,
  family: plan.team ?? '',
  issue: `${plan.academic_year ?? ''}${plan.semester_period ?? ''}`,
  category: plan.category ?? '',
  title: plan.tp_name ?? '',
  author: plan.writer_name ?? '',
  good: plan.is_excellent,
  liked: false,
  grade: plan.grade ?? '',
  duration: typeof plan.duration === 'number' ? plan.duration : undefined,
  viewCount: typeof plan.view_count === 'number' ? plan.view_count : undefined,
  createdAt: plan.created_at ? Date.parse(plan.created_at) : undefined,
  hashtags: Array.isArray(plan.hashtags) ? plan.hashtags : [],
  editingStatus: plan.editing_status,
  visibilityStatus: plan.visibility_status,
});

export default function MineAllPage() {
  const router = useRouter();
  const [rows, setRows] = useState<Row[]>([]);
  const { toast } = useToast();
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Row | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [flashToast, setFlashToast] = useState<Flash | null>(null);
  const [flashOpen, setFlashOpen] = useState(false);

  useEffect(() => {
    const flash = popFlash();
    if (flash) {
      setFlashToast(flash);
      setFlashOpen(true);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    // 快取先行：先顯示上次的清單，再背景更新
    const cachedRows = readSessionJson<Row[]>(MINE_PLANS_CACHE_KEY);
    if (Array.isArray(cachedRows) && cachedRows.length > 0) {
      setRows(cachedRows);
    }

    (async () => {
      try {
        const plans = await fetchMyTeachingPlans();
        if (!mounted) return;
        const mappedRows = plans.map(mapMyPlanToRow);
        setRows(mappedRows);
        writeSessionJson(MINE_PLANS_CACHE_KEY, mappedRows);
      } catch (error) {
        if (mounted && (!cachedRows || cachedRows.length === 0)) {
          toast({
            title: '❌ 無法取得我的教案',
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

  const handleDelete = async (row: Row): Promise<void> => {
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
    if (!deleteTarget?.id) {
      toast({
        title: '❌ 找不到教案',
        description: '無法取得教案 ID，請重新整理後再試。',
        variant: 'destructive',
      });
      setDeleteModalOpen(false);
      return;
    }

    setIsDeleting(true);
    try {
      await api.delete(`/teaching-plan/detail/${deleteTarget.id}`);
      setRows((prev) => {
        const nextRows = prev.filter((item) => item.id !== deleteTarget.id);
        writeSessionJson(MINE_PLANS_CACHE_KEY, nextRows);
        return nextRows;
      });
      removePlanIdFromManageCaches(deleteTarget.id);
      toast({
        title: '✅ 已刪除教案',
        description: '教案已成功移除。',
      });
      setDeleteModalOpen(false);
      setDeleteTarget(null);
    } catch (error: unknown) {
      toast({
        title: '❌ 刪除失敗',
        description: error instanceof Error ? error.message : '請稍後再試。',
        variant: 'destructive',
      });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCloseDeleteModal = () => {
    if (isDeleting) return;
    setDeleteModalOpen(false);
    setDeleteTarget(null);
  };

  return (
    <>
      <AllPlansTable
        title="我的教案"
        rowsInput={rows}
        mode="mine"
        uiStateStorageKey={MINE_TABLE_UI_CACHE_KEY}
        onEdit={handleEdit}
        onDelete={handleDelete}
      />
      <DeleteTeachPlanModal
        open={deleteModalOpen}
        onClose={handleCloseDeleteModal}
        onConfirm={handleConfirmDelete}
        planTitle={deleteTarget?.title}
        confirming={isDeleting}
      />
      <Toast
        open={flashOpen && !!flashToast}
        type={flashToast?.type}
        title={flashToast?.title ?? ''}
        message={flashToast?.message}
        timeout={flashToast?.timeout ?? 5000}
        onClose={() => setFlashOpen(false)}
      />
    </>
  );
}
