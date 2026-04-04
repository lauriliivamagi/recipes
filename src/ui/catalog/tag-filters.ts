import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { designTokens, resetStyles, baseStyles } from '../shared/styles.js';

@customElement('tag-filters')
export class TagFilters extends LitElement {
  static override styles = [
    designTokens,
    resetStyles,
    baseStyles,
    css`
      :host {
        display: flex;
        flex-wrap: wrap;
        gap: 0.375rem;
        margin-bottom: 1.25rem;
      }

      .tag-pill {
        display: inline-block;
        padding: 0.25rem 0.625rem;
        border-radius: 999px;
        font-size: 0.75rem;
        font-weight: 500;
        cursor: pointer;
        border: 1px solid #3a3a5a;
        background: var(--card);
        color: #aaa;
        transition: all var(--transition);
        user-select: none;
      }

      .tag-pill:hover {
        border-color: var(--accent-teal);
        color: var(--text);
      }

      .tag-pill.active {
        background: var(--accent-teal);
        color: var(--bg);
        border-color: var(--accent-teal);
        font-weight: 600;
      }
    `,
  ];

  @property({ type: Array }) accessor tags: string[] = [];

  @property({ type: Array, attribute: 'active-tags' }) accessor activeTags: string[] = [];

  private _onTagClick(tag: string) {
    this.dispatchEvent(
      new CustomEvent('tag-toggle', {
        detail: tag,
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`
      ${this.tags.map(
        (tag) => html`
          <span
            class="tag-pill ${this.activeTags.includes(tag) ? 'active' : ''}"
            @click=${() => this._onTagClick(tag)}
          >
            ${tag}
          </span>
        `,
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'tag-filters': TagFilters;
  }
}
