'use client';

import React, { useEffect, useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { LockBanner } from '@/features/review-shared/LockBanner';
import { BTN, BTN_PRIMARY } from '@/lib/button-styles';

interface FinalRevisionUploadModalProps {
  open: boolean;
  planName: string;
  working: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

/**
 * 上傳總驗修改版教案紙（v13 `openFinalRevisionUpload()`）。
 * prototype 回饋兩個人都卡在「Feedback 不是初驗的版本嗎？為什麼接到總驗版本」，
 * 所以 modal 裡要把這件事講清楚（§6.2）。
 */
export const FinalRevisionUploadModal: React.FC<FinalRevisionUploadModalProps> = ({
  open,
  planName,
  working,
  onClose,
  onUpload,
}) => {
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (open) setFile(null);
  }, [open]);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      busy={working}
      size="sm"
      title="上傳總驗修改版"
      subtitle={planName}
      footer={
        <>
          <button type="button" className={BTN} onClick={onClose} disabled={working}>
            取消
          </button>
          <button
            type="button"
            className={BTN_PRIMARY}
            onClick={() => file && void onUpload(file)}
            disabled={!file || working}
          >
            {working ? '上傳中…' : '上傳最新檔案'}
          </button>
        </>
      }
    >
      <label className="block">
        <span className="mb-[6px] block font-['Noto_Sans_TC'] text-[12px] font-bold text-black-700">
          教案紙（PDF，必填）
        </span>
        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="w-full font-['Noto_Sans_TC'] text-[14px]"
        />
      </label>
      <LockBanner
        className="mt-4"
        tone="active"
        title="此檔案將作為總驗版本"
        description="上傳後會覆蓋目前教案紙；初驗當下的版本已凍結成快照，不受影響。家長之後在「家內教案 → 總驗」送出時才會鎖定。"
      />
    </Dialog>
  );
};
