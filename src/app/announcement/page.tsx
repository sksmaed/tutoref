'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/features/auth/useAuth';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { ScheduleBlock } from '@/features/announcement/ScheduleBlock';
import { formatDateTime } from '@/features/review-shared/format';
import { StatusChip } from '@/features/review-shared/StatusChip';
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

export default function AnnouncementPage() {
  const { loading: authLoading, authenticated } = useAuth();
  const { context } = useTermContext();
  const termId = context?.current_term?.id ?? null;

  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [schedules, setSchedules] = useState<ScheduleRow[]>([]);
  const [filter, setFilter] = useState<AnnouncementType | 'all'>('all');
  const [loading, setLoading] = useState(true);

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
      <section className="mx-auto mt-10 mb-16 w-full max-w-[976px] px-4 sm:px-6 lg:px-0">
        <div className="rounded-lg bg-white px-6 py-12 text-center shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
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
    <section className="mx-auto mt-10 mb-16 w-full max-w-[976px] px-4 sm:px-6 lg:px-0">
      <h1 className="font-['Noto_Sans_TC'] text-[20px] font-bold text-black-900 sm:text-[25px]">公告</h1>

      {schedules.length > 0 && (
        <div className="mt-4">
          <ScheduleBlock schedules={schedules} />
        </div>
      )}

      <div className="mt-6 flex flex-wrap gap-2">
        {FILTERS.map((item) => (
          <button
            key={item.key}
            type="button"
            onClick={() => setFilter(item.key)}
            className={`rounded-lg px-3 py-1 font-['Noto_Sans_TC'] text-[14px] ${
              filter === item.key
                ? 'bg-primary-900 text-white'
                : 'bg-white text-black-700 hover:bg-primary-100'
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
        <div className="mt-4 rounded-lg bg-white px-6 py-12 text-center shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <p className="font-['Noto_Sans_TC'] text-[15px] text-black-700">目前沒有這類公告。</p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {visible.map((row) => (
            <li key={row.id}>
              <Link
                href={`/announcement/${row.id}`}
                className="block rounded-lg bg-white px-5 py-4 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] hover:bg-primary-100"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-['Noto_Sans_TC'] text-[16px] font-bold text-black-900">{row.title}</p>
                  <StatusChip
                    status={ANNOUNCEMENT_TYPE_LABEL[row.announcement_type] ?? row.announcement_type}
                    tone={row.announcement_type === 'general' ? 'idle' : 'active'}
                  />
                </div>
                {row.body && (
                  <p className="mt-1 line-clamp-2 font-['Noto_Sans_TC'] text-[14px] text-black-700">
                    {row.body}
                  </p>
                )}
                <p className="mt-2 font-['Noto_Sans_TC'] text-[13px] text-black-500">
                  {row.published_by_name ?? '系統'}・{formatDateTime(row.published_at)}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
