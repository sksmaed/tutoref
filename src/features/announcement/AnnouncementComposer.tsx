'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Dialog } from '@/components/ui/Dialog';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import { useTermContext } from '@/features/review-shared/useTermContext';
import type { Round } from '@/features/review-shared/types';
import { BTN, BTN_PRIMARY } from '@/lib/button-styles';
import { fetchFamilySubmissions, type FamilySubmissionProgress } from '@/services/review';
import { ANNOUNCEMENT_TEMPLATES } from './templates';
import { OpenAssignmentImpact } from './OpenAssignmentImpact';
import { useAnnouncementComposer } from './useAnnouncementComposer';

const ROUND_TABS = [
  { key: 'initial' as Round, label: '初驗' },
  { key: 'final' as Round, label: '總驗' },
];
const ROUND_LABEL: Record<Round, string> = { initial: '初驗', final: '總驗' };

const FIELD_LABEL = "mb-[6px] block font-['Noto_Sans_TC'] text-[12px] font-bold text-black-700";
const INPUT =
  "w-full rounded-[10px] border border-black-200 bg-white px-[10px] py-[9px] font-['Noto_Sans_TC'] text-[14px] text-black-900 outline-none focus:border-primary-700";

interface AnnouncementComposerProps {
  open: boolean;
  initialRound: Round;
  onClose: () => void;
  /** 發布成功後呼叫，參數是給使用者看的結果訊息。 */
  onPublished: (message: string) => void;
  onError: (message: string) => void;
}

/** 新增公告（v13 `openAnnouncementEditor()`）：模板 → 標題內容 → 發布設定。 */
export function AnnouncementComposer({
  open,
  initialRound,
  onClose,
  onPublished,
  onError,
}: AnnouncementComposerProps) {
  const { context } = useTermContext();
  const { publish, publishing, termId } = useAnnouncementComposer();
  const termLabel = context?.current_term?.label ?? '';

  const [round, setRound] = useState<Round>(initialRound);
  const [templateKey, setTemplateKey] = useState('general');
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [sendEmail, setSendEmail] = useState(true);
  const [openAssignments, setOpenAssignments] = useState(false);
  const [blockedReason, setBlockedReason] = useState<string | null>(null);
  const [families, setFamilies] = useState<FamilySubmissionProgress[]>([]);
  const [includeMissing, setIncludeMissing] = useState(true);

  const template = ANNOUNCEMENT_TEMPLATES.find((item) => item.key === templateKey) ?? ANNOUNCEMENT_TEMPLATES[0];
  const assignmentPublished = !!context?.stage_state?.[round]?.assignment_published;

  // 每次打開都從乾淨的狀態開始
  useEffect(() => {
    if (!open) return;
    setRound(initialRound);
    setTemplateKey('general');
    setTitle('');
    setBody('');
    setSendEmail(true);
    setOpenAssignments(false);
    setIncludeMissing(true);
  }, [open, initialRound]);

  // 缺交註記只在家長送出後才會到教案組，所以只看已送出的家
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    fetchFamilySubmissions(round)
      .then((rows) => !cancelled && setFamilies(rows))
      .catch(() => !cancelled && setFamilies([]));
    return () => {
      cancelled = true;
    };
  }, [open, round]);

  useEffect(() => {
    if (assignmentPublished) setOpenAssignments(false);
  }, [assignmentPublished]);

  const missingFamilies = useMemo(
    () => families.filter((family) => family.submitted && family.missing_total > 0),
    [families]
  );

  const applyTemplate = (key: string) => {
    const next = ANNOUNCEMENT_TEMPLATES.find((item) => item.key === key);
    if (!next) return;
    setTemplateKey(key);
    setTitle(next.title(termLabel, ROUND_LABEL[round]));
    setBody(next.body(termLabel, ROUND_LABEL[round]));
    setOpenAssignments(!!next.opensAssignments && !assignmentPublished);
  };

  const handleBlockedChange = useCallback((reason: string | null) => setBlockedReason(reason), []);

  const effectiveBlocked = openAssignments ? blockedReason : null;
  const canPublish = !!termId && !!title.trim() && !publishing && !effectiveBlocked;

  const handlePublish = async () => {
    let finalBody = body.trim();
    if (includeMissing && missingFamilies.length > 0) {
      const list = missingFamilies.map((family) => `${family.family_name} ${family.missing_total} 份`).join('、');
      finalBody = `${finalBody}${finalBody ? '\n\n' : ''}缺交註記：${list}。`;
    }
    try {
      await publish({
        round,
        type: openAssignments ? 'open_assignment' : template.type,
        title: title.trim(),
        body: finalBody,
        sendEmail,
        openAssignments,
      });
      onPublished(
        `${ROUND_LABEL[round]}公告已發布${openAssignments ? '，驗收任務已同步開放' : ''}${sendEmail ? '，並排定 Email 通知' : ''}`
      );
    } catch (err) {
      onError(err instanceof Error ? err.message : '請稍後再試。');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={publishing}
      size="lg"
      title="新增公告"
      subtitle="可從常用模板開始，再自行調整內容"
      footer={
        <>
          <button type="button" className={BTN} onClick={onClose} disabled={publishing}>
            取消
          </button>
          <button type="button" className={BTN_PRIMARY} onClick={handlePublish} disabled={!canPublish}>
            {publishing ? '發布中…' : openAssignments ? '發布並開放任務' : '發布公告'}
          </button>
        </>
      }
    >
      <div className="flex flex-wrap items-center gap-3">
        <span className={`${FIELD_LABEL} mb-0`}>輪次</span>
        <SegmentedTabs tabs={ROUND_TABS} active={round} onChange={setRound} variant="soft" />
      </div>

      <div className="mt-4">
        <span className={FIELD_LABEL}>常用模板</span>
        <div className="grid grid-cols-1 gap-[10px] sm:grid-cols-2">
          {ANNOUNCEMENT_TEMPLATES.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => applyTemplate(item.key)}
              className={`cursor-pointer rounded-[11px] border p-[11px] text-left font-['Noto_Sans_TC'] ${
                templateKey === item.key
                  ? 'border-primary-700 bg-primary-100'
                  : 'border-black-200 bg-white hover:border-primary-300'
              }`}
            >
              <span className="block text-[14px] font-bold text-black-900">{item.name}</span>
              <span className="text-[12px] text-black-500">{item.description}</span>
            </button>
          ))}
        </div>
        <p className="mt-2 font-['Noto_Sans_TC'] text-[12px] text-black-500">
          初驗／總驗結果公告要指定教案，請到{' '}
          <Link
            href={`/admin/review?tab=${round}&view=results`}
            className="font-bold text-primary-900 hover:opacity-80"
          >
            本期驗收管理 → 驗收結果
          </Link>{' '}
          發布。
        </p>
      </div>

      <div className="my-[18px] h-px bg-black-200" />

      <label className="block">
        <span className={FIELD_LABEL}>公告標題</span>
        <input
          className={INPUT}
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="標題（必填）"
        />
      </label>
      <label className="mt-3 block">
        <span className={FIELD_LABEL}>公告內容（支援 Markdown）</span>
        <textarea
          className={`${INPUT} min-h-[150px] resize-y`}
          value={body}
          onChange={(event) => setBody(event.target.value)}
        />
      </label>

      {missingFamilies.length > 0 && (
        <CheckRow
          className="mt-3"
          checked={includeMissing}
          onChange={setIncludeMissing}
          title="附上缺交註記"
          description={`${ROUND_LABEL[round]}目前有 ${missingFamilies.length} 家註記缺交：${missingFamilies
            .map((family) => `${family.family_name} ${family.missing_total} 份`)
            .join('、')}`}
        />
      )}

      <div className="my-[18px] h-px bg-black-200" />

      <p className="mb-3 font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">發布設定</p>
      <CheckRow
        checked={sendEmail}
        onChange={setSendEmail}
        title="發布後寄送 Email 通知"
        description="正式公告內容仍以 Tutoref 為準。"
      />
      <CheckRow
        className="mt-[10px]"
        checked={openAssignments}
        onChange={setOpenAssignments}
        disabled={assignmentPublished}
        title={`同步開放${ROUND_LABEL[round]}「我的驗收任務」`}
        description={
          assignmentPublished
            ? '本輪任務已開放。'
            : '勾選後會發布本輪分配，驗收者立刻看得到被分配的教案；這則公告會歸類為「開放驗收任務」。'
        }
      />
      {openAssignments && (
        <OpenAssignmentImpact round={round} sendEmail={sendEmail} onBlockedChange={handleBlockedChange} />
      )}
    </Dialog>
  );
}

function CheckRow({
  checked,
  onChange,
  title,
  description,
  disabled = false,
  className = '',
}: {
  checked: boolean;
  onChange: (value: boolean) => void;
  title: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <label
      className={`flex items-start gap-2 font-['Noto_Sans_TC'] ${disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'} ${className}`}
    >
      <input
        type="checkbox"
        className="mt-[3px] h-4 w-4 accent-primary-900"
        checked={checked}
        disabled={disabled}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span>
        <span className="block text-[14px] font-bold text-black-900">{title}</span>
        {description && <span className="text-[12px] text-black-500">{description}</span>}
      </span>
    </label>
  );
}
