'use client'
import Image from "next/image"

import logo from '../public/logo.png';

export default function WelcomePage() {

  return (
      <main className="max-w-4xl mx-auto p-4">
        {/* 插入圖片 */}
        <div className="mb-4 flex justify-center">
          <Image src={logo} alt="教案檢索系統圖片" className="w-auto " />
        </div>
      </main>
  );
}