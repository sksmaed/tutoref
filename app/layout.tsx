// app/layout.tsx
import type { Metadata } from "next";
import { Suspense } from "react";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";
import { Analytics } from "@vercel/analytics/next"

export const metadata: Metadata = {
  title: "Tutoref 教案檢索系統",
  description: "教案檢索 / 管理 / 學習資源",
  keywords: "tutoref, 教案, 檢索, 管理, 台大山服",
  authors: [{ name: "Tutoref 團隊" }],
  creator: "Tutoref",
  publisher: "Tutoref",
  robots: "index, follow",
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: "https://www.tutoref.tw",
    title: "Tutoref 教案檢索系統",
    description: "教案檢索 / 管理 / 學習資源",
    siteName: "Tutoref",
  },
  icons: {
    icon: "/favicon.ico",
  },
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
