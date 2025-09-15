'use client';
import { AllPlansTable, Row } from '@/components/ui/AllPlansTable';

// 假資料：接後端時替換（含 liked 標記）
const rows: Row[] = Array.from({ length: 26 }, (_, i) => ({
  id: `like-${i}`,
  family: '霧鹿',
  issue: i % 2 ? '25冬' : '24夏',
  category: '社會',
  title: '「危」「食」已晚，認識危害農業的災害',
  author: '林庭宇',
  good: i % 4 === 0,
  liked: i % 2 === 0, // 收藏的子集合
}));

export default function LikesAllPage() {
  return <AllPlansTable title="我的收藏" rowsInput={rows} mode="likes" />;
}
