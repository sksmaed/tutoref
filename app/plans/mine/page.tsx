'use client';

import { useEffect, useState } from 'react';
import { AllPlansTable, Row } from '@/components/ui/AllPlansTable';
import { DeleteTeachPlanModal } from '@/components/ui/DeleteTeachPlanModal';
import { fetchMyTeachingPlans, TeachingPlanDetail } from '@/services/teachingPlan';
import { api } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { popFlash, Flash } from '@/utils/flash';
import { Toast } from '@/components/ui/toast';

const mapMyPlanToRow = (plan: TeachingPlanDetail): Row => ({
  id: plan.id,
  family: plan.team ?? '',
  issue: `${plan.academic_year ?? ''}${plan.semester_period ?? ''}`,
  category: plan.category ?? '',
  title: plan.tp_name ?? '',
  author: plan.writer_name ?? '',
  good: plan.is_excellent,
  liked: false,
});

export default function MineAllPage() {
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
    (async () => {
      try {
        const plans = await fetchMyTeachingPlans();
        if (!mounted) return;
        setRows(plans.map(mapMyPlanToRow));
      } catch (error) {
        if (mounted) {
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
    window.location.href = `/plans/${row.id}/edit`;
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
      setRows((prev) => prev.filter((item) => item.id !== deleteTarget.id));
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
