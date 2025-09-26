// app/layout.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";

export const metadata: Metadata = {
  title: "Tutoref 教案檢索系統",
  description: "教案檢索 / 管理 / 資源 / 回報",
};

function LoadingFallback() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
    </div>
  );
}

export default function RootLayout({ children }: { children }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-black-100 flex flex-col">
        <AuthProvider>
          <Suspense fallback={<LoadingFallback />}>
            <ClientLayoutWrapper children={children} />
          </Suspense>
        </AuthProvider>
      </body>
    </html>
  );
}
