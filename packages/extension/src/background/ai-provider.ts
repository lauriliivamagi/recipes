/**
 * AI Provider Factory and Model Registry
 *
 * Multi-provider support via Vercel AI SDK. Adapted from fit-decision's
 * provider pattern, simplified for Chrome extension (no server, no DB).
 */

import { createAnthropic } from "@ai-sdk/anthropic";
import { createOpenAI } from "@ai-sdk/openai";
import { createGoogleGenerativeAI } from "@ai-sdk/google";
import type { LanguageModel } from "ai";
import type { LLMProvider, ModelInfo, AISettings } from "../shared/types.js";

/** Available models per provider */
export const AVAILABLE_MODELS: Record<LLMProvider, ModelInfo[]> = {
  anthropic: [
    { id: "claude-sonnet-4-6", name: "Claude Sonnet 4.6 ($3/$15)", contextWindow: 1_000_000 },
    { id: "claude-haiku-4-5", name: "Claude Haiku 4.5 ($1/$5)", contextWindow: 200_000 },
  ],
  openai: [
    { id: "gpt-5.4", name: "GPT-5.4", contextWindow: 400_000 },
    { id: "gpt-5.2", name: "GPT-5.2", contextWindow: 400_000 },
    { id: "gpt-5-mini", name: "GPT-5 Mini", contextWindow: 400_000 },
  ],
  google: [
    { id: "gemini-3.1-pro-preview", name: "Gemini 3.1 Pro", contextWindow: 1_000_000 },
    { id: "gemini-3.1-flash-preview", name: "Gemini 3.1 Flash", contextWindow: 1_000_000 },
    { id: "gemini-3.1-flash-lite-preview", name: "Gemini 3.1 Flash Lite", contextWindow: 1_000_000 },
    { id: "gemini-2.5-flash", name: "Gemini 2.5 Flash", contextWindow: 1_000_000 },
    { id: "gemini-2.5-pro", name: "Gemini 2.5 Pro", contextWindow: 1_000_000 },
  ],
  ollama: [
    { id: "gemma4:e4b", name: "Gemma 4 E4B", contextWindow: 128_000 },
    { id: "gpt-oss:20b", name: "GPT OSS 20B", contextWindow: 128_000 },
    { id: "gemma3:12b", name: "Gemma 3 12B", contextWindow: 128_000 },
  ],
};

/** Default model per provider */
const DEFAULT_MODELS: Record<LLMProvider, string> = {
  anthropic: "claude-sonnet-4-6",
  openai: "gpt-5.4",
  google: "gemini-3.1-flash-preview",
  ollama: "gemma4:e4b",
};

/** Get the default model ID for a provider */
export function getDefaultModel(provider: LLMProvider): string {
  return DEFAULT_MODELS[provider];
}

/**
 * Create a LanguageModel instance from settings.
 * Throws if no API key is available for the selected provider.
 */
export function createModelFromSettings(settings: AISettings): LanguageModel {
  const apiKey = settings.apiKeys[settings.provider];

  if (!apiKey && settings.provider !== "ollama") {
    throw new Error(`No API key configured for "${settings.provider}". Add one in extension settings.`);
  }

  switch (settings.provider) {
    case "anthropic": {
      const anthropic = createAnthropic({
        apiKey: apiKey!,
        headers: { "anthropic-dangerous-direct-browser-access": "true" },
      });
      return anthropic(settings.model);
    }
    case "openai": {
      const openai = createOpenAI({ apiKey: apiKey! });
      return openai(settings.model);
    }
    case "google": {
      const google = createGoogleGenerativeAI({ apiKey: apiKey! });
      return google(settings.model);
    }
    case "ollama": {
      const ollama = createOpenAI({
        baseURL: settings.ollamaBaseUrl ?? "http://localhost:11434/v1",
        apiKey: "ollama",
      });
      return ollama(settings.model);
    }
  }
}

/** Check if a model ID exists in the registry for a provider @knipignore */
export function isValidModel(provider: LLMProvider, modelId: string): boolean {
  // Ollama allows arbitrary model names
  if (provider === "ollama") return true;
  return AVAILABLE_MODELS[provider].some((m) => m.id === modelId);
}
