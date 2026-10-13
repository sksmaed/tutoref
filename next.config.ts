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
    ];
  },
};

export default nextConfig;
