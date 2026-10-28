'use client';

import type { TermOut } from '@/features/review-shared/types';
import type { UploadMode } from './types';

interface UploadModeModalProps {
  open: boolean;
  currentTerm: TermOut | null;
  loadingCurrentTerm: boolean;
  currentTermError: string | null;
  onSelect: (mode: UploadMode) => void;
  onCancel: () => void;
}

export function UploadModeModal({
  open,
  currentTerm,
  loadingCurrentTerm,
  currentTermError,
  onSelect,
  onCancel,
}: UploadModeModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-[#0D0D0DB2]" aria-hidden />
      <div
        className="relative w-full max-w-[620px] rounded-xl bg-white px-6 py-8 shadow-xl sm:px-10"
        role="dialog"
        aria-modal="true"
        aria-labelledby="upload-mode-title"
      >
        <button
          type="button"
          onClick={onCancel}
          aria-label="取消上傳"
          className="absolute right-4 top-3 text-xl text-black-400 hover:text-black-900"
        >
          ✕
        </button>

        <h2 id="upload-mode-title" className="text-center text-2xl font-bold text-black-900">
          這次要上傳哪一類教案？
        </h2>
        <p className="mt-2 text-center text-sm leading-6 text-black-700">
          上傳方式會決定教案何時公開，以及是否立即建立搜尋索引。
        </p>

        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          <button
            type="button"
            disabled={loadingCurrentTerm || !currentTerm}
            onClick={() => onSelect('current')}
            className="rounded-xl border-2 border-primary-900 bg-primary-100 p-5 text-left transition hover:opacity-90 disabled:cursor-not-allowed disabled:border-black-200 disabled:bg-black-100 disabled:opacity-60"
          >
            <span className="block text-lg font-bold text-primary-900">
              上傳本期教案{currentTerm ? `（${currentTerm.label}）` : ''}
            </span>
            <span className="mt-2 block text-sm leading-6 text-black-700">
              先存入教案管理與驗收流程；總驗通過並公告後，才會公開並建立 Elasticsearch 索引。
            </span>
          </button>

          <button
            type="button"
            onClick={() => onSelect('archive')}
            className="rounded-xl border-2 border-secondary-700 bg-secondary-100 p-5 text-left transition hover:opacity-90"
          >
            <span className="block text-lg font-bold text-secondary-700">歸檔過去教案</span>
            <span className="mt-2 block text-sm leading-6 text-black-700">
              適用於非本期的歷屆教案；完成上傳後立即公開，並排入 Elasticsearch 建索引。
            </span>
          </button>
        </div>

        {!loadingCurrentTerm && !currentTerm && (
          <p className="mt-4 text-center text-sm text-red-600">
            {currentTermError || '目前找不到當期期別，暫時只能歸檔過去教案。'}
          </p>
        )}
      </div>
    </div>
  );
}
