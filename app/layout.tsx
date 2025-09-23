// app/layout.tsx
import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/hooks/useAuth";
import ClientLayoutWrapper from "@/components/ClientLayoutWrapper";

export const metadata: Metadata = {
  title: "Tutoref 教案檢索系統",
  description: "教案檢索 / 管理 / 資源 / 回報",
};
export default function RootLayout({ children }: { children }) {
  return (
    <html lang="zh-Hant">
      <body className="min-h-screen bg-black-100 flex flex-col">
        <AuthProvider children={undefined}>
          <ClientLayoutWrapper children={children} />
        </AuthProvider>
      </body>
    </html>
  );
}
