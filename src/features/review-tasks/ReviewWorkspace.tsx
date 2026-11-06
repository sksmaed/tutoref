'use client';

import React, { useState } from 'react';
import PreviewPDF from '@/features/teaching-plan/PdfPreview';
import { SegmentedTabs } from '@/components/ui/SegmentedTabs';
import type { ReviewWorkspace as Workspace } from '@/services/review';

type PreviewKind = 'sheet' | 'slide';

/** Drive 的 /view 連結不能直接內嵌，要換成 /preview。 */
export function driveEmbedUrl(url: string): string {
  if (!url) return '';
  return url.replace(/\/view(\?.*)?$/, '/preview');
}

interface ReviewWorkspaceProps {
  workspace: Workspace;
  /** 右側表單（初驗 / 總驗各自的實作）。 */
  children: React.ReactNode;
}

/**
 * 左預覽 / 右表單。獨立路由而不是 modal——驗收一份教案要 10–20 分鐘、
 * 要對照 PDF、可能中途離開，獨立頁面才能重整、貼連結、開新分頁對照（§6.3）。
 */
export const ReviewWorkspace: React.FC<ReviewWorkspaceProps> = ({ workspace, children }) => {
  const { snapshot } = workspace;
  const [kind, setKind] = useState<PreviewKind>(snapshot.sheet_present ? 'sheet' : 'slide');
  const [enlarged, setEnlarged] = useState(false);

  const url = kind === 'sheet' ? snapshot.sheet_drive_url : snapshot.slide_drive_url;
  const present = kind === 'sheet' ? snapshot.sheet_present : snapshot.slide_present;


  return (
    <div className="mt-4 flex flex-col gap-6 lg:flex-row">
      <div className="lg:sticky lg:top-5 lg:h-[calc(100vh-2.5rem)] lg:w-[52%]">
        <div className="flex items-center gap-2">
          <SegmentedTabs
            variant="soft"
            tabs={[
              { key: 'sheet' as PreviewKind, label: '教案紙' },
              { key: 'slide' as PreviewKind, label: '投影片' },
            ]}
            active={kind}
            onChange={setKind}
          />
          {present && (
            <>
              <button
                type="button"
                onClick={() => setEnlarged(true)}
                className="ml-auto cursor-pointer font-['Noto_Sans_TC'] text-[13px] font-bold text-primary-900 hover:opacity-80"
              >
                放大
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-['Noto_Sans_TC'] text-[13px] font-bold text-primary-900 hover:opacity-80"
              >
                新分頁開啟
              </a>
            </>
          )}
        </div>

        <div className="mt-2 h-[60vh] overflow-hidden rounded-[14px] border border-black-200 bg-black-100 lg:h-[calc(100%-3rem)]">
          {present ? (
            <iframe
              src={driveEmbedUrl(url)}
              title={kind === 'sheet' ? '教案紙預覽' : '投影片預覽'}
              className="h-full w-full"
            />
          ) : (
            <div className="flex h-full items-center justify-center px-6 text-center">
              <p className="font-['Noto_Sans_TC'] text-[15px] text-black-500">
                這份教案沒有{kind === 'sheet' ? '教案紙' : '投影片'}。
                <br />
                缺附件本身也是驗收要記的事，可在對應項目勾選並說明。
              </p>
            </div>
          )}
        </div>
      </div>

      <div className="min-w-0 lg:w-[48%]">{children}</div>

      <PreviewPDF isOpen={enlarged} fileUrl={present ? driveEmbedUrl(url) : null} onClose={() => setEnlarged(false)} />
    </div>
  );
};
