import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { designTokens, resetStyles, baseStyles } from '../shared/styles.js';
import type { CatalogRecipe } from '../../domain/catalog/types.js';

@customElement('recipe-card')
export class RecipeCard extends LitElement {
  static override styles = [
    designTokens,
    resetStyles,
    baseStyles,
    css`
      :host {
        display: block;
        opacity: 1;
        transform: translateY(0);
        transition:
          opacity 0.3s ease calc(var(--index, 0) * 50ms),
          transform 0.3s ease calc(var(--index, 0) * 50ms);
      }

      @starting-style {
        :host {
          opacity: 0;
          transform: translateY(1rem);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        :host { transition: none; }
      }

      a {
        background: var(--card);
        border-radius: 10px;
        padding: 1.125rem;
        text-decoration: none;
        color: inherit;
        display: flex;
        flex-direction: column;
        gap: 0.625rem;
        transition: transform 0.15s, box-shadow 0.15s;
        border: 1px solid transparent;
      }

      a:hover {
        transform: translateY(-3px);
        box-shadow: 0 6px 20px rgba(0, 0, 0, 0.3);
        border-color: rgba(255, 255, 255, 0.1);
      }

      h2 {
        font-size: var(--text-base);
        font-weight: 600;
        color: var(--text);
        line-height: 1.3;
      }

      .card-tags {
        display: flex;
        flex-wrap: wrap;
        gap: 0.25rem;
      }

      .card-tag {
        font-size: var(--text-xs);
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        background: rgba(78, 205, 196, 0.12);
        color: var(--accent-teal);
      }

      .card-meta {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 0.5rem;
        margin-top: auto;
        font-size: var(--text-sm);
        color: var(--text-dim);
      }

      .badge {
        display: inline-block;
        padding: 0.125rem 0.5rem;
        border-radius: 999px;
        font-size: var(--text-xs);
        font-weight: 600;
        text-transform: capitalize;
      }

      .badge-easy {
        background: rgba(76, 175, 80, 0.18);
        color: #66bb6a;
      }

      .badge-medium {
        background: rgba(255, 152, 0, 0.18);
        color: #ffa726;
      }

      .badge-hard {
        background: rgba(244, 67, 54, 0.18);
        color: #ef5350;
      }

      .meta-sep {
        color: var(--text-muted);
      }
    `,
  ];

  @property({ type: Object }) accessor recipe: CatalogRecipe | undefined;

  override render() {
    const r = this.recipe;
    if (r == null) return nothing;

    const timeSeconds = r.totalTime?.optimized?.min || r.totalTime?.relaxed?.min || 0;
    const timeValue = timeSeconds > 0 ? Math.round(timeSeconds / 60) : 0;

    return html`
      <a href=${r.url || '#'}>
        <h2>${r.title}</h2>

        ${r.tags?.length
          ? html`
              <div class="card-tags">
                ${r.tags.map(
                  (t) => html`<span class="card-tag">${t}</span>`,
                )}
              </div>
            `
          : nothing}

        <div class="card-meta">
          ${r.difficulty
            ? html`<span class="badge badge-${r.difficulty}"
                >${r.difficulty}</span
              >`
            : nothing}
          ${r.difficulty && timeValue
            ? html`<span class="meta-sep">&middot;</span>`
            : nothing}
          ${timeValue
            ? html`<span>${timeValue} min</span>`
            : nothing}
          ${(r.difficulty || timeValue) && r.servings
            ? html`<span class="meta-sep">&middot;</span>`
            : nothing}
          ${r.servings
            ? html`<span>${r.servings} servings</span>`
            : nothing}
        </div>
      </a>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'recipe-card': RecipeCard;
  }
}
