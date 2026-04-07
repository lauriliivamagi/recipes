/**
 * Content script — extracts recipe content from the active page using Defuddle.
 * Injected on demand via chrome.scripting.executeScript.
 */

import Defuddle from 'defuddle';
import type { ContentScriptMessage, ExtractResult } from '../shared/messages.js';

chrome.runtime.onMessage.addListener(
  (message: ContentScriptMessage, _sender, sendResponse) => {
    if (message.type !== 'EXTRACT_RECIPE') return false;

    try {
      const result = new Defuddle(document, {
        url: window.location.href,
      }).parse();

      const response: ExtractResult = {
        type: 'EXTRACT_RESULT',
        data: {
          url: window.location.href,
          title: result.title ?? document.title,
          contentMarkdown: result.contentMarkdown ?? result.content ?? '',
          schemaOrgData: result.schemaOrgData ?? null,
          language: result.language ?? document.documentElement.lang ?? 'en',
        },
      };

      sendResponse(response);
    } catch (err) {
      sendResponse({
        type: 'EXTRACT_RESULT',
        data: {
          url: window.location.href,
          title: document.title,
          contentMarkdown: document.body.innerText.slice(0, 15_000),
          schemaOrgData: null,
          language: document.documentElement.lang ?? 'en',
        },
      });
    }

    return true;
  },
);
