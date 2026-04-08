import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { designTokens, resetStyles, baseStyles } from '../shared/styles.js';

@customElement('nav-buttons')
export class NavButtons extends LitElement {
  static override styles = [
    designTokens,
    resetStyles,
    baseStyles,
    css`
      :host { display: block; }

      .nav-buttons {
        position: fixed;
        bottom: 0;
        left: 0;
        right: 0;
        display: flex;
        gap: 1px;
        background: rgba(26, 26, 46, 0.85);
        backdrop-filter: blur(12px);
        -webkit-backdrop-filter: blur(12px);
        padding: 8px 16px;
        padding-bottom: max(8px, env(safe-area-inset-bottom));
        z-index: 100;
      }

      .nav-btn {
        flex: 1;
        min-height: var(--touch-min);
        padding: 12px 16px;
        border: none;
        border-radius: var(--radius-sm);
        font-size: 1rem;
        font-weight: 600;
        cursor: pointer;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
        transition: background var(--transition), transform var(--transition);
        font-family: inherit;
      }

      .nav-btn:active { transform: scale(0.97); }

      .nav-btn-back {
        background: var(--card);
        color: var(--text);
      }

      .nav-btn-next {
        background: var(--accent-teal);
        color: #111;
      }

      .nav-btn:disabled {
        opacity: 0.3;
        cursor: default;
      }

      .nav-btn:disabled:active { transform: none; }

      .step-counter {
        position: absolute;
        top: -24px;
        left: 50%;
        transform: translateX(-50%);
        font-size: var(--text-xs);
        font-weight: 600;
        color: var(--text-muted);
        white-space: nowrap;
      }

      .nav-buttons-wrapper {
        position: relative;
      }

      @media (min-width: 600px) {
        .nav-buttons {
          max-width: 672px;
          margin: 0 auto;
          padding-left: 16px;
          padding-right: 16px;
        }
      }
    `,
  ];

  @property({ type: Number }) accessor currentStep = 0;
  @property({ type: Number }) accessor totalSteps = 0;
  @property() accessor backLabel = 'Back';
  @property() accessor nextLabel = 'Next';

  private _handlePrev() {
    this.dispatchEvent(new CustomEvent('prev-step', {
      bubbles: true,
      composed: true,
    }));
  }

  private _handleNext() {
    this.dispatchEvent(new CustomEvent('next-step', {
      bubbles: true,
      composed: true,
    }));
  }

  override render() {
    const isFirst = this.currentStep <= 0;
    const isLast = this.currentStep >= this.totalSteps - 1;
    const isAlmostDone = this.currentStep === this.totalSteps - 2 && this.totalSteps > 2;

    const nextText = isLast ? 'Finish' : isAlmostDone ? 'Almost done' : this.nextLabel;

    return html`
      <div class="nav-buttons">
        <button
          class="nav-btn nav-btn-back"
          ?disabled=${isFirst}
          @click=${this._handlePrev}
        >
          &larr; ${this.backLabel}
        </button>
        <button
          class="nav-btn nav-btn-next"
          ?disabled=${this.currentStep >= this.totalSteps}
          @click=${this._handleNext}
        >
          ${nextText} &rarr;
        </button>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'nav-buttons': NavButtons;
  }
}
