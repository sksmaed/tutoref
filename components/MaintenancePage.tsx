'use client';

import Image from 'next/image';

export default function MaintenancePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-primary-100 flex items-center justify-center px-4">
      <div className="max-w-2xl w-full text-center">
        {/* 主要標題 */}
        <h1 className="text-4xl font-bold text-gray-800 mb-4 font-['Noto_Sans_TC']">
          系統維護中
        </h1>

        {/* 副標題 */}
        <h2 className="text-2xl text-gray-600 mb-6 font-['Noto_Sans_TC']">
          改版測試進行中
        </h2>

        {/* 說明文字 */}
        <div className="bg-white/80 backdrop-blur-sm rounded-lg p-10 shadow-lg mb-8">
          <p className="text-gray-700 text-xl leading-relaxed mb-4 font-['Noto_Sans_TC']">
            為了提供更好的使用體驗，我們正在進行系統改版測試。
          </p>
          <p className="text-gray-700 text-xl leading-relaxed mb-4 font-['Noto_Sans_TC']">
            系統暫時關閉，造成不便敬請見諒。
          </p>
          <p className="text-primary-600 text-xl font-medium font-['Noto_Sans_TC']">
            敬請期待全新的教案檢索系統！
          </p>
        </div>

        {/* 裝飾性圖示 */}
        <div className="flex justify-center space-x-4 opacity-60">
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse"></div>
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0.2s' }}></div>
          <div className="w-2 h-2 bg-primary-400 rounded-full animate-pulse" style={{ animationDelay: '0.4s' }}></div>
        </div>

        {/* 預計完成時間 (可選) */}
        <div className="mt-8 text-lg text-gray-500 font-['Noto_Sans_TC']">
          預計開放時間：9/27（六）
        </div>
      </div>
    </div>
  );
}