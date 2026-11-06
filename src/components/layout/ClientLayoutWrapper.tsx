'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import AppShell from "@/components/layout/AppShell";
import Footer from "@/components/layout/Footer";
import MaintenancePage from "@/components/layout/MaintenancePage";
import { isMaintenanceMode } from '@/lib/maintenance';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

/** 登入相關頁面不顯示側欄，維持置中的單欄版面。 */
const BARE_PREFIXES = ['/login', '/admin-login', '/forgot-password', '/reset-password'];

export default function ClientLayoutWrapper({ children }: ClientLayoutWrapperProps) {
  const [isMaintenance, setIsMaintenance] = useState(false);
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // 檢查維護模式
    const maintenanceMode = isMaintenanceMode(searchParams);
    setIsMaintenance(maintenanceMode);

    // 如果是維護模式且不在根路徑，重定向到根路徑
    if (maintenanceMode && pathname !== '/') {
      const currentParams = searchParams?.toString();
      const redirectUrl = currentParams ? `/?${currentParams}` : '/';
      router.replace(redirectUrl);
    }
  }, [searchParams, pathname, router]);

  // 如果是維護模式，顯示維護頁面
  if (isMaintenance) {
    return <MaintenancePage />;
  }

  const bare = BARE_PREFIXES.some((prefix) => pathname?.startsWith(prefix));
  if (bare) {
    return (
      <>
        <header className="flex h-[60px] items-center px-6 lg:px-[52px]">
          <Link href="/" className="inline-flex items-center">
            <Image src="/logo.png" alt="Tutoref 教案檢索系統" width={100} height={40} priority />
          </Link>
        </header>
        <main className="flex-1">
          <div className="max-w-[1280px] mx-auto px-6">{children}</div>
        </main>
        <Footer />
      </>
    );
  }

  return <AppShell>{children}</AppShell>;
}
