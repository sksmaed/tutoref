'use client';
import { useEffect, useState } from 'react';
import { popFlash, Flash } from '@/utils/flash';
import { Toast } from '@/components/ui/toast';

export default function Home() {
  const [toast, setToast] = useState<Flash | null>(null);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const f = popFlash();
    if (f) {
      setToast(f);
      setOpen(true);
    }
  }, []);

  return (
    <div>
      {/* 你的首頁內容 ... */}
      <main className="...">教案檢索 ...</main>

      <Toast
        open={open && !!toast}
        type={toast?.type}
        title={toast?.title ?? ''}
        message={toast?.message}
        timeout={toast?.timeout ?? 5000}
        onClose={() => setOpen(false)}
      />
    </div>
  );
}
