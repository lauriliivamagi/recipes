//#region src/popup/popup.ts
var AVAILABLE_MODELS = {
	anthropic: [{
		id: "claude-sonnet-4-6",
		name: "Claude Sonnet 4.6 ($3/$15)"
	}, {
		id: "claude-haiku-4-5",
		name: "Claude Haiku 4.5 ($1/$5)"
	}],
	openai: [
		{
			id: "gpt-5.4",
			name: "GPT-5.4"
		},
		{
			id: "gpt-5.2",
			name: "GPT-5.2"
		},
		{
			id: "gpt-5-mini",
			name: "GPT-5 Mini"
		}
	],
	google: [
		{
			id: "gemini-3.1-pro-preview",
			name: "Gemini 3.1 Pro"
		},
		{
			id: "gemini-3.1-flash-preview",
			name: "Gemini 3.1 Flash"
		},
		{
			id: "gemini-3.1-flash-lite-preview",
			name: "Gemini 3.1 Flash Lite"
		},
		{
			id: "gemini-2.5-flash",
			name: "Gemini 2.5 Flash"
		},
		{
			id: "gemini-2.5-pro",
			name: "Gemini 2.5 Pro"
		}
	],
	ollama: [
		{
			id: "gemma4:e4b",
			name: "Gemma 4 E4B"
		},
		{
			id: "gpt-oss:20b",
			name: "GPT OSS 20B"
		},
		{
			id: "gemma3:12b",
			name: "Gemma 3 12B"
		}
	]
};
var providerSelect = document.getElementById("provider-select");
var modelSelect = document.getElementById("model-select");
var apiKeyInput = document.getElementById("api-key-input");
var keyStatus = document.getElementById("key-status");
var saveKeyBtn = document.getElementById("save-key-btn");
var ollamaUrlRow = document.getElementById("ollama-url-row");
var ollamaUrlInput = document.getElementById("ollama-url-input");
var importBtn = document.getElementById("import-btn");
var statusEl = document.getElementById("status");
var recipeList = document.getElementById("recipe-list");
var currentSettings = null;
document.addEventListener("DOMContentLoaded", async () => {
	await loadSettings();
	await loadRecipes();
	await restoreLastStatus();
	providerSelect.addEventListener("change", onProviderChange);
	modelSelect.addEventListener("change", onModelChange);
	saveKeyBtn.addEventListener("click", onSaveKey);
	importBtn.addEventListener("click", onImport);
});
chrome.runtime.onMessage.addListener((message) => {
	if (message.type === "STATUS") {
		showStatus(message);
		if (message.phase === "done") loadRecipes();
		importBtn.disabled = message.phase === "extracting" || message.phase === "parsing";
	}
});
async function loadSettings() {
	currentSettings = (await chrome.runtime.sendMessage({ type: "GET_SETTINGS" })).settings;
	renderSettings();
}
function renderSettings() {
	if (!currentSettings) return;
	providerSelect.value = currentSettings.provider;
	populateModels(currentSettings.provider);
	modelSelect.value = currentSettings.model;
	const hasKey = !!currentSettings.apiKeys[currentSettings.provider];
	keyStatus.className = `provider-status ${hasKey ? "configured" : "unconfigured"}`;
	apiKeyInput.value = "";
	apiKeyInput.placeholder = hasKey ? "••••••••" : "Enter API key...";
	ollamaUrlRow.className = currentSettings.provider === "ollama" ? "visible" : "";
	if (currentSettings.provider === "ollama") {
		ollamaUrlInput.value = currentSettings.ollamaBaseUrl ?? "";
		apiKeyInput.placeholder = "Not required for Ollama";
	}
}
function populateModels(provider) {
	modelSelect.textContent = "";
	const models = AVAILABLE_MODELS[provider] ?? [];
	for (const model of models) {
		const option = document.createElement("option");
		option.value = model.id;
		option.textContent = model.name;
		modelSelect.appendChild(option);
	}
	if (provider === "ollama") {
		const custom = document.createElement("option");
		custom.value = "__custom__";
		custom.textContent = "Custom model...";
		modelSelect.appendChild(custom);
	}
}
async function onProviderChange() {
	if (!currentSettings) return;
	const provider = providerSelect.value;
	currentSettings.provider = provider;
	populateModels(provider);
	const firstModel = AVAILABLE_MODELS[provider]?.[0];
	currentSettings.model = firstModel?.id ?? "";
	modelSelect.value = currentSettings.model;
	await saveCurrentSettings();
	renderSettings();
}
async function onModelChange() {
	if (!currentSettings) return;
	if (modelSelect.value === "__custom__") {
		const custom = prompt("Enter Ollama model name (e.g., llama3:8b):");
		if (custom) currentSettings.model = custom;
	} else currentSettings.model = modelSelect.value;
	await saveCurrentSettings();
}
async function onSaveKey() {
	if (!currentSettings) return;
	const key = apiKeyInput.value.trim();
	if (!key && currentSettings.provider !== "ollama") return;
	if (key) currentSettings.apiKeys[currentSettings.provider] = key;
	if (currentSettings.provider === "ollama") {
		const url = ollamaUrlInput.value.trim();
		currentSettings.ollamaBaseUrl = url || void 0;
	}
	await saveCurrentSettings();
	renderSettings();
}
async function saveCurrentSettings() {
	if (!currentSettings) return;
	await chrome.runtime.sendMessage({
		type: "SAVE_SETTINGS",
		settings: currentSettings
	});
}
async function restoreLastStatus() {
	const status = await chrome.runtime.sendMessage({ type: "GET_LAST_STATUS" });
	if (!status || !status.phase || status.phase === "idle") return;
	showStatus(status);
	importBtn.disabled = status.phase === "extracting" || status.phase === "parsing";
}
async function onImport() {
	importBtn.disabled = true;
	showStatus({
		type: "STATUS",
		phase: "extracting"
	});
	try {
		const result = await chrome.runtime.sendMessage({ type: "IMPORT_RECIPE" });
		showStatus(result);
		if (result.phase === "done") await loadRecipes();
	} catch (err) {
		showStatus({
			type: "STATUS",
			phase: "error",
			message: String(err)
		});
	} finally {
		importBtn.disabled = false;
	}
}
function showStatus(status) {
	if (status.phase === "idle") {
		statusEl.className = "";
		statusEl.textContent = "";
		return;
	}
	statusEl.classList.add("visible");
	statusEl.className = `visible ${status.phase}`;
	switch (status.phase) {
		case "extracting":
			statusEl.textContent = "Extracting page content...";
			break;
		case "parsing":
			statusEl.textContent = `Parsing recipe (attempt ${status.attempt}/3)...`;
			break;
		case "done":
			statusEl.textContent = `Imported: ${status.title}`;
			break;
		case "error":
			statusEl.textContent = `Error: ${status.message}`;
			break;
	}
}
async function loadRecipes() {
	renderRecipes((await chrome.runtime.sendMessage({ type: "LIST_RECIPES" })).recipes ?? []);
}
function renderRecipes(recipes) {
	recipeList.textContent = "";
	if (recipes.length === 0) {
		const li = document.createElement("li");
		li.className = "empty-state";
		li.textContent = "No recipes imported yet";
		recipeList.appendChild(li);
		return;
	}
	for (const recipe of recipes) {
		const li = document.createElement("li");
		li.className = "recipe-item";
		const info = document.createElement("div");
		info.className = "recipe-info";
		const title = document.createElement("div");
		title.className = "recipe-title";
		title.textContent = recipe.title;
		const meta = document.createElement("div");
		meta.className = "recipe-meta";
		meta.textContent = new Date(recipe.importedAt).toLocaleDateString();
		info.appendChild(title);
		info.appendChild(meta);
		const actions = document.createElement("div");
		actions.className = "recipe-actions";
		const exportBtn = document.createElement("button");
		exportBtn.className = "btn-small";
		exportBtn.textContent = "Export";
		exportBtn.addEventListener("click", () => exportRecipe(recipe.slug));
		const deleteBtn = document.createElement("button");
		deleteBtn.className = "btn-small btn-danger";
		deleteBtn.textContent = "Delete";
		deleteBtn.addEventListener("click", async () => {
			await chrome.runtime.sendMessage({
				type: "DELETE_RECIPE",
				slug: recipe.slug
			});
			await loadRecipes();
		});
		actions.appendChild(exportBtn);
		actions.appendChild(deleteBtn);
		li.appendChild(info);
		li.appendChild(actions);
		recipeList.appendChild(li);
	}
}
async function exportRecipe(slug) {
	await chrome.runtime.sendMessage({
		type: "EXPORT_RECIPE",
		slug
	});
}
//#endregion
