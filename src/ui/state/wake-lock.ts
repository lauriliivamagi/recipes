let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock(): Promise<boolean> {
  try {
    if ('wakeLock' in navigator) {
      wakeLock = await navigator.wakeLock.request('screen');
      return true;
    }
  } catch {
    // Wake lock request failed (e.g., low battery)
  }
  return false;
}

export async function releaseWakeLock(): Promise<void> {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
}
