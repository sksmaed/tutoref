'use client';

function pad2(n: number) {
  return n.toString().padStart(2, '0');
}

/** 分頁按鈕（原樣保留） */
function PageBtn({ icon, disabled, onClick }: { icon: string; disabled?: boolean; onClick?: () => void; }) {
  return (
    <button type="button" disabled={disabled} onClick={onClick}
      className={`w-[32px] h-[36px] inline-flex items-center justify-center rounded-[4px] px-[10px] py-[4px] border border-black-200 bg-white ${disabled ? 'opacity-40 cursor-not-allowed' : 'hover:bg-black-100 hover:cursor-pointer'}`}>
      <img src={icon} alt="" width={20} height={20} />
    </button>
  );
}

interface ResultsPaginationProps {
  page: number;
  setPage: (updater: (p: number) => number) => void;
  setPageDirect: (page: number) => void;
  total: number;
  displayTotalPages: number;
}

/** 檢索結果分頁列（首頁／上一頁／頁碼／下一頁／末頁）。 */
export default function ResultsPagination({
  page,
  setPage,
  setPageDirect,
  total,
  displayTotalPages,
}: ResultsPaginationProps) {
  return (
    <div className="mt-6 w-[320px] h-[36px] mx-auto flex items-center justify-center gap-2">
      <PageBtn icon="/icons/angle-left-double.svg" disabled={page <= 1} onClick={() => setPageDirect(1)} />
      <PageBtn icon="/icons/angle-left.svg" disabled={page <= 1} onClick={() => setPage((p) => Math.max(1, p - 1))} />
      <div className="w-[160px] h-[24px] flex items-center justify-center gap-2 text-[16px] font-['Noto_Sans_TC']">
        第 {pad2(total === 0 ? 0 : page)} 頁，共 {pad2(displayTotalPages)} 頁
      </div>
      <PageBtn icon="/icons/angle-right.svg" disabled={page >= displayTotalPages} onClick={() => setPage((p) => Math.min(displayTotalPages, p + 1))} />
      <PageBtn icon="/icons/angle-right-double.svg" disabled={page >= displayTotalPages} onClick={() => setPageDirect(displayTotalPages)} />
    </div>
  );
}
