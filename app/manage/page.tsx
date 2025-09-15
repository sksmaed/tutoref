'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';

type Row = {
  id: string;
  family: string;
  issue: string;
  category: string;
  title: string;
  author: string;
  liked?: boolean;
};

// === Demo：接後端時替換 ===
const demoRows: Row[] = Array.from({ length: 10 }, (_, i) => ({
  id: `r-${i}`,
  family: '霧鹿',
  issue: '25冬',
  category: '社會',
  title: '「危」「食」已晚，認識危害農業的災害',
  author: '林庭宇、林庭宇',
  liked: i % 3 === 0,
}));

export default function TeachPlanManagePage() {
  const router = useRouter();

  // === 你可改成空陣列來驗證無資料狀態 ===
  const myPlansAll: Row[] = demoRows;            // ← 無資料時改成 []
  const myLikesAll: Row[] = demoRows.slice().reverse(); // ← 無資料時改成 []

  const hasPlans = myPlansAll.length > 0;
  const hasLikes = myLikesAll.length > 0;

  // 只顯示 5 筆
  const myPlans = useMemo(() => myPlansAll.slice(0, 5), [myPlansAll]);
  const myLikes = useMemo(() => myLikesAll.slice(0, 5), [myLikesAll]);

  const [likes, setLikes] = useState<Record<string, boolean>>(
    Object.fromEntries(myLikes.map((r) => [r.id, !!r.liked]))
  );
  const toggleLike = (id: string) =>
    setLikes((prev) => ({ ...prev, [id]: !prev[id] }));

  // 按鈕樣式（啟用/禁用）
  const viewAllBtnClass = (disabled: boolean) =>
    [
      'w-[160px] h-[48px] rounded-[8px] px-[47px] py-[12px] text-[16px] leading-[150%] font-["Noto_Sans_TC"] shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]',
      disabled
        ? 'bg-white border border-black-300 text-black-300 cursor-not-allowed'
        : 'bg-white border border-primary-900 text-primary-900',
    ].join(' ');

  return (
    <main className="min-h-screen bg-black-50">
      <section className="mx-auto mt-16 w-[976px]">
        <h1 className="text-center text-[40px] font-bold font-['Noto_Sans_TC'] text-black-900">
          教案管理
        </h1>

        {/* ===== 我的教案 ===== */}
        <SectionHeader title="我的教案" total={myPlansAll.length} />

        <TableShell>
          <TableHeader cols={['家別', '期數', '類別', '教案名稱', '撰寫者', '編輯', '刪除']} />

          {hasPlans ? (
            <div className="border-x border-b border-black-200 rounded-b-lg divide-y">
              {myPlans.map((r) => (
                <div key={r.id} className="flex h-[48px] items-center text-[14px]">
                  <BodyCell w="92">{r.family}</BodyCell>
                  <BodyCell w="92">{r.issue}</BodyCell>
                  <BodyCell w="92">{r.category}</BodyCell>
                  <BodyCell w="352">
                    <span className="truncate">{r.title}</span>
                  </BodyCell>
                  <BodyCell w="164">{r.author}</BodyCell>
                  <BodyCell w="92" center>
                    <button type="button" aria-label="編輯">
                      <Image src="/icons/edit.png" alt="" width={20} height={20} />
                    </button>
                  </BodyCell>
                  <BodyCell w="92" center>
                    <button type="button" aria-label="刪除">
                      <Image src="/icons/trash.png" alt="" width={20} height={20} />
                    </button>
                  </BodyCell>
                </div>
              ))}
            </div>
          ) : (
            // 無資料提示（我的教案）
            <EmptyRow>
              你還沒上傳任何教案唷，快點擊下方按鈕上傳第一份教案吧！
            </EmptyRow>
          )}
        </TableShell>

        {/* —— 按鈕列（置中、兩顆） —— */}
        <div className="mt-6 flex w-full items-center justify-center gap-[24px]">
          {/* 查看全部（無資料時禁用） */}
          <button
            type="button"
            disabled={!hasPlans}
            onClick={() => hasPlans && router.push('/plans/mine')}
            className={viewAllBtnClass(!hasPlans)}
          >
            查看全部
          </button>

          {/* 上傳教案：永遠可點（引導上傳） */}
          <button
            type="button"
            onClick={() => router.push('/upload')}
            className="
              w-[160px] h-[48px] rounded-[8px] bg-primary-900
              px-[47px] py-[12px]
              text-[16px] leading-[150%] font-['Noto_Sans_TC'] font-bold text-white
              shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)]
            "
          >
            上傳教案
          </button>
        </div>

        {/* ===== 我的收藏 ===== */}
        <SectionHeader className="mt-12" title="我的收藏" total={myLikesAll.length} />

        <TableShell>
          <TableHeader cols={['家別', '期數', '類別', '教案名稱', '撰寫者', '查看', '收藏']} />

          {hasLikes ? (
            <div className="border-x border-b border-black-200 rounded-b-lg divide-y">
              {myLikes.map((r) => {
                const liked = !!likes[r.id];
                return (
                  <div key={r.id} className="flex h-[48px] items-center text-[14px]">
                    <BodyCell w="92">{r.family}</BodyCell>
                    <BodyCell w="92">{r.issue}</BodyCell>
                    <BodyCell w="92">{r.category}</BodyCell>
                    <BodyCell w="352">
                      <span className="truncate">{r.title}</span>
                    </BodyCell>
                    <BodyCell w="164">{r.author}</BodyCell>
                    <BodyCell w="92" center>
                      <button type="button" aria-label="查看">
                        <Image src="/icons/file-alt.png" alt="" width={20} height={20} />
                      </button>
                    </BodyCell>
                    <BodyCell w="92" center>
                      <button
                        type="button"
                        onClick={() => toggleLike(r.id)}
                        aria-label={liked ? '取消收藏' : '加入收藏'}
                      >
                        <Image
                          src={liked ? '/icons/liked.png' : '/icons/like.png'}
                          alt=""
                          width={20}
                          height={20}
                        />
                      </button>
                    </BodyCell>
                  </div>
                );
              })}
            </div>
          ) : (
            // 無資料提示（我的收藏）
            <EmptyRow>
              目前沒有收藏的教案唷，快去探索看看其他人的教案吧！
            </EmptyRow>
          )}
        </TableShell>

        {/* —— 收藏只有「查看全部」按鈕（無資料時禁用） —— */}
        <div className="mt-6 mb-12 flex w-full items-center justify-center">
          <button
            type="button"
            disabled={!hasLikes}
            onClick={() => hasLikes && router.push('/plans/likes')}
            className={viewAllBtnClass(!hasLikes)}
          >
            查看全部
          </button>
        </div>
      </section>
    </main>
  );
}

/* ===== 小元件 ===== */

function SectionHeader({
  title,
  total,
  className = '',
}: {
  title: string;
  total: number;
  className?: string;
}) {
  return (
    <div className={`mt-10 ${className}`}>
      <h3 className="inline-block w-auto text-[25px] font-bold font-['Noto_Sans_TC'] text-black-900 leading-[150%] tracking-normal">
        {title}
        <span className="ml-2 text-[16px] font-normal leading-[150%]">
          （共 {total} 筆）
        </span>
      </h3>
    </div>
  );
}

function TableShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mt-2 w-[976px] mx-auto rounded-lg shadow-[2px_2px_10px_0px_rgba(0,0,0,0.1)] bg-white">
      {children}
    </div>
  );
}

function TableHeader({ cols }: { cols: string[] }) {
  return (
    <div className="w-[976px] h-[48px] flex">
      <HeaderCell className="rounded-tl-lg">{cols[0]}</HeaderCell>
      <HeaderCell>{cols[1]}</HeaderCell>
      <HeaderCell>{cols[2]}</HeaderCell>
      <HeaderCell wide="title">{cols[3]}</HeaderCell>
      <HeaderCell wide="author">{cols[4]}</HeaderCell>
      <HeaderCell>{cols[5]}</HeaderCell>
      <HeaderCell className="rounded-tr-lg">{cols[6]}</HeaderCell>
    </div>
  );
}

/** 無資料的一整列（置中訊息；字體規格照你要求） */
function EmptyRow({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-[976px] h-[48px] flex items-center justify-center border-x border-b border-black-200 rounded-b-lg px-11">
      <p className="text-[16px] leading-[150%] font-['Noto_Sans_TC'] font-normal text-black-700 text-center">
        {children}
      </p>
    </div>
  );
}

/** 表頭欄位（沿用你的寫法） */
function HeaderCell({
  children,
  className = '',
  wide,
}: {
  children: React.ReactNode;
  className?: string;
  wide?: 'title' | 'author';
}) {
  const base =
    'flex items-center justify-center text-[14px] font-bold font-["Noto_Sans_TC"] text-black-900 ' +
    'border border-black-200 bg-primary-100 whitespace-nowrap break-normal';
  const padNormal = 'py-2 px-2';
  const padTitle = 'py-2 px-[30px]';
  const wClass =
    wide === 'title'
      ? 'w-[352px]'
      : wide === 'author'
      ? 'w-[164px]'
      : 'w-[92px]';
  return (
    <div className={`${base} ${wClass} ${wide ? padTitle : padNormal} ${className}`} style={{ wordBreak: 'keep-all' }}>
      {children}
    </div>
  );
}

/** 內容欄位（沿用你的寫法） */
function BodyCell({
  children,
  w,
  center = true,
}: {
  children: React.ReactNode;
  w: '92' | '164' | '352';
  center?: boolean;
}) {
  return (
    <div
      className={[
        `w-[${w}px] h-[48px] px-2 flex items-center`,
        center ? 'justify-center text-center' : '',
        'border-x border-b border-black-200 first:border-l-0 last:border-r-0',
      ].join(' ')}
    >
      {children}
    </div>
  );
}
