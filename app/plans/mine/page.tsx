'use client';
import { AllPlansTable, Row } from '@/components/ui/AllPlansTable';

// 假資料：接後端時替換
const rows: Row[] = Array.from({ length: 24 }, (_, i) => ({
  id: `mine-${i}`,
  family: '霧鹿',
  issue: i % 2 ? '25冬' : '24夏',
  category: '社會',
  title: '「危」「食」已晚，認識危害農業的災害',
  author: '林庭宇',
  good: i % 3 === 0, // 有些是優良
  liked: false,
}));

export default function MineAllPage() {
  return <AllPlansTable title="我的教案" rowsInput={rows} mode="mine" />;
}
