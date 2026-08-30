'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import { Toast } from '@/components/ui/toast';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { RoundTabs, useRound } from '@/features/review-shared/RoundTabs';
import { formatDateTime } from '@/features/review-shared/format';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { useAssignmentBoard } from '@/features/admin/assignments/useAssignmentBoard';
import {
  ANNOUNCEMENT_TYPE_LABEL,
  fetchAnnouncements,
  publishAnnouncement,
  publishAssignments,
  type AnnouncementRow,
  type AnnouncementType,
} from '@/services/review';

/** 可以從這裡發的模板；結果公告要指定教案，留在結果分頁做。 */
const TEMPLATES: { key: AnnouncementType; label: string; hint: string }[] = [
  { key: 'general', label: '一般公告', hint: '純文字公告，不改變任何流程狀態。' },
  { key: 'schedule', label: '驗收時程', hint: '提醒本輪的送件與驗收截止；日期在「時程與規則」設定。' },
  { key: 'remedial', label: '補驗通知', hint: '補驗相關說明；不會自動建立補驗輪。' },
  {
    key: 'open_assignment',
    label: '開放驗收任務',
    hint: '會同時發布本輪分配，reviewer 立刻看得到自己的任務——這是不可逆的流程動作。',
  },
];

export default function AdminAnnouncementsPage() {
  const round = useRound();
  const { context, reload: reloadContext } = useTermContext();
  const termId = context?.current_term?.id ?? null;
  const board = useAssignmentBoard(round);

  const [rows, setRows] = useState<AnnouncementRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<AnnouncementType>('general');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sendEmail, setSendEmail] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(
    null
  );

  const reload = useCallback(async () => {
    if (!termId) return;
    setLoading(true);
    try {
      setRows(await fetchAnnouncements({ termId }));
    } finally {
      setLoading(false);
    }
  }, [termId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  /** 影響摘要：不可逆動作值得一個具體的確認畫面（§6.7）。 */
  const impact = useMemo(() => {
    const reviewerIds = new Set<string>();
    board.jobs.forEach((job) => {
      (['A', 'B'] as const).forEach((slot) => {
        const id = board.slots[job.id]?.[slot];
        if (id) reviewerIds.add(id);
      });
    });
    return { jobCount: board.jobs.length, reviewerCount: reviewerIds.size };
  }, [board.jobs, board.slots]);

  const blockedReason =
    type !== 'open_assignment'
      ? null
      : board.jobs.length === 0
        ? '本輪還沒有任何送件，沒有可發布的任務。'
        : board.incomplete.length > 0
          ? `還有 ${board.incomplete.length} 份教案沒有填滿 A / B 兩位 reviewer。`
          : board.changes.length > 0
            ? '分配有未儲存的改動，請先回「驗收分配」儲存草稿。'
            : null;

  const submit = async () => {
    if (!termId || !title.trim()) return;
    setWorking(true);
    try {
      if (type === 'open_assignment') {
        await publishAssignments(termId, round, { title, body, send_email: sendEmail });
        await reloadContext();
        setNotice({
          type: 'success',
          title: '任務已開放',
          message: `${impact.jobCount} 份任務、${impact.reviewerCount} 位 reviewer。`,
        });
      } else {
        await publishAnnouncement({
          term_id: termId,
          announcement_type: type,
          title,
          body,
          send_email: sendEmail,
        });
        setNotice({ type: 'success', title: '公告已發布' });
      }
      setOpen(false);
      setTitle('');
      setBody('');
      setSendEmail(false);
      await reload();
    } catch (err) {
      setNotice({
        type: 'error',
        title: '發布失敗',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-['Noto_Sans_TC'] text-[18px] font-bold text-black-900">驗收公告</h2>
        <Button onClick={() => setOpen(true)} className="bg-primary-900 px-4 py-1 font-bold text-white">
          發布公告
        </Button>
      </div>
      <p className="mt-1 font-['Noto_Sans_TC'] text-[13px] text-black-700">
        驗收結果公告要指定教案，請到「驗收管理 → 驗收結果」發布。
      </p>

      <div className="mt-4">
        <RoundTabs />
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
        </div>
      ) : rows.length === 0 ? (
        <div className="mt-4 rounded-lg bg-white px-6 py-12 text-center shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <p className="font-['Noto_Sans_TC'] text-[15px] text-black-700">本期還沒有公告。</p>
        </div>
      ) : (
        <ul className="mt-4 flex flex-col gap-3">
          {rows.map((row) => (
            <li
              key={row.id}
              className="rounded-lg bg-white px-5 py-4 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">{row.title}</p>
                <StatusChip
                  status={ANNOUNCEMENT_TYPE_LABEL[row.announcement_type] ?? row.announcement_type}
                  tone={row.announcement_type === 'general' ? 'idle' : 'active'}
                />
              </div>
              <p className="mt-1 font-['Noto_Sans_TC'] text-[13px] text-black-500">
                {row.published_by_name ?? '系統'}・{formatDateTime(row.published_at)}
              </p>
            </li>
          ))}
        </ul>
      )}

      {open && (
        <div className="fixed inset-0 z-1000">
          <div
            className="absolute inset-0"
            style={{ backgroundColor: '#0D0D0DB2' }}
            onClick={working ? undefined : () => setOpen(false)}
            aria-hidden
          />
          <div
            className="absolute left-1/2 top-1/2 w-[min(520px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-[8px] bg-white px-8 py-6 shadow-xl"
            role="dialog"
            aria-modal="true"
          >
            <h3 className="text-center font-['Noto_Sans_TC'] text-[18px] font-medium text-black-900">
              發布公告
            </h3>

            <select
              value={type}
              onChange={(event) => setType(event.target.value as AnnouncementType)}
              className="mt-4 w-full rounded-lg border border-black-200 px-3 py-2 text-[14px]"
            >
              {TEMPLATES.map((template) => (
                <option key={template.key} value={template.key}>
                  {template.label}
                </option>
              ))}
            </select>
            <p className="mt-1 font-['Noto_Sans_TC'] text-[12px] text-black-500">
              {TEMPLATES.find((template) => template.key === type)?.hint}
            </p>

            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder="標題（必填）"
              className="mt-3 w-full rounded-lg border border-black-200 px-3 py-2 text-[14px]"
            />
            <textarea
              value={body}
              onChange={(event) => setBody(event.target.value)}
              rows={4}
              placeholder="內容（支援 Markdown）"
              className="mt-2 w-full rounded-lg border border-black-200 px-3 py-2 text-[14px]"
            />
            <div className="mt-2">
              <Checkbox checked={sendEmail} onChange={setSendEmail} label="同時寄 Email" />
            </div>

            {type === 'open_assignment' && (
              <div
                className={`mt-3 rounded-lg px-4 py-3 ${blockedReason ? 'bg-status-alert-bg' : 'bg-status-active-bg'}`}
              >
                {blockedReason ? (
                  <p className="font-['Noto_Sans_TC'] text-[14px] text-status-alert">{blockedReason}</p>
                ) : (
                  <p className="font-['Noto_Sans_TC'] text-[14px] text-status-active">
                    將開放 <span className="font-bold">{impact.jobCount}</span> 份任務給{' '}
                    <span className="font-bold">{impact.reviewerCount}</span> 位 reviewer
                    {sendEmail ? `，並寄出 ${impact.reviewerCount} 封信` : ''}。
                  </p>
                )}
              </div>
            )}

            <div className="mt-5 flex justify-center gap-[10px]">
              <Button
                onClick={working ? undefined : () => setOpen(false)}
                disabled={working}
                className="w-[110px] rounded-lg border border-primary-900 bg-white py-2 text-primary-900"
              >
                取消
              </Button>
              <Button
                onClick={working ? undefined : submit}
                disabled={working || !title.trim() || !!blockedReason}
                className="w-[150px] rounded-lg bg-primary-900 py-2 font-bold text-white"
              >
                {working ? '發布中…' : type === 'open_assignment' ? '確認並開放任務' : '確認發布'}
              </Button>
            </div>
          </div>
        </div>
      )}

      <Toast
        open={!!notice}
        type={notice?.type}
        title={notice?.title ?? ''}
        message={notice?.message}
        onClose={() => setNotice(null)}
      />
    </div>
  );
}
