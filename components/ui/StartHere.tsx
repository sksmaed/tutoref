'use client';
import Image from 'next/image';

type Item = {
  id: 'good' | 'most' | 'latest';
  label: string;
  count: number;
  icon: string; // /public/icons 下的檔名
};

// 你可以把數字改成實際值
const items: Item[] = [
  { id: 'good',   label: '優良教案', count: 112, icon: '/icons/good.png'   },
  { id: 'most',   label: '最多人參考', count: 93, icon: '/icons/eye-open.png'    },
  { id: 'latest', label: '最新上傳',   count: 78, icon: '/icons/time.png'  },
];

type CardProps = Omit<Item, 'id'>; // 子元件不需要 id

function StartHereCard({ label, count, icon }: CardProps) {
  return (
    <button
      type="button"
      className="
        h-[56px]
        flex items-center justify-between
        rounded-lg
        px-5 py-4
        bg-white
        shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]
        hover:translate-y-[-1px] active:translate-y-0 transition-transform
      "
      aria-label={`${label}，共 ${count} 筆`}
    >
      {/* 左側群組：icon + 文字（Frame 1000004535: w-112 h-24 gap-12px） */}
      <span className="flex items-center gap-3 w-[112px] h-6">
        <Image
          src={icon}
          alt=""
          aria-hidden
          width={20}
          height={20}
          className="w-5 h-5"
        />
        <span
          className="
            text-[16px] leading-[150%]
            font-normal font-['Noto_Sans_TC']
            text-black-900
          "
        >
          {label}
        </span>
      </span>

      {/* 右側數字：14px / Black/500 */}
      <span className="text-[14px] leading-[150%] font-normal text-black-500">
        {count}
      </span>
    </button>
  );
}

export default function StartHere() {
  return (
    <section className="w-[976px] mx-auto" aria-label="或是從這裡下手">
      {/* (1) Text：或是從這裡下手... 128×24 / 16px Bold */}
      <div className="mt-10 ">
        <span
          className="
            inline-block w-[128px] h-6
            text-[16px] leading-[150%]
            font-bold font-['Noto_Sans_TC'] text-black
          "
        >
          或是從這裡下手...
        </span>
      </div>

      {/* (2) 容器：976×56 / gap:19px；三欄平均寬 = (976 - 2*19)/3 = 312.666... */}
        <div className="grid grid-cols-3 gap-[19px] w-[976px] mt-4 mb-10">
        {items.map(({ id, ...rest }) => (
            <StartHereCard key={id} {...rest} /> 
        ))}
        </div>
    </section>
  );
}
