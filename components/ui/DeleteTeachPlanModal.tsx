'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/Button';

interface DeleteTeachPlanModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  planTitle?: string;
  confirming?: boolean;
}

export function DeleteTeachPlanModal({
  open,
  onClose,
  onConfirm,
  planTitle,
  confirming = false,
}: DeleteTeachPlanModalProps) {
  if (!open) return null;

  const message = planTitle ? `你確定要刪除「${planTitle}」嗎？` : '你確定要刪除此教案嗎？';

  const handleClose = () => {
    if (confirming) return;
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0d0d0db2]">
      <div
        className="relative flex w-[420px] flex-col items-center rounded-[8px] bg-white px-[60px] pt-[40px] pb-[32px] shadow-lg"
      >
        <button
          type="button"
          onClick={handleClose}
          aria-label="關閉"
          className="absolute right-[16px] top-[16px]"
          disabled={confirming}
        >
          <Image src="/icons/close.png" alt="close" width={20} height={20} />
        </button>

        <p className="text-center text-[16px] leading-[150%] text-black-900">
          {message}
          <br />刪除後無法復原。
        </p>

        <div className="mt-[28px] flex h-[48px] w-[252px] items-center justify-center gap-3">
          <Button
            type="button"
            className="h-[48px] w-[120px] rounded-[8px] border border-primary-900 bg-white px-[20px] py-[12px] text-[16px] text-primary-900"
            onClick={() => {
              if (confirming) return;
              onConfirm();
            }}
            disabled={confirming}
          >
            {confirming ? '刪除中...' : '刪除'}
          </Button>
          <Button
            type="button"
            className="h-[48px] w-[120px] rounded-[8px] border border-primary-900 px-[40px] py-[12px] text-[16px] bg-primary-900 text-white"
            onClick={handleClose}
            disabled={confirming}
          >
            取消
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DeleteTeachPlanModal;
