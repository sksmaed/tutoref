export function isMaintenanceMode(searchParams?: URLSearchParams | null): boolean {
  return false;
}

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

export function isCurrentlyInMaintenanceMode(): boolean {
  const searchParams = getCurrentSearchParams();
  return isMaintenanceMode(searchParams);
}