'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { StatusChip } from '@/features/review-shared/StatusChip';
import type { FeedbackItemRow, FeedbackStatus } from '@/services/review';

const STATUS_OPTIONS: { value: FeedbackStatus; label: string }[] = [
  { value: 'changed', label: '已修改' },
  { value: 'partially_changed', label: '部分修改' },
  { value: 'not_changed', label: '不修改' },
  { value: 'todo', label: '待處理' },
];

const STATUS_LABEL: Record<string, string> = {
  todo: '待處理',
  changed: '已修改',
  partially_changed: '部分修改',
  not_changed: '不修改',
};

/** 選「部分修改」或「不修改」時說明必填——前端擋一次，後端也擋（§6.2）。 */
export function requiresReason(status: FeedbackStatus): boolean {
  return status === 'partially_changed' || status === 'not_changed';
}

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
  const [status, setStatus] = useState<FeedbackStatus>((item.status as FeedbackStatus) ?? 'todo');
  const [body, setBody] = useState('');
  const [touched, setTouched] = useState(false);

  const missingReason = requiresReason(status) && !body.trim();

  return (
    <li className="border-b border-black-100 py-3 last:border-b-0">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <p className="min-w-0 flex-1 font-['Noto_Sans_TC'] text-[14px] text-black-900">{item.body}</p>
        <StatusChip status={STATUS_LABEL[item.status] ?? item.status} />
      </div>

      {item.responses.length > 0 && (
        <ul className="mt-2 flex flex-col gap-1">
          {item.responses.map((response, index) => (
            <li key={index} className="font-['Noto_Sans_TC'] text-[13px] text-black-700">
              你的說明：{response.body}
            </li>
          ))}
        </ul>
      )}

      <div className="mt-2 flex flex-wrap items-start gap-2">
        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as FeedbackStatus);
            setTouched(true);
          }}
          className="rounded-lg border border-black-200 px-2 py-1 text-[14px]"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        <input
          type="text"
          value={body}
          onChange={(event) => setBody(event.target.value)}
          placeholder={requiresReason(status) ? '請說明修改了什麼 / 為何不修改（必填）' : '補充說明（選填）'}
          className={`min-w-[220px] flex-1 rounded-lg border px-3 py-1 font-['Noto_Sans_TC'] text-[14px] ${
            touched && missingReason ? 'border-status-alert' : 'border-black-200'
          }`}
        />
        <Button
          onClick={() => void onRespond(item.id, status, body)}
          disabled={working || missingReason}
          className="bg-primary-900 px-4 py-1 text-white"
        >
          送出
        </Button>
      </div>
      {touched && missingReason && (
        <p className="mt-1 font-['Noto_Sans_TC'] text-[12px] text-status-alert">
          選「部分修改」或「不修改」時必須說明原因。
        </p>
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
