'use client';

import { useCallback, useState } from 'react';
import { useAuth } from '@/features/auth/useAuth';
import { updateMe } from '@/services/auth';

const NAME_MAX = 255;

/** 設定頁的姓名編輯：PATCH /auth/me，成功後重抓 session 讓側欄與選單一起更新。 */
export function useProfileEdit() {
  const { user, refresh } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(() => {
    setName(user?.name ?? '');
    setError(null);
    setEditing(true);
  }, [user]);

  const cancel = useCallback(() => {
    setEditing(false);
    setError(null);
  }, []);

  const trimmed = name.trim();
  const validation = !trimmed ? '姓名不能空白' : trimmed.length > NAME_MAX ? `姓名最多 ${NAME_MAX} 字` : null;

  const save = useCallback(async () => {
    if (validation) {
      setError(validation);
      return false;
    }
    setSaving(true);
    try {
      await updateMe({ name: trimmed });
      await refresh();
      setEditing(false);
      setError(null);
      return true;
    } catch (err) {
      const code = (err as { code?: string })?.code;
      setError(
        code === 'auth:invalid_name'
          ? `姓名須為 1–${NAME_MAX} 字`
          : err instanceof Error
            ? err.message
            : '儲存失敗，請稍後再試。'
      );
      return false;
    } finally {
      setSaving(false);
    }
  }, [refresh, trimmed, validation]);

  return { editing, name, setName, saving, error, start, cancel, save };
}
