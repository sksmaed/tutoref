'use client';

import { Toast } from '@/components/ui/toast';
import { useToast } from '@/hooks/use-toast';

/**
 * useToast() 是一個全域 store, 但在這之前沒有任何地方把它畫出來,
 * 所以 usePlanManagement / useUploadFlow 等處報的錯全部是靜音的
 * (例如刪除教案失敗時, 畫面看起來只是「卡住」)。
 * 這個元件掛在 root layout, 讓那些訊息真的看得到。
 */
export function Toaster() {
  const { toasts, dismiss } = useToast();

  return (
    <>
      {toasts.map(({ id, title, description, variant, open }) => (
        <Toast
          key={id}
          open={open !== false}
          type={variant === 'destructive' ? 'error' : 'success'}
          title={title ?? (variant === 'destructive' ? '操作失敗' : '完成')}
          message={description}
          onClose={() => dismiss(id)}
        />
      ))}
    </>
  );
}
