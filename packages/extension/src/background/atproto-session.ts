import type { AtprotoSession } from '../shared/types.js';

const STORAGE_KEY = 'atprotoSession';

export async function loadAtprotoSession(): Promise<AtprotoSession | null> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY];
  if (!stored || typeof stored !== 'object') return null;
  return stored as AtprotoSession;
}

export async function saveAtprotoSession(session: AtprotoSession): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: session });
}

export async function clearAtprotoSession(): Promise<void> {
  await chrome.storage.local.remove(STORAGE_KEY);
}
