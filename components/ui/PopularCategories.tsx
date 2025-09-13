'use client';
import Image from 'next/image';
import React from 'react';

const COLORS = {
  nature:  "#728A47", // 自然 (Secondary/700)
  social:  "#F1994A", // 社會 (Primary/700)
  general: "#7F478A", // 綜合
  info:    "#6392B5", // 資訊
  art:     "#C85F5F", // 藝文
  chinese: "#C1B349", // 國語
  health:  "#3D9375", // 健教
  morning: "#C4789A", // 晨讀
  english: "#8E5C36", // 英文
  other:   "#0D0D0D", // 其他 (Black/900)
} as const;

/** 將你的 /public/icons 檔名對上來 */
const ICONS = {
  nature:  '/icons/lightening.png',
  social:  '/icons/people.png',
  general: '/icons/gift.png',
  info:    '/icons/globe.png',
  art:     '/icons/music.png',
  chinese: '/icons/edit.png',
  health:  '/icons/smile.png',
  morning: '/icons/book.png',
  english: '/icons/speak.png',
  other:   '/icons/more.png',
} as const;

type Key = keyof typeof COLORS;

type Item = {
  key: Key;
  label: string;
  count: number;
};

const items: Item[] = [
  { key: 'nature',  label: '自然', count: 112 },
  { key: 'social',  label: '社會', count: 93  },
  { key: 'general', label: '綜合', count: 78  },
  { key: 'info',    label: '資訊', count: 56  },
  { key: 'art',     label: '藝文', count: 40  },
  { key: 'chinese', label: '國語', count: 39  },
  { key: 'health',  label: '健教', count: 25  },
  { key: 'morning', label: '晨讀', count: 20  },
  { key: 'english', label: '英文', count: 18  },
  { key: 'other',   label: '其他', count: 15  },
];

function CategoryCard({ label, count, keyName }: { label: string; count: number; keyName: Key }) {
  const color = COLORS[keyName];
  const iconSrc = ICONS[keyName];

  return (
    <button
      type="button"
      className="
        w-[180px] h-[56px]
        flex items-center justify-between
        rounded-lg
        px-5 py-4
        bg-white
        shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]
        transition-transform
        hover:translate-y-[-1px]
        active:translate-y-0
      "
      aria-label={`${label} 類別，共 ${count} 筆`}
    >
      {/* 左：icon + 文案（Frame 1000004535：w-64 h-24 gap-12px） */}
      <span className="flex items-center gap-3 w-[64px] h-6">
        {/* 從 /public/icons 引圖；尺寸 20×20 */}
        <Image
          src={iconSrc}
          alt=""
          aria-hidden
          width={20}
          height={20}
          className="w-5 h-5"
          priority={false}
        />
        <span
          className="text-[16px] leading-[150%] font-normal font-['Noto_Sans_TC']"
          style={{ color }}
        >
          {label}
        </span>
      </span>

      {/* 右：數字（14px；Black/500） */}
      <span className="text-[14px] leading-[150%] font-normal text-black-500">
        {count}
      </span>
    </button>
  );
}

export default function PopularCategories() {
  return (
    <section className="w-[976px] mx-auto" aria-label="靈感與熱門課程">
      {/* (1) 需要來點靈感嗎？ 200×38；25px Bold；置中 */}
      <h2
        className="
          w-[200px] h-[38px]
          mx-auto text-center
          text-[25px] leading-[150%]
          font-bold font-['Noto_Sans_TC'] text-black
          mt-16
        "
      >
        需要來點靈感嗎？
      </h2>

      {/* (2) 熱門課程類別（左 152px 對齊；16px Bold） */}
      <div className="mt-10">
        <span className="inline-block w-[96px] h-6 text-[16px] leading-[150%] font-bold font-['Noto_Sans_TC'] text-black">
          熱門課程類別
        </span>
      </div>

      {/* (3) 容器：976×124；gap:19；兩排五張卡 */}
      <div className="grid grid-cols-5 gap-[19px] w-[976px] mt-4">
        {items.map((it) => (
          <CategoryCard key={it.key} label={it.label} count={it.count} keyName={it.key} />
        ))}
      </div>
    </section>
  );
}
