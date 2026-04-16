import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import {
  agentForDid,
  fetchRecipe,
  loadSession,
  type FetchedRecipeOk,
  type SessionState,
} from '@recipe/atproto';
import type { Agent } from '@atproto/api';
import type { Recipe } from '@recipe/domain/recipe/types.js';
import type { Phase } from '@recipe/domain/schedule/types.js';
import { computeSchedule } from '@recipe/domain/schedule/schedule.js';
import { designTokens, resetStyles, baseStyles } from '../shared/styles.js';
import { getOAuthClient } from '../auth/oauth-client.js';
import './recipe-page.js';

type FetchState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | {
      kind: 'ready';
      recipe: Recipe;
      scheduleRelaxed: Phase[];
      scheduleOptimized: Phase[];
    }
  | { kind: 'not-found' }
  | { kind: 'malformed'; reason: string }
  | { kind: 'error'; reason: string };

@customElement('pds-recipe-shell')
export class PdsRecipeShell extends LitElement {
  static override styles = [
    designTokens,
    resetStyles,
    baseStyles,
    css`
      :host { display: block; background: var(--bg); min-height: 100dvh; }
      .placeholder {
        margin: 16px;
        padding: 24px;
        background: var(--card);
        border-radius: var(--radius);
        text-align: center;
        color: var(--text-dim);
        font-size: var(--text-base);
      }
      .error { color: var(--danger); }
      a { color: var(--accent-teal); }
    `,
  ];

  @state() private _state: FetchState = { kind: 'idle' };
  @state() private _i18n: Record<string, any> = {};

  override async connectedCallback() {
    super.connectedCallback();
    this._i18n = (window as any).I18N ?? {};
    await this._load();
  }

  private async _load() {
    this._state = { kind: 'loading' };
    const params = new URLSearchParams(window.location.search);
    let did = params.get('did') ?? undefined;
    let rkey = params.get('rkey') ?? undefined;
    const uri = params.get('uri');
    if (uri) {
      const parsed = parseAtUri(uri);
      if (parsed) {
        did = parsed.did;
        rkey = parsed.rkey;
      }
    }

    if (!did || !rkey) {
      this._state = { kind: 'error', reason: 'Missing did/rkey in URL' };
      return;
    }

    try {
      const agent = await this._resolveAgent(did);
      const fetched: FetchedRecipeOk = await fetchRecipe(agent, did, rkey);
      const recipe = fetched.recipe;
      const scheduleRelaxed = computeSchedule(recipe, 'relaxed');
      const scheduleOptimized = computeSchedule(recipe, 'optimized');
      this._state = { kind: 'ready', recipe, scheduleRelaxed, scheduleOptimized };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      if (/record not found|RecordNotFound|could not locate record/i.test(msg)) {
        this._state = { kind: 'not-found' };
      } else if (/invalid|schema|lexicon|parse|unknown/i.test(msg)) {
        this._state = { kind: 'malformed', reason: msg };
      } else {
        this._state = { kind: 'error', reason: msg };
      }
    }
  }

  private async _resolveAgent(did: string): Promise<Agent> {
    try {
      const { client } = await getOAuthClient();
      const session: SessionState = await loadSession(client);
      if (session.kind === 'authenticated' && session.did === did) {
        return session.agent;
      }
    } catch {
      // Fall through to unauthenticated path.
    }
    return agentForDid(did);
  }

  override render() {
    const s = this._state;
    switch (s.kind) {
      case 'idle':
      case 'loading':
        return html`<div class="placeholder">Loading recipe…</div>`;
      case 'not-found':
        return html`<div class="placeholder">
          Recipe not found. It may have been deleted or the link is incorrect.
          <br /><a href="../">Back to catalog</a>
        </div>`;
      case 'malformed':
        return html`<div class="placeholder error">
          This record could not be decoded as a recipe.
          <br /><small>${s.reason}</small>
        </div>`;
      case 'error':
        return html`<div class="placeholder error">
          Couldn't load recipe: ${s.reason}
          <br /><small>This page requires a working network connection.</small>
          <br /><a href="../">Back to catalog</a>
        </div>`;
      case 'ready':
        return html`
          <recipe-page
            .recipe=${s.recipe}
            .scheduleRelaxed=${s.scheduleRelaxed}
            .scheduleOptimized=${s.scheduleOptimized}
            .i18n=${this._i18n}
          ></recipe-page>
        `;
    }
  }
}

const AT_URI_REGEX = /^at:\/\/([^/]+)\/[^/]+\/(.+)$/;

function parseAtUri(uri: string): { did: string; rkey: string } | null {
  const match = AT_URI_REGEX.exec(uri);
  if (!match) return null;
  return { did: match[1]!, rkey: match[2]! };
}

declare global {
  interface HTMLElementTagNameMap {
    'pds-recipe-shell': PdsRecipeShell;
  }
}
