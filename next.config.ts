import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  experimental: {
    serverActions: {
      bodySizeLimit: '600mb',
    },
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  async redirects() {
    return [
      // 教案管理總覽拆成側欄的「已上傳教案」「已收藏教案」
      { source: '/manage', destination: '/plans/mine', permanent: false },
      // 公告撰寫器併入訊息公告頁
      { source: '/admin/announcements', destination: '/announcement', permanent: false },
    ];
  },
};

export default nextConfig;
