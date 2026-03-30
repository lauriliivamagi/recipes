/**
 * Centralized data-testid constants for Playwright E2E tests.
 *
 * Pattern:
 *   1. Add constants here as you build UI features.
 *   2. Use `data-testid={SELECTORS.WIDGETS.LIST}` in React components.
 *   3. Use `page.getByTestId(SELECTORS.WIDGETS.LIST)` in spec files.
 *
 * Benefits:
 *   - Single source of truth for test IDs (rename once, update everywhere)
 *   - IDE autocomplete when writing tests
 *   - Documents which elements are instrumented for testing
 *
 * Naming convention: kebab-case for IDs, SCREAMING_SNAKE for constants.
 */

// ---------- Common UI Elements ----------

export const COMMON = {
  LOADING_SPINNER: "loading-spinner",
  ERROR_MESSAGE: "error-message",
  SUCCESS_MESSAGE: "success-message",
  DIALOG_CLOSE: "dialog-close-button",
};

// ---------- Widget (Aggregate Root) ----------

export const WIDGETS = {
  LIST: "widgets-list",
  ITEM: (id: string) => `widget-item-${id}`,
  CREATE_BUTTON: "create-widget-button",
  NAME_INPUT: "widget-name-input",
  DESCRIPTION_INPUT: "widget-description-input",
  SAVE_BUTTON: "widget-save-button",
  DELETE_BUTTON: (id: string) => `widget-delete-${id}`,
  RENAME_INPUT: "widget-rename-input",
  RENAME_BUTTON: "widget-rename-button",
};

// ---------- Example App (XState Demo) ----------

export const EXAMPLE_APP = {
  HEADING: "app-heading",
  STATE_DISPLAY: "app-state-display",
  ITEMS_COUNT: "app-items-count",
  LOAD_BUTTON: "app-load-button",
  RESET_BUTTON: "app-reset-button",
};

// ---------- Gadget (Child Entity of Widget) ----------

export const GADGETS = {
  LIST: "gadgets-list",
  ITEM: (id: string) => `gadget-item-${id}`,
  LABEL_INPUT: "gadget-label-input",
  ADD_BUTTON: "add-gadget-button",
  REMOVE_BUTTON: (id: string) => `gadget-remove-${id}`,
};
