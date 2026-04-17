const STORAGE_KEY = 'hob';

interface PersistedState {
  lastRecipeSlug?: string;
  mode?: 'relaxed' | 'optimized';
  servings?: Record<string, number>;
  currentStep?: Record<string, number>;
}

export function saveState(state: PersistedState): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // localStorage not available or full
  }
}

export function loadState(): PersistedState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const parsed: unknown = JSON.parse(raw);
    return validatePersistedState(parsed);
  } catch {
    // localStorage not available, parse failure, or validation failure —
    // fall back to defaults rather than trusting malformed persisted state.
    return {};
  }
}

/**
 * Defensive validation for data read from localStorage. Rejects values that
 * don't match the expected shape so a corrupted or attacker-poisoned store
 * cannot inject unexpected values (e.g. objects where strings are expected)
 * into application state.
 */
function validatePersistedState(value: unknown): PersistedState {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return {};
  }
  const raw = value as Record<string, unknown>;
  const out: PersistedState = {};

  if (typeof raw['lastRecipeSlug'] === 'string') {
    out.lastRecipeSlug = raw['lastRecipeSlug'];
  }
  if (raw['mode'] === 'relaxed' || raw['mode'] === 'optimized') {
    out.mode = raw['mode'];
  }
  const servings = validateNumberMap(raw['servings']);
  if (servings) out.servings = servings;
  const currentStep = validateNumberMap(raw['currentStep']);
  if (currentStep) out.currentStep = currentStep;

  return out;
}

function validateNumberMap(value: unknown): Record<string, number> | undefined {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) {
    return undefined;
  }
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
    if (typeof v === 'number' && Number.isFinite(v)) {
      out[k] = v;
    }
  }
  return out;
}
