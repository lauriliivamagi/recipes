import { LitElement, html, css } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { designTokens, resetStyles, baseStyles } from '../shared/styles.js';
import type { Phase, ScheduleMode } from '@recipe/domain/schedule/types.js';
import type { Equipment } from '@recipe/domain/recipe/types.js';
import './mode-toggle.js';
import './equipment-summary.js';
import './phase-list.js';

@customElement('overview-view')
export class OverviewView extends LitElement {
  static override styles = [
    designTokens,
    resetStyles,
    baseStyles,
    css`
      :host { display: block; }

      .overview-content {
        opacity: 1;
        transform: translateY(0);
        transition: opacity 0.3s ease, transform 0.3s ease;
        view-transition-name: overview-content;
      }

      @starting-style {
        .overview-content {
          opacity: 0;
          transform: translateY(0.5rem);
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .overview-content { transition: none; }
      }
    `,
  ];

  @property({ type: Array }) accessor phases: Phase[] = [];
  @property({ type: Array }) accessor equipment: Equipment[] = [];
  @property() accessor mode: ScheduleMode = 'relaxed';
  @property({ type: Object }) accessor i18n: Record<string, any> = {};

  override render() {
    const modeLabels = {
      relaxed: this.i18n?.relaxed ?? 'Relaxed',
      optimized: this.i18n?.optimized ?? 'Optimized',
    };
    const equipmentLabel = this.i18n?.equipment ?? 'Equipment';

    return html`
      <div class="overview-content">
        <mode-toggle
          .mode=${this.mode}
          .labels=${modeLabels}
        ></mode-toggle>
        <equipment-summary
          .equipment=${this.equipment}
          .label=${equipmentLabel}
        ></equipment-summary>
        <phase-list
          .phases=${this.phases}
        ></phase-list>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'overview-view': OverviewView;
  }
}
