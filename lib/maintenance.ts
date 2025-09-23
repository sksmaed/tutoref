/**
 * 維護模式相關工具函數
 */

/**
 * 檢查是否為維護模式
 * @param searchParams - URL 搜尋參數
 * @returns 是否為維護模式（true = 維護中，false = 正常運行）
 */
export function isMaintenanceMode(searchParams?: URLSearchParams | null): boolean {
  // 如果沒有 searchParams，預設為維護模式
  if (!searchParams) {
    return true;
  }
  
  // 檢查是否有 admin=tutorefwebpage 參數
  const adminParam = searchParams.get('admin');
  return adminParam !== 'tutorefwebpage';
}

/**
 * 從瀏覽器獲取當前 URL 的搜尋參數
 * @returns URLSearchParams 物件或 null
 */
export function getCurrentSearchParams(): URLSearchParams | null {
  if (typeof window === 'undefined') {
    return null;
  }
  
  try {
    return new URLSearchParams(window.location.search);
  } catch {
    return null;
  }
}

/**
 * 檢查當前是否為維護模式（客戶端）
 * @returns 是否為維護模式
 */
export function isCurrentlyInMaintenanceMode(): boolean {
  const searchParams = getCurrentSearchParams();
  return isMaintenanceMode(searchParams);
}