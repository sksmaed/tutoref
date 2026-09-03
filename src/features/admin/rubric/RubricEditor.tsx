'use client';

import React, { useMemo, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Checkbox } from '@/components/ui/Checkbox';
import type { RubricItemInput, RubricRow, RubricVersionRow } from '@/services/review';

interface RubricEditorProps {
  rubric: RubricRow;
  version: RubricVersionRow | null;
  working: boolean;
  onCreateVersion: (payload: {
    rubric_id: string;
    kind: 'initial' | 'final';
    title: string;
    items: RubricItemInput[];
    scoring: Record<string, number> | null;
    activate: boolean;
  }) => Promise<void>;
}

/**
 * 標準是版本化的：任務鎖定的是「當時的版本」，所以編輯一律開新版本，
 * 不會動到已經在跑的驗收（§8.2 Rubric）。
 */
export const RubricEditor: React.FC<RubricEditorProps> = ({
  rubric,
  version,
  working,
  onCreateVersion,
}) => {
  const initial = rubric.kind === 'initial';
  const snapshot = version?.content_snapshot;

  const baseItems = useMemo<RubricItemInput[]>(() => {
    const source = initial ? snapshot?.check_items : snapshot?.final_check_items;
    return (source ?? []).map((item) => ({
      label: item.label,
      description: item.description,
      category: 'category' in item ? item.category : '',
      section: 'section' in item ? item.section : '',
      deduction_value: 'deduction_value' in item ? Number(item.deduction_value) : null,
      sort_order: item.sort_order,
    }));
  }, [initial, snapshot]);

  const [editing, setEditing] = useState(false);
  const [items, setItems] = useState<RubricItemInput[]>(baseItems);
  const [title, setTitle] = useState('');
  const [activate, setActivate] = useState(true);
  const [baseScore, setBaseScore] = useState(Number(snapshot?.scoring?.base_score ?? 32));

  const startEditing = () => {
    setItems(baseItems);
    setTitle(`${rubric.name} v${(version?.version ?? 0) + 1}`);
    setEditing(true);
  };

  const update = (index: number, patch: Partial<RubricItemInput>) =>
    setItems((prev) => prev.map((item, i) => (i === index ? { ...item, ...patch } : item)));

  const grouped = useMemo(() => {
    const groups = new Map<string, { item: RubricItemInput; index: number }[]>();
    items.forEach((item, index) => {
      const key = (initial ? item.category : item.section) || '未分類';
      const list = groups.get(key) ?? [];
      list.push({ item, index });
      groups.set(key, list);
    });
    return [...groups.entries()];
  }, [initial, items]);

  if (!editing) {
    return (
      <div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <p className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">
              {rubric.name}
              {version && <span className="ml-2 text-[13px] text-black-700">v{version.version}</span>}
            </p>
            {initial && snapshot?.scoring && (
              <p className="font-['Noto_Sans_TC'] text-[13px] text-black-700">
                底分 {snapshot.scoring.base_score}・通過 {snapshot.scoring.pass_min_score}・
                潛力優良 {snapshot.scoring.potential_excellent_threshold}
              </p>
            )}
          </div>
          <Button
            onClick={startEditing}
            className="border border-primary-900 bg-white px-4 py-1 text-primary-900"
          >
            以此版本建立新版
          </Button>
        </div>

        <div className="mt-3 flex flex-col gap-3">
          {grouped.map(([group, entries]) => (
            <div key={group}>
              <p className="font-['Noto_Sans_TC'] text-[14px] font-bold text-black-900">{group}</p>
              <ul className="mt-1 flex flex-col gap-1">
                {entries.map(({ item, index }) => (
                  <li
                    key={index}
                    className="flex items-baseline justify-between gap-3 font-['Noto_Sans_TC'] text-[14px] text-black-700"
                  >
                    <span>{item.label}</span>
                    {initial && (
                      <span className="shrink-0 text-status-alert">−{item.deduction_value}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <input
          type="text"
          value={title}
          onChange={(event) => setTitle(event.target.value)}
          placeholder="新版本標題"
          className="rounded-lg border border-black-200 px-3 py-1 text-[14px]"
        />
        <button
          type="button"
          onClick={() => setEditing(false)}
          className="font-['Noto_Sans_TC'] text-[14px] text-black-500 hover:cursor-pointer"
        >
          取消
        </button>
      </div>

      {initial && (
        <label className="mt-3 block font-['Noto_Sans_TC'] text-[13px] text-black-700">
          底分
          <input
            type="number"
            value={baseScore}
            onChange={(event) => setBaseScore(Number(event.target.value))}
            className="ml-2 w-[80px] rounded-lg border border-black-200 px-2 py-1 text-[14px]"
          />
        </label>
      )}

      <div className="mt-3 flex flex-col gap-2">
        {items.map((item, index) => (
          <div key={index} className="flex flex-wrap items-center gap-2">
            <input
              type="text"
              value={initial ? item.category ?? '' : item.section ?? ''}
              onChange={(event) =>
                update(index, initial ? { category: event.target.value } : { section: event.target.value })
              }
              placeholder={initial ? '分類' : '區塊'}
              className="w-[120px] rounded-lg border border-black-200 px-2 py-1 text-[14px]"
            />
            <input
              type="text"
              value={item.label}
              onChange={(event) => update(index, { label: event.target.value })}
              placeholder="項目說明"
              className="min-w-[220px] flex-1 rounded-lg border border-black-200 px-3 py-1 text-[14px]"
            />
            {initial && (
              <input
                type="number"
                step="0.5"
                value={item.deduction_value ?? 0}
                onChange={(event) => update(index, { deduction_value: Number(event.target.value) })}
                className="w-[80px] rounded-lg border border-black-200 px-2 py-1 text-[14px]"
              />
            )}
            <button
              type="button"
              onClick={() => setItems((prev) => prev.filter((_, i) => i !== index))}
              className="text-[13px] text-black-500 hover:text-status-alert hover:cursor-pointer"
            >
              移除
            </button>
          </div>
        ))}
      </div>

      <Button
        onClick={() =>
          setItems((prev) => [
            ...prev,
            { label: '', category: '', section: '', deduction_value: initial ? 1 : null, sort_order: prev.length },
          ])
        }
        className="mt-3 border border-primary-900 bg-white px-4 py-1 text-[14px] text-primary-900"
      >
        新增項目
      </Button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Checkbox checked={activate} onChange={setActivate} label="建立後立即啟用（之後鎖定的任務才會用到）" />
        <Button
          onClick={() =>
            void onCreateVersion({
              rubric_id: rubric.id,
              kind: rubric.kind,
              title,
              items: items
                .filter((item) => item.label.trim())
                .map((item, index) => ({ ...item, sort_order: index })),
              scoring: initial ? { base_score: baseScore } : null,
              activate,
            })
          }
          disabled={working || items.every((item) => !item.label.trim())}
          className="bg-primary-900 px-6 py-2 font-bold text-white"
        >
          {working ? '建立中…' : '建立新版本'}
        </Button>
      </div>
    </div>
  );
};
