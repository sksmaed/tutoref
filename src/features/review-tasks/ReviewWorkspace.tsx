'use client';

import React, { useState } from 'react';
import PreviewPDF from '@/features/teaching-plan/PdfPreview';
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

  const tabClass = (active: boolean) =>
    `rounded-lg px-3 py-1 font-['Noto_Sans_TC'] text-[14px] ${
      active ? 'bg-primary-900 text-white' : 'bg-white text-black-700 hover:bg-primary-100'
    }`;

  return (
    <div className="mt-4 flex flex-col gap-6 lg:flex-row">
      <div className="lg:sticky lg:top-4 lg:h-[calc(100vh-6rem)] lg:w-1/2">
        <div className="flex items-center gap-2">
          <button type="button" className={tabClass(kind === 'sheet')} onClick={() => setKind('sheet')}>
            教案紙
          </button>
          <button type="button" className={tabClass(kind === 'slide')} onClick={() => setKind('slide')}>
            投影片
          </button>
          {present && (
            <>
              <button
                type="button"
                onClick={() => setEnlarged(true)}
                className="ml-auto font-['Noto_Sans_TC'] text-[14px] text-primary-900 hover:opacity-80"
              >
                放大
              </button>
              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="font-['Noto_Sans_TC'] text-[14px] text-primary-900 hover:opacity-80"
              >
                新分頁開啟
              </a>
            </>
          )}
        </div>

        <div className="mt-2 h-[60vh] overflow-hidden rounded-lg bg-white shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] lg:h-[calc(100%-2.5rem)]">
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

      <div className="min-w-0 lg:w-1/2">{children}</div>

      <PreviewPDF isOpen={enlarged} fileUrl={present ? driveEmbedUrl(url) : null} onClose={() => setEnlarged(false)} />
    </div>
  );
};
