/** Supported LLM providers */
export type LLMProvider = 'anthropic' | 'openai' | 'google' | 'ollama';

/** Model metadata for the registry */
export interface ModelInfo {
  id: string;
  name: string;
  contextWindow: number;
}

/** Persisted AI settings in chrome.storage.local */
export interface AISettings {
  provider: LLMProvider;
  model: string;
  apiKeys: Partial<Record<LLMProvider, string>>;
  ollamaBaseUrl?: string;
}

/** Stored recipe in IndexedDB */
export interface StoredRecipe {
  slug: string;
  recipe: unknown;
  sourceUrl: string;
  importedAt: number;
  title: string;
}
