'use client';

import { RubricPanel } from '@/features/admin/rubric/RubricPanel';

export default function AdminRubricPage() {
  return (
    <div>
      <h2 className="mb-2 font-['Noto_Sans_TC'] text-[18px] font-bold text-black-900">驗收標準</h2>
      <RubricPanel />
    </div>
  );
}
