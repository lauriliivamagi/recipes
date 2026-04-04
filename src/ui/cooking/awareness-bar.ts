import { LitElement, html, css, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { designTokens, resetStyles, baseStyles } from '../shared/styles.js';
import { formatTime } from '../../domain/cooking/timer.js';

interface TimerPill {
  opId: string;
  remaining: number;
  action: string;
}

@customElement('awareness-bar')
export class AwarenessBar extends LitElement {
  static override styles = [
    designTokens,
    resetStyles,
    baseStyles,
    css`
      :host { display: block; }

      .awareness-bar {
        padding: 8px 16px;
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
        min-height: 0;
      }

      .awareness-bar:empty { display: none; }

      .awareness-pill {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 6px 12px;
        background: var(--accent-purple);
        border-radius: 20px;
        font-size: 0.8rem;
        font-weight: 500;
        color: #fff;
        cursor: pointer;
        transition: transform var(--transition);
        animation: pillPulse 2s ease-in-out infinite;
      }

      .awareness-pill.done {
        background: var(--success);
        animation: none;
      }

      @keyframes pillPulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.8; }
      }
    `,
  ];

  @property({ type: Array }) accessor timers: TimerPill[] = [];

  override render() {
    if (!this.timers || this.timers.length === 0) return nothing;

    return html`
      <div class="awareness-bar">
        ${this.timers.map(t => html`
          <span class="awareness-pill ${t.remaining <= 0 ? 'done' : ''}">
            ${t.action} \u2014 ${t.remaining > 0 ? formatTime(t.remaining) : 'Done!'}
          </span>
        `)}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'awareness-bar': AwarenessBar;
  }
}
