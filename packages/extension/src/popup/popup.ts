/**
 * Popup UI — settings, import trigger, recipe list.
 * Plain TS, no framework.
 */

import { loginWithAppPassword } from '@recipe/atproto';
import type { AISettings, AtprotoSession, LLMProvider, StoredRecipe } from '../shared/types.js';
import type { ImportStatus, PublishRecipeResponse, AtprotoSessionResponse } from '../shared/messages.js';

// Model registry (duplicated from ai-provider to avoid bundling AI SDK in popup)
const AVAILABLE_MODELS: Record<LLMProvider, Array<{ id: string; name: string }>> = {
  anthropic: [
    { id: 'claude-sonnet-4-6', name: 'Claude Sonnet 4.6 ($3/$15)' },
    { id: 'claude-haiku-4-5', name: 'Claude Haiku 4.5 ($1/$5)' },
  ],
  openai: [
    { id: 'gpt-5.4', name: 'GPT-5.4' },
    { id: 'gpt-5.2', name: 'GPT-5.2' },
    { id: 'gpt-5-mini', name: 'GPT-5 Mini' },
  ],
  google: [
    { id: 'gemini-3.1-pro-preview', name: 'Gemini 3.1 Pro' },
    { id: 'gemini-3.1-flash-preview', name: 'Gemini 3.1 Flash' },
    { id: 'gemini-3.1-flash-lite-preview', name: 'Gemini 3.1 Flash Lite' },
    { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash' },
    { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro' },
  ],
  ollama: [
    { id: 'gemma4:e4b', name: 'Gemma 4 E4B' },
    { id: 'gpt-oss:20b', name: 'GPT OSS 20B' },
  ],
  'ollama-cloud': [
    { id: 'glm-5.1:cloud', name: 'GLM 5.1' },
    { id: 'gemma4:31b-cloud', name: 'Gemma 4 31B' },
  ],
};

// --- DOM refs ---
const providerSelect = document.getElementById('provider-select') as HTMLSelectElement;
const modelSelect = document.getElementById('model-select') as HTMLSelectElement;
const apiKeyInput = document.getElementById('api-key-input') as HTMLInputElement;
const keyStatus = document.getElementById('key-status') as HTMLSpanElement;
const saveKeyBtn = document.getElementById('save-key-btn') as HTMLButtonElement;
const ollamaUrlRow = document.getElementById('ollama-url-row') as HTMLDivElement;
const ollamaUrlInput = document.getElementById('ollama-url-input') as HTMLInputElement;
const importBtn = document.getElementById('import-btn') as HTMLButtonElement;
const statusEl = document.getElementById('status') as HTMLDivElement;
const recipeList = document.getElementById('recipe-list') as HTMLUListElement;

// Atproto auth elements
const atprotoSignedOut = document.getElementById('atproto-signed-out') as HTMLDivElement;
const atprotoSignedIn = document.getElementById('atproto-signed-in') as HTMLDivElement;
const atprotoHandleInput = document.getElementById('atproto-handle-input') as HTMLInputElement;
const atprotoPasswordInput = document.getElementById('atproto-password-input') as HTMLInputElement;
const atprotoServiceInput = document.getElementById('atproto-service-input') as HTMLInputElement;
const atprotoSignInBtn = document.getElementById('atproto-signin-btn') as HTMLButtonElement;
const atprotoSignOutBtn = document.getElementById('atproto-signout-btn') as HTMLButtonElement;
const atprotoStatus = document.getElementById('atproto-status') as HTMLDivElement;
const atprotoHandleDisplay = document.getElementById('atproto-handle-display') as HTMLSpanElement;

let currentSettings: AISettings | null = null;
let currentAtprotoSession: AtprotoSession | null = null;

// --- Init ---
document.addEventListener('DOMContentLoaded', async () => {
  await loadSettings();
  await loadAtprotoSession();
  await loadRecipes();
  await restoreLastStatus();

  providerSelect.addEventListener('change', onProviderChange);
  modelSelect.addEventListener('change', onModelChange);
  saveKeyBtn.addEventListener('click', onSaveKey);
  importBtn.addEventListener('click', onImport);
  atprotoSignInBtn.addEventListener('click', onAtprotoSignIn);
  atprotoSignOutBtn.addEventListener('click', onAtprotoSignOut);
});

// Listen for status updates from service worker
chrome.runtime.onMessage.addListener((message: ImportStatus) => {
  if (message.type === 'STATUS') {
    showStatus(message);
    // Refresh recipe list when import completes
    if (message.phase === 'done') {
      loadRecipes();
    }
    // Enable/disable import button based on state
    const inProgress = message.phase === 'extracting' || message.phase === 'parsing';
    importBtn.disabled = inProgress;
  }
});

// --- Settings ---

async function loadSettings(): Promise<void> {
  const response = await chrome.runtime.sendMessage({ type: 'GET_SETTINGS' });
  currentSettings = response.settings as AISettings;
  renderSettings();
}

function renderSettings(): void {
  if (!currentSettings) return;

  providerSelect.value = currentSettings.provider;
  populateModels(currentSettings.provider);
  modelSelect.value = currentSettings.model;

  const hasKey = !!currentSettings.apiKeys[currentSettings.provider];
  keyStatus.className = `provider-status ${hasKey ? 'configured' : 'unconfigured'}`;
  apiKeyInput.value = '';
  apiKeyInput.placeholder = hasKey ? '••••••••' : 'Enter API key...';

  // Show Ollama URL field for both ollama variants
  const isOllama = currentSettings.provider === 'ollama' || currentSettings.provider === 'ollama-cloud';
  ollamaUrlRow.className = isOllama ? 'visible' : '';
  if (currentSettings.provider === 'ollama') {
    ollamaUrlInput.value = currentSettings.ollamaBaseUrl ?? '';
    ollamaUrlInput.placeholder = 'http://localhost:11434/api';
    apiKeyInput.placeholder = 'Not required for Ollama';
  } else if (currentSettings.provider === 'ollama-cloud') {
    ollamaUrlInput.value = currentSettings.ollamaCloudBaseUrl ?? '';
    ollamaUrlInput.placeholder = 'https://ollama.com/api';
  }
}

function populateModels(provider: LLMProvider): void {
  modelSelect.textContent = '';
  const models = AVAILABLE_MODELS[provider] ?? [];
  for (const model of models) {
    const option = document.createElement('option');
    option.value = model.id;
    option.textContent = model.name;
    modelSelect.appendChild(option);
  }

  // For Ollama variants, add custom model option
  if (provider === 'ollama' || provider === 'ollama-cloud') {
    const custom = document.createElement('option');
    custom.value = '__custom__';
    custom.textContent = 'Custom model...';
    modelSelect.appendChild(custom);
  }
}

async function onProviderChange(): Promise<void> {
  if (!currentSettings) return;
  const provider = providerSelect.value as LLMProvider;
  currentSettings.provider = provider;

  populateModels(provider);
  const firstModel = AVAILABLE_MODELS[provider]?.[0];
  currentSettings.model = firstModel?.id ?? '';
  modelSelect.value = currentSettings.model;

  await saveCurrentSettings();
  renderSettings();
}

async function onModelChange(): Promise<void> {
  if (!currentSettings) return;

  if (modelSelect.value === '__custom__') {
    const custom = prompt('Enter Ollama model name (e.g., llama3:8b):');
    if (custom) {
      currentSettings.model = custom;
    }
  } else {
    currentSettings.model = modelSelect.value;
  }

  await saveCurrentSettings();
}

async function onSaveKey(): Promise<void> {
  if (!currentSettings) return;
  const key = apiKeyInput.value.trim();
  if (!key && currentSettings.provider !== 'ollama') return; // only local ollama can save without a key

  if (key) {
    currentSettings.apiKeys[currentSettings.provider] = key;
  }

  if (currentSettings.provider === 'ollama') {
    const url = ollamaUrlInput.value.trim();
    currentSettings.ollamaBaseUrl = url || undefined;
  } else if (currentSettings.provider === 'ollama-cloud') {
    const url = ollamaUrlInput.value.trim();
    currentSettings.ollamaCloudBaseUrl = url || undefined;
  }

  await saveCurrentSettings();
  renderSettings();
}

async function saveCurrentSettings(): Promise<void> {
  if (!currentSettings) return;
  await chrome.runtime.sendMessage({ type: 'SAVE_SETTINGS', settings: currentSettings });
}

async function restoreLastStatus(): Promise<void> {
  const status = await chrome.runtime.sendMessage({ type: 'GET_LAST_STATUS' });
  if (!status || !status.phase || status.phase === 'idle') return;

  showStatus(status);
  const inProgress = status.phase === 'extracting' || status.phase === 'parsing';
  importBtn.disabled = inProgress;
}

// --- Import ---

async function onImport(): Promise<void> {
  importBtn.disabled = true;
  showStatus({ type: 'STATUS', phase: 'extracting' });

  try {
    const result = await chrome.runtime.sendMessage({ type: 'IMPORT_RECIPE' }) as ImportStatus;
    showStatus(result);
    if (result.phase === 'done') {
      await loadRecipes();
    }
  } catch (err) {
    showStatus({ type: 'STATUS', phase: 'error', message: String(err) });
  } finally {
    importBtn.disabled = false;
  }
}

function showStatus(status: ImportStatus): void {
  if (status.phase === 'idle') {
    statusEl.className = '';
    statusEl.textContent = '';
    return;
  }

  statusEl.classList.add('visible');
  statusEl.className = `visible ${status.phase}`;

  switch (status.phase) {
    case 'extracting':
      statusEl.textContent = 'Extracting page content...';
      break;
    case 'parsing':
      statusEl.textContent = `Parsing recipe (attempt ${status.attempt}/3)...`;
      break;
    case 'done':
      statusEl.textContent = `Imported: ${status.title}`;
      break;
    case 'error':
      statusEl.textContent = `Error: ${status.message}`;
      break;
  }
}

// --- Recipe list ---

async function loadRecipes(): Promise<void> {
  const response = await chrome.runtime.sendMessage({ type: 'LIST_RECIPES' });
  const recipes = (response.recipes ?? []) as StoredRecipe[];
  renderRecipes(recipes);
}

function renderRecipes(recipes: StoredRecipe[]): void {
  lastRenderedRecipes = recipes;
  recipeList.textContent = '';

  if (recipes.length === 0) {
    const li = document.createElement('li');
    li.className = 'empty-state';
    li.textContent = 'No recipes imported yet';
    recipeList.appendChild(li);
    return;
  }

  for (const recipe of recipes) {
    const li = document.createElement('li');
    li.className = 'recipe-item';

    // Recipe info
    const info = document.createElement('div');
    info.className = 'recipe-info';

    const title = document.createElement('div');
    title.className = 'recipe-title';
    title.textContent = recipe.title;

    const meta = document.createElement('div');
    meta.className = 'recipe-meta';
    meta.textContent = new Date(recipe.importedAt).toLocaleDateString();

    const publishMeta = document.createElement('div');
    publishMeta.className = 'recipe-meta';
    if (recipe.atprotoRkey) {
      publishMeta.textContent = `at://…/${recipe.atprotoRkey}`;
    }

    info.appendChild(title);
    info.appendChild(meta);
    info.appendChild(publishMeta);

    // Actions
    const actions = document.createElement('div');
    actions.className = 'recipe-actions';

    const publishBtn = document.createElement('button');
    publishBtn.className = 'btn-small btn-publish';
    publishBtn.textContent = recipe.atprotoRkey ? 'Republish' : 'Publish';
    publishBtn.disabled = currentAtprotoSession === null;
    publishBtn.title = currentAtprotoSession === null ? 'Sign in to Bluesky first' : '';
    publishBtn.addEventListener('click', () => publishRecipeClick(recipe.slug, publishBtn, publishMeta));

    const exportBtn = document.createElement('button');
    exportBtn.className = 'btn-small';
    exportBtn.textContent = 'Export';
    exportBtn.addEventListener('click', () => exportRecipe(recipe.slug));

    const deleteBtn = document.createElement('button');
    deleteBtn.className = 'btn-small btn-danger';
    deleteBtn.textContent = 'Delete';
    deleteBtn.addEventListener('click', async () => {
      await chrome.runtime.sendMessage({ type: 'DELETE_RECIPE', slug: recipe.slug });
      await loadRecipes();
    });

    actions.appendChild(publishBtn);
    actions.appendChild(exportBtn);
    actions.appendChild(deleteBtn);

    li.appendChild(info);
    li.appendChild(actions);
    recipeList.appendChild(li);
  }
}

async function exportRecipe(slug: string): Promise<void> {
  // Delegate download to the service worker — popup context is too
  // restricted for Blob downloads and can crash.
  await chrome.runtime.sendMessage({ type: 'EXPORT_RECIPE', slug });
}

// --- ATproto auth ---

const DEFAULT_ATPROTO_SERVICE = 'https://bsky.social';

async function loadAtprotoSession(): Promise<void> {
  const response = (await chrome.runtime.sendMessage({
    type: 'GET_ATPROTO_SESSION',
  })) as AtprotoSessionResponse;
  currentAtprotoSession = response.session;
  renderAtprotoSection();
}

function renderAtprotoSection(): void {
  if (currentAtprotoSession) {
    atprotoSignedOut.hidden = true;
    atprotoSignedIn.hidden = false;
    atprotoHandleDisplay.textContent = `@${currentAtprotoSession.handle}`;
  } else {
    atprotoSignedOut.hidden = false;
    atprotoSignedIn.hidden = true;
  }
}

async function onAtprotoSignIn(): Promise<void> {
  const handle = atprotoHandleInput.value.trim();
  const password = atprotoPasswordInput.value.trim();
  const service = atprotoServiceInput.value.trim() || DEFAULT_ATPROTO_SERVICE;

  if (!handle || !password) {
    showAtprotoStatus('error', 'Enter both handle and app password');
    return;
  }

  atprotoSignInBtn.disabled = true;
  showAtprotoStatus('pending', 'Signing in…');

  try {
    const { session } = await loginWithAppPassword({
      service,
      identifier: handle,
      password,
    });
    const persisted: AtprotoSession = {
      service: session.service,
      did: session.did,
      handle: session.handle,
      accessJwt: session.accessJwt,
      refreshJwt: session.refreshJwt,
      active: session.active,
    };
    await chrome.runtime.sendMessage({
      type: 'SAVE_ATPROTO_SESSION',
      session: persisted,
    });
    currentAtprotoSession = persisted;
    showAtprotoStatus('success', `Signed in as @${session.handle}`);
    atprotoPasswordInput.value = '';
    renderAtprotoSection();
    renderRecipes(lastRenderedRecipes);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    showAtprotoStatus('error', `Sign in failed: ${msg}`);
  } finally {
    atprotoSignInBtn.disabled = false;
  }
}

async function onAtprotoSignOut(): Promise<void> {
  await chrome.runtime.sendMessage({ type: 'CLEAR_ATPROTO_SESSION' });
  currentAtprotoSession = null;
  renderAtprotoSection();
  renderRecipes(lastRenderedRecipes);
}

function showAtprotoStatus(kind: 'pending' | 'success' | 'error', text: string): void {
  atprotoStatus.className = `visible ${kind}`;
  atprotoStatus.textContent = text;
}

// --- Publish ---

let lastRenderedRecipes: StoredRecipe[] = [];

async function publishRecipeClick(slug: string, btn: HTMLButtonElement, subtitle: HTMLDivElement): Promise<void> {
  btn.disabled = true;
  btn.textContent = 'Publishing…';
  subtitle.textContent = '';
  try {
    const response = (await chrome.runtime.sendMessage({
      type: 'PUBLISH_RECIPE',
      slug,
    })) as PublishRecipeResponse;
    if (response.success) {
      btn.textContent = 'Republish';
      subtitle.textContent = response.uri;
      subtitle.className = 'recipe-meta success';
      await loadRecipes();
    } else {
      btn.textContent = 'Publish';
      subtitle.textContent = response.error;
      subtitle.className = 'recipe-meta error';
    }
  } finally {
    btn.disabled = false;
  }
}
