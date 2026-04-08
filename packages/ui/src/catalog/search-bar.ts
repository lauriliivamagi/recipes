import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { designTokens, resetStyles, baseStyles } from '../shared/styles.js';

@customElement('search-bar')
export class SearchBar extends LitElement {
  static override styles = [
    designTokens,
    resetStyles,
    baseStyles,
    css`
      :host {
        display: block;
        margin-bottom: 1.5rem;
      }

      input {
        width: 100%;
        padding: 0.625rem 1rem;
        border-radius: var(--radius-sm);
        border: 1px solid rgba(255, 255, 255, 0.1);
        background: var(--card);
        color: var(--text);
        font-size: var(--text-base);
        font-family: inherit;
        outline: none;
        transition: border-color var(--transition);
      }

      input::placeholder {
        color: var(--text-muted);
      }

      input:focus {
        border-color: var(--accent-teal);
      }
    `,
  ];

  @property({ type: String }) accessor placeholder = 'Search recipes...';

  private _onInput(e: Event) {
    const input = e.target as HTMLInputElement;
    this.dispatchEvent(
      new CustomEvent('search', {
        detail: input.value,
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`
      <input
        type="text"
        .placeholder=${this.placeholder}
        @input=${this._onInput}
      />
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'search-bar': SearchBar;
  }
}
