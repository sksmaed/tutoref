'use client';

import { useCallback, useEffect, useState } from 'react';
import { Toast } from '@/components/ui/toast';
import { Tab } from '@/components/ui/Tab';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { RubricEditor } from '@/features/admin/rubric/RubricEditor';
import { createRubricVersion, fetchRubrics, type RubricRow } from '@/services/review';

type Kind = 'initial' | 'final';

const KIND_TABS = [
  { key: 'initial' as Kind, label: '初驗標準' },
  { key: 'final' as Kind, label: '總驗標準' },
];

export default function AdminRubricPage() {
  const { context } = useTermContext();
  const termId = context?.current_term?.id ?? null;

  const [rubrics, setRubrics] = useState<RubricRow[]>([]);
  const [kind, setKind] = useState<Kind>('initial');
  const [loading, setLoading] = useState(true);
  const [working, setWorking] = useState(false);
  const [notice, setNotice] = useState<{ type: 'success' | 'error'; title: string; message?: string } | null>(
    null
  );

  const reload = useCallback(async () => {
    if (!termId) return;
    setLoading(true);
    try {
      setRubrics(await fetchRubrics(termId));
    } catch (err) {
      setNotice({
        type: 'error',
        title: '無法取得驗收標準',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    } finally {
      setLoading(false);
    }
  }, [termId]);

  useEffect(() => {
    void reload();
  }, [reload]);

  const canEdit = !!context?.policy?.leader_can_edit_rubric || !!context?.capabilities?.includes('rubric.manage');
  const current = rubrics.find((rubric) => rubric.kind === kind) ?? null;
  const activeVersion =
    current?.versions.find((version) => version.status === 'active') ?? current?.versions[0] ?? null;

  const handleCreate = async (payload: Parameters<typeof createRubricVersion>[0]) => {
    setWorking(true);
    try {
      await createRubricVersion(payload);
      await reload();
      setNotice({
        type: 'success',
        title: '已建立新版本',
        message: '已在跑的驗收仍使用它們鎖定當下的版本。',
      });
    } catch (err) {
      setNotice({
        type: 'error',
        title: '建立失敗',
        message: err instanceof Error ? err.message : '請稍後再試。',
      });
    } finally {
      setWorking(false);
    }
  };

  return (
    <div>
      <h2 className="font-['Noto_Sans_TC'] text-[18px] font-bold text-black-900">驗收標準</h2>
      <p className="mt-1 font-['Noto_Sans_TC'] text-[13px] text-black-700">
        標準是版本化的，任務在發布時鎖定當下的版本；改標準一律開新版本，不會影響正在跑的驗收。
      </p>

      <div className="mt-4">
        <Tab tabs={KIND_TABS} active={kind} onChange={setKind} />
      </div>

      {loading ? (
        <div className="flex min-h-[30vh] items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-primary-900" />
        </div>
      ) : !current ? (
        <div className="mt-6 rounded-lg bg-white px-6 py-10 text-center shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <p className="font-['Noto_Sans_TC'] text-[15px] text-black-700">
            本期還沒有{kind === 'initial' ? '初驗' : '總驗'}標準。
          </p>
        </div>
      ) : (
        <div className="mt-4 rounded-lg bg-white px-5 py-4 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          {canEdit ? (
            <RubricEditor
              rubric={current}
              version={activeVersion}
              working={working}
              onCreateVersion={handleCreate}
            />
          ) : (
            <p className="font-['Noto_Sans_TC'] text-[14px] text-black-700">
              本期未開放組長編輯驗收標準，以下為唯讀內容。
            </p>
          )}
        </div>
      )}

      {current && current.versions.length > 1 && (
        <div className="mt-4 rounded-lg bg-white px-5 py-4 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <p className="font-['Noto_Sans_TC'] text-[15px] font-bold text-black-900">版本紀錄</p>
          <ul className="mt-2 flex flex-col gap-1">
            {current.versions.map((version) => (
              <li
                key={version.id}
                className="flex items-baseline justify-between gap-3 font-['Noto_Sans_TC'] text-[14px] text-black-700"
              >
                <span>
                  v{version.version}・{version.title}
                </span>
                <span className="shrink-0 text-[13px] text-black-500">{version.status}</span>
              </li>
            ))}
          </ul>
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
