'use client';

import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/features/review-shared/StatusChip';
import type { FeedbackItemRow, FeedbackStatus } from '@/services/review';

const STATUS_LABEL: Record<string, string> = {
  todo: '待處理',
  changed: '已修改',
  partially_changed: '部分修改',
  not_changed: '不修改',
};

/** 上游 §12.3：只有「部分修改」與「不修改」要說明理由。 */
export function requiresReason(status: FeedbackStatus): boolean {
  return status === 'partially_changed' || status === 'not_changed';
}

const ACTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: 'changed', label: '已修改' },
  { value: 'partially_changed', label: '部分修改' },
  { value: 'not_changed', label: '不修改' },
];

interface FeedbackItemListProps {
  items: FeedbackItemRow[];
  working: boolean;
  onRespond: (itemId: string, status: FeedbackStatus, body: string) => Promise<void>;
}

const FeedbackRow: React.FC<{
  item: FeedbackItemRow;
  working: boolean;
  onRespond: FeedbackItemListProps['onRespond'];
}> = ({ item, working, onRespond }) => {
  /** 需要理由的狀態會先展開輸入框；不需要理由的直接送出。 */
  const [pending, setPending] = useState<FeedbackStatus | null>(null);
  const [body, setBody] = useState('');
  const [saved, setSaved] = useState(false);

  // 就地更新後把暫存狀態收掉
  useEffect(() => {
    setPending(null);
    setBody('');
  }, [item.status, item.responses.length]);

  useEffect(() => {
    if (!saved) return;
    const timer = window.setTimeout(() => setSaved(false), 2500);
    return () => window.clearTimeout(timer);
  }, [saved]);

  const submit = async (status: FeedbackStatus, reason: string) => {
    await onRespond(item.id, status, reason);
    setSaved(true);
  };

  const handleAction = (status: FeedbackStatus) => {
    if (requiresReason(status)) {
      setPending(status);
      return;
    }
    void submit(status, '');
  };

  return (
    <li className="border-b border-black-100 py-3 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 font-['Noto_Sans_TC'] text-[14px] text-black-900">{item.body}</p>
        <span className="flex items-center gap-2">
          {saved && <span className="font-['Noto_Sans_TC'] text-[12px] text-status-done">已儲存</span>}
          <StatusChip status={STATUS_LABEL[item.status] ?? item.status} />
        </span>
      </div>

      {item.responses.map((response, index) => (
        <p key={index} className="mt-1 font-['Noto_Sans_TC'] text-[13px] text-black-700">
          你的說明：{response.body}
        </p>
      ))}

      {pending === null ? (
        <div className="mt-2 flex flex-wrap gap-2">
          {ACTIONS.map((action) => (
            <button
              key={action.value}
              type="button"
              disabled={working}
              onClick={() => handleAction(action.value)}
              className={`rounded-lg px-3 py-1 font-['Noto_Sans_TC'] text-[13px] hover:cursor-pointer disabled:cursor-not-allowed ${
                item.status === action.value
                  ? 'bg-primary-900 text-white'
                  : 'bg-black-100 text-black-700 hover:bg-primary-100'
              }`}
            >
              {action.label}
            </button>
          ))}
          {item.status !== 'todo' && (
            <span className="self-center font-['Noto_Sans_TC'] text-[12px] text-black-500">
              改主意的話再點一次就好
            </span>
          )}
        </div>
      ) : (
        <div className="mt-2 flex flex-wrap items-start gap-2">
          <input
            type="text"
            autoFocus
            value={body}
            onChange={(event) => setBody(event.target.value)}
            placeholder={
              pending === 'partially_changed'
                ? '已修改哪些、哪些仍未修改（必填）'
                : '為什麼不修改（必填）'
            }
            className="min-w-[220px] flex-1 rounded-lg border border-black-200 px-3 py-1 font-['Noto_Sans_TC'] text-[14px]"
          />
          <Button
            onClick={() => void submit(pending, body)}
            disabled={working || !body.trim()}
            className="bg-primary-900 px-4 py-1 text-white"
          >
            送出「{STATUS_LABEL[pending]}」
          </Button>
          <button
            type="button"
            onClick={() => {
              setPending(null);
              setBody('');
            }}
            className="self-center font-['Noto_Sans_TC'] text-[13px] text-black-500 hover:cursor-pointer"
          >
            取消
          </button>
        </div>
      )}
    </li>
  );
};

export const FeedbackItemList: React.FC<FeedbackItemListProps> = ({ items, working, onRespond }) => {
  if (items.length === 0) {
    return (
      <p className="font-['Noto_Sans_TC'] text-[14px] text-black-500">
        這份教案還沒有回饋。結果發布之後回饋會出現在這裡。
      </p>
    );
  }

  return (
    <ul className="flex flex-col">
      {items.map((item) => (
        <FeedbackRow key={item.id} item={item} working={working} onRespond={onRespond} />
      ))}
    </ul>
  );
};
