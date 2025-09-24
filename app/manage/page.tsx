'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import { useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
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
};

type MyTeachingPlansResponse = {
  data?: MyTeachingPlanItem[];
};

type FavoritesResponse = {
  data?: FavoriteItem[];
};

const BACKEND_URL = process.env.NEXT_PUBLIC_API_BASE_URL;
const API_PREFIX = BACKEND_URL ? `${BACKEND_URL}/api/v2/teaching-plan` : '';

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

export default function TeachPlanManagePage() {
  const router = useRouter();
  const { toast } = useToast();

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
      'w-[160px] h-[48px] rounded-[8px] px-[47px] py-[12px] text-[16px] leading-[150%] font-["Noto_Sans_TC"] shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]',
      disabled
        ? 'bg-white border border-black-300 text-black-300 cursor-not-allowed'
        : 'bg-white border border-primary-900 text-primary-900',
    ].join(' ');

  useEffect(() => {
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

  return (
    <>
      <main className="min-h-screen bg-black-50">
        <section className="mx-auto mt-16 w-[976px]">
        <h1 className="text-center text-[40px] font-bold font-['Noto_Sans_TC'] text-black-900">
          教案管理
        </h1>

        {/* ===== 我的教案 ===== */}
        <SectionHeader title="我的教案" total={myPlansAll.length} />

        <TableShell>
          <TableHeader cols={['家別', '期數', '類別', '教案名稱', '撰寫者', '編輯', '刪除']} />

          {plansLoading ? (
            <EmptyRow>資料載入中...</EmptyRow>
          ) : plansError ? (
            <EmptyRow>{plansError}</EmptyRow>
          ) : hasPlans ? (
            <div className="border-x border-b border-black-200 rounded-b-lg divide-y">
              {myPlans.map((r) => (
                <div key={r.id} className="flex h-[48px] items-center text-[14px]">
                  <BodyCell w="92">{r.family}</BodyCell>
                  <BodyCell w="92">{r.issue}</BodyCell>
                  <BodyCell w="92">{r.category}</BodyCell>
                  <BodyCell w="352">
                    <div className="flex items-center justify-center gap-2">
                      {r.good && <Image src="/icons/good.png" alt="" width={16} height={16} style={goodTint} />}
                      <span className="truncate">{r.title}</span>
                    </div>
                  </BodyCell>
                 <BodyCell w="164">{r.author}</BodyCell>
                 <BodyCell w="92" center>
                    <button
                      type="button"
                      aria-label="編輯"
                      onClick={() => handleEdit(r)}
                      disabled={plansLoading || deletingId === r.id}
                      className={plansLoading || deletingId === r.id ? 'cursor-not-allowed opacity-60' : 'hover:cursor-pointer'}
                    >
                      <Image src="/icons/edit.png" alt="" width={20} height={20} />
                    </button>
                  </BodyCell>
                  <BodyCell w="92" center>
                    <button
                      type="button"
                      aria-label="刪除"
                      onClick={() => handleDelete(r)}
                      disabled={plansLoading || deletingId === r.id}
                      className={plansLoading || deletingId === r.id ? 'cursor-not-allowed opacity-60' : 'hover:cursor-pointer'}
                    >
                      <Image src="/icons/trash.png" alt="" width={20} height={20} />
                    </button>
                  </BodyCell>
                </div>
              ))}
            </div>
          ) : (
            <EmptyRow>
              你還沒上傳任何教案唷，快點擊下方按鈕上傳第一份教案吧！
            </EmptyRow>
          )}
        </TableShell>

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
              px-[47px] py-[12px]
              text-[16px] leading-[150%] font-['Noto_Sans_TC'] font-bold text-white
              shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]
            "
          >
            上傳教案
          </button>
        </div>

        {/* ===== 我的收藏 ===== */}
        <SectionHeader className="mt-12" title="我的收藏" total={myLikesAll.length} />

        <TableShell>
          <TableHeader cols={['家別', '期數', '類別', '教案名稱', '撰寫者', '查看', '收藏']} />

          {likesLoading ? (
            <EmptyRow>資料載入中...</EmptyRow>
          ) : likesError ? (
            <EmptyRow>{likesError}</EmptyRow>
          ) : hasLikes ? (
            <div className="border-x border-b border-black-200 rounded-b-lg divide-y">
              {myLikes.map((r) => {
                const liked = likes[r.id] ?? true;
                return (
                  <div key={r.id} className="flex h-[48px] items-center text-[14px]">
                    <BodyCell w="92">{r.family}</BodyCell>
                    <BodyCell w="92">{r.issue}</BodyCell>
                    <BodyCell w="92">{r.category}</BodyCell>
                    <BodyCell w="352">
                      <div className="flex items-center justify-center gap-2">
                        {r.good && <Image src="/icons/good.png" alt="" width={16} height={16} style={goodTint} />}
                        <span className="truncate">{r.title}</span>
                      </div>
                    </BodyCell>
                    <BodyCell w="164">{r.author}</BodyCell>
                    <BodyCell w="92" center>
                      <button
                        type="button"
                        aria-label="查看"
                        onClick={() => handleView(r)}
                        disabled={detailLoading && detailPlanId === r.id}
                        className={detailLoading && detailPlanId === r.id ? 'cursor-not-allowed opacity-60' : ''}
                      >
                        <Image src="/icons/file-alt.png" alt="" width={20} height={20} />
                      </button>
                    </BodyCell>
                    <BodyCell w="92" center>
                      <button
                        type="button"
                        onClick={() => handleFavoriteToggle(r)}
                        disabled={favoriteUpdatingId === r.id || likesLoading}
                        aria-label={liked ? '取消收藏' : '加入收藏'}
                      >
                        <Image
                          src={liked ? '/icons/liked.png' : '/icons/like.png'}
                          alt=""
                          width={20}
                          height={20}
                        />
                      </button>
                    </BodyCell>
                  </div>
                );
              })}
            </div>
          ) : (
            <EmptyRow>
              目前沒有收藏的教案唷，快去探索看看其他人的教案吧！
            </EmptyRow>
          )}
        </TableShell>

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

function TableShell({ children }: { children: ReactNode }) {
  return (
    <div className="mt-2 w-[976px] mx-auto rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] bg-white">
      {children}
    </div>
  );
}

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div className="w-[976px] h-[48px] flex">
      <HeaderCell className="rounded-tl-lg">{cols[0]}</HeaderCell>
      <HeaderCell>{cols[1]}</HeaderCell>
      <HeaderCell>{cols[2]}</HeaderCell>
      <HeaderCell wide="title">{cols[3]}</HeaderCell>
      <HeaderCell wide="author">{cols[4]}</HeaderCell>
      <HeaderCell>{cols[5]}</HeaderCell>
      <HeaderCell className="rounded-tr-lg">{cols[6]}</HeaderCell>
    </div>
  );
}

function HeaderCell({
  children,
  className = '',
  wide,
}: {
  children: ReactNode;
  className?: string;
  wide?: 'title' | 'author';
}) {
  const base =
    'flex items-center justify-center text-[14px] font-bold font-["Noto_Sans_TC"] text-black-900 ' +
    'border border-black-200 bg-primary-100 whitespace-nowrap break-normal';
  const padNormal = 'py-2 px-2';
  const padTitle = 'py-2 px-[30px]';
  const wClass =
    wide === 'title'
      ? 'w-[352px]'
      : wide === 'author'
      ? 'w-[164px]'
      : 'w-[92px]';
  return (
    <div className={`${base} ${wClass} ${wide ? padTitle : padNormal} ${className}`} style={{ wordBreak: 'keep-all' }}>
      {children}
    </div>
  );
}

function BodyCell({
  children,
  w,
  center = true,
}: {
  children: ReactNode;
  w: '92' | '164' | '352';
  center?: boolean;
}) {
  return (
    <div
      className={[
        `w-[${w}px] h-[48px] px-2 flex items-center`,
        center ? 'justify-center text-center' : '',
        'border-x border-b border-black-200 first:border-l-0 last:border-r-0',
      ].join(' ')}
    >
      {children}
    </div>
  );
}

function EmptyRow({ children }: { children: ReactNode }) {
  return (
    <div className="w-[976px] h-[48px] flex items-center justify-center border-x border-b border-black-200 rounded-b-lg px-11">
      <p className="text-[16px] leading-[150%] font-['Noto_Sans_TC'] font-normal text-black-700 text-center">
        {children}
      </p>
    </div>
  );
}
