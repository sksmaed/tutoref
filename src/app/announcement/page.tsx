'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Toast } from '@/components/ui/toast';
import { PageHead } from '@/components/layout/PageHead';
import { useAuth } from '@/features/auth/useAuth';
import { useTermContext } from '@/features/review-shared/useTermContext';
import type { Round } from '@/features/review-shared/types';
import { ScheduleBlock } from '@/features/announcement/ScheduleBlock';
import { AnnouncementComposer } from '@/features/announcement/AnnouncementComposer';
import { formatDateTime } from '@/features/review-shared/format';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { BTN_PRIMARY } from '@/lib/button-styles';
import {
  ANNOUNCEMENT_TYPE_LABEL,
  fetchAnnouncements,
  fetchSchedules,
  type AnnouncementRow,
  type AnnouncementType,
  type ScheduleRow,
} from '@/services/review';

const FILTERS: { key: AnnouncementType | 'all'; label: string }[] = [
  { key: 'all', label: '全部' },
  { key: 'general', label: '一般' },
  { key: 'schedule', label: '驗收時程' },
  { key: 'open_assignment', label: '開放任務' },
  { key: 'publish_initial_result', label: '初驗結果' },
  { key: 'publish_final_result', label: '總驗結果' },
  { key: 'remedial', label: '補驗' },
];

type Notice = { type: 'success' | 'error'; title: string; message?: string };

export default function AnnouncementPage() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { loading: authLoading, authenticated } = useAuth();
  const { context, can } = useTermContext();
  const termId = context?.current_term?.id ?? null;
  const canPublish = can('announcement.publish');

  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [filter, setFilter] = useState<AnnouncementType | 'all'>('all');
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  // ?compose=1&round=final：從「本期驗收管理 → 分配」直接開撰寫器
  const composeOpen = canPublish && searchParams?.get('compose') === '1';
  const roundParam = searchParams?.get('round');
  // 沒指定輪次時：初驗結果公告後就預設總驗
  const defaultRound: Round =
    roundParam === 'final' || roundParam === 'initial'
      ? roundParam
      : context?.stage_state?.initial?.result_published
        ? 'final'
        : 'initial';

  const setCompose = useCallback(
    (openComposer: boolean) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '');
      if (openComposer) params.set('compose', '1');
      else {
        params.delete('compose');
        params.delete('round');
      }
      const query = params.toString();
      router.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams]
  );

  const reload = useCallback(async () => {
    if (!authenticated) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      setRows(await fetchAnnouncements({ termId: termId ?? undefined }));
      if (termId) setSchedules(await fetchSchedules(termId));
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [authenticated, termId]);

  useEffect(() => {
    if (authLoading) return;
    void reload();
  }, [authLoading, reload]);

  const visible = filter === 'all' ? rows : rows.filter((row) => row.announcement_type === filter);

  if (!authLoading && !authenticated) {
    return (
      <section className="pb-16">
        <PageHead title="訊息公告" />
        <div className="rounded-[10px] border border-black-200 bg-white px-6 py-12 text-center">
          <p className="font-['Noto_Sans_TC'] text-[16px] text-black-900">公告是團內資訊，請先登入。</p>
          <Link
            href="/login"
            className="mt-4 inline-block font-['Noto_Sans_TC'] text-[15px] text-primary-900 hover:opacity-80"
          >
            前往登入 →
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="pb-16">
      <PageHead
        title="訊息公告"
        subtitle="查看教案組發布的驗收時程、結果與重要通知。"
        actions={
          canPublish ? (
            <button type="button" className={BTN_PRIMARY} onClick={() => setCompose(true)}>
              ＋ 新增公告
            </button>
          ) : undefined
        }
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap gap-2">
            {FILTERS.map((item) => (
              <button
                key={item.key}
                type="button"
                onClick={() => setFilter(item.key)}
                className={`cursor-pointer rounded-full border px-[10px] py-[6px] font-['Noto_Sans_TC'] text-[12px] ${
                  filter === item.key
                    ? 'border-primary-300 bg-primary-100 font-bold text-primary-900'
                    : 'border-black-200 bg-white text-black-700 hover:bg-primary-100/60'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex min-h-[30vh] items-center justify-center">
              <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
            </div>
          ) : visible.length === 0 ? (
            <div className="rounded-[13px] border border-black-200 bg-white px-6 py-12 text-center">
              <p className="font-['Noto_Sans_TC'] text-[14px] text-black-500">目前沒有這類公告。</p>
            </div>
          ) : (
            <ul className="flex flex-col gap-[10px]">
              {visible.map((row) => (
                <li key={row.id}>
                  <Link
                    href={`/announcement/${row.id}`}
                    className="block rounded-[13px] border border-black-200 bg-white p-4 transition-colors hover:border-primary-300"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <p className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">{row.title}</p>
                      <StatusChip
                        status={ANNOUNCEMENT_TYPE_LABEL[row.announcement_type] ?? row.announcement_type}
                        tone={row.announcement_type === 'general' ? 'idle' : 'active'}
                      />
                    </div>
                    <p className="mt-1 font-['Noto_Sans_TC'] text-[11px] text-black-500">
                      {formatDateTime(row.published_at)}・{row.published_by_name ?? '教案組'}
                    </p>
                    {row.body && (
                      <p className="mt-2 line-clamp-2 font-['Noto_Sans_TC'] text-[12px] leading-[160%] text-black-700">
                        {row.body}
                      </p>
                    )}
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="min-w-0">
          <ScheduleBlock termLabel={context?.current_term?.label} schedules={schedules} />
        </div>
      </div>

      {canPublish && (
        <AnnouncementComposer
          open={composeOpen}
          initialRound={defaultRound}
          onClose={() => setCompose(false)}
          onPublished={(message) => {
            setCompose(false);
            setNotice({ type: 'success', title: '公告已發布', message });
            void reload();
          }}
          onError={(message) => setNotice({ type: 'error', title: '發布失敗', message })}
        />
      )}

      <Toast
        open={!!notice}
        type={notice?.type}
        title={notice?.title ?? ''}
        message={notice?.message}
        onClose={() => setNotice(null)}
      />
    </section>
  );
}
