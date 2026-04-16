import { LitElement, html, css } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { when } from 'lit/directives/when.js';
import { createActor } from 'xstate';
import { Agent } from '@atproto/api';
import {
  agentForDid,
  fetchAllRecipes,
  loadSession,
  resolveHandle,
  subscribeToSessionEvents,
  type FetchedRecipe,
  type SessionState,
} from '@recipe/atproto';
import { designTokens, resetStyles, baseStyles } from '../shared/styles.js';
import { catalogMachine } from '../state/catalog-machine.js';
import { ActorController } from '../controllers/actor-controller.js';
import type { CatalogRecipe } from '@recipe/domain/catalog/types.js';
import type { Recipe } from '@recipe/domain/recipe/types.js';
import { getOAuthClient } from '../auth/oauth-client.js';

import './search-bar.js';
import './tag-filters.js';
import './recipe-card.js';
import '../auth/hob-atproto-login.js';

interface I18NLabels {
  allRecipes?: string;
  myRecipes?: string;
  searchPlaceholder?: string;
  noResults?: string;
  signInToSeeRecipes?: string;
  minutes?: string;
  servings?: string;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'loaded' }
  | { kind: 'empty' }
  | { kind: 'unauthenticated' }
  | { kind: 'error'; reason: string };

const DEMO_HANDLE: string | undefined =
  (import.meta as any).env?.VITE_HOB_DEMO_HANDLE ?? 'hob.social';
const HANDLE_RESOLVER = 'https://bsky.social';

@customElement('catalog-page')
export class CatalogPage extends LitElement {
  static override styles = [
    designTokens,
    resetStyles,
    baseStyles,
    css`
      :host {
        display: block;
        background: var(--bg);
        min-height: 100dvh;
      }

      .container {
        max-width: 960px;
        margin: 0 auto;
        padding: 2rem 1.25rem;
      }

      header {
        text-align: center;
        margin-bottom: 2rem;
      }

      header h1 {
        font-size: var(--text-2xl);
        font-weight: 700;
        color: var(--accent-orange);
        margin-bottom: 0.25rem;
      }

      .recipe-count {
        font-size: var(--text-sm);
        color: var(--text-dim);
      }

      search-bar {
        margin-bottom: 1rem;
      }

      tag-filters {
        margin-bottom: 2rem;
      }

      .recipe-grid {
        display: grid;
        grid-template-columns: 1fr;
        gap: 1.25rem;
      }

      @media (min-width: 520px) {
        .recipe-grid {
          grid-template-columns: repeat(2, 1fr);
        }
      }

      @media (min-width: 800px) {
        .recipe-grid {
          grid-template-columns: repeat(3, 1fr);
        }
      }

      .empty-state {
        text-align: center;
        padding: 3rem 1rem;
        color: var(--text-muted);
        font-size: var(--text-base);
        grid-column: 1 / -1;
      }

      .error-banner {
        margin: 1rem 0;
        padding: 0.75rem 1rem;
        background: rgba(244, 67, 54, 0.12);
        color: var(--danger);
        border-radius: var(--radius-sm);
        font-size: var(--text-sm);
      }
    `,
  ];

  private _ctrl?: ActorController<typeof catalogMachine>;

  @state() accessor _labels: I18NLabels = {};
  @state() accessor _loadState: LoadState = { kind: 'loading' };

  override connectedCallback() {
    super.connectedCallback();

    const i18n = (window as any).I18N ?? {};
    this._labels = i18n.labels ?? {};

    const actor = createActor(catalogMachine, { input: { recipes: [] } });
    this._ctrl = new ActorController(this, actor);
    actor.start();

    void this._loadRecipes();

    void this._subscribeSession();
  }

  private async _subscribeSession() {
    try {
      const { events } = await getOAuthClient();
      subscribeToSessionEvents(events, () => {
        void this._loadRecipes();
      });
    } catch {
      // OAuth client unavailable — no-op.
    }
  }

  private async _loadRecipes() {
    this._loadState = { kind: 'loading' };

    try {
      const { client } = await getOAuthClient();
      const session: SessionState = await loadSession(client);

      let did: string | undefined;
      let agent;

      if (session.kind === 'authenticated') {
        did = session.did;
        agent = session.agent;
      } else if (DEMO_HANDLE) {
        const publicAgent = new Agent(HANDLE_RESOLVER);
        did = await resolveHandle(publicAgent, DEMO_HANDLE);
        agent = await agentForDid(did);
      } else {
        this._loadState = { kind: 'unauthenticated' };
        return;
      }

      const fetched = await fetchAllRecipes(agent, did);
      const catalogRecipes = fetched
        .filter((r): r is Extract<FetchedRecipe, { recipe: Recipe }> => 'recipe' in r)
        .map((r) => toCatalogRecipe(r.recipe, did!, r.rkey));

      this._ctrl?.send({ type: 'SET_RECIPES', recipes: catalogRecipes });
      this._loadState = catalogRecipes.length === 0 ? { kind: 'empty' } : { kind: 'loaded' };
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this._loadState = { kind: 'error', reason: msg };
    }
  }

  private get _allTags(): string[] {
    if (!this._ctrl) return [];
    const tagSet = new Set<string>();
    for (const r of this._ctrl.snapshot.context.recipes) {
      for (const t of r.tags ?? []) {
        tagSet.add(t);
      }
    }
    return [...tagSet].sort();
  }

  private _onSearch(e: CustomEvent<string>) {
    this._ctrl?.send({ type: 'SEARCH', query: e.detail });
  }

  private _onTagToggle(e: CustomEvent<string>) {
    this._ctrl?.send({ type: 'TAG_TOGGLE', tag: e.detail });
  }

  override render() {
    if (!this._ctrl) return html``;

    const ctx = this._ctrl.snapshot.context;
    const filtered = ctx.filteredRecipes;
    const countLabel =
      filtered.length === 1 ? '1 recipe' : `${filtered.length} recipes`;

    return html`
      <div class="container">
        <header>
          <h1>${this._labels.allRecipes ?? 'All Recipes'}</h1>
          <div class="recipe-count">${countLabel}</div>
          <div style="margin-top: 1rem;">
            <hob-atproto-login></hob-atproto-login>
          </div>
        </header>

        ${when(
          this._loadState.kind === 'error',
          () => html`<div class="error-banner">
            Couldn't load recipes: ${(this._loadState as { reason: string }).reason}
          </div>`,
        )}

        <search-bar
          .placeholder=${this._labels.searchPlaceholder ?? 'Search recipes...'}
          @search=${this._onSearch}
        ></search-bar>

        <tag-filters
          .tags=${this._allTags}
          .activeTags=${ctx.activeTags}
          @tag-toggle=${this._onTagToggle}
        ></tag-filters>

        <div class="recipe-grid">
          ${this._renderBody(filtered)}
        </div>
      </div>
    `;
  }

  private _renderBody(filtered: CatalogRecipe[]) {
    if (this._loadState.kind === 'loading') {
      return html`<div class="empty-state">Loading recipes…</div>`;
    }
    if (this._loadState.kind === 'unauthenticated') {
      return html`<div class="empty-state">
        ${this._labels.signInToSeeRecipes ??
        'Sign in with Bluesky to see your recipes.'}
      </div>`;
    }
    if (filtered.length === 0) {
      return html`<div class="empty-state">
        ${this._loadState.kind === 'empty'
          ? "You haven't imported any recipes yet. Install the Chrome extension to get started."
          : (this._labels.noResults ?? 'No recipes found')}
      </div>`;
    }
    return repeat(
      filtered,
      (r) => `${r.did ?? 'local'}:${r.slug}`,
      (r, i) => html`<recipe-card .recipe=${r} style="--index: ${i}"></recipe-card>`,
    );
  }
}

function toCatalogRecipe(recipe: Recipe, did: string, rkey: string): CatalogRecipe {
  return {
    title: recipe.meta.title,
    slug: recipe.meta.slug,
    category: recipe.meta.tags[0] ?? 'recipes',
    tags: [...recipe.meta.tags],
    difficulty: recipe.meta.difficulty,
    totalTime: {
      relaxed: { ...recipe.meta.totalTime.relaxed },
      optimized: { ...recipe.meta.totalTime.optimized },
    },
    servings: recipe.meta.servings,
    language: recipe.meta.language,
    url: `/r/?did=${encodeURIComponent(did)}&rkey=${encodeURIComponent(rkey)}`,
    did,
    rkey,
    source: 'pds',
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'catalog-page': CatalogPage;
  }
}
