'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';

interface FinalRevisionUploadModalProps {
  open: boolean;
  planName: string;
  working: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

/**
 * 上傳總驗修改版教案紙。入口同時放在初驗與總驗兩個 tab——
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

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-1000">
      <div
        className="absolute inset-0"
        style={{ backgroundColor: '#0D0D0DB2' }}
        onClick={working ? undefined : onClose}
        aria-hidden
      />
      <div
        className="absolute left-1/2 top-1/2 w-[min(480px,92vw)] -translate-x-1/2 -translate-y-1/2 rounded-[8px] bg-white px-8 py-6 shadow-xl"
        role="dialog"
        aria-modal="true"
      >
        <h3 className="text-center font-['Noto_Sans_TC'] text-[18px] font-medium text-black-900">
          上傳總驗修改版
        </h3>
        <p className="mt-2 font-['Noto_Sans_TC'] text-[14px] text-black-900">{planName}</p>
        <p className="mt-2 font-['Noto_Sans_TC'] text-[13px] leading-[150%] text-black-700">
          此檔案將作為<span className="text-black-900">總驗版本</span>，家長送出總驗後才鎖定。
          初驗當下的版本已經凍結成快照，不會被這次上傳覆蓋。
        </p>

        <input
          type="file"
          accept="application/pdf"
          onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          className="mt-4 w-full font-['Noto_Sans_TC'] text-[14px]"
        />

        <div className="mt-5 flex justify-center gap-[10px]">
          <Button
            onClick={working ? undefined : onClose}
            disabled={working}
            className="w-[110px] rounded-lg border border-primary-900 bg-white py-2 text-primary-900"
          >
            取消
          </Button>
          <Button
            onClick={file && !working ? () => void onUpload(file) : undefined}
            disabled={!file || working}
            className="w-[130px] rounded-lg bg-primary-900 py-2 font-bold text-white"
          >
            {working ? '上傳中…' : '上傳'}
          </Button>
        </div>
      </div>
    </div>
  );
};
