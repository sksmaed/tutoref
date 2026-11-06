'use client';

import React, { useMemo, useState } from 'react';
import { Checkbox } from '@/components/ui/Checkbox';
import { Card, CardHeader } from '@/components/ui/Card';
import { StatusChip } from '@/features/review-shared/StatusChip';
import { BTN, BTN_PRIMARY } from '@/lib/button-styles';
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
    const scoring = snapshot?.scoring;
    const formula = grouped
      .map(([group, entries]) => {
        const values = new Set(entries.map(({ item }) => item.deduction_value));
        return values.size === 1 ? `（${group}未達標數 × ${[...values][0]}）` : `（${group}各項扣分）`;
      })
      .join(' − ');

    return (
      <div className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">
            {rubric.name}
            {version && <span className="ml-2 text-[13px] font-normal text-black-500">v{version.version}・{version.title}</span>}
          </p>
          <button type="button" onClick={startEditing} className={BTN}>
            以此版本建立新版
          </button>
        </div>

        {initial && scoring && (
          <Card>
            <CardHeader title="計分公式" />
            <p className="rounded-[11px] border border-black-200 bg-black-100/40 px-[14px] py-3 font-mono text-[12px] leading-[170%] text-black-700">
              加權分數 = {scoring.base_score}
              {formula ? ` − ${formula}` : ''}
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2 lg:grid-cols-4">
              {[
                { range: `> ${scoring.potential_excellent_threshold}`, text: '通過，且有成為潛力優良教案的可能' },
                { range: `${scoring.pass_min_score}–${scoring.potential_excellent_threshold}`, text: `通過（含 ${scoring.pass_min_score}）` },
                { range: `${scoring.discussion_min_score}–未滿 ${scoring.pass_min_score}`, text: '有疑慮，由教案組內部討論' },
                { range: `< ${scoring.discussion_min_score}`, text: '不通過' },
              ].map((item) => (
                <div key={item.range} className="rounded-[10px] border border-black-200 bg-white p-[10px] font-['Noto_Sans_TC']">
                  <p className="text-[14px] font-bold text-black-900">{item.range}</p>
                  <p className="text-[12px] text-black-500">{item.text}</p>
                </div>
              ))}
            </div>
          </Card>
        )}
        {!initial && (
          <Card>
            <CardHeader
              title="總驗判定方式"
              description="教案紙與投影片分開判斷「通過／未通過」，未通過時需填寫理由。以下檢核項目是驗收者對照用的清單。"
            />
          </Card>
        )}

        {grouped.map(([group, entries], groupIndex) => {
          const values = new Set(entries.map(({ item }) => item.deduction_value));
          const uniform = initial && values.size === 1 ? [...values][0] : null;
          return (
            <div key={group} className="overflow-hidden rounded-xl border border-black-200 bg-white">
              <div className="flex items-start justify-between gap-3 bg-black-100/60 px-4 py-[14px]">
                <p className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">
                  {groupIndex + 1}. {group}
                </p>
                {uniform != null && <StatusChip status={`未達標每項 −${uniform} 分`} tone="active" />}
              </div>
              <ul className="px-4 pb-3 pt-[6px]">
                {entries.map(({ item, index }) => (
                  <li
                    key={index}
                    className="flex items-baseline gap-2 border-b border-black-100 py-2 font-['Noto_Sans_TC'] text-[14px] text-black-900 last:border-b-0"
                  >
                    <span className="text-primary-900">✓</span>
                    <span className="flex-1">{item.label}</span>
                    {initial && uniform == null && (
                      <span className="shrink-0 text-[12px] text-status-alert">−{item.deduction_value}</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
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
          className="rounded-[10px] border border-black-200 px-3 py-1 text-[14px]"
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
            className="ml-2 w-[80px] rounded-[10px] border border-black-200 px-2 py-1 text-[14px]"
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
              className="w-[120px] rounded-[10px] border border-black-200 px-2 py-1 text-[14px]"
            />
            <input
              type="text"
              value={item.label}
              onChange={(event) => update(index, { label: event.target.value })}
              placeholder="項目說明"
              className="min-w-[220px] flex-1 rounded-[10px] border border-black-200 px-3 py-1 text-[14px]"
            />
            {initial && (
              <input
                type="number"
                step="0.5"
                value={item.deduction_value ?? 0}
                onChange={(event) => update(index, { deduction_value: Number(event.target.value) })}
                className="w-[80px] rounded-[10px] border border-black-200 px-2 py-1 text-[14px]"
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

      <button
        type="button"
        className={`${BTN} mt-3`}
        onClick={() =>
          setItems((prev) => [
            ...prev,
            { label: '', category: '', section: '', deduction_value: initial ? 1 : null, sort_order: prev.length },
          ])
        }
      >
        ＋ 新增項目
      </button>

      <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
        <Checkbox checked={activate} onChange={setActivate} label="建立後立即啟用（之後鎖定的任務才會用到）" />
        <button
          type="button"
          className={BTN_PRIMARY}
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
        >
          {working ? '建立中…' : '建立新版本'}
        </button>
      </div>
    </div>
  );
};
