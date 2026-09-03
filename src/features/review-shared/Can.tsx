'use client';

import React from 'react';
import { useTermContext } from './useTermContext';
import type { Capability } from './types';

/**
 * 依 capability 決定要不要畫出東西。
 *
 * 這只是「不畫使用者用不到的 UI」，不是安全機制（§7.2）——真正的擋在後端。
 */
interface CanProps {
  /** 需要的能力；給陣列代表「其中一個就夠」。 */
  capability: Capability | Capability[];
  children: React.ReactNode;
  /** 沒有能力時要顯示的東西，預設什麼都不畫。 */
  fallback?: React.ReactNode;
}

export const Can: React.FC<CanProps> = ({ capability, children, fallback = null }) => {
  const { context } = useTermContext();
  const required = Array.isArray(capability) ? capability : [capability];
  const granted = required.some((item) => context?.capabilities?.includes(item));
  return <>{granted ? children : fallback}</>;
};
