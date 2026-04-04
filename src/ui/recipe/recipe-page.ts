import { LitElement, html, css, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { createActor, type Actor } from 'xstate';
import { recipeMachine } from '../state/recipe-machine.js';
import type { RecipeContext } from '../state/recipe-machine.js';
import type { Recipe } from '../../domain/recipe/types.js';
import type { Phase, ScheduleMode } from '../../domain/schedule/types.js';
import { designTokens, resetStyles, baseStyles } from '../shared/styles.js';
import './recipe-header.js';
import './servings-adjuster.js';
import './view-tabs.js';
import '../overview/overview-view.js';

interface WindowGlobals {
  RECIPE: Recipe;
  I18N: Record<string, any>;
  SCHEDULE_RELAXED: Phase[];
  SCHEDULE_OPTIMIZED: Phase[];
}

@customElement('recipe-page')
export class RecipePage extends LitElement {
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

      .cooking-placeholder {
        margin: 16px;
        padding: 24px;
        background: var(--card);
        border-radius: var(--radius);
        text-align: center;
        color: var(--text-dim);
        font-size: var(--text-base);
      }
    `,
  ];

  private _actor!: Actor<typeof recipeMachine>;

  @state() private _snapshot: { context: RecipeContext; value: string } | null = null;

  private get _recipe(): Recipe | null {
    return (window as unknown as WindowGlobals).RECIPE ?? null;
  }

  private get _i18n(): Record<string, any> {
    return (window as unknown as WindowGlobals).I18N ?? {};
  }

  private get _scheduleRelaxed(): Phase[] {
    return (window as unknown as WindowGlobals).SCHEDULE_RELAXED ?? [];
  }

  private get _scheduleOptimized(): Phase[] {
    return (window as unknown as WindowGlobals).SCHEDULE_OPTIMIZED ?? [];
  }

  override connectedCallback() {
    super.connectedCallback();

    const recipe = this._recipe;
    if (!recipe) return;

    const totalSteps = this._scheduleRelaxed.reduce(
      (sum, phase) => sum + phase.operations.length,
      0,
    );

    this._actor = createActor(recipeMachine, {
      input: {
        recipe,
        scheduleModes: {
          relaxed: this._scheduleRelaxed,
          optimized: this._scheduleOptimized,
        },
        mode: 'relaxed' as ScheduleMode,
        servings: recipe.meta.servings,
        originalServings: recipe.meta.servings,
        totalSteps,
      },
    });

    this._actor.subscribe(snapshot => {
      this._snapshot = {
        context: snapshot.context,
        value: snapshot.value as string,
      };
    });

    this._actor.start();
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    this._actor?.stop();
  }

  private _onAdjustServings(e: CustomEvent<{ delta: number }>) {
    this._actor.send({ type: 'ADJUST_SERVINGS', delta: e.detail.delta });
  }

  private _onSwitchView(e: CustomEvent<{ view: 'overview' | 'cooking' }>) {
    this._actor.send({ type: 'SWITCH_VIEW', view: e.detail.view });
  }

  private _onSetMode(e: CustomEvent<{ mode: ScheduleMode }>) {
    this._actor.send({ type: 'SET_MODE', mode: e.detail.mode });
  }

  override render() {
    if (!this._snapshot || !this._recipe) {
      return html`<div class="cooking-placeholder">Loading recipe...</div>`;
    }

    const ctx = this._snapshot.context;
    const activeView = this._snapshot.value as 'overview' | 'cooking';
    const scaleFactor = ctx.servings / ctx.originalServings;
    const phases = ctx.scheduleModes[ctx.mode];

    return html`
      <recipe-header
        .title=${ctx.recipe.meta.title}
        .difficulty=${ctx.recipe.meta.difficulty}
        .totalTime=${ctx.recipe.meta.totalTime}
        .mode=${ctx.mode}
        .tags=${ctx.recipe.meta.tags}
        .servings=${ctx.servings}
      ></recipe-header>

      <servings-adjuster
        .servings=${ctx.servings}
        .label=${this._i18n.servings ?? 'Servings'}
        @adjust-servings=${this._onAdjustServings}
      ></servings-adjuster>

      <view-tabs
        .activeView=${activeView}
        .overviewLabel=${this._i18n.overview ?? 'Overview'}
        .cookingLabel=${this._i18n.cooking ?? 'Cooking'}
        @switch-view=${this._onSwitchView}
      ></view-tabs>

      ${activeView === 'overview'
        ? html`
            <overview-view
              .phases=${phases}
              .equipment=${ctx.recipe.equipment}
              .mode=${ctx.mode}
              .scaleFactor=${scaleFactor}
              .i18n=${this._i18n}
              @set-mode=${this._onSetMode}
            ></overview-view>
          `
        : html`<div class="cooking-placeholder">Cooking view placeholder</div>`}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'recipe-page': RecipePage;
  }
}
