export const HOME_RESET_EVENT = 'tutoref:home-reset';
const HOME_RESET_STORAGE_KEY = 'tutoref:home-reset';

export function triggerHomeReset() {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(HOME_RESET_STORAGE_KEY, '1');
  } catch (error) {
    // ignore storage errors (private mode, quota, etc.)
  }
  window.dispatchEvent(new Event(HOME_RESET_EVENT));
}

export function consumeHomeResetFlag(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const shouldReset = window.sessionStorage.getItem(HOME_RESET_STORAGE_KEY) === '1';
    if (shouldReset) {
      window.sessionStorage.removeItem(HOME_RESET_STORAGE_KEY);
    }
    return shouldReset;
  } catch (error) {
    return false;
  }
}
