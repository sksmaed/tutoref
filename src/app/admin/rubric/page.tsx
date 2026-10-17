'use client';

import { PageHead } from '@/components/layout/PageHead';
import { RubricPanel } from '@/features/admin/rubric/RubricPanel';

export default function AdminRubricPage() {
  return (
    <div>
      <PageHead title="驗收標準" subtitle="初驗與總驗的驗收標準；驗收者介面採用同一份標準。" />
      <RubricPanel />
    </div>
  );
}
