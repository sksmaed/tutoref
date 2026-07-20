'use client';

import { DeleteTeachPlanModal } from '@/features/teaching-plan/DeleteTeachPlanModal';
import { TeachingPlanDetailModal } from '@/features/teaching-plan/TeachingPlanDetailModal';
import { usePlanManagement } from '@/features/manage/usePlanManagement';
import MyPlansSection from '@/features/manage/MyPlansSection';
import MyLikesSection from '@/features/manage/MyLikesSection';

/**
 * 教案管理頁（薄路由層）：狀態集中在 usePlanManagement，
 * 視圖拆分為 MyPlansSection / MyLikesSection 與兩個 modal。
 */
export default function TeachPlanManagePage() {
  const {
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
  } = usePlanManagement();

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

          <MyPlansSection
            myPlans={myPlans}
            total={myPlansAll.length}
            hasPlans={hasPlans}
            plansLoading={plansLoading}
            plansError={plansError}
            deletingId={deletingId}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onViewAll={() => router.push('/plans/mine')}
            onUpload={() => router.push('/upload')}
          />

          <MyLikesSection
            myLikes={myLikes}
            total={myLikesAll.length}
            hasLikes={hasLikes}
            likesLoading={likesLoading}
            likesError={likesError}
            likes={likes}
            favoriteUpdatingId={favoriteUpdatingId}
            detailLoading={detailLoading}
            detailPlanId={detailPlanId}
            onView={handleView}
            onFavoriteToggle={handleFavoriteToggle}
            onViewAll={() => router.push('/plans/likes')}
          />
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
