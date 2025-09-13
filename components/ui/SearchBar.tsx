// 'use client';
// import { Search } from 'lucide-react';

// export default function SearchBar() {
//   return (
//     <div
//       className="
//         w-[976px] h-[62px]
//         flex items-center justify-between
//         rounded-lg
//         pl-6 pr-5 py-4
//         bg-white
//         shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]
//         mt-20
//       "
//       style={{ marginLeft: '152px' }} //已調整
//       role="search"
//       aria-label="教案檢索"
//     >
//       <input
//         type="text"
//         placeholder="輸入教案關鍵字/撰寫者姓名"
//         className="
//           w-[257px] h-[30px]
//           text-[20px] leading-[150%]
//           font-medium font-['Noto_Sans_TC']
//           text-gray-500
//           placeholder:text-gray-500
//           focus:outline-none
//         "
//         aria-label="輸入教案關鍵字或撰寫者姓名"
//       />
//       <Search className="w-6 h-6 text-gray-700" aria-hidden />
//     </div>
//   );
// }

'use client';
import { Search } from 'lucide-react';

type Props = {
  query: string;
  onQueryChange: (v: string) => void;
  canSearch: boolean;      // ← 只要輸入框有值 或 有任一篩選，就 true
  onSearch: () => void;
};

export default function SearchBar({ query, onQueryChange, canSearch, onSearch }: Props) {
  return (
    <div className="flex justify-center items-center gap-3 mx-auto mt-4 w-full" aria-label="搜尋篩選列">
      <div
        className="
          w-[976px] h-[62px] mt-20
          flex items-center justify-center
          rounded-lg px-6 pr-5 py-4 bg-white
        shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]
      "
      role="search"
      aria-label="教案檢索"
      >
        <input
          value={query}
          onChange={(e) => onQueryChange(e.target.value)}
          type="text"
          placeholder="輸入教案關鍵字 / 撰寫者姓名"
          className="
            w-[257px] h-[30px]
            text-[20px] leading-[150%] font-medium font-['Noto_Sans_TC']
            text-gray-500 focus:outline-none
            flex-1 mr-3
          "
        />

        <button
          type="button"
          onClick={() => canSearch && onSearch()}
          className={`
            w-6 h-6 inline-flex items-center justify-center
            ${canSearch ? 'text-primary-900 cursor-pointer' : 'text-black-300 cursor-default pointer-events-none'}
          `}
          aria-label="搜尋"
        >
          <Search className="w-6 h-6" aria-hidden />
        </button>
      </div>
    </div>
  );
}
