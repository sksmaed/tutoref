'use client';

import { useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTermContext } from '@/features/review-shared/useTermContext';
import { REVIEW_SECTIONS } from '@/features/review-shared/sections';

/**
 * 依 capability 導到該角色的預設頁（§7.1）。
 * 目標頁還沒實作（section.available === false）時留在這裡列出各區塊，不要把人丟進 404。
 */
export default function ReviewIndexPage() {
  const router = useRouter();
  const { context, loading } = useTermContext();

  const granted = useMemo(
    () => REVIEW_SECTIONS.filter((section) => context?.capabilities?.includes(section.capability)),
    [context]
  );
  const target = granted.find((section) => section.available);

  useEffect(() => {
    if (target) router.replace(target.href);
  }, [router, target]);

  if (loading || target) return null;

  return (
    <div className="mt-6 mb-16">
      {granted.length === 0 ? (
        <div className="rounded-lg bg-white px-6 py-10 text-center shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]">
          <p className="font-['Noto_Sans_TC'] text-[16px] text-black-900">
            這個帳號在本期沒有驗收相關的身分。
          </p>
          <p className="mt-2 font-['Noto_Sans_TC'] text-[14px] text-black-700">
            若你認為這是設定錯誤，請聯絡教案組。
          </p>
          <Link
            href="/announcement"
            className="mt-6 inline-block font-['Noto_Sans_TC'] text-[15px] text-primary-900 hover:opacity-80"
          >
            查看公告 →
          </Link>
        </div>
      ) : (
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
          <Link
            href="/announcement"
            className="mt-2 font-['Noto_Sans_TC'] text-[15px] text-primary-900 hover:opacity-80"
          >
            查看公告 →
          </Link>
        </div>
      )}
    </div>
  );
}
