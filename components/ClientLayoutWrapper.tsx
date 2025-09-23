'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter, usePathname } from 'next/navigation';
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import MaintenancePage from "@/components/MaintenancePage";
import { isMaintenanceMode } from '@/lib/maintenance';

interface ClientLayoutWrapperProps {
  children: React.ReactNode;
}

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

  // 正常模式，顯示完整應用
  return (
    <>
      <Navbar />
      {/* 背景容器 */}
      <main className="flex-1">
        {/* 置中內容容器 */}
        <div className="max-w-[1280px] mx-auto px-6">{children}</div>
      </main>
      <Footer />
    </>
  );
}