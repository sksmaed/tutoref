// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar/Navbar";
import Footer from "@/components/Footer/Footer";
import { AuthProvider } from "@/hooks/useAuth";

export const metadata: Metadata = {
  title: "Tutoref 教案檢索系統",
  description: "教案檢索 / 管理 / 資源 / 回報",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-black-100 flex flex-col">
        <AuthProvider>
          <Navbar />
          {/* 背景容器 */}
          <main className="flex-1">
            {/* 置中內容容器 */}
            <div className="max-w-[1280px] mx-auto px-6">{children}</div>
          </main>
          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
