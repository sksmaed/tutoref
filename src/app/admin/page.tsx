'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { ADMIN_SECTIONS } from '@/features/review-shared/sections';

/**
 * 後台首頁。規格是導到 /admin/review（§3.2），
 * 但該頁要等 F4-1；在那之前先列出各區塊狀態，不要導進 404。
 */
export default function AdminIndexPage() {
  const router = useRouter();
  const { context, loading } = useTermContext();

  const granted = ADMIN_SECTIONS.filter((section) =>
    context?.capabilities?.includes(section.capability)
  );
  const target = granted.find((section) => section.available);

  useEffect(() => {
    if (target) router.replace(target.href);
  }, [router, target]);

  if (loading || target) return null;

  return (
    <div className="flex flex-col gap-3">
      {granted.map((section) => (
        <div
          key={section.key}
          className="rounded-lg bg-white px-5 py-4 shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="font-['Noto_Sans_TC'] text-[16px] font-bold text-black-900">
              {section.label}
            </p>
            <span className="font-['Noto_Sans_TC'] text-[14px] text-status-idle">尚未開放</span>
          </div>
          <p className="mt-1 font-['Noto_Sans_TC'] text-[14px] text-black-700">
            {section.description}
          </p>
        </div>
      ))}
    </div>
  );
}
