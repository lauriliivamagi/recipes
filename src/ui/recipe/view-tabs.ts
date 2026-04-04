import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { designTokens, resetStyles, baseStyles } from '../shared/styles.js';

@customElement('view-tabs')
export class ViewTabs extends LitElement {
  static override styles = [
    designTokens,
    resetStyles,
    baseStyles,
    css`
      :host { display: block; }

      .view-tabs {
        display: flex;
        margin: 0 16px 16px;
        background: var(--card);
        border-radius: var(--radius);
        overflow: hidden;
      }

      .view-tab {
        flex: 1;
        padding: 12px 8px;
        border: none;
        background: transparent;
        color: var(--text-dim);
        font-size: 0.9rem;
        font-weight: 600;
        cursor: pointer;
        transition: background var(--transition), color var(--transition);
        min-height: var(--touch-min);
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 6px;
        font-family: inherit;
      }

      .view-tab.active {
        background: var(--accent-teal);
        color: #111;
      }

      @media (min-width: 600px) {
        .view-tabs {
          max-width: 640px;
          margin-left: auto;
          margin-right: auto;
        }
      }
    `,
  ];

  @property() activeView: 'overview' | 'cooking' = 'overview';
  @property() overviewLabel = 'Overview';
  @property() cookingLabel = 'Cooking';

  private _switchView(view: 'overview' | 'cooking') {
    this.dispatchEvent(
      new CustomEvent('switch-view', {
        detail: { view },
        bubbles: true,
        composed: true,
      }),
    );
  }

  override render() {
    return html`
      <div class="view-tabs" role="tablist">
        <button
          class="view-tab ${this.activeView === 'overview' ? 'active' : ''}"
          role="tab"
          aria-selected=${this.activeView === 'overview'}
          @click=${() => this._switchView('overview')}
        >${this.overviewLabel}</button>
        <button
          class="view-tab ${this.activeView === 'cooking' ? 'active' : ''}"
          role="tab"
          aria-selected=${this.activeView === 'cooking'}
          @click=${() => this._switchView('cooking')}
        >${this.cookingLabel}</button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'view-tabs': ViewTabs;
  }
}
