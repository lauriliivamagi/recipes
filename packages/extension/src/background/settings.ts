/**
 * Settings persistence via chrome.storage.local.
 * Stores provider selection, model, and per-provider API keys.
 */

import type { AISettings, LLMProvider } from "../shared/types.js";
import { getDefaultModel } from "./ai-provider.js";

const STORAGE_KEY = "aiSettings";

const DEFAULT_SETTINGS: AISettings = {
  provider: "anthropic",
  model: "claude-sonnet-4-6",
  apiKeys: {},
};

/** Read settings from chrome.storage.local */
export async function getSettings(): Promise<AISettings> {
  const result = await chrome.storage.local.get(STORAGE_KEY);
  const stored = result[STORAGE_KEY] as Partial<AISettings> | undefined;
  if (!stored) return { ...DEFAULT_SETTINGS };

  return {
    provider: stored.provider ?? DEFAULT_SETTINGS.provider,
    model: stored.model ?? DEFAULT_SETTINGS.model,
    apiKeys: stored.apiKeys ?? {},
    ollamaBaseUrl: stored.ollamaBaseUrl,
    ollamaCloudBaseUrl: stored.ollamaCloudBaseUrl,
  };
}

/** Write settings to chrome.storage.local */
export async function saveSettings(settings: AISettings): Promise<void> {
  await chrome.storage.local.set({ [STORAGE_KEY]: settings });
}

/** Get API key for a specific provider */
export async function getApiKey(provider: LLMProvider): Promise<string | undefined> {
  const settings = await getSettings();
  return settings.apiKeys[provider];
}

/** Set API key for a specific provider, preserving other settings @knipignore */
export async function setApiKey(provider: LLMProvider, key: string): Promise<void> {
  const settings = await getSettings();
  settings.apiKeys[provider] = key;
  await saveSettings(settings);
}

/** Check if a provider has an API key configured @knipignore */
export async function isProviderConfigured(provider: LLMProvider): Promise<boolean> {
  if (provider === "ollama") return true; // local Ollama runs unauthenticated; ollama-cloud falls through to key check
  const key = await getApiKey(provider);
  return !!key;
}

/** Switch to a different provider, using its default model @knipignore */
export async function switchProvider(provider: LLMProvider): Promise<AISettings> {
  const settings = await getSettings();
  settings.provider = provider;
  settings.model = getDefaultModel(provider);
  await saveSettings(settings);
  return settings;
}
