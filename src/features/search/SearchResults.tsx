'use client';
import { TeachingPlanDetailModal } from '@/features/teaching-plan/TeachingPlanDetailModal';
import { useSearchResults } from './results/useSearchResults';
import ResultsToolbar from './results/ResultsToolbar';
import ResultsTable from './results/ResultsTable';
import ResultsCards from './results/ResultsCards';
import ResultsPagination from './results/ResultsPagination';
import type { Filters, IssueSortValue } from './results/types';

/**
 * 檢索結果區（容器）：狀態集中在 useSearchResults，
 * 視圖拆分為 Toolbar / Table（桌機）/ Cards（手機）/ Pagination。
 */
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
  const {
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
  } = useSearchResults({ query, filters, trigger, initialSort, initialOnlyGood });

  return (
    <>
      <section className="mt-10 mx-auto w-full max-w-[976px] px-4 sm:px-6 lg:px-0">
        <ResultsToolbar
          searching={searching}
          total={total}
          onlyGood={onlyGood}
          onOnlyGoodToggle={() => setOnlyGood((v) => !v)}
          sort={sort}
          onSortChange={setSort}
        />

        <ResultsTable
          searching={searching}
          pageRows={pageRows}
          detailLoading={detailLoading}
          detailPlanId={detailPlanId}
          favoritePendingId={favoritePendingId}
          onView={handleView}
          onToggleLike={toggleLike}
        />

        <ResultsCards
          searching={searching}
          pageRows={pageRows}
          detailLoading={detailLoading}
          detailPlanId={detailPlanId}
          favoritePendingId={favoritePendingId}
          onView={handleView}
          onToggleLike={toggleLike}
        />

        <ResultsPagination
          page={page}
          setPage={setPage}
          setPageDirect={setPage}
          total={total}
          displayTotalPages={displayTotalPages}
        />
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
