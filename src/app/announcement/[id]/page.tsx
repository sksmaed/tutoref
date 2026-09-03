'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import ReactMarkdown from 'react-markdown';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { formatDateTime } from '@/features/review-shared/format';
import { ANNOUNCEMENT_TYPE_LABEL, fetchAnnouncement, type AnnouncementRow } from '@/services/review';

export default function AnnouncementDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [announcement, setAnnouncement] = useState<AnnouncementRow | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const data = await fetchAnnouncement(id);
        if (mounted) setAnnouncement(data);
      } catch (err) {
        if (mounted) setError(err instanceof Error ? err.message : '找不到這則公告');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, [id]);

  return (
    <section className="mx-auto mt-10 mb-16 w-full max-w-[976px] px-4 sm:px-6 lg:px-0">
      <Link href="/announcement" className="font-['Noto_Sans_TC'] text-[14px] text-primary-900 hover:opacity-80">
        ← 公告列表
      </Link>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
        </div>
      ) : error || !announcement ? (
        <div className="mt-4 rounded-lg bg-white px-6 py-12 text-center shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <p className="font-['Noto_Sans_TC'] text-[16px] text-status-alert">{error ?? '找不到這則公告'}</p>
        </div>
      ) : (
        <article className="mt-4 rounded-lg bg-white px-6 py-6 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="font-['Noto_Sans_TC'] text-[22px] font-bold text-black-900">{announcement.title}</h1>
            <StatusChip
              status={ANNOUNCEMENT_TYPE_LABEL[announcement.announcement_type] ?? announcement.announcement_type}
              tone={announcement.announcement_type === 'general' ? 'idle' : 'active'}
            />
          </div>
          <p className="mt-1 font-['Noto_Sans_TC'] text-[13px] text-black-500">
            {announcement.published_by_name ?? '系統'}・{formatDateTime(announcement.published_at)}
          </p>
          <div className="prose mt-4 max-w-none font-['Noto_Sans_TC'] text-[15px] text-black-900">
            <ReactMarkdown>{announcement.body || '（沒有內文）'}</ReactMarkdown>
          </div>
        </article>
      )}
    </section>
  );
}
